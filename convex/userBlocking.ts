import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";

/**
 * Block a user - prevents all interactions between the two users
 */
export const blockUser = authenticatedMutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { userId, reason }) => {
    const currentUserId = ctx.user._id;

    // Can't block yourself
    if (currentUserId === userId) {
      throw new Error("You cannot block yourself");
    }

    // Check if target user exists
    const targetUser = await ctx.db.get(userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Check if already blocked
    const existingBlock = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", currentUserId).eq("blockedUserId", userId)
      )
      .first();

    if (existingBlock) {
      throw new Error("User is already blocked");
    }

    // Create block relationship
    await ctx.db.insert("blockedUsers", {
      blockerId: currentUserId,
      blockedUserId: userId,
      blockedAt: Date.now(),
      reason: reason,
    });

    // If they were following each other, remove the follow relationships
    const followRelationship = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", currentUserId).eq("followingId", userId)
      )
      .first();

    if (followRelationship) {
      await ctx.db.delete(followRelationship._id);
      // Update following count
      await ctx.db.patch(currentUserId, {
        following: Math.max(0, ctx.user.following - 1),
      });
      // Update followers count
      await ctx.db.patch(userId, {
        followers: Math.max(0, targetUser.followers - 1),
      });
    }

    const reverseFollowRelationship = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", userId).eq("followingId", currentUserId)
      )
      .first();

    if (reverseFollowRelationship) {
      await ctx.db.delete(reverseFollowRelationship._id);
      // Update following count for target user
      await ctx.db.patch(userId, {
        following: Math.max(0, targetUser.following - 1),
      });
      // Update followers count for current user
      await ctx.db.patch(currentUserId, {
        followers: Math.max(0, ctx.user.followers - 1),
      });
    }

    return { success: true, message: "User blocked successfully" };
  },
});

/**
 * Unblock a user - restores ability to interact
 */
export const unblockUser = authenticatedMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const currentUserId = ctx.user._id;

    // Can't unblock yourself
    if (currentUserId === userId) {
      throw new Error("You cannot unblock yourself");
    }

    // Find the block relationship
    const blockRelationship = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", currentUserId).eq("blockedUserId", userId)
      )
      .first();

    if (!blockRelationship) {
      throw new Error("User is not blocked");
    }

    // Remove block relationship
    await ctx.db.delete(blockRelationship._id);

    return { success: true, message: "User unblocked successfully" };
  },
});

/**
 * Check if current user has blocked another user
 */
export const isUserBlocked = authenticatedQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const currentUserId = ctx.user._id;

    if (currentUserId === userId) {
      return false; // Can't block yourself
    }

    const blockRelationship = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", currentUserId).eq("blockedUserId", userId)
      )
      .first();

    return !!blockRelationship;
  },
});

/**
 * Check if current user is blocked by another user
 */
export const isBlockedByUser = authenticatedQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const currentUserId = ctx.user._id;

    if (currentUserId === userId) {
      return false; // Can't be blocked by yourself
    }

    const blockRelationship = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", userId).eq("blockedUserId", currentUserId)
      )
      .first();

    return !!blockRelationship;
  },
});

/**
 * Get list of users blocked by current user
 */
export const getBlockedUsers = authenticatedQuery({
  handler: async (ctx) => {
    const currentUserId = ctx.user._id;

    const blockedRelationships = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker", (q) => q.eq("blockerId", currentUserId))
      .collect();

    const blockedUsers = await Promise.all(
      blockedRelationships.map(async (block) => {
        const user = await ctx.db.get(block.blockedUserId);
        if (!user) return null;

        // Return public user info
        const { emailAddress, clerkId, ...publicUser } = user;
        return {
          ...publicUser,
          blockedAt: block.blockedAt || block._creationTime,
          reason: block.reason,
        };
      })
    );

    return blockedUsers.filter((user) => user !== null);
  },
});

/**
 * Get list of users who have blocked the current user
 */
export const getUsersWhoBlockedMe = authenticatedQuery({
  handler: async (ctx) => {
    const currentUserId = ctx.user._id;

    const blockingRelationships = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocked_user", (q) => q.eq("blockedUserId", currentUserId))
      .collect();

    const blockingUsers = await Promise.all(
      blockingRelationships.map(async (block) => {
        const user = await ctx.db.get(block.blockerId);
        if (!user) return null;

        // Return public user info
        const { emailAddress, clerkId, ...publicUser } = user;
        return {
          ...publicUser,
          blockedAt: block.blockedAt || block._creationTime,
        };
      })
    );

    return blockingUsers.filter((user) => user !== null);
  },
});

/**
 * Get blocking status between current user and another user
 */
export const getBlockingStatus = authenticatedQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const currentUserId = ctx.user._id;

    if (currentUserId === userId) {
      return {
        isBlocked: false,
        isBlockedBy: false,
        canInteract: true,
      };
    }

    // Check if current user blocked the target user
    const isBlocked = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", currentUserId).eq("blockedUserId", userId)
      )
      .first();

    // Check if target user blocked the current user
    const isBlockedBy = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker_blocked", (q) =>
        q.eq("blockerId", userId).eq("blockedUserId", currentUserId)
      )
      .first();

    return {
      isBlocked: !!isBlocked,
      isBlockedBy: !!isBlockedBy,
      canInteract: !isBlocked && !isBlockedBy,
    };
  },
});

/**
 * Helper function to get all blocked user IDs for the current user
 * This can be used by other queries to filter out blocked content
 */
export const getBlockedUserIds = authenticatedQuery({
  handler: async (ctx) => {
    const currentUserId = ctx.user._id;

    // Get users blocked by current user
    const blockedByMe = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker", (q) => q.eq("blockerId", currentUserId))
      .collect();

    // Get users who blocked current user
    const blockingMe = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocked_user", (q) => q.eq("blockedUserId", currentUserId))
      .collect();

    const blockedUserIds = new Set([
      ...blockedByMe.map((block) => block.blockedUserId),
      ...blockingMe.map((block) => block.blockerId),
    ]);

    return Array.from(blockedUserIds);
  },
});
