import {
  hasPermission,
  useAuth,
  useAuthorizedFetch,
} from "@seamless-auth/react-native";
import React, { useState } from "react";

import { Body, Button, ErrorNote, Screen, Title } from "@/ui";

/**
 * Signed in. Shows the session and calls routes on the companion API that
 * sit behind `requireAuth`, carrying the access token with one refresh on a
 * 401, which is what `useAuthorizedFetch` does. /reports also needs the
 * reports:read permission.
 */
export default function Home() {
  const { user, credentials, logout, hasScopedRole } = useAuth();
  const authorizedFetch = useAuthorizedFetch();
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  // The API guards /reports with reports:read and refuses anyone without it.
  // Checking here only decides whether to offer the button.
  const canReadReports = hasPermission(user, "reports:read");

  const callApi = async (path: string) => {
    setError("");
    try {
      const response = await authorizedFetch(path);
      if (!response.ok) {
        setError(`The API answered ${response.status}.`);
        return;
      }
      setResult(JSON.stringify(await response.json(), null, 2));
    } catch {
      setError("Could not reach the API.");
    }
  };

  return (
    <Screen>
      <Title>Signed in</Title>
      <Body>{user?.email}</Body>
      <Body>Roles: {user?.roles.join(", ") || "none"}</Body>
      <Body>Passkeys on this account: {credentials.length}</Body>
      {hasScopedRole("betaUser") && <Body>Beta access is on.</Body>}

      <Button
        title="Call the protected API"
        onPress={() => void callApi("/beta_users")}
        variant="secondary"
      />
      {canReadReports && (
        <Button
          title="Load reports"
          onPress={() => void callApi("/reports")}
          variant="secondary"
        />
      )}
      <ErrorNote>{error}</ErrorNote>
      {result ? <Body>{result}</Body> : null}

      <Button title="Sign out" onPress={() => void logout()} />
    </Screen>
  );
}
