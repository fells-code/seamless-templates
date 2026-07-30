/*
 * Copyright © 2026 Fells Code, LLC
 * Licensed under the GNU Affero General Public License v3.0
 * See LICENSE file in the project root for full license information
 */

interface ConfigurationErrorProps {
  message: string;
}

// Rendered in place of the app when a value it cannot run without is missing, so
// the failure names the variable instead of appearing as a blank page or a
// request to the wrong origin.
export default function ConfigurationError({
  message,
}: ConfigurationErrorProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-6">
      <div className="max-w-xl w-full space-y-6 rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-gray-900 p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configuration needed
        </h1>

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {message}
        </p>

        <pre className="text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
          {`cp .env.example .env\n# VITE_API_URL=http://localhost:3000\nnpm run dev`}
        </pre>
      </div>
    </div>
  );
}
