# Seamless Auth Fastify Starter API

A Fastify + TypeScript + Sequelize API starter wired for [Seamless Auth](https://seamlessauth.com)
server-mode authentication.

This starter is scaffolded by the Seamless CLI:

```bash
npx seamless-cli init my-app
```

It gives you a Postgres-backed API that registers the Seamless Auth plugin at `/auth`, resolves the
current user from the session, and protects an example route by role.

## Features

- Server-mode Seamless Auth plugin registered at `/auth` (OAuth, magic-link, OTP, WebAuthn, logout,
  session, organization, and step-up routes).
- Automatic user resolution: `requireUser` finds or creates a local `User` keyed by the Seamless
  Auth user id, and exposes it as `request.appUser`.
- Role-based access: `GET /beta_users` is gated by `requireRole("betaUser")`.
- A boot-time environment check that refuses to start on missing configuration and names every
  problem at once.
- Sequelize + Postgres with migrations that run automatically on boot.
- Docker Compose for a local Postgres plus the API.
- ESLint (flat config), Prettier, and a Node 24 / ESM TypeScript setup.
- Vitest with unit tests covering the database and environment resolution, and a single
  `npm run check` gate that runs typecheck, lint, format, and tests together.

## How the plugins are scoped

Fastify's encapsulation does the work that middleware ordering does in an Express app, so where a
plugin is registered is the whole access-control story:

```text
app                     health check at /
├── seamlessConsoleProxy    /console, no CORS, no session required
└── (api scope)             @fastify/cors
    ├── seamlessAuth        /auth/*
    └── (secured scope)     @fastify/cookie, requireAuth, requireUser
        └── beta            /beta_users, plus requireRole on the route
```

Two consequences worth knowing before you move things around:

- The console proxy sits on the root instance, outside the CORS scope. It serves same-origin static
  content rather than a cross-origin API, and it has to load for a signed-out admin.
- The secured scope registers `@fastify/cookie` itself. The auth plugin registers it too, but that
  registration is encapsulated to the auth routes, so `requireAuth` and `getSeamlessUser` in a
  sibling scope would otherwise see no cookies at all and reject every request.

## Environment variables

The committed contract lives in [.env.example](.env.example). Copy it before running locally:

```bash
cp .env.example .env
```

| Variable                                                  | Purpose                                                                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                | `development` enables the dev messaging handlers that log OTP and magic-link tokens locally; set to `production` before deploying |
| `AUTH_SERVER_URL`                                         | URL of your Seamless Auth server                                                                                                  |
| `SERVE_ADMIN_CONSOLE`                                     | `true` to serve the admin dashboard from this API at `/console`; `false` when it is hosted elsewhere                              |
| `UI_ORIGINS`                                              | Comma-separated web origins allowed by CORS                                                                                       |
| `COOKIE_DOMAIN`                                           | Optional cookie domain for production, for example `.example.com`                                                                 |
| `COOKIE_SIGNING_KEY`                                      | Secret used to sign API-generated cookies, 32 characters minimum                                                                  |
| `API_SERVICE_TOKEN`                                       | Service token shared with Seamless Auth (from the portal), 32 characters minimum                                                  |
| `JWKS_KID`                                                | JWKS key id the auth server signs with                                                                                            |
| `DATABASE_URL`                                            | Full Postgres connection string. Wins over the `DB_*` values when set                                                             |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Postgres connection, used when `DATABASE_URL` is empty                                                                            |
| `DB_SSL_REJECT_UNAUTHORIZED`                              | Set to `false` only for a certificate that does not chain to a public CA                                                          |
| `DB_LOGGING`                                              | Set to `true` to log SQL in development                                                                                           |

`assertEnvironment` in [src/lib/env.ts](src/lib/env.ts) runs before the server is built. The auth
options are read once at startup, so a missing value would otherwise surface as a 500 on the first
authenticated request instead of as a failure to boot. It lists every problem in one message,
including a `DATABASE_URL` still carrying the `USER` and `PASSWORD` placeholders `seamless init`
writes, and warns when `UI_ORIGINS` is empty because CORS will then reject every cross-origin
browser request.

The two secrets are checked separately, by the adapter, which refuses to start on anything shorter
than 32 characters. The values in `.env.example` are long enough to boot and nothing more: replace
them before the API talks to a real auth server.

### Local path

`.env.example` ships with localhost defaults, so `cp .env.example .env` is enough to run against a
local Seamless Auth server and a local Postgres. Set `API_SERVICE_TOKEN` to the value from your auth
server before calling protected routes.

### Managed path (CLI-filled)

When you scaffold with `seamless init` against a managed instance, the CLI fills the managed values
into `.env` from your logged-in profile, so the API points at the managed auth server instead of
localhost:

| `.env` key           | Filled from                                      |
| -------------------- | ------------------------------------------------ |
| `AUTH_SERVER_URL`    | `{{authServerUrl}}` (your managed instance URL)  |
| `API_SERVICE_TOKEN`  | `{{apiToken}}` (portal-issued service token)     |
| `JWKS_KID`           | `{{jwksKid}}`                                    |
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

| Method | Route         | Description                                                                                           |
| ------ | ------------- | ----------------------------------------------------------------------------------------------------- |
| GET    | `/`           | Health check                                                                                          |
| ALL    | `/auth/*`     | Seamless Auth server-mode plugin                                                                      |
| GET    | `/console/*`  | Seamless admin dashboard, reverse-proxied from the auth server (only when `SERVE_ADMIN_CONSOLE=true`) |
| GET    | `/beta_users` | Example route, restricted to the `betaUser` role                                                      |

## Admin console

The admin dashboard can be hosted two ways:

- **Served from this API (`SERVE_ADMIN_CONSOLE=true`, the default).** `seamlessConsoleProxy` serves
  the dashboard at `/console`, so it loads from this API's origin and shares the cookie scope of
  `/auth`. It is registered on the root instance, outside the CORS scope and the session guards: the
  console is same-origin static content rather than a cross-origin API call, and it has to load for
  a signed-out admin who then signs in through `/auth`.
- **Hosted elsewhere (`SERVE_ADMIN_CONSOLE=false`).** The proxy is not registered; run the dashboard
  as a standalone container (or omit it). In that case drop this API's origin from the auth server's
  `ORIGINS` and add the console's own origin instead.

When served from this API, there is one requirement on the auth server. Passkey ceremonies started
in the console carry this API's origin, and WebAuthn verification checks it, so add this API's origin
to the auth server's `ORIGINS`. Without it, sign-in and step-up both fail at the finish step even
though the challenge starts normally. The RP ID (`RPID`) ignores the port, so it does not need to
change.

## Logging

Fastify's own logger is the only one here, so the adapter's diagnostics (it logs through
`request.log`) land in the same stream as the application's. [src/lib/logger.ts](src/lib/logger.ts)
builds the pino instance and hands it to Fastify, and `getLogger("name")` returns a child logger
tagged with the module. Outside production it is formatted by `pino-pretty`; in production it stays
as JSON for a log pipeline to parse.

## Testing, linting, and formatting

Tests run on [Vitest](https://vitest.dev). Test files sit next to the code they cover as
`*.test.ts`, so `src/lib/env.test.ts` covers `src/lib/env.ts`. There is no config file: the Vitest
defaults already pick those up and run them in a Node environment.

The shipped tests cover the two pieces of startup logic that decide whether the API can run at all,
and they need neither a database nor a running auth server:

- [src/lib/databaseUrl.test.ts](src/lib/databaseUrl.test.ts): which connection string wins, how
  credentials are escaped, and when `sslmode=require` becomes a driver option.
- [src/lib/env.test.ts](src/lib/env.test.ts): the boot-time check, including the placeholders
  `seamless init` writes into a managed `DATABASE_URL`.

Add your own alongside them. Anything that talks to Postgres or to the auth server belongs in an
integration test you run against the Docker Compose stack, not here.

ESLint uses the flat config in [eslint.config.ts](eslint.config.ts) and covers the whole project,
including `models/`, `migrations/`, and `scripts/`. Prettier owns formatting, and
`eslint-config-prettier` switches off the ESLint rules that would fight it, so the two never
disagree about the same line.

`npm run build` compiles with [tsconfig.build.json](tsconfig.build.json), which excludes `*.test.ts`
so tests stay out of `dist/`. `npm run typecheck` uses the full `tsconfig.json` and does check them.

## Scripts

```bash
npm run dev           # run migrations, then start with hot reload
npm run build         # compile TypeScript to dist/
npm run start         # run migrations, then start the compiled build
npm run check         # typecheck, lint, format check, and tests
npm run typecheck     # tsc --noEmit, tests included
npm run lint          # eslint
npm run lint:fix      # eslint --fix
npm run format        # prettier --write
npm run format:check  # prettier --check
npm test              # vitest run
npm run test:watch    # vitest in watch mode
npm run test:coverage # vitest with a v8 coverage report
npm run migrate       # run pending migrations
npm run db:create     # create the database if missing
```

## License

AGPL-3.0-only
