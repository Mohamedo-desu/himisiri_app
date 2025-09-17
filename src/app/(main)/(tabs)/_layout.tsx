import CustomTabBar from "@/components/tabs/CustomTabBar";
import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React, { createContext } from "react";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { useSharedValue } from "react-native-reanimated";
import { useUnistyles } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";

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

const NAV_ITEMS: NavItem[] = [
  {
    name: "index",
    label: "Home",
    solid: IconsSolid.HomeIcon,
    outline: IconsOutline.HomeIcon,
    headerShown: false,
    headerTitle: "",
  },
];

// Context to provide scrollY to all tab screens
export const TabScrollYContext = createContext<any>(null);

export const unstable_settings = {
  anchor: "index",
};

const TabsLayout = () => {
  const { theme } = useUnistyles();
  const scrollY = useSharedValue(0);

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
      backgroundColor: theme.colors.primary,
    },
    tabBarActiveTintColor: theme.colors.onPrimary,
    tabBarInactiveTintColor: theme.colors.grey100,
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
                tabBarIcon: ({ focused, size, color }) =>
                  focused ? (
                    <SolidIcon size={size} color={color} />
                  ) : (
                    <OutlineIcon size={size} color={color} />
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
