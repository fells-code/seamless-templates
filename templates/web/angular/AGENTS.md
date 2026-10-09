# Agent guide: Angular web app with Seamless Auth

This is an Angular single-page app (standalone components, signals, zoneless, Tailwind) whose sign-in, sessions and roles come from
[Seamless Auth](https://docs.seamlessauth.com), open source passwordless auth (passkeys, email or SMS
codes, magic links). Auth is already wired through `@seamless-auth/angular`. Your job when extending this app
is to keep using it, not to rebuild it.

## Topology

- In a project from `seamless init`, this directory is `web/`, served on http://localhost:5173.
  Beside it, `api/` is the companion API on port 3000 and the root `docker-compose.yml` also runs
  the Seamless Auth server (5312) and Postgres (5432).
- This app never talks to the auth server directly. `@seamless-auth/angular` calls the companion API's
  `/auth/*` routes, where the Seamless server adapter forwards to the auth server and sets
  httpOnly session cookies on the API's origin. The browser sends them on every request; no token is
  ever visible to this code.
- The API must list this app's origin in its `UI_ORIGINS` for CORS.

## Where auth lives

- `src/app/app.config.ts`: `provideSeamlessAuth(() => ({ apiHost }))` and `provideHttpClient(withInterceptors([seamlessAuthInterceptor]))`, which sends the session cookies with `HttpClient` calls to the API and nowhere else.
- `src/app/app.routes.ts`: the app's pages under `Layout` (`src/app/layout.ts`), with `canActivate: [authGuard]` on the signed-in ones, and the bundled sign-in screens from `seamlessAuthRoutes` (`@seamless-auth/angular/routes`), with `guestGuard` on the ones that start a sign-in.
- `inject(SeamlessAuth)` is the only source of auth state. Its values are signals: `auth.user()`, `auth.isAuthenticated()`. The pages use `user`, `isAuthenticated`, `logout`, `hasScopedRole` and `authorizedFetch`.
- `src/app/pages/beta.ts`: calls the role-gated `/beta_users` API route with `auth.authorizedFetch`. `HttpClient` works too, through the interceptor.
- `src/app/runtime-config.ts`: resolves the API origin. `src/app/app.ts` shows the configuration error without one.

## Rules

- Do not build your own login, signup or passkey forms against raw endpoints, and do not call the
  auth server from this app. Use the bundled screens and the session's methods.
- Do not store tokens in `localStorage`, `sessionStorage` or non-httpOnly cookies, and do not read
  or decode JWTs here. The session lives in httpOnly cookies set by the API.
- Do not add password fields or password storage. Seamless Auth is passwordless.
- Route guards and role checks here are for navigation and display only. Every protected API route
  must also be guarded on the server by the adapter's middleware in `api/`.
- The account menu's accessible names ("Open account menu", "Logout") and the home page's "You are
  signed in" are what the Seamless conformance suite drives. Keep them if you restyle
  `src/app/layout.ts`.
- Roles are managed in the Seamless admin console.

## Protecting a page

Add `canActivate: [authGuard]` to the route, as `src/app/app.routes.ts` does:

```ts
{ path: "beta", component: Beta, canActivate: [authGuard] },
```

Read the user with `inject(SeamlessAuth).user()`, check a role with `hasScopedRole("betaUser")`, and
fetch protected data with `authorizedFetch("/your_route")` or `HttpClient`.

## Configuration

- `API_URL` in `.env` (see `.env.example`): the companion API origin. The Angular CLI does not read `.env`, so `npm run dev` and `npm run build` first run `scripts/write-config.mjs`, which writes it into `public/config.js` as `window.__SEAMLESS_CONFIG__` (gitignored). In the container image, `entrypoint.sh` writes the same file from `API_URL` at startup.

## Run, test, verify

- `npm run dev`: `ng serve` on http://localhost:5173 (set in `angular.json`). Keep that port: it is the origin the local auth stack allows
  for passkeys.
- `npm run build`.
- `npm run check`: typecheck, lint, format check and the unit tests. Tests run with no API or auth
  server; keep it that way.
- `seamless check`, from the project root: validates the project setup, Docker and the running
  services.

## Docs

- Angular bindings: https://github.com/fells-code/seamless-auth-react/tree/main/packages/angular
- Securing routes: https://docs.seamlessauth.com/build/secure-routes/
- Cookies, sessions and tokens: https://docs.seamlessauth.com/reference/cookies-sessions-tokens/
- Everything, for agents: https://docs.seamlessauth.com/llms.txt
