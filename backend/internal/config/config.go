package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL        string
	JWTSecret          string
	SessionOpenHour    int
	SessionDurationMin int
	Port               string
	UploadsDir         string
	UploadMaxSizeMB    int64
}

func Load() (*Config, error) {
	cfg := &Config{}

	cfg.DatabaseURL = os.Getenv("DATABASE_URL")
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	cfg.JWTSecret = os.Getenv("JWT_SECRET")
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}
	if len(cfg.JWTSecret) < 32 {
		return nil, fmt.Errorf("JWT_SECRET must be at least 32 characters")
	}

	hour, err := strconv.Atoi(os.Getenv("SESSION_OPEN_HOUR"))
	if err != nil || hour < 0 || hour > 23 {
		return nil, fmt.Errorf("SESSION_OPEN_HOUR must be a valid hour (0-23)")
	}
	cfg.SessionOpenHour = hour

	duration, err := strconv.Atoi(os.Getenv("SESSION_DURATION_MIN"))
	if err != nil || duration <= 0 {
		return nil, fmt.Errorf("SESSION_DURATION_MIN must be a positive integer")
	}
	cfg.SessionDurationMin = duration

	cfg.Port = os.Getenv("PORT")
	if cfg.Port == "" {
		cfg.Port = "8080"
	}

	cfg.UploadsDir = os.Getenv("UPLOADS_DIR")
	if cfg.UploadsDir == "" {
		cfg.UploadsDir = "/app/uploads"
	}

	cfg.UploadMaxSizeMB = 5
	if v := os.Getenv("UPLOAD_MAX_SIZE_MB"); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil && n > 0 {
			cfg.UploadMaxSizeMB = n
		}
	}

	return cfg, nil
}
