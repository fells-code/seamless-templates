import { Children } from "react";
import EmptyState from "./EmptyState";
import type { RecordListProps } from "./types";

const COLUMNS = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 xl:grid-cols-3",
} as const;

/**
 * The four states every collection has: arriving, broken, empty, and full.
 *
 * Handling them once is most of what the kit is for. A screen that renders nothing
 * while loading reads as broken, and one that renders a bare sentence when empty
 * reads as unfinished, and both were rewritten from scratch on every page before
 * this existed.
 */
export default function RecordList({
  state,
  error,
  empty,
  layout = "grid",
  columns = 2,
  children,
}: RecordListProps) {
  if (state === "loading") {
    const shape =
      layout === "grid"
        ? `grid gap-4 ${COLUMNS[columns]}`
        : "flex flex-col gap-3";

    return (
      <div className={shape} aria-busy="true" aria-label="Loading">
        {Array.from({ length: layout === "grid" ? columns * 2 : 4 }).map(
          (_, index) => (
            <div
              key={index}
              className="skeleton"
              style={{ height: layout === "grid" ? "8.5rem" : "4.5rem" }}
            />
          ),
        )}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-card border border-line bg-surface-raised px-6 py-10 text-center">
        <p className="font-medium text-red-600">
          {error ?? "Something went wrong."}
        </p>
      </div>
    );
  }

  if (Children.count(children) === 0) {
    return <EmptyState {...empty} />;
  }

  return (
    <div
      className={
        layout === "grid"
          ? `stagger grid gap-4 ${COLUMNS[columns]}`
          : "stagger flex flex-col gap-3"
      }
    >
      {children}
    </div>
  );
}
