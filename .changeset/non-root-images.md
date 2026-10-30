---
"seamless-templates": patch
---

Run the production images as non-root. The web templates (react-vite, react-oauth, vue, svelte, angular) now serve from `nginxinc/nginx-unprivileged` as the `nginx` user, and the Next.js `runtime` target runs as the `node` user. Every web container now listens on port 8080 instead of 80, so map `5173:8080` (and point healthchecks at 8080) in any compose file or deployment that ran these images.
