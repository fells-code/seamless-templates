import { useAuth } from "@seamless-auth/react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export default function ProtectedExample() {
  const { hasScopedRole, isAuthenticated, user } = useAuth();

  const [betaData, setBetaData] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasBetaRole = hasScopedRole("betaUser") === true;
  const userLabel = user?.email || user?.phone || user?.id;

  useEffect(() => {
    if (!isAuthenticated || !hasBetaRole) return;

    const fetchBetaUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch<string[]>("/beta_users");
        setBetaData(data);
      } catch (error) {
        console.error("Failed make beta api call. Reason: ", error);
        setError(
          "The API rejected this request. This usually means the user does not have the required role.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBetaUsers();
  }, [hasBetaRole, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="max-w-lg w-full bg-surface-raised p-8 rounded-card border border-line text-center">
          <h1 className="text-2xl font-bold text-ink">
            Authentication Required
          </h1>
          <p className="mt-4 text-ink-muted">
            This page is only accessible to authenticated users. Sign in to
            continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface px-6 py-16">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-4">
          <h1 className="text-3xl font-extrabold text-ink">
            Protected Route Example
          </h1>
          <p className="text-ink-muted">
            This page demonstrates how Seamless Auth handles authentication,
            role-based authorization, and protected API access.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-ink">Authentication</h2>
          <p className="text-ink-muted">
            You are currently signed in as{" "}
            <span className="font-medium">{userLabel}</span>. Access to this
            page is restricted to authenticated users.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-ink">Authorization</h2>

          {!hasBetaRole && (
            <div className="p-6 rounded-card border border-yellow-300 bg-yellow-50">
              <h3 className="font-semibold text-yellow-800">
                Missing Required Role
              </h3>
              <p className="mt-2 text-ink-muted">
                Your account does not have the{" "}
                <code className="px-1 py-0.5 rounded bg-line">betaUser</code>{" "}
                role. As a result, beta-only content and API requests are not
                available.
              </p>
            </div>
          )}

          {hasBetaRole && (
            <div className="p-6 rounded-card border border-green-300 bg-green-50">
              <h3 className="font-semibold text-green-800">Role Verified</h3>
              <p className="mt-2 text-ink-muted">
                Your account includes the{" "}
                <code className="px-1 py-0.5 rounded bg-line">betaUser</code>{" "}
                role. Beta-only content is available below.
              </p>
            </div>
          )}
        </section>

        {hasBetaRole && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-ink">
              Protected API Call
            </h2>

            {loading && (
              <p className="text-ink-muted">Loading beta data from the API…</p>
            )}

            {error && (
              <div className="p-4 rounded-card border border-red-300 bg-red-50 text-red-700">
                {error}
              </div>
            )}

            {betaData && (
              <div className="rounded-card border border-line bg-surface-raised p-4">
                <pre className="text-sm text-ink overflow-x-auto">
                  {JSON.stringify(betaData, null, 2)}
                </pre>
              </div>
            )}
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-ink">Try It Yourself</h2>
          <p className="text-ink-muted">
            You can experiment with this behavior by modifying roles in
            different parts of the system:
          </p>

          <ul className="list-disc ml-6 space-y-2 text-ink-muted">
            <li>Change the user roles returned by the auth server</li>
            <li>Modify role checks in the frontend</li>
            <li>Enforce or relax role requirements in the API</li>
          </ul>

          <p className="text-ink-muted">
            This demonstrates how Seamless Auth encourages explicit,
            defense-in-depth authorization across your stack.
          </p>
        </section>
      </div>
    </div>
  );
}
