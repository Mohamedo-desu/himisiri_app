import LoginPrompt from "@/components/LoginPrompt";
import { useLoginPrompt } from "@/hooks/useLoginPrompt";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { DeviceEventEmitter } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const RootLayout = () => {
  const { theme } = useUnistyles();
  const {
    showLoginPrompt,
    setShowLoginPrompt,
    dismissLoginPrompt,
    signInAsGuest,
    resetPromptState,
  } = useLoginPrompt(10);

  // Listen for events to control login prompt
  // Memoize event handlers to keep them stable between renders
  const handleResetPrompt = React.useCallback(() => {
    resetPromptState();
  }, [resetPromptState]);

  const handleShowPrompt = React.useCallback(() => {
    setShowLoginPrompt(true);
  }, [setShowLoginPrompt]);

  useEffect(() => {
    const resetSubscription = DeviceEventEmitter.addListener(
      "resetLoginPrompt",
      handleResetPrompt
    );

    const showSubscription = DeviceEventEmitter.addListener(
      "showLoginPrompt",
      handleShowPrompt
    );

    return () => {
      resetSubscription.remove();
      showSubscription.remove();
    };
  }, [handleResetPrompt, handleShowPrompt]);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="filters-screen"
          options={{
            headerShown: false,
            presentation: "transparentModal",
            animation: "fade",
          }}
        />

        <Stack.Screen
          name="listings"
          options={{
            headerStyle: {
              backgroundColor: PRIMARY_COLOR,
            },
            headerTintColor: theme.colors.onPrimary,
            headerTitle: "Your Listings",
          }}
        />
        <Stack.Screen
          name="properties"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="manage-profile"
          options={{
            headerStyle: {
              backgroundColor: PRIMARY_COLOR,
            },
            headerTintColor: theme.colors.onPrimary,
            headerTitle: "Manage Personal Details",
          }}
        />
        <Stack.Screen
          name="manage-theme"
          options={{
            headerStyle: {
              backgroundColor: PRIMARY_COLOR,
            },
            headerTintColor: theme.colors.onPrimary,
            headerTitle: "Manage Theme",
          }}
        />
        <Stack.Screen
          name="manage-notifications"
          options={{
            headerStyle: {
              backgroundColor: PRIMARY_COLOR,
            },
            headerTintColor: theme.colors.onPrimary,
            headerTitle: "Manage Notifications",
          }}
        />
        <Stack.Screen
          name="manage-currencies"
          options={{
            headerStyle: {
              backgroundColor: PRIMARY_COLOR,
            },
            headerTintColor: theme.colors.onPrimary,
            headerTitle: "Manage Currencies",
          }}
        />
        <Stack.Screen
          name="contact-support"
          options={{
            headerStyle: {
              backgroundColor: PRIMARY_COLOR,
            },
            headerTintColor: theme.colors.onPrimary,
            headerTitle: "Contact Support",
          }}
        />
        <Stack.Screen
          name="faq"
          options={{
            headerStyle: {
              backgroundColor: PRIMARY_COLOR,
            },
            headerTintColor: theme.colors.onPrimary,
            headerTitle: "Frequently Asked Questions",
          }}
        />
      </Stack>

      {/* Login Prompt Modal */}
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={dismissLoginPrompt}
        onGuestSignIn={signInAsGuest}
      />
    </>
  );
};

export default RootLayout;
