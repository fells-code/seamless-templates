---
"seamless-templates": minor
---

Update the React OAuth template for the `@seamless-auth/react` 0.5 result-object
API. Every SDK call now resolves to `{ data, error }` instead of returning the
payload directly or throwing, so the login page reads providers from
`data.providers`, the provider redirect reads `data.authorizationUrl`, and the
OAuth callback checks `error` rather than a `.catch` that the SDK no longer
triggers. The template now depends on `@seamless-auth/react` `^0.5.0`.
