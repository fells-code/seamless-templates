"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useAuthClient } from "@seamless-auth/react";

type Status = "verifying" | "elsewhere" | "failed";
type Verification = ReturnType<
  ReturnType<typeof useAuthClient>["verifyMagicLink"]
>;

/**
 * Opened from the emailed link.
 *
 * Verifying the link does not sign in this tab: the session belongs to the
 * browser that asked for the link, which collects it from /magic-link/check.
 * So after verifying, this page tells that tab (if it is open in this browser)
 * and then collects the session itself, which works whenever the link was
 * opened in the same browser. Opened anywhere else, there is no session here to
 * collect, and the page says to go back to the device that asked.
 */
export default function VerifyMagicLink({ token }: { token?: string }) {
  const router = useRouter();
  const client = useAuthClient();
  const { refreshSession } = useAuth();
  const [status, setStatus] = useState<Status>(token ? "verifying" : "failed");

  // A link can be used once. React runs this effect twice in development
  // (Strict Mode mounts, unmounts and mounts again), and a second request would
  // find the token already spent, so the remount reuses the first request.
  const verification = useRef<{ token: string; result: Verification } | null>(
    null,
  );

  useEffect(() => {
    if (!token) return;
    let active = true;

    if (verification.current?.token !== token) {
      verification.current = { token, result: client.verifyMagicLink(token) };
    }
    const { result } = verification.current;

    void (async () => {
      const { error } = await result;
      if (!active) return;

      if (error) {
        setStatus("failed");
        return;
      }

      const channel = new BroadcastChannel("seamless-auth");
      channel.postMessage({ type: "MAGIC_LINK_AUTH_SUCCESS" });
      channel.close();

      // The other tab may collect it first; either way the session check below
      // is what decides.
      await client.checkMagicLink();
      const { error: sessionError } = await refreshSession();
      if (!active) return;

      if (sessionError) {
        setStatus("elsewhere");
        return;
      }

      router.replace("/session");
      router.refresh();
    })();

    return () => {
      active = false;
    };
  }, [token, client, refreshSession, router]);

  return (
    <div role="status">
      <h2 className="title text-ink">
        {status === "failed"
          ? "This link did not work"
          : status === "elsewhere"
            ? "You are verified"
            : "Signing you in"}
      </h2>
      <p className="mt-4 text-sm text-ink-muted">
        {status === "failed"
          ? "It may have expired or already been used. Request a new one from the sign-in page."
          : status === "elsewhere"
            ? "Go back to the device where you asked for the link. It signs in on its own."
            : "One moment."}
      </p>
    </div>
  );
}
