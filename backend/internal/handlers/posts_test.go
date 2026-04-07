package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/MrFruchard/pulse/backend/internal/handlers"
	"github.com/MrFruchard/pulse/backend/internal/middleware"
	"github.com/MrFruchard/pulse/backend/internal/models"
	"github.com/MrFruchard/pulse/backend/internal/services"
	"github.com/MrFruchard/pulse/backend/internal/testutil"
	"github.com/MrFruchard/pulse/backend/internal/websocket"
)

// Créer un user en DB et retourner les claims
func createUser(t *testing.T, db interface {
	Exec(query string, args ...interface{}) (interface{ RowsAffected() (int64, error) }, error)
	QueryRowx(query string, args ...interface{}) interface{ StructScan(dest interface{}) error }
}, email, pseudo string) *services.Claims {
	t.Helper()
	return nil // sera implémenté via sqlx directement dans les tests
}

func withClaims(r *http.Request, userID uuid.UUID, role models.UserRole) *http.Request {
	claims := &services.Claims{UserID: userID, Role: role}
	return r.WithContext(context.WithValue(r.Context(), middleware.ClaimsKey, claims))
}

func setupUser(t *testing.T, db interface {
	QueryRowx(string, ...any) interface{ Scan(...any) error }
}, email, pseudo string) uuid.UUID {
	t.Helper()
	return uuid.New() // placeholder
}

// TF-13 : POST /api/posts en session active → 201
func TestCreatePost_Valid(t *testing.T) {
	database := testutil.SetupDB(t)
	hub := websocket.NewHub()

	// Insérer un user
	var userID uuid.UUID
	database.QueryRowx(`
		INSERT INTO users (email, password_hash, pseudo)
		VALUES ('poster@pulse.io', '$2a$12$dummy', 'poster')
		RETURNING id`,
	).Scan(&userID)

	// Insérer une session active
	database.Exec(`
		INSERT INTO sessions (opens_at, closes_at, is_active)
		VALUES ($1, $2, true)`,
		time.Now().UTC().Add(-10*time.Minute),
		time.Now().UTC().Add(50*time.Minute),
	)

	b, _ := json.Marshal(map[string]string{"content": "Ma question du jour", "intention": "QUESTION"})
	req := httptest.NewRequest("POST", "/api/posts", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	req = withClaims(req, userID, models.RoleUser)

	w := httptest.NewRecorder()
	handlers.CreatePostHandler(database, hub)(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d — %s", w.Code, w.Body.String())
	}
}

// TF-14 : POST /api/posts hors session → 403
func TestCreatePost_NoSession(t *testing.T) {
	database := testutil.SetupDB(t)
	hub := websocket.NewHub()

	var userID uuid.UUID
	database.QueryRowx(`
		INSERT INTO users (email, password_hash, pseudo)
		VALUES ('nopost@pulse.io', '$2a$12$dummy', 'nopost')
		RETURNING id`,
	).Scan(&userID)

	b, _ := json.Marshal(map[string]string{"content": "Test", "intention": "SHARE"})
	req := httptest.NewRequest("POST", "/api/posts", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	req = withClaims(req, userID, models.RoleUser)

	w := httptest.NewRecorder()
	handlers.CreatePostHandler(database, hub)(w, req)

	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", w.Code)
	}
}

// TF-15 : POST /api/posts déjà posté dans cette session → 409
func TestCreatePost_AlreadyPosted(t *testing.T) {
	database := testutil.SetupDB(t)
	hub := websocket.NewHub()

	var userID uuid.UUID
	database.QueryRowx(`
		INSERT INTO users (email, password_hash, pseudo)
		VALUES ('twice@pulse.io', '$2a$12$dummy', 'twice')
		RETURNING id`,
	).Scan(&userID)

	database.Exec(`
		INSERT INTO sessions (opens_at, closes_at, is_active)
		VALUES ($1, $2, true)`,
		time.Now().UTC().Add(-10*time.Minute),
		time.Now().UTC().Add(50*time.Minute),
	)

	postBody := func() *bytes.Buffer {
		b, _ := json.Marshal(map[string]string{"content": "Mon post", "intention": "SHARE"})
		return bytes.NewBuffer(b)
	}

	handler := handlers.CreatePostHandler(database, hub)

	// Premier post → 201
	req1 := httptest.NewRequest("POST", "/api/posts", postBody())
	req1.Header.Set("Content-Type", "application/json")
	req1 = withClaims(req1, userID, models.RoleUser)
	w1 := httptest.NewRecorder()
	handler(w1, req1)
	if w1.Code != http.StatusCreated {
		t.Fatalf("first post: expected 201, got %d — %s", w1.Code, w1.Body.String())
	}

	// Deuxième post → 409
	req2 := httptest.NewRequest("POST", "/api/posts", postBody())
	req2.Header.Set("Content-Type", "application/json")
	req2 = withClaims(req2, userID, models.RoleUser)
	w2 := httptest.NewRecorder()
	handler(w2, req2)
	if w2.Code != http.StatusConflict {
		t.Fatalf("second post: expected 409, got %d", w2.Code)
	}
}

// TF-17 : POST /api/posts avec contenu vide → 422
func TestCreatePost_EmptyContent(t *testing.T) {
	database := testutil.SetupDB(t)
	hub := websocket.NewHub()

	var userID uuid.UUID
	database.QueryRowx(`
		INSERT INTO users (email, password_hash, pseudo)
		VALUES ('empty@pulse.io', '$2a$12$dummy', 'emptypost')
		RETURNING id`,
	).Scan(&userID)

	database.Exec(`
		INSERT INTO sessions (opens_at, closes_at, is_active)
		VALUES ($1, $2, true)`,
		time.Now().UTC().Add(-5*time.Minute),
		time.Now().UTC().Add(55*time.Minute),
	)

	b, _ := json.Marshal(map[string]string{"content": "", "intention": "QUESTION"})
	req := httptest.NewRequest("POST", "/api/posts", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	req = withClaims(req, userID, models.RoleUser)

	w := httptest.NewRecorder()
	handlers.CreatePostHandler(database, hub)(w, req)

	if w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", w.Code)
	}
}

// TF-18 : POST /api/posts sans intention → 422
func TestCreatePost_NoIntention(t *testing.T) {
	database := testutil.SetupDB(t)
	hub := websocket.NewHub()

	var userID uuid.UUID
	database.QueryRowx(`
		INSERT INTO users (email, password_hash, pseudo)
		VALUES ('noint@pulse.io', '$2a$12$dummy', 'noint')
		RETURNING id`,
	).Scan(&userID)

	database.Exec(`
		INSERT INTO sessions (opens_at, closes_at, is_active)
		VALUES ($1, $2, true)`,
		time.Now().UTC().Add(-5*time.Minute),
		time.Now().UTC().Add(55*time.Minute),
	)

	b, _ := json.Marshal(map[string]string{"content": "Post sans intention"})
	req := httptest.NewRequest("POST", "/api/posts", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	req = withClaims(req, userID, models.RoleUser)

	w := httptest.NewRecorder()
	handlers.CreatePostHandler(database, hub)(w, req)

	if w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", w.Code)
	}
}
