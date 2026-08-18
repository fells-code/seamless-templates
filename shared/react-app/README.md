# Shared React sources

The source of truth for the parts of the React starters that must stay identical:
the design tokens, the app shell layout, and the UI kit.

Both `templates/web/react-vite` and `templates/web/react-oauth` carry a committed
copy of everything here. Edit the file in this directory, then run:

```bash
npm run sync:shared
```

`npm run validate` fails when a copy has drifted, so CI and the pre-commit hook both
catch an edit made to a template copy instead of to the source.

## Why copies rather than a package or a symlink

`seamless-cli` copies exactly one template directory into a new project. A template
cannot reference anything outside its own directory, because nothing outside it is
copied. That rules out importing from a repo-root directory, and a symlink is both
fragile across platforms and useless once the template is copied. Publishing the kit
to npm would work, but this repository is private and is not published; its shipped
artifact is a git tag.

So each template gets a real copy, and the drift check is what keeps the copies
honest. The copies carry no generated-file banner on purpose: they are ordinary
source in the project a user scaffolds, and a banner pointing at a directory that
does not exist in their project would only confuse them.

## What is in here

| Path                   | Copied to                     |
| ---------------------- | ----------------------------- |
| `index.css`            | `src/index.css`               |
| `layouts/Layout.tsx`   | `src/layouts/Layout.tsx`      |
| `components/kit/`      | `src/components/kit/`         |

`sync.json` is the manifest the sync script reads. `.prettierrc.json` matches the
one each template ships, so formatting these sources with the template's Prettier
produces the same bytes the templates are checked against.

## What is deliberately not shared

`src/components/Navbar.tsx` is per-template. Each starter lists its own routes in
the nav, and `react-oauth` has no beta-access route. The file is also an anchor for
the code generation in the `seamless-idea` repository, which patches generated nav
links in beside the literal `{ label: "Home", to: "/" },` entry, so the array has to
stay written out in each template rather than moving behind an abstraction.
