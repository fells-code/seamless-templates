# Seamless Auth Expo Starter

An Expo + React Native starter for building a mobile application with Seamless Auth.

This starter is intended to be placed by the Seamless CLI next to the companion API starter. It
provides a minimal Expo Router app with the Seamless Auth React Native SDK wired in: sign up and
sign in with a one-time email code, a sign-in link, or a passkey, plus a protected screen that
calls the companion API with the session.

## What This Starter Shows

- `AuthProvider` from `@seamless-auth/react-native` over bearer transport, with the session kept
  in the platform keystore between launches
- The native ports: `react-native-passkeys` for passkeys, `expo-secure-store` for tokens,
  `expo-web-browser` for OAuth
- Sign up and sign in screens built on the headless client: email code, magic link (by polling),
  and passkey
- Passkey enrolment after sign up, with a skip only when another sign-in method exists
- Route groups gated on the session with Expo Router
- A protected API call through `useAuthorizedFetch()` against the companion API

## Quick Start

```bash
npm install
cp .env.example .env
npm run ios        # or: npm run android
```

The iOS simulator reaches your machine at `localhost`. An Android emulator reaches it at
`10.0.2.2`, so set `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` there. A physical device needs the
machine's LAN address or a tunnel.

## Configuration

The app reads one value, the companion API origin, from `EXPO_PUBLIC_API_URL`. The companion
starter mounts the Seamless Auth adapter at `/auth`, so the SDK sends auth requests to
`${EXPO_PUBLIC_API_URL}/auth/...` and app requests to the same origin. Expo inlines
`EXPO_PUBLIC_*` variables at build time; restart `expo start` after changing `.env`.

The companion API needs `@seamless-auth/express` (or `@seamless-auth/fastify`) 0.16 or later: that
is the version whose `/auth` routes serve bearer transport and whose `requireAuth` accepts the
access token when it is given `authServerUrl` and `audience`. The API starters in this repository
already do both.

## Email code and magic link work immediately

Both need nothing beyond the companion API running. The code screen uppercases what you type
because the auth API's codes are six letters. The magic link screen polls `/magic-link/check`
until the link has been opened anywhere, then the session arrives; no deep link is required.

## Passkeys need a domain

Browser WebAuthn treats `localhost` as a secure context, which is why the web starters work the
moment `seamless init` finishes. Native passkey APIs have no such exemption on either platform.
Before a passkey works at all, including on a simulator, you must publish two association files
over HTTPS on a domain you control, and that domain becomes the relying party ID for the whole
deployment (web included, so the web app must be same-site with it).

### What you need

- **iOS**: an Apple Developer team (a free Personal Team is enough), a bundle identifier, the
  `associatedDomains` entitlement (already in `app.json` as a placeholder), and an
  `apple-app-site-association` file served as `application/json` with no redirect from
  `https://<rpid>/.well-known/`.
- **Android**: a Google account signed in on the device, a device screen lock, and an
  `assetlinks.json` at the same path carrying the package name and the SHA-256 fingerprint of
  the signing certificate. The auth server's `ORIGINS` must also list
  `android:apk-key-hash:<base64url of that same digest>`.

`tools/associations/generate.mjs` writes both files from one set of inputs and prints the Android
origin, so the hex fingerprint and its base64url form cannot drift apart:

```bash
node tools/associations/generate.mjs \
  --team-id ABCDE12345 --bundle-id com.example.app \
  --package com.example.app \
  --fingerprint "$(keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android | grep SHA256 | cut -d' ' -f3)"
```

Then replace `example.com` in `app.json` with your RP ID, set the auth server's `RPID` to it and
add `https://<rpid>` plus the Android origin to its `ORIGINS` (keep the web origin first), and run
`npx expo prebuild` so the entitlement lands in the native project.

### Traps

- The Apple Team ID is the `OU` field of the signing certificate. The value in parentheses in the
  certificate's common name is the certificate id, not the team; an association file built with
  it fails validation silently.
- Simulator builds keep entitlements in the Mach-O `__TEXT,__entitlements` section, not the code
  signature, so `codesign -d --entitlements` shows an empty dictionary that looks exactly like a
  missing entitlement. Inspect with `otool -s __TEXT __entitlements` instead, and do not re-sign
  a simulator build by hand.
- The debug keystore Expo generates lives at `android/app/debug.keystore`, not
  `~/.android/debug.keystore`.
- A tunnel that changes hostname on restart changes the RP ID, which invalidates every passkey
  registered against the old one. Use a stable domain.

## Project Layout

```
app/
  _layout.tsx            AuthProvider with the native ports
  index.tsx              waits for the session, then redirects
  (auth)/                sign-in, sign-up, verify-code, magic-link-sent, register-passkey
  (app)/                 the signed-in screen
src/
  auth/ports.ts          builds the ports once, at module scope
  auth/identifier.ts     pure helpers (tested)
  lib/config.ts          EXPO_PUBLIC_API_URL
  ui/                    a few StyleSheet primitives
tools/associations/      association file generator
```

## Scripts

| Script            | What it does                                                                |
| ----------------- | --------------------------------------------------------------------------- |
| `npm run ios`     | Start Metro and open the iOS simulator                                      |
| `npm run android` | Start Metro and open the Android emulator                                   |
| `npm run build`   | `expo export` for iOS and Android: bundles without Xcode or the Android SDK |
| `npm run check`   | Typecheck, lint, format check, and tests                                    |

`npm run build` is what CI runs. It proves the JavaScript bundles; it does not build or sign a
native binary. Use `npx expo run:ios` / `npx expo run:android` or EAS for that.

## License

AGPL-3.0-only. See [LICENSE](LICENSE).
