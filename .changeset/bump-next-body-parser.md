---
"seamless-templates": patch
---

Security: the Next.js starter now resolves `next` 16.4.6 (was 16.3.8), which clears GHSA-2464-fhr4-w9xw, GHSA-673q-mjm6-r5xr and GHSA-p3m5-59mp-jv5r, and the Express starter now resolves `body-parser` 2.4.0 (was 2.3.0) through an `overrides` entry, which clears GHSA-27r3-jxmh-p828. The Next.js `package.json` range is now `^16.4.6`.
