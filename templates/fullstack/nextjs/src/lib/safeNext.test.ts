import { describe, expect, it } from "vitest";

import { DEFAULT_AFTER_SIGN_IN, safeNext } from "./safeNext";

describe("safeNext", () => {
  it.each(["/session", "/beta?tab=list", "/about#team"])(
    "keeps a path on this site: %s",
    (next) => {
      expect(safeNext(next)).toBe(next);
    },
  );

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["an absolute URL", "https://evil.example/session"],
    ["a protocol-relative URL", "//evil.example"],
    ["a backslash host", "/\\evil.example"],
    ["a javascript URL", "javascript:alert(1)"],
    ["a relative path", "session"],
    ["a control character", "/session\n"],
    ["the sign-in page itself", "/login"],
    ["the sign-in page with a query", "/login?next=/beta"],
  ])("falls back for %s", (_label, next) => {
    expect(safeNext(next)).toBe(DEFAULT_AFTER_SIGN_IN);
  });

  it("reads the first value of a repeated parameter", () => {
    expect(safeNext(["/beta", "https://evil.example"])).toBe("/beta");
  });
});
