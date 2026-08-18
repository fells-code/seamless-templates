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
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="max-w-xl w-full space-y-6 rounded-card border border-red-300 bg-surface-raised p-8">
        <h1 className="text-2xl font-bold text-ink">Configuration needed</h1>

        <p className="text-ink-muted leading-relaxed">{message}</p>

        <pre className="text-sm text-ink bg-surface rounded-card p-4 overflow-x-auto">
          {`cp .env.example .env\n# VITE_API_URL=http://localhost:3000\nnpm run dev`}
        </pre>
      </div>
    </div>
  );
}
