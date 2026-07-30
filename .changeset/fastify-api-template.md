---
'seamless-templates': minor
---

Add a Fastify API starter, so the backend prompt in `seamless init` is a real choice.

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
