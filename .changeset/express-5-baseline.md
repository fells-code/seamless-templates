---
"seamless-templates": minor
---

Upgrade the Express API template to Express 5 and `@seamless-auth/express` 0.8, which requires
`express >= 5.0.0` as a peer dependency. The template's `@types/express` was already on v5, so the
runtime and its types are now aligned.
