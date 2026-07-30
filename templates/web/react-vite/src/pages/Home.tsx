import { AuthRoutes, useAuth } from "@seamless-auth/react";
import { Link } from "react-router-dom";

export default function Home() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center text-gray-600 dark:text-gray-400">
        Checking your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sign in
        </h1>

        <p className="text-gray-700 dark:text-gray-400">
          This application uses Seamless Auth for passwordless authentication.
          Sign in to see how authentication state flows through the UI and API.
        </p>

        <AuthRoutes />

        <p className="text-sm text-gray-500 dark:text-gray-500">
          Learn more in the{" "}
          <a
            href="https://docs.seamlessauth.com"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Seamless Auth documentation
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        You are signed in
      </h1>

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

      <div className="space-y-2">
        <Link
          to="/session"
          className="block text-blue-600 dark:text-blue-400 underline"
        >
          Inspect this session
        </Link>

        <Link
          to="/beta"
          className="block text-blue-600 dark:text-blue-400 underline"
        >
          View protected route example
        </Link>

        <Link
          to="/about"
          className="block text-blue-600 dark:text-blue-400 underline"
        >
          Learn how this example works
        </Link>
      </div>
    </div>
  );
}
