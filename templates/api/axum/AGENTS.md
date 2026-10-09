# Agent guide: Rust (Axum) API with Seamless Auth

This is an Axum API (Rust, sqlx on Postgres) whose sign-in, sessions and roles come from
[Seamless Auth](https://docs.seamlessauth.com), open source passwordless auth, through the
`seamless-auth` crate. Auth is already wired. Your job when extending this app is to keep using
it, not to rebuild it.

## Topology

- In a project from `seamless init`, this directory is `api/`. The root `docker-compose.yml` runs
  Postgres (5432), the Seamless Auth server (5312), this API (3000), the web app (5173) and,
  depending on the admin mode, an admin dashboard (5174).
- The browser never talks to the auth server. It calls this API's `/auth/*` routes, served by the
  adapter's `router()`, which calls the auth server with `API_SERVICE_TOKEN` and sets the session
  cookies (`<AUTH_COOKIE_PREFIX>access`, `refresh`, `ephemeral`) on this API's origin.
- The mobile starter calls the same routes with a bearer access token instead of cookies; the
  guard accepts both.
- With `SERVE_ADMIN_CONSOLE=true`, the admin dashboard is served from this API at `/console`.

## Where auth lives

- `src/server.rs`: all of it.
  - `adapter(cfg)` builds the `seamless_auth::Adapter` from the environment, with a dev `deliver`
    hook that logs OTP codes and magic links when `APP_ENV=development`. Replace it with real
    transports before deploying.
  - `router(...)` nests `auth.router()` at `/auth`, merges `auth.console_router()`, and builds the
    `app` router whose routes are wrapped in `auth.require_auth()` and the `require_user`
    middleware.
  - `require_auth()` puts a `seamless_auth::User` in the request extensions. `require_user` finds
    or creates the local `db::User` (`src/db.rs`) and inserts it too.
  - `require_role("betaUser", ...)` gates the example route.
- `src/config.rs`: reads and checks the environment at boot.

## Rules

- Do not write your own login, signup, logout, OTP, magic link, passkey or token refresh handlers.
  The adapter at `/auth` already serves them.
- Do not sign or verify JWTs yourself, and do not add a JWT crate to do it. `require_auth()`
  verifies sessions against the auth server's keys.
- Do not store passwords or password hashes. Seamless Auth is passwordless.
- Do not set, read or parse the auth cookies by hand, and do not invent your own session cookie or
  session table.
- Use the session user's `id` as the key for your own data; never trust a user id sent in a request
  body.
- Roles are managed in the Seamless admin console, not in this database.

## Protecting a route

Add routes to the `app` router in `router`, **before** its `.route_layer(...)` calls. A
`route_layer` only wraps routes added ahead of it, so a route added after them is public:

```rust
.route("/beta_users", get(beta_content).route_layer(middleware::from_fn(|req, next| {
    require_role("betaUser", req, next)
})))
```

Omit the inner `route_layer` for a route any signed-in user may call. Public routes go on `root`.
In a handler, take `Extension(user): Extension<db::User>` for the local record, or
`Extension<seamless_auth::User>` for the session (`id`, `email`, `phone`, `roles`).

## Configuration

All configuration is environment variables; see `.env.example`. `APP_ENV`, `RUST_LOG`, `PORT`,
`AUTH_SERVER_URL`, `AUTH_SERVER_ISSUER`, `API_SERVICE_TOKEN`, `JWKS_KID`, `COOKIE_SIGNING_KEY`,
`COOKIE_DOMAIN`, `AUTH_COOKIE_PREFIX`, `UI_ORIGINS`, `SERVE_ADMIN_CONSOLE`, and the database as
`DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, plus
`DB_SSL_REJECT_UNAUTHORIZED`. Never commit `.env` or hardcode these values.

## Run, test, verify

- `cargo run`: reads `.env` and serves on http://localhost:3000. For reload:
  `watchexec --restart --exts rs,toml,sql -- cargo run`.
- `docker compose up --build`: this API plus its own Postgres, without the rest of the stack.
- Migrations are SQL files in `migrations/`, embedded in the binary and run on boot.
- Checks: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test`. Tests
  need no database, auth server or network; keep it that way.
- `seamless check`, from the project root: validates the project setup, Docker and the running
  services.

## Docs

- Server SDKs: https://docs.seamlessauth.com/build/server-sdks/
- Securing routes: https://docs.seamlessauth.com/build/secure-routes/
- Cookies, sessions and tokens: https://docs.seamlessauth.com/reference/cookies-sessions-tokens/
- Everything, for agents: https://docs.seamlessauth.com/llms.txt
