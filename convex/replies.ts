import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { authenticatedMutation, optionalAuthQuery } from "./customFunctions";
import { rateLimitedAuthMutationMedium } from "./rateLimitedFunctions";

/**
 * Create a new reply to a comment
 */
export const createReply = rateLimitedAuthMutationMedium({
  args: {
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the comment exists and is accessible
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    if (comment.status !== "active") {
      throw new Error("Cannot reply to hidden or removed comments");
    }

    // Verify the parent post is also accessible
    const post = await ctx.db.get(comment.postId);
    if (!post || post.status !== "active") {
      throw new Error("Cannot reply to comments on hidden or removed posts");
    }

    // Validate content length
    if (args.content.length < 1) {
      throw new Error("Reply content cannot be empty");
    }

    if (args.content.length > 1000) {
      throw new Error("Reply content cannot exceed 1000 characters");
    }

    // Create the reply
    const replyId = await ctx.db.insert("replies", {
      commentId: args.commentId,
      postId: comment.postId,
      authorId: ctx.user._id,
      content: args.content,
      likesCount: 0,
      reportsCount: 0,
      status: "active",
    });

    // Update comment's reply count
    await ctx.db.patch(args.commentId, {
      repliesCount: comment.repliesCount + 1,
    });

    return replyId;
  },
});

/**
 * Get paginated replies for a specific comment
 */
export const getPaginatedReplies = optionalAuthQuery({
  args: {
    commentId: v.id("comments"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // First verify the comment exists and is accessible
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    if (comment.status !== "active") {
      throw new Error("Cannot access replies for hidden or removed comments");
    }

    // Verify the parent post is also accessible
    const post = await ctx.db.get(comment.postId);
    if (!post || post.status !== "active") {
      throw new Error(
        "Cannot access replies for comments on hidden or removed posts"
      );
    }

    // Query replies with pagination
    const paginatedResult = await ctx.db
      .query("replies")
      .withIndex("by_comment", (q: any) => q.eq("commentId", args.commentId))
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .order("asc") // Chronological order for replies (oldest first)
      .paginate(args.paginationOpts);

    // Enrich replies with additional data
    const enrichedReplies = await Promise.all(
      paginatedResult.page.map(async (reply: any) => {
        // Get author info (unless anonymous and not the current user)
        let author = null;
        if (!reply.isAnonymous || reply.authorId === ctx.user?._id) {
          const authorDoc = await ctx.db.get(reply.authorId);
          if (authorDoc) {
            const userDoc = authorDoc as any;
            author = {
              _id: userDoc._id,
              userName: userDoc.userName,
              imageUrl: userDoc.imageUrl,
            };
          }
        }

        // Check if current user has liked this reply
        let hasLiked = false;
        if (ctx.user) {
          const like = await ctx.db
            .query("replyLikes")
            .withIndex("by_user_reply", (q: any) =>
              q.eq("userId", ctx.user!._id).eq("replyId", reply._id)
            )
            .unique();
          hasLiked = !!like;
        }

        return {
          ...reply,
          author,
          hasLiked,
          // likesCount is already in the reply document
        };
      })
    );

    return {
      ...paginatedResult,
      page: enrichedReplies,
    };
  },
});

/**
 * Update a reply - requires authentication and ownership
 */
export const updateReply = rateLimitedAuthMutationMedium({
  args: {
    replyId: v.id("replies"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the reply
    const reply = await ctx.db.get(args.replyId);
    if (!reply) {
      throw new Error("Reply not found");
    }

    // Check ownership
    if (reply.authorId !== ctx.user._id) {
      throw new Error("You can only edit your own replies");
    }

    // Check if reply is still editable
    if (reply.status !== "active") {
      throw new Error("Cannot edit hidden or removed replies");
    }

    // Validate content length
    if (args.content.length < 1 || args.content.length > 1000) {
      throw new Error("Reply content must be between 1 and 1000 characters");
    }

    // Update the reply
    await ctx.db.patch(args.replyId, {
      content: args.content,
      editedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a reply - requires authentication and ownership
 */
export const deleteReply = authenticatedMutation({
  args: {
    replyId: v.id("replies"),
  },
  handler: async (ctx, args) => {
    // Get the reply
    const reply = await ctx.db.get(args.replyId);
    if (!reply) {
      throw new Error("Reply not found");
    }

    // Check ownership
    if (reply.authorId !== ctx.user._id) {
      throw new Error("You can only delete your own replies");
    }

    // Delete the reply
    await ctx.db.delete(args.replyId);

    // Update comment's reply count
    const comment = await ctx.db.get(reply.commentId);
    if (comment) {
      await ctx.db.patch(reply.commentId, {
        repliesCount: Math.max(0, comment.repliesCount - 1),
      });
    }

    return { success: true };
  },
});
