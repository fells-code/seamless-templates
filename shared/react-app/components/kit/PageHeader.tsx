import type { PageHeaderProps } from "./types";

export default function PageHeader({
  title,
  tagline,
  actions,
  onBand = false,
  size = "title",
}: PageHeaderProps) {
  const muted = onBand ? "text-band-ink-muted" : "text-ink-muted";

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0">
        {size === "display" && tagline && (
          <p className={`label mb-6 ${muted}`}>{tagline}</p>
        )}

        <h1 className={`${size} ${onBand ? "text-band-ink" : "text-ink"}`}>
          {title}
        </h1>

        {size !== "display" && tagline && (
          <p className={`mt-4 max-w-prose text-sm ${muted}`}>{tagline}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
