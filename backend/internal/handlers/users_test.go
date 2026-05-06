package handlers_test

import (
	"context"
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
)

func doProfile(handler http.Handler, pseudo string, claims *services.Claims) *httptest.ResponseRecorder {
	req := httptest.NewRequest("GET", "/api/users/"+pseudo, nil)
	if claims != nil {
		req = req.WithContext(context.WithValue(req.Context(), middleware.ClaimsKey, claims))
	}
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("pseudo", pseudo)
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
	return w
}

func TestGetProfile_NotFound(t *testing.T) {
	database := testutil.SetupDB(t)
	w := doProfile(handlers.GetProfileHandler(database), "nobody", nil)
	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", w.Code)
	}
}

func TestGetProfile_WithPosts(t *testing.T) {
	database := testutil.SetupDB(t)

	var userID uuid.UUID
	database.QueryRowx(`INSERT INTO users (email, password_hash, pseudo, bio) VALUES ('profile@p.io','$2a$12$x','profileuser','My bio') RETURNING id`).Scan(&userID)

	var sessionID uuid.UUID
	database.QueryRowx(`INSERT INTO sessions (opens_at, closes_at, is_active) VALUES ($1,$2,false) RETURNING id`,
		time.Now().UTC().Add(-70*time.Minute), time.Now().UTC().Add(-10*time.Minute),
	).Scan(&sessionID)

	database.QueryRowx(`INSERT INTO posts (user_id, session_id, content, intention) VALUES ($1,$2,'Mon post de test','SHARE') RETURNING id`, userID, sessionID)

	w := doProfile(handlers.GetProfileHandler(database), "profileuser", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — %s", w.Code, w.Body.String())
	}

	resp := parseJSON(t, w)
	if resp["user"] == nil {
		t.Fatal("expected user in response")
	}
	posts, ok := resp["posts"].([]any)
	if !ok || len(posts) != 1 {
		t.Fatalf("expected 1 post, got %v", resp["posts"])
	}

	// Vérifier que le champ author est présent (le bug corrigé)
	post := posts[0].(map[string]any)
	if post["author"] == nil {
		t.Fatal("expected author field in post (regression check)")
	}
	author := post["author"].(map[string]any)
	if author["pseudo"] != "profileuser" {
		t.Fatalf("expected author.pseudo=profileuser, got %v", author["pseudo"])
	}
}

func TestFollow_Valid(t *testing.T) {
	database := testutil.SetupDB(t)

	var followerID, followedID uuid.UUID
	database.QueryRowx(`INSERT INTO users (email, password_hash, pseudo) VALUES ('follower@f.io','$2a$12$x','followeruser') RETURNING id`).Scan(&followerID)
	database.QueryRowx(`INSERT INTO users (email, password_hash, pseudo) VALUES ('followed@f.io','$2a$12$x','followeduser') RETURNING id`).Scan(&followedID)

	req := httptest.NewRequest("POST", "/api/users/"+followedID.String()+"/follow", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.ClaimsKey, &services.Claims{UserID: followerID, Role: models.RoleUser}))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", followedID.String())
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	w := httptest.NewRecorder()
	handlers.FollowHandler(database)(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d — %s", w.Code, w.Body.String())
	}

	var count int
	database.QueryRowx(`SELECT COUNT(*) FROM follows WHERE follower_id=$1 AND following_id=$2`, followerID, followedID).Scan(&count)
	if count != 1 {
		t.Fatalf("expected follow record in DB, got %d", count)
	}
}

func TestFollow_CannotFollowSelf(t *testing.T) {
	database := testutil.SetupDB(t)

	var userID uuid.UUID
	database.QueryRowx(`INSERT INTO users (email, password_hash, pseudo) VALUES ('self@f.io','$2a$12$x','selfuser') RETURNING id`).Scan(&userID)

	req := httptest.NewRequest("POST", "/api/users/"+userID.String()+"/follow", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.ClaimsKey, &services.Claims{UserID: userID, Role: models.RoleUser}))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", userID.String())
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	w := httptest.NewRecorder()
	handlers.FollowHandler(database)(w, req)

	if w.Code == http.StatusCreated {
		t.Fatal("expected error when following self, got 201")
	}
}

func TestUnfollow_Valid(t *testing.T) {
	database := testutil.SetupDB(t)

	var followerID, followedID uuid.UUID
	database.QueryRowx(`INSERT INTO users (email, password_hash, pseudo) VALUES ('unf1@f.io','$2a$12$x','unf1') RETURNING id`).Scan(&followerID)
	database.QueryRowx(`INSERT INTO users (email, password_hash, pseudo) VALUES ('unf2@f.io','$2a$12$x','unf2') RETURNING id`).Scan(&followedID)
	database.QueryRowx(`INSERT INTO follows (follower_id, following_id) VALUES ($1,$2)`, followerID, followedID)

	req := httptest.NewRequest("DELETE", "/api/users/"+followedID.String()+"/follow", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.ClaimsKey, &services.Claims{UserID: followerID, Role: models.RoleUser}))
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", followedID.String())
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	w := httptest.NewRecorder()
	handlers.UnfollowHandler(database)(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d — %s", w.Code, w.Body.String())
	}

	var count int
	database.QueryRowx(`SELECT COUNT(*) FROM follows WHERE follower_id=$1 AND following_id=$2`, followerID, followedID).Scan(&count)
	if count != 0 {
		t.Fatal("expected follow record deleted")
	}
}
