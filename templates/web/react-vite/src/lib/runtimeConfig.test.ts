import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getApiUrl } from "./runtimeConfig";

beforeEach(() => {
  // The committed .env sets VITE_API_URL, so every case states the value it
  // wants rather than inheriting one.
  vi.stubEnv("VITE_API_URL", "");
  delete window.__SEAMLESS_CONFIG__;
});

afterEach(() => {
  vi.unstubAllEnvs();
  delete window.__SEAMLESS_CONFIG__;
});

describe("getApiUrl", () => {
  it("prefers the value the container entrypoint injects", () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000");
    window.__SEAMLESS_CONFIG__ = { API_URL: "https://api.example.com" };

    expect(getApiUrl()).toBe("https://api.example.com");
  });

  it("falls back to VITE_API_URL for a local dev server", () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000");

    expect(getApiUrl()).toBe("http://localhost:3000");
  });

  it("ignores the empty injected value written when API_URL is unset", () => {
    vi.stubEnv("VITE_API_URL", "http://localhost:3000");
    window.__SEAMLESS_CONFIG__ = { API_URL: "" };

    expect(getApiUrl()).toBe("http://localhost:3000");
  });

  it("trims surrounding whitespace", () => {
    vi.stubEnv("VITE_API_URL", "  http://localhost:3000  ");

    expect(getApiUrl()).toBe("http://localhost:3000");
  });

  it("returns null when neither source supplies a value", () => {
    expect(getApiUrl()).toBeNull();
  });
});
