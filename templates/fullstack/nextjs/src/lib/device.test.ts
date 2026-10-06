import { describe, expect, it } from "vitest";

import { describeDevice } from "./device";

describe("describeDevice", () => {
  it.each([
    [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
      "Safari on macOS",
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0",
      "Edge on Windows",
    ],
    [
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
      "Chrome on Android",
    ],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/128.0 Mobile/15E148 Safari/605.1.15",
      "Firefox on iOS",
    ],
  ])("labels %s", (userAgent, friendlyName) => {
    expect(describeDevice(userAgent).friendlyName).toBe(friendlyName);
  });

  it("falls back for an unknown agent", () => {
    expect(describeDevice("curl/8.0")).toMatchObject({
      platform: "Unknown",
      browser: "Unknown",
    });
  });
});
