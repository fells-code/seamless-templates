# Seamless Templates Agent Guide

This repository holds the frontend and API starter templates for Seamless Auth. It is the source of
truth consumed by [`seamless-cli`](https://github.com/fells-code/seamless-cli): the CLI downloads
this repo at a pinned tag, reads [registry.json](registry.json), and copies the chosen templates
into a new project during `seamless init`.

This repo is not published to npm. Its `package.json` is `private` and exists only to host the
validation tooling and the Changesets release flow. The shipped artifact is a git tag.

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

- **Do not use em dashes** in public-facing text: commit messages, code comments, PR and issue
  descriptions, changesets, and docs. Use a comma, parentheses, or a separate sentence instead.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`). This is enforced
  locally: `npm install` sets up a Husky `commit-msg` hook that runs commitlint
  (`@commitlint/config-conventional`), and a `pre-commit` hook that runs `npm run validate`. A commit
  that fails either check is rejected before it lands, matching the rest of the Seamless Auth
  ecosystem.
- **Branches**: name branches with a type prefix that matches the change, `feat/`, `fix/`, `bug/`,
  `chore/`, `ci/`, or `docs/`, followed by a short kebab-case description (for example
  `feat/react-oauth` or `chore/commit-hygiene`). Do not use a `claude/` or other tool-generated
  prefix.
- **Do not add a `Co-Authored-By: Claude ...` trailer (or any AI co-author trailer) to commits.**
  All commits must be authored under the maintainer's own account (verify with `gh auth status`
  and `git config user.email`).
- **Releases use Changesets.** Any change that affects scaffolded projects needs a changeset. Do not
  hand-edit the version or `CHANGELOG.md`.
- Keep template projects minimal and idiomatic for their framework. They are the first thing a new
  user sees, so they should run cleanly right after the CLI completes.

## Before You Finish A Change

- Run `npm run validate`.
- If you added or touched a template, install and build it locally the way CI will.
- Add a changeset for any user-facing change.
