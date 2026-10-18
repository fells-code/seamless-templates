"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useAuthClient } from "@seamless-auth/react";

import Button from "@/components/Button";

type Status =
  "verifying" | "confirm" | "approved" | "declined" | "elsewhere" | "failed";
type AuthClient = ReturnType<typeof useAuthClient>;
type Verification = ReturnType<AuthClient["verifyMagicLink"]>;

type RequestedFrom = { deviceClass: string; requestedAt: string };

const DEVICE_LABELS: Record<string, string> = {
  ios: "an iPhone or iPad",
  android: "an Android device",
  macos: "a Mac",
  windows: "a Windows PC",
  linux: "a Linux computer",
  chromeos: "a Chromebook",
  bot: "an automated client",
  unknown: "an unknown device",
};

function readRequestedFrom(body: unknown): RequestedFrom | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  // A proxy in front of the auth server may nest the upstream body under
  // `details`.
  const source =
    record.requestedFrom ??
    (record.details as Record<string, unknown> | undefined)?.requestedFrom;
  if (typeof source !== "object" || source === null) return null;
  const { deviceClass, requestedAt } = source as Record<string, unknown>;
  return {
    deviceClass: typeof deviceClass === "string" ? deviceClass : "unknown",
    requestedAt: typeof requestedAt === "string" ? requestedAt : "",
  };
}

function needsConfirmation(error: unknown): RequestedFrom | null {
  if (typeof error !== "object" || error === null) return null;
  const { status, body } = error as { status?: unknown; body?: unknown };
  if (status !== 409) return null;
  return readRequestedFrom(body) ?? { deviceClass: "unknown", requestedAt: "" };
}

function formatRequestedAt(value: string): string | null {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// `confirmMagicLink` is newer than some published SDKs, so older ones reach
// the same route through the /auth handler directly.
async function confirmMagicLink(
  client: AuthClient,
  token: string,
): Promise<boolean> {
  const sdk = client as AuthClient & {
    confirmMagicLink?: (token: string) => Promise<{ error: unknown }>;
  };
  if (typeof sdk.confirmMagicLink === "function") {
    const { error } = await sdk.confirmMagicLink(token);
    return !error;
  }
  try {
    const response = await client.authorizedFetch(
      `/auth/magic-link/verify/${encodeURIComponent(token)}/confirm`,
      { method: "POST" },
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Opened from the emailed link.
 *
 * Verifying the link does not sign in this tab: the session belongs to the
 * browser that asked for the link, which collects it from /magic-link/check.
 * So after verifying, this page tells that tab (if it is open in this browser)
 * and then collects the session itself, which works whenever the link was
 * opened in the same browser. Opened anywhere else, there is no session here to
 * collect, and the page says to go back to the device that asked.
 *
 * When the auth server sees the link opened on a different device from the
 * one that asked, it answers 409 without spending the link, and the reader
 * has to approve that other device before it signs in.
 */
export default function VerifyMagicLink({ token }: { token?: string }) {
  const router = useRouter();
  const client = useAuthClient();
  const { refreshSession } = useAuth();
  const [status, setStatus] = useState<Status>(token ? "verifying" : "failed");
  const [requestedFrom, setRequestedFrom] = useState<RequestedFrom | null>(
    null,
  );
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(false);

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
        const pending = needsConfirmation(error);
        if (pending) {
          setRequestedFrom(pending);
          setStatus("confirm");
          return;
        }
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

  async function approve() {
    if (!token) return;
    setConfirming(true);
    setConfirmError(false);
    const ok = await confirmMagicLink(client, token);
    setConfirming(false);
    if (ok) {
      setStatus("approved");
    } else {
      setConfirmError(true);
    }
  }

  if (status === "confirm") {
    const device =
      DEVICE_LABELS[requestedFrom?.deviceClass ?? "unknown"] ??
      DEVICE_LABELS.unknown;
    const when = formatRequestedAt(requestedFrom?.requestedAt ?? "");

    return (
      <div>
        <h2 className="title text-ink">Sign in on another device?</h2>
        <p className="mt-4 text-sm text-ink-muted">
          This link was requested from {device}
          {when ? `, ${when}` : ""}. Approve only if that was you.
        </p>
        {confirmError ? (
          <p role="alert" className="mt-4 text-sm text-ink">
            That did not work. The link may have expired. Try again, or request
            a new one from the sign-in page.
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
