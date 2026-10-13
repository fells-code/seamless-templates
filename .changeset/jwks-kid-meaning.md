---
"seamless-templates": patch
---

Describe `JWKS_KID` correctly in the Express, Fastify, Gin, Axum, FastAPI and Next.js starters. It is the `kid` header on the HS256 service tokens the adapter signs with `API_SERVICE_TOKEN`, not the key id the auth server signs user tokens with. The startup hints, READMEs, the Next.js `.env.example`, and the placeholder table in the repo README now say so.
