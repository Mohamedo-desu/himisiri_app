import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import {
  rateLimitedAuthMutationMedium,
  rateLimitedOptionalAuthQuery,
} from "./rateLimitedFunctions";

/**
 * Get paginated comments for a specific post with replies count
 */
export const getPaginatedComments = rateLimitedOptionalAuthQuery({
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

    if (post.status !== "active") {
      throw new Error("Cannot access comments for hidden or removed posts");
    }

    // Query comments with pagination
    const paginatedResult = await ctx.db
      .query("comments")
      .withIndex("by_post", (q: any) => q.eq("postId", args.postId))
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .order("desc") // Most recent first
      .paginate(args.paginationOpts);

    // Enrich comments with additional data
    const enrichedComments = await Promise.all(
      paginatedResult.page.map(async (comment: any) => {
        // Get author info (unless anonymous and not the current user)
        let author = null;
        if (!comment.isAnonymous || comment.authorId === ctx.user?._id) {
          const authorDoc = await ctx.db.get(comment.authorId);
          if (authorDoc) {
            const userDoc = authorDoc as any;
            author = {
              _id: userDoc._id,
              userName: userDoc.userName,
              imageUrl: userDoc.imageUrl,
            };
          }
        }

        // Check if current user has liked this comment
        let hasLiked = false;
        if (ctx.user) {
          const like = await ctx.db
            .query("commentLikes")
            .withIndex("by_user_comment", (q: any) =>
              q.eq("userId", ctx.user!._id).eq("commentId", comment._id)
            )
            .unique();
          hasLiked = !!like;
        }

        return {
          ...comment,
          author,
          hasLiked,
          // repliesCount and likesCount are already in the comment document
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
export const createComment = rateLimitedAuthMutationMedium({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the post exists and is accessible
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.status !== "active") {
      throw new Error("Cannot comment on hidden or removed posts");
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
      authorId: ctx.user._id,
      content: args.content,
      likesCount: 0,
      repliesCount: 0,
      reportsCount: 0,
      status: "active",
    });

    // Update post's comment count
    await ctx.db.patch(args.postId, {
      commentsCount: post.commentsCount + 1,
    });

    return commentId;
  },
});

/**
 * Update a comment - requires authentication, ownership, and rate limiting
 */
export const updateComment = rateLimitedAuthMutationMedium({
  args: {
    commentId: v.id("comments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check ownership
    if (comment.authorId !== ctx.user._id) {
      throw new Error("You can only edit your own comments");
    }

    // Check if comment is still editable
    if (comment.status !== "active") {
      throw new Error("Cannot edit hidden or removed comments");
    }

    // Validate content length
    if (args.content.length < 1 || args.content.length > 2000) {
      throw new Error("Comment content must be between 1 and 2000 characters");
    }

    // Update the comment
    await ctx.db.patch(args.commentId, {
      content: args.content,
      editedAt: Date.now(),
    });

    return { success: true };
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

    // Get all replies to this comment and delete them
    const replies = await ctx.db
      .query("replies")
      .withIndex("by_comment", (q: any) => q.eq("commentId", args.commentId))
      .collect();

    // Delete all replies
    await Promise.all(replies.map((reply) => ctx.db.delete(reply._id)));

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

/**
 * Get comments by a specific user
 */
export const getCommentsByAuthor = authenticatedQuery({
  args: {},
  handler: async (ctx, args) => {
    // Get all active comments by the current user
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", ctx.user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();

    // Enrich comments with post and author info
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        // Get post info
        const post = await ctx.db.get(comment.postId);
        let postInfo = null;
        if (post && post.status === "active") {
          postInfo = {
            _id: post._id,
            title: post.title,
            content:
              post.content.substring(0, 100) +
              (post.content.length > 100 ? "..." : ""),
            type: post.type,
          };
        }

        // Get author info (current user)
        const author = {
          _id: ctx.user._id,
          userName: ctx.user.userName,
          imageUrl: ctx.user.imageUrl,
        };

        return {
          ...comment,
          author,
          post: postInfo,
          hasLiked: false, // For user's own comments, we don't need to check likes
          isAnonymous: false, // Since user said no anonymous users in their app
        };
      })
    );

    // Filter out comments from deleted posts
    return enrichedComments.filter((comment) => comment.post !== null);
  },
});

/**
 * Get comments by a specific user (for user profile)
 */
export const getCommentsByUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Get all active comments by the specified user
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();

    // Enrich comments with author info
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        // Get author info
        const author = await ctx.db.get(comment.authorId);
        let authorInfo = null;
        if (author) {
          authorInfo = {
            _id: author._id,
            userName: author.userName,
            imageUrl: author.imageUrl,
          };
        }

        return {
          ...comment,
          author: authorInfo,
          hasLiked: false, // For profile view, we don't need to check likes
          isAnonymous: false, // Since user said no anonymous users in their app
        };
      })
    );

    return enrichedComments;
  },
});
