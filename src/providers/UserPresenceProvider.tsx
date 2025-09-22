import { useUserPresence } from "@/hooks/useUserPresence";
import { useAuth } from "@clerk/clerk-expo";
import React, { createContext, useContext, useEffect } from "react";

interface UserPresenceContextType {
  isOnline: boolean;
  recordActivity: () => void;
}

const UserPresenceContext = createContext<UserPresenceContextType | null>(null);

interface UserPresenceProviderProps {
  children: React.ReactNode;
}

export const UserPresenceProvider: React.FC<UserPresenceProviderProps> = ({
  children,
}) => {
  const { isSignedIn } = useAuth();
  const presenceHook = useUserPresence();

  console.log(
    `🔍 UserPresenceProvider render - isSignedIn: ${isSignedIn}, presenceHook:`,
    presenceHook
  );

  // Safely destructure with fallbacks
  const { isOnline = false, recordActivity = () => {} } = presenceHook || {};

  // Auto-record activity on touch events
  useEffect(() => {
    try {
      if (isSignedIn && recordActivity) {
        recordActivity();
      }
    } catch (error) {
      console.error("Error recording activity:", error);
    }
  }, [isSignedIn, recordActivity]);

  const contextValue: UserPresenceContextType = {
    isOnline: !!isOnline,
    recordActivity,
  };

  return (
    <UserPresenceContext.Provider value={contextValue}>
      {children}
    </UserPresenceContext.Provider>
  );
};

export const useUserPresenceContext = (): UserPresenceContextType => {
  const context = useContext(UserPresenceContext);
  if (!context) {
    throw new Error(
      "useUserPresenceContext must be used within a UserPresenceProvider"
    );
  }
  return context;
};

export default UserPresenceProvider;
