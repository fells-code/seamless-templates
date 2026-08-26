---
"seamless-templates": patch
---

feat(kit): tell somebody the API is waking up, instead of failing at them

An application whose API scales to zero costs a fraction of one that does not,
and the price is that the first request after an idle spell wakes the task and
takes tens of seconds. Until now the front end had nothing to say about that. A
sleeping API produced whatever a failed fetch produces, which to a visitor is
indistinguishable from a broken link.

The person who meets the cold path is never the owner. The owner's first view
happens seconds after the build, while the task is still warm. The cold path
belongs to somebody who was sent a link days later, has never seen the
application before, and is deciding what they think of the whole thing in that
one moment.

**`apiFetch` now throws an `ApiError`** carrying the `status` and a `waking` flag.
A 502, 503 or 504 is a load balancer with nothing healthy behind it yet. So is a
fetch the browser rejected outright, because a load balancer's own 503 carries
none of the API's CORS headers and therefore reaches the page as no answer at
all rather than as a status. Being offline is ruled out, since the browser is
sure about that one, and a missing `VITE_API_URL` is deliberately left as the
plain configuration error it has always been: dressing that up as an API that is
about to answer would leave the screen waiting patiently forever.

**`useCollection` waits it out.** A first load that fails this way puts the
collection into a new `waking` state and retries with backoff, capping at eight
seconds and giving up after about a minute and a half, which is comfortably
longer than a cold start. It recovers on its own with nobody pressing anything.
Retries keep the waking state rather than flashing the skeleton, the pending
retry is cancelled on unmount and when the path changes, and giving up resets
the window so a retry button gets the whole wait again rather than an instant
refusal.

**`LoadState` gains `waking`, and `RecordList`, `DataTable` and a new
`WakingState` render it**: a calm panel that says the application sleeps while
nobody is using it, that this takes a few seconds, and that there is nothing to
do. It is announced politely to assistive technology, it takes no props so that
every generated application says it the same way, and it is neither a skeleton
nor an error, because it is neither.
