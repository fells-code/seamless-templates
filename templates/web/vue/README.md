# Seamless Auth Vue Starter

A Vue 3 single-page app (Vite, Vue Router, Tailwind) with Seamless Auth wired in through `@seamless-auth/vue`. The
Seamless CLI copies it into `web/` when you run `seamless init --vue`, beside the api template you
choose, and any api template works with it.

## What This Starter Shows

- The binding's bundled sign-in screens (passkeys, email codes, magic links, OAuth when configured)
- Route guards that keep signed-out visitors on the sign-in screens
- A top bar with the account menu and logout
- A page gated by the `betaUser` role that calls a protected API route with `authorizedFetch`
- The same design tokens and fonts as the React starter (`src/index.css`, synced from
  `shared/react-app` in seamless-templates)

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs on http://localhost:5173 and expects the companion API on http://localhost:3000.

## Configuration

The app reads one value, the API origin, from `VITE_API_URL`. The api templates mount the Seamless
Auth adapter at `/auth`, so every auth request goes to `VITE_API_URL` plus `/auth/...`. There is no
separate auth server URL here: all traffic goes through the API.

`VITE_API_URL` in `.env` (see `.env.example`): the companion API origin, read at build or dev time. In the container image, `API_URL` is written into `config.js` as `window.__SEAMLESS_CONFIG__` at startup by `entrypoint.sh`, and wins over `VITE_API_URL`.

With no API origin the app renders a configuration page naming the variable, instead of sending every
auth request to its own origin.

When you scaffold with `seamless init` against a managed instance, the CLI fills `VITE_API_URL` with
your project's API URL (`{{apiUrl}}` in [template.json](template.json)).

## Permissions

The beta page calls `GET /reports` and lists the reports (`src/views/BetaView.vue`, with
`hasPermission` from `@seamless-auth/vue`) only when the signed-in user holds the `reports:read`
permission. That check only decides what to show: the API's permission guard on `GET /reports` is
what enforces, and it refuses a session without the permission whatever the UI renders. The
permissions come from the last session read, so a new grant shows up after the next sign-in.
`reports:read` is the example permission in every Seamless starter, and the API starters serve `GET
/reports` behind it.

**This needs Seamless Auth API v0.23 or later, which is not released yet.** An older API issues
access tokens with no `permissions` claim, so the user carries no permissions on API v0.22: the UI
stays hidden and the API answers 403 to everyone.

To grant it once your auth server runs v0.23:

1. Sign in to the admin console as an admin with `admin:write` (the `OWNER_EMAIL` account
   `seamless init` sets up has it), with a passkey or authenticator app enrolled: permission
   changes need a fresh step-up.
2. Create the permission `reports:read`, and grant it to the `betaUser` instance role.
3. Give your user the `betaUser` role.
4. Sign in again. An access token carries the permissions it was issued with, so a grant reaches
   a session at its next token.

The console's Roles page manages permissions and the roles that grant them. It makes these calls on
the auth server, which you can also script from a stepped-up admin session:

```text
POST /admin/permissions                          {"name": "reports:read"}
PUT  /admin/roles/instance/betaUser/permissions  {"permissions": ["reports:read"]}
```

The `PUT` replaces everything the role grants, so list any permissions it already has.

## Scripts

| Script           | What it does                                 |
| ---------------- | -------------------------------------------- |
| `npm run dev`    | Development server on port 5173              |
| `npm run build`  | Production build                             |
| `npm run check`  | Typecheck, lint, format check and unit tests |
| `npm run test`   | Unit tests, with no API or auth server       |
| `npm run format` | Format with Prettier                         |

## Docker

The `Dockerfile`'s default target serves the production build with unprivileged nginx on port 8080, writing
`API_URL` into `config.js` at startup, so one image runs against any API:

```bash
docker build -t my-web .
docker run -p 5173:8080 -e API_URL=http://localhost:3000 my-web
```

Its `dev` target runs the development server instead.

## Learn More

- [Vue bindings](https://github.com/fells-code/seamless-auth-js/tree/main/packages/vue)
- [Seamless Auth documentation](https://docs.seamlessauth.com)

## License

Apache-2.0. See [LICENSE](LICENSE).
