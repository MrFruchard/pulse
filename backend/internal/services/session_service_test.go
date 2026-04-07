package services_test

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/MrFruchard/pulse/backend/internal/models"
	"github.com/MrFruchard/pulse/backend/internal/services"
)

func makeSession(opensAt, closesAt time.Time, isActive bool) models.Session {
	return models.Session{
		ID:       uuid.New(),
		OpensAt:  opensAt,
		ClosesAt: closesAt,
		IsActive: isActive,
	}
}

// TU-09 : IsSessionActive retourne true quand la session est ouverte
func TestIsSessionActive_Open(t *testing.T) {
	now := time.Now().UTC()
	session := makeSession(now.Add(-10*time.Minute), now.Add(50*time.Minute), true)
	if !services.IsSessionActive(session) {
		t.Fatal("expected session to be active")
	}
}

// TU-10 : IsSessionActive retourne false quand la session est fermée
func TestIsSessionActive_Closed(t *testing.T) {
	now := time.Now().UTC()
	session := makeSession(now.Add(-2*time.Hour), now.Add(-1*time.Hour), false)
	if services.IsSessionActive(session) {
		t.Fatal("expected session to be inactive (closed)")
	}
}

// TU-11 : IsSessionActive retourne false quand la session n'est pas encore ouverte
func TestIsSessionActive_NotYetOpen(t *testing.T) {
	now := time.Now().UTC()
	session := makeSession(now.Add(30*time.Minute), now.Add(90*time.Minute), false)
	if services.IsSessionActive(session) {
		t.Fatal("expected session to be inactive (not yet open)")
	}
}

// IsSessionActive retourne false si is_active = false même si dans la fenêtre
func TestIsSessionActive_FlagFalse(t *testing.T) {
	now := time.Now().UTC()
	session := makeSession(now.Add(-10*time.Minute), now.Add(50*time.Minute), false)
	if services.IsSessionActive(session) {
		t.Fatal("expected session to be inactive (is_active = false)")
	}
}
