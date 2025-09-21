import InitialLayout from "@/components/InitialLayout";
import ToastConfig from "@/config/toast/ToastConfig";
import useSetupForPushNotifications from "@/hooks/useSetupForPushNotifications";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import UserPresenceProvider from "@/providers/UserPresenceProvider";
import { handleExpoUpdateMetadata } from "@/utils/expoUpdateMetadata";
import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";
import * as Notifications from "expo-notifications";
import { useNavigationContainerRef } from "expo-router";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { enableFreeze } from "react-native-screens";
import Toast from "react-native-toast-message";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { sentryConfig } from "sentry.config";

LogBox.ignoreLogs(["Clerk: Clerk has been loaded with development keys."]);

enableFreeze(true);

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

// Initialize Sentry
Sentry.init(sentryConfig);

// Handle OTA update metadata (for tracking builds/updates)
handleExpoUpdateMetadata();

export const unstable_settings = {
  anchor: "(main)",
};

// Configure foreground notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootLayout() {
  const { top } = useSafeAreaInsets();

  const navigationRef = useNavigationContainerRef();

  // Set up push notification registration (permissions, token, listeners, etc.)
  useSetupForPushNotifications();

  const { theme } = useUnistyles();

  // Hook Sentry into navigation container
  useEffect(() => {
    if (navigationRef?.current) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  return (
    <>
      <ClerkAndConvexProvider>
        <UserPresenceProvider>
          <GestureHandlerRootView style={styles.container}>
            <InitialLayout />
          </GestureHandlerRootView>
        </UserPresenceProvider>
      </ClerkAndConvexProvider>
      <SystemBars
        style={theme.colors.background === "#121212" ? "light" : "dark"}
      />
      <Toast
        config={ToastConfig}
        position="top"
        topOffset={top}
        avoidKeyboard={true}
      />
    </>
  );
}

export default Sentry.wrap(RootLayout);

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
}));
