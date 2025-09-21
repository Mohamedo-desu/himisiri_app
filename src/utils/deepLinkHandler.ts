import * as Linking from "expo-linking";
import { router } from "expo-router";

/**
 * Utility functions for handling deep links in the app
 */

/**
 * Handle incoming deep links and navigate to the appropriate screen
 * @param url The deep link URL
 */
export const handleDeepLink = (url: string) => {
  try {
    const parsed = Linking.parse(url);
    const { hostname, path, queryParams } = parsed;

    // Handle app scheme links (himisiri://...)
    if (parsed.scheme === "himisiri") {
      if (path?.startsWith("/main/post/")) {
        const postId = path.split("/")[3];
        if (postId) {
          // Check if there are highlight parameters for comments
          if (queryParams?.highlight) {
            router.push({
              pathname: "/(main)/post/[id]" as any,
              params: {
                id: postId,
                highlight: queryParams.highlight as string,
                type: queryParams.type as string,
              },
            });
          } else {
            router.push({
              pathname: "/(main)/post/[id]" as any,
              params: { id: postId },
            });
          }
        }
      } else if (path?.startsWith("/main/user/")) {
        const userId = path.split("/")[3];
        if (userId) {
          router.push({
            pathname: "/(main)/user/[userId]" as any,
            params: { userId },
          });
        }
      }
    }

    // Handle web links (https://himisiri.expo.app/...)
    else if (hostname === "himisiri.expo.app") {
      if (path?.startsWith("/main/post/")) {
        const postId = path.split("/")[3];
        if (postId) {
          if (queryParams?.highlight) {
            router.push({
              pathname: "/(main)/post/[id]" as any,
              params: {
                id: postId,
                highlight: queryParams.highlight as string,
                type: queryParams.type as string,
              },
            });
          } else {
            router.push({
              pathname: "/(main)/post/[id]" as any,
              params: { id: postId },
            });
          }
        }
      } else if (path?.startsWith("/main/user/")) {
        const userId = path.split("/")[3];
        if (userId) {
          router.push({
            pathname: "/(main)/user/[userId]" as any,
            params: { userId },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error handling deep link:", error);
  }
};

/**
 * Set up deep link handling for the app
 */
export const setupDeepLinking = () => {
  // Handle app launch from deep link
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log("App launched with URL:", url);
      handleDeepLink(url);
    }
  });

  // Handle deep links when app is already running
  const subscription = Linking.addEventListener("url", ({ url }) => {
    console.log("Deep link received:", url);
    handleDeepLink(url);
  });

  return () => subscription?.remove();
};
