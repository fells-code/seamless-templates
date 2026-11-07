// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/reports", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SERVER_URL", "http://localhost:5312");
    vi.stubEnv("COOKIE_SIGNING_KEY", "x".repeat(32));
    vi.stubEnv("SEAMLESS_SERVICE_TOKEN", "service-token");
    vi.stubEnv("JWKS_KID", "dev-main");
  });

  it("answers 401 without a session", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/reports"),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
  });
});
