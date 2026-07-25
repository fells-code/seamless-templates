---
"seamless-templates": minor
---

Set `NODE_ENV=development` in the Express template's `.env.example`.

The template's dev messaging handlers (which log OTP, magic-link, and
bootstrap-invite links to the API console instead of sending real email/SMS) are
gated on `NODE_ENV === "development"`. Without the variable set, `messaging` was
`undefined`, so the adapter never requested external delivery and local auth
links appeared nowhere — not in the API logs and not in the CLI. Shipping the
flag in `.env.example` (loaded via `env_file` in Docker and by `dotenv` for
local `npm run dev`) makes local delivery work out of the box.
