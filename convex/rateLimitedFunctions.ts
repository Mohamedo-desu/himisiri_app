import {
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { Doc } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { checkRateLimit, rateLimit } from "./rateLimits";
import { getAuthenticatedUser } from "./users";

/**
 * Rate-limited authenticated mutation for high-frequency operations (likes, basic interactions)
 */
export const rateLimitedAuthMutationHigh = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error(
        "Authentication required. Please log in to perform this action."
      );
    }

    // Apply rate limiting based on user ID
    await rateLimit(ctx, {
      name: "likeAction",
      key: user._id,
      throws: true,
    });

    return {
      ctx: { ...ctx, user },
      args: {},
    };
  },
});

/**
 * Rate-limited authenticated mutation for medium-frequency operations (posts, comments, replies)
 */
export const rateLimitedAuthMutationMedium = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error(
        "Authentication required. Please log in to perform this action."
      );
    }

    // Apply rate limiting based on user ID
    await rateLimit(ctx, {
      name: "createContent",
      key: user._id,
      throws: true,
    });

    return {
      ctx: { ...ctx, user },
      args: {},
    };
  },
});

/**
 * Rate-limited authenticated mutation for low-frequency operations (reports, file uploads)
 */
export const rateLimitedAuthMutationLow = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error(
        "Authentication required. Please log in to perform this action."
      );
    }

    // Apply rate limiting based on user ID
    await rateLimit(ctx, {
      name: "heavyAction",
      key: user._id,
      throws: true,
    });

    return {
      ctx: { ...ctx, user },
      args: {},
    };
  },
});

/**
 * Rate-limited authenticated mutation for account-level operations (profile updates, settings)
 */
export const rateLimitedAuthMutationAccount = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error(
        "Authentication required. Please log in to perform this action."
      );
    }

    // Apply rate limiting based on user ID
    await rateLimit(ctx, {
      name: "accountAction",
      key: user._id,
      throws: true,
    });

    return {
      ctx: { ...ctx, user },
      args: {},
    };
  },
});

/**
 * Rate-limited optional auth query for pagination and browsing
 */
export const rateLimitedOptionalAuthQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Apply rate limiting based on user ID or use global for anonymous
    const rateLimitKey = user?._id || "global";
    const { ok, retryAt } = await checkRateLimit(ctx, {
      name: "paginationQuery",
      key: rateLimitKey,
    });

    if (!ok) {
      throw new Error(
        `Rate limit exceeded for pagination queries. Try again at ${retryAt ? new Date(retryAt).toISOString() : "later"}`
      );
    }

    return {
      ctx: { ...ctx, user },
      args: {},
    };
  },
});

/**
 * Rate-limited query for public content (global rate limiting)
 */
export const rateLimitedPublicQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Apply global rate limiting for public queries
    const { ok, retryAt } = await checkRateLimit(ctx, {
      name: "publicQuery",
      key: "global",
    });

    if (!ok) {
      throw new Error(
        `Rate limit exceeded for public queries. Try again at ${retryAt ? new Date(retryAt).toISOString() : "later"}`
      );
    }

    return {
      ctx: { ...ctx, user },
      args: {},
    };
  },
});

/**
 * Type definitions for the enhanced context with rate limiting
 */
export type RateLimitedAuthMutationCtx = MutationCtx & {
  user: Doc<"users">;
};

export type RateLimitedOptionalAuthQueryCtx = QueryCtx & {
  user: Doc<"users"> | null;
};
