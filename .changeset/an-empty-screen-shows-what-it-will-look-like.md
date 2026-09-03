---
"seamless-templates": minor
---

A screen with nothing in it yet shows what it is going to look like.

An empty table under a hero is the first thing the owner of a new application
sees, and it tells them nothing about what they have just had built. `lib/examples`
holds rows keyed by the API path a collection loads from, empty in the starter
and filled by whatever scaffolds the application. `useCollection` returns them
when the collection comes back with nothing in it, under a new `examples` load
state, and `RecordList` and `DataTable` say what they are.

A module rather than a prop, so filling it reaches every screen at once and no
page has to be written differently to benefit.

They are never written to the database. A row that exists only on the screen
cannot be mistaken for a record, cannot be edited into one, and needs no control
to clear it away: it goes the moment the collection has something real in it,
including the optimistic record a create puts there before the post lands.
