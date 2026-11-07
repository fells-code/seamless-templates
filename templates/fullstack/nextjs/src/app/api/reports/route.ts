import { requirePermission } from "@seamless-auth/nextjs";

import { requireAuthConfig } from "@/lib/config";

// Stands in for the application's own data, as the beta list does.
const REPORTS = [
  { id: "weekly-signups", title: "Weekly sign-ups" },
  { id: "active-sessions", title: "Active sessions" },
];

/**
 * An application route guarded by a permission. `requirePermission` verifies
 * the session and answers 403 `insufficient_permission` unless its access token
 * carries `reports:read`; the panel the page shows is only a reflection of it.
 *
 * reports:read is the example permission in every Seamless starter, so one role
 * mapped to it in the admin console opens this route in whichever starter you
 * scaffolded. Permissions need auth API v0.23 or later: an older API issues no
 * permissions claim, and this route answers 403 to everyone until then.
 *
 * The guard is built per request because the configuration is read per
 * request (see src/lib/config.ts).
 */
export async function GET(request: Request) {
  const route = requirePermission(
    "reports:read",
    (_request, _context, user) =>
      Response.json({
        message: "Reports for holders of the reports:read permission.",
        reports: REPORTS,
        user: { id: user.id },
      }),
    requireAuthConfig().handler,
  );

  return route(request, undefined);
}
