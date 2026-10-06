import { cookies, headers } from "next/headers";
import type { InitialSession } from "@seamless-auth/react";
import { getSeamlessSession } from "@seamless-auth/nextjs";

import type { AuthConfig } from "./config";

/**
 * The session for this request, for `AuthProvider initialSession`.
 *
 * `null` means signed out, and the page renders that on the first paint; the
 * provider still revalidates in the browser, so a session whose access cookie
 * has only expired is picked up there. Server code never refreshes: it would
 * rotate the refresh token in a response the browser never receives.
 *
 * `undefined` means unknown. An auth server that cannot be reached right now
 * should cost a loading state, not the whole page.
 */
export async function getInitialSession(
  config: AuthConfig,
): Promise<InitialSession | null | undefined> {
  try {
    const session = await getSeamlessSession(await cookies(), {
      ...config.session,
      userAgent: (await headers()).get("user-agent") ?? undefined,
    });

    return session;
  } catch (error) {
    console.error("[seamless] Could not resolve the session on the server.", {
      error,
    });
    return undefined;
  }
}
