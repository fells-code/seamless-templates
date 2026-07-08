# Seamless Templates Agent Guide

This repository holds the frontend and API starter templates for Seamless Auth. It is the source of
truth consumed by [`seamless-cli`](https://github.com/fells-code/seamless-cli): the CLI downloads
this repo at a pinned tag, reads [registry.json](registry.json), and copies the chosen templates
into a new project during `seamless init`.

This repo is not published to npm. Its `package.json` is `private` and exists only to host the
validation tooling and the Changesets release flow. The shipped artifact is a git tag.

## Working Standards (fells-code baseline)

These rules apply to every repository in the fells-code org. Repo-specific
guidance may extend them but must not contradict them.

### Attribution
- Commit and open PRs solely under the repository owner's identity. Never
  commit under an agent or assistant identity.
- Never attribute work to an AI assistant: no `Co-Authored-By: Claude` (or any
  assistant) trailers, no "Generated with" / "Created with Claude" notes, and no
  assistant branding or emoji anywhere in commit messages, PR or issue titles
  and descriptions, changesets, code comments, or docs.

### Comments
- Comment only when the code genuinely needs explaining: a non-obvious reason, a
  gotcha, or an invariant. Never narrate what the code plainly does.

### TODOs
- Every `TODO`/`FIXME` must reference a ticket, e.g. `// TODO(#123): ...`.
  Do not leave a bare TODO. If no ticket exists, create one first.

### Commits & branches
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `ci:`, `test:`).
- Descriptive branch names (`feat/...`, `fix/...`); never a `claude/` or other
  tool-generated prefix.

### Public-facing text
- No em dashes in commit messages, code comments, PR or issue text, changesets,
  or docs. Use a comma, parentheses, or a separate sentence.

### Before declaring work done
- All code quality checks must pass before you open a PR or call the work done:
  tests, linting, type checks, and formatting. Run them and report the real
  output; do not open a PR while any check is failing.
- Typical commands: `npm run typecheck`, `npm run lint`, `npm run format:check`
  (or `npm run format`), and `npm test`. Never claim a change works without
  running them.
- Match the surrounding code's style, naming, and comment density.

## Start Here

- Install tooling: `npm install`
- Validate the registry and every manifest: `npm run validate`
- Add a changeset for any change that affects scaffolded projects: `npm run changeset`

## Layout

- [registry.json](registry.json): the catalog the CLI reads to build its prompts. One entry per
  template (`id`, `kind`, `framework`, `label`, `status`, `path`).
- `templates/<kind>/<framework>/`: one directory per template. Each is a complete, runnable project
  and carries:
  - `template.json`: the manifest the CLI uses to place the template (`targetDir`) and configure its
    environment (`env.fromExample`, `env.set` with `{{placeholder}}` values the CLI resolves).
  - `.env.example`: the committed environment contract.
- [scripts/validate-templates.mjs](scripts/validate-templates.mjs): structural validation of the
  registry and manifests. The `--matrix` flag emits the buildable template list for CI.

The registry and manifest schemas are documented in [README.md](README.md). Keep them in sync with
how the CLI consumes them; a change to either schema is a coordinated change with `seamless-cli`.

## Adding or changing a template

1. Create or edit `templates/<kind>/<framework>/`.
2. Keep a committed `.env.example` and a `template.json` manifest.
3. Update `registry.json`.
4. Run `npm run validate`, then add a changeset.

A `coming-soon` status advertises a template in the CLI without requiring its content yet, so the
validation step skips directory checks for those entries.

## CI

- On pull requests, CI runs `npm run validate`, then installs and builds every buildable template
  (a `package.json` with a `build` script) as a smoke test. Keep templates green.
- On a push to `main`, the release workflow opens or updates a "version packages" PR via Changesets;
  merging it bumps the version, creates the tag the CLI pins, and publishes a GitHub Release for
  that tag with notes drawn from `CHANGELOG.md`.

## Conventions

- Commit, comment, TODO, branch-naming, and attribution rules live in Working
  Standards above. In this repo they are enforced locally: `npm install` installs
  a Husky `commit-msg` hook (commitlint, `@commitlint/config-conventional`) and a
  `pre-commit` hook that runs `npm run validate`, so a non-conforming commit is
  rejected before it lands.
- **Releases use Changesets.** Any change that affects scaffolded projects needs a changeset. Do not
  hand-edit the version or `CHANGELOG.md`.
- Keep template projects minimal and idiomatic for their framework. They are the first thing a new
  user sees, so they should run cleanly right after the CLI completes.

## Before You Finish A Change

- Run `npm run validate`.
- If you added or touched a template, install and build it locally the way CI will.
- Add a changeset for any user-facing change.
