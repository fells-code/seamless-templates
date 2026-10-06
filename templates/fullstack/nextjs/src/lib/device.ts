import type { PasskeyMetadata } from "@seamless-auth/react";

const PLATFORMS: Array<[RegExp, string]> = [
  [/iphone|ipad|ipod/, "iOS"],
  [/android/, "Android"],
  [/mac os/, "macOS"],
  [/windows/, "Windows"],
  [/cros/, "ChromeOS"],
  [/linux/, "Linux"],
];

// Order matters: every Chromium browser also carries a chrome token, and
// Chrome carries a safari one.
const BROWSERS: Array<[RegExp, string]> = [
  [/edg\//, "Edge"],
  [/opr\//, "Opera"],
  [/firefox|fxios/, "Firefox"],
  [/chrome|crios/, "Chrome"],
  [/safari/, "Safari"],
];

function first(table: Array<[RegExp, string]>, ua: string): string {
  return table.find(([pattern]) => pattern.test(ua))?.[1] ?? "Unknown";
}

/**
 * What a new passkey is labelled with in the account's credential list, so a
 * person can tell their laptop's passkey from their phone's.
 */
export function describeDevice(userAgent: string): PasskeyMetadata {
  const ua = userAgent.toLowerCase();
  const platform = first(PLATFORMS, ua);
  const browser = first(BROWSERS, ua);

  return {
    friendlyName: `${browser} on ${platform}`,
    platform,
    browser,
    deviceInfo: userAgent.slice(0, 256),
  };
}
