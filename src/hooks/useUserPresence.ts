import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

/**
 * Simplified hook to manage user online presence using only user fields
 */
export const useUserPresence = () => {
  const { isSignedIn } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );
  const previousAuthState = useRef<boolean>(false);
  const previousAppState = useRef<AppStateStatus>(AppState.currentState);

  // Simplified mutations - only update user fields
  const updateUserStatus = useMutation(api.userPresence.updateUserStatus);
  const recordActivity = useMutation(api.userPresence.recordActivity);

  /**
   * Update user online status
   */
  const updateStatus = useCallback(
    async (status: "online" | "offline") => {
      console.log(
        `🔄 updateStatus called: ${status}, isSignedIn: ${isSignedIn}`
      );

      if (!isSignedIn) {
        console.log(`❌ Not signed in, skipping status update`);
        return;
      }

      try {
        const result = await updateUserStatus({ status });
        console.log(`✅ Status updated:`, result);

        setIsOnline(result?.isOnline || false);
      } catch (error) {
        console.error("❌ Failed to update user status:", error);
      }
    },
    [isSignedIn, updateUserStatus]
  );

  /**
   * Handle app state changes
   */
  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      console.log(
        `📱 App state: ${previousAppState.current} → ${nextAppState}`
      );
      setAppState(nextAppState);

      if (!isSignedIn) {
        console.log(`❌ Not signed in, skipping app state change`);
        return;
      }

      // App coming to foreground
      if (previousAppState.current !== "active" && nextAppState === "active") {
        console.log(`🟢 App active - going online`);
        await updateStatus("online");
      }
      // App going to background or inactive
      else if (
        previousAppState.current === "active" &&
        (nextAppState === "background" || nextAppState === "inactive")
      ) {
        console.log(`🟡 App backgrounded - going offline`);
        await updateStatus("offline");
      }

      previousAppState.current = nextAppState;
    },
    [isSignedIn, updateStatus]
  );

  /**
   * Handle authentication state changes
   */
  useEffect(() => {
    const handleAuthChange = async () => {
      const currentlySignedIn = !!isSignedIn;
      console.log(
        `🔐 Auth change: ${previousAuthState.current} → ${currentlySignedIn}, appState: ${appState}`
      );

      // User just logged in
      if (
        !previousAuthState.current &&
        currentlySignedIn &&
        appState === "active"
      ) {
        console.log(`🟢 User logged in - going online`);
        await updateStatus("online");
      }
      // User just logged out
      else if (previousAuthState.current && !currentlySignedIn) {
        console.log(`🔴 User logged out - going offline`);
        await updateStatus("offline");
        setIsOnline(false);
      }

      previousAuthState.current = currentlySignedIn;
    };

    handleAuthChange();
  }, [isSignedIn, appState, updateStatus]);

  /**
   * Handle app state changes
   */
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [handleAppStateChange]);

  /**
   * Initialize status on mount
   */
  useEffect(() => {
    console.log(
      `🚀 Initialize: isSignedIn: ${isSignedIn}, appState: ${appState}`
    );
    if (isSignedIn && appState === "active") {
      console.log(`🟢 Initial setup - going online`);
      updateStatus("online");
    }
  }, [isSignedIn, appState, updateStatus]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (isSignedIn) {
        console.log(`🔴 Component unmounting - going offline`);
        updateUserStatus({ status: "offline" }).catch(console.error);
      }
    };
  }, [isSignedIn, updateUserStatus]);

  /**
   * Record user activity (for heartbeat)
   */
  const recordUserActivity = useCallback(async () => {
    if (isSignedIn && appState === "active") {
      try {
        await recordActivity();
      } catch (error) {
        console.error("Failed to record activity:", error);
      }
    }
  }, [isSignedIn, appState, recordActivity]);

  return {
    isOnline: !!(isOnline && isSignedIn),
    appState,
    recordActivity: recordUserActivity,
  };
};

/**
 * Hook to get online status of a specific user
 */
export const useUserOnlineStatus = (userId: Id<"users"> | null | undefined) => {
  const onlineStatus = useQuery(
    api.userPresence.getUserOnlineStatus,
    userId ? { userId } : "skip"
  );

  return {
    isOnline: onlineStatus?.isOnline || false,
    lastSeenAt: onlineStatus?.lastSeenAt,
    lastActiveAt: onlineStatus?.lastActiveAt,
    isLoading: onlineStatus === undefined,
  };
};

/**
 * Hook to get online status of multiple users
 */
export const useMultipleUsersOnlineStatus = (userIds: Id<"users">[]) => {
  const onlineStatuses = useQuery(
    api.userPresence.getMultipleUsersOnlineStatus,
    userIds.length > 0 ? { userIds } : "skip"
  );

  return {
    statuses: onlineStatuses || {},
    isLoading: onlineStatuses === undefined,
  };
};

/**
 * Hook to get list of online users
 */
export const useOnlineUsers = (limit?: number) => {
  const onlineUsers = useQuery(api.userPresence.getOnlineUsers, {
    limit: limit || 50,
  });

  return {
    users: onlineUsers || [],
    isLoading: onlineUsers === undefined,
  };
};
