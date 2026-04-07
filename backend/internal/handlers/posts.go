package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/MrFruchard/pulse/backend/internal/middleware"
	"github.com/MrFruchard/pulse/backend/internal/models"
	"github.com/MrFruchard/pulse/backend/internal/services"
	"github.com/MrFruchard/pulse/backend/internal/websocket"
)

var validIntentions = map[string]bool{
	"QUESTION": true, "SHARE": true, "PROJECT": true, "CHALLENGE": true,
}

var validPrivacies = map[string]bool{
	"PUBLIC": true, "FOLLOWERS": true, "PRIVATE": true,
}

type postRow struct {
	ID        uuid.UUID            `db:"id"`
	UserID    uuid.UUID            `db:"user_id"`
	SessionID uuid.UUID            `db:"session_id"`
	Content   string               `db:"content"`
	Intention models.PostIntention `db:"intention"`
	Privacy   models.PostPrivacy   `db:"privacy"`
	ImageURL  *string              `db:"image_url"`
	IsFlagged bool                 `db:"is_flagged"`
	CreatedAt string               `db:"created_at"`

	AuthorPseudo    string  `db:"author_pseudo"`
	AuthorAvatarURL *string `db:"author_avatar_url"`
	AuthorStreak    int     `db:"author_streak"`

	LikeCount       int `db:"like_count"`
	FireCount       int `db:"fire_count"`
	InsightfulCount int `db:"insightful_count"`
	SupportCount    int `db:"support_count"`
	CommentCount    int `db:"comment_count"`

	UserReaction *string `db:"user_reaction"`
}

func (p postRow) toMap() map[string]any {
	reactions := map[string]int{
		"LIKE": p.LikeCount, "FIRE": p.FireCount,
		"INSIGHTFUL": p.InsightfulCount, "SUPPORT": p.SupportCount,
	}
	return map[string]any{
		"id":        p.ID,
		"userId":    p.UserID,
		"sessionId": p.SessionID,
		"content":   p.Content,
		"intention": p.Intention,
		"privacy":   p.Privacy,
		"imageUrl":  p.ImageURL,
		"isFlagged": p.IsFlagged,
		"createdAt": p.CreatedAt,
		"author": map[string]any{
			"pseudo":    p.AuthorPseudo,
			"avatarUrl": p.AuthorAvatarURL,
			"streak":    p.AuthorStreak,
		},
		"reactions":    reactions,
		"commentCount": p.CommentCount,
		"userReaction": p.UserReaction,
	}
}

const feedBaseQuery = `
	SELECT
		p.id, p.user_id, p.session_id, p.content, p.intention, p.privacy,
		p.image_url, p.is_flagged, p.created_at::text,
		u.pseudo AS author_pseudo, u.avatar_url AS author_avatar_url, u.streak AS author_streak,
		COUNT(DISTINCT CASE WHEN r.type = 'LIKE'       THEN r.id END) AS like_count,
		COUNT(DISTINCT CASE WHEN r.type = 'FIRE'       THEN r.id END) AS fire_count,
		COUNT(DISTINCT CASE WHEN r.type = 'INSIGHTFUL' THEN r.id END) AS insightful_count,
		COUNT(DISTINCT CASE WHEN r.type = 'SUPPORT'    THEN r.id END) AS support_count,
		COUNT(DISTINCT c.id) AS comment_count,
		MAX(CASE WHEN r.user_id = $1 THEN r.type::text END) AS user_reaction
	FROM posts p
	JOIN users u ON p.user_id = u.id
	LEFT JOIN reactions r ON r.post_id = p.id
	LEFT JOIN comments c ON c.post_id = p.id
`

func GetFeedHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)

		feedType := r.URL.Query().Get("feed")
		intention := strings.ToUpper(r.URL.Query().Get("intention"))

		if intention != "" && !validIntentions[intention] {
			respondError(w, http.StatusUnprocessableEntity, "invalid intention filter")
			return
		}

		query := feedBaseQuery
		args := []any{claims.UserID}

		// Filtre feed=following
		if feedType == "following" {
			query += ` WHERE p.user_id IN (
				SELECT following_id FROM follows WHERE follower_id = $1
			)`
		} else {
			query += ` WHERE 1=1`
		}

		// Filtre privacy : exclure les posts non accessibles
		// PUBLIC → visible par tous
		// FOLLOWERS → visible uniquement si on suit le créateur (ou si on est le créateur)
		// PRIVATE → visible uniquement si dans post_allowed_users (ou si on est le créateur)
		query += ` AND (
			p.privacy = 'PUBLIC'
			OR p.user_id = $1
			OR (p.privacy = 'FOLLOWERS' AND EXISTS (
				SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = p.user_id
			))
			OR (p.privacy = 'PRIVATE' AND EXISTS (
				SELECT 1 FROM post_allowed_users WHERE post_id = p.id AND user_id = $1
			))
		)`

		// Filtre intention
		if intention != "" {
			args = append(args, intention)
			query += ` AND p.intention = $` + itoa(len(args)) + `::post_intention`
		}

		query += ` GROUP BY p.id, u.pseudo, u.avatar_url, u.streak ORDER BY p.created_at DESC`

		var rows []postRow
		if err := db.Select(&rows, query, args...); err != nil {
			slog.Error("get feed", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		posts := make([]map[string]any, len(rows))
		for i, row := range rows {
			posts[i] = row.toMap()
		}

		respond(w, http.StatusOK, map[string]any{"posts": posts})
	}
}

func CreatePostHandler(db *sqlx.DB, hub *websocket.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)

		var req struct {
			Content        string    `json:"content"`
			Intention      string    `json:"intention"`
			Privacy        string    `json:"privacy"`
			ImageURL       *string   `json:"imageUrl"`
			AllowedUserIDs []string  `json:"allowedUserIds"`
		}
		if err := decodeJSON(r, &req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Content = strings.TrimSpace(req.Content)
		req.Intention = strings.ToUpper(strings.TrimSpace(req.Intention))
		req.Privacy = strings.ToUpper(strings.TrimSpace(req.Privacy))
		if req.Privacy == "" {
			req.Privacy = "PUBLIC"
		}

		if req.Content == "" {
			respondError(w, http.StatusUnprocessableEntity, "content is required")
			return
		}
		if len(req.Content) > 500 {
			respondError(w, http.StatusUnprocessableEntity, "content must be 500 characters or less")
			return
		}
		if !validIntentions[req.Intention] {
			respondError(w, http.StatusUnprocessableEntity, "intention must be one of QUESTION, SHARE, PROJECT, CHALLENGE")
			return
		}
		if !validPrivacies[req.Privacy] {
			respondError(w, http.StatusUnprocessableEntity, "privacy must be one of PUBLIC, FOLLOWERS, PRIVATE")
			return
		}

		// Vérifier session active
		var session models.Session
		err := db.QueryRowx(`
			SELECT id, opens_at, closes_at, is_active FROM sessions
			WHERE is_active = true AND NOW() BETWEEN opens_at AND closes_at
			LIMIT 1`,
		).StructScan(&session)
		if err != nil {
			respondError(w, http.StatusForbidden, "no active session")
			return
		}

		// Règle 1 post/session
		var count int
		if err := db.Get(&count, `
			SELECT COUNT(*) FROM posts
			WHERE user_id = $1 AND session_id = $2`,
			claims.UserID, session.ID,
		); err != nil {
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}
		if count > 0 {
			respondError(w, http.StatusConflict, "already posted in this session")
			return
		}

		// Insérer le post
		var post models.Post
		err = db.QueryRowx(`
			INSERT INTO posts (user_id, session_id, content, intention, privacy, image_url)
			VALUES ($1, $2, $3, $4::post_intention, $5::post_privacy, $6)
			RETURNING id, user_id, session_id, content, intention, privacy, image_url, is_flagged, created_at`,
			claims.UserID, session.ID, req.Content, req.Intention, req.Privacy, req.ImageURL,
		).StructScan(&post)
		if err != nil {
			slog.Error("create post", "user_id", claims.UserID, "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		// Insérer les utilisateurs autorisés pour les posts PRIVATE
		if req.Privacy == "PRIVATE" && len(req.AllowedUserIDs) > 0 {
			for _, uid := range req.AllowedUserIDs {
				targetUUID, err := uuid.Parse(uid)
				if err != nil {
					continue
				}
				// Vérifier que c'est bien un follower
				var isFollower int
				db.Get(&isFollower, `SELECT COUNT(*) FROM follows WHERE follower_id = $1 AND following_id = $2`, targetUUID, claims.UserID)
				if isFollower == 0 {
					continue
				}
				db.Exec(`INSERT INTO post_allowed_users (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, post.ID, targetUUID)
			}
		}

		// Enregistrer présence en session
		if _, err = db.Exec(`
			INSERT INTO session_attendances (user_id, session_id)
			VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			claims.UserID, session.ID,
		); err != nil {
			slog.Error("record attendance", "user_id", claims.UserID, "error", err)
		}

		// Broadcast WebSocket uniquement pour les posts PUBLIC
		if req.Privacy == "PUBLIC" {
			var author models.User
			db.QueryRowx(`SELECT pseudo, avatar_url, streak FROM users WHERE id = $1`, claims.UserID).StructScan(&author)

			msg, _ := json.Marshal(map[string]any{
				"type": "new_post",
				"post": map[string]any{
					"id": post.ID, "content": post.Content, "intention": post.Intention,
					"privacy": post.Privacy, "createdAt": post.CreatedAt,
					"author":       map[string]any{"pseudo": author.Pseudo, "avatarUrl": author.AvatarURL, "streak": author.Streak},
					"reactions":    map[string]int{"LIKE": 0, "FIRE": 0, "INSIGHTFUL": 0, "SUPPORT": 0},
					"commentCount": 0,
				},
			})
			hub.Broadcast(msg)
		}

		slog.Info("post created", "user_id", claims.UserID, "post_id", post.ID, "privacy", req.Privacy)
		respond(w, http.StatusCreated, map[string]any{"post": post})
	}
}

func DeletePostHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)
		postID := chi.URLParam(r, "id")

		var ownerID uuid.UUID
		if err := db.Get(&ownerID, `SELECT user_id FROM posts WHERE id = $1`, postID); err != nil {
			respondError(w, http.StatusNotFound, "post not found")
			return
		}

		isOwner := ownerID == claims.UserID
		isMod := claims.Role == models.RoleModerator || claims.Role == models.RoleAdmin

		if !isOwner && !isMod {
			respondError(w, http.StatusForbidden, "forbidden")
			return
		}

		if _, err := db.Exec(`DELETE FROM posts WHERE id = $1`, postID); err != nil {
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		slog.Info("post deleted", "post_id", postID, "by", claims.UserID)
		w.WriteHeader(http.StatusOK)
	}
}

func itoa(n int) string {
	return strconv.Itoa(n)
}
