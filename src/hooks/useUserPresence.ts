import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getDeviceId } from "@/utils/deviceId";
import { useAuth, useSession } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

/**
 * Hook to manage user online presence using Clerk session ID
 */
export const useUserPresence = () => {
  const { isSignedIn, userId } = useAuth();
  const { session } = useSession();
  const [isOnline, setIsOnline] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );
  const previousAuthState = useRef<boolean>(false);
  const previousAppState = useRef<AppStateStatus>(AppState.currentState);

  // Mutation
  const updateSessionStatus = useMutation(api.userPresence.updateSessionStatus);

  /**
   * Update session status with consistent deviceId
   */
  const updateStatus = useCallback(
    async (status: "logged_in" | "app_background" | "logged_out") => {
      if (!session?.id || !isSignedIn) return;

      try {
        // Get consistent deviceId across all tables
        const deviceId = await getDeviceId();

        await updateSessionStatus({
          clerkSessionId: session.id,
          status,
          deviceId: deviceId || `device_${userId}`,
        });

        const newIsOnline = status === "logged_in";
        setIsOnline(newIsOnline);
        console.log(`Status updated to: ${status}, isOnline: ${newIsOnline}`);
      } catch (error) {
        console.error("Failed to update session status:", error);
      }
    },
    [session?.id, isSignedIn, userId, updateSessionStatus]
  );

  /**
   * Handle app state changes
   */
  const handleAppStateChange = useCallback(
    async (nextAppState: AppStateStatus) => {
      setAppState(nextAppState);

      if (!isSignedIn || !session?.id) return;

      // App coming to foreground
      if (previousAppState.current !== "active" && nextAppState === "active") {
        await updateStatus("logged_in");
      }
      // App going to background or inactive
      else if (
        previousAppState.current === "active" &&
        (nextAppState === "background" || nextAppState === "inactive")
      ) {
        await updateStatus("app_background");
      }

      previousAppState.current = nextAppState;
    },
    [isSignedIn, session?.id, updateStatus]
  );

  /**
   * Handle authentication state changes
   */
  useEffect(() => {
    const handleAuthChange = async () => {
      const currentlySignedIn = !!isSignedIn;

      // User just logged in
      if (
        !previousAuthState.current &&
        currentlySignedIn &&
        appState === "active"
      ) {
        await updateStatus("logged_in");
      }
      // User just logged out
      else if (previousAuthState.current && !currentlySignedIn) {
        await updateStatus("logged_out");
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
   * Initialize session on mount if user is already signed in and app is active
   */
  useEffect(() => {
    if (isSignedIn && appState === "active" && session?.id) {
      updateStatus("logged_in");
    }
  }, [isSignedIn, appState, session?.id, updateStatus]);

  /**
   * Cleanup on unmount - mark as logged out
   */
  useEffect(() => {
    return () => {
      if (session?.id && isSignedIn) {
        // Don't await here as component is unmounting
        (async () => {
          try {
            const deviceId = await getDeviceId();

            updateSessionStatus({
              clerkSessionId: session.id,
              status: "logged_out",
              deviceId: deviceId || `device_${userId}`,
            }).catch(console.error);
          } catch (error) {
            console.error("Error during cleanup logout:", error);
          }
        })();
      }
    };
  }, [session?.id, isSignedIn, userId, updateSessionStatus]);

  /**
   * Record user activity (manual trigger for updating presence)
   */
  const recordActivity = useCallback(async () => {
    if (isSignedIn && session?.id && appState === "active") {
      await updateStatus("logged_in");
    }
  }, [isSignedIn, session?.id, appState, updateStatus]);

  return {
    isOnline: !!(isOnline && isSignedIn && appState === "active"),
    sessionId: session?.id || null,
    appState,
    recordActivity,
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
 * Hook to get list of online users (for admin/debugging)
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
