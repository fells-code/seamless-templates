---
"seamless-templates": minor
---

Log OTP and magic-link tokens to the console in the Express API template when
running in development. The template now passes a `messaging` option to
`createSeamlessAuthServer` with dev-only handlers, which routes delivery through
the adapter so codes appear in the API logs without a mail or SMS provider. The
handlers are gated on `NODE_ENV=development` and must be replaced with real
transports before deploying.
