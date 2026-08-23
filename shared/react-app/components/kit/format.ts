import type { StatFormat } from "./types";

/*
 * Number formatting, in one place.
 *
 * Left to each screen this comes out as `toFixed(2)` in one place and
 * `Math.round` in another, and a column of figures that do not line up is the
 * fastest way to make an application look unfinished.
 */

export function formatMoney(value: number, currency = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    value,
  );
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value > 1 ? value / 100 : value);
}

/**
 * Seconds as a clock, "4:15" or "1:17:15".
 *
 * The unit is seconds, not minutes, which is the whole reason this exists beside
 * `formatDuration`. Anything a person races, laps, lifts or cooks is measured in
 * seconds and lives under an hour, and `formatDuration` can express neither: it
 * takes minutes and rounds to a whole one, so a 4 minute 15 second station is
 * either "4h 15m" if you hand it seconds or "4m" if you convert first.
 */
export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(rest)}`
    : `${minutes}:${pad(rest)}`;
}

/**
 * Minutes into "1h 20m".
 *
 * Minutes. Passing seconds here is the mistake this comment exists to prevent,
 * and it does not look like a mistake: 2640 seconds renders as "44h". Reach for
 * `formatClock` when the figure is in seconds or when seconds are worth showing.
 */
export function formatDuration(minutes: number): string {
  const whole = Math.round(minutes);
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/** An ISO date or datetime as something a person would read. */
export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Today as `YYYY-MM-DD`, which is what a date input expects. */
export function today(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatStat(
  value: number,
  format: StatFormat | undefined,
  currency: string,
): string {
  switch (format) {
    case "currency":
      return formatMoney(value, currency);
    case "percent":
      return formatPercent(value);
    case "duration":
      return formatDuration(value);
    case "clock":
      return formatClock(value);
    default:
      return formatNumber(value);
  }
}
