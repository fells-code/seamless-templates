# seamless-templates

## 0.2.4

### Patch Changes

- 5cd6c21: Make the templates run cleanly and document the managed connect path.

  Express: fix the production `npm run start` path, which was broken two ways. Compiled ESM used extensionless relative imports that Node could not resolve at runtime, and the migration runner pointed at `dist/config/config.js`, which `tsc` never emits. Relative imports now carry `.js` extensions and the runner always uses the source `config/config.js`. Add the `docker-compose.yml` the README and `docker:*` scripts referenced but that did not exist (local Postgres plus the API), switch those scripts to `docker compose` (v2), and rewrite the README to match the actual template while documenting both the local and managed (CLI-filled) paths.

  Web (react-vite and react-oauth): drop the unused `VITE_AUTH_SERVER_URL` from each `template.json` and from the runtime config type. Both apps reach the auth server through the API, so `VITE_API_URL` (`{{apiUrl}}`) is the only value the CLI fills. Both READMEs now document the local and managed paths.

## 0.2.3

### Patch Changes

- f84a69c: Bump the bundled Seamless Auth SDK versions in the templates. The React templates (react-vite and react-oauth) move to `@seamless-auth/react` `^0.4.0`, which adds TOTP (authenticator app) support, and the Express template moves to `@seamless-auth/express` `^0.7.0`, which pulls in `@seamless-auth/core` `0.7.0`. Both are additive upgrades that keep the existing public APIs, so no template source changes are required.

## 0.2.2

### Patch Changes

- 10b6c42: Rename the web templates' build file from `dockerfile` to `Dockerfile` so `docker compose build` finds it on case-sensitive filesystems (Linux/CI). Previously a scaffolded project's web build failed there while working on case-insensitive macOS. Also document the `alias`, `verify.flows`, and `setup.oauth` manifest fields, and expand the react-oauth OAuth provider setup guide (including manual Apple steps).

## 0.2.1

### Patch Changes

- 65d3b43: Publish a GitHub Release on each version. When the "version packages" PR merges, the release step now creates an official GitHub Release for the new v<version> tag, with notes drawn from the matching CHANGELOG.md section, in addition to pushing the tag. The step is idempotent: it skips tag creation and release creation when either already exists.
- a5085f5: The react-oauth template now declares `setup.oauth` in its manifest, so the Seamless CLI prompts for OIDC providers and their credentials when this template is scaffolded and wires them into the auth server.

## 0.2.0

### Minor Changes

- 2d4518e: Add a react-oauth use-case template: an OAuth-first React (Vite) starter that lists the auth server's configured OAuth providers and completes the login on a callback route. Registered with alias "oauth" (for `seamless init --oauth`) and a verify block scoping its conformance to the oauth flow. Also give react-vite the alias "basic".

## 0.1.1

### Patch Changes

- 0f1fa91: Run conformance from the repo root. Add a root conformance workflow that tests the templates against the ecosystem on PRs via the seamless-cli reusable workflow, and remove the inert per-template GitHub workflow that was carried over from the standalone starter (it did nothing here and leaked into scaffolded projects).

## 0.1.0

### Minor Changes

- Initial templates release: React (Vite) and Express starters, the registry and manifest tooling, and validation plus build-smoke CI.
