package handlers

import (
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/MrFruchard/pulse/backend/internal/middleware"
	"github.com/MrFruchard/pulse/backend/internal/services"
)

type commentResponse struct {
	ID        uuid.UUID `json:"id"`
	PostID    uuid.UUID `json:"postId"    db:"post_id"`
	UserID    uuid.UUID `json:"userId"    db:"user_id"`
	Content   string    `json:"content"   db:"content"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	AuthorPseudo    string  `json:"authorPseudo"    db:"author_pseudo"`
	AuthorAvatarURL *string `json:"authorAvatarUrl" db:"author_avatar_url"`
}

func CreateCommentHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)
		postID := chi.URLParam(r, "id")

		var req struct {
			Content string `json:"content"`
		}
		if err := decodeJSON(r, &req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Content = strings.TrimSpace(req.Content)
		if req.Content == "" {
			respondError(w, http.StatusUnprocessableEntity, "content is required")
			return
		}

		var count int
		if err := db.Get(&count, `SELECT COUNT(*) FROM posts WHERE id = $1`, postID); err != nil || count == 0 {
			respondError(w, http.StatusNotFound, "post not found")
			return
		}

		var comment commentResponse
		err := db.QueryRowx(`
			WITH inserted AS (
				INSERT INTO comments (post_id, user_id, content)
				VALUES ($1, $2, $3)
				RETURNING id, post_id, user_id, content, created_at
			)
			SELECT i.id, i.post_id, i.user_id, i.content, i.created_at,
				u.pseudo AS author_pseudo, u.avatar_url AS author_avatar_url
			FROM inserted i
			JOIN users u ON u.id = i.user_id`,
			postID, claims.UserID, req.Content,
		).StructScan(&comment)
		if err != nil {
			slog.Error("create comment", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		slog.Info("comment created", "user_id", claims.UserID, "post_id", postID)
		respond(w, http.StatusCreated, map[string]any{"comment": comment})
	}
}

func GetCommentsHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		postID := chi.URLParam(r, "id")

		var count int
		if err := db.Get(&count, `SELECT COUNT(*) FROM posts WHERE id = $1`, postID); err != nil || count == 0 {
			respondError(w, http.StatusNotFound, "post not found")
			return
		}

		var comments []commentResponse
		if err := db.Select(&comments, `
			SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
				u.pseudo AS author_pseudo, u.avatar_url AS author_avatar_url
			FROM comments c
			JOIN users u ON u.id = c.user_id
			WHERE c.post_id = $1
			ORDER BY c.created_at ASC`, postID,
		); err != nil {
			slog.Error("get comments", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		if comments == nil {
			comments = []commentResponse{}
		}

		respond(w, http.StatusOK, map[string]any{"comments": comments})
	}
}
