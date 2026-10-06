/** Shown instead of the application while the environment is incomplete. */
export default function ConfigurationError({
  problems,
}: {
  problems: string[];
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="panel panel-pad w-full max-w-xl">
        <h1 className="title text-ink">This application is not configured</h1>

        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-ink-muted">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-ink-muted">
          Copy <code>.env.example</code> to <code>.env</code>, fill these in,
          then restart <code>npm run dev</code>.
        </p>
      </div>
    </main>
  );
}
