---
"seamless-templates": patch
---

Every web and mobile starter now installs `@seamless-auth/client` 0.7.1, which sends the OAuth state binding that `seamless-auth-api` 0.19.2 requires on `/oauth/:providerId/callback`. The React Vite, React OAuth and Next.js starters move to `@seamless-auth/react` 0.18.1 and the Expo starter to `@seamless-auth/react-native` 0.3.3. With an older client, OAuth sign-in against API 0.19.2 fails with `Invalid OAuth state`.
