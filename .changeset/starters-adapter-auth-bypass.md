---
"seamless-templates": patch
---

Security: the Express, Fastify, and Next.js starters move to `@seamless-auth/express` `^0.20.0`, `@seamless-auth/fastify` `^0.11.1`, and `@seamless-auth/nextjs` `^0.4.0`, all on `@seamless-auth/core` 0.20.0. Earlier core releases accepted any adapter-signed cookie in the cookie guard, so the pre-auth cookie `/login` issues for an existing account from an email address alone passed `requireAuth` and the Next.js session helpers as that account (fixed in fells-code/seamless-auth-server#211). The previous ranges (`^0.19.1`, `^0.10.1`, `^0.3.1`) cannot resolve to a fixed release. The Next.js auth route also exports `PUT`, which the provider retirement routes use.
