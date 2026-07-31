---
'seamless-templates': patch
---

Fix registration failing in the Fastify API starter.

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
