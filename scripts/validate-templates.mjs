// Validates registry.json and every referenced template manifest.
//
// Usage:
//   node scripts/validate-templates.mjs            human-readable validation, exits 1 on error
//   node scripts/validate-templates.mjs --matrix   on success, prints a JSON array of buildable
//                                                   templates ({ id, path }) to stdout for CI
//
// The contract enforced here is the same one the Seamless CLI relies on when it reads the
// registry to build prompts and scaffold a project, so a green run means the CLI can consume it.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const matrixMode = process.argv.includes("--matrix");

const KINDS = new Set(["web", "api"]);
const STATUSES = new Set(["stable", "beta", "coming-soon"]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const errors = [];
const fail = (msg) => errors.push(msg);

function readJson(absPath) {
  const raw = fs.readFileSync(absPath, "utf8");
  return JSON.parse(raw);
}

function validate() {
  const registryPath = path.join(repoRoot, "registry.json");
  if (!fs.existsSync(registryPath)) {
    fail("registry.json is missing at the repo root.");
    return [];
  }

  let registry;
  try {
    registry = readJson(registryPath);
  } catch (err) {
    fail(`registry.json is not valid JSON: ${err.message}`);
    return [];
  }

  if (registry.schemaVersion !== 1) {
    fail(`registry.json schemaVersion must be 1, got ${JSON.stringify(registry.schemaVersion)}.`);
  }
  if (!Array.isArray(registry.templates)) {
    fail("registry.json must have a templates array.");
    return [];
  }

  const buildable = [];
  const seenIds = new Set();

  for (const [i, entry] of registry.templates.entries()) {
    const where = `templates[${i}]${entry && entry.id ? ` (${entry.id})` : ""}`;

    const requireString = (field) => {
      if (typeof entry[field] !== "string" || entry[field].length === 0) {
        fail(`${where}: "${field}" must be a non-empty string.`);
        return false;
      }
      return true;
    };

    requireString("id");
    requireString("framework");
    requireString("label");
    requireString("path");

    if (typeof entry.id === "string") {
      if (!ID_PATTERN.test(entry.id)) {
        fail(`${where}: id must be kebab-case ([a-z0-9-]).`);
      }
      if (seenIds.has(entry.id)) {
        fail(`${where}: duplicate id "${entry.id}".`);
      }
      seenIds.add(entry.id);
    }
    if (!KINDS.has(entry.kind)) {
      fail(`${where}: kind must be one of ${[...KINDS].join(", ")}.`);
    }
    if (!STATUSES.has(entry.status)) {
      fail(`${where}: status must be one of ${[...STATUSES].join(", ")}.`);
    }

    // A coming-soon entry is advertised in the CLI prompts but may not have content yet.
    if (entry.status === "coming-soon" || typeof entry.path !== "string") {
      continue;
    }

    const templateDir = path.join(repoRoot, entry.path);
    if (!fs.existsSync(templateDir) || !fs.statSync(templateDir).isDirectory()) {
      fail(`${where}: path "${entry.path}" does not exist or is not a directory.`);
      continue;
    }

    const manifestPath = path.join(templateDir, "template.json");
    if (!fs.existsSync(manifestPath)) {
      fail(`${where}: missing template.json in ${entry.path}.`);
      continue;
    }

    let manifest;
    try {
      manifest = readJson(manifestPath);
    } catch (err) {
      fail(`${where}: template.json is not valid JSON: ${err.message}`);
      continue;
    }

    if (manifest.id !== entry.id) {
      fail(`${where}: template.json id "${manifest.id}" does not match registry id "${entry.id}".`);
    }
    if (typeof manifest.targetDir !== "string" || manifest.targetDir.length === 0) {
      fail(`${where}: template.json must set a non-empty "targetDir".`);
    }
    if (manifest.env == null || typeof manifest.env !== "object") {
      fail(`${where}: template.json must have an "env" object.`);
    } else {
      const { fromExample, set } = manifest.env;
      if (fromExample != null && typeof fromExample !== "string") {
        fail(`${where}: env.fromExample must be a string when present.`);
      }
      if (typeof fromExample === "string") {
        const examplePath = path.join(templateDir, fromExample);
        if (!fs.existsSync(examplePath)) {
          fail(`${where}: env.fromExample points at "${fromExample}", which is missing.`);
        }
      }
      if (set != null && (typeof set !== "object" || Array.isArray(set))) {
        fail(`${where}: env.set must be an object of string values when present.`);
      }
    }

    if (fs.existsSync(path.join(templateDir, "package.json"))) {
      buildable.push({ id: entry.id, path: entry.path });
    }
  }

  return buildable;
}

const buildable = validate();

if (errors.length > 0) {
  for (const err of errors) {
    console.error(`  x ${err}`);
  }
  console.error(`\n${errors.length} validation error(s).`);
  process.exit(1);
}

if (matrixMode) {
  process.stdout.write(JSON.stringify(buildable));
} else {
  console.log("registry.json and all template manifests are valid.");
}
