---
"seamless-templates": minor
---

Move every starter to the v0.20 SDKs: `@seamless-auth/express` 0.22, `@seamless-auth/fastify` 0.13, `@seamless-auth/nextjs` 0.6, `@seamless-auth/react` 0.19, `@seamless-auth/react-native` 0.4, `@seamless-auth/angular` 0.4, `@seamless-auth/svelte` and `@seamless-auth/vue` 0.3, and `seamless-auth` 0.3 for Go, Rust and Python.

The server adapters now refuse a restricted recovery session by default (403 `enrollment_required`), so an account recovering through recovery codes or account recovery must enroll a passkey or an authenticator app before an API starter treats it as signed in. The web starters gain the authenticator app (TOTP) sign-in and enrollment screens. Pair these starters with auth server v0.20.
