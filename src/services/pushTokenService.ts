import { api } from "@/convex/_generated/api";
import { convex } from "@/providers/ClerkAndConvexProvider";
import { saveToLocalStorage } from "@/store/storage";
import { PushTokenManager } from "@/utils/pushTokenManager";
import { Platform } from "react-native";

interface RegisterTokenResponse {
  success: boolean;
  message: string;
  tokenId?: string;
  userId?: string;
}

export class PushTokenService {
  /**
   * Registers a push token with the backend
   * @param pushToken - The Expo push token string
   * @returns Promise with registration response
   */
  static async registerPushToken(
    pushToken: string
  ): Promise<RegisterTokenResponse> {
    try {
      // Initialize device tracking to ensure consistent device ID and info
      const { deviceId, deviceInfo } =
        await PushTokenManager.initializeDeviceTracking();

      const data = await convex.mutation(api.pushTokens.registerPushToken, {
        pushToken,
        deviceId,
        platform: Platform.OS,
        deviceName: deviceInfo.deviceName ? String(deviceInfo.deviceName) : "",
        deviceType: deviceInfo.deviceType ? String(deviceInfo.deviceType) : "",
        modelName: deviceInfo.modelName ? String(deviceInfo.modelName) : "",
        brand: deviceInfo.brand ? String(deviceInfo.brand) : "",
        manufacturer: deviceInfo.manufacturer
          ? String(deviceInfo.manufacturer)
          : "",
        osName: deviceInfo.osName ? String(deviceInfo.osName) : "",
        osVersion: deviceInfo.osVersion ? String(deviceInfo.osVersion) : "",
        timestamp: new Date().toLocaleString(),
      });

      if (!data) {
        return { success: false, message: "Failed to register push token" };
      }
      return data;
    } catch (error) {
      console.error("Error registering push token:", error);
      throw error;
    }
  }

  /**
   * Saves push token registration status locally
   * @param pushToken - The push token string
   * @param tokenId - The backend token ID (optional)
   */
  static async savePushTokenRegistration(
    pushToken: string,
    tokenId?: string,
    userId?: string
  ): Promise<void> {
    try {
      const dataToSave = [
        { key: "pushTokenString", value: pushToken },
        { key: "pushTokenRegistered", value: "true" },
        { key: "pushTokenRegisteredAt", value: new Date().toISOString() },
      ];

      if (tokenId) {
        dataToSave.push({ key: "pushTokenId", value: tokenId });
      }
      if (userId) {
        dataToSave.push({ key: "pushTokenUserId", value: userId });
      }

      saveToLocalStorage(dataToSave);
    } catch (error) {
      console.error("Error saving push token registration:", error);
      throw error;
    }
  }
}
