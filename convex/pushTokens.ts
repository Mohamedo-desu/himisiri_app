import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const registerPushToken = mutation({
  args: {
    pushToken: v.string(),
    deviceId: v.string(), // Only deviceId for consistency
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    const { pushToken, deviceId, timestamp } = args;
    const authenticatedUser = await getAuthenticatedUser(ctx);

    // Validate required fields
    if (!pushToken || !deviceId) {
      return {
        success: false,
        message: "Missing required fields: pushToken or deviceId",
      };
    }

    // Check if a push token with this deviceId already exists
    const existingToken = await ctx.db
      .query("pushTokens")
      .filter((q) => q.eq(q.field("deviceId"), deviceId))
      .first();

    let pushTokenEntry;
    let message;

    if (existingToken) {
      // Update the existing push token
      await ctx.db.patch(existingToken._id, {
        userId: authenticatedUser?._id,
        pushToken,
        deviceId,
        timestamp,
      });
      pushTokenEntry = existingToken._id;
      message = "Push token updated successfully";
    } else {
      // Create a new push token entry
      pushTokenEntry = await ctx.db.insert("pushTokens", {
        userId: authenticatedUser?._id,
        pushToken,
        deviceId,
        timestamp,
      });
      message = "Push token registered successfully";
    }

    return {
      success: true,
      message,
      tokenId: pushTokenEntry,
      userId: authenticatedUser?._id,
    };
  },
});

// Internal query to get user's push tokens (for use in actions)
export const getUserPushTokens = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Internal mutation to remove a push token (for use in actions)
export const removePushToken = internalMutation({
  args: {
    pushTokenId: v.id("pushTokens"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.pushTokenId);
  },
});
