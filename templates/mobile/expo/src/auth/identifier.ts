/**
 * What the sign-in screen accepts. Email is the only identifier this starter
 * offers, because SMS delivery is not configured in the companion API; the
 * check is deliberately loose since the server validates the address.
 */
export function isEmailLike(value: string): boolean {
  const trimmed = value.trim();
  const at = trimmed.indexOf("@");
  return at > 0 && at < trimmed.length - 1 && !/\s/.test(trimmed);
}

/** The API's OTP codes are six letters. Uppercased so autofill and typing match. */
export function normalizeCode(value: string): string {
  return value
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 6);
}

export function isCompleteCode(value: string): boolean {
  return normalizeCode(value).length === 6;
}
