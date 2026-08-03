import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="quiz" />
      <Stack.Screen name="results" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <ErrorBoundary>
        <RootLayoutNav />
      </ErrorBoundary>
    </View>
  );
}
