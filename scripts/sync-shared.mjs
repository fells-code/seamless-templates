// Copies the shared React source of truth into every template that uses it.
//
// Usage:
//   node scripts/sync-shared.mjs           write the copies, reporting what changed
//   node scripts/sync-shared.mjs --check   report drift and exit 1, writing nothing
//
// The CLI copies exactly one template directory into a new project, so a template
// cannot reference a shared directory at the repo root: whatever a project needs
// has to sit inside its own template. The source of truth therefore lives in
// shared/react-app and is committed into each template as a plain copy, and the
// check below is what stops the two from drifting. `npm run validate` runs it, so
// CI and the pre-commit hook both fail on an edit made to a copy instead of the
// source.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sharedRoot = path.join(repoRoot, "shared/react-app");
const manifestPath = path.join(sharedRoot, "sync.json");

function filesUnder(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = entry.name;
    if (entry.isDirectory()) {
      out.push(
        ...filesUnder(path.join(dir, rel)).map((f) => path.join(rel, f)),
      );
    } else {
      out.push(rel);
    }
  }
  return out.sort();
}

/**
 * Every file the manifest maps, as { source, target } paths relative to the repo
 * root. A directory entry expands to one pair per file underneath it.
 */
function plan() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const pairs = [];

  for (const target of manifest.targets) {
    for (const { from, to } of manifest.files) {
      const absFrom = path.join(sharedRoot, from);
      if (!fs.existsSync(absFrom)) {
        throw new Error(
          `shared/react-app/sync.json maps "${from}", which is missing.`,
        );
      }

      if (fs.statSync(absFrom).isDirectory()) {
        for (const file of filesUnder(absFrom)) {
          pairs.push({
            source: path.join("shared/react-app", from, file),
            target: path.join(target, to, file),
            group: path.join(target, to),
          });
        }
      } else {
        pairs.push({
          source: path.join("shared/react-app", from),
          target: path.join(target, to),
        });
      }
    }
  }

  return pairs;
}

/**
 * Files sitting in a synced directory that the source no longer has. Deleting a
 * shared file otherwise leaves its copies behind, still compiling, still exported
 * from the barrel, and no longer coming from anywhere.
 */
function orphans(pairs) {
  const byGroup = new Map();
  for (const pair of pairs) {
    if (!pair.group) continue;
    if (!byGroup.has(pair.group)) byGroup.set(pair.group, new Set());
    byGroup.get(pair.group).add(path.relative(pair.group, pair.target));
  }

  const found = [];
  for (const [group, expected] of byGroup) {
    const abs = path.join(repoRoot, group);
    if (!fs.existsSync(abs)) continue;
    for (const file of filesUnder(abs)) {
      if (!expected.has(file)) found.push(path.join(group, file));
    }
  }
  return found.sort();
}

export function checkSharedSync() {
  const problems = [];
  let pairs;

  try {
    pairs = plan();
  } catch (err) {
    return [err.message];
  }

  for (const { source, target } of pairs) {
    const absTarget = path.join(repoRoot, target);
    if (!fs.existsSync(absTarget)) {
      problems.push(`${target} is missing; it is synced from ${source}.`);
      continue;
    }
    const want = fs.readFileSync(path.join(repoRoot, source), "utf8");
    const have = fs.readFileSync(absTarget, "utf8");
    if (want !== have) {
      problems.push(`${target} has drifted from ${source}.`);
    }
  }

  for (const orphan of orphans(pairs)) {
    problems.push(`${orphan} has no source in shared/react-app.`);
  }

  if (problems.length > 0) {
    problems.push(
      "Edit the file under shared/react-app, then run `npm run sync:shared`.",
    );
  }

  return problems;
}

function write() {
  const pairs = plan();
  const changed = [];

  for (const { source, target } of pairs) {
    const absTarget = path.join(repoRoot, target);
    const contents = fs.readFileSync(path.join(repoRoot, source), "utf8");
    const current = fs.existsSync(absTarget)
      ? fs.readFileSync(absTarget, "utf8")
      : null;
    if (current === contents) continue;

    fs.mkdirSync(path.dirname(absTarget), { recursive: true });
    fs.writeFileSync(absTarget, contents, "utf8");
    changed.push(target);
  }

  const stale = orphans(pairs);
  for (const orphan of stale) {
    fs.rmSync(path.join(repoRoot, orphan));
  }

  for (const file of changed) console.log(`  updated  ${file}`);
  for (const file of stale) console.log(`  removed  ${file}`);
  console.log(
    changed.length === 0 && stale.length === 0
      ? "shared/react-app is already in sync with every template."
      : `\nSynced ${changed.length + stale.length} file(s) from shared/react-app.`,
  );
}

const invokedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  if (process.argv.includes("--check")) {
    const problems = checkSharedSync();
    if (problems.length > 0) {
      for (const problem of problems) console.error(`  x ${problem}`);
      process.exit(1);
    }
    console.log("Every template copy matches shared/react-app.");
  } else {
    write();
  }
}
