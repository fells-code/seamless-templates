---
"seamless-templates": minor
---

The Express, Fastify, Gin, Axum, FastAPI and Next.js starters read their service token from `SEAMLESS_SERVICE_TOKEN` instead of `API_SERVICE_TOKEN`, the name the managed portal already gives it. The `.env.example` files, startup env checks and hints, READMEs, AGENTS.md files and `template.json` env declarations use the new name. The local auth server still reads the same value as `API_SERVICE_TOKEN`; the `.env.example` comments say so.

These starters now require `seamless-cli` 0.24.0 (`requires.cliMin`), the first CLI that writes `SEAMLESS_SERVICE_TOKEN` into the generated compose file and into `api/.env` when it connects a managed application. Projects scaffolded from earlier starters keep reading `API_SERVICE_TOKEN` and need no change.
