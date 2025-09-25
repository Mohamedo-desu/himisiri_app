import { Ionicons } from "@expo/vector-icons";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const CustomDrawerContent = (props: any) => {
  const { theme } = useUnistyles();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        flex: 1,
        backgroundColor: theme.colors.surface,
      }}
    >
      {/* Header / Branding */}
      <View style={styles.header}>
        <Ionicons
          name="home"
          size={36}
          color={theme.colors.secondary}
          style={{ marginBottom: 8 }}
        />
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          RentiZa
        </Text>
        <Text style={[styles.tagline, { color: theme.colors.grey500 }]}>
          Luxury Living
        </Text>
      </View>
    </DrawerContentScrollView>
  );
};

export default CustomDrawerContent;

const styles = StyleSheet.create((theme) => ({
  header: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  tagline: {
    fontSize: 13,
    marginTop: 2,
  },
}));
