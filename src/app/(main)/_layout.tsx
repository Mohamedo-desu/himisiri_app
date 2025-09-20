import { Stack } from "expo-router";
import React from "react";
import { useUnistyles } from "react-native-unistyles";

export const unstable_settings = {
  anchor: "(tabs)",
};

const MainLayout = () => {
  const { theme } = useUnistyles();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="post" options={{ headerShown: false }} />
      <Stack.Screen name="user" options={{ headerShown: false }} />
      <Stack.Screen name="my-posts" options={{ headerShown: false }} />
      <Stack.Screen name="liked-posts" options={{ headerShown: false }} />
    </Stack>
  );
};

export default MainLayout;
