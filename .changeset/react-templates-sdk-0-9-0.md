---
'seamless-templates': minor
---

Move both React starters to `@seamless-auth/react` `^0.9.0`.

0.9.0 makes the bundled auth screens themeable. Every colour in them now reads from a `--seamless-*`
CSS custom property with the previous literal as its fallback, so a project can match the auth UI to
its brand by setting those variables on `:root` or on any ancestor of `<AuthRoutes />`.

The upgrade is additive. The public API is unchanged between 0.8.0 and 0.9.0, and a template that
sets no variables renders exactly as it did before, so neither starter needed a source change. Both
were installed, built, and linted against 0.9.0.
