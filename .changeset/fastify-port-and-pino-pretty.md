---
'seamless-templates': patch
---

Fix two boot-time footguns in the Fastify API starter.

`PORT` is read with `||` rather than `??`, so an empty `PORT=` in `.env` falls back to 3000. It
previously reached `Number("")`, which is `0`, and Fastify binds port 0 to a random free port, so the
API came up somewhere nobody was looking.

`pino-pretty` moves from `devDependencies` to `dependencies`. The logger loads it for any `NODE_ENV`
other than `production`, so an install that omitted dev dependencies, which is the usual shape of a
staging deploy, failed to boot on a missing transport target.
