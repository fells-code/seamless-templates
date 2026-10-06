---
"seamless-templates": patch
---

Move the React starters onto `@seamless-auth/react` 0.14.0. `react-vite` imports `AuthRoutes` from `@seamless-auth/react/routes`, where 0.14.0 moved it. The OAuth starter explains the two new OAuth failure codes: `oauth_provider_retired`, for a user whose organization no longer signs in with that provider, and `oauth_invalid_id_token`.
