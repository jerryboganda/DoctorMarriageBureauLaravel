package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config contains all typed configuration values for the API service.
type Config struct {
	AppEnv         string        `json:"app_env"`
	AppPort        string        `json:"app_port"`
	AppURL         string        `json:"app_url"`
	FrontendURL    string        `json:"frontend_url"`
	ReadTimeout    time.Duration `json:"read_timeout"`
	WriteTimeout   time.Duration `json:"write_timeout"`
	IdleTimeout    time.Duration `json:"idle_timeout"`
	DatabaseURL    string        `json:"database_url"`
	DBMaxConns     int32         `json:"db_max_conns"`
	DBMinConns     int32         `json:"db_min_conns"`
	RedisURL       string        `json:"redis_url"`
	R2AccountID    string        `json:"r2_account_id"`
	R2AccessKeyID  string        `json:"r2_access_key_id"`
	R2AccessSecret string        `json:"r2_access_secret"`
	R2BucketName   string        `json:"r2_bucket_name"`
	R2PublicDomain string        `json:"r2_public_domain"`
	SanctumSecret  string        `json:"sanctum_secret"`
	TokenExpiry    time.Duration `json:"token_expiry"`
	RateLimitAPI   int           `json:"rate_limit_api"`
	RateLimitAuth  int           `json:"rate_limit_auth"`
	RateLimitSens  int           `json:"rate_limit_sens"`
	AllowedOrigins      []string      `json:"allowed_origins"`
	StripeSecretKey     string        `json:"stripe_secret_key"`
	StripeWebhookSecret string        `json:"stripe_webhook_secret"`
	UploadDir           string        `json:"upload_dir"`
	UploadBaseURL       string        `json:"upload_base_url"`
}

// Load loads configuration from environment variables, optionally reading a .env file.
func Load() (*Config, error) {
	// Best-effort attempt to load .env file
	_ = godotenv.Load()

	cfg := &Config{
		AppEnv:              getEnv("APP_ENV", "development"),
		AppPort:             getEnv("PORT", getEnv("APP_PORT", "8080")),
		AppURL:              getEnv("APP_URL", "http://localhost:8080"),
		FrontendURL:         getEnv("FRONTEND_URL", "http://localhost:3000"),
		ReadTimeout:         getDurationEnv("READ_TIMEOUT_SEC", 15) * time.Second,
		WriteTimeout:        getDurationEnv("WRITE_TIMEOUT_SEC", 15) * time.Second,
		IdleTimeout:         getDurationEnv("IDLE_TIMEOUT_SEC", 60) * time.Second,
		DatabaseURL:         getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/doctor_marriage_bureau?sslmode=disable"),
		DBMaxConns:          int32(getIntEnv("DB_MAX_CONNS", 25)),
		DBMinConns:          int32(getIntEnv("DB_MIN_CONNS", 5)),
		RedisURL:            getEnv("REDIS_URL", "redis://localhost:6379/0"),
		R2AccountID:         getEnv("R2_ACCOUNT_ID", ""),
		R2AccessKeyID:       getEnv("R2_ACCESS_KEY_ID", ""),
		R2AccessSecret:      getEnv("R2_ACCESS_KEY_SECRET", ""),
		R2BucketName:        getEnv("R2_BUCKET_NAME", "dmb-media"),
		R2PublicDomain:      getEnv("R2_PUBLIC_DOMAIN", "https://media.doctormarriagebureau.com"),
		SanctumSecret:       getEnv("SANCTUM_SECRET", "super-secret-sanctum-key-for-local-dev-min-32-chars"),
		TokenExpiry:         time.Duration(getIntEnv("TOKEN_EXPIRY_DAYS", 30)) * 24 * time.Hour,
		RateLimitAPI:        getIntEnv("RATE_LIMIT_API", 1000),
		RateLimitAuth:       getIntEnv("RATE_LIMIT_AUTH", 10),
		RateLimitSens:       getIntEnv("RATE_LIMIT_SENSITIVE", 6),
		StripeSecretKey:     getEnv("STRIPE_SECRET_KEY", "sk_test_dmb_mock_secret"),
		StripeWebhookSecret: getEnv("STRIPE_WEBHOOK_SECRET", "whsec_dmb_mock_secret"),
		UploadDir:           getEnv("UPLOAD_DIR", "./uploads"),
		UploadBaseURL:       getEnv("UPLOAD_BASE_URL", "/uploads"),
	}

	origins := getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:4321,http://127.0.0.1:3000,http://127.0.0.1:4321")
	cfg.AllowedOrigins = strings.Split(origins, ",")
	for i := range cfg.AllowedOrigins {
		cfg.AllowedOrigins[i] = strings.TrimSpace(cfg.AllowedOrigins[i])
	}

	if cfg.AppPort == "" {
		cfg.AppPort = "8080"
	}

	return cfg, nil
}

// IsProduction returns true if APP_ENV is production.
func (c *Config) IsProduction() bool {
	return strings.ToLower(c.AppEnv) == "production"
}

// Validate ensures required secrets are configured. In production, unset or
// placeholder secrets are a hard failure to avoid silently broken payments/auth.
func (c *Config) Validate() error {
	if !c.IsProduction() {
		return nil
	}
	missing := []string{}
	if c.SanctumSecret == "" || c.SanctumSecret == "super-secret-sanctum-key-for-local-dev-min-32-chars" {
		missing = append(missing, "SANCTUM_SECRET")
	}
	if c.StripeSecretKey == "" || strings.HasPrefix(c.StripeSecretKey, "sk_test_dmb_mock") {
		missing = append(missing, "STRIPE_SECRET_KEY")
	}
	if c.StripeWebhookSecret == "" || strings.HasPrefix(c.StripeWebhookSecret, "whsec_dmb_mock") {
		missing = append(missing, "STRIPE_WEBHOOK_SECRET")
	}
	if len(missing) > 0 {
		return fmt.Errorf("missing required production configuration: %s", strings.Join(missing, ", "))
	}
	return nil
}

// Addr returns the listening host and port.
func (c *Config) Addr() string {
	if strings.HasPrefix(c.AppPort, ":") {
		return c.AppPort
	}
	return fmt.Sprintf(":%s", c.AppPort)
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return defaultVal
}

func getIntEnv(key string, defaultVal int) int {
	if val, ok := os.LookupEnv(key); ok {
		if intVal, err := strconv.Atoi(val); err == nil {
			return intVal
		}
	}
	return defaultVal
}

func getDurationEnv(key string, defaultVal int) time.Duration {
	return time.Duration(getIntEnv(key, defaultVal))
}
