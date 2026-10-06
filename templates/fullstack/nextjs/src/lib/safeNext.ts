export const DEFAULT_AFTER_SIGN_IN = "/session";

/**
 * Where to send someone after they sign in, from the `next` query parameter.
 *
 * Only a path on this site is accepted. Anything else would make the sign-in
 * page an open redirect: a link to `/login?next=https://evil.example` that
 * bounces a freshly signed-in user to a lookalike page. `//host` and `/\host`
 * are rejected too, because browsers read both as another origin.
 */
export function safeNext(next: string | string[] | null | undefined): string {
  const value = Array.isArray(next) ? next[0] : next;

  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return DEFAULT_AFTER_SIGN_IN;
  }

  if (value === "/login" || value.startsWith("/login?")) {
    return DEFAULT_AFTER_SIGN_IN;
  }

  return value;
}
