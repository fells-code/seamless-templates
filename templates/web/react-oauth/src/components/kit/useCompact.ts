import { useEffect, useState } from "react";

/** Where the kit stops laying things out side by side. */
const COMPACT = "(width < 64rem)";

/**
 * Whether the viewport is too narrow to put two things beside each other.
 *
 * The same 64rem the rail, the side band and the shells all break at, in one
 * place, so a component that has to change its markup rather than its layout
 * breaks at the same width as everything that only has to change its CSS.
 *
 * A hook rather than a class pair, because the alternative is rendering the same
 * form twice and hiding one: two sets of the same field names and labels in the
 * document, which is a worse form for anyone using a screen reader and a
 * genuinely confusing one to test against.
 */
export function useCompact(): boolean {
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia(COMPACT).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(COMPACT);
    const onChange = () => setCompact(query.matches);

    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return compact;
}
