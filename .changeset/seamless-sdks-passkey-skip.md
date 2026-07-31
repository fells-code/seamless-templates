---
'seamless-templates': minor
---

Move the templates onto the Seamless SDK releases that let a user finish registration without a
passkey.

Registration used to end on a screen with one control on it. A user who did not want a passkey, or
whose device could not make one, had no way forward. `@seamless-auth/react` 0.8.0 offers a skip when
the instance has a login method other than `passkey` enabled, and says plainly when it does not.

The web and API templates have to move together for that to work. The skip is gated on reading
`GET /system-config/public` from the auth server, and the adapters serve routes from an explicit
list, so the React templates on 0.8.0 need an API template that proxies the new route. A web
template upgraded on its own would read nothing, and fall back to showing no skip at all.

- `@seamless-auth/react` 0.7.0 to 0.8.0 in both React templates
- `@seamless-auth/express` 0.11.0 to 0.12.0
- `@seamless-auth/fastify` 0.2.0 to 0.3.0
