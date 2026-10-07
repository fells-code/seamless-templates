---
"seamless-templates": patch
---

Use `@seamless-auth/react` 0.15.1 in the React, React OAuth, and Next.js starters. It fixes the bundled magic-link screen, which sent the single-use link twice (under React Strict Mode in development, and on a remount while the session loads in production) and showed "Failed to verify token" for a link that worked (fells-code/seamless-auth-react#161).
