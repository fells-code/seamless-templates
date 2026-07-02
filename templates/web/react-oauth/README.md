# Seamless Auth React OAuth Starter

An OAuth-first Vite + React starter for [Seamless Auth](https://seamlessauth.com).

This example shows how to build a sign-in experience around OAuth providers (Google, GitHub, or any OIDC provider you enable on your auth server). It is scaffolded by the Seamless CLI:

```bash
npx seamless-cli init --oauth my-app
```

## What it demonstrates

- A focused login screen that lists the auth server's configured OAuth providers and starts the redirect (`useAuth().startOAuthLogin`).
- An `/oauth/callback` route that completes the login (`useAuth().finishOAuthLogin`) and drops the user into the app.
- A protected home route that shows the authenticated identity from the session.

The provider buttons are driven by your auth server: whatever OAuth providers you enable there show up here automatically.

## Configuring a provider

Out of the box the login screen shows a "no providers configured" message until you add an OAuth provider to your Seamless Auth server. Add one (for example Google or GitHub), then the button appears here with no code changes. See the [Seamless Auth documentation](https://docs.seamlessauth.com).

## Running

```bash
npm install
npm run dev
```

The app reads its API origin from `VITE_API_URL` (see `.env.example`). The Seamless CLI wires this up for you.

## Key files

- `src/pages/Login.tsx` - lists providers and starts the OAuth redirect.
- `src/pages/OAuthCallback.tsx` - finishes the login on redirect back.
- `src/App.tsx` - routing and the protected route guard.
