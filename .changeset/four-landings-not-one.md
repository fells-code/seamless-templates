---
"seamless-templates": minor
---

The landing screen has four compositions, not one.

The `dashboard` archetype is the screen somebody sees first, and it had one
shape in every application: a band of figures, then a grid of cards. The screen
with the most work to do was doing the least of it.

`Screen` now takes a `landing`, and arranges the same three slots four ways. The
overview is what it has always been. A poster takes the whole window for one
title, one figure and one action, with everything else below the fold. A notebook
drops the band entirely and opens on what happened last, with the title inline at
display size. A contents landing prints the same cards as oversize ruled rows,
the way a magazine opens.

A page passes the same props to all four, and a screen that asks for nothing is
the overview, so nothing that already composes a dashboard changes. The
composition applies only to `dashboard`: a ledger's header introduces a table,
and a landing reaching it would spend the fold on a title.

One thing came out of looking rather than from any check. A notebook has no
band, and every generated Home passes its figures as `<StatRow onBand>`, which
is right on the other three landings and paints band ink on the page surface on
this one. On a light kit that is a headline figure at about two to one against
its own background. The header with no band now resolves the band's ink to the
page's, so the figures read wherever they land, rather than the page being asked
to get the prop right.
