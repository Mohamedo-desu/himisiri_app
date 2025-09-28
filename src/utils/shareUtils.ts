import { APP_NAME } from "@/constants/device";
import { Alert, Platform, Share } from "react-native";

/**
 * Utility functions for sharing app content with deeplinks
 */

// Base URLs for deep linking
const WEB_BASE_URL = `https://himisiri.expo.app`; // Use the actual app slug from app.config.ts
const APP_SCHEME = "himisiri";

/**
 * Share a post with deep link
 * @param postId Post ID to share
 * @param postTitle Post title (optional)
 * @param postContent Post content snippet
 * @param authorName Author's username
 */
export const sharePost = async (
  postId: string,
  postTitle?: string,
  postContent?: string,
  authorName?: string
) => {
  console.log("sharePost called with:", {
    postId,
    postTitle,
    postContent,
    authorName,
  });

  const deepLink = `${APP_SCHEME}://(main)/post/${postId}`;
  const webLink = `${WEB_BASE_URL}/(main)/post/${postId}`;

  console.log("Generated links:", { deepLink, webLink });

  const title = postTitle ? `"${postTitle}"` : "Check out this post";
  const contentPreview = postContent
    ? postContent.length > 100
      ? `${postContent.substring(0, 100)}...`
      : postContent
    : "";

  const authorInfo = authorName ? ` by ${authorName}` : "";

  const shareMessage = `${title}${authorInfo} on ${APP_NAME}\n\n${contentPreview}\n\n🔗 Open in app: ${deepLink}\n🌐 View online: ${webLink}`;

  console.log("Share message:", shareMessage);

  try {
    if (Platform.OS === "web") {
      if (navigator.share) {
        await navigator.share({
          title: `${title} - ${APP_NAME}`,
          text: shareMessage,
          url: webLink,
        });
      } else {
        await navigator.clipboard.writeText(shareMessage);
        Alert.alert("Copied!", "Post link copied to clipboard.");
      }
    } else {
      const shareResult = await Share.share({
        message: shareMessage,
        title: `${title} - ${APP_NAME}`,
        url: Platform.OS === "ios" ? deepLink : webLink,
      });
      console.log("Share result:", shareResult);
    }
    return true;
  } catch (error) {
    console.error("Error sharing post:", error);
    Alert.alert("Share Failed", "Unable to share post at the moment");
    return false;
  }
};

/**
 * Share a comment with deep link to the post and highlight the comment
 * @param postId Post ID containing the comment
 * @param commentId Comment ID to highlight
 * @param commentContent Comment content
 * @param authorName Comment author's username
 */
export const shareComment = async (
  postId: string,
  commentId: string,
  commentContent: string,
  authorName?: string
) => {
  const deepLink = `${APP_SCHEME}://(main)/post/${postId}?highlight=${commentId}&type=comment`;
  const webLink = `${WEB_BASE_URL}/(main)/post/${postId}?highlight=${commentId}&type=comment`;

  const contentPreview =
    commentContent.length > 100
      ? `${commentContent.substring(0, 100)}...`
      : commentContent;

  const authorInfo = authorName ? ` by ${authorName}` : "";

  const shareMessage = `Check out this comment${authorInfo} on ${APP_NAME}:\n\n"${contentPreview}"\n\n🔗 Open in app: ${deepLink}\n🌐 View online: ${webLink}`;

  try {
    if (Platform.OS === "web") {
      if (navigator.share) {
        await navigator.share({
          title: `Comment - ${APP_NAME}`,
          text: shareMessage,
          url: webLink,
        });
      } else {
        await navigator.clipboard.writeText(shareMessage);
        Alert.alert("Copied!", "Comment link copied to clipboard.");
      }
    } else {
      await Share.share({
        message: shareMessage,
        title: `Comment - ${APP_NAME}`,
        url: Platform.OS === "ios" ? deepLink : webLink,
      });
    }
    return true;
  } catch (error) {
    console.error("Error sharing comment:", error);
    Alert.alert("Share Failed", "Unable to share comment at the moment");
    return false;
  }
};

/**
 * Share a user profile
 * @param userId User ID to share
 * @param userName Username
 * @param userBio User bio (optional)
 */
export const shareUser = async (
  userId: string,
  userName: string,
  userBio?: string
) => {
  const deepLink = `${APP_SCHEME}://(main)/user/${userId}`;
  const webLink = `${WEB_BASE_URL}/(main)/user/${userId}`;

  const bioInfo = userBio ? `\n\n"${userBio}"` : "";

  const shareMessage = `Check out ${userName}'s profile on ${APP_NAME}${bioInfo}\n\n🔗 Open in app: ${deepLink}\n🌐 View online: ${webLink}`;

  try {
    if (Platform.OS === "web") {
      if (navigator.share) {
        await navigator.share({
          title: `${userName} - ${APP_NAME}`,
          text: shareMessage,
          url: webLink,
        });
      } else {
        await navigator.clipboard.writeText(shareMessage);
        Alert.alert("Copied!", "Profile link copied to clipboard.");
      }
    } else {
      await Share.share({
        message: shareMessage,
        title: `${userName} - ${APP_NAME}`,
        url: Platform.OS === "ios" ? deepLink : webLink,
      });
    }
    return true;
  } catch (error) {
    console.error("Error sharing user:", error);
    Alert.alert("Share Failed", "Unable to share profile at the moment");
    return false;
  }
};

/**
 * Share the app with deeplink
 * @param downloadUrl App download URL from app store
 */
export const shareApp = async (downloadUrl?: string) => {
  const webUrl = `${WEB_BASE_URL}`;
  const appStoreUrl = downloadUrl || webUrl;

  const message = `Check out ${APP_NAME} - Share your thoughts anonymously and connect with others!\n\n🔗 Quick access: ${webUrl}\n📲 Download: ${appStoreUrl}`;

  try {
    if (Platform.OS === "web") {
      if (navigator.share) {
        await navigator.share({
          title: APP_NAME,
          text: message,
          url: webUrl,
        });
      } else {
        await navigator.clipboard.writeText(message);
        Alert.alert("Copied!", "App details copied to clipboard.");
      }
    } else {
      await Share.share({
        message,
        title: APP_NAME,
        url: webUrl,
      });
    }
    return true;
  } catch (error) {
    console.error("Error sharing app:", error);
    Alert.alert("Share Failed", "Unable to share app at the moment");
    return false;
  }
};

/**
 * Generate share text for generic content
 * @param content Content to share
 * @param title Optional title
 */
export const shareGenericContent = async (content: string, title?: string) => {
  const shareTitle = title ? `${title} - ${APP_NAME}` : APP_NAME;

  try {
    if (Platform.OS === "web") {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: content,
        });
      } else {
        await navigator.clipboard.writeText(content);
        Alert.alert("Copied!", "Content copied to clipboard.");
      }
    } else {
      await Share.share({
        message: content,
        title: shareTitle,
      });
    }
    return true;
  } catch (error) {
    console.error("Error sharing content:", error);
    Alert.alert("Share Failed", "Unable to share content at the moment");
    return false;
  }
};
