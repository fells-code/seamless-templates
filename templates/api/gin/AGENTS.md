# Agent guide: Go (Gin) API with Seamless Auth

This is a Gin API (Go, pgx on Postgres) whose sign-in, sessions and roles come from
[Seamless Auth](https://docs.seamlessauth.com), open source passwordless auth, through the
`github.com/fells-code/seamless-auth-go` adapter. Auth is already wired. Your job when extending
this app is to keep using it, not to rebuild it.

## Topology

- In a project from `seamless init`, this directory is `api/`. The root `docker-compose.yml` runs
  Postgres (5432), the Seamless Auth server (5312), this API (3000), the web app (5173) and,
  depending on the admin mode, an admin dashboard (5174).
- The browser never talks to the auth server. It calls this API's `/auth/*` routes, served by the
  adapter's `Handler()`, which calls the auth server with `API_SERVICE_TOKEN` and sets the session
  cookies (`<AUTH_COOKIE_PREFIX>access`, `refresh`, `ephemeral`) on this API's origin.
- The mobile starter calls the same routes with a bearer access token instead of cookies; the
  guard accepts both.
- With `SERVE_ADMIN_CONSOLE=true`, the admin dashboard is served from this API at `/console`.

## Where auth lives

- `internal/server/server.go`: all of it.
  - `NewAdapter(cfg)` builds the `*seamlessauth.Adapter` from the environment, with a dev
    `Deliver` hook that logs OTP codes and magic links when `APP_ENV=development`. Replace it with
    real transports before deploying.
  - `New(...)` mounts `auth.ConsoleHandler()` at `/console`, `cors(...)`, then `auth.Handler()` at
    `/auth`, then the `app` group guarded by `requireSession(auth)` and `requireUser(...)`.
  - `requireSession` runs `auth.RequireAuth` and stores the `*seamlessauth.User` under
    `sessionKey`. `requireUser` finds or creates the local user (`internal/db`) under `userKey`.
  - `requireRole("betaUser")` gates the example route.
- `internal/config/config.go`: reads and checks the environment at boot.
- `main.go`: startup, migrations and graceful shutdown.

## Rules

- Do not write your own login, signup, logout, OTP, magic link, passkey or token refresh handlers.
  The adapter at `/auth` already serves them.
- Do not sign or verify JWTs yourself, and do not add a JWT library to do it. `RequireAuth`
  verifies sessions against the auth server's keys.
- Do not store passwords or password hashes. Seamless Auth is passwordless.
- Do not set, read or parse the auth cookies by hand, and do not invent your own session cookie or
  session table.
- Use the session user's `ID` as the key for your own data; never trust a user id sent in a request
  body.
- Roles are managed in the Seamless admin console, not in this database.

## Protecting a route

Add routes to the `app` group in `New`, which already carries the session guard and user
resolution:

```go
app.GET("/beta_users", requireRole("betaUser"), betaContent)
```

Drop `requireRole(...)` for a route any signed-in user may call. Public routes go on `r`, not on
`app`. In a handler, the session user is `c.MustGet(sessionKey).(*seamlessauth.User)` (`ID`,
`Email`, `Phone`, `Roles`) and the local record is `c.MustGet(userKey)`.

## Configuration

All configuration is environment variables; see `.env.example`. `APP_ENV`, `PORT`,
`AUTH_SERVER_URL`, `AUTH_SERVER_ISSUER`, `API_SERVICE_TOKEN`, `JWKS_KID`, `COOKIE_SIGNING_KEY`,
`COOKIE_DOMAIN`, `AUTH_COOKIE_PREFIX`, `UI_ORIGINS`, `SERVE_ADMIN_CONSOLE`, and the database as
`DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, plus
`DB_SSL_REJECT_UNAUTHORIZED`. Never commit `.env` or hardcode these values.

## Run, test, verify

- `go run .`: reads `.env` and serves on http://localhost:3000. `air` reloads on change.
- `docker compose up --build`: this API plus its own Postgres, without the rest of the stack.
- Migrations are SQL files in `migrations/`, embedded in the binary and run on boot.
- Checks: `gofmt -l .`, `go vet ./...`, `go test ./...`. Tests need no database, auth server or
  network; keep it that way.
- `seamless check`, from the project root: validates the project setup, Docker and the running
  services.

## Docs

- Server SDKs: https://docs.seamlessauth.com/build/server-sdks/
- Securing routes: https://docs.seamlessauth.com/build/secure-routes/
- Cookies, sessions and tokens: https://docs.seamlessauth.com/reference/cookies-sessions-tokens/
- Everything, for agents: https://docs.seamlessauth.com/llms.txt
