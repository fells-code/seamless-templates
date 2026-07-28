# Seamless Auth Express Starter API

An Express + TypeScript + Sequelize API starter wired for [Seamless Auth](https://seamlessauth.com)
server-mode authentication.

This starter is scaffolded by the Seamless CLI:

```bash
npx seamless-cli init my-app
```

It gives you a Postgres-backed API that mounts the Seamless Auth adapter at `/auth`, resolves the
current user from the session, and protects an example route by role.

## Features

- Server-mode Seamless Auth adapter mounted at `/auth` (OAuth, magic-link, OTP, WebAuthn, logout,
  session, organization, and step-up routes).
- Automatic user resolution: `requireUser` finds or creates a local `User` keyed by the Seamless
  Auth user id, and exposes it as `req.appUser`.
- Role-based access: `GET /beta_users` is gated by `requireRole("beta_user")`.
- Sequelize + Postgres with migrations that run automatically on boot.
- Docker Compose for a local Postgres plus the API.
- ESLint (flat config) and a Node 24 / ESM TypeScript setup.

## Environment variables

The committed contract lives in [.env.example](.env.example). Copy it before running locally:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development` enables the dev messaging handlers that log OTP and magic-link tokens locally; set to `production` before deploying |
| `AUTH_SERVER_URL` | URL of your Seamless Auth server |
| `SERVE_ADMIN_CONSOLE` | `true` to serve the admin dashboard from this API at `/console`; `false` when it is hosted elsewhere |
| `UI_ORIGINS` | Comma-separated web origins allowed by CORS |
| `COOKIE_DOMAIN` | Optional cookie domain for production, for example `.example.com` |
| `COOKIE_SIGNING_KEY` | Secret used to sign API-generated cookies |
| `API_SERVICE_TOKEN` | Service token shared with Seamless Auth (from the portal) |
| `JWKS_KID` | JWKS key id the auth server signs with |
| `DATABASE_URL` | Full Postgres connection string. Wins over the `DB_*` values when set |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Postgres connection, used when `DATABASE_URL` is empty |
| `DB_SSL_REJECT_UNAUTHORIZED` | Set to `false` only for a certificate that does not chain to a public CA |
| `DB_LOGGING` | Set to `true` to log SQL in development |

### Local path

`.env.example` ships with localhost defaults, so `cp .env.example .env` is enough to run against a
local Seamless Auth server and a local Postgres. Set `API_SERVICE_TOKEN` to the value from your auth
server before calling protected routes.

### Managed path (CLI-filled)

When you scaffold with `seamless init` against a managed instance, the CLI fills the managed values
into `.env` from your logged-in profile, so the API points at the managed auth server instead of
localhost:

| `.env` key | Filled from |
| --- | --- |
| `AUTH_SERVER_URL` | `{{authServerUrl}}` (your managed instance URL) |
| `API_SERVICE_TOKEN` | `{{apiToken}}` (portal-issued service token) |
| `JWKS_KID` | `{{jwksKid}}` |
| `COOKIE_SIGNING_KEY` | `{{secret:32}}` (freshly generated per scaffold) |

The database and origin variables keep their `.env.example` defaults; adjust them for your
deployment. The placeholder contract is defined in [template.json](template.json).

## Running locally

Install dependencies and start with hot reload. The `dev` script runs pending migrations first,
creating the database if it does not exist yet:

```bash
npm install
cp .env.example .env
npm run dev
```

The API runs at `http://localhost:3000`.

You need a reachable Postgres. Use the Docker Compose stack below, or point `DB_*` at an existing
Postgres instance.

## Running with Docker Compose

The [docker-compose.yml](docker-compose.yml) brings up Postgres and the API together. It reads your
`.env`, overriding `DB_HOST` to reach Postgres over the compose network:

```bash
cp .env.example .env
npm run docker:up      # docker compose up --build
```

Follow the API logs or shut the stack down (including the database volume) with:

```bash
npm run docker:logs    # docker compose logs -f api
npm run docker:down    # docker compose down -v
```

## Database

The connection is resolved once and shared by the runtime and the migrations: `DATABASE_URL` when it
is set, otherwise the discrete `DB_*` values. The local Docker stack uses the `DB_*` path.

### Connecting to a managed Seamless database

A managed database is handed out as a connection string, and it accepts external connections over
TLS only. `sslmode=require` in the URL is what turns TLS on here, because Sequelize does not act on
`sslmode` by itself.

`seamless init` writes `DATABASE_URL` with placeholders for the user and password:

```
DATABASE_URL=postgres://USER:PASSWORD@host:5432/dbname?sslmode=require
```

Copy the real credentials from the dashboard and replace both placeholders. They are deliberately
never written to disk for you, and the CLI never asks the control plane to reveal them.

Certificate verification is on. If your database presents a certificate that does not chain to a
public CA, set `DB_SSL_REJECT_UNAUTHORIZED=false`, which drops protection against an intercepted
connection.

### Migrations

Migrations live in `migrations/` and run automatically via `scripts/runMigrations.js` on `npm run
dev` and `npm run start`. To run them by hand:

```bash
npm run migrate        # sequelize-cli db:migrate
npm run db:create      # create the database if it is missing
```

## API endpoints

| Method | Route | Description |
| --- | --- | --- |
| GET | `/` | Health check |
| ALL | `/auth/*` | Seamless Auth server-mode adapter |
| GET | `/console/*` | Seamless admin dashboard, reverse-proxied from the auth server (only when `SERVE_ADMIN_CONSOLE=true`) |
| GET | `/beta_users` | Example route, restricted to the `beta_user` role |

## Admin console

The admin dashboard can be hosted two ways:

- **Served from this API (`SERVE_ADMIN_CONSOLE=true`, the default).**
  `createSeamlessConsoleProxy` serves the dashboard at `/console`, so it loads
  from this API's origin and shares the cookie scope of `/auth`. It is mounted
  ahead of the CORS allowlist and `requireAuth`: the console is same-origin
  static content rather than a cross-origin API call, and it has to load for a
  signed-out admin who then signs in through `/auth`.
- **Hosted elsewhere (`SERVE_ADMIN_CONSOLE=false`).** The proxy is not mounted;
  run the dashboard as a standalone container (or omit it). In that case drop
  this API's origin from the auth server's `ORIGINS` and add the console's own
  origin instead.

When served from this API, there is one requirement on the auth server.
Passkey ceremonies started in the console carry this API's origin, and WebAuthn
verification checks it, so add this API's origin to the auth server's `ORIGINS`.
Without it, sign-in and step-up both fail at the finish step even though the
challenge starts normally. The RP ID (`RPID`) ignores the port, so it does not
need to change.

## Scripts

```bash
npm run dev        # run migrations, then start with hot reload
npm run build      # compile TypeScript to dist/
npm run start      # run migrations, then start the compiled build
npm run lint       # eslint src
npm run migrate    # run pending migrations
npm run db:create  # create the database if missing
```

## License

AGPL-3.0-only
