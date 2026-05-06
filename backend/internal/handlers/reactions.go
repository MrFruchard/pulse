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
	"github.com/MrFruchard/pulse/backend/internal/websocket"
)

var validReactions = map[string]bool{
	"LIKE": true, "FIRE": true, "INSIGHTFUL": true, "SUPPORT": true,
}

func CreateReactionHandler(db *sqlx.DB, hub *websocket.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)
		postID := chi.URLParam(r, "id")

		var req struct {
			Type string `json:"type"`
		}
		if err := decodeJSON(r, &req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Type = strings.ToUpper(strings.TrimSpace(req.Type))
		if !validReactions[req.Type] {
			respondError(w, http.StatusUnprocessableEntity, "type must be one of LIKE, FIRE, INSIGHTFUL, SUPPORT")
			return
		}

		// Récupérer le post et son propriétaire
		var post struct {
			UserID uuid.UUID `db:"user_id"`
		}
		if err := db.QueryRowx(`SELECT user_id FROM posts WHERE id = $1`, postID).StructScan(&post); err != nil {
			respondError(w, http.StatusNotFound, "post not found")
			return
		}

		// Récupérer la réaction précédente pour le broadcast
		var prevType string
		db.Get(&prevType, `SELECT type FROM reactions WHERE post_id = $1 AND user_id = $2`, postID, claims.UserID)

		// UPSERT : crée ou met à jour la réaction
		if _, err := db.Exec(`
			INSERT INTO reactions (post_id, user_id, type)
			VALUES ($1, $2, $3::reaction_type)
			ON CONFLICT (post_id, user_id) DO UPDATE SET type = EXCLUDED.type`,
			postID, claims.UserID, req.Type,
		); err != nil {
			slog.Error("create reaction", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		// Notifier le créateur du post (pas si c'est lui-même qui réagit)
		if post.UserID != claims.UserID {
			payload, _ := json.Marshal(map[string]string{
				"postId":      postID,
				"reactorId":   claims.UserID.String(),
				"reactionType": req.Type,
			})
			db.Exec(`
				INSERT INTO notifications (user_id, type, payload)
				VALUES ($1, $2, $3)`,
				post.UserID, models.NotifReaction, payload,
			)
		}

		// Broadcast WebSocket avec la réaction précédente pour mise à jour UI optimiste
		msg, _ := json.Marshal(map[string]any{
			"type":        "new_reaction",
			"postId":      postID,
			"reaction":    req.Type,
			"prevReaction": prevType,
		})
		hub.Broadcast(msg)

		slog.Info("reaction created", "user_id", claims.UserID, "post_id", postID, "type", req.Type)
		w.WriteHeader(http.StatusCreated)
	}
}
