import { Stack } from "expo-router";
import React from "react";
import { useUnistyles } from "react-native-unistyles";

const MainLayout = () => {
  const { theme } = useUnistyles();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post" />
      <Stack.Screen name="user" />
      <Stack.Screen
        name="create"
        options={{ headerShown: true, headerTitle: "Create Your Confession" }}
      />
    </Stack>
  );
};

export default MainLayout;
