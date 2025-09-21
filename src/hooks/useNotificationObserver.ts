import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

// Type for notification data from push notifications
interface NotificationData {
  url?: string;
  entityType?: "post" | "comment" | "reply" | "user";
  entityId?: string;
  type?:
    | "like"
    | "comment"
    | "reply"
    | "follow"
    | "mention"
    | "report_resolved"
    | "account_warning"
    | "post_featured"
    | "system";
  senderId?: string;
  metadata?: {
    postId?: string;
    commentId?: string;
    [key: string]: any;
  };
}

export const useNotificationObserver = () => {
  useEffect(() => {
    let isMounted = true;

    function redirect(notification: Notifications.Notification) {
      const data = notification.request.content.data as NotificationData;
      console.log("Push notification clicked:", data);

      try {
        // Handle navigation based on the notification data
        if (data?.url) {
          // If URL is provided directly, use it
          router.push(data.url as any);
          return;
        }

        // Construct URL based on notification data structure
        const { entityType, entityId, type, senderId, metadata } = data;

        if (entityType === "post" && entityId) {
          // Check if this is a comment notification on a post
          if (type === "comment" && metadata?.commentId) {
            // Comment notification - highlight the comment
            router.push(
              `/(main)/post/${entityId}?highlight=${metadata.commentId}&type=comment` as any
            );
          } else {
            // Regular post navigation (for post likes, etc.)
            router.push(`/(main)/post/${entityId}` as any);
          }
        } else if (
          (entityType === "comment" || entityType === "reply") &&
          metadata?.postId
        ) {
          // For comments, replies, and their likes - navigate to the post containing them
          let highlightId = entityId;

          if (type === "reply" && entityType === "comment") {
            // For replies, entityId is the parent comment ID
            highlightId = entityId;
          } else if (entityType === "comment") {
            // For comment notifications (likes, new comments)
            highlightId = entityId;
          }

          router.push(
            `/(main)/post/${metadata.postId}?highlight=${highlightId}&type=${entityType}` as any
          );
        } else if (entityType === "user" && entityId) {
          // Navigate to user profile
          router.push(`/(main)/user/${entityId}` as any);
        } else if (type === "follow" && senderId) {
          // Navigate to the follower's profile
          router.push(`/(main)/user/${senderId}` as any);
        } else {
          // For other notification types (system notifications, etc.)
          console.log("No specific navigation for notification type:", type);
        }
      } catch (error) {
        console.error("Error handling push notification navigation:", error);
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return;
      }
      redirect(response?.notification);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification);
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
};
