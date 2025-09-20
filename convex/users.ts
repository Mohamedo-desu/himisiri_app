import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";

export const createUser = internalMutation({
  args: {
    userName: v.string(),
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("other"))
    ),
    age: v.optional(v.number()),
    emailAddress: v.string(),
    emailVerified: v.boolean(),
    clerkId: v.string(),
    imageUrl: v.optional(v.string()),
    postsPublished: v.number(),
    followers: v.number(),
    following: v.number(),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) return;

    await ctx.db.insert("users", {
      userName: args.userName,
      gender: args.gender,
      age: args.age,
      emailAddress: args.emailAddress,
      emailVerified: args.emailVerified,
      clerkId: args.clerkId,
      imageUrl: args.imageUrl,
      postsPublished: args.postsPublished,
      followers: args.followers,
      following: args.following,
      bio: args.bio,
    });
  },
});

export const getAuthenticatedUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const currentUser = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!currentUser) return null;

  return currentUser;
};

export const getUserByClerkId = query({
  args: {
    clerkId: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    if (args.clerkId !== null && args.clerkId !== undefined) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId!))
        .unique();

      return user;
    }
  },
});

export const initiateAccountDeletion = action({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkId = identity.subject;

    try {
      const CLERK_API_KEY = process.env.CLERK_API_KEY;
      if (!CLERK_API_KEY) {
        throw new Error("Clerk API key not configured");
      }

      const response = await fetch(
        `https://api.clerk.com/v1/users/${clerkId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${CLERK_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Failed to delete Clerk user: ${errorData}`);
        throw new Error(`Clerk API error: ${response.status}`);
      }

      console.log(`Successfully deleted Clerk user: ${clerkId}`);

      return { success: true };
    } catch (error) {
      console.error("Error deleting user account:", error);
      throw new Error("Failed to delete user account");
    }
  },
});

export const deleteAccountByClerkId = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // 0. Find the user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return;
    const userId = user._id;

    // 3. Delete user’s storage files (profile + documents)
    if (user.storageId) {
      try {
        await ctx.storage.delete(user.storageId);
      } catch (err) {
        console.warn(
          `⚠️ Failed to delete profile storage ${user.storageId}`,
          err
        );
      }
    }

    // 4. Finally, delete the user record - this will trigger cascading deletes
    console.log(`Deleting user account for ${user.userName} (${userId})`);
    await ctx.db.delete(userId);

    return { success: true };
  },
});

export const getCount = internalQuery(async (ctx) => {
  const doc = await ctx.db.query("userCounts").first();
  return doc ?? { count: 0 };
});

export const increment = internalMutation(async (ctx) => {
  const doc = await ctx.db.query("userCounts").first();
  if (doc) {
    await ctx.db.patch(doc._id, { count: doc.count + 1 });
  } else {
    await ctx.db.insert("userCounts", { count: 1 });
  }
});

// Query to get current user info
export const getCurrentUser = authenticatedQuery({
  handler: async (ctx, {}) => {
    return ctx.user;
  },
});

// Query to get user by ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Don't return sensitive information
    const { emailAddress, clerkId, ...publicUser } = user;
    return publicUser;
  },
});

// Query to get followers list
export const getFollowers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .collect();

    const followers = await Promise.all(
      follows.map(async (follow) => {
        const follower = await ctx.db.get(follow.followerId);
        if (!follower) return null;

        // Return public user info
        const { emailAddress, clerkId, ...publicUser } = follower;
        return {
          ...publicUser,
          followedAt: follow._creationTime,
        };
      })
    );

    return followers.filter((follower) => follower !== null);
  },
});

// Query to get following list
export const getFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();

    const following = await Promise.all(
      follows.map(async (follow) => {
        const followedUser = await ctx.db.get(follow.followingId);
        if (!followedUser) return null;

        // Return public user info
        const { emailAddress, clerkId, ...publicUser } = followedUser;
        return {
          ...publicUser,
          followedAt: follow._creationTime,
        };
      })
    );

    return following.filter((followedUser) => followedUser !== null);
  },
});

// Query to check if current user follows another user
export const isFollowing = authenticatedQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const currentUserId = ctx.user._id;

    if (currentUserId === userId) {
      return false; // Can't follow yourself
    }

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", currentUserId).eq("followingId", userId)
      )
      .first();

    return !!follow;
  },
});

// Mutation to follow a user
export const followUser = authenticatedMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const currentUserId = ctx.user._id;
    const currentUser = ctx.user;

    if (currentUserId === userId) {
      throw new Error("You cannot follow yourself");
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", currentUserId).eq("followingId", userId)
      )
      .first();

    if (existingFollow) {
      throw new Error("Already following this user");
    }

    // Check if target user exists
    const targetUser = await ctx.db.get(userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Create follow relationship
    await ctx.db.insert("follows", {
      followerId: currentUserId,
      followingId: userId,
      followedAt: Date.now(),
    });

    // Update follower count for target user
    await ctx.db.patch(userId, {
      followers: targetUser.followers + 1,
    });

    // Update following count for current user
    await ctx.db.patch(currentUserId, {
      following: currentUser.following + 1,
    });

    // Create notification for the followed user
    await ctx.db.insert("notifications", {
      userId: userId,
      senderId: currentUserId,
      type: "follow",
      title: "New Follower",
      message: `${currentUser.userName || "Someone"} started following you`,
      entityId: currentUserId,
      entityType: "user",
      isRead: false,
    });

    return { success: true };
  },
});

// Mutation to unfollow a user
export const unfollowUser = authenticatedMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const currentUserId = ctx.user._id;
    const currentUser = ctx.user;

    if (currentUserId === userId) {
      throw new Error("You cannot unfollow yourself");
    }

    // Find the follow relationship
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", currentUserId).eq("followingId", userId)
      )
      .first();

    if (!follow) {
      throw new Error("Not following this user");
    }

    // Remove follow relationship
    await ctx.db.delete(follow._id);

    // Update follower count for target user
    const targetUser = await ctx.db.get(userId);
    if (targetUser) {
      await ctx.db.patch(userId, {
        followers: Math.max(0, targetUser.followers - 1),
      });
    }

    // Update following count for current user
    await ctx.db.patch(currentUserId, {
      following: Math.max(0, currentUser.following - 1),
    });

    return { success: true };
  },
});

// Query to get user stats (posts, followers, following)
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      postsPublished: user.postsPublished,
      followers: user.followers,
      following: user.following,
    };
  },
});

// Query to search users
export const searchUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    if (searchTerm.trim().length < 2) {
      return [];
    }

    const users = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.eq(q.field("userName"), searchTerm),
          // Simple contains search for username
          q.gte(q.field("userName"), searchTerm)
        )
      )
      .take(20);

    // Return public user info only
    return users.map((user) => {
      const { emailAddress, clerkId, ...publicUser } = user;
      return publicUser;
    });
  },
});

// Mutation to update user profile
export const updateProfile = authenticatedMutation({
  args: {
    userName: v.optional(v.string()),
    bio: v.optional(v.string()),
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("other"))
    ),
    age: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = ctx.user._id;
    const user = ctx.user;

    // Validate username if provided
    if (args.userName && args.userName.trim().length < 2) {
      throw new Error("Username must be at least 2 characters");
    }

    // Check if username is already taken
    if (args.userName && args.userName !== user.userName) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_user_name", (q) => q.eq("userName", args.userName!))
        .first();

      if (existingUser) {
        throw new Error("Username is already taken");
      }
    }

    // Update user profile
    const updatedFields: any = {};
    if (args.userName !== undefined) updatedFields.userName = args.userName;
    if (args.bio !== undefined) updatedFields.bio = args.bio;
    if (args.gender !== undefined) updatedFields.gender = args.gender;
    if (args.age !== undefined) updatedFields.age = args.age;

    await ctx.db.patch(userId, updatedFields);

    return { success: true };
  },
});
