import CustomTabBar from "@/components/tabs/CustomTabBar";
import { api } from "@/convex/_generated/api";
import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { useQuery } from "convex/react";
import { Tabs } from "expo-router";
import React, { createContext } from "react";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { useSharedValue } from "react-native-reanimated";
import { useUnistyles } from "react-native-unistyles";
import { BADGE_COLOR, PRIMARY_COLOR } from "unistyles";

// Define NavItem type for auto-suggestions
interface NavItem {
  name: string;
  label: string;
  headerTitle: string;
  solid: any;
  outline: any;
  badge?: number;
  headerShown: boolean;
}

// Context to provide scrollY to all tab screens
export const TabScrollYContext = createContext<any>(null);

export const unstable_settings = {
  anchor: "index",
};

const TabsLayout = () => {
  const { theme } = useUnistyles();
  const scrollY = useSharedValue(0);

  // Get notification count for badge
  const notificationCount = useQuery(api.notifications.getUnreadCount);

  const NAV_ITEMS: NavItem[] = [
    {
      name: "index",
      label: "Home",
      solid: IconsSolid.HomeIcon,
      outline: IconsOutline.HomeIcon,
      headerShown: false,
      headerTitle: "Home",
    },
    {
      name: "explore",
      label: "Explore",
      solid: IconsSolid.Squares2X2Icon,
      outline: IconsOutline.MagnifyingGlassIcon,
      headerShown: true,
      headerTitle: "Explore",
    },
    {
      name: "create",
      label: "Post",
      solid: IconsSolid.PlusCircleIcon,
      outline: IconsOutline.PlusCircleIcon,
      headerShown: true,
      headerTitle: "Create Post",
    },
    {
      name: "notifications",
      label: "Notifications",
      solid: IconsSolid.BellIcon,
      outline: IconsOutline.BellIcon,
      headerShown: true,
      headerTitle: "Notifications",
      badge: notificationCount || undefined,
    },
    {
      name: "profile",
      label: "Profile",
      solid: IconsSolid.UserIcon,
      outline: IconsOutline.UserIcon,
      headerShown: true,
      headerTitle: "Profile",
    },
  ];

  const commonScreenOptions: BottomTabNavigationOptions = {
    headerShown: true,
    tabBarStyle: {
      backgroundColor: theme.colors.primary,
      elevation: 3,
    },
    headerStyle: {
      backgroundColor: PRIMARY_COLOR,
    },
    headerTintColor: theme.colors.onBackground,
    tabBarBadgeStyle: {
      backgroundColor: BADGE_COLOR,
    },
    tabBarActiveTintColor: theme.colors.onPrimary,
    tabBarInactiveTintColor: theme.colors.grey700,
  };

  return (
    <TabScrollYContext.Provider value={scrollY}>
      <Tabs
        screenOptions={commonScreenOptions}
        tabBar={(props) => <CustomTabBar {...props} scrollY={scrollY} />}
      >
        {NAV_ITEMS.map(
          ({
            name,
            label,
            headerShown,
            headerTitle,
            solid: SolidIcon,
            outline: OutlineIcon,
            badge,
          }) => (
            <Tabs.Screen
              key={name}
              name={name}
              options={{
                tabBarLabel: label,
                headerShown: headerShown,
                headerTitle: headerTitle,
                tabBarIcon: ({ size, color }) => (
                  <SolidIcon size={size} color={color} />
                ),
                ...(badge !== undefined && { tabBarBadge: badge }),
              }}
            />
          )
        )}
      </Tabs>
    </TabScrollYContext.Provider>
  );
};

export default TabsLayout;
