---
"seamless-templates": minor
---

feat(kit): give the kit rank, real type, and a vocabulary for meaning

Three changes to the shared React kit, each of them structural rather than
cosmetic. A screen built from this starter was reading as a populated wireframe
rather than as a designed application, and no amount of retuning colour, radius
or density was going to reach that.

**Nothing on a screen outranked anything else.** Every screen was a header, then
N equal figures, then equal cards, then a table. `StatRow` made it worse on
purpose: past two items it shrank all of them to fit, so the number an
application exists to show was the same size as the three supporting it. There
was no hero-figure concept in the kit at all.

The first stat now renders as a filled panel at half again the figure size, with
the rest sharing the band beside it, through a new `lead-*` token family. A theme
that wants no panel sets the fill transparent and gets the size jump alone, which
is what the ruled and unframed themes do. A screen with genuinely equal figures
passes `lead={false}`.

**The kit could not say what things meant.** No badge, no chip, no status, so
every distinction a reader most needs at a glance was prose inside a card, and
the three things every application has to say (this went up, this failed, this is
not settled yet) were said in literal `text-green-600` and `text-red-600`. A
fixed Tailwind green is the one colour on a page that belongs to no palette, and
it shows.

`Badge` ships with five tones reading new `positive`, `negative`, `warn` and
`accent-soft` roles. `DataTable` columns take `lead` and `quiet`, so the column
carrying the answer outweighs the raw input beside it. `ActionCard` takes an
icon.

**The type was a system stack and nothing else.** The reasoning was that an
application scaffolded from here may ship anywhere, with no font host to depend
on, which is about third-party hosts rather than about bundling. Five variable
families now ship in `public/fonts`, subset to Latin and Latin Extended, served
from the application's own origin, each with its system stack still behind it. A
browser downloads only the families it actually renders, so the cost is one or
two files rather than five. Archivo carries a width axis and is reachable through
the new `display-stretch` token, which is the whole distance between condensed
capitals and expanded ones out of a single download.

Also fixed, all of it visible on screen:

- `numeric` forced `font-feature-settings: "zero" 1`, so every theme rendered a
  slashed zero whether or not it wanted one. It is a token now.
- `PageHeader` laid its actions out as a flex row beside the title. At display
  size the headline wraps and the actions wrapped with it, landing under a
  headline mid-paragraph. A display header stacks and gives them their own row,
  aligned the way the theme already aligns its column.
- A landing screen took the create rail, leaving a 20rem column empty down the
  length of the first screen anyone sees, and opened on a form rather than on the
  overview. It gets the full width now, and the form follows the content.
- Card titles truncated at rail widths.
- `sync-shared` compared and copied through a utf8 decode, which would have
  quietly corrupted every font binary the manifest now carries. It works in
  buffers.

Two claims in the unreleased "give each style its own voice" entry are superseded
by this one, and both ship in the same release. The type tokens no longer "name
system stacks only", they name bundled faces with the system stacks behind them;
and a region of a screen is no longer a full height of the window the page
settles on. The view-height and snap tokens remain, and remain a theme's to set.
Nothing sets them.
