---
"seamless-templates": patch
---

Bump the bundled Seamless Auth SDK versions in the templates. The React templates (react-vite and react-oauth) move to `@seamless-auth/react` `^0.4.0`, which adds TOTP (authenticator app) support, and the Express template moves to `@seamless-auth/express` `^0.7.0`, which pulls in `@seamless-auth/core` `0.7.0`. Both are additive upgrades that keep the existing public APIs, so no template source changes are required.
