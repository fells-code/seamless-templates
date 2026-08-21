---
"seamless-templates": minor
---

feat(templates): name auth cookies per application

Both API starters (`express` and `fastify`) now read `AUTH_COOKIE_PREFIX` and
derive `accessCookieName`, `refreshCookieName`, `registrationCookieName` and
`preAuthCookieName` from it, passing all four to the auth server and the matching
`cookieName` to `requireAuth`.

Cookies are scoped by host and ignore the port, so two Seamless applications
served from the same host share one cookie jar and overwrite each other's
session. Signing into one signs you out of the other. That is invisible in
production, where each application has its own domain, and unavoidable in
development, where they are all on localhost.

The guard has to be told the name as well as the server. Left on its default it
looks for `seamless-access` while the server has issued something else, and every
request 401s while holding a valid session.

The default prefix is `seamless-`, which reproduces the names
`@seamless-auth/express` already uses, so an existing project upgrades without
logging anyone out. `.env.example` and the README table in both starters document
the variable.

Note for anyone scaffolding several applications on one host: the variable is
read but not yet set by `template.json`, so a project created by the CLI still
gets the default names and still shares a cookie jar with its neighbours. Set
`AUTH_COOKIE_PREFIX` in the generated `.env` to separate them.
