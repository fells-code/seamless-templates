"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, usePasskeySupport } from "@seamless-auth/react";

import Button from "@/components/Button";
import { describeDevice } from "@/lib/device";

export default function SessionDetails() {
  const router = useRouter();
  const {
    user,
    credentials,
    registerPasskey,
    deleteCredential,
    logoutAllSessions,
  } = useAuth();
  const { passkeySupported } = usePasskeySupport();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const addPasskey = async () => {
    setBusy(true);
    setMessage("");
    const { error } = await registerPasskey(
      describeDevice(navigator.userAgent),
    );
    setBusy(false);
    setMessage(error ? "The passkey was not saved." : "Passkey added.");
  };

  const removePasskey = async (id: string) => {
    setBusy(true);
    setMessage("");
    const { error } = await deleteCredential(id);
    setBusy(false);
    setMessage(
      error ? "That passkey could not be removed." : "Passkey removed.",
    );
  };

  const signOutEverywhere = async () => {
    await logoutAllSessions();
    router.push("/");
    router.refresh();
  };

  if (!user) {
    return null;
  }

  return (
    <section className="space-y-10">
      <div>
        <h1 className="title text-ink">Your session</h1>
        <p className="mt-4 text-sm text-ink-muted">
          Read with <code>useAuth()</code>. The server resolved it before this
          page rendered and the browser has checked it since.
        </p>
      </div>

      <dl className="panel panel-pad grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="label text-ink-muted">Email</dt>
          <dd className="mt-1 text-ink">{user.email}</dd>
        </div>
        <div>
          <dt className="label text-ink-muted">Phone</dt>
          <dd className="mt-1 text-ink">{user.phone || "Not set"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="label text-ink-muted">Roles</dt>
          <dd className="mt-1 text-ink">
            {user.roles.length ? user.roles.join(", ") : "None"}
          </dd>
        </div>
      </dl>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Passkeys</h2>
        {credentials.length === 0 ? (
          <p className="text-sm text-ink-muted">No passkeys yet.</p>
        ) : (
          <ul className="space-y-2">
            {credentials.map((credential) => (
              <li
                key={credential.id}
                className="panel panel-pad flex items-center justify-between gap-4"
              >
                <span className="text-sm text-ink">
                  {credential.friendlyName ?? "Unnamed passkey"}
                </span>
                <Button
                  variant="quiet"
                  disabled={busy}
                  onClick={() => void removePasskey(credential.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        {passkeySupported && (
          <Button busy={busy} onClick={() => void addPasskey()}>
            Add a passkey on this device
          </Button>
        )}
        {message && (
          <p role="status" className="text-sm text-ink-muted">
            {message}
          </p>
        )}
      </div>

      <Button variant="quiet" onClick={() => void signOutEverywhere()}>
        Sign out of every device
      </Button>
    </section>
  );
}
