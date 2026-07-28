---
'seamless-templates': patch
---

Drop the dev `sendBootstrapInviteEmail` handler from the Express API template.

The Seamless Auth API removed the admin bootstrap invite flow, so it no longer emits a
`bootstrap_invite_email` delivery and the handler could never fire. The first admin is now granted
through `OWNER_EMAIL` instead. Scaffolded projects keep the OTP and magic-link dev handlers, and the
`NODE_ENV` notes in `.env.example` and the template README no longer mention bootstrap-invite links.
