package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/jmoiron/sqlx"
)

func HealthHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		dbStatus := "ok"
		if err := db.Ping(); err != nil {
			dbStatus = "error"
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "ok",
			"db":      dbStatus,
			"version": "1.0.0",
		})
	}
}
