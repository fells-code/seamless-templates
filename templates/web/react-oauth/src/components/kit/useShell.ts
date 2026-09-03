import { useEffect, useState } from "react";

import type { ShellName } from "./types";

/**
 * Every shell the chrome knows how to be. `sidebar` is what an application with
 * no `data-shell` renders, so the starter and any document that has never been
 * told otherwise look exactly as they did before shells existed.
 */
export const SHELL_NAMES: readonly ShellName[] = [
  "sidebar",
  "topbar",
  "tabs",
  "rail",
  "cover",
];

const DEFAULT_SHELL: ShellName = "sidebar";

function readShell(): ShellName {
  if (typeof document === "undefined") return DEFAULT_SHELL;
  const value = document.documentElement.dataset.shell;
  return value && (SHELL_NAMES as readonly string[]).includes(value)
    ? (value as ShellName)
    : DEFAULT_SHELL;
}

/**
 * Which chrome the application wears, read from `data-shell` on `<html>`.
 *
 * The attribute rather than a prop or a context, for the same reason the look
 * is `data-style` on the same element: whatever chooses it (a build script
 * writing the tag, a switcher flipping it live) does so without touching a
 * component, and the stylesheet keys its shell tokens on the same attribute so
 * the markup and the layout can never disagree about which shell this is. The
 * observer is what makes a live switch re-render rather than wait for a reload.
 */
export function useShell(): ShellName {
  const [shell, setShell] = useState<ShellName>(readShell);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setShell(readShell()));
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-shell"],
    });
    setShell(readShell());
    return () => observer.disconnect();
  }, []);

  return shell;
}
