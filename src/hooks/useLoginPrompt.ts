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

  // Convex user lookup (based on Clerk ID)
  const currentUser = useQuery(
    api.users.getUserByClerkId,
    userId ? { clerkId: userId as Id<"users"> } : "skip"
  );

  // Keep global store in sync
  useEffect(() => {
    if (currentUser) {
      setCurrentUser(currentUser);
    }
  }, [currentUser, setCurrentUser]);

  const isAuthenticated = !!userId && !!currentUser;

  const handleAuthRequired = (action: () => void) => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return false;
    }
    action();
    return true;
  };

  const startTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (
        !isAuthenticated &&
        isLoaded &&
        !hasShownRef.current &&
        !isGuestRef.current
      ) {
        setShowLoginPrompt(true);
        hasShownRef.current = true;
      }
    }, currentDelayRef.current * 1000);
  };

  const signInAsGuest = () => {
    isGuestRef.current = true;
    setShowLoginPrompt(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (reappearTimerRef.current) clearTimeout(reappearTimerRef.current);
  };

  const dismissLoginPrompt = () => {
    if (isAuthenticated) {
      setShowLoginPrompt(false);
    } else {
      setShowLoginPrompt(false);
      currentDelayRef.current = currentDelayRef.current + 15;

      if (reappearTimerRef.current) clearTimeout(reappearTimerRef.current);

      reappearTimerRef.current = setTimeout(() => {
        if (!isAuthenticated && isLoaded && !isGuestRef.current) {
          setShowLoginPrompt(true);
        }
      }, currentDelayRef.current * 1000);
    }
  };

  const resetPromptState = () => {
    hasShownRef.current = false;
    isGuestRef.current = false;
    currentDelayRef.current = delaySeconds;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (reappearTimerRef.current) clearTimeout(reappearTimerRef.current);
    setShowLoginPrompt(false);
    startTimer();
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (reappearTimerRef.current) clearTimeout(reappearTimerRef.current);
    hasShownRef.current = false;
    setShowLoginPrompt(false);
    startTimer();
  };

  useEffect(() => {
    if (!isAuthenticated && isLoaded && !hasShownRef.current) {
      startTimer();
    }

    if (isAuthenticated) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (reappearTimerRef.current) clearTimeout(reappearTimerRef.current);
      setShowLoginPrompt(false);
      hasShownRef.current = false;
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (reappearTimerRef.current) clearTimeout(reappearTimerRef.current);
    };
  }, [isAuthenticated, isLoaded, delaySeconds]);

  return {
    showLoginPrompt,
    setShowLoginPrompt,
    dismissLoginPrompt,
    resetTimer,
    signInAsGuest,
    resetPromptState,
    handleAuthRequired,
    isAuthenticated,
  };
};
