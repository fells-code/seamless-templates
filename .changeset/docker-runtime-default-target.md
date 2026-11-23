---
"seamless-templates": minor
---

The Express, Fastify, FastAPI, Axum, Gin and Next.js Dockerfiles now end with the production `runtime` stage, so a plain `docker build .`, or a platform that builds the default stage, ships the production server instead of the dev server, which ran as root and logged one-time codes and magic links. The dev stage is chosen with `--target dev`, as each api template's `docker-compose.yml` already does. A compose file that builds one of these templates with no `target` now gets the production image, which does not run under a source bind mount: the CLI's generated compose file must set `target: dev` on the `api` service and on the Next.js `web` service before it moves to this release.
