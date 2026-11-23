---
"seamless-templates": patch
---

The React, React OAuth, Angular, Vue and SvelteKit starters now send a Content-Security-Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` on the SPA document and every other response. The container entrypoint writes the headers to an include that the server block and each nginx location pull in, because nginx dropped the server-level headers in locations that set their own, the `index.html` one included. The policy allows scripts from the app's origin only (the SvelteKit bootstrap script by its hash), and the origin of `API_URL` is added to `connect-src`. The Angular build no longer inlines critical CSS, which needed an inline script. The Next.js starter sends the same headers from `next.config.ts`, with inline scripts allowed because Next.js boots pages from them. The deprecated `X-XSS-Protection` header is gone.
