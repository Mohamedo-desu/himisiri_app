import { Stack } from "expo-router";
import React from "react";
import { useUnistyles } from "react-native-unistyles";

const PostLayout = () => {
  const { theme } = useUnistyles();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Stack.Screen name="[id]" options={{ headerTitle: "Post Details" }} />
    </Stack>
  );
};

export default PostLayout;
