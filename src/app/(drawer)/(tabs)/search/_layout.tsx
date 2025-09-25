import { Stack } from "expo-router";
import React from "react";

const SearchLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[tag]" />
    </Stack>
  );
};

export default SearchLayout;
