# Agent guide: React (Vite) web app with Seamless Auth

This is a React 19 single-page app (Vite, React Router, Tailwind) whose sign-in, sessions and roles
come from [Seamless Auth](https://docs.seamlessauth.com), open source passwordless auth (passkeys,
email or SMS codes, magic links). Auth is already wired through `@seamless-auth/react`. Your job
when extending this app is to keep using it, not to rebuild it.

## Topology

- In a project from `seamless init`, this directory is `web/`, served on http://localhost:5173.
  Beside it, `api/` is the companion API on port 3000 and the root `docker-compose.yml` also runs
  the Seamless Auth server (5312) and Postgres (5432).
- This app never talks to the auth server directly. `AuthProvider` calls the companion API's
  `/auth/*` routes, where the Seamless server adapter forwards to the auth server and sets
  httpOnly session cookies on the API's origin. The browser sends them on every request; no token is
  ever visible to this code.
- The API must list this app's origin in its `UI_ORIGINS` for CORS.

## Where auth lives

- `src/App.tsx`: `<AuthProvider apiHost={API_URL}>` wraps the router. `RequireAuth` (defined there)
  redirects signed-out users to `/login`. The catch-all route renders `<AuthRoutes />` from
  `@seamless-auth/react/routes` inside `src/pages/Login.tsx`, which provides the whole sign-in and
  registration flow.
- `useAuth()` from `@seamless-auth/react` is the only source of auth state. The pages use `user`,
  `isAuthenticated`, `loading`, `logout`, `hasScopedRole`, `credentials`, `refreshSession` and
  `logoutAllSessions` (see `src/pages/Session.tsx` and `src/components/Navbar.tsx`).
- `src/lib/api.ts`: `apiFetch` for calls to the companion API, with `credentials: "include"` so the
  session cookie goes along. `src/lib/runtimeConfig.ts` resolves the API origin.
- `src/pages/BetaAccess.tsx`: calls the role-gated `/beta_users` API route, showing the pattern
  for protected data.

## Rules

- Do not build your own login, signup or passkey forms against raw endpoints, and do not call the
  auth server from this app. Use `<AuthRoutes />` and the `useAuth()` methods.
- Do not store tokens in `localStorage`, `sessionStorage` or non-httpOnly cookies, and do not read
  or decode JWTs here. The session lives in httpOnly cookies set by the API.
- Do not add password fields or password storage. Seamless Auth is passwordless.
- Client-side checks (`RequireAuth`, `hasScopedRole`) are for display only. Every protected API
  route must also be guarded on the server by the adapter's middleware in `api/`.
- Roles are managed in the Seamless admin console.

## Protecting a page

Wrap the route element in `RequireAuth`, as `src/App.tsx` does:

```tsx
<Route
  path="session"
  element={
    <RequireAuth>
      <Session />
    </RequireAuth>
  }
/>
```

Get the current user with `const { user, isAuthenticated } = useAuth();` and check a role with
`hasScopedRole("betaUser")`. Fetch protected data with `apiFetch<T>("/your_route")`.

## Configuration

- `VITE_API_URL` in `.env` (see `.env.example`): the companion API origin, read at build or dev
  time.
- In the container image, `API_URL` is written into `public/config.js` as
  `window.__SEAMLESS_CONFIG__` at startup by `entrypoint.sh`, and wins over `VITE_API_URL`.

## Run, test, verify

- `npm run dev`: Vite dev server on http://localhost:5173. Keep that port: it is the origin the
  local auth stack allows for passkeys.
- `npm run build`, `npm run preview`.
- `npm run check`: typecheck, lint, format check and Vitest. Tests run in jsdom with no API or auth
  server; keep it that way.
- `seamless check`, from the project root: validates the project setup, Docker and the running
  services.

## Docs

- React SDK: https://docs.seamlessauth.com/build/react-sdk/
- Securing routes: https://docs.seamlessauth.com/build/secure-routes/
- Cookies, sessions and tokens: https://docs.seamlessauth.com/reference/cookies-sessions-tokens/
- Everything, for agents: https://docs.seamlessauth.com/llms.txt
