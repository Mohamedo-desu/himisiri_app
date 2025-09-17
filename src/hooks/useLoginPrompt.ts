import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserStore } from "@/store/useUserStore";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";

interface UseLoginPromptReturn {
  showLoginPrompt: boolean;
  setShowLoginPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  dismissLoginPrompt: () => void;
  resetTimer: () => void;
  resetPromptState: () => void;
  handleAuthRequired: (action: () => void) => boolean;
  isAuthenticated: boolean;
  signInAsGuest: () => void;
}

export const useLoginPrompt = (
  delaySeconds: number = 10
): UseLoginPromptReturn => {
  const { userId, isLoaded } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const timerRef = useRef<number | null>(null);
  const reappearTimerRef = useRef<number | null>(null);
  const hasShownRef = useRef(false);
  const isGuestRef = useRef(false);
  const currentDelayRef = useRef(delaySeconds);
  const { setCurrentUser } = useUserStore();

  // Real-time query that automatically updates when server data changes
  const currentUser = useQuery(
    api.users.getUserByClerkId,
    userId ? { clerkId: userId as Id<"users"> } : "skip"
  );

  // Update user store whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setCurrentUser(currentUser);
    }
  }, [currentUser, setCurrentUser]);

  // Handle authenticated actions
  const handleAuthRequired = (action: () => void) => {
    if (!userId || !currentUser) {
      setShowLoginPrompt(true);
      return false;
    }
    action();
    return true;
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (!userId && isLoaded && !hasShownRef.current && !isGuestRef.current) {
        setShowLoginPrompt(true);
        hasShownRef.current = true;
      }
    }, currentDelayRef.current * 1000);
  };

  const signInAsGuest = () => {
    isGuestRef.current = true;
    setShowLoginPrompt(false);
    // Clear any existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (reappearTimerRef.current) {
      clearTimeout(reappearTimerRef.current);
    }
  };

  const dismissLoginPrompt = () => {
    // Only allow dismissal if user is authenticated
    if (userId) {
      setShowLoginPrompt(false);
    } else {
      // For non-authenticated users, hide the prompt temporarily and show it again after double the delay
      setShowLoginPrompt(false);

      // Add 15 seconds to the previous delay
      currentDelayRef.current = currentDelayRef.current + 15;

      // Clear any existing reappear timer
      if (reappearTimerRef.current) {
        clearTimeout(reappearTimerRef.current);
      }

      // Set new reappear timer with increased delay
      reappearTimerRef.current = setTimeout(() => {
        if (!userId && isLoaded && !isGuestRef.current) {
          setShowLoginPrompt(true);
        }
      }, currentDelayRef.current * 1000);
    }
  };

  const resetPromptState = () => {
    // Reset all state to initial values
    hasShownRef.current = false;
    isGuestRef.current = false;
    currentDelayRef.current = delaySeconds;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (reappearTimerRef.current) {
      clearTimeout(reappearTimerRef.current);
    }
    setShowLoginPrompt(false);
    startTimer();
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (reappearTimerRef.current) {
      clearTimeout(reappearTimerRef.current);
    }
    hasShownRef.current = false;
    setShowLoginPrompt(false);
    startTimer();
  };

  useEffect(() => {
    // Only start timer if user is not authenticated and auth is loaded
    if (!userId && isLoaded && !hasShownRef.current) {
      startTimer();
    }

    // Clear timer if user becomes authenticated
    if (userId) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (reappearTimerRef.current) {
        clearTimeout(reappearTimerRef.current);
      }
      setShowLoginPrompt(false);
      hasShownRef.current = false;
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (reappearTimerRef.current) {
        clearTimeout(reappearTimerRef.current);
      }
    };
  }, [userId, isLoaded, delaySeconds]);

  return {
    showLoginPrompt,
    setShowLoginPrompt,
    dismissLoginPrompt,
    resetTimer,
    signInAsGuest,
    resetPromptState,
    handleAuthRequired,
    isAuthenticated: !!userId && !!currentUser,
  };
};
