"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useAuthClient } from "@seamless-auth/react";

type Status = "verifying" | "verified" | "failed";

/**
 * Opened from the emailed link. Verifying it signs in this browser, and tells
 * the tab that asked for the link, if it is open, so that one finishes too.
 */
export default function VerifyMagicLink({ token }: { token?: string }) {
  const router = useRouter();
  const client = useAuthClient();
  const { refreshSession } = useAuth();
  const [status, setStatus] = useState<Status>(token ? "verifying" : "failed");

  useEffect(() => {
    if (!token) return;
    let active = true;

    void (async () => {
      const { error } = await client.verifyMagicLink(token);
      if (!active) return;

      if (error) {
        setStatus("failed");
        return;
      }

      await refreshSession();
      const channel = new BroadcastChannel("seamless-auth");
      channel.postMessage({ type: "MAGIC_LINK_AUTH_SUCCESS" });
      channel.close();

      if (!active) return;
      setStatus("verified");
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
        {status === "failed" ? "This link did not work" : "Signing you in"}
      </h2>
      <p className="mt-4 text-sm text-ink-muted">
        {status === "failed"
          ? "It may have expired or already been used. Request a new one from the sign-in page."
          : "One moment."}
      </p>
    </div>
  );
}
