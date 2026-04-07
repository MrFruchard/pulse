package handlers

import (
	"log/slog"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/MrFruchard/pulse/backend/internal/middleware"
	"github.com/MrFruchard/pulse/backend/internal/models"
	"github.com/MrFruchard/pulse/backend/internal/services"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

type registerRequest struct {
	Email    string `json:"email"`
	Pseudo   string `json:"pseudo"`
	Password string `json:"password"`
}

func (r registerRequest) validate() string {
	r.Email = strings.TrimSpace(strings.ToLower(r.Email))
	r.Pseudo = strings.TrimSpace(r.Pseudo)

	if !emailRegex.MatchString(r.Email) {
		return "invalid email format"
	}
	if len(r.Pseudo) < 3 || len(r.Pseudo) > 50 {
		return "pseudo must be between 3 and 50 characters"
	}
	if len(r.Password) < 8 {
		return "password must be at least 8 characters"
	}
	return ""
}

func RegisterHandler(db *sqlx.DB, jwtService *services.JWTService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req registerRequest
		if err := decodeJSON(r, &req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Email = strings.TrimSpace(strings.ToLower(req.Email))
		req.Pseudo = strings.TrimSpace(req.Pseudo)

		if msg := req.validate(); msg != "" {
			respondError(w, http.StatusUnprocessableEntity, msg)
			return
		}

		// Unicité email + pseudo
		var count int
		if err := db.Get(&count, `SELECT COUNT(*) FROM users WHERE email = $1`, req.Email); err != nil {
			slog.Error("register: check email", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}
		if count > 0 {
			respondError(w, http.StatusConflict, "email already exists")
			return
		}

		if err := db.Get(&count, `SELECT COUNT(*) FROM users WHERE pseudo = $1`, req.Pseudo); err != nil {
			slog.Error("register: check pseudo", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}
		if count > 0 {
			respondError(w, http.StatusConflict, "pseudo already exists")
			return
		}

		hash, err := services.HashPassword(req.Password)
		if err != nil {
			slog.Error("register: bcrypt", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		var user models.User
		err = db.QueryRowx(`
			INSERT INTO users (email, password_hash, pseudo)
			VALUES ($1, $2, $3)
			RETURNING id, email, pseudo, avatar_url, bio, role, streak, status, created_at, updated_at`,
			req.Email, string(hash), req.Pseudo,
		).StructScan(&user)
		if err != nil {
			slog.Error("register: insert user", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		token, err := jwtService.Generate(user.ID, user.Role)
		if err != nil {
			slog.Error("register: generate jwt", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		setTokenCookie(w, token)
		slog.Info("user registered", "user_id", user.ID, "pseudo", user.Pseudo)
		respond(w, http.StatusCreated, map[string]any{"user": user})
	}
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func LoginHandler(db *sqlx.DB, jwtService *services.JWTService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req loginRequest
		if err := decodeJSON(r, &req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		req.Email = strings.TrimSpace(strings.ToLower(req.Email))

		// Message d'erreur générique — ne pas distinguer email inconnu vs mauvais mdp
		const invalidCreds = "invalid credentials"

		var user models.User
		err := db.QueryRowx(`
			SELECT id, email, password_hash, pseudo, avatar_url, bio, role, streak, status, created_at, updated_at
			FROM users WHERE email = $1`, req.Email,
		).StructScan(&user)
		if err != nil {
			// Simuler un hash compare pour éviter les timing attacks
			services.ComparePassword("$2a$12$dummydummydummydummydummydummydummydumm", req.Password) //nolint
			slog.Warn("login: email not found", "email", req.Email)
			respondError(w, http.StatusUnauthorized, invalidCreds)
			return
		}

		if !services.ComparePassword(user.PasswordHash, req.Password) {
			slog.Warn("login: wrong password", "user_id", user.ID)
			respondError(w, http.StatusUnauthorized, invalidCreds)
			return
		}

		if user.Status == models.StatusSuspended {
			slog.Warn("login: suspended account", "user_id", user.ID)
			respondError(w, http.StatusForbidden, "account suspended")
			return
		}

		token, err := jwtService.Generate(user.ID, user.Role)
		if err != nil {
			slog.Error("login: generate jwt", "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		setTokenCookie(w, token)
		slog.Info("user logged in", "user_id", user.ID)
		respond(w, http.StatusOK, map[string]any{"user": user})
	}
}

func LogoutHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.SetCookie(w, &http.Cookie{
			Name:     "token",
			Value:    "",
			MaxAge:   -1,
			Path:     "/",
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
		})
		w.WriteHeader(http.StatusOK)
	}
}

func GetMeHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)

		var user models.User
		if err := db.QueryRowx(`
			SELECT id, email, pseudo, avatar_url, bio, role, streak, status, created_at, updated_at
			FROM users WHERE id = $1`, claims.UserID,
		).StructScan(&user); err != nil {
			respondError(w, http.StatusNotFound, "user not found")
			return
		}

		respond(w, http.StatusOK, map[string]any{"user": user})
	}
}

func UpdateMeHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)

		var req struct {
			Pseudo    *string `json:"pseudo"`
			AvatarURL *string `json:"avatarUrl"`
			Bio       *string `json:"bio"`
		}
		if err := decodeJSON(r, &req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		if req.Pseudo != nil {
			*req.Pseudo = strings.TrimSpace(*req.Pseudo)
			if len(*req.Pseudo) < 3 || len(*req.Pseudo) > 50 {
				respondError(w, http.StatusUnprocessableEntity, "pseudo must be between 3 and 50 characters")
				return
			}
			var count int
			if err := db.Get(&count, `SELECT COUNT(*) FROM users WHERE pseudo = $1 AND id != $2`, *req.Pseudo, claims.UserID); err != nil {
				respondError(w, http.StatusInternalServerError, "internal error")
				return
			}
			if count > 0 {
				respondError(w, http.StatusConflict, "pseudo already exists")
				return
			}
		}

		var user models.User
		if err := db.QueryRowx(`
			UPDATE users
			SET
				pseudo     = COALESCE($1, pseudo),
				avatar_url = COALESCE($2, avatar_url),
				bio        = COALESCE($3, bio),
				updated_at = NOW()
			WHERE id = $4
			RETURNING id, email, pseudo, avatar_url, bio, role, streak, status, created_at, updated_at`,
			req.Pseudo, req.AvatarURL, req.Bio, claims.UserID,
		).StructScan(&user); err != nil {
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		slog.Info("profile updated", "user_id", claims.UserID)
		respond(w, http.StatusOK, map[string]any{"user": user})
	}
}

func DeleteMeHandler(db *sqlx.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)

		if _, err := db.Exec(`DELETE FROM users WHERE id = $1`, claims.UserID); err != nil {
			slog.Error("delete account", "user_id", claims.UserID, "error", err)
			respondError(w, http.StatusInternalServerError, "internal error")
			return
		}

		http.SetCookie(w, &http.Cookie{Name: "token", Value: "", MaxAge: -1, Path: "/", HttpOnly: true, SameSite: http.SameSiteStrictMode})
		slog.Info("account deleted", "user_id", claims.UserID)
		w.WriteHeader(http.StatusOK)
	}
}

func setTokenCookie(w http.ResponseWriter, token string) {
	secure := os.Getenv("APP_ENV") == "production"
	http.SetCookie(w, &http.Cookie{
		Name:     "token",
		Value:    token,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
	})
}

// Assurer que uuid est utilisé
var _ = uuid.UUID{}
