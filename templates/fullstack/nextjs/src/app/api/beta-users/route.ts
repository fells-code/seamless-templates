import { cookies } from "next/headers";
import { getSeamlessClaims, hasScopedRole } from "@seamless-auth/nextjs";

import { requireAuthConfig } from "@/lib/config";

// Stands in for the application's own data. The Express starter reads this list
// from a database; here it is static so the template runs with nothing else.
const BETA_USERS = [
  "ada@example.com",
  "grace@example.com",
  "linus@example.com",
];

/**
 * An application route guarded by a role. The access cookie is verified here,
 * on the server, which is the check that matters: the role badge the page shows
 * is only a reflection of it.
 */
export async function GET() {
  const claims = getSeamlessClaims(
    await cookies(),
    requireAuthConfig().session,
  );

  if (!claims) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  if (!hasScopedRole(claims.roles, "betaUser")) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  return Response.json(BETA_USERS);
}
