---
"seamless-templates": patch
---

The web, fullstack and mobile starters move to the Seamless Auth SDK releases that support magic links carrying a code in their fragment (`/verify-magiclink?token=...#code=...`): `@seamless-auth/react` 0.21.0, `@seamless-auth/angular` 0.6.0, `@seamless-auth/vue` 0.5.0, `@seamless-auth/svelte` 0.5.0, `@seamless-auth/nextjs` 0.11.0 and `@seamless-auth/react-native` 0.6.0. The bundled verify screens strip the link from the address bar, confirm on their own when the link is opened on the device that asked for it, and send the code when the reader approves another device.

The Next.js starter's own verify page now uses `takeMagicLinkParams`, `verifyMagicLinkSignIn`, `finishMagicLinkSignIn` and `confirmMagicLinkSignIn` from `@seamless-auth/client`, a new direct dependency at 0.11.0. It reads the code from the fragment, which only the browser sees, so it no longer takes the token from the page's search parameters. It keeps working against auth APIs that do not send a code.

No starter passes its own magic link `redirectUri`, so every link goes to the auth API's default, `<frontend URL>/verify-magiclink`, which each web starter serves.
