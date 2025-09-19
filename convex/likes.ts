import { v } from "convex/values";
import { rateLimitedAuthMutationHigh } from "./rateLimitedFunctions";

/**
 * Toggle like/unlike on a post
 */
export const togglePostLike = rateLimitedAuthMutationHigh({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Get the post
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.status !== "active") {
      throw new Error("Cannot like posts that are hidden or removed");
    }

    // Check if user already liked this post
    const existingLike = await ctx.db
      .query("postLikes")
      .withIndex("by_user_post", (q: any) =>
        q.eq("userId", ctx.user._id).eq("postId", args.postId)
      )
      .unique();

    if (existingLike) {
      // Unlike: Remove the like and decrement count
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, {
        likesCount: Math.max(0, post.likesCount - 1),
      });

      return {
        success: true,
        postId: args.postId,
        action: "unliked",
        newLikesCount: Math.max(0, post.likesCount - 1),
      };
    } else {
      // Like: Add the like and increment count
      await ctx.db.insert("postLikes", {
        userId: ctx.user._id,
        postId: args.postId,
        likedAt: Date.now(),
      });

      await ctx.db.patch(args.postId, {
        likesCount: post.likesCount + 1,
      });

      return {
        success: true,
        postId: args.postId,
        action: "liked",
        newLikesCount: post.likesCount + 1,
      };
    }
  },
});

/**
 * Toggle like/unlike on a comment
 */
export const toggleCommentLike = rateLimitedAuthMutationHigh({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    if (comment.status !== "active") {
      throw new Error("Cannot like comments that are hidden or removed");
    }

    // Check if user already liked this comment
    const existingLike = await ctx.db
      .query("commentLikes")
      .withIndex("by_user_comment", (q: any) =>
        q.eq("userId", ctx.user._id).eq("commentId", args.commentId)
      )
      .unique();

    if (existingLike) {
      // Unlike: Remove the like and decrement count
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.commentId, {
        likesCount: Math.max(0, comment.likesCount - 1),
      });

      return {
        success: true,
        commentId: args.commentId,
        action: "unliked",
        newLikesCount: Math.max(0, comment.likesCount - 1),
      };
    } else {
      // Like: Add the like and increment count
      await ctx.db.insert("commentLikes", {
        userId: ctx.user._id,
        commentId: args.commentId,
        postId: comment.postId, // For easier querying
        likedAt: Date.now(),
      });

      await ctx.db.patch(args.commentId, {
        likesCount: comment.likesCount + 1,
      });

      return {
        success: true,
        commentId: args.commentId,
        action: "liked",
        newLikesCount: comment.likesCount + 1,
      };
    }
  },
});

/**
 * Toggle like/unlike on a reply
 */
export const toggleReplyLike = rateLimitedAuthMutationHigh({
  args: {
    replyId: v.id("replies"),
  },
  handler: async (ctx, args) => {
    // Get the reply
    const reply = await ctx.db.get(args.replyId);
    if (!reply) {
      throw new Error("Reply not found");
    }

    if (reply.status !== "active") {
      throw new Error("Cannot like replies that are hidden or removed");
    }

    // Check if user already liked this reply
    const existingLike = await ctx.db
      .query("replyLikes")
      .withIndex("by_user_reply", (q: any) =>
        q.eq("userId", ctx.user._id).eq("replyId", args.replyId)
      )
      .unique();

    if (existingLike) {
      // Unlike: Remove the like and decrement count
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.replyId, {
        likesCount: Math.max(0, reply.likesCount - 1),
      });

      return {
        success: true,
        replyId: args.replyId,
        action: "unliked",
        newLikesCount: Math.max(0, reply.likesCount - 1),
      };
    } else {
      // Like: Add the like and increment count
      await ctx.db.insert("replyLikes", {
        userId: ctx.user._id,
        replyId: args.replyId,
        commentId: reply.commentId, // For easier querying
        postId: reply.postId, // For easier querying
        likedAt: Date.now(),
      });

      await ctx.db.patch(args.replyId, {
        likesCount: reply.likesCount + 1,
      });

      return {
        success: true,
        replyId: args.replyId,
        action: "liked",
        newLikesCount: reply.likesCount + 1,
      };
    }
  },
});
