# Agent guide: Expo (React Native) app with Seamless Auth

This is an Expo app (Expo Router, React Native) whose sign-in, sessions and roles come from
[Seamless Auth](https://docs.seamlessauth.com), open source passwordless auth (passkeys, email or
SMS codes, magic links). Auth is already wired through `@seamless-auth/react-native`. Your job when
extending this app is to keep using it, not to rebuild it.

## Topology

- In a project from `seamless init`, this directory is `mobile/`. Beside it, `api/` is the
  companion API on port 3000, and the root `docker-compose.yml` runs the Seamless Auth server
  (5312) and Postgres (5432).
- This app never talks to the auth server directly. `AuthProvider` calls the companion API's
  `/auth/*` routes, served by the Seamless server adapter there. A native app has no cookie jar to
  rely on, so the session is a bearer access token kept in the device keystore, and the API's
  `requireAuth` guard accepts it.

## Where auth lives

- `app/_layout.tsx`: `<AuthProvider apiHost={API_URL} ports={authPorts}>` wraps the app.
- `src/auth/ports.ts`: `authPorts`, built once at module scope from `createNativePasskeyPort`,
  `createSecureStoreTokenStorage` (expo-secure-store) and `createWebBrowserOAuthRedirect`. Keep it
  at module scope: a new object per render signs the user out.
- `app/index.tsx`, `app/(app)/_layout.tsx` and `app/(auth)/_layout.tsx`: redirect on
  `useAuth()`'s `loading` and `isAuthenticated`.
- `app/(auth)/`: sign-in, sign-up, verify-code, magic-link-sent and register-passkey screens,
  built on `useAuth()` (`login`, `handlePasskeyLogin`, `registerPasskey`, `refreshSession`) and
  `useAuthClient()`.
- `app/(app)/index.tsx`: the signed-in screen. Reads `user`, `credentials`, `logout` and
  `hasScopedRole` from `useAuth()`, and calls the API with `useAuthorizedFetch()`.
- `src/lib/config.ts`: `API_URL` from `EXPO_PUBLIC_API_URL`.

## Rules

- Do not write your own login, OTP, magic link or passkey calls against raw endpoints, and do not
  call the auth server from the app. Use `useAuth()` and `useAuthClient()`.
- Do not store tokens yourself: not in AsyncStorage, not in state you persist. The token storage
  port already keeps them in the keystore.
- Do not decode or verify JWTs in the app, and do not add password fields. Seamless Auth is
  passwordless.
- Call your API with `useAuthorizedFetch()`, which attaches the access token and refreshes once on
  a 401. Do not attach `Authorization` headers by hand.
- Hiding UI is for display only. Every protected API route must be guarded on the server by the
  adapter's middleware in `api/`.
- Roles are managed in the Seamless admin console.

## Protecting a screen

Put signed-in screens under `app/(app)/`; its layout redirects signed-out users to
`/(auth)/sign-in`. In a screen:

```tsx
const { user, hasScopedRole } = useAuth();
const authorizedFetch = useAuthorizedFetch();
const response = await authorizedFetch("/beta_users");
```

## Configuration

- `EXPO_PUBLIC_API_URL` in `.env` (see `.env.example`): the companion API origin, inlined at build
  time. On an Android emulator use `http://10.0.2.2:3000`; on a device, the machine's LAN address
  or a tunnel.
- Passkeys need an associated domain (`associatedDomains` in `app.json`, and the files from
  `tools/associations/generate.mjs`); see the README. Email codes and magic links work without one.

## Run, test, verify

- `npm run start`, `npm run ios`, `npm run android`: Metro and a simulator or emulator.
- `npm run build`: `expo export` for iOS and Android. It proves the JavaScript bundles, not a
  native binary.
- `npm run check`: typecheck, lint, format check and Vitest. Only pure modules are under Vitest;
  screens are exercised on a simulator.
- `seamless check`, from the project root: validates the project setup, Docker and the running
  services.

## Docs

- React Native SDK: https://docs.seamlessauth.com/build/react-native-sdk/
- Mobile passkeys: https://docs.seamlessauth.com/build/mobile-passkeys/
- Cookies, sessions and tokens: https://docs.seamlessauth.com/reference/cookies-sessions-tokens/
- Everything, for agents: https://docs.seamlessauth.com/llms.txt
