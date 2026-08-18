import type { PrimaryButtonProps } from "./types";

const VARIANTS = {
  primary: "bg-brand text-brand-ink hover:bg-brand-hover",
  quiet: "border border-line bg-surface-raised text-ink hover:bg-surface",
  onBand: "bg-band-ink text-band hover:opacity-90",
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
        "lift rounded-control px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        full ? "w-full" : "",
      ].join(" ")}
    >
      {busy ? (busyLabel ?? children) : children}
    </button>
  );
}
