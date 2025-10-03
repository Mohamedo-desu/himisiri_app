import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { internalAction, internalMutation } from "./_generated/server";

// Send push notification using Expo's push service
export const sendPushNotification = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; message: string; result?: any }> => {
    try {
      // Get all push tokens for this user
      const pushTokens: Doc<"pushTokens">[] = await ctx.runQuery(
        internal.pushTokens.getUserPushTokens,
        {
          userId: args.userId,
        }
      );

      if (pushTokens.length === 0) {
        return { success: false, message: "No push tokens found" };
      }

      // Prepare push notification payload
      const messages = pushTokens.map((tokenDoc: Doc<"pushTokens">) => ({
        to: tokenDoc.pushToken,
        sound: "default",
        title: args.title,
        body: args.body,
        data: args.data || {},
        priority: "high",
        channelId: "default",
      }));

      // Send push notifications via Expo's push service
      const response: Response = await fetch(
        "https://exp.host/--/api/v2/push/send",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messages),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Push notification failed:", errorText);
        return {
          success: false,
          message: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const result = await response.json();

      // Handle any invalid tokens by removing them
      if (Array.isArray(result.data)) {
        for (let i = 0; i < result.data.length; i++) {
          const ticketResult = result.data[i];
          if (
            ticketResult.status === "error" &&
            (ticketResult.details?.error === "DeviceNotRegistered" ||
              ticketResult.details?.error === "InvalidCredentials")
          ) {
            // Remove invalid push token
            await ctx.runMutation(internal.pushTokens.removePushToken, {
              pushTokenId: pushTokens[i]._id,
            });
          }
        }
      }

      return {
        success: true,
        message: `Sent to ${messages.length} devices`,
        result,
      };
    } catch (error) {
      console.error("Error sending push notification:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Send notification and push notification together
export const sendNotificationWithPush = internalMutation({
  args: {
    userId: v.id("users"),
    senderId: v.optional(v.id("users")),
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("account_warning"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    entityId: v.optional(v.string()),
    entityType: v.optional(v.union(v.literal("post"), v.literal("comment"))),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      // Don't create notification if user is trying to notify themselves
      if (args.senderId && args.userId === args.senderId) {
        return null;
      }

      // Create in-app notification
      const notificationId = await ctx.db.insert("notifications", {
        userId: args.userId,
        senderId: args.senderId,
        type: args.type,
        title: args.title,
        message: args.message,
        entityId: args.entityId,
        entityType: args.entityType,
        isRead: false,
        metadata: args.metadata,
      });

      // Send push notification
      await ctx.scheduler.runAfter(
        0,
        internal.pushNotifications.sendPushNotification,
        {
          userId: args.userId,
          title: args.title,
          body: args.message,
          data: {
            notificationId: notificationId,
            type: args.type,
            entityId: args.entityId,
            entityType: args.entityType,
            ...args.metadata,
          },
        }
      );

      return notificationId;
    } catch (error) {
      console.error("Error in sendNotificationWithPush:", error);
      throw error;
    }
  },
});

// Get notification preferences for a user (you can expand this later)
export const getUserNotificationPreferences = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // For now, return default preferences
    // Later you can create a preferences table
    return {
      likes: true,
      comments: true,
      replies: true,
      follows: true,
      mentions: true,
      systemNotifications: true,
      pushNotifications: true,
    };
  },
});
