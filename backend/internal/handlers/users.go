package handlers

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/MrFruchard/pulse/backend/internal/middleware"
	"github.com/MrFruchard/pulse/backend/internal/models"
	"github.com/MrFruchard/pulse/backend/internal/services"
)

func GetProfileHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		pseudo := chi.URLParam(r, "pseudo")

		var user models.User
		if err := db.QueryRowx(`
			SELECT id, pseudo, avatar_url, bio, role, streak, status, created_at, updated_at
			FROM users WHERE pseudo = $1`, pseudo,
		).StructScan(&user); err != nil {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}

		var followerCount, followingCount int
		db.Get(&followerCount, `SELECT COUNT(*) FROM follows WHERE following_id = $1`, user.ID)
		db.Get(&followingCount, `SELECT COUNT(*) FROM follows WHERE follower_id = $1`, user.ID)

		var userPosts []models.Post
		if err := db.Select(&userPosts, `
			SELECT id, user_id, session_id, content, intention, image_url, is_flagged, created_at
			FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, user.ID,
		); err != nil {
			userPosts = []models.Post{}
		}

		respond(w, http.StatusOK, map[string]any{
			"user":           user,
			"followerCount":  followerCount,
			"followingCount": followingCount,
			"posts":          userPosts,
		})
	}
}

func SearchUsersHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := strings.TrimSpace(r.URL.Query().Get("q"))
		if len(q) < 2 {
			respondError(w, http.StatusUnprocessableEntity, "query must be at least 2 characters")
			return
		}

		type result struct {
			ID        uuid.UUID `db:"id"         json:"id"`
			Pseudo    string    `db:"pseudo"     json:"pseudo"`
			AvatarURL *string   `db:"avatar_url" json:"avatarUrl"`
			Streak    int       `db:"streak"     json:"streak"`
			Status    string    `db:"status"     json:"status"`
		}

		var users []result
		if err := db.Select(&users, `
			SELECT id, pseudo, avatar_url, streak, status
			FROM users
			WHERE pseudo ILIKE $1 AND status != 'suspended'
			ORDER BY pseudo ASC
			LIMIT 20`, "%"+q+"%",
		); err != nil {
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		if users == nil {
			users = []result{}
		}

		respond(w, http.StatusOK, map[string]any{"users": users})
	}
}

func FollowHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)
		targetID := chi.URLParam(r, "id")

		targetUUID, err := uuid.Parse(targetID)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid user id")
			return
		}

		if targetUUID == claims.UserID {
			respondError(w, http.StatusBadRequest, "cannot follow yourself")
			return
		}

		var count int
		if err := db.Get(&count, `SELECT COUNT(*) FROM users WHERE id = $1`, targetID); err != nil || count == 0 {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}

		_, err = db.Exec(`
			INSERT INTO follows (follower_id, following_id)
			VALUES ($1, $2)`, claims.UserID, targetID,
		)
		if err != nil {
			if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique") {
				respondError(w, http.StatusConflict, "already following this user")
				return
			}
			slog.Error("follow", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		slog.Info("follow created", "follower", claims.UserID, "following", targetID)
		w.WriteHeader(http.StatusCreated)
	}
}

func UnfollowHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)
		targetID := chi.URLParam(r, "id")

		result, err := db.Exec(`
			DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
			claims.UserID, targetID,
		)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		rows, _ := result.RowsAffected()
		if rows == 0 {
			respondError(w, http.StatusNotFound, "follow not found")
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}

type followerRow struct {
	ID        uuid.UUID `db:"id"         json:"id"`
	Pseudo    string    `db:"pseudo"     json:"pseudo"`
	AvatarURL *string   `db:"avatar_url" json:"avatarUrl"`
	Streak    int       `db:"streak"     json:"streak"`
}

func GetFollowersHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := chi.URLParam(r, "id")

		var followers []followerRow
		if err := db.Select(&followers, `
			SELECT u.id, u.pseudo, u.avatar_url, u.streak
			FROM follows f
			JOIN users u ON u.id = f.follower_id
			WHERE f.following_id = $1
			ORDER BY f.created_at DESC`, userID,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		if followers == nil {
			followers = []followerRow{}
		}
		respond(w, http.StatusOK, map[string]any{"followers": followers})
	}
}

func GetFollowingHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := chi.URLParam(r, "id")

		var following []followerRow
		if err := db.Select(&following, `
			SELECT u.id, u.pseudo, u.avatar_url, u.streak
			FROM follows f
			JOIN users u ON u.id = f.following_id
			WHERE f.follower_id = $1
			ORDER BY f.created_at DESC`, userID,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		if following == nil {
			following = []followerRow{}
		}
		respond(w, http.StatusOK, map[string]any{"following": following})
	}
}
