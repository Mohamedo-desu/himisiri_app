import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";

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
