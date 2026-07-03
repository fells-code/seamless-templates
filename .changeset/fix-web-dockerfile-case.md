---
"seamless-templates": patch
---

Rename the web templates' build file from `dockerfile` to `Dockerfile` so `docker compose build` finds it on case-sensitive filesystems (Linux/CI). Previously a scaffolded project's web build failed there while working on case-insensitive macOS. Also document the `alias`, `verify.flows`, and `setup.oauth` manifest fields, and expand the react-oauth OAuth provider setup guide (including manual Apple steps).
