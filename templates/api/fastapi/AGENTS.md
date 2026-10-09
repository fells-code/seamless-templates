# Agent guide: Python (FastAPI) API with Seamless Auth

This is a FastAPI app (Python, psycopg on Postgres) whose sign-in, sessions and roles come from
[Seamless Auth](https://docs.seamlessauth.com), open source passwordless auth, through the
`seamless-auth[fastapi]` package. Auth is already wired. Your job when extending this app is to
keep using it, not to rebuild it.

## Topology

- In a project from `seamless init`, this directory is `api/`. The root `docker-compose.yml` runs
  Postgres (5432), the Seamless Auth server (5312), this API (3000), the web app (5173) and,
  depending on the admin mode, an admin dashboard (5174).
- The browser never talks to the auth server. It calls this API's `/auth/*` routes, served by
  `auth_router(auth)`, which calls the auth server with `API_SERVICE_TOKEN` and sets the session
  cookies (`<AUTH_COOKIE_PREFIX>access`, `refresh`, `ephemeral`) on this API's origin.
- The mobile starter calls the same routes with a bearer access token instead of cookies; the
  guard accepts both.
- With `SERVE_ADMIN_CONSOLE=true`, the admin dashboard is served from this API at `/console`.

## Where auth lives

- `app/main.py`: all of it.
  - `build_adapter(cfg)` builds the `seamless_auth.Adapter` from the environment, with a dev
    `deliver` hook that logs OTP codes and magic links when `APP_ENV=development`. Replace it with
    real transports before deploying.
  - `create_app(cfg)` includes `console_router(auth)` and `auth_router(auth)`, then defines the
    dependencies inside it: `session_user = RequireUser(auth)` (the session guard),
    `app_user` (finds or creates the local `db.User`, see `app/db.py`) and `require_role(role)`.
  - `build()` is the uvicorn factory: it loads `.env` and the config.
- `app/config.py`: reads and checks the environment at boot.

## Rules

- Do not write your own login, signup, logout, OTP, magic link, passkey or token refresh endpoints.
  The routes at `/auth` already serve them.
- Do not sign or verify JWTs yourself, and do not add a JWT library to do it. `RequireUser`
  verifies sessions against the auth server's keys.
- Do not store passwords or password hashes. Seamless Auth is passwordless.
- Do not set, read or parse the auth cookies by hand, and do not invent your own session cookie or
  session table.
- Use the session user's `id` as the key for your own data; never trust a user id sent in a request
  body.
- Roles are managed in the Seamless admin console, not in this database.

## Protecting a route

Define new routes inside `create_app`, where the dependencies live, and depend on them:

```python
@app.get("/beta_users", dependencies=[Depends(require_role("betaUser"))])
def beta_users(user: db.User = Depends(app_user)) -> dict[str, Any]:  # noqa: B008
```

Drop the `require_role` dependency for a route any signed-in user may call. A route that depends
on neither `session_user` nor `app_user` is public. Take `session: User = Depends(session_user)`
for the session (`id`, `email`, `phone`, `roles`) or `Depends(app_user)` for the local record.

## Configuration

All configuration is environment variables; see `.env.example`. `APP_ENV`, `LOG_LEVEL`, `PORT`,
`AUTH_SERVER_URL`, `AUTH_SERVER_ISSUER`, `API_SERVICE_TOKEN`, `JWKS_KID`, `COOKIE_SIGNING_KEY`,
`COOKIE_DOMAIN`, `AUTH_COOKIE_PREFIX`, `UI_ORIGINS`, `SERVE_ADMIN_CONSOLE`, and the database as
`DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, plus
`DB_SSL_REJECT_UNAUTHORIZED`. Never commit `.env` or hardcode these values.

## Run, test, verify

- `uv run uvicorn app.main:build --factory --reload --port 3000`: reads `.env` and serves on
  http://localhost:3000.
- `docker compose up --build`: this API plus its own Postgres, without the rest of the stack.
- Migrations are SQL files in `migrations/`, run on boot.
- Checks: `uv run ruff check .`, `uv run ruff format --check .`, `uv run mypy`, `uv run pytest`.
  Tests need no database, auth server or network; keep it that way.
- `seamless check`, from the project root: validates the project setup, Docker and the running
  services.

## Docs

- Server SDKs: https://docs.seamlessauth.com/build/server-sdks/
- Securing routes: https://docs.seamlessauth.com/build/secure-routes/
- Cookies, sessions and tokens: https://docs.seamlessauth.com/reference/cookies-sessions-tokens/
- Everything, for agents: https://docs.seamlessauth.com/llms.txt
