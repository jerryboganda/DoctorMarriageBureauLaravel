package redis

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

// Client wraps redis.Client with helper methods and key namespaces.
type Client struct {
	RDB *redis.Client
}

// New initializes a new Redis connection client.
func New(ctx context.Context, redisURL string) (*Client, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse redis url: %w", err)
	}

	opts.PoolSize = 50
	opts.MinIdleConns = 10
	opts.DialTimeout = 5 * time.Second
	opts.ReadTimeout = 3 * time.Second
	opts.WriteTimeout = 3 * time.Second

	rdb := redis.NewClient(opts)

	// Ping check
	pingCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	if err := rdb.Ping(pingCtx).Err(); err != nil {
		slog.Warn("Redis initial ping failed (service might still be booting)", "err", err)
	}

	return &Client{RDB: rdb}, nil
}

// Ping checks Redis connectivity.
func (c *Client) Ping(ctx context.Context) error {
	if c.RDB == nil {
		return fmt.Errorf("redis client is nil")
	}
	return c.RDB.Ping(ctx).Err()
}

// Close gracefully closes the Redis client.
func (c *Client) Close() error {
	if c.RDB != nil {
		return c.RDB.Close()
	}
	return nil
}

// Key formats a namespaced redis key.
func Key(namespace, key string) string {
	return fmt.Sprintf("dmb:%s:%s", namespace, key)
}

// RateLimitKey generates a key for rate limiting.
func RateLimitKey(tier, identifier string) string {
	return fmt.Sprintf("dmb:ratelimit:%s:%s", tier, identifier)
}

// OTPKey generates a key for OTP storage.
func OTPKey(purpose, identifier string) string {
	return fmt.Sprintf("dmb:otp:%s:%s", purpose, identifier)
}

// StepUpKey generates a key for step-up tokens.
func StepUpKey(userID int64, tokenHash string) string {
	return fmt.Sprintf("dmb:stepup:%d:%s", userID, tokenHash)
}

// PresenceKey generates a key for user presence heartbeat.
func PresenceKey(userID int64) string {
	return fmt.Sprintf("dmb:presence:user:%d", userID)
}

// SetString sets a string key with TTL.
func (c *Client) SetString(ctx context.Context, key, val string, ttl time.Duration) error {
	if c.RDB == nil {
		return nil
	}
	return c.RDB.Set(ctx, key, val, ttl).Err()
}

// GetString retrieves a string key.
func (c *Client) GetString(ctx context.Context, key string) (string, error) {
	if c.RDB == nil {
		return "", redis.Nil
	}
	return c.RDB.Get(ctx, key).Result()
}

// Delete removes one or more keys.
func (c *Client) Delete(ctx context.Context, keys ...string) error {
	if c.RDB == nil {
		return nil
	}
	return c.RDB.Del(ctx, keys...).Err()
}

// Increment increments a key with TTL if newly created.
func (c *Client) Increment(ctx context.Context, key string, ttl time.Duration) (int64, error) {
	if c.RDB == nil {
		return 1, nil
	}
	pipe := c.RDB.Pipeline()
	incr := pipe.Incr(ctx, key)
	pipe.Expire(ctx, key, ttl)
	_, err := pipe.Exec(ctx)
	if err != nil {
		return 0, err
	}
	return incr.Val(), nil
}
