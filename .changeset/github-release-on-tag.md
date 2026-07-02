---
"seamless-templates": patch
---

Publish a GitHub Release on each version. When the "version packages" PR merges, the release step now creates an official GitHub Release for the new v<version> tag, with notes drawn from the matching CHANGELOG.md section, in addition to pushing the tag. The step is idempotent: it skips tag creation and release creation when either already exists.
