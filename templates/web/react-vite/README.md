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

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

The app expects an API origin in `.env`:

```text
VITE_API_URL=http://localhost:3000/
```

The companion Express starter mounts the Seamless Auth adapter at `/auth`, so the React SDK sends
auth requests to `${VITE_API_URL}/auth/...`.

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
- `/beta`

Auth routes handled by the Seamless Auth React SDK include:

- `/login`
- `/passKeyLogin`
- `/verifyPhoneOTP`
- `/verifyEmailOTP`
- `/verify-magiclink`
- `/registerPasskey`
- `/magiclinks-sent`

`/beta` is protected and checks for the `betaUser` role before calling the example API route.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Docker

The production image builds the Vite app and serves it with nginx. Runtime config is written to
`/usr/share/nginx/html/config.js` from the container `API_URL` environment variable.

```bash
docker build -t seamless-auth-react-starter .
docker run --rm -p 8080:80 -e API_URL=http://localhost:3000/ seamless-auth-react-starter
```

## License

AGPL-3.0-only
