import { v } from "convex/values";
import { authenticatedMutation } from "./customFunctions";
import { rateLimitedOptionalAuthQuery } from "./rateLimitedFunctions";

/**
 * Update user session status using Clerk session ID
 * This is the main function that handles all session state changes
 */
export const updateSessionStatus = authenticatedMutation({
  args: {
    clerkSessionId: v.string(),
    status: v.union(
      v.literal("logged_in"),
      v.literal("app_background"),
      v.literal("logged_out")
    ),
    deviceId: v.string(), // Only deviceId for consistency
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

    // Find existing session by Clerk session ID
    const existingSession = await ctx.db
      .query("userSessions")
      .withIndex("by_clerk_session", (q: any) =>
        q.eq("clerkSessionId", args.clerkSessionId)
      )
      .first();

    if (existingSession) {
      // Update existing session with deviceId
      await ctx.db.patch(existingSession._id, {
        status: args.status,
        deviceId: args.deviceId,
        updatedAt: now,
        ...(args.status === "logged_out" && { expiresAt: now }),
      });

      console.log(`Updated session ${args.clerkSessionId} to ${args.status}`);
    } else {
      // Create new session only if logging in
      if (args.status === "logged_in") {
        await ctx.db.insert("userSessions", {
          userId: ctx.user._id,
          clerkSessionId: args.clerkSessionId,
          deviceId: args.deviceId,
          status: args.status,
          createdAt: now,
          updatedAt: now,
          expiresAt,
        });

        console.log(
          `Created new session ${args.clerkSessionId} for user ${ctx.user._id}`
        );
      }
    }

    // Update user online status based on session status
    const isOnline = args.status === "logged_in";
    await ctx.db.patch(ctx.user._id, {
      isOnline,
      lastActiveAt: isOnline ? now : ctx.user.lastActiveAt,
      lastSeenAt: !isOnline ? now : ctx.user.lastSeenAt,
    });

    return {
      success: true,
      status: args.status,
      isOnline,
      timestamp: now,
    };
  },
});

/**
 * Clean up expired and logged out sessions
 */
export const cleanupSessions = authenticatedMutation({
  args: {},
  handler: async (ctx, args) => {
    const now = Date.now();

    // Remove expired sessions
    const expiredSessions = await ctx.db
      .query("userSessions")
      .filter((q: any) =>
        q.and(
          q.neq(q.field("expiresAt"), undefined),
          q.lt(q.field("expiresAt"), now)
        )
      )
      .collect();

    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
    }

    return { removed: expiredSessions.length };
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

    // Check for active sessions (logged_in status)
    const activeSessions = await ctx.db
      .query("userSessions")
      .withIndex("by_user_status", (q: any) =>
        q.eq("userId", args.userId).eq("status", "logged_in")
      )
      .collect();

    // User is online if they are marked as online and have active sessions
    const isOnline = user.isOnline && activeSessions.length > 0;

    return {
      userId: args.userId,
      isOnline,
      lastSeenAt: user.lastSeenAt || user.lastActiveAt,
      lastActiveAt: user.lastActiveAt,
      activeSessions: activeSessions.length,
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
      if (!userDoc) {
        results[userId] = false;
        continue;
      }

      // Check for active sessions (logged_in status)
      const activeSessions = await ctx.db
        .query("userSessions")
        .withIndex("by_user_status", (q: any) =>
          q.eq("userId", userId).eq("status", "logged_in")
        )
        .collect();

      // User is online if they are marked as online and have active sessions
      const isOnline = !!(userDoc.isOnline && activeSessions.length > 0);
      results[userId] = isOnline;
    }

    return results;
  },
});

/**
 * Get list of online users (for admin/debugging)
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

    // Verify with active sessions
    const verifiedOnlineUsers = [];
    for (const user of onlineUsers) {
      const activeSessions = await ctx.db
        .query("userSessions")
        .withIndex("by_user_status", (q: any) =>
          q.eq("userId", user._id).eq("status", "logged_in")
        )
        .collect();

      if (activeSessions.length > 0) {
        verifiedOnlineUsers.push({
          _id: user._id,
          userName: user.userName,
          imageUrl: user.imageUrl,
          isOnline: true,
          lastActiveAt: user.lastActiveAt,
          activeSessions: activeSessions.length,
        });
      }
    }

    return verifiedOnlineUsers;
  },
});
