import { useAuthClient } from "@seamless-auth/react-native";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";

import { isEmailLike } from "@/auth/identifier";
import { Body, Button, ErrorNote, Field, Screen, Title } from "@/ui";

/**
 * Registration starts with an address and a code sent to it. Verifying the
 * code creates the account and signs the user in; a passkey is offered next.
 */
export default function SignUp() {
  const router = useRouter();
  const client = useAuthClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const register = async () => {
    if (!isEmailLike(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setBusy(true);
    setError("");

    const registered = await client.register({ email: email.trim() });
    if (registered.error) {
      setBusy(false);
      setError(registered.error.message);
      return;
    }

    const sent = await client.requestEmailOtp();
    setBusy(false);
    if (sent.error) {
      setError(sent.error.message);
      return;
    }

    router.push({
      pathname: "/(auth)/verify-code",
      params: { flow: "register" },
    });
  };

  return (
    <Screen>
      <Title>Create your account</Title>
      <Body>We will email you a six-letter code to confirm the address.</Body>

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        placeholder="you@example.com"
        returnKeyType="go"
        onSubmitEditing={register}
      />

      <ErrorNote>{error}</ErrorNote>
      <Button title="Send code" onPress={register} busy={busy} />

      <Link href="/(auth)/sign-in">
        <Body>Already have an account? Sign in</Body>
      </Link>
    </Screen>
  );
}
