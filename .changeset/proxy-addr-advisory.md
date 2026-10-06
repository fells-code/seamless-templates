---
"seamless-templates": patch
---

The Express API starter now locks `proxy-addr` 2.0.8, for GHSA-jqcg-44mw-7w3h (critical, client IP spoofing through an IPv4-mapped IPv6 address behind a trusted proxy). Both API starters also take the non-breaking fixes for the brace-expansion, qs and moment advisories.
