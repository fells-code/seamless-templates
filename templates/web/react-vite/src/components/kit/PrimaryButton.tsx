import type { PrimaryButtonProps } from "./types";

/*
 * `onBand` reads its pair from `on-band`, not from the band colour directly.
 * Half the styles make the header a window onto the backdrop rather than a panel
 * of brand colour, and on those there is no band to contrast with, the pair
 * falls back to the brand, and the button stays a button instead of becoming
 * dark-on-dark.
 */
const VARIANTS = {
  primary: "bg-brand text-brand-ink hover:bg-brand-hover",
  quiet: "border border-line bg-surface-raised text-ink hover:bg-surface",
  onBand: "bg-on-band text-on-band-ink hover:opacity-90",
} as const;

export default function PrimaryButton({
  children,
  type = "button",
  onClick,
  variant = "primary",
  busy = false,
  busyLabel,
  disabled = false,
  full = false,
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy}
      className={[
        "btn lift disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        full ? "w-full" : "",
      ].join(" ")}
    >
      {busy ? (busyLabel ?? children) : children}
    </button>
  );
}
