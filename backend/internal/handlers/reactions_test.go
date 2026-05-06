package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/MrFruchard/pulse/backend/internal/handlers"
	"github.com/MrFruchard/pulse/backend/internal/middleware"
	"github.com/MrFruchard/pulse/backend/internal/models"
	"github.com/MrFruchard/pulse/backend/internal/services"
	"github.com/MrFruchard/pulse/backend/internal/testutil"
	"github.com/MrFruchard/pulse/backend/internal/websocket"
)

func setupUserAndPost(t *testing.T, db interface {
	QueryRowx(string, ...any) interface{ Scan(...any) error }
	Exec(string, ...any) (interface{ RowsAffected() (int64, error) }, error)
}, email, pseudo string) (uuid.UUID, uuid.UUID) {
	t.Helper()
	return uuid.New(), uuid.New()
}

func doWithChiParam(handler http.Handler, method, path, paramKey, paramVal string, b *bytes.Buffer, claims *services.Claims) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, b)
	req.Header.Set("Content-Type", "application/json")
	if claims != nil {
		req = req.WithContext(context.WithValue(req.Context(), middleware.ClaimsKey, claims))
	}
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(paramKey, paramVal)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
	return w
}

func TestCreateReaction_Valid(t *testing.T) {
	database := testutil.SetupDB(t)
	hub := websocket.NewHub()

	var authorID, reactorID uuid.UUID
	database.QueryRowx(`INSERT INTO users (email, password_hash, pseudo) VALUES ('author@r.io','$2a$12$x','authorr') RETURNING id`).Scan(&authorID)
	database.QueryRowx(`INSERT INTO users (email, password_hash, pseudo) VALUES ('reactor@r.io','$2a$12$x','reactorr') RETURNING id`).Scan(&reactorID)

	var sessionID uuid.UUID
	database.QueryRowx(`INSERT INTO sessions (opens_at, closes_at, is_active) VALUES ($1,$2,true) RETURNING id`,
		time.Now().UTC().Add(-10*time.Minute), time.Now().UTC().Add(50*time.Minute),
	).Scan(&sessionID)

	var postID uuid.UUID
	database.QueryRowx(`INSERT INTO posts (user_id, session_id, content, intention) VALUES ($1,$2,'Hello','SHARE') RETURNING id`, authorID, sessionID).Scan(&postID)

	b, _ := json.Marshal(map[string]string{"type": "FIRE"})
	claims := &services.Claims{UserID: reactorID, Role: models.RoleUser}
	w := doWithChiParam(handlers.CreateReactionHandler(database, hub), "POST", "/api/posts/"+postID.String()+"/reactions", "id", postID.String(), bytes.NewBuffer(b), claims)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d — %s", w.Code, w.Body.String())
	}

	var count int
	database.QueryRowx(`SELECT COUNT(*) FROM reactions WHERE post_id = $1 AND user_id = $2`, postID, reactorID).Scan(&count)
	if count != 1 {
		t.Fatalf("expected 1 reaction in DB, got %d", count)
	}
}

func TestCreateReaction_Upsert(t *testing.T) {
	database := testutil.SetupDB(t)
	hub := websocket.NewHub()

	var authorID, reactorID uuid.UUID
	database.QueryRowx(`INSERT INTO users (email, password_hash, pseudo) VALUES ('au2@r.io','$2a$12$x','au2') RETURNING id`).Scan(&authorID)
	database.QueryRowx(`INSERT INTO users (email, password_hash, pseudo) VALUES ('re2@r.io','$2a$12$x','re2') RETURNING id`).Scan(&reactorID)

	var sessionID uuid.UUID
	database.QueryRowx(`INSERT INTO sessions (opens_at, closes_at, is_active) VALUES ($1,$2,true) RETURNING id`,
		time.Now().UTC().Add(-10*time.Minute), time.Now().UTC().Add(50*time.Minute),
	).Scan(&sessionID)

	var postID uuid.UUID
	database.QueryRowx(`INSERT INTO posts (user_id, session_id, content, intention) VALUES ($1,$2,'Test','QUESTION') RETURNING id`, authorID, sessionID).Scan(&postID)

	claims := &services.Claims{UserID: reactorID, Role: models.RoleUser}
	handler := handlers.CreateReactionHandler(database, hub)

	// Première réaction : LIKE
	b1, _ := json.Marshal(map[string]string{"type": "LIKE"})
	doWithChiParam(handler, "POST", "/", "id", postID.String(), bytes.NewBuffer(b1), claims)

	// Changement de réaction : FIRE (UPSERT)
	b2, _ := json.Marshal(map[string]string{"type": "FIRE"})
	w := doWithChiParam(handler, "POST", "/", "id", postID.String(), bytes.NewBuffer(b2), claims)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 on upsert, got %d", w.Code)
	}

	// Toujours 1 seule réaction
	var count int
	database.QueryRowx(`SELECT COUNT(*) FROM reactions WHERE post_id = $1 AND user_id = $2`, postID, reactorID).Scan(&count)
	if count != 1 {
		t.Fatalf("expected 1 reaction after upsert, got %d", count)
	}

	// La réaction est bien FIRE
	var reactionType string
	database.QueryRowx(`SELECT type FROM reactions WHERE post_id = $1 AND user_id = $2`, postID, reactorID).Scan(&reactionType)
	if reactionType != "FIRE" {
		t.Fatalf("expected type=FIRE after upsert, got %s", reactionType)
	}
}

func TestCreateReaction_InvalidType(t *testing.T) {
	database := testutil.SetupDB(t)
	hub := websocket.NewHub()

	var userID uuid.UUID
	database.QueryRowx(`INSERT INTO users (email, password_hash, pseudo) VALUES ('inv@r.io','$2a$12$x','invreact') RETURNING id`).Scan(&userID)

	var sessionID uuid.UUID
	database.QueryRowx(`INSERT INTO sessions (opens_at, closes_at, is_active) VALUES ($1,$2,true) RETURNING id`,
		time.Now().UTC().Add(-5*time.Minute), time.Now().UTC().Add(55*time.Minute),
	).Scan(&sessionID)

	var postID uuid.UUID
	database.QueryRowx(`INSERT INTO posts (user_id, session_id, content, intention) VALUES ($1,$2,'Inv','SHARE') RETURNING id`, userID, sessionID).Scan(&postID)

	b, _ := json.Marshal(map[string]string{"type": "INVALID_TYPE"})
	claims := &services.Claims{UserID: userID, Role: models.RoleUser}
	w := doWithChiParam(handlers.CreateReactionHandler(database, hub), "POST", "/", "id", postID.String(), bytes.NewBuffer(b), claims)

	if w.Code != http.StatusBadRequest && w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 400 or 422 for invalid type, got %d", w.Code)
	}
}
