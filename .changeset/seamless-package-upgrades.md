---
'seamless-templates': minor
---

Move the templates onto the current Seamless packages: `@seamless-auth/react` `^0.7.0` in both React
templates, and `@seamless-auth/express` `^0.11.0` in the Express API template.

React 0.7.0 sources its types from `@seamless-auth/types` rather than maintaining a parallel set, so
the session page now shows the user's last login and each passkey's registration date, both of which
the API already sent but the older types did not describe. Timestamps are ISO strings on the wire, so
the page no longer has to accept a `Date` that never actually arrived, and `roles` is required rather
than optional.

The OAuth callback screen reads the auth server's failure code through the new `getOAuthErrorCode()`
and gives each of `oauth_missing_email`, `oauth_email_not_verified`, and `oauth_missing_subject` its
own message. All three are conditions at the provider that retrying cannot fix, so the previous
"please try again" was advice that could not work. Any other failure keeps the generic message.

Express 0.11.0 needs no template changes. Its breaking change splits `error` into `errorCode` and
`errorBody` on the handler result types, which only affects code importing handlers from
`@seamless-auth/core` directly; the template uses `createSeamlessAuthServer`, `requireAuth`, and
`requireRole`, whose HTTP responses are unchanged.

Fixes the auth route paths in the React starter README, which still listed the mixed-case spellings
(`/passKeyLogin`, `/verifyPhoneOTP`, `/verifyEmailOTP`, `/registerPasskey`, `/magiclinks-sent`) that
SDK 0.5.0 renamed and no longer serves.
