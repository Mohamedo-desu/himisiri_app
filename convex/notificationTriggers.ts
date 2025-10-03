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

/**
 * Account Status Change Notification Trigger
 * Sends notification when user's account status changes
 */
notificationTriggers.register("users", async (ctx, change) => {
  if (change.operation === "update" && change.newDoc && change.oldDoc) {
    const oldUser = change.oldDoc;
    const newUser = change.newDoc;

    // Check if account status changed
    if (oldUser.accountStatus !== newUser.accountStatus) {
      let title = "";
      let message = "";

      switch (newUser.accountStatus) {
        case "paused":
          title = "Account Paused";
          message = `Your account has been temporarily paused. ${newUser.pauseReason || "Please contact support for more information."}`;
          break;
        case "suspended":
          title = "Account Suspended";
          message =
            "Your account has been suspended. Please contact support for more information.";
          break;
        case "banned":
          title = "Account Banned";
          message =
            "Your account has been permanently banned due to violations of our community guidelines.";
          break;
        case "active":
          // Only notify if they were previously paused/suspended
          if (
            oldUser.accountStatus === "paused" ||
            oldUser.accountStatus === "suspended"
          ) {
            title = "Account Restored";
            message = "Your account has been restored and is now active.";
          }
          break;
      }

      if (title && message) {
        await ctx.scheduler.runAfter(
          0,
          internal.pushNotifications.sendNotificationWithPush,
          {
            userId: newUser._id,
            type: "account_warning",
            title,
            message,
            metadata: {
              previousStatus: oldUser.accountStatus,
              newStatus: newUser.accountStatus,
              pauseReason: newUser.pauseReason,
            },
          }
        );
      }
    }
  }
});

/**
 * Content Status Change Notification Trigger
 * Sends notification when user's content status changes
 */
notificationTriggers.register("posts", async (ctx, change) => {
  if (change.operation === "update" && change.newDoc && change.oldDoc) {
    const oldPost = change.oldDoc;
    const newPost = change.newDoc;

    // Check if post status changed
    if (oldPost.status !== newPost.status) {
      let title = "";
      let message = "";

      switch (newPost.status) {
        case "hidden":
          title = "Post Hidden";
          message =
            "Your post has been hidden due to reports. It will be reviewed by our moderation team.";
          break;
        case "removed":
          title = "Post Removed";
          message =
            "Your post has been removed for violating our community guidelines.";
          break;
        case "active":
          // Only notify if it was previously hidden or pending review
          if (
            oldPost.status === "hidden" ||
            oldPost.status === "pending_review"
          ) {
            title = "Post Approved";
            message =
              "Your post has been reviewed and approved. It's now visible to others.";
          }
          break;
      }

      if (title && message) {
        await ctx.scheduler.runAfter(
          0,
          internal.pushNotifications.sendNotificationWithPush,
          {
            userId: newPost.authorId,
            type: "system",
            title,
            message,
            entityId: newPost._id,
            entityType: "post",
            metadata: {
              previousStatus: oldPost.status,
              newStatus: newPost.status,
              postTitle:
                newPost.content?.substring(0, 50) +
                (newPost.content && newPost.content.length > 50 ? "..." : ""),
            },
          }
        );
      }
    }
  }
});

// Export the custom mutation with notification triggers enabled
export const notificationMutation = customMutation(
  rawMutation,
  customCtx(notificationTriggers.wrapDB)
);
