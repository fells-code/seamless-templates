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
    <Link to={to} className="panel panel-pad lift block">
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
