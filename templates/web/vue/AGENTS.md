# Agent guide: Vue web app with Seamless Auth

This is a Vue 3 single-page app (Vite, Vue Router, Tailwind) whose sign-in, sessions and roles come from
[Seamless Auth](https://docs.seamlessauth.com), open source passwordless auth (passkeys, email or SMS
codes, magic links). Auth is already wired through `@seamless-auth/vue`. Your job when extending this app
is to keep using it, not to rebuild it.

## Topology

- In a project from `seamless init`, this directory is `web/`, served on http://localhost:5173.
  Beside it, `api/` is the companion API on port 3000 and the root `docker-compose.yml` also runs
  the Seamless Auth server (5312) and Postgres (5432).
- This app never talks to the auth server directly. `@seamless-auth/vue` calls the companion API's
  `/auth/*` routes, where the Seamless server adapter forwards to the auth server and sets
  httpOnly session cookies on the API's origin. The browser sends them on every request; no token is
  ever visible to this code.
- The API must list this app's origin in its `UI_ORIGINS` for CORS.

## Where auth lives

- `src/main.ts`: installs the router, then `createSeamlessAuth({ apiHost })`. Without an API origin it mounts `src/components/ConfigurationError.vue` instead.
- `src/router.ts`: the app's routes under `src/layouts/AppLayout.vue`, with `beforeEnter: authGuard` on the signed-in pages, and the bundled sign-in screens from `createSeamlessAuthRoutes()` (`@seamless-auth/vue/router`), with `guestGuard` on the ones that start a sign-in.
- `useSeamlessAuth()` is the only source of auth state. Its values are refs: `auth.user.value`, `auth.isAuthenticated.value`. The pages use `user`, `isAuthenticated`, `logout`, `hasScopedRole` and `authorizedFetch`.
- `src/views/BetaView.vue`: calls the role-gated `/beta_users` API route with `auth.authorizedFetch`, which sends the session cookies to the API origin and nowhere else.
- `src/lib/runtimeConfig.ts`: resolves the API origin.

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
  `src/layouts/AppLayout.vue`.
- Roles are managed in the Seamless admin console.

## Protecting a page

Add `beforeEnter: authGuard` to the route, as `src/router.ts` does:

```ts
{ path: "beta", component: BetaView, beforeEnter: authGuard },
```

Read the user with `const auth = useSeamlessAuth();` and `auth.user.value`, check a role with
`auth.hasScopedRole("betaUser")`, and fetch protected data with `auth.authorizedFetch("/your_route")`.

## Configuration

- `VITE_API_URL` in `.env` (see `.env.example`): the companion API origin, read at build or dev time. In the container image, `API_URL` is written into `config.js` as `window.__SEAMLESS_CONFIG__` at startup by `entrypoint.sh`, and wins over `VITE_API_URL`.

## Run, test, verify

- `npm run dev`: Vite dev server on http://localhost:5173. Keep that port: it is the origin the local auth stack allows
  for passkeys.
- `npm run build`.
- `npm run check`: typecheck, lint, format check and the unit tests. Tests run with no API or auth
  server; keep it that way.
- `seamless check`, from the project root: validates the project setup, Docker and the running
  services.

## Docs

- Vue bindings: https://github.com/fells-code/seamless-auth-react/tree/main/packages/vue
- Securing routes: https://docs.seamlessauth.com/build/secure-routes/
- Cookies, sessions and tokens: https://docs.seamlessauth.com/reference/cookies-sessions-tokens/
- Everything, for agents: https://docs.seamlessauth.com/llms.txt
