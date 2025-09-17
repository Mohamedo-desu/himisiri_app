import { APP_NAME, SLUG } from "constants/device";
import { Alert, Platform, Share } from "react-native";

/**
 * Utility functions for sharing app content with deeplinks
 */

/**
 * Share the app with deeplink
 * @param downloadUrl App download URL from app store
 */
export const shareApp = async (downloadUrl: string) => {
  const webUrl = `https://${SLUG}.expo.app`;

  const message = `Check out this awesome Currency Converter app! Convert between any currencies with ease.\n🔗 Quick access: ${webUrl}\n📲 Download: ${downloadUrl}`;

  try {
    if (Platform.OS === "web") {
      if (navigator.share) {
        await navigator.share({
          title: "Currency Converter",
          text: message,
          url: webUrl,
        });
      } else {
        // Fallback for browsers without native share
        await navigator.clipboard.writeText(message);
        Alert.alert("Copied!", "App details copied to clipboard.");
      }
    } else {
      await Share.share({
        message,
        title: APP_NAME,
        url: webUrl, // Use web URL for better compatibility
      });
    }
  } catch (error) {
    console.error("Error sharing app:", error);
  }
};
