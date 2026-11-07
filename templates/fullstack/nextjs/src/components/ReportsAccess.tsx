"use client";

import { useEffect, useState } from "react";
import { useAuthorizedFetch, usePermissions } from "@seamless-auth/react";

type Report = { id: string; title: string };

type State =
  | { kind: "loading" }
  | { kind: "loaded"; reports: Report[] }
  | { kind: "refused"; status: number }
  | { kind: "failed" };

/**
 * Shown only to a session that holds `reports:read`. Hiding it is a courtesy:
 * `requirePermission` on /api/reports is what enforces, and it refuses anyone
 * without the permission whatever this component renders.
 */
export default function ReportsAccess() {
  const { hasPermission, loading } = usePermissions();
  const authorizedFetch = useAuthorizedFetch();
  const [state, setState] = useState<State>({ kind: "loading" });
  const canReadReports = hasPermission("reports:read");

  useEffect(() => {
    if (!canReadReports) return;
    let active = true;

    void (async () => {
      try {
        const response = await authorizedFetch("/api/reports");
        if (!active) return;
        setState(
          response.ok
            ? {
                kind: "loaded",
                reports: ((await response.json()) as { reports: Report[] })
                  .reports,
              }
            : { kind: "refused", status: response.status },
        );
      } catch {
        if (active) setState({ kind: "failed" });
      }
    })();

    return () => {
      active = false;
    };
  }, [authorizedFetch, canReadReports]);

  if (loading) return null;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">Reports</h2>
        <p className="mt-2 text-sm text-ink-muted">
          {canReadReports
            ? "You hold the reports:read permission."
            : "You do not hold the reports:read permission. It needs Seamless Auth API v0.23 or later and a role that grants it; see the README."}
        </p>
      </div>

      {canReadReports && state.kind === "loading" && (
        <p className="text-sm text-ink-muted">Loading…</p>
      )}
      {canReadReports && state.kind === "refused" && (
        <p className="text-sm text-ink-muted">
          The server answered {state.status}. Permissions in the browser come
          from the last session read, so the server can know better.
        </p>
      )}
      {canReadReports && state.kind === "failed" && (
        <p className="text-sm text-negative">The request did not complete.</p>
      )}
      {canReadReports && state.kind === "loaded" && (
        <ul className="panel panel-pad space-y-2">
          {state.reports.map((report) => (
            <li key={report.id} className="text-sm text-ink">
              {report.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
