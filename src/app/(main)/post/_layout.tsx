import { Stack, router } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import * as IconsSolid from "react-native-heroicons/solid";

const PostLayout = () => {
  const { theme } = useUnistyles();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: "",
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerLeftContainer}
              activeOpacity={0.8}
              onPress={() => router.back()}
            >
              <IconsSolid.ArrowLeftIcon color={"white"} size={22} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
};

export default PostLayout;

const styles = StyleSheet.create((theme) => ({
  headerLeftContainer: {
    marginLeft: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  headerRightContainer: { marginRight: 12 },
}));
