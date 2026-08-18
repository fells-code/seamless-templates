import { Link } from "react-router-dom";
import type { ActionCardProps } from "./types";

/** A route someone can take from a landing screen, not a record. */
export default function ActionCard({
  to,
  title,
  body,
  figure,
}: ActionCardProps) {
  return (
    <Link
      to={to}
      className="lift block rounded-card border border-line bg-surface-raised p-5 shadow-raised"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-semibold text-ink">{title}</h2>
        {figure && (
          <span className="numeric font-semibold text-brand">{figure}</span>
        )}
      </div>

      {body && <p className="mt-2 text-sm text-ink-muted">{body}</p>}
    </Link>
  );
}
