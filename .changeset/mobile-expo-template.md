---
"seamless-templates": minor
---

Add the `mobile` template kind and an Expo (React Native) starter, and let the API starters accept bearer sessions.

`templates/mobile/expo` is a complete Expo Router app on `@seamless-auth/react-native`: sign up and sign in with a one-time email code, a sign-in link (by polling, no deep link needed), or a passkey; passkey enrolment after sign up; route groups gated on the session; and a protected call to the companion API through `useAuthorizedFetch()`. The session lives in the platform keystore between launches. `tools/associations/generate.mjs` writes the `apple-app-site-association` and `assetlinks.json` native passkeys need from one set of inputs and prints the matching Android origin, so the hex fingerprint and its base64url form cannot drift apart; the README covers the prerequisites, which cannot be removed, and the traps. `build` is `expo export` for iOS and Android, which the templates CI matrix can run without a native toolchain.

The validator accepts `kind: "mobile"`, the registry lists the starter as `expo` (alias `mobile`, beta), and the manifest places it at `mobile/` with `EXPO_PUBLIC_API_URL` from `{{apiUrl}}`. It needs `seamless-cli` 0.16.0, which learns the kind.

The Express and Fastify starters pass `authServerUrl` and `audience` into `requireAuth`, so a scaffolded API accepts the auth API's access token from a native client alongside browser cookies, and move to `@seamless-auth/express` 0.16 and `@seamless-auth/fastify` 0.7.
