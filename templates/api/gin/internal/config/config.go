// Package config reads and checks this API's environment.
package config

import (
	"errors"
	"fmt"
	"log/slog"
	"net/url"
	"os"
	"strings"
)

// Config is everything the API reads from its environment.
type Config struct {
	Development       bool
	Port              string
	AuthServerURL     string
	AuthServerIssuer  string
	CookieSigningKey  string
	APIServiceToken   string
	JWKSKid           string
	CookieDomain      string
	CookiePrefix      string
	ServeAdminConsole bool
	UIOrigins         []string
	DatabaseURL       string
}

type requiredVar struct {
	name, hint string
}

var required = []requiredVar{
	{"AUTH_SERVER_URL", "The Seamless Auth instance this API trusts, for example http://localhost:5312."},
	{"COOKIE_SIGNING_KEY", "Any secret string. It signs the cookies this API issues."},
	{"API_SERVICE_TOKEN", "The secret shared with Seamless Auth. `seamless init` writes it for a local stack; managed applications issue it from the dashboard."},
	{"JWKS_KID", "The key id the auth server signs tokens with, for example dev-main."},
}

var discreteDBVars = []string{"DB_HOST", "DB_PORT", "DB_NAME", "DB_USER"}

// `seamless init` writes a managed DATABASE_URL with these literal placeholders
// in place of the credentials, which only the dashboard can show.
var credentialPlaceholders = map[string]bool{"USER": true, "PASSWORD": true}

// Load reads the environment and refuses to start on any problem, naming every
// one at once: a missing value would otherwise surface as a 500 on the first
// authenticated request rather than as a failure to boot.
func Load(getenv func(string) string) (*Config, error) {
	var problems []string
	for _, v := range required {
		if strings.TrimSpace(getenv(v.name)) == "" {
			problems = append(problems, fmt.Sprintf("%s is not set. %s", v.name, v.hint))
		}
	}

	databaseURL, dbProblem := DatabaseURL(getenv)
	if dbProblem != "" {
		problems = append(problems, dbProblem)
	}

	if len(problems) > 0 {
		heading := fmt.Sprintf("Cannot start: %d environment problems.", len(problems))
		if len(problems) == 1 {
			heading = "Cannot start: 1 environment problem."
		}
		lines := []string{"", heading, ""}
		for _, p := range problems {
			lines = append(lines, "  - "+p)
		}
		lines = append(lines, "", "Copy .env.example to .env and fill these in, then start the API again.", "")
		return nil, errors.New(strings.Join(lines, "\n"))
	}

	origins := splitList(getenv("UI_ORIGINS"))
	if len(origins) == 0 {
		slog.Warn("UI_ORIGINS is empty, so CORS will reject every browser request from another origin. Set it to your web app origin, for example http://localhost:5173.")
	}

	port := strings.TrimSpace(getenv("PORT"))
	if port == "" {
		port = "3000"
	}
	prefix := strings.TrimSpace(getenv("AUTH_COOKIE_PREFIX"))
	if prefix == "" {
		prefix = "seamless-"
	}

	return &Config{
		Development:       strings.TrimSpace(getenv("APP_ENV")) == "development",
		Port:              port,
		AuthServerURL:     strings.TrimSpace(getenv("AUTH_SERVER_URL")),
		AuthServerIssuer:  strings.TrimSpace(getenv("AUTH_SERVER_ISSUER")),
		CookieSigningKey:  getenv("COOKIE_SIGNING_KEY"),
		APIServiceToken:   getenv("API_SERVICE_TOKEN"),
		JWKSKid:           strings.TrimSpace(getenv("JWKS_KID")),
		CookieDomain:      strings.TrimSpace(getenv("COOKIE_DOMAIN")),
		CookiePrefix:      prefix,
		ServeAdminConsole: strings.TrimSpace(getenv("SERVE_ADMIN_CONSOLE")) == "true",
		UIOrigins:         origins,
		DatabaseURL:       databaseURL,
	}, nil
}

// FromEnvironment is Load over the process environment.
func FromEnvironment() (*Config, error) {
	return Load(os.Getenv)
}

func splitList(value string) []string {
	var out []string
	for _, part := range strings.Split(value, ",") {
		if part = strings.TrimSpace(part); part != "" {
			out = append(out, part)
		}
	}
	return out
}

// DatabaseURL is where this API's database lives. DATABASE_URL wins when set: a
// managed Seamless database is handed out as a connection string. Everything
// else is built from the discrete DB_* variables the local Docker stack uses.
// The second value describes what is wrong, if anything.
//
// TLS keeps certificate verification on: sslmode=require (what a managed
// database asks for) becomes verify-full, unless DB_SSL_REJECT_UNAUTHORIZED is
// false, for a database whose certificate does not chain to a public CA.
func DatabaseURL(getenv func(string) string) (string, string) {
	raw := strings.TrimSpace(getenv("DATABASE_URL"))
	if raw == "" {
		var missing []string
		for _, name := range discreteDBVars {
			if strings.TrimSpace(getenv(name)) == "" {
				missing = append(missing, name)
			}
		}
		if len(missing) > 0 {
			listed := "Set DATABASE_URL, or all of " + strings.Join(discreteDBVars, ", ")
			if len(missing) == len(discreteDBVars) {
				return "", listed + "."
			}
			return "", fmt.Sprintf("%s (missing %s).", listed, strings.Join(missing, ", "))
		}
		u := url.URL{
			Scheme:   "postgres",
			User:     url.UserPassword(getenv("DB_USER"), getenv("DB_PASSWORD")),
			Host:     getenv("DB_HOST") + ":" + getenv("DB_PORT"),
			Path:     "/" + getenv("DB_NAME"),
			RawQuery: "sslmode=disable",
		}
		return u.String(), ""
	}

	u, err := url.Parse(raw)
	if err != nil || (u.Scheme != "postgres" && u.Scheme != "postgresql") || u.Host == "" {
		return "", "DATABASE_URL is not a valid connection string. Expected postgres://user:password@host:port/database."
	}
	password, _ := u.User.Password()
	if credentialPlaceholders[u.User.Username()] || credentialPlaceholders[password] {
		return "", "DATABASE_URL still carries the USER and PASSWORD placeholders that `seamless init` wrote. Copy the real credentials from the Seamless dashboard."
	}

	query := u.Query()
	switch query.Get("sslmode") {
	case "", "disable", "allow", "prefer", "verify-ca", "verify-full":
	default:
		if strings.TrimSpace(getenv("DB_SSL_REJECT_UNAUTHORIZED")) == "false" {
			query.Set("sslmode", "require")
		} else {
			query.Set("sslmode", "verify-full")
		}
		u.RawQuery = query.Encode()
	}
	return u.String(), ""
}

// Audience is the aud the adapter expects: the auth server signs its issuer
// into aud as well as iss.
func (c *Config) Audience() string {
	if c.AuthServerIssuer != "" {
		return c.AuthServerIssuer
	}
	return c.AuthServerURL
}
