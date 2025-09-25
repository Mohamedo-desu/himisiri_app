import {
  customCtx,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { Triggers } from "convex-helpers/server/triggers";
import { DataModel } from "./_generated/dataModel";
import { mutation as rawMutation } from "./_generated/server";

const triggers = new Triggers<DataModel>();

/**
 * User Deletion Trigger
 *
 * When a user is deleted, this trigger:
 * 1. Deletes all user-created content (posts, comments, replies)
 * 2. Deletes all user interactions (likes, push tokens)
 * 3. Deletes user-initiated reports (preserving reports against the user where possible)
 * 4. Updates user counts
 */
triggers.register("users", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const userId = change.id;
    const deletedUser = change.oldDoc;

    console.log(
      `Starting user deletion cascade for user ${userId}: ${deletedUser.userName}`
    );

    // =====================================================
    // DELETE USER-CREATED CONTENT
    // =====================================================

    // 1. Delete all posts/confessions by this user
    const userPosts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();

    for (const post of userPosts) {
      await ctx.db.delete(post._id);
    }
    console.log(`Deleted ${userPosts.length} posts for user ${userId}`);

    // 2. Delete all comments by this user
    const userComments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();

    for (const comment of userComments) {
      await ctx.db.delete(comment._id);
    }
    console.log(`Deleted ${userComments.length} comments for user ${userId}`);

    // =====================================================
    // DELETE USER INTERACTIONS
    // =====================================================

    // 4. Delete all post likes by this user
    const userPostLikes = await ctx.db
      .query("postLikes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const like of userPostLikes) {
      await ctx.db.delete(like._id);
    }
    console.log(
      `Deleted ${userPostLikes.length} post likes for user ${userId}`
    );

    // 5. Delete all comment likes by this user
    const userCommentLikes = await ctx.db
      .query("commentLikes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const like of userCommentLikes) {
      await ctx.db.delete(like._id);
    }
    console.log(
      `Deleted ${userCommentLikes.length} comment likes for user ${userId}`
    );

    // 7. Delete all push tokens for this user
    const userPushTokens = await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const token of userPushTokens) {
      await ctx.db.delete(token._id);
    }
    console.log(
      `Deleted ${userPushTokens.length} push tokens for user ${userId}`
    );

    // =====================================================
    // HANDLE REPORT TABLES - DELETE USER-INITIATED REPORTS
    // =====================================================

    // =====================================================
    // UPDATE USER COUNTS
    // =====================================================

    // 13. Decrement total user count
    const userCount = await ctx.db.query("userCounts").first();
    if (userCount) {
      await ctx.db.patch(userCount._id, {
        count: Math.max(0, userCount.count - 1),
      });
      console.log(`Decremented user count to ${userCount.count - 1}`);
    }

    console.log(
      `User deletion cascade completed for user ${userId}: ${deletedUser.userName}`
    );
  }
});

/**
 * Post Deletion Trigger
 *
 * When a post is deleted, this trigger:
 * 1. Deletes all related comments and replies
 * 2. Deletes all related likes
 * 3. Deletes all related reports
 */
triggers.register("posts", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const postId = change.id;
    const deletedPost = change.oldDoc;

    console.log(`Starting post deletion cascade for post ${postId}`);

    // 1. Delete all comments on this post (which will cascade to replies)
    const postComments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();

    for (const comment of postComments) {
      await ctx.db.delete(comment._id);
    }
    console.log(`Deleted ${postComments.length} comments for post ${postId}`);

    // 2. Delete all likes on this post
    const postLikes = await ctx.db
      .query("postLikes")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();

    for (const like of postLikes) {
      await ctx.db.delete(like._id);
    }
    console.log(`Deleted ${postLikes.length} likes for post ${postId}`);

    console.log(`Post deletion cascade completed for post ${postId}`);
  }
});

/**
 * Comment Deletion Trigger
 *
 * When a comment is deleted, this trigger:
 * 1. Deletes all related replies
 * 2. Deletes all related likes
 * 3. Deletes all related reports
 * 4. Decrements the parent post's comment count
 */
triggers.register("comments", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const commentId = change.id;
    const deletedComment = change.oldDoc;
    const postId = deletedComment.postId;

    console.log(`Starting comment deletion cascade for comment ${commentId}`);

    // 2. Delete all likes on this comment
    const commentLikes = await ctx.db
      .query("commentLikes")
      .withIndex("by_comment", (q) => q.eq("commentId", commentId))
      .collect();

    for (const like of commentLikes) {
      await ctx.db.delete(like._id);
    }
    console.log(
      `Deleted ${commentLikes.length} likes for comment ${commentId}`
    );

    // 4. Decrement parent post's comment count
    const parentPost = await ctx.db.get(postId);
    if (parentPost) {
      await ctx.db.patch(postId, {
        commentsCount: Math.max(0, parentPost.commentsCount - 1),
      });
      console.log(`Decremented comment count for post ${postId}`);
    }

    console.log(`Comment deletion cascade completed for comment ${commentId}`);
  }
});

/**
 * Like Deletion Triggers
 *
 * When likes are deleted, update the corresponding content's like count
 */
triggers.register("postLikes", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const deletedLike = change.oldDoc;
    const post = await ctx.db.get(deletedLike.postId);
    if (post) {
      await ctx.db.patch(deletedLike.postId, {
        likesCount: Math.max(0, post.likesCount - 1),
      });
    }
  }
});

triggers.register("commentLikes", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const deletedLike = change.oldDoc;
    const comment = await ctx.db.get(deletedLike.commentId);
    if (comment) {
      await ctx.db.patch(deletedLike.commentId, {
        likesCount: Math.max(0, comment.likesCount - 1),
      });
    }
  }
});

// Export the custom mutation with triggers enabled
export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
