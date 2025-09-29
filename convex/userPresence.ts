import { v } from "convex/values";
import { optionalAuthMutation } from "./customFunctions";
import { rateLimitedOptionalAuthQuery } from "./rateLimitedFunctions";

/**
 * Update user online status and activity timestamps
 * Simplified approach - only updates user fields, no session management
 */
export const updateUserStatus = optionalAuthMutation({
  args: {
    status: v.union(
      v.literal("online"), // User is actively using the app
      v.literal("offline") // User has gone offline
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const isOnline = args.status === "online";

    // If no authenticated user, return early (no-op)
    if (!ctx.user) {
      return { success: false, status: args.status, isOnline, timestamp: now };
    }

    // Get current user to check if update is needed
    const currentUser = await ctx.db.get(ctx.user._id);

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only update if status actually changed to reduce conflicts
    if (currentUser.isOnline !== isOnline) {
      await ctx.db.patch(ctx.user._id, {
        isOnline,
        lastActiveAt: isOnline ? now : currentUser.lastActiveAt,
        lastSeenAt: !isOnline ? now : currentUser.lastSeenAt,
      });
      console.log(
        `Updated user ${ctx.user._id} status to ${args.status} (isOnline: ${isOnline})`
      );
    }

    return {
      success: true,
      status: args.status,
      isOnline,
      timestamp: now,
    };
  },
});

/**
 * Record user activity (heartbeat) - updates lastActiveAt if user is online
 */
export const recordActivity = optionalAuthMutation({
  args: {},
  handler: async (ctx, args) => {
    const now = Date.now();

    // If no authenticated user, return early (no-op)
    if (!ctx.user) {
      return { success: false, timestamp: now };
    }

    // Only update lastActiveAt, don't change online status
    await ctx.db.patch(ctx.user!._id, {
      lastActiveAt: now,
    });

    return { success: true, timestamp: now };
  },
});

/**
 * Get user's online status
 */
export const getUserOnlineStatus = rateLimitedOptionalAuthQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    return {
      userId: args.userId,
      isOnline: user.isOnline || false,
      lastSeenAt: user.lastSeenAt,
      lastActiveAt: user.lastActiveAt,
    };
  },
});

/**
 * Get online status for multiple users
 */
export const getMultipleUsersOnlineStatus = rateLimitedOptionalAuthQuery({
  args: {
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const results: Record<string, boolean> = {};

    for (const userId of args.userIds) {
      const userDoc = await ctx.db.get(userId);
      results[userId] = userDoc?.isOnline || false;
    }

    return results;
  },
});

/**
 * Get list of online users
 */
export const getOnlineUsers = rateLimitedOptionalAuthQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get users marked as online
    const onlineUsers = await ctx.db
      .query("users")
      .withIndex("by_online_status", (q: any) => q.eq("isOnline", true))
      .take(limit);

    return onlineUsers.map((user) => ({
      _id: user._id,
      userName: user.userName,
      imageUrl: user.imageUrl,
      isOnline: true,
      lastActiveAt: user.lastActiveAt,
    }));
  },
});
