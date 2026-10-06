---
"seamless-templates": minor
---

Add a Next.js App Router starter, `templates/fullstack/nextjs`, under a new registry kind, `fullstack`. It serves the Seamless Auth `/auth` routes itself through `@seamless-auth/nextjs`, resolves the session in the root layout so the first paint shows who is signed in, and protects pages in `proxy.ts`. Sign-in and account creation are built on the SDK's hooks: passkeys, one-time codes, and magic links. `seamless-cli` does not offer the `fullstack` kind yet, so older CLIs ignore it and `seamless verify` skips it.

`shared/react-app/sync.json` targets can now take an `only` list, so a template can sync part of the shared source. The Next.js starter takes the design tokens and fonts, not the UI kit.
