import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { authenticatedMutation, optionalAuthQuery } from "./customFunctions";
import { notificationMutation } from "./notificationTriggers";
import { USER_TABLE } from "./schema";
import { getAuthenticatedUser } from "./users";

/**
 * Get paginated comments for a specific post with replies count
 */
export const getPaginatedComments = optionalAuthQuery({
  args: {
    postId: v.id("posts"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // First verify the post exists and is accessible
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Query comments with pagination
    const paginatedResult = await ctx.db
      .query("comments")
      .withIndex("by_post", (q: any) => q.eq("postId", args.postId))
      .order("desc")
      .paginate(args.paginationOpts);

    // Enrich comments with additional data
    const enrichedComments = await Promise.all(
      paginatedResult.page.map(async (comment: any) => {
        let author = null;

        const authorDoc = await ctx.db.get(comment.authorId);
        if (authorDoc) {
          const userDoc = authorDoc as USER_TABLE;
          author = {
            _id: userDoc._id,
            userName: userDoc.userName,
            imageUrl: userDoc.imageUrl,
          };
        }

        return {
          ...comment,
          author,
        };
      })
    );

    return {
      ...paginatedResult,
      page: enrichedComments,
    };
  },
});
/**
 * Create a new comment on a post
 */
export const createComment = notificationMutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Verify the post exists and is accessible
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Validate content length
    if (args.content.length < 1) {
      throw new Error("Comment content cannot be empty");
    }

    if (args.content.length > 2000) {
      throw new Error("Comment content cannot exceed 2000 characters");
    }

    // Create the comment
    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: user._id,
      content: args.content,
    });

    // Update post's comment count
    await ctx.db.patch(args.postId, {
      commentsCount: post.commentsCount + 1,
    });

    return commentId;
  },
});
/**
 * Delete a comment - requires authentication and ownership
 */
export const deleteComment = authenticatedMutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check ownership
    if (comment.authorId !== ctx.user._id) {
      throw new Error("You can only delete your own comments");
    }

    // Delete the comment
    await ctx.db.delete(args.commentId);

    // Update post's comment count
    const post = await ctx.db.get(comment.postId);
    if (post) {
      await ctx.db.patch(comment.postId, {
        commentsCount: Math.max(0, post.commentsCount - 1),
      });
    }

    return { success: true };
  },
});
