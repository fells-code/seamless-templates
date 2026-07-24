---
"seamless-templates": patch
---

Document the admin console in the Express API template README: the `/console`
route, why the proxy is mounted ahead of CORS and `requireAuth`, and the auth
server requirement that comes with it. Passkey ceremonies started in the console
carry this API's origin, and WebAuthn verification checks it, so that origin has
to be listed in the auth server's `ORIGINS` or sign-in and step-up fail at the
finish step while the challenge starts normally.
