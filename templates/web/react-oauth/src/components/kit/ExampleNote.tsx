/**
 * What a screen says when the rows under it are stand-ins.
 *
 * Above the rows rather than inside them, and the rows themselves are left at
 * full strength: fading them to say "these are not real" costs the contrast that
 * makes them legible, and the point of showing them at all is that somebody can
 * see what their application is going to look like.
 */
export default function ExampleNote() {
  return (
    <p className="mb-4 text-sm text-ink-muted">
      Examples, so you can see the shape of it. They go as soon as you add
      something of your own.
    </p>
  );
}
