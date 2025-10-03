import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";
import { authenticatedQuery } from "./customFunctions";

export const createUser = internalMutation({
  args: {
    userName: v.string(),
    emailAddress: v.string(),
    clerkId: v.string(),
    imageUrl: v.optional(v.string()),
    postsPublished: v.number(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) return;

    await ctx.db.insert("users", {
      userName: args.userName,
      emailAddress: args.emailAddress,
      clerkId: args.clerkId,
      imageUrl: args.imageUrl,
      postsPublished: args.postsPublished,
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
