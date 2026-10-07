// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, HEAD } from "./route";

const upstream = vi.fn<typeof fetch>();

describe("/console", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SERVER_URL", "http://auth:5312");
    vi.stubEnv("COOKIE_SIGNING_KEY", "x".repeat(32));
    vi.stubEnv("API_SERVICE_TOKEN", "service-token");
    vi.stubEnv("JWKS_KID", "dev-main");
    vi.stubGlobal("fetch", upstream);
    upstream.mockResolvedValue(
      new Response("<!doctype html><title>Console</title>", {
        headers: {
          "content-type": "text/html",
          "set-cookie": "upstream=1",
        },
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    upstream.mockReset();
  });

  it("does not exist unless SERVE_ADMIN_CONSOLE is true", async () => {
    vi.stubEnv("SERVE_ADMIN_CONSOLE", "false");

    expect((await GET(new Request("http://localhost/console"))).status).toBe(
      404,
    );
    expect((await HEAD(new Request("http://localhost/console"))).status).toBe(
      404,
    );
    expect(upstream).not.toHaveBeenCalled();
  });

  it("serves the dashboard from the auth server's /console", async () => {
    vi.stubEnv("SERVE_ADMIN_CONSOLE", "true");

    const response = await GET(
      new Request("http://localhost/console/users?page=2", {
        headers: { cookie: "seamless-access=secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.text()).toContain("<title>Console</title>");

    const [url, init] = upstream.mock.calls[0];
    expect(String(url)).toBe("http://auth:5312/console/users?page=2");
    // The browser's session cookies never reach the auth server this way.
    expect(init?.headers).toBeUndefined();
  });

  it("answers HEAD without a body", async () => {
    vi.stubEnv("SERVE_ADMIN_CONSOLE", "true");

    const response = await HEAD(
      new Request("http://localhost/console", { method: "HEAD" }),
    );

    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
    expect(String(upstream.mock.calls[0][0])).toBe("http://auth:5312/console");
  });
});
