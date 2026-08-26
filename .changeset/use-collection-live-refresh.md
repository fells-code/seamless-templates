---
"seamless-templates": patch
---

feat(kit): add an opt-in live refresh to `useCollection`

`useCollection` loaded once. Anything built from these templates where more than
one person is looking at the same records went stale the moment somebody else
posted, and the only way out was a reload button the reader had to know to press.

The obvious fix is a socket server, and it is the wrong shape for what these
templates generate: an Express API behind a load balancer, with the auth wiring
off limits. A socket means a second server, a second protocol and an auth
handshake to go with it. A poll plus a refresh on focus is the same seam at a
fraction of the cost, and for a group of a dozen people it is not tellable from
realtime.

```ts
const { records, create } = useCollection<Message>("/messages", { live: 5000 });
```

`live` is off by default, so every existing call site behaves exactly as before.
When it is set, the collection refetches on that interval and also whenever the
window is focused or the tab becomes visible again, which is what a phone taken
out of a pocket needs: current on the first look, not one interval later.

A refresh is deliberately quieter than a load:

- it never sends the screen back to its loading skeleton, so records swap
  underneath the reader instead of flashing;
- it never clears an error, because the reader may be part way through one, and a
  refresh that fails at all is silent and simply tried again on the next tick;
- it keeps a record whose create is still in flight, so an optimistic row is not
  taken off the screen by a poll that answered before the post landed.

`refresh()` joins `reload()` on the returned object for the cases a screen knows
about a change itself. `reload()` is unchanged, loading state and all, which is
what a retry button wants. `UseCollection<T>` only gained a member, so nothing
that reads the hook needs touching.
