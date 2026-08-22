---
"seamless-templates": patch
---

fix(templates): give both API starters a production image, and make sequelize-cli a runtime dependency

The API starters shipped a Dockerfile that said `# NOT a production image` in its
own second line. It ran `npm i` at build time and `tsx watch` as its command, so
nothing scaffolded from these templates could be deployed without the adopter
writing their own.

Both starters now build from one multi-stage file with two targets. `dev` is what
it always was, the whole toolchain under `tsx watch`, and `docker-compose.yml`
asks for it by name. `runtime` compiles, installs production dependencies only,
drops to the `node` user and runs `npm start`. One file rather than two because a
second Dockerfile is a second thing to keep in step, and these two share every
layer up to the dependency install.

The second half is the reason the first half did not work on the first attempt.
`npm start` runs `scripts/runMigrations.js` before the server listens, and that
script shells out to `npx sequelize-cli db:migrate`. With `sequelize-cli` declared
as a devDependency, an `npm ci --omit=dev` image does not contain it, and `npx`
quietly downloads it from the registry at container start instead of failing:

```
npm warn exec The following package was not found and will be installed: sequelize-cli@6.6.5
```

That is worse than a crash, because it works in development and in any
environment with open egress. Behind an egress allowlist, which is what a
generated application is supposed to run behind, the same image dies at boot with
`EAI_AGAIN registry.npmjs.org`. It also puts an unpinned registry fetch inside the
startup path of every cold start.

`sequelize-cli` is therefore a runtime dependency of these templates, because
`npm start` invokes it, and it is declared as one. The fixed image resolves it
locally and starts with no network at all.

Verified on both starters: `dev` and `runtime` both build, the runtime image
carries `dist/`, `sequelize-cli` and neither `tsc` nor `tsx`, and
`npx sequelize-cli --version` answers `6.6.5` with `--network none`.
