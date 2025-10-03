import { useUserPresence } from "@/hooks/useUserPresence";
import React, { createContext, useContext } from "react";

interface UserPresenceContextType {
  isOnline: boolean;
}

const UserPresenceContext = createContext<UserPresenceContextType | null>(null);

interface UserPresenceProviderProps {
  children: React.ReactNode;
}

export const UserPresenceProvider: React.FC<UserPresenceProviderProps> = ({
  children,
}) => {
  const presenceHook = useUserPresence();

  // Safely destructure with fallbacks
  const { isOnline = false } = presenceHook || {};

  const contextValue: UserPresenceContextType = {
    isOnline: !!isOnline,
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
