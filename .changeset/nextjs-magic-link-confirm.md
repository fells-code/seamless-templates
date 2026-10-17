---
"seamless-templates": minor
---

The Next.js starter's magic link page handles the auth server's cross-device confirmation step. When a link is opened on a different device from the one that requested it, the page shows which kind of device asked and when, and offers "Yes, sign in that device" or "No, this wasn't me". Approving confirms the link and tells the reader to return to the other device; declining signs nothing in. The page uses the SDK's `confirmMagicLink` when the installed `@seamless-auth/react` provides it and otherwise posts to the same route through `/auth`.
