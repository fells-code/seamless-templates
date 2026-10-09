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

- Run the repo's checks (typecheck, lint, format, tests) and report real output.
  Never claim a change works without running them.
- Match the surrounding code's style, naming, and comment density.

## Start Here

- Install tooling: `npm install`
- Validate the registry and every manifest: `npm run validate`
- Add a changeset for any change that affects scaffolded projects: `npm run changeset`

## Layout

- [registry.json](registry.json): the catalog the CLI reads to build its prompts. One entry per
  template (`id`, `kind`, `framework`, `label`, `status`, `path`).
- `templates/<kind>/<framework>/`: one directory per template, where `kind` is `web`, `api`,
  `mobile` (the Expo starter under `templates/mobile/expo`), or `fullstack` (the Next.js starter
  under `templates/fullstack/nextjs`, which serves `/auth` itself and needs no `api` template). Each is a complete, runnable project
  and carries:
  - `template.json`: the manifest the CLI uses to place the template (`targetDir`) and configure its
    environment (`env.fromExample`, `env.set` with `{{placeholder}}` values the CLI resolves).
  - `.env.example`: the committed environment contract.
  - `AGENTS.md`, plus a `CLAUDE.md` that imports it: guidance for coding agents working in the
    generated project (topology, where auth lives, the rules against hand-rolled JWT, session,
    cookie or password code, and the real commands). Every path, export, env var and command
    it names must exist in that template, so update it with any change that moves one.
- `shared/react-app/`: the source of truth for what both React starters share (the design tokens in
  `index.css`, the app shell layout, the UI kit under `components/kit`, and the fetch seam under
  `lib/` that the kit calls). The CLI copies exactly
  one template directory into a new project, so a template cannot reference anything outside itself.
  Each template therefore carries a committed copy, written by `npm run sync:shared`. Edit the file
  under `shared/react-app/`, never a template's copy. The Next.js, Angular, Vue and SvelteKit
  starters take only `index.css` and `fonts` (an `only` list in `sync.json`); SvelteKit's fonts land
  in `static/fonts` through the target's `to` map.
- [scripts/validate-templates.mjs](scripts/validate-templates.mjs): structural validation of the
  registry and manifests, plus the shared-source drift check. The `--matrix` flag emits the buildable
  template list for CI.
- [scripts/sync-shared.mjs](scripts/sync-shared.mjs): copies `shared/react-app` into every template
  listed in `shared/react-app/sync.json`. `--check` reports drift instead of writing.

The registry and manifest schemas are documented in [README.md](README.md). Keep them in sync with
how the CLI consumes them; a change to either schema is a coordinated change with `seamless-cli`.

## Adding or changing a template

1. Create or edit `templates/<kind>/<framework>/`.
2. Keep a committed `.env.example` and a `template.json` manifest.
3. Update `registry.json`.
4. If the change touches something under `shared/`, edit it there and run `npm run sync:shared`.
5. Run `npm run validate`, then add a changeset.

A `coming-soon` status advertises a template in the CLI without requiring its content yet, so the
validation step skips directory checks for those entries.

## The Angular, Vue and SvelteKit starters

- They mirror the React starter's flows and keep the accessible names the conformance suite drives
  ("Open account menu", "Logout", "You are signed in"), so `seamless verify` runs the React browser
  specs against them. `verify.project` in each `template.json` picks the harness's compose service.
- Their Dockerfiles have an empty `sdk` stage that `seamless verify` replaces with a build context
  of local SDK tarballs. Every other build, the CLI's compose file included, uses the lockfile. The
  last stage is the nginx runtime, because the CLI builds the default target.
- The Angular CLI does not read `.env`, so `npm run dev` and `npm run build` write `API_URL` into
  `public/config.js` first (`scripts/write-config.mjs`). Its dev server is pinned to port 5173 in
  `angular.json`, with prebundling off so it does not restart under the first request.
- The SvelteKit starter is a single-page app (`adapter-static` with an `index.html` fallback, `ssr`
  off), not the full-stack SvelteKit template, which would serve `/auth` itself. Its prettier config
  loads `prettier-plugin-svelte`, which only its own install has, so the root `.prettierignore` skips
  it and its own `format:check` covers it.

## The Next.js starter

- It is `kind: "fullstack"`, which `seamless-cli` 0.18.0 and later scaffold as a beta template
  (`seamless init my-app --nextjs`, placed in the web slot with no api template and `--admin=none`).
  Its manifest pins `requires.cliMin` to 0.18.0. Older CLIs ignore the kind, which is why it is not
  `web`: as a web template the CLI would scaffold an unused api beside it and a compose service it
  does not fit. `seamless verify` in CLI 0.18.0 skips it (fells-code/seamless-cli#222); coverage is
  on `seamless-cli` main but unreleased.
- It syncs only `index.css` and `fonts` from `shared/react-app` (the `only` list in `sync.json`).
  The kit's `ActionCard` imports react-router, so the kit cannot be imported from a Next.js app.
- Server code reads its configuration per request (`src/lib/config.ts`), never at module scope:
  `next build` imports the route modules with no `.env`, and the root layout is
  `force-dynamic` so a build without one does not prerender the configuration error.
- `next dev` (Next.js 16.3+) upserts a managed agent-rules block into the starter's `AGENTS.md`
  when it detects a coding agent. Discard that change here rather than committing it; in a
  scaffolded project it is welcome.
- `getSeamlessSession` must never be replaced by a server-side call to `/auth/users/me` with the
  browser's cookies forwarded. That refreshes on the server, rotating the refresh token in a
  response the browser never receives, and the browser's next refresh revokes the session.

## CI

- The template matrix runs on **the changesets release pull request only**, not on every pull
  request. On that PR, CI installs every buildable template and runs its `typecheck`, `lint`,
  `format:check`, `test`, and `build` scripts. Each step is `--if-present`, so a template that has
  not adopted one is skipped rather than failed, but a declared script has to pass. That PR is the
  last gate before a tag the CLI pins, so it is the one that has to be green.
- Everything else is local. `npm run validate` and `npm run format:check` run in the pre-commit
  hook, and each template's own `npm run check` is what to run while working on it. Nothing checks
  an ordinary pull request for you, so run the template's `check` before opening one. That also
  means the hook has to be installed: see Conventions.
- The cross-repo conformance workflow still runs on every pull request. It is owned by
  `seamless-cli` and tests this repo's templates against the rest of the ecosystem.
- On a push to `main`, the release workflow opens or updates a "version packages" PR via Changesets;
  merging it bumps the version, creates the tag the CLI pins, and publishes a GitHub Release for
  that tag with notes drawn from `CHANGELOG.md`.

## Conventions

- Commit, comment, TODO, branch-naming, and attribution rules live in Working
  Standards above. In this repo they are enforced locally: `npm install` installs
  a Husky `commit-msg` hook (commitlint, `@commitlint/config-conventional`) and a
  `pre-commit` hook that runs `npm run validate` and `npm run format:check`, so a
  non-conforming commit is rejected before it lands.
- **Run `npm install` at the root before your first commit.** Husky writes
  `.husky/_`, which is gitignored, and sets `core.hooksPath` to it. A clone that
  has never been installed has `core.hooksPath` pointing at a directory that does
  not exist, so every hook silently does nothing and there is no message saying
  so. Since the fast checks moved out of CI, that clone has no gate at all until
  the template matrix runs on the pull request.
- **Releases use Changesets.** Any change that affects scaffolded projects needs a changeset. Do not
  hand-edit the version or `CHANGELOG.md`.
- Keep template projects minimal and idiomatic for their framework. They are the first thing a new
  user sees, so they should run cleanly right after the CLI completes.
- Every template declares the same verification scripts: `typecheck`, `lint`, `lint:fix`, `format`,
  `format:check`, `test`, `test:watch`, `test:coverage`, and a `check` that runs the gate in one
  command. Tests are Vitest, colocated as `*.test.ts` / `*.test.tsx`, and must pass without a
  database, an auth server, or network access. A new template adopts the same set.
- The Gin, Axum and FastAPI api templates are not npm projects. They carry their toolchain's own
  gate (see README, "API templates in other languages") instead of the npm scripts, and the
  `native-template-checks` job finds them by `go.mod`, `Cargo.toml` or `pyproject.toml`. They
  mirror the Express starter's routes, environment contract and behaviour; change them together.
  Their Docker dev target must build outside `/app`, because the CLI's compose file bind-mounts the
  source over it.
- The mobile template's `build` is `expo export` for iOS and Android, which bundles the JavaScript
  without Xcode or the Android SDK, so the templates CI matrix can run it. It proves the bundle, not
  a native binary; its screens are exercised on a simulator, and only its pure modules are under
  Vitest. It is not a `shared/react-app` sync target: React Native cannot use the web kit.

## Before You Finish A Change

- Run `npm run validate`.
- If you added or touched a template, install it and run `npm run check` in it locally, the way CI
  will.
- Add a changeset for any user-facing change.
