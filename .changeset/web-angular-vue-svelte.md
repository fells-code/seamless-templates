---
"seamless-templates": minor
---

Add Angular, Vue (Vite) and SvelteKit web starters on `@seamless-auth/angular`, `@seamless-auth/vue` and `@seamless-auth/svelte`, each usable with any api template (`seamless init --angular`, `--vue` or `--svelte`). Each has the binding's sign-in screens behind route guards, a top bar with the account menu, a page gated by the `betaUser` role that calls the API with `authorizedFetch`, a configuration page when the API origin is missing, and the React starter's design tokens and fonts. Their Dockerfiles serve the production build with nginx by default, with a `dev` target for the development server, and `seamless verify` drives them with the same browser specs as the React starter.
