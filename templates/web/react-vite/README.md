# Seamless Auth React Starter

A Vite + React starter for building applications with Seamless Auth.

This starter is intended to be cloned directly by the Seamless CLI. It provides a minimal React app
with the Seamless Auth React SDK already wired in, plus a protected route example that works with
the companion Express starter.

## What This Starter Shows

- `AuthProvider` configured with the application API origin
- Built-in Seamless Auth routes for registration and login
- Passwordless authentication flows supported by the Seamless Auth backend
- Protected routes with `useAuth()`
- Role-based UI checks with `hasScopedRole()`
- Protected app API calls through the companion Express starter
- A session page that reads the identity, roles, step-up freshness, and passkeys behind the session

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Configuration

The app reads a single value, the API origin, from `VITE_API_URL`. The companion Express starter
mounts the Seamless Auth adapter at `/auth`, so the React SDK sends auth requests to
`${VITE_API_URL}/auth/...` and app requests to the same origin. There is no separate auth server URL
here: all traffic goes through the API.

### Local path

`.env.example` ships with a localhost default that points at the companion Express starter:

```text
VITE_API_URL=http://localhost:3000/
```

`cp .env.example .env` is enough to run against a local API.

With `VITE_API_URL` unset, the app renders a configuration page naming the variable instead of
sending every auth request to its own origin, where the failure would read as an unexplained 404.

### Managed path (CLI-filled)

When you scaffold with `seamless init` against a managed instance, the CLI fills `.env` from your
logged-in profile so the app points at the deployed API instead of localhost:

| `.env` key     | Filled from                                   |
| -------------- | --------------------------------------------- |
| `VITE_API_URL` | `{{apiUrl}}` (your project's API service URL) |

The placeholder contract is defined in [template.json](template.json).

## Seamless Auth Wiring

Wrap the app with `AuthProvider`:

```tsx
<AuthProvider apiHost={API_URL}>
  <AppRoutes />
</AuthProvider>
```

The SDK owns auth state and exposes it through `useAuth()`:

```tsx
const { isAuthenticated, user, logout } = useAuth();
```

The starter also mounts the SDK-provided auth screens through `AuthRoutes`. App routes remain
responsible for deciding which pages require authentication.

## Routes

Application routes:

- `/`
- `/about`
- `/session`
- `/beta`

Auth routes handled by the Seamless Auth React SDK, as exported in `authRoutePaths`:

- `/login`
- `/passkey-login`
- `/verify-phone-otp`
- `/verify-email-otp`
- `/verify-magiclink`
- `/oauth/callback`
- `/register-passkey`
- `/magic-link-sent`

`/verify-magiclink` and `/oauth/callback` keep their spelling because they are fixed outside the SDK:
the auth API builds the magic-link URL when it sends the email, and the callback is registered with
OAuth providers as an allowed redirect URI.

`/session` is protected and renders what the SDK knows about the current session: the issued claims,
roles, organization context, step-up freshness with its expiry, and the registered passkeys. `/beta`
is protected and checks for the `betaUser` role before calling the example API route.

## Permissions

The Session page lists the reports the API serves at `GET /reports`
(`src/components/ReportsPanel.tsx`, through `usePermissions()` from `@seamless-auth/react`) only
when the signed-in user holds the `reports:read` permission. That check only decides what to show:
the API's permission guard on `GET /reports` is what enforces, and it refuses a session without the
permission whatever the UI renders. The permissions come from the last session read, so a new grant
shows up after the next sign-in. `reports:read` is the example permission in every Seamless starter,
and the API starters serve `GET /reports` behind it.

**This needs Seamless Auth API v0.23 or later, which is not released yet.** An older API issues
access tokens with no `permissions` claim, so the user carries no permissions on API v0.22: the UI
stays hidden and the API answers 403 to everyone.

To grant it once your auth server runs v0.23:

1. Sign in to the admin console as an admin with `admin:write` (the `OWNER_EMAIL` account
   `seamless init` sets up has it), with a passkey or authenticator app enrolled: permission
   changes need a fresh step-up.
2. Add a `reportViewer` role to the instance's `available_roles`, on the console's system config page
   or with `seamless config set available_roles`. That replaces the whole list, so include the
   roles you already have (`seamless config get available_roles` shows them).
3. Create the permission `reports:read`, and grant it to the `reportViewer` instance role.
4. Give your user the `reportViewer` role.
5. Sign in again. An access token carries the permissions it was issued with, so a grant reaches
   a session at its next token.

The console's Roles page manages permissions and the roles that grant them. It is not in a
console release yet (the latest is v0.12.0), so until one ships, use the API. The page makes these calls on
the auth server, which you can also script from a stepped-up admin session:

```text
POST /admin/permissions                              {"name": "reports:read"}
PUT  /admin/roles/instance/reportViewer/permissions  {"permissions": ["reports:read"]}
```

The `PUT` replaces everything the role grants, so list any permissions it already has.

## Testing, linting, and formatting

Tests run on [Vitest](https://vitest.dev), configured in the `test` block of
[vite.config.ts](vite.config.ts), so they share the app's Vite resolution and plugins. They run in a
jsdom environment with [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro),
and [src/test/setup.ts](src/test/setup.ts) registers the jest-dom matchers and unmounts between
tests. Test files sit next to the code they cover as `*.test.ts` or `*.test.tsx`.

What ships:

- [src/lib/runtimeConfig.test.ts](src/lib/runtimeConfig.test.ts): which source wins when both the
  container injects `window.__SEAMLESS_CONFIG__` and `.env` sets `VITE_API_URL`.
- [src/lib/api.test.ts](src/lib/api.test.ts): URL joining, the error naming `VITE_API_URL` when the
  origin is unset, and that `apiFetch` sends cookies.
- [src/components/ConfigurationError.test.tsx](src/components/ConfigurationError.test.tsx): a
  component test to copy for your own screens.

Nothing here needs a running API. `fetch` is stubbed, so the suite stays fast and offline; point an
end-to-end tool at the real stack for flows that cross the network.

ESLint uses the flat config in [eslint.config.js](eslint.config.js). Prettier owns formatting, and
`eslint-config-prettier` switches off the ESLint rules that would fight it, so the two never
disagree about the same line.

## Scripts

```bash
npm run dev           # vite dev server
npm run build         # typecheck, then vite build
npm run preview       # serve the production build
npm run check         # typecheck, lint, format check, and tests
npm run typecheck     # tsc -b
npm run lint          # eslint
npm run lint:fix      # eslint --fix
npm run format        # prettier --write
npm run format:check  # prettier --check
npm test              # vitest run
npm run test:watch    # vitest in watch mode
npm run test:coverage # vitest with a v8 coverage report
```

## Docker

The production image builds the Vite app and serves it with unprivileged nginx on port 8080. Runtime config is written to
`/usr/share/nginx/html/config.js` from the container `API_URL` environment variable.

```bash
docker build -t seamless-auth-react-starter .
docker run --rm -p 8080:8080 -e API_URL=http://localhost:3000/ seamless-auth-react-starter
```

## License

Apache-2.0
