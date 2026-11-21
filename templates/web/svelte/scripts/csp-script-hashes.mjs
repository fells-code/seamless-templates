// Prints a CSP source for every inline <script> in the built HTML, space
// separated: SvelteKit boots each page from one, so script-src 'self' alone
// would block the app. The Dockerfile passes the result to the nginx headers.
//
// Usage: node scripts/csp-script-hashes.mjs build

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.argv[2];
if (!root) {
  console.error("Usage: node scripts/csp-script-hashes.mjs <build directory>");
  process.exit(1);
}

const inlineScript = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
const sources = new Set();

for (const entry of readdirSync(root, { recursive: true })) {
  if (!entry.endsWith(".html")) continue;
  const html = readFileSync(path.join(root, entry), "utf8");
  for (const [, body] of html.matchAll(inlineScript)) {
    const digest = createHash("sha256").update(body, "utf8").digest("base64");
    sources.add(`'sha256-${digest}'`);
  }
}

process.stdout.write([...sources].sort().join(" "));
