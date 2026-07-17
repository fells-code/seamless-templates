---
"seamless-templates": patch
---

Make the templates run cleanly and document the managed connect path.

Express: fix the production `npm run start` path, which was broken two ways. Compiled ESM used extensionless relative imports that Node could not resolve at runtime, and the migration runner pointed at `dist/config/config.js`, which `tsc` never emits. Relative imports now carry `.js` extensions and the runner always uses the source `config/config.js`. Add the `docker-compose.yml` the README and `docker:*` scripts referenced but that did not exist (local Postgres plus the API), switch those scripts to `docker compose` (v2), and rewrite the README to match the actual template while documenting both the local and managed (CLI-filled) paths.

Web (react-vite and react-oauth): drop the unused `VITE_AUTH_SERVER_URL` from each `template.json` and from the runtime config type. Both apps reach the auth server through the API, so `VITE_API_URL` (`{{apiUrl}}`) is the only value the CLI fills. Both READMEs now document the local and managed paths.
