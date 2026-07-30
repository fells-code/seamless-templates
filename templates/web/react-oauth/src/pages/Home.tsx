import { useAuth } from "@seamless-auth/react";
import { Link } from "react-router-dom";

// Rendered only for authenticated users (see RequireAuth in App.tsx), so this is
// where an OAuth-signed-in user lands after the callback completes.
export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        You are signed in
      </h1>

      <p className="text-gray-700 dark:text-gray-400">
        You authenticated through an OAuth provider. The auth server issued its
        own identity for the session, so the rest of the app never talks to the
        provider again.
      </p>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900 space-y-2">
        <p className="text-gray-700 dark:text-gray-300">
          Signed in as{" "}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {user?.email || user?.phone || user?.id}
          </span>
        </p>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {user?.roles.length
            ? `Roles: ${user.roles.join(", ")}`
            : "No roles assigned yet."}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/session"
          className="text-blue-600 dark:text-blue-400 underline"
        >
          Inspect this session
        </Link>

        <Link
          to="/about"
          className="text-blue-600 dark:text-blue-400 underline"
        >
          How this example works
        </Link>

        <button
          type="button"
          onClick={logout}
          className="px-4 py-2 rounded-md bg-[#2169a8] text-white hover:bg-[#1a568a] transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
