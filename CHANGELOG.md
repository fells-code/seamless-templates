# seamless-templates

## 0.9.0

### Minor Changes

- 624e3a6: Move both API starters to PostgreSQL 18.

  `seamless-cli` now scaffolds and conformance-tests PostgreSQL 18, so a project created by
  `seamless init` was naming two different majors in the same directory: `postgres:18` in the
  CLI-generated compose file and `postgres:16-alpine` in the API starter copied in beside it. Both
  starters now pin `postgres:18-alpine`.

  The volume mount had to move with the tag. PostgreSQL 18+ images store data in a major-versioned
  subdirectory (`/var/lib/postgresql/18/docker`), so the mount is now `/var/lib/postgresql` rather than
  `/var/lib/postgresql/data`. Keeping the old path is not a cosmetic mismatch: the container treats the
  mount as unused and refuses to start with `Error: in 18+, these Docker images are configured to store
database data in a format which is compatible with "pg_ctlcluster"`. See docker-library/postgres#1259.

  This does not touch an existing project. Starter files are copied in at scaffold time, so a project
  keeps the compose file it was created with. Only newly scaffolded projects get 18, on a fresh volume.

- acedd3f: Move both React starters to `@seamless-auth/react` `^0.9.0`.

  0.9.0 makes the bundled auth screens themeable. Every colour in them now reads from a `--seamless-*`
  CSS custom property with the previous literal as its fallback, so a project can match the auth UI to
  its brand by setting those variables on `:root` or on any ancestor of `<AuthRoutes />`.

  The upgrade is additive. The public API is unchanged between 0.8.0 and 0.9.0, and a template that
  sets no variables renders exactly as it did before, so neither starter needed a source change. Both
  were installed, built, and linted against 0.9.0.

- b722574: Give every template a working test, lint, and format setup out of the box.

  All four starters (React Vite, React OAuth, Express, Fastify) now ship Vitest with tests that pass
  on a fresh `npm install`, Prettier alongside the existing ESLint config, and the same script names:
  `typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:watch`, `test:coverage`,
  and a `check` that runs the whole gate in one command.

  The tests cover the configuration and startup logic that decides whether a scaffolded project runs
  at all, and need no database, auth server, or network:

  - API starters: connection-string resolution (including `sslmode` and credential escaping) and the
    boot-time environment check, including the placeholders `seamless init` writes into a managed
    `DATABASE_URL`.
  - Web starters: API origin resolution across the container-injected config and `VITE_API_URL`, URL
    joining and error handling in `apiFetch`, and a component test. The OAuth starter also covers its
    callback route with the SDK and router stubbed.

  Also in this change:

  - ESLint now covers the whole project in the API starters rather than `src` only, and uses Node
    globals instead of browser globals. That surfaced an unused catch binding in
    `scripts/runMigrations.js`, now fixed.
  - `eslint-config-prettier` is wired in so lint and format never disagree about the same line.
  - The API starters build with a `tsconfig.build.json` that keeps tests out of `dist/`, while
    `npm run typecheck` still checks them.
  - CI runs typecheck, lint, format check, tests, and build for every template on pull requests.

## 0.8.1

### Patch Changes

- 785eb7e: Fix registration failing in the Fastify API starter.

  Registering against the scaffolded API returned a 500 with
  `TypeError: option maxAge is invalid: 300`. The auth server sends the registration response's `ttl`
  as the string `"300"`, and the Fastify adapter passes it to a cookie library that requires an
  integer. The Express starter never showed this because its adapter multiplies the value into
  milliseconds, which coerces the string.

  `@seamless-auth/core` 0.12.1 parses the lifetime before it reaches an adapter, which fixes the
  starter without waiting on the auth server to send a number. It arrives here through
  `@seamless-auth/fastify` 0.3.1.

  The template's committed lockfile is what pinned the broken version, so the lockfile change is the
  functional part of this.

## 0.8.0

### Minor Changes

- 6abdb46: Move the templates onto the Seamless SDK releases that let a user finish registration without a
  passkey.

  Registration used to end on a screen with one control on it. A user who did not want a passkey, or
  whose device could not make one, had no way forward. `@seamless-auth/react` 0.8.0 offers a skip when
  the instance has a login method other than `passkey` enabled, and says plainly when it does not.

  The web and API templates have to move together for that to work. The skip is gated on reading
  `GET /system-config/public` from the auth server, and the adapters serve routes from an explicit
  list, so the React templates on 0.8.0 need an API template that proxies the new route. A web
  template upgraded on its own would read nothing, and fall back to showing no skip at all.

  - `@seamless-auth/react` 0.7.0 to 0.8.0 in both React templates
  - `@seamless-auth/express` 0.11.0 to 0.12.0
  - `@seamless-auth/fastify` 0.2.0 to 0.3.0

### Patch Changes

- 71fb00b: Fix two boot-time footguns in the Fastify API starter.

  `PORT` is read with `||` rather than `??`, so an empty `PORT=` in `.env` falls back to 3000. It
  previously reached `Number("")`, which is `0`, and Fastify binds port 0 to a random free port, so the
  API came up somewhere nobody was looking.

  `pino-pretty` moves from `devDependencies` to `dependencies`. The logger loads it for any `NODE_ENV`
  other than `production`, so an install that omitted dev dependencies, which is the usual shape of a
  staging deploy, failed to boot on a missing transport target.

## 0.7.0

### Minor Changes

- 7eb4777: Add a Fastify API starter, so the backend prompt in `seamless init` is a real choice.

  `templates/api/fastify` serves the same surface as the Express starter, on the same Postgres and
  Sequelize setup and the same environment contract: the Seamless Auth plugin at `/auth`, the admin
  console proxied at `/console` behind `SERVE_ADMIN_CONSOLE`, a local `User` resolved from the session
  and exposed as `request.appUser`, and `GET /beta_users` gated by role. It is registered as `beta` in
  the registry, which the CLI offers and labels as such.

  Where Express orders middleware, this orders Fastify scopes, and that is the whole access-control
  story. The console proxy sits on the root instance, outside the CORS scope and the session guards,
  because it serves same-origin static content that has to load for a signed-out admin. CORS, the auth
  plugin, and the guarded routes live in an encapsulated scope below it. The guarded scope registers
  `@fastify/cookie` for itself: the auth plugin registers it too, but that registration is
  encapsulated to the auth routes, so `requireAuth` and `getSeamlessUser` in a sibling scope would
  otherwise see no cookies and reject every request.

  Logging is Fastify's own pino instance rather than a second logger alongside it, so the adapter's
  diagnostics (it logs through `request.log`) land in the same stream as the application's.

  This starter's `.env.example` ships a `COOKIE_SIGNING_KEY` and `API_SERVICE_TOKEN` that are long
  enough to boot. The adapter refuses to start on a secret under 32 characters, so the documented
  `cp .env.example .env && npm run dev` path has to start from values that clear it.

  Requires `@seamless-auth/fastify` 0.2.0 or later, the first release with `seamlessConsoleProxy`.

### Patch Changes

- a5c644d: Ship secret placeholders of at least 32 characters in the Express template's
  `.env.example`.

  `@seamless-auth/express` runs `assertSecrets` from `@seamless-auth/core`, which
  throws when `cookieSecret` or `serviceSecret` is shorter than 32 characters. The
  committed defaults were `COOKIE_SIGNING_KEY=somethingSecret` (17) and
  `API_SERVICE_TOKEN=GRAB_FROM_SEAMLESS_AUTH_PORTAL` (30), so the local path the
  README documents (`cp .env.example .env && npm run dev`) died at startup with
  "cookieSecret must be at least 32 characters". A project scaffolded by
  `seamless init` was unaffected, because the CLI fills `COOKIE_SIGNING_KEY` from
  `{{secret:32}}` and only fills `API_SERVICE_TOKEN` when there is a portal token.

  Both placeholders are now long enough to boot, and the comments state the
  minimum, matching the Fastify template.

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
