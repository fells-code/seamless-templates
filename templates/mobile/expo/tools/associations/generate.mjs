#!/usr/bin/env node
// Emits the two association files native passkeys and universal links need,
// plus the Android origin the auth server's ORIGINS list has to carry.
//
//   node tools/associations/generate.mjs \
//     --team-id ABCDE12345 --bundle-id com.example.app \
//     --package com.example.app \
//     --fingerprint AA:BB:CC:...   (SHA-256 of the signing certificate, colon hex)
//     [--out ./well-known]
//
// Host the output at https://<rpid>/.well-known/ as application/json, with no
// redirect. The RP ID is the domain the files are served from, and the web app
// must be same-site with it.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const teamId = arg("team-id");
const bundleId = arg("bundle-id");
const pkg = arg("package");
const fingerprint = arg("fingerprint");
const out = arg("out") ?? "well-known";

if (!teamId || !bundleId || !pkg || !fingerprint) {
  console.error(
    "Usage: generate.mjs --team-id <id> --bundle-id <id> --package <name> --fingerprint <sha256 hex> [--out dir]",
  );
  process.exit(1);
}

// The Team ID is the OU of the signing certificate. The value in parentheses
// in the certificate's common name is the certificate id, not the team; an
// association file built with that fails validation silently.
const appId = `${teamId}.${bundleId}`;

const hex = fingerprint.replace(/[^0-9a-f]/gi, "");
if (hex.length !== 64) {
  console.error(
    "The fingerprint must be the SHA-256 of the signing certificate (32 bytes).",
  );
  process.exit(1);
}
const colonHex = hex.toUpperCase().match(/.{2}/g).join(":");

// Android's WebAuthn origin is the same digest, base64url rather than hex.
// Converting one to the other by hand is the usual mistake, so both come from
// one input here.
const base64url = Buffer.from(hex, "hex").toString("base64url");
const androidOrigin = `android:apk-key-hash:${base64url}`;

const aasa = {
  applinks: {
    details: [
      {
        appIDs: [appId],
        components: [
          { "/": "/verify-magiclink*" },
          { "/": "/oauth/callback*" },
        ],
      },
    ],
  },
  webcredentials: { apps: [appId] },
};

const assetlinks = [
  {
    relation: [
      "delegate_permission/common.handle_all_urls",
      "delegate_permission/common.get_login_creds",
    ],
    target: {
      namespace: "android_app",
      package_name: pkg,
      sha256_cert_fingerprints: [colonHex],
    },
  },
];

mkdirSync(out, { recursive: true });
writeFileSync(
  join(out, "apple-app-site-association"),
  JSON.stringify(aasa, null, 2) + "\n",
);
writeFileSync(
  join(out, "assetlinks.json"),
  JSON.stringify(assetlinks, null, 2) + "\n",
);

console.log(
  `Wrote ${join(out, "apple-app-site-association")} and ${join(out, "assetlinks.json")}`,
);
console.log("");
console.log("Add to the auth server's ORIGINS (after the web origin):");
console.log(`  ${androidOrigin}`);
