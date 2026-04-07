package services

import (
	"time"

	"github.com/MrFruchard/pulse/backend/internal/models"
)

func IsSessionActive(session models.Session) bool {
	now := time.Now().UTC()
	return session.IsActive &&
		now.After(session.OpensAt) &&
		now.Before(session.ClosesAt)
}
