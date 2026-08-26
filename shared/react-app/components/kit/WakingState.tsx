/**
 * What somebody sees while the API is being woken.
 *
 * Not a skeleton: a skeleton promises "nearly there", and this can be tens of
 * seconds. Not an error either, because nothing is wrong. It takes no props on
 * purpose. The person reading it was sent a link by somebody they know, has never
 * seen the application before, and has no idea what a cold start is, so the copy
 * has to explain itself in plain words and read the same in every generated
 * application rather than being reworded per screen.
 */
export default function WakingState() {
  return (
    <div
      className="panel px-6 py-10 text-center"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className="mx-auto mb-4 block h-2 w-2 animate-pulse rounded-full bg-accent"
      />

      <p className="font-medium text-ink">Waking this up</p>

      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
        It sleeps while nobody is using it, so the first visit takes a few
        seconds. Nothing to do; it carries on by itself.
      </p>
    </div>
  );
}
