---
"seamless-templates": minor
---

Every starter now ships an `AGENTS.md`, plus a `CLAUDE.md` that imports it, so a coding agent working in a scaffolded project knows how auth is wired there: which processes run and how they reach the auth server, the files, middleware and SDK calls that own auth, how to protect a new route and read the current user, the environment variables, and the real check commands. It tells the agent to keep using the Seamless SDK and server adapter instead of writing its own JWT, session cookie, password or login code. `npm run validate` now requires both files in every template.
