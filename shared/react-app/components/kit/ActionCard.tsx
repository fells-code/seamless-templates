import { Link } from "react-router-dom";
import type { ActionCardProps } from "./types";

/*
 * A route someone can take from a landing screen, not a record.
 *
 * The figure is the reason to look: how many are logged, how many days are left,
 * what is waiting. It reads at figure size in the kit's own accent rather than
 * as another line of body text, because a landing screen is a set of doors and
 * the number over each one is what tells you which to open.
 */
export default function ActionCard({
  to,
  title,
  body,
  figure,
  icon,
}: ActionCardProps) {
  return (
    <Link to={to} className="panel panel-pad lift block">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon && (
            <span aria-hidden className="flex-none text-accent">
              {icon}
            </span>
          )}
          <h2 className="font-semibold text-balance text-ink">{title}</h2>
        </div>
      </div>

      {figure && (
        <p className="figure figure-dense numeric mt-4 text-accent">{figure}</p>
      )}

      {body && <p className="mt-2 text-sm text-ink-muted">{body}</p>}
    </Link>
  );
}
