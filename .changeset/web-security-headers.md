---
"seamless-templates": patch
---

The React, React OAuth, Angular, Vue and SvelteKit starters now send a Content-Security-Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` on the SPA document and every other response. The headers sit in a shared `security-headers.conf` that each nginx location includes, because nginx dropped the server-level headers in locations that set their own, the `index.html` one included. The policy allows scripts from the app's origin only (the SvelteKit bootstrap script by its hash), and the container entrypoint adds the origin of `API_URL` to `connect-src`. The Angular build no longer inlines critical CSS, which needed an inline script. The Next.js starter sends the same headers from `next.config.ts`, with inline scripts allowed because Next.js boots pages from them. The deprecated `X-XSS-Protection` header is gone.
