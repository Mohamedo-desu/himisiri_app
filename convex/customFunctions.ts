import {
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { Doc } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

/**
 * Custom query that automatically authenticates the user
 * and adds the authenticated user to the context
 */
export const authenticatedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error(
        "Authentication required. Please log in to access this resource."
      );
    }

    return {
      ctx: { ...ctx, user },
      args: {},
    };
  },
});

/**
 * Custom query that optionally authenticates the user
 * Adds the user to context if authenticated, null if not
 */
export const optionalAuthQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    return {
      ctx: { ...ctx, user },
      args: {},
    };
  },
});

/**
 * Custom mutation that automatically authenticates the user
 * and adds the authenticated user to the context
 */
export const authenticatedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error(
        "Authentication required. Please log in to perform this action."
      );
    }

    return {
      ctx: { ...ctx, user },
      args: {},
    };
  },
});

/**
 * Custom mutation that optionally authenticates the user
 * Adds the user to context if authenticated, null if not
 */
export const optionalAuthMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Still check account status if user is authenticated

    return {
      ctx: { ...ctx, user },
      args: {},
    };
  },
});

/**
 * Type definitions for the enhanced context
 */
export type AuthenticatedQueryCtx = QueryCtx & {
  user: Doc<"users">;
};

export type OptionalAuthQueryCtx = QueryCtx & {
  user: Doc<"users"> | null;
};

export type AuthenticatedMutationCtx = MutationCtx & {
  user: Doc<"users">;
};

export type OptionalAuthMutationCtx = MutationCtx & {
  user: Doc<"users"> | null;
};
