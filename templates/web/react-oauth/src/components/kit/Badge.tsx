import type { CSSProperties } from "react";
import type { BadgeProps } from "./types";

/*
 * A short chip: a status, a category, a grade, whether a figure is measured or
 * still a guess.
 *
 * The kit had no way to say any of that, so screens said it in prose inside a
 * card, and the one distinction a reader most needs to make at a glance was the
 * same weight as everything around it. A row that reads "Estimated" in an amber
 * chip is doing work that the same word in grey body text is not.
 *
 * Tone is passed as two custom properties rather than a class per tone, so the
 * colour comes from the kit's own roles and a kit retones every badge in an
 * application by moving those roles.
 */
const TONES = {
  neutral: {
    "--badge-bg": "var(--app-surface)",
    "--badge-ink": "var(--app-ink-muted)",
  },
  accent: {
    "--badge-bg": "var(--app-accent-soft)",
    "--badge-ink": "var(--app-accent)",
  },
  positive: {
    "--badge-bg": "var(--app-positive-soft)",
    "--badge-ink": "var(--app-positive)",
  },
  warn: {
    "--badge-bg": "var(--app-warn-soft)",
    "--badge-ink": "var(--app-warn)",
  },
  negative: {
    "--badge-bg": "var(--app-negative-soft)",
    "--badge-ink": "var(--app-negative)",
  },
} as const;

export default function Badge({
  children,
  tone = "neutral",
  dot = false,
}: BadgeProps) {
  return (
    <span className="badge" style={TONES[tone] as CSSProperties}>
      {dot && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "currentColor" }}
        />
      )}
      {children}
    </span>
  );
}
