import type { ReactNode } from "react";

export default function Login({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-black">
      <div
        className="hidden lg:flex flex-col justify-center px-20 w-1/2
        bg-gradient-to-b from-[#2169a8] to-black text-white"
      >
        <div className="max-w-xl space-y-8">
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
            Seamless Auth
          </h1>

          <p className="text-xl font-light leading-relaxed opacity-90">
            This application is a reference template demonstrating how to
            integrate Seamless Auth into a frontend, API, and authentication
            server.
          </p>

          <p className="text-lg leading-relaxed opacity-90">
            Authentication is embedded directly into the application. The auth
            server handles passwordless login flows while your application keeps
            control of protected routes and API access.
          </p>

          <div className="pt-6 text-sm opacity-80">
            <p>This template is intended for learning and experimentation.</p>
            <p className="mt-2">
              Learn more in the Seamless Auth documentation:
            </p>
            <a
              href="https://docs.seamlessauth.com"
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-2 font-medium underline underline-offset-4"
            >
              docs.seamlessauth.com
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6 sm:px-10">
        <div className="max-w-md w-full">
          {children}

          <p className="mt-10 text-sm text-center text-gray-600 dark:text-gray-400">
            Authentication and session management provided by Seamless Auth.
          </p>

          <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-500">
            See the documentation to understand how authentication state flows
            from the auth server to the API and UI.
          </p>
        </div>
      </div>
    </div>
  );
}
