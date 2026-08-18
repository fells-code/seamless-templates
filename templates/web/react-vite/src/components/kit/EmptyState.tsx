import type { EmptyStateProps } from "./types";

/**
 * What a screen looks like before anyone has used it, which for a new application
 * is what everyone sees first. A bordered box reading "no records" is where an
 * otherwise restrained theme starts to look unfinished, so this gets the motif.
 */
export default function EmptyState({
  title,
  body,
  motif,
  action,
}: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-surface-raised">
      {motif && <div className="motif motif-hero">{motif}</div>}

      <div className="above-motif px-6 py-16 text-center">
        <p className="text-lg font-semibold text-ink">{title}</p>
        {body && (
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{body}</p>
        )}
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
