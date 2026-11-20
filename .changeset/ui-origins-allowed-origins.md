---
"seamless-templates": patch
---

Every API template (Express, Fastify, Gin, FastAPI, Axum) now passes `UI_ORIGINS` to the auth adapter's `allowedOrigins`, so a state-changing request from an origin CORS does not admit, a sibling subdomain included, is refused instead of passing the adapter's origin check. The Next.js starter gains an optional `UI_ORIGINS` for browser apps hosted apart from it and passes it the same way; its own pages need no entry. Templates keep working once the adapters refuse cross-origin requests that match no allow-list.
