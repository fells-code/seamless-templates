---
"seamless-templates": patch
---

Starters refuse to run outside development with the secrets `.env.example` ships with (GHSA-m5x9-cjv4-6q3w).

The example `COOKIE_SIGNING_KEY` is public and long enough to pass the adapter's length check, so an application started with `cp .env.example .env` and deployed signed its session cookies with a key anyone can read. The Express, Fastify, FastAPI, Gin, Axum and Next.js starters now treat the example `COOKIE_SIGNING_KEY` and `SEAMLESS_SERVICE_TOKEN` as a startup problem unless they run in development (`NODE_ENV=development`, or `APP_ENV=development` for FastAPI, Gin and Axum), and log a warning in development. Projects created by `seamless init` generate random secrets and are unaffected.

If you started a project from `.env.example`, check that its deployed `COOKIE_SIGNING_KEY` is not `dev-only-cookie-signing-key-replace-me`. Replacing the key signs everyone out.
