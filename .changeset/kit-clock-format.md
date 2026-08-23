---
"seamless-templates": patch
---

feat(kit): add a seconds-based `clock` stat format

The kit offered `currency`, `percent` and `duration`, and `duration` takes
**minutes** and rounds to a whole one. So there was no way to render a figure
measured in seconds, and no way to show seconds at all.

Anything a person races, laps, lifts or cooks is measured in seconds and lives
under an hour, and a generated application handed those numbers has only one
duration format to reach for. A Hyrox trainer built from these templates rendered
its predicted finish as **"44h"**: eight 1km runs at 330 seconds is 2640, and
`formatDuration(2640)` is 44 hours 0 minutes. The same page rendered a 255 second
SkiErg split as "4h 15m".

That is not a mistake anyone can see in review. The value is a number, the format
is named `duration`, and the output is a plausible-looking duration. Only the
magnitude is wrong, and only if you know what the figure should be.

`formatClock(seconds)` renders `4:15` and `1:17:15`, and `format: "clock"` selects
it from `StatRow`, `DataTable` and anywhere else `formatStat` is used. Both
functions now carry a comment naming their unit, and `StatFormat` documents the
distinction inline, because that type is the prop surface a generator reads.

`formatDuration` is unchanged. Minutes are still right for the things that are
genuinely measured in minutes.
