/**
 * What sits behind a band: a picture of the subject, or a pattern of it.
 *
 * Three layers rather than one background, because the thing underneath the type
 * has to be allowed to be interesting and the type still has to be readable.
 *
 * - the source itself, at whatever opacity the theme allows it;
 * - a tint, which is the brand pair over the top, so a photograph belongs to
 *   this application rather than to whoever took it and a pattern is on palette
 *   by construction;
 * - a scrim, a measured gradient from the band's own fill, so ink on the band
 *   keeps its contrast whatever the source turns out to be.
 *
 * `--app-cover` is `none` until something sets it, and every layer resolves to
 * nothing when it is, so a band with no cover is byte for byte the band that
 * existed before covers did.
 *
 * Never given a `src`: the source is a token, so it can be a pattern built from
 * the palette, an image the application ships, or nothing, and none of those is
 * a decision a page should be making.
 */
export default function Cover() {
  return (
    <span className="cover" aria-hidden="true">
      <span className="cover-layer cover-source" />
      <span className="cover-layer cover-tint" />
      <span className="cover-layer cover-scrim" />
    </span>
  );
}
