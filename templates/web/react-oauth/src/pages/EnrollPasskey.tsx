import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  isUnauthenticated,
  useAuth,
  useAuthClient,
  usePasskeySupport,
} from "@seamless-auth/react";
import { AuthFrame, PrimaryButton } from "../components/kit";

// The auth server sends a user here (through `nextStep: 'enroll_passkey'` on the
// OAuth callback) when the provider they signed in with is one the organization
// is moving off and they have no passkey yet. The session already exists, so a
// passkey is an addition to it, and leaving without one is allowed. The server
// asks again on every sign-in until they have one.
export default function EnrollPasskey() {
  const { refreshSession } = useAuth();
  const authClient = useAuthClient();
  const { passkeySupported, loading } = usePasskeySupport();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const finish = async () => {
    await refreshSession();
    navigate("/", { replace: true });
  };

  const enroll = async () => {
    setBusy(true);
    setError("");

    const device = navigator.userAgent;
    const { error } = await authClient.registerPasskey({
      metadata: {
        friendlyName: "Passkey added after sign-in",
        platform: navigator.platform || "unknown",
        browser: device,
        deviceInfo: device,
      },
    });

    if (error) {
      setBusy(false);
      setError(
        isUnauthenticated(error)
          ? "Your session expired before the passkey was saved. Sign in again to add one."
          : "The passkey was not saved. Try again, or continue without one for now.",
      );
      return;
    }

    await finish();
  };

  return (
    <AuthFrame
      title="Move to passkeys"
      pitch="Your organization is moving sign-in to passkeys. Add one now so you can keep signing in once the old provider is switched off."
      points={[
        "Signs you in with your device's screen lock or a security key",
        "Nothing to remember and nothing to phish",
        "Takes a few seconds",
      ]}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="title text-ink">Secure your account</h2>
          <p className="text-sm text-ink-muted">
            {loading
              ? "Checking this device..."
              : passkeySupported
                ? "Create a passkey on this device to use for future sign-ins."
                : "This browser cannot create passkeys. Try again on a device that supports them."}
          </p>
        </div>

        <div className="space-y-3">
          <PrimaryButton
            full
            busy={busy}
            disabled={loading || !passkeySupported}
            onClick={() => void enroll()}
          >
            Add a passkey
          </PrimaryButton>
          <PrimaryButton
            variant="quiet"
            full
            disabled={busy}
            onClick={() => void finish()}
          >
            Not now
          </PrimaryButton>
        </div>

        {/* No danger role in the palette on purpose; see Login. */}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </AuthFrame>
  );
}
