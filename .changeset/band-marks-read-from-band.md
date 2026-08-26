---
"seamless-templates": patch
---

fix(kit): draw AuthFrame's band marks from the band's own pair, not the accent

The bullet marks beside the pitch on the sign-in screen were `bg-accent`, on the
band. The accent is picked to sit on a surface, so on the band it is whatever it
happens to be, and a kit that chooses a deep accent loses the marks completely.

This is not only true of a deep accent. Measured against the palette this repo
ships, the marks are already at 2.69:1 in light and 1.97:1 in dark, because the
default accent is a sky blue and the default band is a blue. They are
`aria-hidden`, so no accessibility check ever failed on them; they were simply
close to invisible, and in only one theme at a time, which is how it survived
review.

`bg-on-band` is the pair the kit keeps for exactly this. It is 5.75:1 and 4.21:1
against the same two bands, and it follows the band wherever a kit takes it,
including the styles where the band is a window onto the backdrop rather than a
panel of colour. `PrimaryButton`'s `onBand` variant already reads from it and
already explains why; the marks now do the same and carry the rule.

The rest of the sweep came back clean. Only `Screen` and `AuthFrame` render
inside `band-fill`, everything `Screen` puts there (`PageHeader`, `StatRow`)
already takes `onBand` and reads from the band pair, and `StatRow`'s lead panel
brings its own fill and ink together so it is self-consistent wherever it lands.
