package handlers

import (
	"encoding/json"
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
			SELECT id, pseudo, avatar_url, bio, role, streak, status, is_private, created_at, updated_at
			FROM users WHERE pseudo = $1`, pseudo,
		).StructScan(&user); err != nil {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}

		var followerCount, followingCount int
		db.Get(&followerCount, `SELECT COUNT(*) FROM follows WHERE following_id = $1`, user.ID)
		db.Get(&followingCount, `SELECT COUNT(*) FROM follows WHERE follower_id = $1`, user.ID)

		var rows []postRow
		if err := db.Select(&rows, `
			SELECT
				p.id, p.user_id, p.session_id, p.content, p.intention, p.privacy,
				p.image_url, p.is_flagged, p.created_at::text,
				u.pseudo AS author_pseudo, u.avatar_url AS author_avatar_url, u.streak AS author_streak,
				COUNT(DISTINCT CASE WHEN r.type = 'LIKE'       THEN r.id END) AS like_count,
				COUNT(DISTINCT CASE WHEN r.type = 'FIRE'       THEN r.id END) AS fire_count,
				COUNT(DISTINCT CASE WHEN r.type = 'INSIGHTFUL' THEN r.id END) AS insightful_count,
				COUNT(DISTINCT CASE WHEN r.type = 'SUPPORT'    THEN r.id END) AS support_count,
				COUNT(DISTINCT c.id) AS comment_count,
				NULL::text AS user_reaction
			FROM posts p
			JOIN users u ON u.id = p.user_id
			LEFT JOIN reactions r ON r.post_id = p.id
			LEFT JOIN comments c ON c.post_id = p.id
			WHERE p.user_id = $1
			GROUP BY p.id, u.pseudo, u.avatar_url, u.streak
			ORDER BY p.created_at DESC LIMIT 50`, user.ID,
		); err != nil {
			rows = []postRow{}
		}

		posts := make([]map[string]any, len(rows))
		for i, r := range rows {
			posts[i] = r.toMap()
		}

		respond(w, http.StatusOK, map[string]any{
			"user":           user,
			"followerCount":  followerCount,
			"followingCount": followingCount,
			"posts":          posts,
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
			IsPrivate bool      `db:"is_private" json:"isPrivate"`
		}

		var users []result
		if err := db.Select(&users, `
			SELECT id, pseudo, avatar_url, streak, status, is_private
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

// FollowHandler : follow direct si profil public, follow request si profil privé
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

		var target struct {
			ID        uuid.UUID `db:"id"`
			IsPrivate bool      `db:"is_private"`
		}
		if err := db.QueryRowx(`SELECT id, is_private FROM users WHERE id = $1`, targetID).StructScan(&target); err != nil {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}

		// Vérifier si déjà follower
		var alreadyFollowing int
		db.Get(&alreadyFollowing, `SELECT COUNT(*) FROM follows WHERE follower_id = $1 AND following_id = $2`, claims.UserID, targetID)
		if alreadyFollowing > 0 {
			respondError(w, http.StatusConflict, "already following this user")
			return
		}

		if target.IsPrivate {
			// Profil privé → créer une follow request
			_, err = db.Exec(`
				INSERT INTO follow_requests (requester_id, target_id)
				VALUES ($1, $2)
				ON CONFLICT (requester_id, target_id) DO NOTHING`,
				claims.UserID, targetID,
			)
			if err != nil {
				slog.Error("follow request insert", "error", err)
				respondError(w, http.StatusInternalServerError, "internal error")
				return
			}

			// Notification à la cible
			payload, _ := json.Marshal(map[string]string{"requesterId": claims.UserID.String()})
			db.Exec(`
				INSERT INTO notifications (user_id, type, payload)
				VALUES ($1, 'FOLLOW_REQUEST', $2)`,
				targetID, payload,
			)

			slog.Info("follow request sent", "requester", claims.UserID, "target", targetID)
			respond(w, http.StatusCreated, map[string]string{"status": "pending"})
			return
		}

		// Profil public → follow direct
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
			// Peut-être une follow request en attente
			db.Exec(`DELETE FROM follow_requests WHERE requester_id = $1 AND target_id = $2`, claims.UserID, targetID)
		}

		w.WriteHeader(http.StatusOK)
	}
}

// GetFollowRequestsHandler : liste des demandes reçues (PENDING)
func GetFollowRequestsHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)

		type requestRow struct {
			ID          uuid.UUID `db:"id"           json:"id"`
			RequesterID uuid.UUID `db:"requester_id" json:"requesterId"`
			Pseudo      string    `db:"pseudo"       json:"pseudo"`
			AvatarURL   *string   `db:"avatar_url"   json:"avatarUrl"`
			CreatedAt   string    `db:"created_at"   json:"createdAt"`
		}

		var requests []requestRow
		if err := db.Select(&requests, `
			SELECT fr.id, fr.requester_id, u.pseudo, u.avatar_url, fr.created_at::text
			FROM follow_requests fr
			JOIN users u ON u.id = fr.requester_id
			WHERE fr.target_id = $1 AND fr.status = 'PENDING'
			ORDER BY fr.created_at DESC`, claims.UserID,
		); err != nil {
			slog.Error("get follow requests", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		if requests == nil {
			requests = []requestRow{}
		}

		respond(w, http.StatusOK, map[string]any{"requests": requests})
	}
}

// RespondFollowRequestHandler : accepter ou refuser une follow request
func RespondFollowRequestHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)
		requestID := chi.URLParam(r, "id")

		var req struct {
			Action string `json:"action"` // "ACCEPT" | "DECLINE"
		}
		if err := decodeJSON(r, &req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if req.Action != "ACCEPT" && req.Action != "DECLINE" {
			respondError(w, http.StatusUnprocessableEntity, "action must be ACCEPT or DECLINE")
			return
		}

		// Récupérer la request et vérifier qu'elle appartient bien à cet utilisateur
		var fr models.FollowRequest
		if err := db.QueryRowx(`
			SELECT id, requester_id, target_id, status
			FROM follow_requests
			WHERE id = $1 AND target_id = $2 AND status = 'PENDING'`,
			requestID, claims.UserID,
		).StructScan(&fr); err != nil {
			respondError(w, http.StatusNotFound, "follow request not found")
			return
		}

		newStatus := models.FollowRequestDeclined
		if req.Action == "ACCEPT" {
			newStatus = models.FollowRequestAccepted
		}

		_, err := db.Exec(`
			UPDATE follow_requests SET status = $1, updated_at = NOW()
			WHERE id = $2`, newStatus, requestID,
		)
		if err != nil {
			slog.Error("update follow request", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		if req.Action == "ACCEPT" {
			// Créer le follow
			_, err = db.Exec(`
				INSERT INTO follows (follower_id, following_id)
				VALUES ($1, $2)
				ON CONFLICT DO NOTHING`, fr.RequesterID, claims.UserID,
			)
			if err != nil {
				slog.Error("accept follow: insert follow", "error", err)
				respondError(w, http.StatusInternalServerError, "internal error")
				return
			}

			// Notification au demandeur
			payload, _ := json.Marshal(map[string]string{"userId": claims.UserID.String()})
			db.Exec(`
				INSERT INTO notifications (user_id, type, payload)
				VALUES ($1, 'FOLLOW_ACCEPTED', $2)`,
				fr.RequesterID, payload,
			)

			slog.Info("follow request accepted", "requester", fr.RequesterID, "target", claims.UserID)
		} else {
			slog.Info("follow request declined", "requester", fr.RequesterID, "target", claims.UserID)
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
