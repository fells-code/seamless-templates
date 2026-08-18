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

/** Minutes into "1h 20m". */
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
    default:
      return formatNumber(value);
  }
}
