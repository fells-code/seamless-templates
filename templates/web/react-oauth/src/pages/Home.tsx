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
        You authenticated through an OAuth provider. This is the identity the
        auth server issued for your session:
      </p>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
        <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <div className="flex items-center gap-4">
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
