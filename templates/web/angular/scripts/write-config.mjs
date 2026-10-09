// Writes public/config.js, where the app reads its API origin.
//
// The Angular CLI does not read .env files, so `npm run dev` and `npm run build`
// run this first with Node's --env-file-if-exists=.env. In the container image,
// entrypoint.sh writes the same file from API_URL at startup instead.

import fs from "node:fs";

const apiUrl = (process.env.API_URL ?? "").trim();

fs.writeFileSync(
  new URL("../public/config.js", import.meta.url),
  `window.__SEAMLESS_CONFIG__ = { API_URL: ${JSON.stringify(apiUrl)} };\n`,
);
