---
"seamless-templates": minor
---

The chrome comes in five arrangements, not one.

A sidebar is a composition, and an application that always opens on one looks
like every other application that always opens on one, whatever colour it is
painted. `Navbar` now renders a sidebar, a top bar, a tab strip, a compact icon
rail, or a cover with no persistent chrome and the links as pills over the first
band. Which one is `data-shell` on the document element, read by the new
`useShell` hook, the same way the look is `data-style`. Nothing set means the
sidebar, so a starter nobody has told renders exactly as it did before.

The stylesheet carries the shell's own tokens on the same attribute, so the
markup and the layout cannot disagree about which shell is on: `shell-flow`,
`shell-width` and a new `shell-offset` that starts a banded screen below a cover
rather than behind it. The account control keeps its accessible names in every
arrangement, which is the contract the conformance suite drives.
