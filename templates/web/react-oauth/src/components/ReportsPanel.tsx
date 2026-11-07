import { usePermissions } from "@seamless-auth/react";
import { useEffect, useState } from "react";

import { ApiError, apiFetch } from "../lib/api";

type Report = { id: string; title: string };

/**
 * The reports the API serves at GET /reports, for a session that holds
 * `reports:read`.
 *
 * Hiding them is a courtesy, not access control: the API's permission guard on
 * /reports is what enforces, and it refuses anyone without the permission
 * whatever this renders. The permissions here are the ones the last session read
 * returned, so a grant made since shows up after the next sign-in or refresh.
 */
export default function ReportsPanel() {
  const { hasPermission, loading } = usePermissions();
  const canReadReports = hasPermission("reports:read");

  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canReadReports) return;
    let active = true;

    apiFetch<{ reports: Report[] }>("/reports").then(
      (body) => {
        if (active) setReports(body.reports);
      },
      (cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof ApiError && cause.status === 403
            ? "The API refused: this session's token does not carry reports:read yet. Sign in again to pick up a new grant."
            : "The reports request did not complete.",
        );
      },
    );

    return () => {
      active = false;
    };
  }, [canReadReports]);

  if (loading) return null;

  if (!canReadReports) {
    return (
      <p className="text-sm text-ink-muted">
        This user does not hold the{" "}
        <code className="px-1 py-0.5 rounded bg-line">reports:read</code>{" "}
        permission, so the reports stay hidden. Permissions need Seamless Auth
        API v0.23 or later and a role that grants them; the README has the
        steps.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">
        This user holds{" "}
        <code className="px-1 py-0.5 rounded bg-line">reports:read</code>, so
        the reports from the API show here.
      </p>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {reports && (
        <ul className="space-y-1">
          {reports.map((report) => (
            <li key={report.id} className="text-sm text-ink">
              {report.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
