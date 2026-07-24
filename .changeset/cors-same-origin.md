---
"seamless-templates": patch
---

Fix the Express template rejecting its own same-origin requests. Now that the API
serves the admin console at `/console`, the console calls the API from the API's
own origin. Browsers omit `Origin` on a same-origin GET but send it on
POST/PATCH/DELETE, so with only `UI_ORIGINS` allowed the console's reads
succeeded while every write was refused. Requests whose `Origin` matches the
server's own host are now treated as same-origin and allowed.

Disallowed origins are also refused by withholding the CORS headers instead of
passing an error to the `cors` callback, which previously answered them with a
500 and made the cause hard to read. Cross-origin preflights from unknown origins
still receive no `Access-Control-Allow-Origin`, so they remain blocked.
