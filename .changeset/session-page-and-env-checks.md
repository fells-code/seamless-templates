---
'seamless-templates': minor
---

Add a session inspector page to both web templates, and fail fast on missing configuration.

Both React templates gain a protected `/session` route that renders what the SDK actually knows
about the current session: the issued claims, roles, organization context, step-up freshness with
its expiry, and the registered passkeys, plus buttons to re-read the session and sign out
everywhere. The raw `JSON.stringify(user)` dump moves off the home page into a collapsed block
there, so the first authenticated screen reads as an app rather than a debug view.

`RequireAuth` no longer swaps in the loading screen while an already-authenticated page re-reads
its session, which previously unmounted the page and discarded its state.

Missing configuration now stops the templates with a message that names the variable. The Express
API asserts `AUTH_SERVER_URL`, `COOKIE_SIGNING_KEY`, `API_SERVICE_TOKEN`, `JWKS_KID`, and its
database settings before the server is built, reporting every problem at once instead of failing as
a 500 on the first authenticated request; it also catches a `DATABASE_URL` still carrying the
placeholder credentials `seamless init` writes, and warns on an empty `UI_ORIGINS`. The web
templates render a configuration page when `VITE_API_URL` is unset, rather than pointing every auth
request at their own origin.
