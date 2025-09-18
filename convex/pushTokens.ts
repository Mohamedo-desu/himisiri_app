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

    // Handle the registration logic here
    const pushTokenEntry = await ctx.db.insert("pushToken", {
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
    return {
      success: true,
      message: "Push token registered successfully",
      tokenId: pushTokenEntry,
      userId: authenticatedUser?._id,
    };
  },
});
