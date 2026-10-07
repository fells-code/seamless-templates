---
"seamless-templates": minor
---

The Next.js starter can be driven by `seamless verify`. With `SEAMLESS_VERIFY_CAPTURE=true`, which only the conformance stack sets, its messaging holds one-time codes and magic links instead of sending them and serves them from `/api/verify-capture/<recipient>`, the same seam the conformance suite's Express adapter offers. The flag is off by default and the route answers 404 without it. Its `template.json` names the `nextjs` conformance project (fells-code/seamless-cli#222).
