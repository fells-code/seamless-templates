---
"seamless-templates": minor
---

feat(templates): give both React starters a design token layer, an app shell, and a shared UI kit

Both React starters (`react-vite` and `react-oauth`) now take every colour, radius,
shadow, duration and type size from custom properties declared in `src/index.css`.
No component carries a literal colour, so the whole application rethemes from one
block, and the tokens respond to the OS colour scheme without any `dark:` variants
in markup.

On top of that:

- `layouts/Layout.tsx` and `components/Navbar.tsx` are a persistent sidebar shell
  with full-width content, replacing the centered navbar over a centered column.
  The sidebar reads its own `shell` token family, so a theme can put a deep
  sidebar against light content.
- `src/components/kit` is a set of composable, token-styled pieces: `Screen`
  (which arranges a page by named archetype), `AuthFrame`, `StatRow`,
  `InlineCreateForm`, `RecordList`, `RecordCard`, `DataTable`, `RankedTable`,
  `ActionCard`, `EmptyState`, `Field`, `Toggle`, `PrimaryButton`, and a
  `useCollection` hook that loads a collection and creates optimistically.
  `kit/Example.tsx` is a worked screen built from them.
- Each starter's own pages are composed from the kit and use the tokens
  throughout. The OAuth starter keeps its provider-driven sign-in, its callback
  route and its own nav entries.

The tokens, the shell layout and the kit are identical in both starters and are
kept that way mechanically: they are edited in `shared/react-app` and copied into
each template by `npm run sync:shared`, and `npm run validate` fails when a copy
has drifted. This repository is not published to npm and the CLI copies exactly one
template directory into a new project, so each template has to carry its own copy
rather than importing a package.

Existing projects are unaffected until they scaffold again.
