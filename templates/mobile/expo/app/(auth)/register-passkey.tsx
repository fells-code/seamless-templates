import {
  describeDevice,
  getWebAuthnErrorDetail,
  hasNonPasskeyLoginMethod,
  useAuth,
  useLoginMethods,
  usePasskeySupport,
} from "@seamless-auth/react-native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform } from "react-native";

import { Body, Button, ErrorNote, Screen, Title } from "@/ui";

/**
 * Offered once after sign-up. Enrolling takes the access session the OTP just
 * issued. Skipping is only offered when the instance leaves the user another
 * way to sign in, so nobody is stranded with no method at all.
 */
export default function RegisterPasskey() {
  const router = useRouter();
  const { registerPasskey } = useAuth();
  const { loginMethods } = useLoginMethods();
  const { passkeySupported, loading } = usePasskeySupport();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const done = () => router.replace("/(app)");

  const enrol = async () => {
    setBusy(true);
    setError("");

    const { error } = await registerPasskey(describeDevice(Platform));
    setBusy(false);

    if (error) {
      const detail = getWebAuthnErrorDetail(error);
      setError(
        detail?.name === "NotAllowedError"
          ? "The passkey prompt was dismissed. Try again or skip for now."
          : error.message,
      );
      return;
    }

    done();
  };

  if (!loading && !passkeySupported) {
    // Nothing to enrol on this device; into the app.
    done();
    return null;
  }

  return (
    <Screen>
      <Title>Add a passkey</Title>
      <Body>
        Sign in next time with Face ID, Touch ID, or your screen lock. Your
        passkey stays on this device.
      </Body>
      <ErrorNote>{error}</ErrorNote>
      <Button title="Add passkey" onPress={enrol} busy={busy || loading} />
      {hasNonPasskeyLoginMethod(loginMethods) && (
        <Button
          title="Not now"
          onPress={done}
          disabled={busy}
          variant="secondary"
        />
      )}
    </Screen>
  );
}
