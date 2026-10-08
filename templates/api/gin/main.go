// Command api is the Seamless Auth Gin starter API.
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

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"seamless-api/internal/config"
	"seamless-api/internal/db"
	"seamless-api/internal/server"
	"seamless-api/migrations"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	// A missing .env is fine: in Docker the variables come from the environment.
	_ = godotenv.Load()

	cfg, err := config.FromEnvironment()
	if err != nil {
		return err
	}
	if !cfg.Development {
		gin.SetMode(gin.ReleaseMode)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	auth, err := server.NewAdapter(cfg)
	if err != nil {
		return err
	}
	pool, err := db.Connect(ctx, cfg.DatabaseURL, migrations.Files)
	if err != nil {
		return err
	}
	defer pool.Close()

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           server.New(cfg, auth, pool),
		ReadHeaderTimeout: 10 * time.Second,
	}
	errs := make(chan error, 1)
	go func() {
		slog.Info("API running", "url", "http://localhost:"+cfg.Port)
		errs <- srv.ListenAndServe()
	}()

	select {
	case err := <-errs:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-ctx.Done():
		shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return srv.Shutdown(shutdown)
	}
	return nil
}
