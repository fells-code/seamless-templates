---
"seamless-templates": minor
---

A kit can put a screen's header beside its content, not only above it.

Every banded screen in every kit ran the same way down the page: a strip of brand
colour across the top, then the content under it. `Screen` now wraps its regions
in a `screen-flow` element that resolves to `display: contents` by default, which
takes it out of the layout entirely, so a screen renders exactly as it did
before. A kit that resolves it to a grid instead gets the header in a column of
its own with the content beside it, and the header stays put while the views
scroll past. Below 64rem it is one column again whatever the kit asked for,
because a title column beside a table is two unusable columns on a phone.

`StatRow` measures the space it has rather than the size of the window. Its
column counts were Tailwind's responsive ones, which read the viewport; in a
header column about a sixth of the window wide, a desktop still said four across
and three figures came out as three unreadable slivers. It fills by available
width now, the same way the card grid already did.
