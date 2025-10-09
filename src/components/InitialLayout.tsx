import { useLoginPrompt } from "@/hooks/useLoginPrompt";
import useSetupForPushNotifications from "@/hooks/useSetupForPushNotifications";
import { useVersion } from "@/hooks/useVersion";
import { Slot } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { DeviceEventEmitter } from "react-native";
import LoginPrompt from "./auth/LoginPrompt";

const InitialLayout = () => {
  useSetupForPushNotifications();
  useVersion();
  const {
    showLoginPrompt,
    setShowLoginPrompt,
    dismissLoginPrompt,
    signInAsGuest,
    resetPromptState,
  } = useLoginPrompt(10);

  // Listen for events to control login prompt
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
      <Slot />
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={dismissLoginPrompt}
        onGuestSignIn={signInAsGuest}
      />
    </>
  );
};

export default InitialLayout;
