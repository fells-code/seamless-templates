---
"seamless-templates": minor
---

A band can carry a picture of its subject, or a pattern of it.

Every band in every kit was a flat panel of brand colour or a window onto the
backdrop. `Cover` sits behind one in three layers: the source, a tint of the
brand pair over it, and a measured scrim. Three rather than one background,
because the thing behind the type has to be allowed to be interesting and the
type still has to be readable, and ink on a band is derived from the band's own
fill, so a picture arriving between the two would otherwise decide the contrast
by luck.

The tint blends as `color`, taking the hue and leaving the light and shade, which
is what stops a tinted photograph reading as a photograph with a coloured
rectangle on it, and what makes any source belong to the application it is in
rather than to whoever took it.

The source is a token rather than a prop, so it can be a pattern built from the
palette, an image the application ships, or nothing, and none of those is a
decision a page should be making. `--app-cover` is `none` until something sets
it and every layer is inert while it is, so a band with no cover renders exactly
as it did before. `Screen`'s banded header and `AuthFrame`'s pitch half both
carry one, which are the first two surfaces anybody sees.
