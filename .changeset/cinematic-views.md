---
"seamless-templates": minor
---

feat(templates): give each style its own voice, and replace generated artwork

The shared React kit gains a font token per role (`--app-font-display`,
`--app-font-body`, `--app-font-label`), a `Vista` backdrop component, and
full-viewport views with scroll-driven transitions. Nothing is downloaded: the
tokens name system stacks only, so the lever is which of the faces an OS already
ships each style reaches for.

`Vista` is a fixed stack of four layers behind the page: two concentrated light
sources, concentric rings, a slow conic sweep, and a ruled grid. Every layer is a
gradient built from the application's own two colours, so one component still
comes out looking like that application, and a style that wants no backdrop sets
each layer to `none`. It also carries the page background, which is why the shell
mounts it once and content above it needs `above-vista`.

Each region a `Screen` renders is now a view. A style decides whether that means a
block of an ordinary scrolling page or a full height of the window that the page
settles on, so the same markup is a working tool or an experience without being
written twice. The reveal animation is ranged over `cover` rather than `entry`,
because a view as tall as the window never finishes entering and an entry range
strands it part-way through with its content invisible. Both scroll-driven
behaviours sit behind `@supports` and `prefers-reduced-motion`, and degrade to
visible.

This replaced the per-application SVG motif. A drawing had to be invented on every
run, came out differently each time, and was reliably the least convincing thing
on the screen. `Screen`, `AuthFrame` and `EmptyState` no longer accept a `motif`
prop, and the prop is gone from `types.ts`.

Also in this change: the `board` archetype now renders a banded header, like every
archetype except `feed`.

Breaking for anyone consuming the kit directly: passing `motif` to `Screen`,
`AuthFrame` or `EmptyState` is now a type error, and the `--app-motif-*` tokens no
longer exist. Generators that write a `Motif` component alongside a screen need
updating in step, since the backdrop now belongs to the theme rather than to the
subject.
