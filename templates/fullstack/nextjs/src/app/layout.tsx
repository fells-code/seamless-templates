import type { Metadata } from "next";
import type { ReactNode } from "react";

import "../index.css";
import ConfigurationError from "@/components/ConfigurationError";
import Providers from "@/components/Providers";
import { getInitialSession } from "@/lib/auth";
import { readAuthConfig } from "@/lib/config";

// Every page depends on the request's session and on the environment at run
// time. Without this, a build with no .env prerenders the configuration error
// into static pages and serves it after the environment is set.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seamless Auth",
  description: "Passwordless authentication in a Next.js application.",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const config = readAuthConfig();

  return (
    <html lang="en">
      <body className="bg-surface text-ink antialiased">
        {config.ok ? (
          <Providers initialSession={await getInitialSession(config.config)}>
            {children}
          </Providers>
        ) : (
          <ConfigurationError problems={config.problems} />
        )}
      </body>
    </html>
  );
}
