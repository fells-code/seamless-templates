---
"seamless-templates": patch
---

Bump both React templates (react-vite and react-oauth) to `@seamless-auth/react`
`^0.6.0`. The only public type change in `0.6.0` is the removal of the
`bootstrapToken` field from `RegisterInput`, which neither template used, so no
template source changes are required.
