package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
)

type contextKey string

const (
	RequestIDKey contextKey = "request_id"
)

// responseWriterInterceptor intercepts status code and size.
type responseWriterInterceptor struct {
	http.ResponseWriter
	statusCode int
	bytesWritten int64
}

func (w *responseWriterInterceptor) WriteHeader(statusCode int) {
	w.statusCode = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}

func (w *responseWriterInterceptor) Write(b []byte) (int, error) {
	if w.statusCode == 0 {
		w.statusCode = http.StatusOK
	}
	n, err := w.ResponseWriter.Write(b)
	w.bytesWritten += int64(n)
	return n, err
}

// RequestLogger creates structured slog middleware for HTTP requests.
func RequestLogger() func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Extract or generate request ID
			reqID := r.Header.Get("X-Request-ID")
			if reqID == "" {
				reqID = uuid.New().String()
			}

			// Add request ID to response header & request context
			w.Header().Set("X-Request-ID", reqID)
			ctx := context.WithValue(r.Context(), RequestIDKey, reqID)
			r = r.WithContext(ctx)

			interceptor := &responseWriterInterceptor{
				ResponseWriter: w,
				statusCode:     http.StatusOK,
			}

			// Process request
			next.ServeHTTP(interceptor, r)

			duration := time.Since(start)
			status := interceptor.statusCode

			level := slog.LevelInfo
			if status >= 500 {
				level = slog.LevelError
			} else if status >= 400 {
				level = slog.LevelWarn
			}

			slog.Log(r.Context(), level, "HTTP request handled",
				"request_id", reqID,
				"method", r.Method,
				"path", r.URL.Path,
				"query", r.URL.RawQuery,
				"status", status,
				"duration_ms", duration.Milliseconds(),
				"bytes", interceptor.bytesWritten,
				"ip", getClientIP(r),
				"user_agent", r.UserAgent(),
			)
		})
	}
}

// GetRequestID returns the request ID from context.
func GetRequestID(ctx context.Context) string {
	if reqID, ok := ctx.Value(RequestIDKey).(string); ok {
		return reqID
	}
	return ""
}

// getClientIP extracts real client IP considering forward headers.
func getClientIP(r *http.Request) string {
	if cfIP := r.Header.Get("CF-Connecting-IP"); cfIP != "" {
		return cfIP
	}
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return xff
	}
	if xrip := r.Header.Get("X-Real-IP"); xrip != "" {
		return xrip
	}
	return r.RemoteAddr
}
