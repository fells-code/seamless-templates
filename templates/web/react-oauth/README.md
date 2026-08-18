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
- A protected `/session` route that reads the issued claims, roles, organization context, step-up freshness, and registered passkeys out of `useAuth()`.

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

With `VITE_API_URL` unset, the app renders a configuration page naming the variable instead of
sending every auth request to its own origin, where the failure would read as an unexplained 404.

### Managed path (CLI-filled)

When you scaffold with `seamless init --oauth` against a managed instance, the CLI fills `.env` from
your logged-in profile so the app points at the deployed API instead of localhost:

| `.env` key     | Filled from                                   |
| -------------- | --------------------------------------------- |
| `VITE_API_URL` | `{{apiUrl}}` (your project's API service URL) |

The placeholder contract is defined in [template.json](template.json).

## Testing, linting, and formatting

Tests run on [Vitest](https://vitest.dev), configured in the `test` block of
[vite.config.ts](vite.config.ts), so they share the app's Vite resolution and plugins. They run in a
jsdom environment with [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro),
and [src/test/setup.ts](src/test/setup.ts) registers the jest-dom matchers and unmounts between
tests. Test files sit next to the code they cover as `*.test.ts` or `*.test.tsx`.

What ships:

- [src/pages/OAuthCallback.test.tsx](src/pages/OAuthCallback.test.tsx): the callback route with the
  SDK and the router stubbed, covering a successful login and each provider failure that gets its
  own message. Copy its `vi.mock` setup when you test your own pages.
- [src/lib/runtimeConfig.test.ts](src/lib/runtimeConfig.test.ts): which source wins when both the
  container injects `window.__SEAMLESS_CONFIG__` and `.env` sets `VITE_API_URL`.
- [src/lib/api.test.ts](src/lib/api.test.ts): URL joining, the error naming `VITE_API_URL` when the
  origin is unset, and that `apiFetch` sends cookies.
- [src/components/ConfigurationError.test.tsx](src/components/ConfigurationError.test.tsx): a
  component test to copy for your own screens.

Nothing here needs a running API or a real OAuth provider. The SDK and `fetch` are stubbed, so the
suite stays fast and offline; point an end-to-end tool at the real stack for the redirect itself.

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

## Key files

- `src/pages/Login.tsx` - lists providers and starts the OAuth redirect.
- `src/pages/OAuthCallback.tsx` - finishes the login on redirect back.
- `src/App.tsx` - routing and the protected route guard.
