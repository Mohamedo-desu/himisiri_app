import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

/**
 * Admin Moderation Utils
 *
 * These functions help manage automatically triggered moderation actions
 */

/**
 * Get users that were automatically paused due to reports
 */
export const getAutoPausedUsers = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Only admins should access this
    // You can add role checking here if you have admin roles

    const pausedUsers = await ctx.db
      .query("users")
      .withIndex("by_account_status", (q) => q.eq("accountStatus", "paused"))
      .filter((q) => q.neq(q.field("pauseReason"), undefined))
      .collect();

    // Get report counts for each user
    const usersWithReports = await Promise.all(
      pausedUsers.map(async (user) => {
        const reports = await ctx.db
          .query("reportedUsers")
          .withIndex("by_reported_user", (q) =>
            q.eq("reportedUserId", user._id)
          )
          .filter((q) => q.eq(q.field("status"), "pending"))
          .collect();

        return {
          ...user,
          pendingReports: reports.length,
          reports: reports,
        };
      })
    );

    return usersWithReports;
  },
});

/**
 * Get content that was automatically hidden due to reports
 */
export const getAutoHiddenContent = query({
  args: {
    contentType: v.optional(v.union(v.literal("posts"), v.literal("comments"))),
  },
  handler: async (ctx, { contentType = "posts" }) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    if (contentType === "posts") {
      const hiddenPosts = await ctx.db
        .query("posts")
        .withIndex("by_status", (q) => q.eq("status", "pending_review"))
        .filter((q) => q.neq(q.field("moderatorNotes"), undefined))
        .collect();

      // Get report counts for each post
      const postsWithReports = await Promise.all(
        hiddenPosts.map(async (post) => {
          const reports = await ctx.db
            .query("reportedContents")
            .withIndex("by_content", (q) => q.eq("contentId", post._id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

          const author = await ctx.db.get(post.authorId);

          return {
            ...post,
            pendingReports: reports.length,
            reports: reports,
            author: author
              ? {
                  _id: author._id,
                  userName: (author as any).userName,
                  imageUrl: (author as any).imageUrl,
                }
              : null,
          };
        })
      );

      return postsWithReports;
    } else {
      const hiddenComments = await ctx.db
        .query("comments")
        .withIndex("by_status", (q) => q.eq("status", "pending_review"))
        .filter((q) => q.neq(q.field("moderatorNotes"), undefined))
        .collect();

      // Get report counts for each comment
      const commentsWithReports = await Promise.all(
        hiddenComments.map(async (comment) => {
          const reports = await ctx.db
            .query("reportedContents")
            .withIndex("by_content", (q) => q.eq("contentId", comment._id))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();

          const author = await ctx.db.get(comment.authorId);

          return {
            ...comment,
            pendingReports: reports.length,
            reports: reports,
            author: author
              ? {
                  _id: author._id,
                  userName: (author as any).userName,
                  imageUrl: (author as any).imageUrl,
                }
              : null,
          };
        })
      );

      return commentsWithReports;
    }
  },
});

/**
 * Manually restore a user's account (admin action)
 */
export const restoreUserAccount = mutation({
  args: {
    userId: v.id("users"),
    adminNote: v.string(),
  },
  handler: async (ctx, { userId, adminNote }) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Add admin role checking here

    const targetUser = await ctx.db.get(userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    if (targetUser.accountStatus !== "paused") {
      throw new Error("User is not paused");
    }

    // Restore user account
    await ctx.db.patch(userId, {
      accountStatus: "active",
      pausedAt: undefined,
      pauseReason: undefined,
    });

    // Mark all pending reports against this user as reviewed
    const pendingReports = await ctx.db
      .query("reportedUsers")
      .withIndex("by_reported_user", (q) => q.eq("reportedUserId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    for (const report of pendingReports) {
      await ctx.db.patch(report._id, {
        status: "dismissed",
        adminNotes: `User account restored by admin. Reason: ${adminNote}`,
        reviewedBy: user._id,
        reviewedAt: Date.now(),
      });
    }

    // Restore user's posts that were hidden
    const hiddenPosts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .filter((q) => q.eq(q.field("status"), "pending_review"))
      .collect();

    for (const post of hiddenPosts) {
      await ctx.db.patch(post._id, {
        status: "active",
        moderatorNotes: `Restored by admin along with user account. ${adminNote}`,
      });
    }

    return {
      success: true,
      restoredPosts: hiddenPosts.length,
      dismissedReports: pendingReports.length,
    };
  },
});

/**
 * Manually restore content (admin action)
 */
export const restoreContent = mutation({
  args: {
    contentId: v.string(),
    contentType: v.union(v.literal("post"), v.literal("comment")),
    adminNote: v.string(),
  },
  handler: async (ctx, { contentId, contentType, adminNote }) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Add admin role checking here

    if (contentType === "post") {
      const post = await ctx.db.get(contentId as any);
      if (!post || (post as any).status !== "pending_review") {
        throw new Error("Post not found or not under review");
      }

      await ctx.db.patch(contentId as any, {
        status: "active",
        moderatorNotes: `Content restored by admin. Reason: ${adminNote}`,
      });
    } else {
      const comment = await ctx.db.get(contentId as any);
      if (!comment || (comment as any).status !== "pending_review") {
        throw new Error("Comment not found or not under review");
      }

      await ctx.db.patch(contentId as any, {
        status: "active",
        moderatorNotes: `Content restored by admin. Reason: ${adminNote}`,
      });
    }

    // Dismiss all pending reports for this content
    const pendingReports = await ctx.db
      .query("reportedContents")
      .withIndex("by_content", (q) => q.eq("contentId", contentId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    for (const report of pendingReports) {
      await ctx.db.patch(report._id, {
        status: "dismissed",
        adminNotes: `Content restored by admin. Reason: ${adminNote}`,
        reviewedBy: user._id,
        reviewedAt: Date.now(),
      });
    }

    return {
      success: true,
      dismissedReports: pendingReports.length,
    };
  },
});

/**
 * Get moderation dashboard stats
 */
export const getModerationStats = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Count various moderation metrics
    const [
      pausedUsers,
      pendingUserReports,
      pendingContentReports,
      hiddenPosts,
      hiddenComments,
    ] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_account_status", (q) => q.eq("accountStatus", "paused"))
        .collect(),
      ctx.db
        .query("reportedUsers")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect(),
      ctx.db
        .query("reportedContents")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect(),
      ctx.db
        .query("posts")
        .withIndex("by_status", (q) => q.eq("status", "pending_review"))
        .collect(),
      ctx.db
        .query("comments")
        .withIndex("by_status", (q) => q.eq("status", "pending_review"))
        .collect(),
    ]);

    return {
      pausedUsersCount: pausedUsers.length,
      pendingUserReports: pendingUserReports.length,
      pendingContentReports: pendingContentReports.length,
      hiddenPostsCount: hiddenPosts.length,
      hiddenCommentsCount: hiddenComments.length,
      totalPendingReviews:
        hiddenPosts.length + hiddenComments.length + pausedUsers.length,
    };
  },
});
