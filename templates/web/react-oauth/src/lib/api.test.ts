import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// api.ts resolves API_URL once at import time, the way the app does at startup,
// so each case configures the environment and then imports a fresh copy.
async function importApi(apiUrl: string | null) {
  vi.resetModules();
  vi.stubEnv("VITE_API_URL", "");

  if (apiUrl === null) {
    delete window.__SEAMLESS_CONFIG__;
  } else {
    window.__SEAMLESS_CONFIG__ = { API_URL: apiUrl };
  }

  return import("./api");
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  delete window.__SEAMLESS_CONFIG__;
});

describe("buildApiUrl", () => {
  it("joins the API origin and the path", async () => {
    const { buildApiUrl } = await importApi("https://api.example.com");

    expect(buildApiUrl("/beta_users")).toBe(
      "https://api.example.com/beta_users",
    );
  });

  it("tolerates a trailing slash on the origin and a missing one on the path", async () => {
    const { buildApiUrl } = await importApi("https://api.example.com//");

    expect(buildApiUrl("beta_users")).toBe(
      "https://api.example.com/beta_users",
    );
  });

  it("throws a message naming VITE_API_URL when the origin is unset", async () => {
    const { buildApiUrl } = await importApi(null);

    expect(() => buildApiUrl("/beta_users")).toThrow(/VITE_API_URL is not set/);
  });
});

describe("apiFetch", () => {
  it("sends cookies and asks for JSON", async () => {
    const { apiFetch } = await importApi("https://api.example.com");
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "ok" }), { status: 200 }),
    );

    await expect(apiFetch("/beta_users")).resolves.toEqual({ message: "ok" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.com/beta_users");
    expect(init?.credentials).toBe("include");
    expect(new Headers(init?.headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("throws with the status and body on a failed response", async () => {
    const { apiFetch } = await importApi("https://api.example.com");
    vi.mocked(fetch).mockResolvedValue(
      new Response("Not allowed.", { status: 401 }),
    );

    await expect(apiFetch("/beta_users")).rejects.toThrow(
      "API error: 401 Not allowed.",
    );
  });
});
