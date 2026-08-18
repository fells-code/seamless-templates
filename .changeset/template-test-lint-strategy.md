---
'seamless-templates': minor
---

Give every template a working test, lint, and format setup out of the box.

All four starters (React Vite, React OAuth, Express, Fastify) now ship Vitest with tests that pass
on a fresh `npm install`, Prettier alongside the existing ESLint config, and the same script names:
`typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:watch`, `test:coverage`,
and a `check` that runs the whole gate in one command.

The tests cover the configuration and startup logic that decides whether a scaffolded project runs
at all, and need no database, auth server, or network:

- API starters: connection-string resolution (including `sslmode` and credential escaping) and the
  boot-time environment check, including the placeholders `seamless init` writes into a managed
  `DATABASE_URL`.
- Web starters: API origin resolution across the container-injected config and `VITE_API_URL`, URL
  joining and error handling in `apiFetch`, and a component test. The OAuth starter also covers its
  callback route with the SDK and router stubbed.

Also in this change:

- ESLint now covers the whole project in the API starters rather than `src` only, and uses Node
  globals instead of browser globals. That surfaced an unused catch binding in
  `scripts/runMigrations.js`, now fixed.
- `eslint-config-prettier` is wired in so lint and format never disagree about the same line.
- The API starters build with a `tsconfig.build.json` that keeps tests out of `dist/`, while
  `npm run typecheck` still checks them.
- CI runs typecheck, lint, format check, tests, and build for every template on pull requests.
