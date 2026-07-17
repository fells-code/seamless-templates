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
cp .env.example .env
npm run dev
```

The app reads a single value, the API origin, from `VITE_API_URL`. The Seamless Auth adapter is
served by the companion API at `${VITE_API_URL}/auth`, and the SDK lists OAuth providers and starts
the redirect through it. There is no separate auth server URL here: all traffic goes through the API.

### Local path

`.env.example` ships with a localhost default that points at the companion Express starter:

```text
VITE_API_URL=http://localhost:3000/
```

`cp .env.example .env` is enough to run against a local API.

### Managed path (CLI-filled)

When you scaffold with `seamless init --oauth` against a managed instance, the CLI fills `.env` from
your logged-in profile so the app points at the deployed API instead of localhost:

| `.env` key | Filled from |
| --- | --- |
| `VITE_API_URL` | `{{apiUrl}}` (your project's API service URL) |

The placeholder contract is defined in [template.json](template.json).

## Key files

- `src/pages/Login.tsx` - lists providers and starts the OAuth redirect.
- `src/pages/OAuthCallback.tsx` - finishes the login on redirect back.
- `src/App.tsx` - routing and the protected route guard.
