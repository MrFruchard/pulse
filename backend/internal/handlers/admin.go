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
	"github.com/MrFruchard/pulse/backend/internal/models"
	"github.com/MrFruchard/pulse/backend/internal/services"
)

var validReasons = map[string]bool{
	"SPAM": true, "INAPPROPRIATE": true, "HARASSMENT": true, "OTHER": true,
}

func CreateReportHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)
		postID := chi.URLParam(r, "id")

		var req struct {
			Reason string `json:"reason"`
		}
		if err := decodeJSON(r, &req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Reason = strings.ToUpper(strings.TrimSpace(req.Reason))
		if !validReasons[req.Reason] {
			respondError(w, http.StatusUnprocessableEntity, "reason must be one of SPAM, INAPPROPRIATE, HARASSMENT, OTHER")
			return
		}

		var count int
		if err := db.Get(&count, `SELECT COUNT(*) FROM posts WHERE id = $1`, postID); err != nil || count == 0 {
			respondError(w, http.StatusNotFound, "post not found")
			return
		}

		_, err := db.Exec(`
			INSERT INTO reports (post_id, reporter_id, reason)
			VALUES ($1, $2, $3::report_reason)`,
			postID, claims.UserID, req.Reason,
		)
		if err != nil {
			slog.Error("create report", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		slog.Info("report created", "reporter", claims.UserID, "post_id", postID, "reason", req.Reason)
		w.WriteHeader(http.StatusCreated)
	}
}

type reportRow struct {
	ID         uuid.UUID            `db:"id"          json:"id"`
	PostID     uuid.UUID            `db:"post_id"     json:"postId"`
	ReporterID uuid.UUID            `db:"reporter_id" json:"reporterId"`
	Reason     models.ReportReason  `db:"reason"      json:"reason"`
	Status     models.ReportStatus  `db:"status"      json:"status"`
	CreatedAt  time.Time            `db:"created_at"  json:"createdAt"`
	PostContent string              `db:"post_content" json:"postContent"`
	ReporterPseudo string           `db:"reporter_pseudo" json:"reporterPseudo"`
}

func GetReportsHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		statusFilter := r.URL.Query().Get("status")
		if statusFilter == "" {
			statusFilter = "PENDING"
		}

		var reports []reportRow
		if err := db.Select(&reports, `
			SELECT r.id, r.post_id, r.reporter_id, r.reason, r.status, r.created_at,
				p.content AS post_content,
				u.pseudo AS reporter_pseudo
			FROM reports r
			JOIN posts p ON p.id = r.post_id
			JOIN users u ON u.id = r.reporter_id
			WHERE r.status = $1::report_status
			ORDER BY r.created_at ASC`, statusFilter,
		); err != nil {
			slog.Error("get reports", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		if reports == nil {
			reports = []reportRow{}
		}
		respond(w, http.StatusOK, map[string]any{"reports": reports})
	}
}

func UpdateReportHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)
		reportID := chi.URLParam(r, "id")

		var req struct {
			Status string `json:"status"`
		}
		if err := decodeJSON(r, &req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Status = strings.ToUpper(strings.TrimSpace(req.Status))
		if req.Status != "REVIEWED" && req.Status != "DISMISSED" {
			respondError(w, http.StatusUnprocessableEntity, "status must be REVIEWED or DISMISSED")
			return
		}

		result, err := db.Exec(`
			UPDATE reports SET status = $1::report_status WHERE id = $2`,
			req.Status, reportID,
		)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		rows, _ := result.RowsAffected()
		if rows == 0 {
			respondError(w, http.StatusNotFound, "report not found")
			return
		}

		// Si REVIEWED : supprimer le post et flaguer
		if req.Status == "REVIEWED" {
			var postID string
			if err := db.Get(&postID, `SELECT post_id FROM reports WHERE id = $1`, reportID); err == nil {
				db.Exec(`DELETE FROM posts WHERE id = $1`, postID)
			}
		}

		slog.Info("report updated", "mod", claims.UserID, "report_id", reportID, "status", req.Status)
		w.WriteHeader(http.StatusOK)
	}
}

func SuspendUserHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)
		targetID := chi.URLParam(r, "id")

		result, err := db.Exec(`
			UPDATE users SET status = 'suspended'::user_status WHERE id = $1`, targetID,
		)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		rows, _ := result.RowsAffected()
		if rows == 0 {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}

		slog.Info("user suspended", "admin", claims.UserID, "target", targetID)
		w.WriteHeader(http.StatusOK)
	}
}
