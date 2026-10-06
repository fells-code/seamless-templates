// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSeamlessClaims = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

vi.mock("@seamless-auth/nextjs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@seamless-auth/nextjs")>()),
  getSeamlessClaims: (...args: unknown[]) => getSeamlessClaims(...args),
}));

const { GET } = await import("./route");

describe("GET /api/beta-users", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SERVER_URL", "http://localhost:5312");
    vi.stubEnv("COOKIE_SIGNING_KEY", "x".repeat(32));
    vi.stubEnv("API_SERVICE_TOKEN", "service-token");
    vi.stubEnv("JWKS_KID", "dev-main");
    getSeamlessClaims.mockReset();
  });

  it("answers 401 without a session", async () => {
    getSeamlessClaims.mockReturnValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("answers 403 without the betaUser role", async () => {
    getSeamlessClaims.mockReturnValue({ id: "u1", roles: ["user"] });

    const response = await GET();

    expect(response.status).toBe(403);
  });

  it("returns the list to a beta user", async () => {
    getSeamlessClaims.mockReturnValue({ id: "u1", roles: ["betaUser"] });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toContain("ada@example.com");
  });
});
