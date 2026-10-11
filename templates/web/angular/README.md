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

## Scripts

| Script           | What it does                                 |
| ---------------- | -------------------------------------------- |
| `npm run dev`    | Development server on port 5173              |
| `npm run build`  | Production build                             |
| `npm run check`  | Typecheck, lint, format check and unit tests |
| `npm run test`   | Unit tests, with no API or auth server       |
| `npm run format` | Format with Prettier                         |

## Docker

The `Dockerfile`'s default target serves the production build with nginx on port 80, writing
`API_URL` into `config.js` at startup, so one image runs against any API:

```bash
docker build -t my-web .
docker run -p 5173:80 -e API_URL=http://localhost:3000 my-web
```

Its `dev` target runs the development server instead.

## Learn More

- [Angular bindings](https://github.com/fells-code/seamless-auth-react/tree/main/packages/angular)
- [Seamless Auth documentation](https://docs.seamlessauth.com)

## License

Apache-2.0. See [LICENSE](LICENSE).
