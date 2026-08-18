import { useEffect, useState } from "react";
import { formatStat } from "./format";
import type { Stat, StatRowProps } from "./types";

/**
 * Counts a figure up on first paint.
 *
 * The duration is a token, so the same tile is brisk in a dense theme and slow in
 * a dramatic one without the markup changing. A reader who has asked for reduced
 * motion is given the number outright.
 */
function useCountUp(target: number): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const token = getComputedStyle(document.documentElement).getPropertyValue(
      "--app-count-duration",
    );
    const duration = reduced ? 0 : parseFloat(token) || 600;

    if (duration <= 0) {
      setValue(target);
      return;
    }

    let frame = 0;
    const started = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      setValue(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}

function StatTile({
  stat,
  currency,
  onBand,
  dense,
}: {
  stat: Stat;
  currency: string;
  onBand: boolean;
  dense: boolean;
}) {
  const target = typeof stat.value === "number" ? stat.value : 0;
  const counted = useCountUp(target);
  const shown =
    typeof stat.value === "number"
      ? formatStat(counted, stat.format, currency)
      : String(stat.value);

  return (
    <div className="min-w-0">
      <p
        className={`label ${onBand ? "text-band-ink-muted" : "text-ink-muted"}`}
      >
        {stat.label}
      </p>

      <p
        className={[
          "figure mt-2 truncate",
          dense ? "figure-dense" : "",
          onBand ? "text-band-ink" : "text-ink",
        ].join(" ")}
      >
        {shown}
      </p>

      {stat.hint && (
        <p
          className={`mt-1 text-xs ${
            onBand ? "text-band-ink-muted" : "text-ink-muted"
          }`}
        >
          {stat.hint}
        </p>
      )}
    </div>
  );
}

export default function StatRow({
  items,
  currency = "USD",
  onBand = false,
}: StatRowProps) {
  if (items.length === 0) return null;

  // Three or four figures share the width of the band, so they take a smaller
  // size. Left at the full display size they truncate, and a balance shown as
  // "GBP 2,50..." is worse than the same balance shown a size down.
  const dense = items.length > 2;

  return (
    <div
      className={`stagger grid gap-x-10 gap-y-6 ${
        dense ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"
      }`}
    >
      {items.map((stat) => (
        <StatTile
          key={stat.label}
          stat={stat}
          currency={currency}
          onBand={onBand}
          dense={dense}
        />
      ))}
    </div>
  );
}
