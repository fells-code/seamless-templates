---
"seamless-templates": minor
---

Move the API starters onto the adapters that forward the browser's user agent.

`@seamless-auth/express` goes from 0.14.0 to 0.15.0 and `@seamless-auth/fastify` from 0.5.0 to
0.6.0. Both now send the browser's `User-Agent` to the auth API as
`x-seamless-client-user-agent` on every proxied call, beside the client address they already
forward.

The auth API records a device class on every audit row from that header and reports sign-in
outcomes by it (`GET /internal/metrics/sign-ins`, `seamless-auth-api` 0.13.0). The adapter is the
only client the API sees, so a project on the older adapters has every row recorded as the
adapter's own user agent and the breakdown by device reads `unknown` for every sign-in. The
adapters also pass the new metrics route through, which the admin console's Overview reads.

The starters needed the version and nothing else. `createSeamlessAuthServer`, `requireAuth`,
`requireRole` and `SeamlessAuthUser` are unchanged, and nothing here forwards anything a browser
did not already send. The React starters stay on `@seamless-auth/react` 0.12.0; the token the
API mints gained a claim the client never reads.
