---
"seamless-templates": minor
---

Add Go (Gin), Rust (Axum) and Python (FastAPI) api templates, on the seamless-auth-go, seamless-auth (crates.io) and seamless-auth (PyPI) adapters. Each mirrors the Express starter: the auth routes at `/auth`, the admin console at `/console`, CORS, the session guard, a local users table, a role-gated example route, a boot-time environment check, migrations run on boot, and a reloading Docker dev target. They are `beta` and listed after Express and Fastify, so the default api pick is unchanged.
