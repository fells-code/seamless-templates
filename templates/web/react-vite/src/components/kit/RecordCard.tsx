import Badge from "./Badge";
import type { RecordCardProps } from "./types";

const TONES = {
  neutral: "text-ink",
  positive: "text-positive",
  negative: "text-negative",
} as const;

export default function RecordCard({
  title,
  badge,
  badgeTone = "neutral",
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
          <h3 className="font-semibold text-balance text-ink">{title}</h3>
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
        <div className="mt-4">
          <Badge tone={badgeTone}>{badge}</Badge>
        </div>
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
