package postgres

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Client wraps pgxpool.Pool with helper methods.
type Client struct {
	Pool *pgxpool.Pool
}

// New creates and initializes a new PostgreSQL connection pool.
func New(ctx context.Context, connString string, maxConns, minConns int32) (*Client, error) {
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("failed to parse postgres config: %w", err)
	}

	config.MaxConns = maxConns
	config.MinConns = minConns
	config.MaxConnLifetime = 1 * time.Hour
	config.MaxConnIdleTime = 30 * time.Minute
	config.HealthCheckPeriod = 1 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create pgx pool: %w", err)
	}

	// Ping database with timeout to verify connectivity
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		slog.Warn("PostgreSQL initial ping failed (service might still be booting)", "err", err)
	}

	return &Client{Pool: pool}, nil
}

// Ping checks database connectivity.
func (c *Client) Ping(ctx context.Context) error {
	if c.Pool == nil {
		return fmt.Errorf("postgres pool is nil")
	}
	return c.Pool.Ping(ctx)
}

// Close gracefully closes all connections in the pool.
func (c *Client) Close() {
	if c.Pool != nil {
		c.Pool.Close()
	}
}

// TxFunc defines a callback function executed inside a transaction.
type TxFunc func(pgx.Tx) error

// WithTransaction executes the given function inside a database transaction.
// If the function returns an error, the transaction is rolled back; otherwise, it is committed.
func (c *Client) WithTransaction(ctx context.Context, fn TxFunc) error {
	if c == nil || c.Pool == nil {
		return fmt.Errorf("postgres pool is nil")
	}

	tx, err := c.Pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback(ctx)
			panic(p) // re-throw panic after rollback
		}
	}()

	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(ctx); rbErr != nil && rbErr != pgx.ErrTxClosed {
			slog.Error("failed to rollback transaction", "err", rbErr)
		}
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
