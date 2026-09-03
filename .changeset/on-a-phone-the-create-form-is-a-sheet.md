---
"seamless-templates": minor
---

On a phone the create form is a button and a sheet, not a stack of inputs.

At 375 a create panel above or below the thing it creates into is the loudest
"this is a web form" signal an application gives off, and it pushes the records
somebody came to read under the fold. `InlineCreateForm` now renders a button
fixed to the corner and puts the form in a sheet one tap away, closing itself
once the record is filed. Escape and the backdrop both close it. Nothing changes
above 64rem, and a form the signed-in role may not use still offers nothing at
all.

One form, moved, rather than two in the document behind a media query: two copies
of the same field names and labels is a worse form for anyone using a screen
reader and a confusing one to test.

The wrapper that held the form collapses to `display: contents` when the form
became a sheet, because a fixed button occupies no space and the view around it
would otherwise be several rem of blank page. `contents` rather than `none` on
purpose: `display: none` on an ancestor hides a fixed descendant, so hiding the
wrapper would have taken the button with it.
