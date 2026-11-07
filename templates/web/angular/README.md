# Seamless Auth Angular Starter

An Angular single-page app (standalone components, signals, zoneless, Tailwind) with Seamless Auth wired in through `@seamless-auth/angular`. The
Seamless CLI copies it into `web/` when you run `seamless init --angular`, beside the api template you
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

The app reads one value, the API origin, from `API_URL`. The api templates mount the Seamless
Auth adapter at `/auth`, so every auth request goes to `API_URL` plus `/auth/...`. There is no
separate auth server URL here: all traffic goes through the API.

`API_URL` in `.env` (see `.env.example`): the companion API origin. The Angular CLI does not read `.env`, so `npm run dev` and `npm run build` first run `scripts/write-config.mjs`, which writes it into `public/config.js` as `window.__SEAMLESS_CONFIG__` (gitignored). In the container image, `entrypoint.sh` writes the same file from `API_URL` at startup.

With no API origin the app renders a configuration page naming the variable, instead of sending every
auth request to its own origin.

When you scaffold with `seamless init` against a managed instance, the CLI fills `API_URL` with
your project's API URL (`{{apiUrl}}` in [template.json](template.json)).

## Permissions

The beta page calls `GET /reports` and lists the reports (`src/app/pages/beta.ts`, with
`hasPermission` from `@seamless-auth/angular`) only when the signed-in user holds the `reports:read`
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
2. Add a `reportViewer` role to the instance's `available_roles`, on the console's system config page
   or with `seamless config set available_roles`. That replaces the whole list, so include the
   roles you already have (`seamless config get available_roles` shows them).
3. Create the permission `reports:read`, and grant it to the `reportViewer` instance role.
4. Give your user the `reportViewer` role.
5. Sign in again. An access token carries the permissions it was issued with, so a grant reaches
   a session at its next token.

The console's Roles page manages permissions and the roles that grant them. It needs console v0.13.0 or later.
The page makes these calls on the auth server, which you can also script from a stepped-up admin session:

```text
POST /admin/permissions                              {"name": "reports:read"}
PUT  /admin/roles/instance/reportViewer/permissions  {"permissions": ["reports:read"]}
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

- [Angular bindings](https://github.com/fells-code/seamless-auth-js/tree/main/packages/angular)
- [Seamless Auth documentation](https://docs.seamlessauth.com)

## License

Apache-2.0. See [LICENSE](LICENSE).
