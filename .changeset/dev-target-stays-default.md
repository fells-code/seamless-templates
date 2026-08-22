---
"seamless-templates": patch
---

fix(templates): keep `dev` the default Docker target

The previous change gave both API starters a multi-stage Dockerfile with a `dev`
target and a `runtime` target, and put `runtime` last. Docker's default target is
the last stage, so `build: .` silently started producing a production image for
every existing caller.

That breaks anything that bind-mounts the source for reload, which is what the
compose file `seamless-cli` generates does:

```yaml
api:
  build: ./api
  volumes:
    - ./api:/app
    - /app/node_modules
```

The mount lands on top of `/app` and masks the image's compiled `dist`, so the
container runs `npm start`, finds no `dist/src/index.js`, and exits before it
listens. The image is correct; the mount hides it. The failure reads as a broken
build rather than a wrong target, which is what made it worth a comment in the
file.

`dev` is now the last stage and therefore the default, which is what every
existing caller already assumed. Production is opt-in with
`docker build --target runtime .`, chosen by the thing doing the deploying rather
than inherited by anything that happens to run `docker build`.

Nothing about the runtime image changed. It still compiles, installs production
dependencies only, drops to the `node` user and runs `npm start`.

One operational note for anyone who hit the broken version: the anonymous
`/app/node_modules` volume will still hold the production-only modules from the
failed image, and Docker reuses an existing anonymous volume rather than
repopulating it, so `npm run dev` fails with `tsx: not found` even after a
correct rebuild. `docker compose up --force-recreate --renew-anon-volumes api`
clears it.
