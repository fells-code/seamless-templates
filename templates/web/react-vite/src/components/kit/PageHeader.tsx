import type { PageHeaderProps } from "./types";

export default function PageHeader({
  title,
  tagline,
  actions,
  onBand = false,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="min-w-0">
        <h1 className={`title ${onBand ? "text-band-ink" : "text-ink"}`}>
          {title}
        </h1>

        {tagline && (
          <p
            className={`mt-2 max-w-prose text-sm ${
              onBand ? "text-band-ink-muted" : "text-ink-muted"
            }`}
          >
            {tagline}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
