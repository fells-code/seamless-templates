import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("security headers", () => {
  it("applies to every path, the root and deep routes alike", async () => {
    const rules = await nextConfig.headers!();
    const rule = rules.find(({ source }) => source === "/:path*");
    expect(rule).toBeDefined();

    const headers = Object.fromEntries(
      rule!.headers.map(({ key, value }) => [key.toLowerCase(), value]),
    );
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
  });
});
