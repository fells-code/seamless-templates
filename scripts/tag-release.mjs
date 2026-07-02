// Tags the current commit as v<version> (from package.json), pushes it, and publishes a matching
// GitHub Release, all idempotently.
//
// This is the release "publish" step. The repo is private (not published to npm); the shipped
// artifact is the git tag, which the Seamless CLI pins via its TEMPLATES_REF. Using a v-prefixed
// tag keeps the pinnable ref scheme consistent regardless of whether the tag is cut here, by the
// release workflow on a merged version PR, or by hand. The GitHub Release gives that tag a
// browsable page with the notes for this version drawn from CHANGELOG.md.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const tag = `v${pkg.version}`;

const git = (...args) => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();
const gh = (...args) => execFileSync("gh", args, { cwd: repoRoot, encoding: "utf8" }).trim();

const existsLocal = () => {
  try {
    git("rev-parse", "-q", "--verify", `refs/tags/${tag}`);
    return true;
  } catch {
    return false;
  }
};
const existsRemote = () => git("ls-remote", "--tags", "origin", tag).length > 0;

// Pull the section for a given version out of CHANGELOG.md: everything under the "## <version>"
// heading up to the next "## " heading (the previous release) or the end of the file.
const changelogNotes = (version) => {
  let text;
  try {
    text = readFileSync(path.join(repoRoot, "CHANGELOG.md"), "utf8");
  } catch {
    return "";
  }
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${version}`);
  if (start === -1) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
};

const releaseExists = () => {
  try {
    gh("release", "view", tag);
    return true;
  } catch {
    return false;
  }
};

if (existsLocal() || existsRemote()) {
  console.log(`Tag ${tag} already exists, skipping tag creation.`);
} else {
  git("tag", "-a", tag, "-m", `Release ${tag}`);
  git("push", "origin", tag);
  console.log(`Created and pushed ${tag}.`);
}

if (releaseExists()) {
  console.log(`GitHub Release ${tag} already exists, nothing to do.`);
} else {
  const notes = changelogNotes(pkg.version) || `Release ${tag}.`;
  // execFileSync passes args to gh without a shell, so multi-line notes need no escaping.
  gh("release", "create", tag, "--title", tag, "--notes", notes);
  console.log(`Created GitHub Release ${tag}.`);
}
