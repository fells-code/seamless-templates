---
"seamless-templates": patch
---

Bind the Postgres and API ports in every API starter's `docker-compose.yml` to 127.0.0.1, so a
scaffolded project no longer exposes its database (with the example credentials) or its API to the
local network. On Linux, Docker-published ports also bypass ufw. Nothing changes for host-side
access: `localhost:5432` and `localhost:3000` still work.
