package testutil

import (
	"os"
	"testing"

	"github.com/jmoiron/sqlx"
	"github.com/MrFruchard/pulse/backend/internal/db"
)

func SetupDB(t *testing.T) *sqlx.DB {
	t.Helper()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://pulse_test:pulse_test@localhost:5432/pulse_test?sslmode=disable"
	}

	database, err := db.Connect(dbURL)
	if err != nil {
		t.Skipf("database not available (set DATABASE_URL to run integration tests): %v", err)
	}

	// Nettoyer les tables avant chaque test
	t.Cleanup(func() {
		database.Exec(`TRUNCATE users, sessions, posts, reactions, comments, follows, notifications, reports, session_attendances RESTART IDENTITY CASCADE`)
	})

	return database
}
