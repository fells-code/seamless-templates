import type { ToggleProps } from "./types";

export default function Toggle({
  label,
  checked,
  onChange,
  hint,
  disabled = false,
}: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "lift mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full border border-line p-0.5 disabled:opacity-60",
          checked ? "bg-brand" : "bg-surface",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "h-4 w-4 rounded-full",
            checked
              ? "translate-x-5 bg-brand-ink"
              : "translate-x-0 bg-ink-muted",
          ].join(" ")}
        />
      </button>

      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
      </span>
    </label>
  );
}
