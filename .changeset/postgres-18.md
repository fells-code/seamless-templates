---
'seamless-templates': minor
---

Move both API starters to PostgreSQL 18.

`seamless-cli` now scaffolds and conformance-tests PostgreSQL 18, so a project created by
`seamless init` was naming two different majors in the same directory: `postgres:18` in the
CLI-generated compose file and `postgres:16-alpine` in the API starter copied in beside it. Both
starters now pin `postgres:18-alpine`.

The volume mount had to move with the tag. PostgreSQL 18+ images store data in a major-versioned
subdirectory (`/var/lib/postgresql/18/docker`), so the mount is now `/var/lib/postgresql` rather than
`/var/lib/postgresql/data`. Keeping the old path is not a cosmetic mismatch: the container treats the
mount as unused and refuses to start with `Error: in 18+, these Docker images are configured to store
database data in a format which is compatible with "pg_ctlcluster"`. See docker-library/postgres#1259.

This does not touch an existing project. Starter files are copied in at scaffold time, so a project
keeps the compose file it was created with. Only newly scaffolded projects get 18, on a fresh volume.
