import InitialLayout from "@/components/InitialLayout";
import useSetupForPushNotifications from "@/hooks/useSetupForPushNotifications";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import { handleExpoUpdateMetadata } from "@/utils/expoUpdateMetadata";
import * as Sentry from "@sentry/react-native";
import { isRunningInExpoGo } from "expo";
import * as Notifications from "expo-notifications";
import { useNavigationContainerRef } from "expo-router";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableFreeze } from "react-native-screens";
import { StyleSheet } from "react-native-unistyles";
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
  const navigationRef = useNavigationContainerRef();

  // Set up push notification registration (permissions, token, listeners, etc.)
  useSetupForPushNotifications();

  // Hook Sentry into navigation container
  useEffect(() => {
    if (navigationRef?.current) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  return (
    <ClerkAndConvexProvider>
      <GestureHandlerRootView style={styles.container}>
        <InitialLayout />
      </GestureHandlerRootView>
    </ClerkAndConvexProvider>
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
