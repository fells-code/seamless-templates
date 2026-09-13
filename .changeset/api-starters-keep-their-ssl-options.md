---
"seamless-templates": patch
---

The API starters connect to a managed database again when `DB_SSL_REJECT_UNAUTHORIZED=false`.

Both starters translate `sslmode=require` on `DATABASE_URL` into Sequelize's `dialectOptions.ssl`,
with `DB_SSL_REJECT_UNAUTHORIZED` deciding whether the certificate is verified. Sequelize then
read the same `sslmode` for itself and let pg-connection-string's reading of it replace those
options, so the certificate was verified whatever the variable said. Against Amazon RDS, whose
CA is not in Node's trust store, the app failed to start with `unable to get local issuer
certificate` while the migrations, which sequelize-cli connects on its own, ran fine a moment
earlier.

`withoutSslMode` takes `sslmode` out of the string Sequelize is constructed with, after
`buildSslOptions` has read it. Nothing changes for a project on the discrete `DB_*` variables.
