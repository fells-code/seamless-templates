---
"seamless-templates": patch
---

The Express and Fastify starters' `npm start` now runs the server with `NODE_ENV=production`, not only the migration step. A deployment that copied a `.env` holding `NODE_ENV=development` no longer switches on the development messaging handlers, which log one-time codes and magic links instead of sending them.
