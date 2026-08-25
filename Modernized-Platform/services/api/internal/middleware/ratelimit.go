package middleware

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/doctormarriagebureau/api/internal/response"
	"github.com/doctormarriagebureau/api/platform/redis"
)

// MemoryRateLimiter is an in-memory fallback rate limiter.
type MemoryRateLimiter struct {
	mu      sync.Mutex
	buckets map[string][]time.Time
}

var defaultMemLimiter = &MemoryRateLimiter{
	buckets: make(map[string][]time.Time),
}

func (m *MemoryRateLimiter) allow(key string, limit int, window time.Duration) bool {
	m.mu.Lock()
	defer m.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-window)

	// Filter timestamps outside the window
	var valid []time.Time
	for _, t := range m.buckets[key] {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}

	if len(valid) >= limit {
		m.buckets[key] = valid
		return false
	}

	valid = append(valid, now)
	m.buckets[key] = valid
	return true
}

// RateLimiter creates a rate limiting middleware for a given tier and limit.
func RateLimiter(redisClient *redis.Client, tier string, limit int, window time.Duration) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := getClientIP(r)
			key := fmt.Sprintf("%s:%s", tier, ip)

			var allowed bool
			if redisClient != nil && redisClient.RDB != nil {
				redisKey := redis.RateLimitKey(tier, ip)
				ctx, cancel := context.WithTimeout(r.Context(), 1*time.Second)
				defer cancel()

				count, err := redisClient.Increment(ctx, redisKey, window)
				if err != nil {
					// Fallback to in-memory on redis error
					allowed = defaultMemLimiter.allow(key, limit, window)
				} else {
					allowed = int(count) <= limit
				}
			} else {
				allowed = defaultMemLimiter.allow(key, limit, window)
			}

			if !allowed {
				w.Header().Set("Retry-After", fmt.Sprintf("%d", int(window.Seconds())))
				response.TooManyRequests(w, fmt.Sprintf("Too many requests for %s operations. Please wait before retrying.", tier))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
