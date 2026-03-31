package handlers

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/jmoiron/sqlx"

	"github.com/MrFruchard/pulse/backend/internal/middleware"
	"github.com/MrFruchard/pulse/backend/internal/models"
	"github.com/MrFruchard/pulse/backend/internal/services"
)

func GetCurrentSessionHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var session models.Session
		err := db.QueryRowx(`
			SELECT id, opens_at, closes_at, is_active, created_at
			FROM sessions
			WHERE is_active = true
			LIMIT 1`,
		).StructScan(&session)

		if err != nil {
			// Pas de session active — chercher la prochaine
			var next models.Session
			err2 := db.QueryRowx(`
				SELECT id, opens_at, closes_at, is_active, created_at
				FROM sessions
				WHERE opens_at > NOW()
				ORDER BY opens_at ASC
				LIMIT 1`,
			).StructScan(&next)

			if err2 != nil {
				respond(w, http.StatusOK, map[string]any{
					"isActive": false,
					"opensAt":  nil,
				})
				return
			}

			respond(w, http.StatusOK, map[string]any{
				"isActive": false,
				"opensAt":  next.OpensAt,
			})
			return
		}

		respond(w, http.StatusOK, map[string]any{
			"isActive":  true,
			"sessionId": session.ID,
			"opensAt":   session.OpensAt,
			"closesAt":  session.ClosesAt,
		})
	}
}

func UpdateSessionHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)

		var req struct {
			OpenHour    *int `json:"openHour"`
			DurationMin *int `json:"durationMin"`
		}
		if err := decodeJSON(r, &req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		if req.OpenHour != nil && (*req.OpenHour < 0 || *req.OpenHour > 23) {
			respondError(w, http.StatusUnprocessableEntity, "openHour must be between 0 and 23")
			return
		}
		if req.DurationMin != nil && *req.DurationMin <= 0 {
			respondError(w, http.StatusUnprocessableEntity, "durationMin must be positive")
			return
		}

		// Mettre à jour la session active si elle existe
		now := time.Now().UTC()
		if req.OpenHour != nil && req.DurationMin != nil {
			opensAt := time.Date(now.Year(), now.Month(), now.Day(), *req.OpenHour, 0, 0, 0, time.UTC)
			closesAt := opensAt.Add(time.Duration(*req.DurationMin) * time.Minute)
			_, err := db.Exec(`
				UPDATE sessions SET opens_at = $1, closes_at = $2
				WHERE is_active = true`, opensAt, closesAt,
			)
			if err != nil {
				slog.Error("update session", "admin_id", claims.UserID, "error", err)
				respondError(w, http.StatusInternalServerError, "internal error")
				return
			}
		}

		slog.Info("session updated", "admin_id", claims.UserID)
		respond(w, http.StatusOK, map[string]string{"status": "updated"})
	}
}
