import {
  customCtx,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { Triggers } from "convex-helpers/server/triggers";
import { internal } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { mutation as rawMutation } from "./_generated/server";

const notificationTriggers = new Triggers<DataModel>();

/**
 * Post Like Notification Trigger
 * Sends notification when someone likes a post
 */
notificationTriggers.register("postLikes", async (ctx, change) => {
  if (change.operation === "insert" && change.newDoc) {
    const like = change.newDoc;

    // Get the post to find the author
    const post = await ctx.db.get(like.postId);
    if (!post) return;

    // Don't notify if user liked their own post
    if (post.authorId === like.userId) return;

    // Get the liker's info
    const liker = await ctx.db.get(like.userId);
    if (!liker) return;

    await ctx.scheduler.runAfter(
      0,
      internal.pushNotifications.sendNotificationWithPush,
      {
        userId: post.authorId,
        senderId: like.userId,
        type: "like",
        title: "New Like",
        message: `${liker.userName} liked your post`,
        entityId: post._id,
        entityType: "post",
        metadata: {
          postTitle:
            post.content?.substring(0, 50) +
            (post.content && post.content.length > 50 ? "..." : ""),
        },
      }
    );
  }
});

/**
 * Comment Notification Trigger
 * Sends notification when someone comments on a post
 */
notificationTriggers.register("comments", async (ctx, change) => {
  if (change.operation === "insert" && change.newDoc) {
    const comment = change.newDoc;

    // Get the post to find the author
    const post = await ctx.db.get(comment.postId);
    if (!post) return;

    // Don't notify if user commented on their own post
    if (post.authorId === comment.authorId) return;

    // Get the commenter's info
    const commenter = await ctx.db.get(comment.authorId);
    if (!commenter) return;

    await ctx.scheduler.runAfter(
      0,
      internal.pushNotifications.sendNotificationWithPush,
      {
        userId: post.authorId,
        senderId: comment.authorId,
        type: "comment",
        title: "New Comment",
        message: `${commenter.userName} commented on your post`,
        entityId: post._id,
        entityType: "post",
        metadata: {
          commentId: comment._id,
          commentContent:
            comment.content?.substring(0, 50) +
            (comment.content && comment.content.length > 50 ? "..." : ""),
        },
      }
    );
  }
});

// Export the custom mutation with notification triggers enabled
export const notificationMutation = customMutation(
  rawMutation,
  customCtx(notificationTriggers.wrapDB)
);
