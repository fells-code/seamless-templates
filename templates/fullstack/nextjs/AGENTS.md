# Agent guide: Next.js app with Seamless Auth

This is a full-stack Next.js 16 app (App Router, Tailwind) whose sign-in, sessions and roles come
from [Seamless Auth](https://docs.seamlessauth.com), open source passwordless auth (passkeys, email
or SMS codes, magic links). It is its own backend: there is no separate API. Auth is already wired
through `@seamless-auth/nextjs` on the server and `@seamless-auth/react` in the browser. Your job
when extending this app is to keep using them, not to rebuild them.

## Topology

- In a project from `seamless init`, this directory is `web/`, served on http://localhost:5173.
  The root `docker-compose.yml` also runs the Seamless Auth server (5312) and Postgres (5432).
- The browser talks only to this app's own origin. `AuthProvider` has an empty `apiHost`, so the
  SDK calls `/auth/*` here, where `createSeamlessAuthHandler` forwards to the auth server with
  `API_SERVICE_TOKEN` and sets first-party httpOnly session cookies.
- With `SERVE_ADMIN_CONSOLE=true`, the admin dashboard is served from this app at `/console`.

## Where auth lives

- `src/app/auth/[...seamless]/route.ts`: the `/auth` routes, through `createSeamlessAuthHandler`.
- `src/lib/config.ts`: `readAuthConfig()` and `requireAuthConfig()` build the handler and session
  options from the environment, per request. The dev `messaging` handlers there print codes and
  magic links to the `npm run dev` output; replace them with real transports before deploying.
- `src/app/layout.tsx` and `src/lib/auth.ts`: `getInitialSession` resolves the session on the
  server with `getSeamlessSession` and passes it to `<AuthProvider initialSession>` in
  `src/components/Providers.tsx`.
- `src/proxy.ts`: redirects signed-out visitors to `/login` with `hasSeamlessSession`, for the
  paths in its `matcher`.
- `src/app/api/beta-users/route.ts`: an API route guarded on the server with `getSeamlessClaims`
  and `hasScopedRole`.
- `src/components/SignIn.tsx` and `src/components/VerifyMagicLink.tsx`: the sign-in UI, built on
  `useAuth()` and `useAuthClient()`.

## Rules

- Do not write your own login, signup, OTP, magic link, passkey or refresh routes. `/auth` serves
  them.
- Do not sign or verify JWTs yourself, and do not add a JWT library to do it. Use
  `getSeamlessClaims` or `getSeamlessSession` on the server.
- Never refresh a session from server code, and never call `/auth/users/me` from the server with
  the browser's cookies forwarded. That rotates the refresh token in a response the browser never
  receives, and the browser's next refresh then signs the user out. The browser refreshes itself.
- Do not store passwords, and do not set, read or parse the auth cookies by hand.
- Do not store tokens in `localStorage` or `sessionStorage`.
- Hiding UI with `useAuth()` is for display only. Every route handler or server action that returns
  protected data must check `getSeamlessClaims` itself.
- Read configuration through `src/lib/config.ts` at request time, never at module scope:
  `next build` imports route modules with no `.env`.

## Protecting a route

A route handler, as in `src/app/api/beta-users/route.ts`:

```ts
const claims = getSeamlessClaims(await cookies(), requireAuthConfig().session);
if (!claims)
  return Response.json({ error: "unauthenticated" }, { status: 401 });
if (!hasScopedRole(claims.roles, "betaUser"))
  return Response.json({ error: "forbidden" }, { status: 403 });
```

A page: add its path to the `matcher` in `src/proxy.ts` so signed-out visitors are redirected, and
still check the claims in any data it loads. In client components, the current user is
`const { user, isAuthenticated } = useAuth();`, and `useAuthorizedFetch()` calls your own API
routes (see `src/components/BetaAccess.tsx`). Roles are managed in the Seamless admin console.

## Configuration

All configuration is environment variables; see `.env.example`: `AUTH_SERVER_URL`,
`AUTH_SERVER_ISSUER`, `API_SERVICE_TOKEN`, `JWKS_KID`, `COOKIE_SIGNING_KEY`, `SERVE_ADMIN_CONSOLE`,
`COOKIE_DOMAIN`, `AUTH_COOKIE_PREFIX`. `SEAMLESS_VERIFY_CAPTURE` exists only for the CLI's
conformance suite; never set it on a deployment. Never commit `.env` or hardcode these values.

## Run, test, verify

- `npm run dev`: http://localhost:5173. Keep that port: it is the origin the local auth stack
  allows for passkeys.
- `npm run build`, `npm run start`.
- `next dev` appends a managed Next.js agent-rules block to this file when it detects a coding
  agent. Leave it in place: it points at the docs for the installed Next.js version.
- `npm run check`: typecheck, lint, format check and Vitest. Tests need no auth server or network;
  keep it that way.
- `seamless check`, from the project root: validates the project setup, Docker and the running
  services.

## Docs

- Next.js guide: https://docs.seamlessauth.com/build/nextjs/
- Securing routes: https://docs.seamlessauth.com/build/secure-routes/
- Cookies, sessions and tokens: https://docs.seamlessauth.com/reference/cookies-sessions-tokens/
- Everything, for agents: https://docs.seamlessauth.com/llms.txt
