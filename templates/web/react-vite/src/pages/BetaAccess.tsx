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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
        <div className="max-w-lg w-full bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Authentication Required
          </h1>
          <p className="mt-4 text-gray-700 dark:text-gray-400">
            This page is only accessible to authenticated users. Sign in to
            continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black px-6 py-16">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-4">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Protected Route Example
          </h1>
          <p className="text-gray-700 dark:text-gray-400">
            This page demonstrates how Seamless Auth handles authentication,
            role-based authorization, and protected API access.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Authentication
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            You are currently signed in as{" "}
            <span className="font-medium">{userLabel}</span>.
            Access to this page is restricted to authenticated users.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Authorization
          </h2>

          {!hasBetaRole && (
            <div className="p-6 rounded-xl border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
                Missing Required Role
              </h3>
              <p className="mt-2 text-gray-700 dark:text-gray-400">
                Your account does not have the{" "}
                <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800">
                  betaUser
                </code>{" "}
                role. As a result, beta-only content and API requests are not
                available.
              </p>
            </div>
          )}

          {hasBetaRole && (
            <div className="p-6 rounded-xl border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
              <h3 className="font-semibold text-green-800 dark:text-green-300">
                Role Verified
              </h3>
              <p className="mt-2 text-gray-700 dark:text-gray-400">
                Your account includes the{" "}
                <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800">
                  betaUser
                </code>{" "}
                role. Beta-only content is available below.
              </p>
            </div>
          )}
        </section>

        {hasBetaRole && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Protected API Call
            </h2>

            {loading && (
              <p className="text-gray-600 dark:text-gray-400">
                Loading beta data from the API…
              </p>
            )}

            {error && (
              <div className="p-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {betaData && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
                  {JSON.stringify(betaData, null, 2)}
                </pre>
              </div>
            )}
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Try It Yourself
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            You can experiment with this behavior by modifying roles in
            different parts of the system:
          </p>

          <ul className="list-disc ml-6 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Change the user roles returned by the auth server</li>
            <li>Modify role checks in the frontend</li>
            <li>Enforce or relax role requirements in the API</li>
          </ul>

          <p className="text-gray-700 dark:text-gray-300">
            This demonstrates how Seamless Auth encourages explicit,
            defense-in-depth authorization across your stack.
          </p>
        </section>
      </div>
    </div>
  );
}
