import { Stack } from "expo-router";
import React from "react";
import { useUnistyles } from "react-native-unistyles";

const UserLayout = () => {
  const { theme } = useUnistyles();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen name="[userId]" options={{ headerShown: false }} />
    </Stack>
  );
};

export default UserLayout;
