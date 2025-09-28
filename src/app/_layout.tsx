import InitialLayout from "@/components/InitialLayout";
import ClerkAndConvexProvider from "@/providers/ClerkAndConvexProvider";
import { LogBox } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableFreeze } from "react-native-screens";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

LogBox.ignoreLogs(["Clerk: Clerk has been loaded with development keys."]);

enableFreeze(true);

// const navigationIntegration = Sentry.reactNavigationIntegration({
//   enableTimeToInitialDisplay: !isRunningInExpoGo(),
// });

// Initialize Sentry
//Sentry.init(sentryConfig);

// Handle OTA update metadata (for tracking builds/updates)
//handleExpoUpdateMetadata();

// Configure foreground notification handler
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

function RootLayout() {
  // const { top } = useSafeAreaInsets();

  //const navigationRef = useNavigationContainerRef();

  // Set up push notification registration (permissions, token, listeners, etc.)
  //useSetupForPushNotifications();

  // Set up notification observer for handling notification taps
  //useNotificationObserver();

  // Set up deep link handling
  // useEffect(() => {
  //   const cleanup = setupDeepLinking();
  //   return cleanup;
  // }, []);

  const { theme } = useUnistyles();

  // Hook Sentry into navigation container
  // useEffect(() => {
  //   if (navigationRef?.current) {
  //     navigationIntegration.registerNavigationContainer(navigationRef);
  //   }
  // }, [navigationRef]);

  return (
    <>
      <ClerkAndConvexProvider>
        {/* <UserPresenceProvider> */}
        <GestureHandlerRootView style={styles.container}>
          <InitialLayout />
        </GestureHandlerRootView>
        {/* </UserPresenceProvider> */}
      </ClerkAndConvexProvider>
      <SystemBars
        style={theme.colors.background === "#121212" ? "light" : "dark"}
      />
      {/* <Toast
        config={ToastConfig}
        position="top"
        topOffset={top + 10}
        avoidKeyboard={true}
      /> */}
    </>
  );
}

export default RootLayout;

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
