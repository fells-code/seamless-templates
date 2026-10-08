# Seamless Auth Go (Gin) Starter API

A Go + [Gin](https://gin-gonic.com) + Postgres API starter wired for
[Seamless Auth](https://seamlessauth.com) server-mode authentication, on the
[seamless-auth-go](https://github.com/fells-code/seamless-auth-go) adapter.

This starter is scaffolded by the Seamless CLI:

```bash
npx seamless-cli init my-app --api=gin
```

It gives you a Postgres-backed API that mounts the Seamless Auth adapter at `/auth`, resolves the
current user from the session, and protects an example route by role. It mirrors the Express
starter, so the web and mobile starters work with it unchanged.

## Features

- The Seamless Auth adapter at `/auth`: OAuth, magic link, OTP, WebAuthn, logout, session,
  organization and step-up routes, driven by the auth server's adapter manifest.
- The admin dashboard served from this API at `/console` when `SERVE_ADMIN_CONSOLE=true`.
- Automatic user resolution: every authenticated request finds or creates a local `users` row keyed
  by the Seamless Auth user id. A new row takes its email and phone from the auth server's profile.
- Role-based access: `GET /beta_users` requires the `betaUser` role.
- The session guard accepts the session cookie, or the auth server's access token as a bearer
  credential (how the mobile starter signs its requests), and blocks cross-site state changes on a
  cookie session.
- A boot-time environment check that refuses to start on missing configuration and names every
  problem at once.
- Postgres through pgx, with SQL migrations embedded in the binary and run on boot. The database
  is created on first boot if it does not exist.
- A Dockerfile with a reloading dev target (air) and a static production target, and Docker Compose
  for a local Postgres plus the API.

## Requirements

Go 1.26 or newer, and Postgres 14 or newer (the compose file runs Postgres 18).

## Environment variables

The committed contract lives in [.env.example](.env.example). Copy it before running locally:

```bash
cp .env.example .env
```

| Variable                                                  | Purpose                                                                                                                                               |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_ENV`                                                 | `development` logs OTP codes and magic links to this API's console instead of sending them; set to `production` before deploying                      |
| `PORT`                                                    | Port to listen on, 3000 by default                                                                                                                    |
| `AUTH_SERVER_URL`                                         | URL of your Seamless Auth server                                                                                                                      |
| `AUTH_SERVER_ISSUER`                                      | Optional. The issuer the auth server signs with, when it differs from `AUTH_SERVER_URL` (see Running locally)                                         |
| `SERVE_ADMIN_CONSOLE`                                     | `true` to serve the admin dashboard from this API at `/console`; `false` when it is hosted elsewhere                                                  |
| `UI_ORIGINS`                                              | Comma-separated web origins allowed by CORS                                                                                                           |
| `COOKIE_DOMAIN`                                           | Optional cookie domain for production, for example `.example.com`                                                                                     |
| `AUTH_COOKIE_PREFIX`                                      | Prefix for this application's auth cookie names, so several Seamless apps can run on one host without signing each other out. Defaults to `seamless-` |
| `COOKIE_SIGNING_KEY`                                      | Secret used to sign API-generated cookies (32 characters or more)                                                                                     |
| `API_SERVICE_TOKEN`                                       | Service token shared with Seamless Auth (32 characters or more)                                                                                       |
| `JWKS_KID`                                                | JWKS key id the auth server signs with                                                                                                                |
| `DATABASE_URL`                                            | Full Postgres connection string. Wins over the `DB_*` values when set                                                                                 |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Postgres connection, used when `DATABASE_URL` is empty                                                                                                |
| `DB_SSL_REJECT_UNAUTHORIZED`                              | Set to `false` only for a certificate that does not chain to a public CA                                                                              |

A `DATABASE_URL` with `sslmode=require` (what a managed Seamless database asks for) connects over
TLS with the certificate verified (`verify-full`). `DB_SSL_REJECT_UNAUTHORIZED=false` keeps TLS but
drops the verification.

### Managed path (CLI-filled)

When you scaffold with `seamless init` against a managed instance, the CLI fills `AUTH_SERVER_URL`,
`AUTH_SERVER_ISSUER`, `API_SERVICE_TOKEN`, `JWKS_KID` and a fresh `COOKIE_SIGNING_KEY` into `.env`,
and writes a `DATABASE_URL` whose `USER` and `PASSWORD` placeholders you copy from the dashboard.

## Running locally

With Docker:

```bash
cp .env.example .env
docker compose up --build
```

On the host, against the `seamless init` Docker stack:

```bash
cp .env.example .env
# The stack's auth server is reached at localhost:5312 but signs as http://auth:5312
echo "AUTH_SERVER_ISSUER=http://auth:5312" >> .env
go run .
```

`go run .` reads `.env` itself. For reload on change, install
[air](https://github.com/air-verse/air) and run `air`.

### Serving the admin console

With `SERVE_ADMIN_CONSOLE=true`, the dashboard loads from this API at `/console`. Add this API's
origin (for example `http://localhost:3000`) to the auth server's `ORIGINS` so passkey ceremonies
started in the console verify.

## Routes

| Method | Path          | Description                                          |
| ------ | ------------- | ---------------------------------------------------- |
| GET    | `/`           | Health check                                         |
| *      | `/auth/*`     | The Seamless Auth adapter                            |
| GET    | `/console/*`  | The admin dashboard, when `SERVE_ADMIN_CONSOLE=true` |
| GET    | `/beta_users` | Example route, restricted to the `betaUser` role     |

## Checks

```bash
gofmt -l .
go vet ./...
go test ./...
```

The tests need no database, auth server or network.

## Layout

- `main.go`: startup, configuration, the database, and graceful shutdown.
- `internal/config`: the environment and its boot-time check, and the database URL.
- `internal/db`: the connection, migrations, and the `users` table.
- `internal/server`: the router, CORS, the session guard, user resolution and roles.
- `migrations/`: SQL migrations, embedded in the binary.

## License

Apache-2.0
