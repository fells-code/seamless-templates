---
"seamless-templates": minor
---

feat(templates): give the React starter a design token layer, an app shell, and a UI kit

The React (Vite) starter now takes every colour, radius, shadow, duration and type
size from custom properties declared in `src/index.css`. No component carries a
literal colour, so the whole application rethemes from one block, and the tokens
respond to the OS colour scheme without any `dark:` variants in markup.

On top of that:

- `layouts/Layout.tsx` and `components/Navbar.tsx` are a persistent sidebar shell
  with full-width content, replacing the centered navbar over a centered column.
  The sidebar reads its own `shell` token family, so a theme can put a deep
  sidebar against light content.
- `src/components/kit` is a set of composable, token-styled pieces: `Screen`
  (which arranges a page by named archetype), `StatRow`, `InlineCreateForm`,
  `RecordList`, `RecordCard`, `DataTable`, `RankedTable`, `EmptyState`, `Field`,
  `Toggle`, `PrimaryButton`, and a `useCollection` hook that loads a collection
  and creates optimistically. `kit/Example.tsx` is a worked screen built from them.
- The starter's own pages use the tokens throughout.

Existing projects are unaffected until they scaffold again.
