import type { ReactNode } from "react";

const VARIANTS = {
  primary: "bg-brand text-brand-ink hover:bg-brand-hover",
  quiet: "border border-line bg-surface-raised text-ink hover:bg-surface",
} as const;

export default function Button({
  children,
  type = "button",
  onClick,
  variant = "primary",
  busy = false,
  disabled = false,
  full = false,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  variant?: keyof typeof VARIANTS;
  busy?: boolean;
  disabled?: boolean;
  full?: boolean;
}) {
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
      {children}
    </button>
  );
}
