import type { EmptyStateProps } from "./types";

/**
 * What a screen looks like before anyone has used it, which for a new
 * application is what everyone sees first. A bordered box reading "no records"
 * is where an otherwise restrained theme starts to look unfinished, so this gets
 * room and the theme's backdrop shows through behind it.
 */
export default function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="panel-empty px-6 py-20 text-center">
      <p className="title text-ink">{title}</p>
      {body && <p className="mx-auto mt-4 max-w-md text-ink-muted">{body}</p>}
      {action && <div className="mt-8 flex justify-center">{action}</div>}
    </div>
  );
}
