---
"seamless-templates": patch
---

Give the Next.js starter's `Dockerfile` a `dev` target, last and therefore the default, matching the Express starter. `docker build .` and `docker compose up --build` now run `next dev` on port 80, so the starter's development messaging prints one-time codes and magic links to the container's logs, which is the only way to read them on the local stack. The standalone production server moves to `docker build --target runtime .`.
