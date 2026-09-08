---
"seamless-templates": minor
---

Move the starters onto the current Seamless Auth packages.

`@seamless-auth/react` goes from 0.9.0 to 0.11.0 in both React starters,
`@seamless-auth/express` from 0.12.0 to 0.13.0, and `@seamless-auth/fastify`
from 0.3.1 to 0.4.0. These are all 0.x minors, so a caret range on the old
version would never have resolved to them and a scaffolded project stayed on
the versions pinned here however long ago.

The adapter bumps are pass-through. Both now forward a `redirectUri` from the
magic link request body to the auth API, and neither changes a type or a route
the starters touch, so the templates only needed the version.

The React bump drops `--seamless-disabled`, which 0.11.0 stopped reading when
the disabled submit button became the enabled button at reduced opacity rather
than a filled grey. The token is removed from `shared/react-app/index.css` and
synced into both starters. Every other `--seamless-*` token behaves as before.

Two behaviour changes arrive in the bundled screens that no starter code drives.
The passkey enrolment view no longer asks for a device name before the browser
prompt, and fills the credential's `friendlyName` with the enrolling device
instead. The sign-in screen now says why a disabled submit is refusing, in a
live region under the button.

The React bump also adds capability the starters do not use yet:
`AuthProvider` takes a `magicLinkRedirectUri`, `finishOAuthLogin` resolves with
the `returnTo` the flow asked for, `registerPasskey` accepts an `attachment`,
and `getPasskeyPolicyErrorCode()` reads a policy refusal off a failed
registration. The OAuth starter's own callback page still lands on `/`, which is
what it did before and what `returnTo` resolves to while its login sends none.
