// Package db connects to Postgres, migrates it, and keeps the application's
// own record of each Seamless Auth user.
package db

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// migrationLock serializes migrations across replicas that boot together.
const migrationLock = 73_651_002

// Connect opens a pool to databaseURL, creating the database first if it does
// not exist yet (a fresh local Postgres has only the default database), then
// runs every migration not yet applied.
func Connect(ctx context.Context, databaseURL string, migrations fs.FS) (*pgxpool.Pool, error) {
	pool, err := open(ctx, databaseURL)
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "3D000" {
		slog.Info("Database does not exist yet. Creating it.")
		if err := createDatabase(ctx, databaseURL); err != nil {
			return nil, fmt.Errorf("create database: %w", err)
		}
		pool, err = open(ctx, databaseURL)
	}
	if err != nil {
		return nil, fmt.Errorf("connect to the database: %w", err)
	}
	if err := migrate(ctx, pool, migrations); err != nil {
		pool.Close()
		return nil, fmt.Errorf("migrate: %w", err)
	}
	slog.Info("Database connection established.")
	return pool, nil
}

func open(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}
	pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, err
	}
	return pool, nil
}

func createDatabase(ctx context.Context, databaseURL string) error {
	u, err := url.Parse(databaseURL)
	if err != nil {
		return err
	}
	name := strings.TrimPrefix(u.Path, "/")
	u.Path = "/postgres"
	conn, err := pgx.Connect(ctx, u.String())
	if err != nil {
		return err
	}
	defer conn.Close(ctx)
	_, err = conn.Exec(ctx, "CREATE DATABASE "+pgx.Identifier{name}.Sanitize())
	return err
}

func migrate(ctx context.Context, pool *pgxpool.Pool, migrations fs.FS) error {
	conn, err := pool.Acquire(ctx)
	if err != nil {
		return err
	}
	defer conn.Release()

	if _, err := conn.Exec(ctx, "SELECT pg_advisory_lock($1)", migrationLock); err != nil {
		return err
	}
	defer func() { _, _ = conn.Exec(context.Background(), "SELECT pg_advisory_unlock($1)", migrationLock) }()

	if _, err := conn.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		name       TEXT PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`); err != nil {
		return err
	}

	names, err := fs.Glob(migrations, "*.sql")
	if err != nil {
		return err
	}
	sort.Strings(names)
	for _, name := range names {
		var applied bool
		if err := conn.QueryRow(ctx, "SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE name = $1)", name).Scan(&applied); err != nil {
			return err
		}
		if applied {
			continue
		}
		sql, err := fs.ReadFile(migrations, name)
		if err != nil {
			return err
		}
		tx, err := conn.Begin(ctx)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, string(sql)); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("%s: %w", name, err)
		}
		if _, err := tx.Exec(ctx, "INSERT INTO schema_migrations (name) VALUES ($1)", name); err != nil {
			_ = tx.Rollback(ctx)
			return err
		}
		if err := tx.Commit(ctx); err != nil {
			return err
		}
		slog.Info("Applied migration", "name", name)
	}
	return nil
}

// User is the application's own record of a Seamless Auth user, keyed by the
// Seamless Auth user id.
type User struct {
	ID        string    `json:"id"`
	Email     *string   `json:"email"`
	Phone     *string   `json:"phone"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// FindUser returns the local user for a Seamless Auth user id, or nil.
func FindUser(ctx context.Context, pool *pgxpool.Pool, id string) (*User, error) {
	var u User
	err := pool.QueryRow(ctx,
		"SELECT id, email, phone, created_at, updated_at FROM users WHERE id = $1", id,
	).Scan(&u.ID, &u.Email, &u.Phone, &u.CreatedAt, &u.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// CreateUser records a Seamless Auth user on first sight and returns the
// record. Concurrent first requests for one user both succeed.
func CreateUser(ctx context.Context, pool *pgxpool.Pool, id string, email, phone *string) (*User, error) {
	if email != nil {
		lower := strings.ToLower(*email)
		email = &lower
	}
	if _, err := pool.Exec(ctx,
		"INSERT INTO users (id, email, phone) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
		id, email, phone,
	); err != nil {
		return nil, err
	}
	return FindUser(ctx, pool, id)
}
