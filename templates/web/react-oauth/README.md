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

## Configuring OAuth providers

The provider buttons are driven by your auth server: whatever OAuth providers you enable there show up here automatically, with no code changes.

### With the CLI (recommended)

`seamless init --oauth` prompts you to pick providers and paste each one's client id and secret, then wires them into the scaffolded auth server. Supported out of the box: **Google, GitHub, Microsoft, GitLab**. Providers you leave blank are scaffolded disabled for you to fill in later.

For any provider, register this redirect URI in its OAuth app:

```
http://localhost:5173/oauth/callback
```

### Adding a provider by hand

Edit the auth server environment (in `docker-compose.yml`, or `auth/.env` for local mode):

1. Add the provider to the `OAUTH_PROVIDERS` JSON array (`id`, `name`, `clientId`, `clientSecretEnv`, the authorization/token/userinfo URLs, `scopes`, and `redirectUri`), with `"enabled": true`.
2. Set the env var named by `clientSecretEnv` (for example `GOOGLE_CLIENT_SECRET`) to the client secret.

Then restart the stack. See the [Seamless Auth documentation](https://docs.seamlessauth.com) for the full provider schema.

### Apple

Sign in with Apple needs extra setup and is not offered by the CLI prompts: its client secret is a short-lived JWT you generate from your Team id, a Key id, and a `.p8` private key, and it has no userinfo endpoint (identity comes from the ID token). Configure it manually per the documentation.

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
