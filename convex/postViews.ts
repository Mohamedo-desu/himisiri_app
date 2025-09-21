import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

/**
 * Mark a post as viewed by the current user
 * This is called when a post comes into the viewport on the home screen
 */
export const markPostAsViewed = mutation({
  args: {
    postId: v.id("posts"),
    viewDuration: v.optional(v.number()), // How long the post was in view (in milliseconds)
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      // Don't throw error for unauthenticated users, just return silently
      // This allows guests to browse without errors
      return { success: false, reason: "Not authenticated" };
    }

    // Get the post to make sure it exists and is active
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Don't track views for hidden or removed posts
    if (post.status !== "active") {
      return { success: false, reason: "Post not active" };
    }

    // Don't track views for the author's own posts
    if (post.authorId === user._id) {
      return { success: false, reason: "Own post" };
    }

    // Check if user already viewed this post
    const existingView = await ctx.db
      .query("postViews")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .unique();

    if (existingView) {
      // Update the existing view with new data (for analytics)
      await ctx.db.patch(existingView._id, {
        viewedAt: Date.now(),
        viewDuration: args.viewDuration,
        viewCount: (existingView.viewCount || 1) + 1,
      });
      return { success: true, type: "updated", viewId: existingView._id };
    } else {
      // Create new view record
      const viewId = await ctx.db.insert("postViews", {
        userId: user._id,
        postId: args.postId,
        viewedAt: Date.now(),
        viewDuration: args.viewDuration,
        viewCount: 1,
      });

      // Increment the post's view count for new unique views only
      await ctx.db.patch(args.postId, {
        viewsCount: (post.viewsCount || 0) + 1,
      });

      return { success: true, type: "created", viewId };
    }
  },
});

/**
 * Get all post IDs that the current user has viewed
 * This is used to filter out already viewed posts from the home feed
 */
export const getUserViewedPosts = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return [];
    }

    // Get all viewed post IDs for this user
    const viewedPosts = await ctx.db
      .query("postViews")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return viewedPosts.map((view) => view.postId);
  },
});

/**
 * Check if a specific post has been viewed by the current user
 */
export const hasUserViewedPost = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return false;
    }

    // Check if user has viewed this specific post
    const existingView = await ctx.db
      .query("postViews")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .unique();

    return !!existingView;
  },
});

/**
 * Get view statistics for a post (for analytics)
 */
export const getPostViewStats = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user (only post authors or admins should see this)
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Get the post to check if user is the author
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Only allow post author to see view stats
    if (post.authorId !== user._id) {
      throw new Error("Not authorized to view stats for this post");
    }

    // Get all views for this post
    const views = await ctx.db
      .query("postViews")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    // Calculate statistics
    const totalViews = views.length;
    const totalViewTime = views.reduce(
      (sum, view) => sum + (view.viewDuration || 0),
      0
    );
    const averageViewTime = totalViews > 0 ? totalViewTime / totalViews : 0;
    const uniqueViewers = new Set(views.map((view) => view.userId)).size;

    return {
      totalViews,
      uniqueViewers,
      totalViewTime,
      averageViewTime,
      views: views.map((view) => ({
        userId: view.userId,
        viewedAt: view.viewedAt,
        viewDuration: view.viewDuration,
        viewCount: view.viewCount,
      })),
    };
  },
});

/**
 * Get recently viewed posts by the current user (for user's history)
 */
export const getUserRecentlyViewedPosts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return [];
    }

    const limit = args.limit || 50;

    // Get recently viewed posts
    const recentViews = await ctx.db
      .query("postViews")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    // Get the actual post data
    const postsWithViews = await Promise.all(
      recentViews.map(async (view) => {
        const post = await ctx.db.get(view.postId);
        return {
          post,
          viewedAt: view.viewedAt,
          viewDuration: view.viewDuration,
        };
      })
    );

    // Filter out posts that no longer exist or are not active
    return postsWithViews
      .filter((item) => item.post && item.post.status === "active")
      .map((item) => ({
        ...item.post,
        viewedAt: item.viewedAt,
        viewDuration: item.viewDuration,
      }));
  },
});
