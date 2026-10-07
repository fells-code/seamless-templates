---
"seamless-templates": minor
---

The Express, Fastify, and Next.js starters can now sign in when run on the host against the `seamless init --local` Docker stack (fells-code/seamless-cli#224). The auth server there signs as `http://auth:5312` while a host-run app reaches it at `http://localhost:5312`, so every sign-in failed with `Invalid signed response from Auth Server`.

- Each starter reads an optional `AUTH_SERVER_ISSUER` (blank is unset) and passes it to the adapter as `authServerIssuer`: the Express and Fastify auth routes, `requireAuth`, and `getSeamlessUser`, and the Next.js `createSeamlessAuthHandler`. The auth server signs its issuer into `aud` as well, so it is also passed as `audience`. Unset, both stay `AUTH_SERVER_URL` as before.
- `template.json` sets `AUTH_SERVER_ISSUER` from the new `{{authServerIssuer}}` placeholder, so these starters now require seamless-cli 0.19.0 or newer.
- The starters depend on `@seamless-auth/express` `^0.19.1`, `@seamless-auth/fastify` `^0.10.1`, and `@seamless-auth/nextjs` `^0.3.1`, which have `authServerIssuer` and also check a silently refreshed token against it.
- `.env.example` and the READMEs explain when to set it.
