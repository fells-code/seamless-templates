---
"seamless-templates": minor
---

Move the starters onto the auth packages that put passkey enrolment behind a
session.

`@seamless-auth/react` goes from 0.11.0 to 0.12.0 in both React starters,
`@seamless-auth/express` from 0.13.0 to 0.14.0, and `@seamless-auth/fastify`
from 0.4.0 to 0.5.0.

These three are one release. `/webAuthn/register/start` and
`/webAuthn/register/finish` used to accept the ephemeral token the auth API mints
from an email address alone, so anyone who knew an address could enrol a
credential against that account and sign in as its owner. Both routes now read
the access session instead. The auth API stopped accepting the old token in
0.11.0, and there is no safe order between the two sides: an older adapter sends
what the API refuses, and these adapters send what an older API refuses, so
enrolment answers 401 until both have landed. Point a scaffolded project at
`seamless-auth-api` 0.12.0, the current release.

No shipped flow loses a step. Registration proves an address with an email OTP
and verifying it issues a session, so the client already holds one by the time
the passkey screen appears. An application built on an older starter that offered
enrolment before verifying an address has to move that call after it.

The starters needed the version and nothing else. `createSeamlessAuthServer`,
`requireAuth`, `requireRole` and `SeamlessAuthUser` are unchanged, and the
adapters' other work in 0.14.0 and 0.5.0 is route plumbing behind them: a
`DELETE /admin/organizations/:organizationId` proxy, and the query string
restored on `GET /admin/users` and the login-stats endpoint.

The React bump also adds capability the starters do not use yet. `registerPasskey`
is now on `useAuth()`, so a settings screen can add a passkey to a signed-in
account rather than only listing and deleting, and `isUnauthenticated(error)` is
exported for callers rendering their own enrolment screens.
