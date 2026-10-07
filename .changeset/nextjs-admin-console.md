---
"seamless-templates": minor
---

The Next.js starter serves the Seamless admin dashboard at `/console`, the way the Express and Fastify starters do.

- `src/app/console/[[...path]]/route.ts` mounts `createSeamlessConsoleProxy` from `@seamless-auth/nextjs` and exports its `GET` and `HEAD`. The dashboard loads from the same origin as `/auth`, so it calls the admin routes with the app's own session cookies.
- `SERVE_ADMIN_CONSOLE` turns it on. Anything but `true` leaves `/console` answering 404 with no request upstream. `template.json` sets it from `{{serveAdminConsole}}`, which every supported CLI already resolves, so `requires.cliMin` is unchanged. A CLI that scaffolds this starter with no console writes `false`.
- The starter depends on `@seamless-auth/nextjs` `^0.3.1`, the first release with the console proxy.
- `.env.example` and the README document the switch and the two auth server settings it relies on (`SERVE_ADMIN_DASHBOARD=true`, and the app's origin in `ORIGINS`).
