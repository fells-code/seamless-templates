import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SHELL_NAMES, useShell } from "./useShell";

describe("useShell", () => {
  afterEach(() => {
    delete document.documentElement.dataset.shell;
  });

  it("is the sidebar when nothing has said otherwise", () => {
    const { result } = renderHook(() => useShell());
    expect(result.current).toBe("sidebar");
  });

  it("reads the shell the document was given", () => {
    document.documentElement.dataset.shell = "topbar";
    const { result } = renderHook(() => useShell());
    expect(result.current).toBe("topbar");
  });

  it("follows a live switch without a reload", async () => {
    const { result } = renderHook(() => useShell());
    expect(result.current).toBe("sidebar");

    act(() => {
      document.documentElement.dataset.shell = "cover";
    });
    await waitFor(() => expect(result.current).toBe("cover"));
  });

  it("falls back rather than honouring a shell it does not have", () => {
    document.documentElement.dataset.shell = "hamburger";
    const { result } = renderHook(() => useShell());
    expect(result.current).toBe("sidebar");
  });

  it("names every shell the chrome can render", () => {
    expect(SHELL_NAMES).toEqual(["sidebar", "topbar", "tabs", "rail", "cover"]);
  });
});
