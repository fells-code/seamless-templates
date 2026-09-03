import { useEffect, useState } from "react";
import { formatStat } from "./format";
import type { Stat, StatRowProps } from "./types";

/**
 * Counts a figure up on first paint.
 *
 * The duration is a token, so the same tile is brisk in a dense kit and slow in
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

function useShownValue(stat: Stat, currency: string): string {
  const target = typeof stat.value === "number" ? stat.value : 0;
  const counted = useCountUp(target);
  return typeof stat.value === "number"
    ? formatStat(counted, stat.format, currency)
    : String(stat.value);
}

/** The one figure the screen is about, as a filled panel. */
function LeadTile({ stat, currency }: { stat: Stat; currency: string }) {
  const shown = useShownValue(stat, currency);

  return (
    <div className="metric-lead">
      <p className="label lead-caption">{stat.label}</p>
      <p className="figure figure-lead numeric">{shown}</p>
      {stat.hint && <p className="lead-caption text-sm">{stat.hint}</p>}
    </div>
  );
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
  const shown = useShownValue(stat, currency);

  return (
    <div className="min-w-0">
      <p
        className={`label ${onBand ? "text-band-ink-muted" : "text-ink-muted"}`}
      >
        {stat.label}
      </p>

      <p
        className={[
          "figure numeric mt-2 truncate",
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

/**
 * The figures a screen opens on.
 *
 * The first item leads unless the caller says otherwise: it is rendered as a
 * filled panel at half again the figure size, and the rest share the row beside
 * it. That asymmetry is the point. Four equal tiles is what the row used to be,
 * and a screen whose four numbers are the same size has told the reader that
 * none of them matters more than the others, which is never true. A screen with
 * genuinely equal figures passes `lead={false}` and gets the old row back.
 */
export default function StatRow({
  items,
  currency = "USD",
  onBand = false,
  lead = true,
}: StatRowProps) {
  if (items.length === 0) return null;

  const [first, ...others] = items;
  const leading = lead && first !== undefined && others.length > 0;
  const rest = leading ? others : items;

  // Figures sharing what is left of the width take a smaller size. At the full
  // figure size they truncate, and a finish time shown as "1:22..." is worse
  // than the same time a size down.
  const dense = rest.length > 1;

  const tiles = rest.map((stat) => (
    <StatTile
      key={stat.label}
      stat={stat}
      currency={currency}
      onBand={onBand}
      dense={dense}
    />
  ));

  if (leading) {
    return (
      <div className="stat-lead stagger">
        <LeadTile stat={first} currency={currency} />
        <div className="stat-lead-rest">{tiles}</div>
      </div>
    );
  }

  /*
   * How many figures fit, decided by the space there is rather than by the size
   * of the window.
   *
   * These were Tailwind's responsive column counts, which read the viewport. A
   * kit that puts the header in a column beside the content has a band about a
   * sixth of the window wide, and on a desktop the viewport still said four
   * across, so three figures came out as three unreadable slivers. The row
   * measures itself now, the same way `auto-grid` does.
   */
  return <div className="stat-row stagger">{tiles}</div>;
}
