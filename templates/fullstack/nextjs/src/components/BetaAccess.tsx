"use client";

import { useEffect, useState } from "react";
import { useAuth, useAuthorizedFetch } from "@seamless-auth/react";

type State =
  | { kind: "loading" }
  | { kind: "loaded"; users: string[] }
  | { kind: "refused"; status: number }
  | { kind: "failed" };

/**
 * Calls an application route that requires the `betaUser` role. The route
 * checks the role on the server; the badge here only reflects it.
 */
export default function BetaAccess() {
  const { hasScopedRole } = useAuth();
  const authorizedFetch = useAuthorizedFetch();
  const [state, setState] = useState<State>({ kind: "loading" });
  const hasBetaRole = hasScopedRole("betaUser") === true;

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const response = await authorizedFetch("/api/beta-users");
        if (!active) return;
        setState(
          response.ok
            ? { kind: "loaded", users: await response.json() }
            : { kind: "refused", status: response.status },
        );
      } catch {
        if (active) setState({ kind: "failed" });
      }
    })();

    return () => {
      active = false;
    };
  }, [authorizedFetch]);

  return (
    <section className="space-y-8">
      <div>
        <h1 className="title text-ink">Beta access</h1>
        <p className="mt-4 text-sm text-ink-muted">
          {hasBetaRole
            ? "You hold the betaUser role."
            : "You do not hold the betaUser role. Grant it from the Seamless admin console, then sign in again."}
        </p>
      </div>

      {state.kind === "loading" && (
        <p className="text-sm text-ink-muted">Loading…</p>
      )}
      {state.kind === "refused" && (
        <p className="text-sm text-ink-muted">
          The server answered {state.status}:{" "}
          {state.status === 403
            ? "this route requires the betaUser role."
            : "sign in to see this list."}
        </p>
      )}
      {state.kind === "failed" && (
        <p className="text-sm text-negative">The request did not complete.</p>
      )}
      {state.kind === "loaded" && (
        <ul className="panel panel-pad space-y-2">
          {state.users.map((email) => (
            <li key={email} className="text-sm text-ink">
              {email}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
