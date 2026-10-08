package config

import (
	"strings"
	"testing"
)

func env(values map[string]string) func(string) string {
	return func(name string) string { return values[name] }
}

func complete() map[string]string {
	return map[string]string{
		"AUTH_SERVER_URL":    "http://localhost:5312",
		"COOKIE_SIGNING_KEY": "cookie-secret-cookie-secret-cookie-secret",
		"API_SERVICE_TOKEN":  "service-secret-service-secret-service-secret",
		"JWKS_KID":           "dev-main",
		"DB_HOST":            "localhost",
		"DB_PORT":            "5432",
		"DB_NAME":            "seamless_api",
		"DB_USER":            "myuser",
		"DB_PASSWORD":        "my pass@word",
		"UI_ORIGINS":         "http://localhost:5173, http://localhost:5174",
	}
}

func TestACompleteEnvironmentLoads(t *testing.T) {
	cfg, err := Load(env(complete()))
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Port != "3000" || cfg.CookiePrefix != "seamless-" || cfg.ServeAdminConsole || cfg.Development {
		t.Fatalf("defaults: %+v", cfg)
	}
	if len(cfg.UIOrigins) != 2 || cfg.UIOrigins[1] != "http://localhost:5174" {
		t.Fatalf("origins %v", cfg.UIOrigins)
	}
	if cfg.DatabaseURL != "postgres://myuser:my%20pass%40word@localhost:5432/seamless_api?sslmode=disable" {
		t.Fatalf("database url %q", cfg.DatabaseURL)
	}
	if cfg.Audience() != "http://localhost:5312" {
		t.Fatalf("audience %q", cfg.Audience())
	}
}

func TestEveryProblemIsReportedAtOnce(t *testing.T) {
	_, err := Load(env(map[string]string{}))
	if err == nil {
		t.Fatal("loaded an empty environment")
	}
	for _, want := range []string{"5 environment problems", "AUTH_SERVER_URL", "COOKIE_SIGNING_KEY", "API_SERVICE_TOKEN", "JWKS_KID", "Set DATABASE_URL, or all of"} {
		if !strings.Contains(err.Error(), want) {
			t.Fatalf("missing %q in %s", want, err)
		}
	}
}

func TestAPartialDatabaseConfigurationNamesWhatIsMissing(t *testing.T) {
	values := complete()
	delete(values, "DB_NAME")
	_, err := Load(env(values))
	if err == nil || !strings.Contains(err.Error(), "(missing DB_NAME)") {
		t.Fatalf("%v", err)
	}
}

func TestTheIssuerIsTheAudienceWhenSet(t *testing.T) {
	values := complete()
	values["AUTH_SERVER_ISSUER"] = "http://auth:5312"
	cfg, err := Load(env(values))
	if err != nil || cfg.Audience() != "http://auth:5312" {
		t.Fatalf("%v %v", cfg, err)
	}
}

func TestDatabaseURL(t *testing.T) {
	cases := []struct {
		name, url, reject, want, problem string
	}{
		{"wins over DB_*", "postgres://a:b@db.example:5432/app", "", "postgres://a:b@db.example:5432/app", ""},
		{"require verifies the certificate", "postgres://a:b@db.example/app?sslmode=require", "", "postgres://a:b@db.example/app?sslmode=verify-full", ""},
		{"verification can be turned off", "postgres://a:b@db.example/app?sslmode=require", "false", "postgres://a:b@db.example/app?sslmode=require", ""},
		{"explicit verify modes are kept", "postgres://a:b@db.example/app?sslmode=verify-ca", "", "postgres://a:b@db.example/app?sslmode=verify-ca", ""},
		{"placeholders are refused", "postgres://USER:PASSWORD@db.example/app", "", "", "placeholders"},
		{"not a connection string", "mysql://x", "", "", "not a valid connection string"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			values := complete()
			values["DATABASE_URL"] = c.url
			values["DB_SSL_REJECT_UNAUTHORIZED"] = c.reject
			got, problem := DatabaseURL(env(values))
			if c.problem != "" {
				if !strings.Contains(problem, c.problem) {
					t.Fatalf("problem %q", problem)
				}
				return
			}
			if problem != "" || got != c.want {
				t.Fatalf("got %q (%q), want %q", got, problem, c.want)
			}
		})
	}
}
