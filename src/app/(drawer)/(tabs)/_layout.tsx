import CustomTabBar from "@/components/tabs/CustomTabBar";
import CustomText from "@/components/ui/CustomText";
import { api } from "@/convex/_generated/api";
import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { DrawerActions } from "@react-navigation/native";
import { APP_NAME } from "constants/device";
import { useQuery } from "convex/react";
import { Tabs, useNavigation } from "expo-router";
import React, { createContext } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { useSharedValue } from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
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

  const { t } = useTranslation();

  const navigation = useNavigation();

  const NAV_ITEMS: NavItem[] = [
    {
      name: "index",
      label: "Home",
      solid: IconsSolid.HomeIcon,
      outline: IconsOutline.HomeIcon,
      headerShown: true,
      headerTitle: APP_NAME,
    },
    {
      name: "search",
      label: "Search",
      solid: IconsSolid.MagnifyingGlassIcon,
      outline: IconsOutline.MagnifyingGlassIcon,
      headerShown: true,
      headerTitle: "Explore",
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
    headerTitleAlign: "center",
    tabBarActiveTintColor: theme.colors.onPrimary,
    tabBarInactiveTintColor: theme.colors.grey700,
  };
  const toggleDrawer = () => {
    navigation.dispatch(DrawerActions.toggleDrawer());
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
                ...(name === "index" && {
                  headerLeft: () => (
                    <TouchableOpacity
                      style={styles.headerLeftContainer}
                      activeOpacity={0.8}
                      onPress={toggleDrawer}
                    >
                      <IconsOutline.Bars3Icon color={"white"} size={22} />
                    </TouchableOpacity>
                  ),
                  headerRight: () => (
                    <TouchableOpacity
                      style={styles.headerRightContainer}
                      activeOpacity={0.8}
                      onPress={toggleDrawer}
                    >
                      <IconsOutline.PlusIcon color={"white"} size={22} />
                    </TouchableOpacity>
                  ),
                  headerTitle: (props) => {
                    const { tintColor, allowFontScaling, style } = props;
                    return (
                      <View>
                        <CustomText
                          variant="subtitle2"
                          bold
                          textAlign="center"
                          color={tintColor}
                          allowFontScaling={allowFontScaling}
                          style={style as any}
                        >
                          {t("common.appName")}
                        </CustomText>

                        <CustomText
                          variant="small"
                          italic
                          textAlign="center"
                          color={tintColor}
                          allowFontScaling={allowFontScaling}
                        >
                          {t("common.tagLine")}
                        </CustomText>
                      </View>
                    );
                  },
                }),

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

const styles = StyleSheet.create((theme) => ({
  headerLeftContainer: {
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerRightContainer: { marginRight: 12 },
}));
