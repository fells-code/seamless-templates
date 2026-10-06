import { NextResponse, type NextRequest } from "next/server";
import { hasSeamlessSession } from "@seamless-auth/nextjs";

import { readAuthConfig } from "@/lib/config";

/**
 * Sends a signed-out visitor to the sign-in page before a protected page
 * renders, remembering where they were going.
 *
 * The check is local, with no call to the auth server. A valid refresh cookie
 * counts as signed in: the access cookie may simply have expired, and the
 * browser renews it on its next call to /auth.
 */
export function proxy(request: NextRequest) {
  const result = readAuthConfig();

  // A misconfigured application renders its configuration error from the
  // layout. Redirecting here would hide that behind the sign-in page.
  if (
    !result.ok ||
    hasSeamlessSession(request.cookies, result.config.session)
  ) {
    return NextResponse.next();
  }

  const login = new URL("/login", request.url);
  login.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/session/:path*", "/beta/:path*"],
};
