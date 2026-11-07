---
"seamless-templates": minor
---

Show permission guards in the starters. Every API starter, and the Next.js starter, serves `GET /reports` (`/api/reports` in Next.js) behind its adapter's permission guard for `reports:read`, beside the existing `betaUser` role route. The React starters show the reports on the Session page with `usePermissions().hasPermission`, and the Angular, Vue, SvelteKit and Expo starters gate their reports UI with `hasPermission`; the server guard is what enforces. Each README and AGENTS.md has the steps to create the permission and grant it to a role.

Permissions need Seamless Auth API v0.23 or later. On v0.22 access tokens carry no permissions, so the guarded route answers 403 to everyone and the UI stays hidden.

The starters move to the adapters and SDKs that carry the guard: `@seamless-auth/express` 0.25, `@seamless-auth/fastify` 0.16, `@seamless-auth/nextjs` 0.9, `@seamless-auth/react` 0.20, `@seamless-auth/angular` 0.5, `@seamless-auth/vue` 0.4, `@seamless-auth/svelte` 0.4, `@seamless-auth/react-native` 0.5, and `seamless-auth` 0.6 for Go, Rust and Python. With the Python 0.6 adapter, FastAPI guard refusals answer `{"error": "<code>"}` instead of `{"detail": "<code>"}`.
