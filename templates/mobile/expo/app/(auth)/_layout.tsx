import { useAuth } from "@seamless-auth/react-native";
import { Redirect, Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  const { loading, isAuthenticated } = useAuth();

  if (!loading && isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
