import { describe, expect, it } from "vitest";

import { isCompleteCode, isEmailLike, normalizeCode } from "./identifier";

describe("isEmailLike", () => {
  it("accepts an address with a local part and a domain", () => {
    expect(isEmailLike("athlete@example.com")).toBe(true);
    expect(isEmailLike("  a@b.c  ")).toBe(true);
  });

  it("rejects what cannot be an address", () => {
    expect(isEmailLike("")).toBe(false);
    expect(isEmailLike("@example.com")).toBe(false);
    expect(isEmailLike("athlete@")).toBe(false);
    expect(isEmailLike("a b@example.com")).toBe(false);
  });
});

describe("normalizeCode", () => {
  it("uppercases, strips separators, and caps at six characters", () => {
    expect(normalizeCode("ab-cd ef")).toBe("ABCDEF");
    expect(normalizeCode("abcdefgh")).toBe("ABCDEF");
  });

  it("reports completeness at six characters", () => {
    expect(isCompleteCode("abcde")).toBe(false);
    expect(isCompleteCode("abcdef")).toBe(true);
  });
});
