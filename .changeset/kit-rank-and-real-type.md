---
"seamless-templates": minor
---

feat(kit): give the kit rank, real type, and a vocabulary for meaning

Two applications built from the same brief, ours and a major AI builder's, put
side by side: theirs was the one people wanted to look at. The information on
screen was the same. The presentation was not, and the gap was structural rather
than chromatic, so no amount of retuning colour or radius was going to close it.

**Nothing outranked anything.** Every screen was a header, then N equal figures,
then equal cards, then a table. `StatRow` made it worse on purpose: past two
items it shrank all of them to fit, so the number an application exists to show
was the same size as the three supporting it. There was no hero-figure concept in
the kit at all. There is now: the first stat renders as a filled panel at half
again the figure size, and the rest share the band beside it, through a new
`lead-*` token family. A kit that wants no panel sets the fill transparent and
gets the size jump alone, which is what the ruled and unframed kits do. A screen
with genuinely equal figures passes `lead={false}`.

**The kit could not say what things meant.** No badge, no chip, no status. So
every distinction a reader most needs at a glance was prose inside a card, and
the three things every application has to say, this went up, this failed, this is
not settled yet, were said in literal Tailwind greens and reds. A fixed `#16a34a`
is the one colour on a page that belongs to no palette, and it shows. `Badge`
ships with five tones reading new `positive`, `negative`, `warn` and `accent-soft`
roles, `DataTable` columns take `lead` and `quiet` so the column carrying the
answer outweighs the raw input beside it, and `ActionCard` takes an icon.

**Ten looks were drawn in one typeface.** The rule was system stacks only,
because a generated application runs on a bare subdomain with no font host, and
it cost the kits most of what separated them. The constraint was always about
third-party hosts, not about bundling. Five variable families now ship in
`public/fonts`, subset to Latin and Latin Extended, served from the application's
own origin, each with its system stack still behind it. A browser fetches only
what it renders, so a look costs one or two files rather than all ten. Archivo
carries a width axis and does double duty through the new `display-stretch`
token, which is the whole distance between condensed capitals and expanded ones.

Also fixed, all of it visible on screen:

- `numeric` forced `font-feature-settings: "zero" 1` in every look at once, so a
  rounded pastel habit tracker rendered `5:00` with a line through both zeros.
  It is a token now, on where a slashed zero belongs.
- `PageHeader` laid its actions out as a flex row beside the title. At display
  size the headline wraps and the actions wrapped with it, landing under a
  headline mid-paragraph. A display header stacks and gives them their own row,
  aligned the way the look already aligns its column.
- A landing screen took the create rail, leaving a 20rem column empty down the
  length of the first screen anyone sees, and opened on a form rather than on the
  overview. It gets the full width, and the form follows the content.
- Card titles truncated at rail widths.
- `sync-shared` compared and copied through a utf8 decode, which would have
  quietly corrupted every font binary the manifest now carries.

Two claims in the unreleased "give each style its own voice" entry above are
superseded by this one, and both ship in the same release. The type tokens no
longer "name system stacks only", they name bundled faces with the system stacks
behind them; and a region of a screen is no longer a full height of the window
the page settles on. The view-height and snap tokens remain, and remain a look's
to set. Nothing sets them.
