---
"seamless-templates": patch
---

Ship secret placeholders of at least 32 characters in the Express template's
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
