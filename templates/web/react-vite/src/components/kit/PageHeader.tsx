import type { PageHeaderProps } from "./types";

/*
 * The title of a screen, its supporting line, and whatever controls belong
 * beside it.
 *
 * At title size the three sit on one row, title left and actions right, and the
 * kit decides the direction through `band-head`. At display size they cannot:
 * a headline set at eleven viewport widths wraps to two or three lines, the
 * actions wrap with it, and what lands underneath is a button sitting
 * mid-paragraph with no relationship to anything. So a display header stacks,
 * and the actions get a row of their own with the space to look deliberate.
 */
export default function PageHeader({
  title,
  tagline,
  actions,
  onBand = false,
  size = "title",
}: PageHeaderProps) {
  const muted = onBand ? "text-band-ink-muted" : "text-ink-muted";
  const ink = onBand ? "text-band-ink" : "text-ink";

  if (size === "display") {
    // A block rather than a flex row, so the controls follow the text alignment
    // the theme already set on the column around them, whether that is flush
    // left or up the middle.
    return (
      <div>
        {tagline && <p className={`label mb-6 ${muted}`}>{tagline}</p>}

        <h1 className={`display ${ink}`}>{title}</h1>

        {actions && <div className="mt-8 space-x-3">{actions}</div>}
      </div>
    );
  }

  return (
    <div className="band-head gap-x-8 gap-y-4">
      <div className="min-w-0">
        <h1 className={`title ${ink}`}>{title}</h1>

        {tagline && (
          <p className={`mt-4 max-w-prose text-sm ${muted}`}>{tagline}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
