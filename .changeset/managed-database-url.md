---
"seamless-templates": minor
---

The express starter now accepts a `DATABASE_URL` connection string, and enables TLS when it carries
`sslmode=require`. A managed Seamless database is handed out as a connection string and accepts
external connections over TLS only, which the starter could not do: it read the discrete `DB_*`
values and set no SSL option, so a managed database was unreachable from it.

Resolution is shared by the runtime and the migrations, so `sequelize-cli` targets the same database
the app does. `DATABASE_URL` wins when set; the local Docker stack keeps using the `DB_*` values.

Certificate verification stays on. `DB_SSL_REJECT_UNAUTHORIZED=false` is available for a certificate
that does not chain to a public CA.

`template.json` declares a `{{databaseUrl}}` env placeholder so the CLI can populate it.
