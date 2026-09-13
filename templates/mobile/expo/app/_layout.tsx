import { AuthProvider } from "@seamless-auth/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

import { authPorts } from "@/auth/ports";
import { API_URL, MISSING_API_URL_MESSAGE } from "@/lib/config";
import { Body, Screen, Title } from "@/ui";

export default function RootLayout() {
  if (!API_URL) {
    return (
      <Screen>
        <Title>Configuration needed</Title>
        <Body>{MISSING_API_URL_MESSAGE}</Body>
      </Screen>
    );
  }

  return (
    <AuthProvider apiHost={API_URL} ports={authPorts}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
