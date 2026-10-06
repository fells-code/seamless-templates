"use client";

import type { ReactNode } from "react";
import { AuthProvider, type InitialSession } from "@seamless-auth/react";

/**
 * The auth state every client component reads with `useAuth()`.
 *
 * `apiHost` is empty because this application serves /auth itself, so every
 * auth request goes to the page's own origin and its cookies stay first-party.
 * `initialSession` is what the server resolved for this request, so the first
 * paint shows the signed-in user instead of a loading state.
 */
export default function Providers({
  initialSession,
  children,
}: {
  initialSession: InitialSession | null | undefined;
  children: ReactNode;
}) {
  return (
    <AuthProvider apiHost="" initialSession={initialSession}>
      {children}
    </AuthProvider>
  );
}
