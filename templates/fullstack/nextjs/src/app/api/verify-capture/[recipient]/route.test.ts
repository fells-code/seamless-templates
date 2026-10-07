// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { captureMessaging } from "@/lib/capture";

import { GET } from "./route";

const read = (recipient: string) =>
  GET(new Request("http://localhost/"), {
    params: Promise.resolve({ recipient: encodeURIComponent(recipient) }),
  });

describe("GET /api/verify-capture/[recipient]", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not exist unless SEAMLESS_VERIFY_CAPTURE is true", async () => {
    await captureMessaging.handlers!.sendOtpEmail!({
      to: "c@example.com",
      token: "QWERTY",
    });

    expect((await read("c@example.com")).status).toBe(404);
  });

  it("returns the captured code when capture is on", async () => {
    vi.stubEnv("SEAMLESS_VERIFY_CAPTURE", "true");
    await captureMessaging.handlers!.sendOtpEmail!({
      to: "d+tag@example.com",
      token: "ZXCVBN",
    });

    const response = await read("d+tag@example.com");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ token: "ZXCVBN" });
  });
});
