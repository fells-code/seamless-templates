import { useAuth, useAuthClient } from "@seamless-auth/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";

import { isCompleteCode, normalizeCode } from "@/auth/identifier";
import { Body, Button, ErrorNote, Field, Screen, Title } from "@/ui";

/**
 * One screen for both flows. `flow=register` verifies the registration code,
 * which completes sign-up and issues the session; `flow=login` verifies a
 * sign-in code. Either way the session store is refreshed afterwards so the
 * layouts redirect into the app.
 */
export default function VerifyCode() {
  const router = useRouter();
  const { flow } = useLocalSearchParams<{ flow?: string }>();
  const { refreshSession } = useAuth();
  const client = useAuthClient();

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const registering = flow === "register";

  const verify = async () => {
    const normalized = normalizeCode(code);
    if (!isCompleteCode(normalized)) {
      setError("Enter the six-letter code from your email.");
      return;
    }

    setBusy(true);
    setError("");

    const { error } = registering
      ? await client.verifyEmailOtp(normalized)
      : await client.verifyLoginEmailOtp(normalized);

    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }

    await refreshSession();
    setBusy(false);

    if (registering) {
      router.replace("/(auth)/register-passkey");
    }
    // For a login the auth layout redirects once the session is in place.
  };

  const resend = async () => {
    setBusy(true);
    const { error } = registering
      ? await client.requestEmailOtp()
      : await client.requestLoginEmailOtp();
    setBusy(false);
    setError(error ? error.message : "");
  };

  return (
    <Screen>
      <Title>Check your email</Title>
      <Body>Enter the six-letter code we sent you.</Body>

      <Field
        label="Code"
        value={code}
        onChangeText={(value) => setCode(normalizeCode(value))}
        autoCapitalize="characters"
        autoCorrect={false}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="ABCDEF"
        returnKeyType="go"
        onSubmitEditing={verify}
      />

      <ErrorNote>{error}</ErrorNote>
      <Button title="Verify" onPress={verify} busy={busy} />
      <Button
        title="Send a new code"
        onPress={resend}
        disabled={busy}
        variant="secondary"
      />
    </Screen>
  );
}
