import { afterEach, describe, expect, it } from "vitest";

import { getApiUrl } from "./runtimeConfig";

afterEach(() => {
  delete window.__SEAMLESS_CONFIG__;
});

describe("getApiUrl", () => {
  it("prefers the origin a container injects", () => {
    window.__SEAMLESS_CONFIG__ = { API_URL: " https://api.example.com " };
    expect(getApiUrl("http://localhost:3000/")).toBe("https://api.example.com");
  });

  it("falls back to VITE_API_URL", () => {
    window.__SEAMLESS_CONFIG__ = { API_URL: "" };
    expect(getApiUrl("http://localhost:3000/")).toBe("http://localhost:3000/");
  });

  it("is null when neither is set", () => {
    expect(getApiUrl(undefined)).toBeNull();
    expect(getApiUrl("  ")).toBeNull();
  });
});
