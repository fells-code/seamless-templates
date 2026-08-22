import type { RecordCardProps } from "./types";

const TONES = {
  neutral: "text-ink",
  positive: "text-green-600",
  negative: "text-red-600",
} as const;

export default function RecordCard({
  title,
  badge,
  figure,
  tone = "neutral",
  meta,
  body,
  footer,
}: RecordCardProps) {
  return (
    <article className="panel panel-pad lift">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink">{title}</h3>
          {meta && <p className="mt-1 text-xs text-ink-muted">{meta}</p>}
        </div>

        {figure && (
          <span
            className={`numeric shrink-0 text-right font-semibold ${TONES[tone]}`}
          >
            {figure}
          </span>
        )}
      </div>

      {badge && (
        <span className="label mt-4 inline-block rounded-control bg-surface px-2 py-1 text-ink-muted">
          {badge}
        </span>
      )}

      {body && <div className="mt-4 text-sm text-ink-muted">{body}</div>}

      {footer && (
        <div className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">
          {footer}
        </div>
      )}
    </article>
  );
}
