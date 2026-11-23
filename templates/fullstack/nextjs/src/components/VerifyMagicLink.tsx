"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  confirmMagicLinkSignIn,
  finishMagicLinkSignIn,
  magicLinkConfirmationPrompt,
  takeMagicLinkParams,
  verifyMagicLinkSignIn,
  type MagicLinkParams,
  type MagicLinkVerification,
} from "@seamless-auth/client";
import { useAuth, useAuthClient } from "@seamless-auth/react";

import Button from "@/components/Button";

type Status =
  "verifying" | "confirm" | "approved" | "declined" | "elsewhere" | "failed";

/**
 * Opened from the emailed link, `/verify-magiclink?token=...#code=...`.
 *
 * The auth server holds every link until it is confirmed with the code from
 * the fragment. `verifyMagicLinkSignIn` confirms at once when the server says
 * this is the device that asked for the link. Verifying does not sign in this
 * tab: the session belongs to the browser that asked, which collects it from
 * /magic-link/check, so `finishMagicLinkSignIn` tells that tab and collects
 * the session here too when it can, which works whenever the link was opened
 * in the same browser.
 *
 * Opened on a different device, the link is not used until the reader
 * approves it, and approving signs in the other device, not this one.
 */
export default function VerifyMagicLink() {
  const router = useRouter();
  const client = useAuthClient();
  const { refreshSession } = useAuth();
  const [status, setStatus] = useState<Status>("verifying");
  const [prompt, setPrompt] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(false);

  // Taking the link strips it from the address bar, and a link can be used
  // once. React runs this effect twice in development (Strict Mode mounts,
  // unmounts and mounts again), so the remount reuses the first read and the
  // first request rather than finding an empty address or a spent link.
  const link = useRef<MagicLinkParams | null>(null);
  const verification = useRef<Promise<MagicLinkVerification> | null>(null);

  useEffect(() => {
    link.current ??= takeMagicLinkParams();
    const { token, code } = link.current;
    if (!token) {
      setStatus("failed");
      return;
    }
    let active = true;

    verification.current ??= verifyMagicLinkSignIn({ client, token, code });
    const result = verification.current;

    void (async () => {
      const outcome = await result;
      if (!active) return;

      if (outcome.status === "confirmation-required") {
        setPrompt(magicLinkConfirmationPrompt(outcome.confirmation));
        setStatus("confirm");
        return;
      }
      if (outcome.status === "failed") {
        setStatus("failed");
        return;
      }

      const signedIn = await finishMagicLinkSignIn({ client, refreshSession });
      if (!active) return;

      if (signedIn === "elsewhere") {
        setStatus("elsewhere");
        return;
      }
      router.replace("/session");
      router.refresh();
    })();

    return () => {
      active = false;
    };
  }, [client, refreshSession, router]);

  async function approve() {
    const { token, code } = link.current ?? { token: null, code: null };
    if (!token) return;
    setConfirming(true);
    setConfirmError(false);
    const { error } = await confirmMagicLinkSignIn({ client, token, code });
    setConfirming(false);
    if (error) {
      setConfirmError(true);
    } else {
      setStatus("approved");
    }
  }

  if (status === "confirm") {
    return (
      <div>
        <h2 className="title text-ink">Sign in on another device?</h2>
        <p className="mt-4 text-sm text-ink-muted">
          {prompt} Approve only if that was you.
        </p>
        {confirmError ? (
          <p role="alert" className="mt-4 text-sm text-ink">
            That did not work. The link may have expired. Request a new one from
            the sign-in page.
          </p>
        ) : null}
        <div className="mt-6 space-y-3">
          <Button full busy={confirming} onClick={() => void approve()}>
            Yes, sign in that device
          </Button>
          <Button
            full
            variant="quiet"
            disabled={confirming}
            onClick={() => setStatus("declined")}
          >
            No, this wasn&apos;t me
          </Button>
        </div>
      </div>
    );
  }

  const copy: Record<Exclude<Status, "confirm">, [string, string]> = {
    verifying: ["Signing you in", "One moment."],
    failed: [
      "This link did not work",
      "It may have expired or already been used. Request a new one from the sign-in page.",
    ],
    elsewhere: [
      "You are verified",
      "Go back to the device where you asked for the link. It signs in on its own.",
    ],
    approved: [
      "Sign-in approved",
      "Return to your other device. It signs in on its own.",
    ],
    declined: [
      "Nothing was signed in",
      "You can ignore the email. Without your approval the link signs nothing in, and it expires on its own.",
    ],
  };
  const [title, body] = copy[status];

  return (
    <div role="status">
      <h2 className="title text-ink">{title}</h2>
      <p className="mt-4 text-sm text-ink-muted">{body}</p>
    </div>
  );
}
