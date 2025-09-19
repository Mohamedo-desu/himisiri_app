import LoginPrompt from "@/components/auth/LoginPrompt";
import { useLoginPrompt } from "@/hooks/useLoginPrompt";
import useSetupForPushNotifications from "@/hooks/useSetupForPushNotifications";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { DeviceEventEmitter } from "react-native";

const InitialLayout = () => {
  // Set up push notification registration (permissions, token, listeners, etc.)
  useSetupForPushNotifications();

  const {
    showLoginPrompt,
    setShowLoginPrompt,
    dismissLoginPrompt,
    signInAsGuest,
    resetPromptState,
  } = useLoginPrompt(10);

  // Listen for events to control login prompt
  const handleResetPrompt = () => {
    resetPromptState();
  };

  const handleShowPrompt = () => {
    setShowLoginPrompt(true);
  };

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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(main)" />
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

export default InitialLayout;
