import { useAuth } from "@seamless-auth/react-native";
import { Redirect, Stack } from "expo-router";
import React from "react";

export default function AppLayout() {
  const { loading, isAuthenticated } = useAuth();

  if (!loading && !isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
