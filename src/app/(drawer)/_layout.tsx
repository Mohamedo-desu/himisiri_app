import CustomDrawerContent from "@/components/drawer/CustomDrawerContent";
import { Drawer } from "expo-router/drawer";
import React from "react";
import { useUnistyles } from "react-native-unistyles";

const DrawerLayout = () => {
  const { theme } = useUnistyles();

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "slide",
        drawerStatusBarAnimation: "slide",
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onBackground,
        drawerLabelStyle: {
          fontSize: 15,
          fontWeight: "600",
        },
        drawerActiveTintColor: theme.colors.secondary,
        drawerInactiveTintColor: theme.colors.grey500,
        drawerActiveBackgroundColor: theme.colors.backgroundOverlay,
      }}
    >
      <Drawer.Screen name="(tabs)" options={{ headerShown: false }} />
      <Drawer.Screen
        name="post"
        options={{
          headerShown: false,
        }}
      />
    </Drawer>
  );
};

export default DrawerLayout;
