// Tags the current commit as v<version> (from package.json) and pushes it, idempotently.
//
// This is the release "publish" step. The repo is private (not published to npm); the shipped
// artifact is the git tag, which the Seamless CLI pins via its TEMPLATES_REF. Using a v-prefixed
// tag keeps the pinnable ref scheme consistent regardless of whether the tag is cut here, by the
// release workflow on a merged version PR, or by hand.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const tag = `v${pkg.version}`;

const git = (...args) => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();

const existsLocal = () => {
  try {
    git("rev-parse", "-q", "--verify", `refs/tags/${tag}`);
    return true;
  } catch {
    return false;
  }
};
const existsRemote = () => git("ls-remote", "--tags", "origin", tag).length > 0;

if (existsLocal() || existsRemote()) {
  console.log(`Tag ${tag} already exists, nothing to do.`);
  process.exit(0);
}

git("tag", "-a", tag, "-m", `Release ${tag}`);
git("push", "origin", tag);
console.log(`Created and pushed ${tag}.`);
