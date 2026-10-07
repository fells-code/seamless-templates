# Seamless Auth: Next.js starter

A Next.js App Router application with passwordless authentication built in.
It serves the Seamless Auth routes itself, reads the session while rendering on
the server, and protects pages before they render. There is no separate API
server: the application is the backend.

## Run it

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173. Port 5173 is the origin the local Seamless Auth
stack allows for passkeys, so keep it unless you also change the auth server's
`ORIGINS`.

In development, one-time codes and magic links are printed in the `npm run dev`
output instead of being sent, so sign-in works with no mail or SMS provider.
Replace the `messaging` handlers in `src/lib/config.ts` with real transports
before deploying.

Running this app on the host against the Docker stack `seamless init --local`
brings up needs `AUTH_SERVER_ISSUER=http://auth:5312` in `.env` (the CLI writes
it for you). The auth server signs as its compose service name while this app
reaches it at `http://localhost:5312`, and without the issuer every sign-in
fails with `Invalid signed response from Auth Server`.

## Environment

| Variable             | Purpose                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `AUTH_SERVER_URL`    | Your Seamless Auth instance                                                                          |
| `AUTH_SERVER_ISSUER` | Optional. The issuer the auth server signs with, when it differs from `AUTH_SERVER_URL` (see Run it) |
| `API_SERVICE_TOKEN`  | The secret shared with Seamless Auth, 32 characters minimum                                          |
| `JWKS_KID`           | The key id the auth server signs tokens with                                                         |
| `COOKIE_SIGNING_KEY` | Signs the session cookies, 32 characters minimum                                                     |
| `COOKIE_DOMAIN`      | Optional cookie domain for production                                                                |
| `AUTH_COOKIE_PREFIX` | Optional cookie name prefix, to run two applications on one host                                     |

`SERVE_ADMIN_CONSOLE` set to `true` serves the Seamless admin dashboard at
`/console`; set it to `false` when the console is hosted elsewhere (see Admin
console).

`SEAMLESS_VERIFY_CAPTURE` is for the Seamless conformance suite
(`seamless verify`) only. Set to `true`, it holds one-time codes and magic
links in memory instead of sending them and serves them from
`/api/verify-capture/<recipient>` (`src/lib/capture.ts`). Anyone who can reach
that route can sign in as anyone, so never set it outside that suite.

A missing or invalid value renders a page listing every problem, instead of
failing on the first request.

## How it fits together

| File                                   | What it does                                                                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/auth/[...seamless]/route.ts`  | Serves the `/auth` routes the browser SDK calls, through `@seamless-auth/nextjs`. It owns the session cookies.                    |
| `src/app/layout.tsx`                   | Resolves the session on the server and hands it to `AuthProvider` as `initialSession`, so the first paint shows who is signed in. |
| `src/proxy.ts`                         | Redirects signed-out visitors from `/session` and `/beta` to the sign-in page, before the page renders.                           |
| `src/app/api/beta-users/route.ts`      | An application route that requires the `betaUser` role, checked on the server.                                                    |
| `src/components/SignIn.tsx`            | Sign-in and account creation: passkeys, one-time codes, and magic links.                                                          |
| `src/app/verify-magiclink/page.tsx`    | Where emailed magic links land. The auth server builds the link to this path.                                                     |
| `src/app/console/[[...path]]/route.ts` | Serves the Seamless admin dashboard at `/console` when `SERVE_ADMIN_CONSOLE=true` (see Admin console).                            |

The browser talks only to this application's own origin. `AuthProvider` is
given an empty `apiHost`, so every auth request goes to `/auth` on the same
origin and the session cookies stay first-party.

### Two rules the session code follows

- **The server never refreshes a session.** `getSeamlessSession` verifies the
  access cookie and returns `null` once it expires, even when the refresh cookie
  is still valid. A refresh from the server would rotate the refresh token in a
  response the browser never sees, and the browser's next refresh would then be
  rejected as a replay, which signs the user out everywhere. The browser renews
  the session through `/auth` instead, straight after the page loads.
- **A valid refresh cookie counts as signed in** for `proxy.ts`, for the same
  reason. Otherwise a returning user would be sent to the sign-in page every
  time their access cookie expired.

### Roles

The Beta page calls `/api/beta-users`, which answers 403 unless the session has
the `betaUser` role. Grant it from the Seamless admin console (see Admin
console), then sign in
again so the new role is in your session.

## Admin console

With `SERVE_ADMIN_CONSOLE=true` (the default, and what
`seamless init --admin=api` writes), `src/app/console/[[...path]]/route.ts` serves the Seamless
admin dashboard at http://localhost:5173/console. `createSeamlessConsoleProxy`
fetches it from the auth server's `/console` and forwards only the method and
the path, never the browser's cookies. The dashboard then calls the admin
routes under `/auth` on this same origin, so it shares the session cookies and
needs no CORS. It loads for a signed-out visitor too: the dashboard signs in
through `/auth`, and the admin routes behind it require the admin role.

The auth server needs two settings for it:

- `SERVE_ADMIN_DASHBOARD=true`, so it serves the dashboard build this route
  proxies. Without it `/console` answers the auth server's 404.
- This application's origin in `ORIGINS`. Passkey ceremonies started in the
  console carry it, and WebAuthn verification checks it. The local stack
  already allows http://localhost:5173.

With `SERVE_ADMIN_CONSOLE=false`, `/console` answers 404 and nothing is
requested upstream. A dashboard on another origin cannot use this
application's `/auth`, which sends no CORS headers, so the console is either
served here or by the managed Seamless portal.

## Scripts

| Script                        | What it runs                             |
| ----------------------------- | ---------------------------------------- |
| `npm run dev`                 | The development server on port 5173      |
| `npm run build` / `npm start` | A production build, and serving it       |
| `npm run check`               | Typecheck, lint, format check, and tests |

The tests use Vitest and need no auth server or network.

## Deploying

The `Dockerfile` has two targets, both serving on port 80 with a `/health`
route:

| Command                           | Target              | Runs                                                                    |
| --------------------------------- | ------------------- | ----------------------------------------------------------------------- |
| `docker build .`                  | `dev` (the default) | `next dev`, for the local stack: source bind-mounted, codes in the logs |
| `docker build --target runtime .` | `runtime`           | the standalone production server (`output: "standalone"`)               |

Deploy the `runtime` target. Set the environment variables above at runtime;
the image runs on the Node.js runtime, which the cookie signing requires.

## License

Apache-2.0. Copyright © Fells Code, LLC.
