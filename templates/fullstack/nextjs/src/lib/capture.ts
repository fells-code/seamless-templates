import type { SeamlessAuthMessagingOptions } from "@seamless-auth/nextjs";

/*
 * A messaging transport for `seamless verify`, the conformance suite that drives
 * this starter in a browser. Instead of sending a code or a magic link, it holds
 * the latest one per recipient so the suite can read it back from
 * /api/verify-capture/<recipient>.
 *
 * It is on only when SEAMLESS_VERIFY_CAPTURE is "true", which nothing but the
 * conformance stack sets. Anyone who can reach that route can read sign-in codes,
 * so never set it on a deployment.
 */

export function captureEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.SEAMLESS_VERIFY_CAPTURE === "true";
}

export interface CapturedMessage {
  token: string;
  magicLinkUrl?: string;
}

// On globalThis because each route is its own bundle: the /auth handler that
// captures a code and the route that reads it back would otherwise get separate
// copies of a module-scoped map.
const STORE = Symbol.for("seamless.verify.capture");

function store(): Map<string, CapturedMessage> {
  const holder = globalThis as { [STORE]?: Map<string, CapturedMessage> };
  holder[STORE] ??= new Map();
  return holder[STORE];
}

export function readCaptured(recipient: string): CapturedMessage | null {
  return store().get(recipient) ?? null;
}

export const captureMessaging: SeamlessAuthMessagingOptions = {
  handlers: {
    sendOtpEmail: async ({ to, token }) => {
      store().set(to, { token: String(token) });
      return { accepted: true, provider: "capture", channel: "email" };
    },
    sendOtpSms: async ({ to, token }) => {
      store().set(to, { token: String(token) });
      return { accepted: true, provider: "capture", channel: "sms" };
    },
    sendMagicLinkEmail: async ({ to, token, magicLinkUrl }) => {
      // The token is optional on the wire; the link always carries it.
      const linkToken =
        token ?? new URL(magicLinkUrl).searchParams.get("token") ?? "";
      store().set(to, { token: linkToken, magicLinkUrl });
      return { accepted: true, provider: "capture", channel: "email" };
    },
  },
};
