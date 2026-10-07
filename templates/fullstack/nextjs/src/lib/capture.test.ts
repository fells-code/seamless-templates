// @vitest-environment node
import { describe, expect, it } from "vitest";

import { captureEnabled, captureMessaging, readCaptured } from "./capture";

describe("captureEnabled", () => {
  it("is off unless SEAMLESS_VERIFY_CAPTURE is exactly true", () => {
    expect(captureEnabled({})).toBe(false);
    expect(captureEnabled({ SEAMLESS_VERIFY_CAPTURE: "1" })).toBe(false);
    expect(captureEnabled({ SEAMLESS_VERIFY_CAPTURE: "true" })).toBe(true);
  });
});

describe("captureMessaging", () => {
  it("holds the latest code per recipient", async () => {
    await captureMessaging.handlers!.sendOtpEmail!({
      to: "a@example.com",
      token: "ABCDEF",
    });
    await captureMessaging.handlers!.sendOtpSms!({
      to: "+14155550100",
      token: 123456,
    });

    expect(readCaptured("a@example.com")).toEqual({ token: "ABCDEF" });
    expect(readCaptured("+14155550100")).toEqual({ token: "123456" });
    expect(readCaptured("nobody@example.com")).toBeNull();
  });

  it("reads a magic link's token from the link when it is not sent alone", async () => {
    const magicLinkUrl = "http://localhost:5173/verify-magiclink?token=t0k3n";
    const result = await captureMessaging.handlers!.sendMagicLinkEmail!({
      to: "b@example.com",
      magicLinkUrl,
    });

    expect(result.accepted).toBe(true);
    expect(readCaptured("b@example.com")).toEqual({
      token: "t0k3n",
      magicLinkUrl,
    });
  });
});
