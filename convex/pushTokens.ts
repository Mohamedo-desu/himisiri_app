import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const registerPushToken = mutation({
  args: {
    pushToken: v.string(),
    deviceId: v.string(),
    platform: v.string(),
    deviceName: v.string(),
    deviceType: v.string(),
    modelName: v.string(),
    brand: v.string(),
    manufacturer: v.string(),
    osName: v.string(),
    osVersion: v.string(),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    const {
      pushToken,
      deviceId,
      platform,
      deviceName,
      deviceType,
      modelName,
      brand,
      manufacturer,
      osName,
      osVersion,
      timestamp,
    } = args;
    const authenticatedUser = await getAuthenticatedUser(ctx);

    // Validate required fields
    if (!pushToken || !deviceId || !platform) {
      return {
        success: false,
        message: "Missing required fields: pushToken, deviceId, or platform",
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
        platform,
        deviceName,
        deviceType,
        modelName,
        brand,
        manufacturer,
        osName,
        osVersion,
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
        platform,
        deviceName,
        deviceType,
        modelName,
        brand,
        manufacturer,
        osName,
        osVersion,
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
