package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/doctormarriagebureau/api/internal/admin"
	"github.com/doctormarriagebureau/api/internal/auth"
	"github.com/doctormarriagebureau/api/internal/chat"
	"github.com/doctormarriagebureau/api/internal/config"
	"github.com/doctormarriagebureau/api/internal/discovery"
	"github.com/doctormarriagebureau/api/internal/engagement"
	"github.com/doctormarriagebureau/api/internal/matching"
	"github.com/doctormarriagebureau/api/internal/media"
	"github.com/doctormarriagebureau/api/internal/middleware"
	"github.com/doctormarriagebureau/api/internal/notifications"
	"github.com/doctormarriagebureau/api/internal/payments"
	"github.com/doctormarriagebureau/api/internal/public"
	"github.com/doctormarriagebureau/api/internal/profiles"
	"github.com/doctormarriagebureau/api/internal/progression"
	"github.com/doctormarriagebureau/api/internal/response"
	"github.com/doctormarriagebureau/api/platform/postgres"
	"github.com/doctormarriagebureau/api/platform/r2"
	"github.com/doctormarriagebureau/api/platform/redis"
)

var startTime = time.Now()

func main() {
	// Initialize structured logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	slog.Info("Starting Doctor Marriage Bureau API Server...")

	// 1. Load configuration
	cfg, err := config.Load()
	if err != nil {
		slog.Error("Failed to load configuration", "error", err)
		os.Exit(1)
	}
	if err := cfg.Validate(); err != nil {
		slog.Error("Configuration validation failed", "error", err)
		os.Exit(1)
	}

	// 2. Initialize Platform Services
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// PostgreSQL Pool
	pgClient, err := postgres.New(ctx, cfg.DatabaseURL, cfg.DBMaxConns, cfg.DBMinConns)
	if err != nil {
		slog.Warn("Postgres connection pool initialization warning", "error", err)
	} else {
		defer pgClient.Close()
		slog.Info("PostgreSQL connection pool initialized")
	}

	// Redis Client
	redisClient, err := redis.New(ctx, cfg.RedisURL)
	if err != nil {
		slog.Warn("Redis connection warning", "error", err)
	} else {
		defer func() { _ = redisClient.Close() }()
		slog.Info("Redis client initialized")
	}

	// Cloudflare R2 Client
	r2Client, err := r2.New(ctx, r2.Config{
		AccountID:    cfg.R2AccountID,
		AccessKeyID:  cfg.R2AccessKeyID,
		AccessSecret: cfg.R2AccessSecret,
		BucketName:   cfg.R2BucketName,
		PublicDomain: cfg.R2PublicDomain,
	})
	if err != nil {
		slog.Warn("Cloudflare R2 client initialization warning", "error", err)
	} else {
		_ = r2Client
		slog.Info("Cloudflare R2 client initialized")
	}

	// 3. Build Router & Middlewares
	router := SetupRouter(cfg, pgClient, redisClient)

	// 4. Start HTTP Server
	server := &http.Server{
		Addr:         cfg.Addr(),
		Handler:      router,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  cfg.IdleTimeout,
	}

	// Server shutdown channel
	shutdownChan := make(chan os.Signal, 1)
	signal.Notify(shutdownChan, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		slog.Info("API Server listening", "addr", cfg.Addr(), "env", cfg.AppEnv)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("HTTP server failed", "error", err)
			os.Exit(1)
		}
	}()

	// Wait for termination signal
	sig := <-shutdownChan
	slog.Info("Received shutdown signal", "signal", sig.String())

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error("Server forced to shutdown", "error", err)
	} else {
		slog.Info("Server exited gracefully")
	}
}

// SetupRouter creates and configures the Chi root router with all routes and middlewares.
func SetupRouter(cfg *config.Config, pg *postgres.Client, rdb *redis.Client) *chi.Mux {
	r := chi.NewRouter()

	// Global Middlewares
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.RequestLogger())

	// CORS Configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID"},
		ExposedHeaders:   []string{"Link", "X-Request-ID", "Retry-After"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Rate limiting middlewares
	rateAPI := middleware.RateLimiter(rdb, "api", cfg.RateLimitAPI, time.Minute)
	rateAuth := middleware.RateLimiter(rdb, "auth", cfg.RateLimitAuth, time.Minute)
	rateSens := middleware.RateLimiter(rdb, "sensitive", cfg.RateLimitSens, time.Minute)
	authMiddleware := middleware.Authenticate(pg)

	// Health Check Route
	r.Get("/api/health", func(w http.ResponseWriter, req *http.Request) {
		healthCtx, cancel := context.WithTimeout(req.Context(), 2*time.Second)
		defer cancel()

		dbStatus := "healthy"
		if pg != nil {
			if err := pg.Ping(healthCtx); err != nil {
				dbStatus = fmt.Sprintf("unhealthy: %s", err.Error())
			}
		} else {
			dbStatus = "uninitialized"
		}

		redisStatus := "healthy"
		if rdb != nil {
			if err := rdb.Ping(healthCtx); err != nil {
				redisStatus = fmt.Sprintf("unhealthy: %s", err.Error())
			}
		} else {
			redisStatus = "uninitialized"
		}

		response.OK(w, "Doctor Marriage Bureau API is online", map[string]interface{}{
			"status":     "healthy",
			"uptime_sec": int(time.Since(startTime).Seconds()),
			"timestamp":  time.Now().UTC().Format(time.RFC3339),
			"database":   dbStatus,
			"redis":      redisStatus,
			"version":    "1.0.0",
		})
	})

	// Domain API v1 Routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Use(rateAPI)

		// Shared notification service (used by several domains)
		notificationService := notifications.NewService(pg)

		// Auth & Account Security Domain
		authService := auth.NewService(pg, rdb)
		authHandler := auth.NewHandler(authService)
		authHandler.RegisterRoutes(r, authMiddleware, rateAuth, rateSens)

		// Profile Center & Medical Domain
		profileService := profiles.NewService(pg, rdb)
		profileHandler := profiles.NewHandler(profileService)
		profileHandler.RegisterRoutes(r, authMiddleware)

		// Payments: public pricing + Stripe webhook stay unauthenticated.
		paymentService := payments.NewPaymentService(pg, notificationService, cfg.StripeSecretKey, cfg.StripeWebhookSecret)
		paymentHandler := payments.NewHandler(paymentService)
		r.Get("/payments/packages", paymentHandler.HandleListPackages)
		r.Post("/payments/webhooks/stripe", paymentHandler.HandleStripeWebhook)

		// Authenticated member domains
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware)

			// Discovery & Match Intelligence
			discoveryService := discovery.NewDiscoveryService(pg)
			discoveryHandler := discovery.NewHandler(discoveryService)
			r.Mount("/discovery", discoveryHandler.Routes())

			// Real-time Chat & Presence
			chatHub := chat.NewHub()
			if rdb != nil {
				chatHub.SetRedis(rdb.RDB)
			}
			go chatHub.Run()
			chatService := chat.NewChatService(pg, chatHub, notificationService)
			chatHandler := chat.NewHandler(chatService)
			r.Mount("/chat", chatHandler.Routes())

			// Proposals, Matching & Shortlists
			matchingService := matching.NewMatchingService(pg, chatService, notificationService)
			matchingHandler := matching.NewHandler(matchingService)
			r.Mount("/interests", matchingHandler.Routes())
			r.Mount("/shortlists", matchingHandler.ShortlistRoutes())

			// Courtship Progression
			progressionService := progression.NewProgressionService(pg)
			progressionHandler := progression.NewHandler(progressionService)
			r.Mount("/progression", progressionHandler.Routes())

			// Media (disk-backed uploads + gallery access requests)
			mediaService := media.NewMediaService(pg, notificationService, cfg.UploadDir, cfg.UploadBaseURL)
			mediaHandler := media.NewHandler(mediaService)
			r.Mount("/media", mediaHandler.Routes())

			// Payments (member-facing)
			r.Mount("/payments", paymentHandler.Routes())

			// Notifications
			notificationHandler := notifications.NewHandler(notificationService)
			r.Mount("/notifications", notificationHandler.Routes())

			// Dashboard engagement: overview, referrals, family, communities, settings
			engagementService := engagement.NewService(pg)
			engagementHandler := engagement.NewHandler(engagementService)
			r.Mount("/dashboard", engagementHandler.Routes())

			// Admin (realtime, SQL-driven)
			adminService := admin.NewService(pg)
			adminHandler := admin.NewHandler(adminService)
			r.Mount("/admin", adminHandler.Routes())
		})
	})

	// Public marketing data (no auth) — mounted at /api/public (matches the
	// web app's relative fetch paths) and /api/v1/public (matches the axios
	// client's baseURL so islands can use the shared `api` instance).
	publicService := public.NewService(pg)
	publicHandler := public.NewHandler(publicService)
	r.Mount("/api/public", publicHandler.Routes())
	r.Mount("/api/v1/public", publicHandler.Routes())

	return r
}
