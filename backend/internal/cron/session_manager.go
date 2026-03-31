package cron

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/robfig/cron/v3"
	"github.com/MrFruchard/pulse/backend/internal/websocket"
)

type SessionManager struct {
	db              *sqlx.DB
	hub             *websocket.Hub
	sessionOpenHour int
	sessionDuration int
}

func NewSessionManager(db *sqlx.DB, hub *websocket.Hub, openHour, durationMin int) *SessionManager {
	return &SessionManager{
		db:              db,
		hub:             hub,
		sessionOpenHour: openHour,
		sessionDuration: durationMin,
	}
}

func (sm *SessionManager) Start() {
	c := cron.New()
	c.AddFunc("* * * * *", sm.tick)
	c.Start()
	slog.Info("session manager started", "open_hour", sm.sessionOpenHour, "duration_min", sm.sessionDuration)
}

func (sm *SessionManager) tick() {
	now := time.Now().UTC()

	// Fermer les sessions expirées
	if err := sm.closeExpiredSessions(now); err != nil {
		slog.Error("failed to close expired sessions", "error", err)
	}

	// Ouvrir une session si c'est l'heure
	if now.Hour() == sm.sessionOpenHour && now.Minute() == 0 {
		if err := sm.openSession(now); err != nil {
			slog.Error("failed to open session", "error", err)
		}
	}
}

func (sm *SessionManager) openSession(now time.Time) error {
	var count int
	if err := sm.db.Get(&count, `SELECT COUNT(*) FROM sessions WHERE is_active = true`); err != nil {
		return fmt.Errorf("check active session: %w", err)
	}
	if count > 0 {
		return nil // session déjà active
	}

	opensAt := time.Date(now.Year(), now.Month(), now.Day(), sm.sessionOpenHour, 0, 0, 0, time.UTC)
	closesAt := opensAt.Add(time.Duration(sm.sessionDuration) * time.Minute)

	_, err := sm.db.Exec(`
		INSERT INTO sessions (opens_at, closes_at, is_active)
		VALUES ($1, $2, true)`,
		opensAt, closesAt,
	)
	if err != nil {
		return fmt.Errorf("insert session: %w", err)
	}

	msg, _ := json.Marshal(map[string]interface{}{
		"type":     "session_opened",
		"opensAt":  opensAt,
		"closesAt": closesAt,
	})
	sm.hub.Broadcast(msg)
	slog.Info("session opened", "opens_at", opensAt, "closes_at", closesAt)
	return nil
}

func (sm *SessionManager) closeExpiredSessions(now time.Time) error {
	result, err := sm.db.Exec(`
		UPDATE sessions SET is_active = false
		WHERE is_active = true AND closes_at <= $1`,
		now,
	)
	if err != nil {
		return fmt.Errorf("close sessions: %w", err)
	}

	rows, _ := result.RowsAffected()
	if rows > 0 {
		msg, _ := json.Marshal(map[string]string{"type": "session_closed"})
		sm.hub.Broadcast(msg)
		slog.Info("session closed", "count", rows)
		go sm.calculateStreaks()
	}
	return nil
}

func (sm *SessionManager) calculateStreaks() {
	_, err := sm.db.Exec(`
		UPDATE users SET streak = streak + 1
		WHERE id IN (
			SELECT DISTINCT sa.user_id
			FROM session_attendances sa
			JOIN sessions s ON sa.session_id = s.id
			WHERE s.closes_at > NOW() - INTERVAL '2 minutes'
		)
	`)
	if err != nil {
		slog.Error("failed to increment streaks", "error", err)
		return
	}

	_, err = sm.db.Exec(`
		UPDATE users SET streak = 0, status = CASE
			WHEN streak + 1 >= 7 THEN 'dormant'::user_status
			ELSE status
		END
		WHERE id NOT IN (
			SELECT DISTINCT sa.user_id
			FROM session_attendances sa
			JOIN sessions s ON sa.session_id = s.id
			WHERE s.closes_at > NOW() - INTERVAL '2 minutes'
		) AND status = 'active'
	`)
	if err != nil {
		slog.Error("failed to reset streaks", "error", err)
	}
}
