# Agent guide: SvelteKit web app with Seamless Auth

This is a SvelteKit single-page app (Svelte 5, `adapter-static` with an `index.html` fallback, Tailwind) whose sign-in, sessions and roles come from
[Seamless Auth](https://docs.seamlessauth.com), open source passwordless auth (passkeys, email or SMS
codes, magic links). Auth is already wired through `@seamless-auth/svelte`. Your job when extending this app
is to keep using it, not to rebuild it.

## Topology

- In a project from `seamless init`, this directory is `web/`, served on http://localhost:5173.
  Beside it, `api/` is the companion API on port 3000 and the root `docker-compose.yml` also runs
  the Seamless Auth server (5312) and Postgres (5432).
- This app never talks to the auth server directly. `@seamless-auth/svelte` calls the companion API's
  `/auth/*` routes, where the Seamless server adapter forwards to the auth server and sets
  httpOnly session cookies on the API's origin. The browser sends them on every request; no token is
  ever visible to this code.
- The API must list this app's origin in its `UI_ORIGINS` for CORS.

## Where auth lives

- `src/lib/auth.ts`: the one session, `createSeamlessAuth({ apiHost })`. The app renders only in the browser (`ssr = false` in `src/routes/+layout.ts`), so one session per module is one per visitor. It also exports the route guards, `signedInOnly` (`requireAuth(auth)` from `@seamless-auth/svelte/kit`) and `signedOutOnly` (`requireGuest(auth)`), which stand down when the app has no API origin.
- `src/routes/+layout.svelte`: `setSeamlessAuth(auth)` and `setAuthNavigator(createKitNavigator(auth))` for everything below it, or the configuration error without an API origin.
- `src/routes/(app)/`: the signed-in pages under the top bar in `+layout.svelte`. Each guarded page has a `+page.ts` with `export const load = signedInOnly;`.
- The sign-in screens are routes of their own (`src/routes/login`, `verify-email-otp`, `magic-link-sent`, `verify-magiclink`, `oauth/callback`, `passkey-login`, `register-passkey`, `verify-phone-otp`), each rendering one `Sa*` component. `login`, `passkey-login` and `magic-link-sent` load `signedOutOnly`.
- `getSeamlessAuth()` is the only source of auth state, and every property is reactive: `auth.user`, `auth.isAuthenticated`. The pages use `user`, `isAuthenticated`, `logout`, `hasScopedRole` and `authorizedFetch`.
- `src/routes/(app)/beta/+page.svelte`: calls the role-gated `/beta_users` API route with `auth.authorizedFetch`, which sends the session cookies to the API origin and nowhere else.

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
  `src/routes/(app)/+layout.svelte`.
- Roles are managed in the Seamless admin console.

## Protecting a page

Give the route a `+page.ts` (or a `+layout.ts` for a whole folder) that loads `signedInOnly`:

```ts
import { signedInOnly } from "#lib/auth.js";

export const load = signedInOnly;
```

For roles or a different redirect, build your own guard from `requireAuth(auth, { roles, redirectTo })`
in `src/lib/auth.ts`.

Read the user with `const auth = getSeamlessAuth();` and `auth.user`, check a role with
`auth.hasScopedRole("betaUser")`, and fetch protected data with `auth.authorizedFetch("/your_route")`.
Link with `resolve()` from `$app/paths`, which takes route ids such as `/(app)/beta`.

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

- SvelteKit bindings: https://github.com/fells-code/seamless-auth-react/tree/main/packages/svelte
- Securing routes: https://docs.seamlessauth.com/build/secure-routes/
- Cookies, sessions and tokens: https://docs.seamlessauth.com/reference/cookies-sessions-tokens/
- Everything, for agents: https://docs.seamlessauth.com/llms.txt
