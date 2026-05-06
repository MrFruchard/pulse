package cron_test

import (
	"os"
	"testing"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/MrFruchard/pulse/backend/internal/cron"
	"github.com/MrFruchard/pulse/backend/internal/db"
	"github.com/MrFruchard/pulse/backend/internal/websocket"
)

func setupDB(t *testing.T) *sqlx.DB {
	t.Helper()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://pulse_test:pulse_test@localhost:5432/pulse_test?sslmode=disable"
	}
	database, err := db.Connect(dbURL)
	if err != nil {
		t.Skipf("database not available: %v", err)
	}
	t.Cleanup(func() {
		database.Exec(`TRUNCATE users, sessions, posts, reactions, comments, follows, notifications, reports, session_attendances RESTART IDENTITY CASCADE`)
	})
	return database
}

func newManager(database *sqlx.DB) *cron.SessionManager {
	hub := websocket.NewHub()
	return cron.NewSessionManager(database, hub, 20, 60)
}

func TestOpenSession_CreatesRecord(t *testing.T) {
	database := setupDB(t)
	sm := newManager(database)

	if err := sm.OpenSession(time.Now().UTC()); err != nil {
		t.Fatalf("OpenSession failed: %v", err)
	}

	var count int
	database.Get(&count, `SELECT COUNT(*) FROM sessions WHERE is_active = true`)
	if count != 1 {
		t.Fatalf("expected 1 active session, got %d", count)
	}
}

func TestOpenSession_Idempotent(t *testing.T) {
	database := setupDB(t)
	sm := newManager(database)

	sm.OpenSession(time.Now().UTC())
	sm.OpenSession(time.Now().UTC())

	var count int
	database.Get(&count, `SELECT COUNT(*) FROM sessions WHERE is_active = true`)
	if count != 1 {
		t.Fatalf("expected exactly 1 active session, got %d (not idempotent)", count)
	}
}

func TestCloseExpiredSessions(t *testing.T) {
	database := setupDB(t)
	sm := newManager(database)

	// Insérer une session déjà expirée
	database.Exec(`
		INSERT INTO sessions (opens_at, closes_at, is_active)
		VALUES ($1, $2, true)`,
		time.Now().UTC().Add(-2*time.Hour),
		time.Now().UTC().Add(-1*time.Hour),
	)

	if err := sm.CloseExpiredSessions(time.Now().UTC()); err != nil {
		t.Fatalf("CloseExpiredSessions failed: %v", err)
	}

	var count int
	database.Get(&count, `SELECT COUNT(*) FROM sessions WHERE is_active = true`)
	if count != 0 {
		t.Fatalf("expected 0 active sessions after close, got %d", count)
	}
}

func TestCloseExpiredSessions_KeepsActiveSessions(t *testing.T) {
	database := setupDB(t)
	sm := newManager(database)

	// Session encore active
	database.Exec(`
		INSERT INTO sessions (opens_at, closes_at, is_active)
		VALUES ($1, $2, true)`,
		time.Now().UTC().Add(-10*time.Minute),
		time.Now().UTC().Add(50*time.Minute),
	)

	sm.CloseExpiredSessions(time.Now().UTC())

	var count int
	database.Get(&count, `SELECT COUNT(*) FROM sessions WHERE is_active = true`)
	if count != 1 {
		t.Fatalf("expected active session to remain open, got %d", count)
	}
}

func TestCalculateStreaks_IncrementsParticipants(t *testing.T) {
	database := setupDB(t)
	sm := newManager(database)

	// Créer un user
	var userID string
	database.QueryRowx(`
		INSERT INTO users (email, password_hash, pseudo)
		VALUES ('streak@pulse.io', '$2a$12$dummy', 'streakuser')
		RETURNING id`,
	).Scan(&userID)

	// Créer une session qui vient de se fermer
	var sessionID string
	database.QueryRowx(`
		INSERT INTO sessions (opens_at, closes_at, is_active)
		VALUES ($1, $2, false)
		RETURNING id`,
		time.Now().UTC().Add(-61*time.Minute),
		time.Now().UTC().Add(-1*time.Minute),
	).Scan(&sessionID)

	// Enregistrer la présence
	database.Exec(`INSERT INTO session_attendances (user_id, session_id) VALUES ($1, $2)`, userID, sessionID)

	sm.CalculateStreaks()

	var streak int
	database.Get(&streak, `SELECT streak FROM users WHERE id = $1`, userID)
	if streak != 1 {
		t.Fatalf("expected streak=1 after participation, got %d", streak)
	}
}

func TestCalculateStreaks_ResetAbsentUsers(t *testing.T) {
	database := setupDB(t)
	sm := newManager(database)

	// User avec streak existant mais absent de la dernière session
	var userID string
	database.QueryRowx(`
		INSERT INTO users (email, password_hash, pseudo, streak)
		VALUES ('absent@pulse.io', '$2a$12$dummy', 'absentuser', 5)
		RETURNING id`,
	).Scan(&userID)

	// Session terminée sans attendance pour cet user
	database.Exec(`
		INSERT INTO sessions (opens_at, closes_at, is_active)
		VALUES ($1, $2, false)`,
		time.Now().UTC().Add(-61*time.Minute),
		time.Now().UTC().Add(-1*time.Minute),
	)

	sm.CalculateStreaks()

	var streak int
	database.Get(&streak, `SELECT streak FROM users WHERE id = $1`, userID)
	if streak != 0 {
		t.Fatalf("expected streak=0 after missing session, got %d", streak)
	}
}

func TestCalculateStreaks_DormantAfter7Missed(t *testing.T) {
	database := setupDB(t)
	sm := newManager(database)

	// User avec streak 0 et 7 sessions manquées (simulé par streak=0 déjà)
	var userID string
	database.QueryRowx(`
		INSERT INTO users (email, password_hash, pseudo, streak, status)
		VALUES ('dormant@pulse.io', '$2a$12$dummy', 'dormantuser', 6, 'active')
		RETURNING id`,
	).Scan(&userID)

	// Session terminée sans attendance
	database.Exec(`
		INSERT INTO sessions (opens_at, closes_at, is_active)
		VALUES ($1, $2, false)`,
		time.Now().UTC().Add(-61*time.Minute),
		time.Now().UTC().Add(-1*time.Minute),
	)

	sm.CalculateStreaks()

	var status string
	database.Get(&status, `SELECT status FROM users WHERE id = $1`, userID)
	if status != "dormant" {
		t.Fatalf("expected status=dormant after 7 missed, got %s", status)
	}
}
