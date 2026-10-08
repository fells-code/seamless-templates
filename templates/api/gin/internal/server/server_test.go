package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	seamlessauth "github.com/fells-code/seamless-auth-go"
	"github.com/gin-gonic/gin"

	"seamless-api/internal/config"
)

// upstream stands in for the auth API.
func upstream(t *testing.T) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/console":
			w.Header().Set("Content-Type", "text/html")
			_, _ = w.Write([]byte("<html>console</html>"))
		case r.URL.Path == "/login":
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error":"invalid_request"}`))
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(srv.Close)
	return srv
}

func router(t *testing.T, mutate func(*config.Config)) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)
	api := upstream(t)
	cfg := &config.Config{
		Port:              "3000",
		AuthServerURL:     api.URL,
		CookieSigningKey:  "cookie-secret-cookie-secret-cookie-secret",
		APIServiceToken:   "service-secret-service-secret-service-secret",
		JWKSKid:           "dev-main",
		CookiePrefix:      "seamless-",
		ServeAdminConsole: true,
		UIOrigins:         []string{"http://localhost:5173"},
	}
	if mutate != nil {
		mutate(cfg)
	}
	auth, err := NewAdapter(cfg)
	if err != nil {
		t.Fatal(err)
	}
	// No database: nothing in these tests gets past the session guard.
	return New(cfg, auth, nil)
}

func do(r http.Handler, method, target string, headers map[string]string, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, target, strings.NewReader(body))
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	return rec
}

func TestTheRootAnswers(t *testing.T) {
	rec := do(router(t, nil), "GET", "/", nil, "")
	if rec.Code != 200 || rec.Body.String() != "Seamless API is running." {
		t.Fatalf("%d %q", rec.Code, rec.Body.String())
	}
}

func TestTheAuthRoutesReachTheAuthAPI(t *testing.T) {
	rec := do(router(t, nil), "POST", "/auth/login", map[string]string{"Content-Type": "application/json"}, `{}`)
	if rec.Code != 400 || !strings.Contains(rec.Body.String(), "invalid_request") {
		t.Fatalf("%d %q", rec.Code, rec.Body.String())
	}
}

func TestTheConsoleIsServedWhenEnabled(t *testing.T) {
	for _, target := range []string{"/console", "/console/"} {
		rec := do(router(t, nil), "GET", target, map[string]string{"Origin": "http://elsewhere.example"}, "")
		if rec.Code != 200 || rec.Body.String() != "<html>console</html>" {
			t.Fatalf("%s: %d %q", target, rec.Code, rec.Body.String())
		}
	}
	off := router(t, func(c *config.Config) { c.ServeAdminConsole = false })
	if rec := do(off, "GET", "/console/", nil, ""); rec.Code == 200 {
		t.Fatal("served the console while it is turned off")
	}
}

func TestAppRoutesNeedASession(t *testing.T) {
	rec := do(router(t, nil), "GET", "/beta_users", nil, "")
	var body map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &body)
	if rec.Code != 401 || body["error"] != "unauthenticated" {
		t.Fatalf("%d %q", rec.Code, rec.Body.String())
	}
}

func TestCORS(t *testing.T) {
	r := router(t, nil)

	rec := do(r, "OPTIONS", "/auth/login", map[string]string{
		"Origin":                         "http://localhost:5173",
		"Access-Control-Request-Method":  "POST",
		"Access-Control-Request-Headers": "content-type",
	}, "")
	if rec.Code != 204 || rec.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" ||
		rec.Header().Get("Access-Control-Allow-Credentials") != "true" || rec.Header().Get("Access-Control-Allow-Headers") != "content-type" {
		t.Fatalf("allowed preflight: %d %v", rec.Code, rec.Header())
	}

	rec = do(r, "OPTIONS", "/auth/login", map[string]string{"Origin": "http://evil.example", "Access-Control-Request-Method": "POST"}, "")
	if rec.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatal("a foreign origin got CORS headers")
	}

	// httptest requests arrive for example.com, so this Origin is this server's own.
	rec = do(r, "POST", "/auth/login", map[string]string{"Origin": "http://example.com", "Content-Type": "application/json"}, `{}`)
	if rec.Header().Get("Access-Control-Allow-Origin") != "http://example.com" {
		t.Fatal("a same-origin request was refused")
	}
}

func TestRequireRole(t *testing.T) {
	gin.SetMode(gin.TestMode)
	for _, c := range []struct {
		roles []string
		want  int
	}{{[]string{"user", "betaUser"}, 200}, {[]string{"user"}, 403}, {nil, 403}} {
		r := gin.New()
		r.GET("/", func(ctx *gin.Context) {
			ctx.Set(sessionKey, &seamlessauth.User{ID: "u1", Roles: c.roles})
		}, requireRole("betaUser"), func(ctx *gin.Context) { ctx.Status(200) })
		if rec := do(r, "GET", "/", nil, ""); rec.Code != c.want {
			t.Fatalf("roles %v: %d, want %d", c.roles, rec.Code, c.want)
		}
	}
}
