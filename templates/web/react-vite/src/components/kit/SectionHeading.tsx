import type { SectionHeadingProps } from "./types";

export default function SectionHeading({
  children,
  trailing,
}: SectionHeadingProps) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4 border-b border-line pb-2">
      <h2 className="label text-ink-muted">{children}</h2>
      {trailing && <span className="text-sm text-ink-muted">{trailing}</span>}
    </div>
  );
}
