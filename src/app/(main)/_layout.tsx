import LoginPrompt from "@/components/auth/LoginPrompt";
import { useLoginPrompt } from "@/hooks/useLoginPrompt";
import { Stack } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { DeviceEventEmitter } from "react-native";
import { useUnistyles } from "react-native-unistyles";

export const unstable_settings = {
  anchor: "(tabs)",
};

const MainLayout = () => {
  const { theme } = useUnistyles();
  const {
    showLoginPrompt,
    setShowLoginPrompt,
    dismissLoginPrompt,
    signInAsGuest,
    resetPromptState,
  } = useLoginPrompt(10);

  const handleResetPrompt = useCallback(() => {
    resetPromptState();
  }, [resetPromptState]);

  const handleShowPrompt = useCallback(() => {
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

export default MainLayout;
