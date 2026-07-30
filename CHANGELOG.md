# seamless-templates

## 0.6.0

### Minor Changes

- fcee28e: Move the templates onto the current Seamless packages: `@seamless-auth/react` `^0.7.0` in both React
  templates, and `@seamless-auth/express` `^0.11.0` in the Express API template.

  React 0.7.0 sources its types from `@seamless-auth/types` rather than maintaining a parallel set, so
  the session page now shows the user's last login and each passkey's registration date, both of which
  the API already sent but the older types did not describe. Timestamps are ISO strings on the wire, so
  the page no longer has to accept a `Date` that never actually arrived, and `roles` is required rather
  than optional.

  The OAuth callback screen reads the auth server's failure code through the new `getOAuthErrorCode()`
  and gives each of `oauth_missing_email`, `oauth_email_not_verified`, and `oauth_missing_subject` its
  own message. All three are conditions at the provider that retrying cannot fix, so the previous
  "please try again" was advice that could not work. Any other failure keeps the generic message.

  Express 0.11.0 needs no template changes. Its breaking change splits `error` into `errorCode` and
  `errorBody` on the handler result types, which only affects code importing handlers from
  `@seamless-auth/core` directly; the template uses `createSeamlessAuthServer`, `requireAuth`, and
  `requireRole`, whose HTTP responses are unchanged.

  Fixes the auth route paths in the React starter README, which still listed the mixed-case spellings
  (`/passKeyLogin`, `/verifyPhoneOTP`, `/verifyEmailOTP`, `/registerPasskey`, `/magiclinks-sent`) that
  SDK 0.5.0 renamed and no longer serves.

- f53c54a: Add a session inspector page to both web templates, and fail fast on missing configuration.

  Both React templates gain a protected `/session` route that renders what the SDK actually knows
  about the current session: the issued claims, roles, organization context, step-up freshness with
  its expiry, and the registered passkeys, plus buttons to re-read the session and sign out
  everywhere. The raw `JSON.stringify(user)` dump moves off the home page into a collapsed block
  there, so the first authenticated screen reads as an app rather than a debug view.

  `RequireAuth` no longer swaps in the loading screen while an already-authenticated page re-reads
  its session, which previously unmounted the page and discarded its state.

  Missing configuration now stops the templates with a message that names the variable. The Express
  API asserts `AUTH_SERVER_URL`, `COOKIE_SIGNING_KEY`, `API_SERVICE_TOKEN`, `JWKS_KID`, and its
  database settings before the server is built, reporting every problem at once instead of failing as
  a 500 on the first authenticated request; it also catches a `DATABASE_URL` still carrying the
  placeholder credentials `seamless init` writes, and warns on an empty `UI_ORIGINS`. The web
  templates render a configuration page when `VITE_API_URL` is unset, rather than pointing every auth
  request at their own origin.

### Patch Changes

- 1e62a3d: Bump both React templates (react-vite and react-oauth) to `@seamless-auth/react`
  `^0.6.0`. The only public type change in `0.6.0` is the removal of the
  `bootstrapToken` field from `RegisterInput`, which neither template used, so no
  template source changes are required.

## 0.5.0

### Minor Changes

- b256dac: The express starter now accepts a `DATABASE_URL` connection string, and enables TLS when it carries
  `sslmode=require`. A managed Seamless database is handed out as a connection string and accepts
  external connections over TLS only, which the starter could not do: it read the discrete `DB_*`
  values and set no SSL option, so a managed database was unreachable from it.

  Resolution is shared by the runtime and the migrations, so `sequelize-cli` targets the same database
  the app does. `DATABASE_URL` wins when set; the local Docker stack keeps using the `DB_*` values.

  Certificate verification stays on. `DB_SSL_REJECT_UNAUTHORIZED=false` is available for a certificate
  that does not chain to a public CA.

  `template.json` declares a `{{databaseUrl}}` env placeholder so the CLI can populate it.

### Patch Changes

- 6277b98: Drop the dev `sendBootstrapInviteEmail` handler from the Express API template.

  The Seamless Auth API removed the admin bootstrap invite flow, so it no longer emits a
  `bootstrap_invite_email` delivery and the handler could never fire. The first admin is now granted
  through `OWNER_EMAIL` instead. Scaffolded projects keep the OTP and magic-link dev handlers, and the
  `NODE_ENV` notes in `.env.example` and the template README no longer mention bootstrap-invite links.

## 0.4.0

### Minor Changes

- 1a5bd00: Set `NODE_ENV=development` in the Express template's `.env.example`.

  The template's dev messaging handlers (which log OTP, magic-link, and
  bootstrap-invite links to the API console instead of sending real email/SMS) are
  gated on `NODE_ENV === "development"`. Without the variable set, `messaging` was
  `undefined`, so the adapter never requested external delivery and local auth
  links appeared nowhere — not in the API logs and not in the CLI. Shipping the
  flag in `.env.example` (loaded via `env_file` in Docker and by `dotenv` for
  local `npm run dev`) makes local delivery work out of the box.

## 0.3.0

### Minor Changes

- e367c56: Make the Express API template's admin-console proxy opt-in via `SERVE_ADMIN_CONSOLE`.

  The `createSeamlessConsoleProxy` mount at `/console` is now gated on
  `SERVE_ADMIN_CONSOLE=true` (the default in `.env.example`). Set it to `false`
  when the dashboard is hosted elsewhere — a standalone container or not at all —
  and the proxy is skipped. This lets a scaffold choose between serving the console
  from the API and running it as a separate service without editing source.

  `template.json` exposes the flag as `{{serveAdminConsole}}` so the CLI can
  pre-configure it, and now requires `cliMin` `0.10.0`.

- 62da514: Serve the Seamless admin dashboard from the Express API template. The template
  now mounts `createSeamlessConsoleProxy` at `/console`, so the dashboard loads
  from the API's own origin and shares the cookie scope of its `/auth` routes,
  with no separate dashboard deployment.

  The proxy is mounted ahead of the CORS allowlist and `requireAuth`. The console
  is same-origin static content rather than a cross-origin API call, so gating it
  on `UI_ORIGINS` would reject the SPA's own asset requests (its module script is
  `crossorigin`, so the browser sends an `Origin` header and the allowlist returns
  an error). It also has to load for a signed-out admin, who then signs in through
  `/auth`.

- 1ee9ce6: Log OTP and magic-link tokens to the console in the Express API template when
  running in development. The template now passes a `messaging` option to
  `createSeamlessAuthServer` with dev-only handlers, which routes delivery through
  the adapter so codes appear in the API logs without a mail or SMS provider. The
  handlers are gated on `NODE_ENV=development` and must be replaced with real
  transports before deploying.
- ee3aa99: Upgrade the Express API template to Express 5 and `@seamless-auth/express` 0.8, which requires
  `express >= 5.0.0` as a peer dependency. The template's `@types/express` was already on v5, so the
  runtime and its types are now aligned.
- 4ba52b8: Update the React OAuth template for the `@seamless-auth/react` 0.5 result-object
  API. Every SDK call now resolves to `{ data, error }` instead of returning the
  payload directly or throwing, so the login page reads providers from
  `data.providers`, the provider redirect reads `data.authorizationUrl`, and the
  OAuth callback checks `error` rather than a `.catch` that the SDK no longer
  triggers. The template now depends on `@seamless-auth/react` `^0.5.0`.
- e8a8eda: Pin the templates to the published Seamless Auth SDK releases: the Express API
  template now depends on `@seamless-auth/express` `^0.9.0`, and the basic React
  (Vite) template on `@seamless-auth/react` `^0.5.0`. The React OAuth template was
  already moved to `^0.5.0` alongside its result-object migration.

### Patch Changes

- 9d291f5: Document the admin console in the Express API template README: the `/console`
  route, why the proxy is mounted ahead of CORS and `requireAuth`, and the auth
  server requirement that comes with it. Passkey ceremonies started in the console
  carry this API's origin, and WebAuthn verification checks it, so that origin has
  to be listed in the auth server's `ORIGINS` or sign-in and step-up fail at the
  finish step while the challenge starts normally.
- 58aec6c: Fix the Express template rejecting its own same-origin requests. Now that the API
  serves the admin console at `/console`, the console calls the API from the API's
  own origin. Browsers omit `Origin` on a same-origin GET but send it on
  POST/PATCH/DELETE, so with only `UI_ORIGINS` allowed the console's reads
  succeeded while every write was refused. Requests whose `Origin` matches the
  server's own host are now treated as same-origin and allowed.

  Disallowed origins are also refused by withholding the CORS headers instead of
  passing an error to the `cors` callback, which previously answered them with a
  500 and made the cause hard to read. Cross-origin preflights from unknown origins
  still receive no `Access-Control-Allow-Origin`, so they remain blocked.

- e8a4cd4: Drop the dead `issuer` option from the Express API template. `@seamless-auth/express` removes `issuer` from `SeamlessAuthServerOptions` (it moved the silent-refresh service token to the fixed M2M contract constants, so the adopter-supplied value reached nothing), and passing it is now a type error. The template no longer sets `issuer`, and `APP_ORIGIN`, whose only consumer was that option, is removed from `.env.example` and the README.

## 0.2.4

### Patch Changes

- 5cd6c21: Make the templates run cleanly and document the managed connect path.

  Express: fix the production `npm run start` path, which was broken two ways. Compiled ESM used extensionless relative imports that Node could not resolve at runtime, and the migration runner pointed at `dist/config/config.js`, which `tsc` never emits. Relative imports now carry `.js` extensions and the runner always uses the source `config/config.js`. Add the `docker-compose.yml` the README and `docker:*` scripts referenced but that did not exist (local Postgres plus the API), switch those scripts to `docker compose` (v2), and rewrite the README to match the actual template while documenting both the local and managed (CLI-filled) paths.

  Web (react-vite and react-oauth): drop the unused `VITE_AUTH_SERVER_URL` from each `template.json` and from the runtime config type. Both apps reach the auth server through the API, so `VITE_API_URL` (`{{apiUrl}}`) is the only value the CLI fills. Both READMEs now document the local and managed paths.

## 0.2.3

### Patch Changes

- f84a69c: Bump the bundled Seamless Auth SDK versions in the templates. The React templates (react-vite and react-oauth) move to `@seamless-auth/react` `^0.4.0`, which adds TOTP (authenticator app) support, and the Express template moves to `@seamless-auth/express` `^0.7.0`, which pulls in `@seamless-auth/core` `0.7.0`. Both are additive upgrades that keep the existing public APIs, so no template source changes are required.

## 0.2.2

### Patch Changes

- 10b6c42: Rename the web templates' build file from `dockerfile` to `Dockerfile` so `docker compose build` finds it on case-sensitive filesystems (Linux/CI). Previously a scaffolded project's web build failed there while working on case-insensitive macOS. Also document the `alias`, `verify.flows`, and `setup.oauth` manifest fields, and expand the react-oauth OAuth provider setup guide (including manual Apple steps).

## 0.2.1

### Patch Changes

- 65d3b43: Publish a GitHub Release on each version. When the "version packages" PR merges, the release step now creates an official GitHub Release for the new v<version> tag, with notes drawn from the matching CHANGELOG.md section, in addition to pushing the tag. The step is idempotent: it skips tag creation and release creation when either already exists.
- a5085f5: The react-oauth template now declares `setup.oauth` in its manifest, so the Seamless CLI prompts for OIDC providers and their credentials when this template is scaffolded and wires them into the auth server.

## 0.2.0

### Minor Changes

- 2d4518e: Add a react-oauth use-case template: an OAuth-first React (Vite) starter that lists the auth server's configured OAuth providers and completes the login on a callback route. Registered with alias "oauth" (for `seamless init --oauth`) and a verify block scoping its conformance to the oauth flow. Also give react-vite the alias "basic".

## 0.1.1

### Patch Changes

- 0f1fa91: Run conformance from the repo root. Add a root conformance workflow that tests the templates against the ecosystem on PRs via the seamless-cli reusable workflow, and remove the inert per-template GitHub workflow that was carried over from the standalone starter (it did nothing here and leaked into scaffolded projects).

## 0.1.0

### Minor Changes

- Initial templates release: React (Vite) and Express starters, the registry and manifest tooling, and validation plus build-smoke CI.
