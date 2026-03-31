package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"

	"github.com/MrFruchard/pulse/backend/internal/config"
	"github.com/MrFruchard/pulse/backend/internal/cron"
	"github.com/MrFruchard/pulse/backend/internal/db"
	"github.com/MrFruchard/pulse/backend/internal/handlers"
	"github.com/MrFruchard/pulse/backend/internal/middleware"
	"github.com/MrFruchard/pulse/backend/internal/models"
	"github.com/MrFruchard/pulse/backend/internal/services"
	"github.com/MrFruchard/pulse/backend/internal/websocket"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer database.Close()
	slog.Info("database connected")

	jwtService := services.NewJWTService(cfg.JWTSecret)
	hub := websocket.NewHub()

	sessionManager := cron.NewSessionManager(database, hub, cfg.SessionOpenHour, cfg.SessionDurationMin)
	sessionManager.Start()

	jwtMiddleware := middleware.JWT(jwtService)
	adminOnly := middleware.RequireRole(models.RoleAdmin)
	modOrAdmin := middleware.RequireRole(models.RoleModerator, models.RoleAdmin)

	r := chi.NewRouter()
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(chimiddleware.RealIP)

	// Health
	r.Get("/api/health", handlers.HealthHandler(database))

	// Auth
	r.Post("/api/auth/register", handlers.RegisterHandler(database, jwtService))
	r.Post("/api/auth/login", handlers.LoginHandler(database, jwtService))
	r.With(jwtMiddleware).Post("/api/auth/logout", handlers.LogoutHandler())

	// Session
	r.Get("/api/session/current", handlers.GetCurrentSessionHandler(database))
	r.With(jwtMiddleware, adminOnly).Put("/api/admin/session", handlers.UpdateSessionHandler(database))

	// Posts
	r.With(jwtMiddleware).Get("/api/posts", handlers.GetFeedHandler(database))
	r.With(jwtMiddleware).Post("/api/posts", handlers.CreatePostHandler(database, hub))
	r.With(jwtMiddleware).Delete("/api/posts/{id}", handlers.DeletePostHandler(database))
	r.With(jwtMiddleware).Post("/api/posts/{id}/reactions", handlers.CreateReactionHandler(database, hub))
	r.With(jwtMiddleware).Post("/api/posts/{id}/comments", handlers.CreateCommentHandler(database))
	r.With(jwtMiddleware).Get("/api/posts/{id}/comments", handlers.GetCommentsHandler(database))
	r.With(jwtMiddleware).Post("/api/posts/{id}/reports", handlers.CreateReportHandler(database))

	// Users
	r.With(jwtMiddleware).Get("/api/me", handlers.GetMeHandler(database))
	r.With(jwtMiddleware).Put("/api/me", handlers.UpdateMeHandler(database))
	r.With(jwtMiddleware).Delete("/api/me", handlers.DeleteMeHandler(database))
	r.Get("/api/users/{pseudo}", handlers.GetProfileHandler(database))
	r.Get("/api/users/search", handlers.SearchUsersHandler(database))
	r.With(jwtMiddleware).Post("/api/users/{id}/follow", handlers.FollowHandler(database))
	r.With(jwtMiddleware).Delete("/api/users/{id}/follow", handlers.UnfollowHandler(database))
	r.Get("/api/users/{id}/followers", handlers.GetFollowersHandler(database))
	r.Get("/api/users/{id}/following", handlers.GetFollowingHandler(database))

	// Notifications
	r.With(jwtMiddleware).Get("/api/notifications", handlers.GetNotificationsHandler(database))
	r.With(jwtMiddleware).Put("/api/notifications/{id}/read", handlers.MarkNotificationReadHandler(database))

	// Admin
	r.With(jwtMiddleware, modOrAdmin).Get("/api/admin/reports", handlers.GetReportsHandler(database))
	r.With(jwtMiddleware, modOrAdmin).Put("/api/admin/reports/{id}", handlers.UpdateReportHandler(database))
	r.With(jwtMiddleware, adminOnly).Put("/api/admin/users/{id}/suspend", handlers.SuspendUserHandler(database))

	// WebSocket
	r.With(jwtMiddleware).Get("/ws", handlers.WSHandler(hub))

	slog.Info("server starting", "port", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		slog.Error("server error", "error", err)
		os.Exit(1)
	}
}
