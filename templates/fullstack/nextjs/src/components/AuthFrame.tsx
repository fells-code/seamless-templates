import type { ReactNode } from "react";

/** The signed-out surface: the pitch on a band beside the form. */
export default function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="band-fill band-shape relative flex flex-col justify-center overflow-hidden px-6 py-10 text-band-ink sm:px-10 lg:w-1/2">
        <h1 className="display max-w-xl">Seamless Auth</h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-band-ink-muted">
          A Next.js application with passwordless authentication built in: the
          auth routes, the session, and the route protection all live in this
          one project.
        </p>
      </div>

      <div className="flex w-full flex-col justify-center bg-surface px-6 py-16 sm:px-10 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          {children}

          <p className="mt-12 text-center text-xs text-ink-muted">
            <a
              className="transition-colors hover:text-ink"
              href="https://seamlessauth.com"
              target="_blank"
              rel="noopener"
            >
              Secured by Seamless Auth
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
