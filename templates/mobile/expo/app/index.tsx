import { useAuth } from "@seamless-auth/react-native";
import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator } from "react-native";

import { Screen } from "@/ui";

// The session is restored from the keystore on launch; nothing is shown until
// it has settled, so a signed-in user never sees the sign-in screen flash.
export default function Index() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  return <Redirect href={isAuthenticated ? "/(app)" : "/(auth)/sign-in"} />;
}
