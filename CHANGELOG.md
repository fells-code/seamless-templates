# seamless-templates

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
