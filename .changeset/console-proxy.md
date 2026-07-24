---
"seamless-templates": minor
---

Serve the Seamless admin dashboard from the Express API template. The template
now mounts `createSeamlessConsoleProxy` at `/console`, so the dashboard loads
from the API's own origin and shares the cookie scope of its `/auth` routes,
with no separate dashboard deployment.

The proxy is mounted ahead of the CORS allowlist and `requireAuth`. The console
is same-origin static content rather than a cross-origin API call, so gating it
on `UI_ORIGINS` would reject the SPA's own asset requests (its module script is
`crossorigin`, so the browser sends an `Origin` header and the allowlist returns
an error). It also has to load for a signed-out admin, who then signs in through
`/auth`.
