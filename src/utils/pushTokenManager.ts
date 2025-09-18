import { getFromLocalStorage } from "@/store/storage";
import { useUserStore } from "@/store/useUserStore";
import { getDeviceId } from "@/utils/deviceId";
import { getDeviceInfo } from "@/utils/deviceInfo";

/**
 * Utility functions for push token management
 */
export class PushTokenManager {
  /**
   * Check if push notifications are properly set up
   */
  static async isPushNotificationSetup(): Promise<boolean> {
    try {
      return await this.isPushTokenRegistered();
    } catch (error) {
      console.error("Error checking push notification setup:", error);
      return false;
    }
  }

  /**
   * Checks if a push token is already registered locally
   * @returns Promise with boolean indicating if token exists
   */
  static async isPushTokenRegistered(): Promise<boolean> {
    try {
      const { pushTokenString, pushTokenRegistered, pushTokenUserId } =
        getFromLocalStorage([
          "pushTokenString",
          "pushTokenRegistered",
          "pushTokenUserId",
        ]);

      const currentUser = useUserStore.getState().currentUser;

      // If userId is missing but currentUser has _id, rerun registration
      if (
        !pushTokenUserId &&
        currentUser &&
        currentUser._id &&
        pushTokenString
      ) {
        // Import PushTokenService dynamically to avoid circular deps
        const { PushTokenService } = await import(
          "@/services/pushTokenService"
        );
        await PushTokenService.registerPushToken(pushTokenString);
        // Optionally, update local storage with new userId here if needed
      }

      // Return true if we have both a token and registration confirmation
      return !!(pushTokenString && pushTokenRegistered === "true");
    } catch (error) {
      console.error("Error checking token registration status:", error);
      return false;
    }
  }

  /**
   * Get the current device ID and ensure device info is cached
   */
  static async getCurrentDeviceId(): Promise<string | null> {
    try {
      // Ensure device info is cached when getting device ID
      getDeviceInfo(); // This will cache device info if not already cached
      return await getDeviceId();
    } catch (error) {
      console.error("Error getting device ID:", error);
      return null;
    }
  }

  /**
   * Initialize device tracking (cache both device ID and info)
   */
  static async initializeDeviceTracking(): Promise<{
    deviceId: string;
    deviceInfo: any;
  }> {
    try {
      const deviceInfo = getDeviceInfo(); // Cache device info
      const deviceId = await getDeviceId(); // Cache device ID

      return { deviceId, deviceInfo };
    } catch (error) {
      console.error("Error initializing device tracking:", error);
      throw error;
    }
  }
}
