import { useAuth, useAuthClient } from "@seamless-auth/react-native";
import React, { useEffect, useRef, useState } from "react";

import { Body, Button, ErrorNote, Screen, Title } from "@/ui";

const POLL_MS = 5_000;
const POLL_FOR_MS = 10 * 60_000;

/**
 * The link can be opened on any device. This screen polls until the auth API
 * reports it was, then the session arrives and the layouts redirect. No deep
 * link handling is needed for that; a universal link into the app is an
 * optional shortcut on top.
 */
export default function MagicLinkSent() {
  const { refreshSession } = useAuth();
  const client = useAuthClient();
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let active = true;

    const poll = async () => {
      if (!active) return;
      if (Date.now() - startedAt.current > POLL_FOR_MS) {
        setError("That link has expired. Send a new one.");
        return;
      }

      const { data, error } = await client.checkMagicLink();
      if (!active) return;

      if (!error && data?.message === "Success") {
        await refreshSession();
        return;
      }

      setTimeout(poll, POLL_MS);
    };

    const handle = setTimeout(poll, POLL_MS);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [client, refreshSession]);

  const resend = async () => {
    const { error } = await client.requestMagicLink();
    if (error) {
      setError(error.message);
      return;
    }
    startedAt.current = Date.now();
    setResent(true);
    setError("");
  };

  return (
    <Screen>
      <Title>Check your email</Title>
      <Body>
        Open the sign-in link we sent you, on this phone or anywhere else. This
        screen will notice and sign you in.
      </Body>
      <ErrorNote>{error}</ErrorNote>
      <Button
        title={resent ? "Sent again" : "Send a new link"}
        onPress={resend}
        variant="secondary"
      />
    </Screen>
  );
}
