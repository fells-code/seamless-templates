import { describe, expect, it } from "vitest";

import { captureMessaging } from "./capture";
import { readAuthConfig, requireAuthConfig, serveAdminConsole } from "./config";

const COMPLETE = {
  AUTH_SERVER_URL: "http://localhost:5312",
  COOKIE_SIGNING_KEY: "x".repeat(32),
  API_SERVICE_TOKEN: "service-token",
  JWKS_KID: "dev-main",
};

describe("readAuthConfig", () => {
  it("reports every missing variable at once", () => {
    const result = readAuthConfig({});

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toHaveLength(4);
    expect(result.problems.join(" ")).toMatch(
      /AUTH_SERVER_URL.*COOKIE_SIGNING_KEY.*API_SERVICE_TOKEN.*JWKS_KID/,
    );
  });

  it("refuses a signing key shorter than 32 characters", () => {
    const result = readAuthConfig({ ...COMPLETE, COOKIE_SIGNING_KEY: "short" });

    expect(result.ok).toBe(false);
  });

  it("builds the handler and session options from one environment", () => {
    const result = readAuthConfig(COMPLETE);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.handler).toMatchObject({
      authServerUrl: "http://localhost:5312",
      audience: "http://localhost:5312",
      jwksKid: "dev-main",
      accessCookieName: "seamless-access",
    });
    expect(result.config.session.accessCookieName).toBe(
      result.config.handler.accessCookieName,
    );
  });

  it("names the cookies from AUTH_COOKIE_PREFIX", () => {
    const result = readAuthConfig({ ...COMPLETE, AUTH_COOKIE_PREFIX: "app-" });

    if (!result.ok) throw new Error("expected a valid config");
    expect(result.config.handler).toMatchObject({
      accessCookieName: "app-access",
      refreshCookieName: "app-refresh",
    });
    expect(result.config.session.refreshCookieName).toBe("app-refresh");
  });

  it("logs codes to the console only in development", () => {
    const dev = readAuthConfig({ ...COMPLETE, NODE_ENV: "development" });
    const prod = readAuthConfig({ ...COMPLETE, NODE_ENV: "production" });

    if (!dev.ok || !prod.ok) throw new Error("expected a valid config");
    expect(dev.config.handler.messaging).toBeDefined();
    expect(prod.config.handler.messaging).toBeUndefined();
  });

  it("captures codes instead of sending them only when SEAMLESS_VERIFY_CAPTURE is true", () => {
    const capture = readAuthConfig({
      ...COMPLETE,
      NODE_ENV: "production",
      SEAMLESS_VERIFY_CAPTURE: "true",
    });
    const other = readAuthConfig({
      ...COMPLETE,
      NODE_ENV: "production",
      SEAMLESS_VERIFY_CAPTURE: "1",
    });

    if (!capture.ok || !other.ok) throw new Error("expected a valid config");
    expect(capture.config.handler.messaging).toBe(captureMessaging);
    expect(other.config.handler.messaging).toBeUndefined();
  });
});

describe("requireAuthConfig", () => {
  it("throws with every problem listed", () => {
    expect(() => requireAuthConfig({})).toThrow(/AUTH_SERVER_URL/);
  });
});

describe("serveAdminConsole", () => {
  it("is on only for the exact string true", () => {
    expect(serveAdminConsole({ SERVE_ADMIN_CONSOLE: "true" })).toBe(true);
    expect(serveAdminConsole({ SERVE_ADMIN_CONSOLE: " true " })).toBe(true);

    for (const value of [undefined, "", "false", "TRUE", "1", "yes"]) {
      expect(serveAdminConsole({ SERVE_ADMIN_CONSOLE: value })).toBe(false);
    }
  });
});
