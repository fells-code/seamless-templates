---
"seamless-templates": patch
---

Support Node 22 and newer. The repo and the React, React OAuth, Expo, and Next.js starters now declare `engines.node` as `>=22` instead of an upper bound below Node 25, and the release validation checks every template on Node 22, 24, and the latest release (fells-code/seamless-auth-api#339).
