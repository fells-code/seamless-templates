---
"seamless-templates": patch
---

Drop the dead `issuer` option from the Express API template. `@seamless-auth/express` removes `issuer` from `SeamlessAuthServerOptions` (it moved the silent-refresh service token to the fixed M2M contract constants, so the adopter-supplied value reached nothing), and passing it is now a type error. The template no longer sets `issuer`, and `APP_ORIGIN`, whose only consumer was that option, is removed from `.env.example` and the README.
