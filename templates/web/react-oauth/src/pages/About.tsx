export default function About() {
  return (
    <div className="min-h-screen bg-surface px-6 py-16">
      <div className="max-w-4xl mx-auto space-y-16">
        <header className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-ink tracking-tight">
            About This Example
          </h1>
          <p className="text-lg text-ink-muted max-w-2xl mx-auto">
            This application is a reference implementation showing how to use
            Seamless Auth across a frontend, API, and authentication server.
          </p>
        </header>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-ink">What Seamless Auth Is</h2>
          <p className="text-ink-muted leading-relaxed">
            Seamless Auth is a passwordless authentication system designed to be
            embedded directly into your application. It supports passkeys, magic
            links, email OTP, phone OTP, and optional OAuth providers while
            keeping the auth server self-hostable and auditable.
          </p>
          <p className="text-ink-muted leading-relaxed">
            The React SDK manages auth state through `AuthProvider`, built-in
            auth screens through `AuthRoutes`, and headless flows through
            `useAuthClient` when you need custom UI.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-ink">
            What This Template Demonstrates
          </h2>
          <p className="text-ink-muted leading-relaxed">
            This project is intentionally minimal. It exists to demonstrate core
            Seamless Auth concepts rather than serve as a production-ready
            application.
          </p>

          <ul className="list-disc ml-6 text-ink-muted space-y-2">
            <li>Embedded login and logout using the Seamless Auth React SDK</li>
            <li>Passwordless authentication with built-in auth routes</li>
            <li>Protected API calls through your application API</li>
            <li>Role-based access control using user roles</li>
            <li>A protected route accessible only to authenticated users</li>
          </ul>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-ink">
            Protected Routes and Roles
          </h2>
          <p className="text-ink-muted leading-relaxed">
            One of the routes in this application is restricted to users with
            the <code className="px-1 py-0.5 rounded bg-line">betaUser</code>{" "}
            role.
          </p>
          <p className="text-ink-muted leading-relaxed">
            This demonstrates how authorization decisions can be made in your
            application based on roles issued by the auth server and verified by
            your API.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-ink">
            How to Use This Project
          </h2>
          <p className="text-ink-muted leading-relaxed">
            This template is best used as a learning and experimentation tool.
            You are encouraged to inspect the code, modify it, and adapt the
            patterns to your own application.
          </p>

          <ul className="list-disc ml-6 text-ink-muted space-y-2">
            <li>Explore how authentication state flows through the app</li>
            <li>Review how the API validates user sessions</li>
            <li>Experiment with roles and protected routes</li>
            <li>Replace mock content with your product routes</li>
          </ul>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-ink">Learn More</h2>
          <p className="text-ink-muted leading-relaxed">
            For a deeper explanation of Seamless Auth concepts, configuration
            options, and deployment guidance, refer to the official
            documentation.
          </p>

          <div className="text-center pt-4">
            <a
              href="https://docs.seamlessauth.com"
              target="_blank"
              rel="noreferrer"
              className="inline-block px-8 py-3 text-lg font-semibold rounded-card bg-brand text-brand-ink hover:bg-brand-hover transition shadow-raised"
            >
              View Seamless Auth Documentation
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
