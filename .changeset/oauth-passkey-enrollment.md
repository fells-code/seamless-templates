---
"seamless-templates": minor
---

The OAuth starter follows `nextStep: 'enroll_passkey'` from the auth server into a new `/enroll-passkey` screen. The server sends it after a sign-in through a provider with `promptPasskeyEnrollment` set, a legacy identity provider the organization is moving off, when the user has no passkey yet. The screen registers one with `useAuthClient().registerPasskey`, or lets the user continue without one; the server asks again at the next sign-in.
