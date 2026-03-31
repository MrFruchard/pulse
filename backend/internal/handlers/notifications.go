package handlers

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/MrFruchard/pulse/backend/internal/middleware"
	"github.com/MrFruchard/pulse/backend/internal/models"
	"github.com/MrFruchard/pulse/backend/internal/services"
)

type notificationRow struct {
	ID        uuid.UUID                `db:"id"         json:"id"`
	UserID    uuid.UUID                `db:"user_id"    json:"userId"`
	Type      models.NotificationType  `db:"type"       json:"type"`
	Payload   []byte                   `db:"payload"    json:"payload"`
	IsRead    bool                     `db:"is_read"    json:"isRead"`
	CreatedAt time.Time                `db:"created_at" json:"createdAt"`
}

func GetNotificationsHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)

		var notifs []notificationRow
		if err := db.Select(&notifs, `
			SELECT id, user_id, type, payload, is_read, created_at
			FROM notifications
			WHERE user_id = $1
			ORDER BY created_at DESC
			LIMIT 50`, claims.UserID,
		); err != nil {
			slog.Error("get notifications", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		if notifs == nil {
			notifs = []notificationRow{}
		}

		var unreadCount int
		db.Get(&unreadCount, `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`, claims.UserID)

		respond(w, http.StatusOK, map[string]any{
			"notifications": notifs,
			"unreadCount":   unreadCount,
		})
	}
}

func MarkNotificationReadHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)
		notifID := chi.URLParam(r, "id")

		result, err := db.Exec(`
			UPDATE notifications SET is_read = true
			WHERE id = $1 AND user_id = $2`,
			notifID, claims.UserID,
		)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		rows, _ := result.RowsAffected()
		if rows == 0 {
			respondError(w, http.StatusNotFound, "notification not found")
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}
