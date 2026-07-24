---
"seamless-templates": minor
---

Make the Express API template's admin-console proxy opt-in via `SERVE_ADMIN_CONSOLE`.

The `createSeamlessConsoleProxy` mount at `/console` is now gated on
`SERVE_ADMIN_CONSOLE=true` (the default in `.env.example`). Set it to `false`
when the dashboard is hosted elsewhere — a standalone container or not at all —
and the proxy is skipped. This lets a scaffold choose between serving the console
from the API and running it as a separate service without editing source.

`template.json` exposes the flag as `{{serveAdminConsole}}` so the CLI can
pre-configure it, and now requires `cliMin` `0.10.0`.
