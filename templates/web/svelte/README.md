# Seamless Auth SvelteKit Starter

A SvelteKit single-page app (Svelte 5, `adapter-static` with an `index.html` fallback, Tailwind) with Seamless Auth wired in through `@seamless-auth/svelte`. The
Seamless CLI copies it into `web/` when you run `seamless init --svelte`, beside the api template you
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

- [SvelteKit bindings](https://github.com/fells-code/seamless-auth-react/tree/main/packages/svelte)
- [Seamless Auth documentation](https://docs.seamlessauth.com)

## License

Apache-2.0. See [LICENSE](LICENSE).
