import LoginPrompt from "@/components/auth/LoginPrompt";
import { useLoginPrompt } from "@/hooks/useLoginPrompt";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { DeviceEventEmitter } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";
import { useUnistyles } from "react-native-unistyles";

const InitialLayout = () => {
  const { theme } = useUnistyles();

  const {
    showLoginPrompt,
    setShowLoginPrompt,
    dismissLoginPrompt,
    signInAsGuest,
    resetPromptState,
  } = useLoginPrompt(0);

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
      <SystemBars
        style={theme.colors.background === "#121212" ? "light" : "dark"}
      />
    </>
  );
};

export default InitialLayout;
