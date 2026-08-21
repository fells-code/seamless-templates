/**
 * The backdrop. Every layer is a gradient the theme supplies, and a theme that
 * wants none sets each to `none`.
 *
 * It carries the page background, so it is mounted once by the shell and content
 * above it needs `above-vista`.
 */
export default function Vista() {
  return (
    <div className="vista" aria-hidden="true">
      <span className="vista-layer vista-sweep" />
      <span className="vista-layer vista-glow" />
      <span className="vista-layer vista-rings" />
      <span className="vista-layer vista-grid" />
    </div>
  );
}
