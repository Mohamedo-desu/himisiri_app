// convex/triggers.ts
import {
  customCtx,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { Triggers } from "convex-helpers/server/triggers";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import {
  internalMutation as rawInternalMutation,
  mutation as rawMutation,
} from "./_generated/server";
import { getAuthenticatedUser } from "./users";

// Create triggers instance
const triggers = new Triggers<DataModel>();

/**
 * USER DELETION CASCADE
 */

triggers.register("users", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const userId = change.id;
    console.log(`Starting cascade delete for user ${userId}`);

    // Delete posts authored by the user (triggers post cascade)
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }

    // Delete comments authored by the user
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete likes by the user
    const likes = await ctx.db
      .query("postLikes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete push tokens for the user
    const tokens = await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const token of tokens) {
      await ctx.db.delete(token._id);
    }

    // inside triggers.register("users", ...)
    await ctx.scheduler.runAfter(0, internal.actions.deleteExternalPushTokens, {
      userId,
    });

    // Delete notifications received
    const notifsReceived = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const notif of notifsReceived) {
      await ctx.db.delete(notif._id);
    }

    // Delete notifications sent
    const notifsSent = await ctx.db
      .query("notifications")
      .withIndex("by_sender", (q) => q.eq("senderId", userId))
      .collect();
    for (const notif of notifsSent) {
      await ctx.db.delete(notif._id);
    }

    // Decrement global user count
    const userCount = await ctx.db.query("userCounts").first();
    if (userCount) {
      await ctx.db.patch(userCount._id, {
        count: Math.max(0, userCount.count - 1),
      });
    }

    console.log(`Cascade delete completed for user ${userId}`);
  }
});

/**
 * POST DELETION CASCADE
 */
triggers.register("posts", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const postId = change.id;
    console.log(`Starting cascade delete for post ${postId}`);

    // Delete comments on this post
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete likes on this post
    const likes = await ctx.db
      .query("postLikes")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete notifications related to this post
    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_entity", (q) =>
        q.eq("entityId", postId).eq("entityType", "post")
      )
      .collect();
    for (const notif of notifs) {
      await ctx.db.delete(notif._id);
    }

    console.log(`Cascade delete completed for post ${postId}`);
  }
});

/**
 * COMMENT DELETION CASCADE
 */
triggers.register("comments", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const commentId = change.id;
    const postId = change.oldDoc.postId;

    console.log(`Starting cascade delete for comment ${commentId}`);

    // Decrement parent post comment count
    const post = await ctx.db.get(postId);
    if (post) {
      await ctx.db.patch(postId, {
        commentsCount: Math.max(0, post.commentsCount - 1),
      });
    }

    // Delete notifications related to this comment
    const notifs = await ctx.db
      .query("notifications")
      .withIndex("by_entity", (q) =>
        q.eq("entityId", commentId).eq("entityType", "comment")
      )
      .collect();
    for (const notif of notifs) {
      await ctx.db.delete(notif._id);
    }

    console.log(`Cascade delete completed for comment ${commentId}`);
  }
});

/**
 * LIKE DELETION CASCADE
 * (Keeps post.likesCount accurate)
 */
triggers.register("postLikes", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const like = change.oldDoc;
    const post = await ctx.db.get(like.postId);
    if (post) {
      await ctx.db.patch(like.postId, {
        likesCount: Math.max(0, post.likesCount - 1),
      });
    }
  }
});

/**
 * APP VERSION TRIGGER
 * Sends push notifications to all devices when a new version is added.
 */
triggers.register("appVersions", async (ctx, change) => {
  if (change.operation === "insert" && change.newDoc) {
    const version = change.newDoc;
    console.log(`🚀 New app version released: ${version.version}`);

    // Fetch all push tokens
    const tokens = await ctx.db.query("pushTokens").collect();
    if (tokens.length === 0) {
      console.log(
        "No push tokens found, skipping version notification broadcast."
      );
      return;
    }

    const title = `🎉 Version ${version.version} Released!`;
    const body =
      version.releaseNotes || "A new update is available. Check it out!";
    const data = {
      version: version.version,
      type: version.type,
      downloadUrl: version.downloadUrl ?? null,
    };

    // in here just directly send all pushtokens found a push notification
    // inside triggers.register("users", ...)
    await ctx.scheduler.runAfter(0, internal.actions.sendToAllUsers, {
      body,
      title,
      data,
      tokens,
    });

    console.log(
      `✅ Sent version ${version.version} notifications to ${tokens.length} devices.`
    );
  }
});

// Export with triggers wrapped
export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
export const internalMutation = customMutation(
  rawInternalMutation,
  customCtx(triggers.wrapDB)
);

/**
 * Utility mutations for manual testing
 */
export const deleteUserCascade = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // 0. Find the user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return;

    const userId = user._id;

    await ctx.db.delete(userId);
  },
});

export const deletePostCascade = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error(
        "Authentication required. Please log in to perform this action."
      );
    }

    // Get the post
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check ownership
    if (post.authorId !== user._id) {
      throw new Error("You can only delete your own posts");
    }

    await ctx.db.delete(args.postId);
  },
});

export const deleteCommentCascade = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error(
        "Authentication required. Please log in to perform this action."
      );
    }
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check ownership
    if (comment.authorId !== user._id) {
      throw new Error("You can only delete your own comments");
    }

    await ctx.db.delete(args.commentId);
  },
});

export default triggers;
