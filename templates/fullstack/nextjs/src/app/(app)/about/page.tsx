const PIECES = [
  {
    file: "src/app/auth/[...seamless]/route.ts",
    what: "Serves the Seamless Auth routes the browser SDK calls, and manages the session cookies. No separate API server.",
  },
  {
    file: "src/app/layout.tsx",
    what: "Reads the session while rendering, so the first paint already shows who is signed in.",
  },
  {
    file: "src/proxy.ts",
    what: "Sends signed-out visitors to the sign-in page before a protected page renders.",
  },
  {
    file: "src/app/api/beta-users/route.ts",
    what: "An application route that checks a role on the server.",
  },
  {
    file: "src/components/SignIn.tsx",
    what: "Sign-in and account creation, built on the SDK's hooks.",
  },
];

export default function AboutPage() {
  return (
    <section className="space-y-8">
      <h1 className="title text-ink">How this application is put together</h1>
      <ul className="space-y-4">
        {PIECES.map(({ file, what }) => (
          <li key={file} className="panel panel-pad">
            <code className="text-sm text-ink">{file}</code>
            <p className="mt-2 text-sm text-ink-muted">{what}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
