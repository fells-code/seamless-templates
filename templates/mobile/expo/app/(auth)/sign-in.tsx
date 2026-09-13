import {
  useAuth,
  useAuthClient,
  useLoginMethods,
  usePasskeySupport,
} from "@seamless-auth/react-native";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";

import { isEmailLike } from "@/auth/identifier";
import { Body, Button, ErrorNote, Field, Screen, Title } from "@/ui";

/**
 * Identifier first. `/login` answers with the methods this account may use;
 * a passkey is tried straight away when the device has one, and the fallbacks
 * (a code by email, or a magic link) are offered when it does not or the user
 * declines the prompt.
 */
export default function SignIn() {
  const router = useRouter();
  const { login, handlePasskeyLogin } = useAuth();
  const client = useAuthClient();
  const { loginMethods } = useLoginMethods();
  const { passkeySupported } = usePasskeySupport();

  const [identifier, setIdentifier] = useState("");
  const [methods, setMethods] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const allows = (method: string) =>
    (methods ?? loginMethods ?? []).includes(method as never);

  const start = async () => {
    if (!isEmailLike(identifier)) {
      setError("Enter the email address you signed up with.");
      return;
    }

    setBusy(true);
    setError("");

    const { data, error } = await login(identifier.trim(), passkeySupported);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }

    const allowed = data.loginMethods ?? [];
    setMethods(allowed);

    if (passkeySupported && allowed.includes("passkey")) {
      const passkey = await handlePasskeyLogin();
      if (!passkey.error) return;
      // Dismissed or no usable passkey here: fall through to the other methods.
    }

    setBusy(false);
  };

  const sendCode = async () => {
    setBusy(true);
    const { error } = await client.requestLoginEmailOtp();
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push({ pathname: "/(auth)/verify-code", params: { flow: "login" } });
  };

  const sendMagicLink = async () => {
    setBusy(true);
    const { error } = await client.requestMagicLink();
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/(auth)/magic-link-sent");
  };

  return (
    <Screen>
      <Title>Sign in</Title>
      <Body>
        Passwordless, with a passkey or a one-time code sent to your email.
      </Body>

      <Field
        label="Email"
        value={identifier}
        onChangeText={(value) => {
          setIdentifier(value);
          setMethods(null);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="username"
        autoComplete="email"
        placeholder="you@example.com"
        returnKeyType="go"
        onSubmitEditing={start}
      />

      <ErrorNote>{error}</ErrorNote>

      {methods === null ? (
        <Button title="Continue" onPress={start} busy={busy} />
      ) : (
        <>
          {passkeySupported && allows("passkey") && (
            <Button
              title="Use a passkey"
              onPress={() => void handlePasskeyLogin()}
              busy={busy}
            />
          )}
          {allows("email_otp") && (
            <Button
              title="Email me a code"
              onPress={sendCode}
              busy={busy}
              variant="secondary"
            />
          )}
          {allows("magic_link") && (
            <Button
              title="Email me a sign-in link"
              onPress={sendMagicLink}
              busy={busy}
              variant="secondary"
            />
          )}
        </>
      )}

      <Link href="/(auth)/sign-up">
        <Body>New here? Create an account</Body>
      </Link>
    </Screen>
  );
}
