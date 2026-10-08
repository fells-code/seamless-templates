// Package server builds the HTTP API: the Seamless Auth routes, the admin
// console, CORS, and the application's own routes behind the session guard.
package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"slices"
	"strings"
	"time"

	seamlessauth "github.com/fells-code/seamless-auth-go"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"seamless-api/internal/config"
	"seamless-api/internal/db"
)

// NewAdapter configures the Seamless Auth adapter from the environment.
func NewAdapter(cfg *config.Config) (*seamlessauth.Adapter, error) {
	opts := seamlessauth.Options{
		AuthServerURL:          cfg.AuthServerURL,
		AuthServerIssuer:       cfg.AuthServerIssuer,
		Audience:               cfg.Audience(),
		CookieSecret:           cfg.CookieSigningKey,
		ServiceSecret:          cfg.APIServiceToken,
		JWKSKid:                cfg.JWKSKid,
		CookieDomain:           cfg.CookieDomain,
		AccessCookieName:       cfg.CookiePrefix + "access",
		RefreshCookieName:      cfg.CookiePrefix + "refresh",
		RegistrationCookieName: cfg.CookiePrefix + "ephemeral",
		PreAuthCookieName:      cfg.CookiePrefix + "ephemeral",
	}
	// Delivering OTPs and magic links from this API lets you read the code
	// straight from these logs without a mail or SMS provider. Swap this for real
	// transports before deploying, and never log a live token in production.
	if cfg.Development {
		opts.Deliver = func(_ context.Context, d seamlessauth.Delivery) error {
			if d.MagicLinkURL != "" {
				slog.Info("Dev magic link", "to", d.To, "url", d.MagicLinkURL)
			} else {
				slog.Info("Dev OTP", "to", d.To, "code", d.Token)
			}
			return nil
		}
	}
	return seamlessauth.New(opts)
}

// New builds the router.
func New(cfg *config.Config, auth *seamlessauth.Adapter, pool *pgxpool.Pool) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	// /console and /console/ are both served, so neither redirects to the other.
	r.RedirectTrailingSlash = false

	r.GET("/", func(c *gin.Context) { c.String(http.StatusOK, "Seamless API is running.") })

	// Serves the Seamless admin dashboard from this API's own origin, so the SPA
	// shares the cookie scope of the /auth routes below.
	//
	// Mounted ahead of CORS on purpose. The console is same-origin static content
	// served by this API, not a cross-origin API call, so gating it on UI_ORIGINS
	// would reject the SPA's own asset requests (its module script is
	// crossorigin, so the browser sends an Origin header). It also has to load for
	// a signed-out admin, who then signs in through /auth; the dashboard's own
	// routes enforce the admin role. Serving it here requires this API's origin
	// in the auth server's ORIGINS so passkey ceremonies started in the console
	// verify (see README).
	if cfg.ServeAdminConsole {
		console := gin.WrapH(http.StripPrefix("/console", auth.ConsoleHandler()))
		r.Any("/console", console)
		r.Any("/console/*path", console)
	}

	r.Use(cors(cfg.UIOrigins))

	authRoutes := gin.WrapH(http.StripPrefix("/auth", auth.Handler()))
	r.Any("/auth", authRoutes)
	r.Any("/auth/*path", authRoutes)

	// The guard accepts the session cookie, or the auth API's access token as a
	// bearer credential, which is how the mobile starter signs its requests.
	profiles := &profileClient{url: strings.TrimRight(cfg.AuthServerURL, "/") + "/users/me", client: &http.Client{Timeout: 10 * time.Second}}
	app := r.Group("/", requireSession(auth), requireUser(pool, profiles))
	app.GET("/beta_users", requireRole("betaUser"), betaContent)

	return r
}

func betaContent(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Welcome to the beta program!",
		"access":  "You have beta_user privileges.",
		"user":    c.MustGet(userKey),
	})
}

const (
	sessionKey = "seamlessUser"
	userKey    = "appUser"
)

// requireSession runs the adapter's guard: 401 without a session, 403 for a
// cross-site state change on a cookie session.
func requireSession(auth *seamlessauth.Adapter) gin.HandlerFunc {
	return func(c *gin.Context) {
		var user *seamlessauth.User
		auth.RequireAuth(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
			user, _ = seamlessauth.UserFromContext(r.Context())
			c.Request = r
		})).ServeHTTP(c.Writer, c.Request)
		if user == nil {
			c.Abort()
			return
		}
		c.Set(sessionKey, user)
		c.Next()
	}
}

// requireUser finds or creates the application's own record of the signed-in
// user, keyed by the Seamless Auth user id. A new record takes its email and
// phone from the auth API's profile: an access token carries neither, so a
// bearer session would otherwise create a user with no contact details.
func requireUser(pool *pgxpool.Pool, profiles *profileClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		session := c.MustGet(sessionKey).(*seamlessauth.User)

		user, err := db.FindUser(ctx, pool, session.ID)
		if err == nil && user == nil {
			email, phone := optional(session.Email), optional(session.Phone)
			if profile, perr := profiles.fetch(ctx, session.Token); perr == nil {
				email, phone = optional(profile.Email), optional(profile.Phone)
			} else {
				slog.Warn("Could not fetch the user profile; recording the session's details", "error", perr)
			}
			user, err = db.CreateUser(ctx, pool, session.ID, email, phone)
		}
		if err != nil || user == nil {
			slog.Error("Could not resolve the local user", "error", err)
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"message": "Failed to create user"})
			return
		}
		c.Set(userKey, user)
		c.Next()
	}
}

func requireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		session := c.MustGet(sessionKey).(*seamlessauth.User)
		if !slices.Contains(session.Roles, role) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}

func optional(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// cors allows credentialed requests from the configured web origins. A request
// whose Origin is this server's own host is same-origin and was never a CORS
// concern: browsers send Origin on a same-origin POST, so the console's writes
// would otherwise be refused. A disallowed origin gets no CORS headers and the
// browser blocks the response; answering with an error instead would read as a
// server fault rather than a policy one.
func cors(allowed []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "" {
			c.Next()
			return
		}
		if !slices.Contains(allowed, origin) && !sameOrigin(origin, c.Request.Host) {
			slog.Warn("Unknown CORS origin", "origin", origin)
			c.Next()
			return
		}

		h := c.Writer.Header()
		h.Set("Access-Control-Allow-Origin", origin)
		h.Set("Access-Control-Allow-Credentials", "true")
		h.Add("Vary", "Origin")
		if c.Request.Method == http.MethodOptions && c.GetHeader("Access-Control-Request-Method") != "" {
			h.Set("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE")
			if requested := c.GetHeader("Access-Control-Request-Headers"); requested != "" {
				h.Set("Access-Control-Allow-Headers", requested)
				h.Add("Vary", "Access-Control-Request-Headers")
			}
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

// sameOrigin compares hosts rather than full origins, so it holds behind a
// TLS-terminating proxy where the request arrives over plain HTTP.
func sameOrigin(origin, host string) bool {
	u, err := url.Parse(origin)
	return err == nil && host != "" && strings.EqualFold(u.Host, host)
}

// profileClient reads the signed-in user's profile from the auth API.
type profileClient struct {
	url    string
	client *http.Client
}

type profile struct {
	Email string `json:"email"`
	Phone string `json:"phone"`
}

func (p *profileClient) fetch(ctx context.Context, token string) (*profile, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, p.url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")
	res, err := p.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("profile: HTTP %d", res.StatusCode)
	}
	var body struct {
		User profile `json:"user"`
	}
	if err := json.NewDecoder(io.LimitReader(res.Body, 1<<20)).Decode(&body); err != nil {
		return nil, err
	}
	return &body.User, nil
}
