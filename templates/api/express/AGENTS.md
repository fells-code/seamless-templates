# Agent guide: Express API with Seamless Auth

This is an Express 5 API (TypeScript, Sequelize on Postgres) whose sign-in, sessions and roles
come from [Seamless Auth](https://docs.seamlessauth.com), open source passwordless auth. Auth is
already wired. Your job when extending this app is to keep using it, not to rebuild it.

## Topology

- In a project from `seamless init`, this directory is `api/`. The root `docker-compose.yml` runs
  Postgres (5432), the Seamless Auth server (5312), this API (3000), the web app (5173) and,
  depending on the admin mode, an admin dashboard (5174).
- The browser never talks to the auth server. It calls this API's `/auth/*` routes, served by the
  `@seamless-auth/express` adapter, which calls the auth server with `API_SERVICE_TOKEN` and sets
  the session cookies (`<AUTH_COOKIE_PREFIX>access`, `refresh`, `ephemeral`) on this API's origin.
- The mobile starter calls the same routes with a bearer access token instead of cookies; the
  guard accepts both.
- With `SERVE_ADMIN_CONSOLE=true`, the admin dashboard is served from this API at `/console`.

## Where auth lives

- `src/index.ts`: everything is wired here, in this order:
  - `createSeamlessAuthServer(seamlessAuthOptions)` mounted at `/auth`.
  - `createSeamlessConsoleProxy` at `/console`.
  - `requireAuth({...})`, which rejects requests without a valid session and sets `req.user`.
  - `requireUser(seamlessAuthOptions)`, which sets `req.appUser`.
  - `requireRole("betaUser")` on `/beta_users`.
- `src/middleware/requireUser.ts`: resolves the Seamless user with `getSeamlessUser(req, opts)` and
  finds or creates the local `User` row (`models/user.ts`), keyed by the Seamless user id.
- `src/types/index.d.ts`: types `req.user` (`SeamlessAuthUser`) and `req.appUser`.
- `src/lib/env.ts`: `assertEnvironment()` fails boot on missing auth or database settings.
- Dev messaging handlers in `src/index.ts` log OTP codes and magic links to this console when
  `NODE_ENV=development`. Replace them with real transports before deploying.

## Rules

- Do not write your own login, signup, logout, OTP, magic link, passkey or token refresh endpoints.
  The adapter at `/auth` already serves them.
- Do not sign or verify JWTs yourself, and do not add a JWT library to do it. `requireAuth` and
  `getSeamlessUser` verify sessions against the auth server's keys.
- Do not store passwords or password hashes. Seamless Auth is passwordless.
- Do not set, read or parse the auth cookies by hand, and do not invent your own session cookie or
  session table.
- Use the user id from the session (`req.user`) as the key for your own data; never trust a user id
  sent in a request body.
- Roles are managed in the Seamless admin console, not in this database.

## Protecting a route

Routes mounted after `requireAuth` and `requireUser` in `src/index.ts` require a session. Add new
routers there, after those two lines, the way the example does:

```ts
app.use("/beta_users", requireRole("betaUser"), beta);
```

Drop `requireRole(...)` for a route any signed-in user may call. Anything that must stay public
goes above the `requireAuth` call. In a handler, the signed-in user is `req.user` (from Seamless:
`id`, `email`, `phone`, `roles`) and the local record is `req.appUser`.

## Configuration

All configuration is environment variables; see `.env.example`. Auth: `AUTH_SERVER_URL`,
`AUTH_SERVER_ISSUER`, `API_SERVICE_TOKEN`, `JWKS_KID`, `COOKIE_SIGNING_KEY`, `COOKIE_DOMAIN`,
`AUTH_COOKIE_PREFIX`, `UI_ORIGINS`, `SERVE_ADMIN_CONSOLE`, `NODE_ENV`. Database: `DATABASE_URL`, or
`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, plus `DB_LOGGING` and
`DB_SSL_REJECT_UNAUTHORIZED`. Never commit `.env` or hardcode these values.

## Run, test, verify

- `npm run dev`: runs migrations, then the API with reload on http://localhost:3000.
- `npm run docker:up`: this API plus its own Postgres, without the rest of the stack.
- `npm run migrate`: Sequelize migrations under `migrations/`.
- `npm run check`: typecheck, lint, format check and Vitest. Tests need no database, auth server or
  network; keep it that way.
- `seamless check`, from the project root: validates the project setup, Docker and the running
  services.

## Docs

- Server SDKs: https://docs.seamlessauth.com/build/server-sdks/
- Securing routes: https://docs.seamlessauth.com/build/secure-routes/
- Cookies, sessions and tokens: https://docs.seamlessauth.com/reference/cookies-sessions-tokens/
- Everything, for agents: https://docs.seamlessauth.com/llms.txt
