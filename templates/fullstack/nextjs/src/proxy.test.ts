// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hasSeamlessSession = vi.fn();

vi.mock("@seamless-auth/nextjs", () => ({
  hasSeamlessSession: (...args: unknown[]) => hasSeamlessSession(...args),
}));

const { proxy } = await import("./proxy");

const request = (path: string) =>
  new NextRequest(new URL(path, "http://localhost:5173"));

describe("proxy", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SERVER_URL", "http://localhost:5312");
    vi.stubEnv("COOKIE_SIGNING_KEY", "x".repeat(32));
    vi.stubEnv("API_SERVICE_TOKEN", "service-token");
    vi.stubEnv("JWKS_KID", "dev-main");
    hasSeamlessSession.mockReset();
  });

  it("lets a request with a session through", () => {
    hasSeamlessSession.mockReturnValue(true);

    const response = proxy(request("/session"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("sends a signed-out visitor to sign in, remembering where they were going", () => {
    hasSeamlessSession.mockReturnValue(false);

    const response = proxy(request("/beta?tab=list"));
    const location = new URL(response.headers.get("location")!);

    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/beta?tab=list");
  });

  it("does not redirect while the environment is incomplete", () => {
    vi.stubEnv("COOKIE_SIGNING_KEY", "");

    const response = proxy(request("/session"));

    expect(response.headers.get("location")).toBeNull();
    expect(hasSeamlessSession).not.toHaveBeenCalled();
  });
});
