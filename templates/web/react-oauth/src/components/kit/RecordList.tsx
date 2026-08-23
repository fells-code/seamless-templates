import { Children } from "react";
import EmptyState from "./EmptyState";
import type { RecordListProps } from "./types";

/*
 * How many columns is the theme's decision, not this one's.
 *
 * `auto-grid` sets the narrowest a column may be and lets the browser fit as
 * many as it can, so the same list is two across in a style with a 24rem minimum
 * and four across in one with 17rem, without either of them naming a breakpoint.
 * The prop only says whether this collection wants the theme's default density,
 * one column, or a tighter one.
 */
const COLUMNS = {
  1: "auto-grid auto-grid-1",
  2: "auto-grid",
  3: "auto-grid auto-grid-3",
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
    const shape = layout === "grid" ? COLUMNS[columns] : "stack";

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
      <div className="panel px-6 py-10 text-center">
        <p className="font-medium text-negative">
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
      className={`stagger ${layout === "grid" ? COLUMNS[columns] : "stack"}`}
    >
      {children}
    </div>
  );
}
