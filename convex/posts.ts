import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import {
  rateLimitedAuthMutationMedium,
  rateLimitedOptionalAuthQuery,
} from "./rateLimitedFunctions";

/**
 * Get paginated posts for the authenticated user
 */
export const getMyPosts = authenticatedQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(v.literal("active"), v.literal("hidden"), v.literal("removed"))
    ),
  },
  handler: async (ctx, args) => {
    // ctx.user is automatically available and guaranteed to exist
    let query = ctx.db
      .query("posts")
      .withIndex("by_author", (q: any) => q.eq("authorId", ctx.user._id));

    // Filter by status if specified, otherwise show all statuses
    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }

    const paginatedResult = await query
      .order("desc") // Most recent first
      .paginate(args.paginationOpts);

    // Enrich posts with additional data
    const enrichedPosts = await Promise.all(
      paginatedResult.page.map(async (post: any) => {
        // Always show author info for own posts
        const author = {
          _id: ctx.user._id,
          userName: ctx.user.userName,
          imageUrl: ctx.user.imageUrl,
        };

        // Check if user has liked their own post
        const like = await ctx.db
          .query("postLikes")
          .withIndex("by_user_post", (q: any) =>
            q.eq("userId", ctx.user._id).eq("postId", post._id)
          )
          .unique();
        const hasLiked = !!like;

        return {
          ...post,
          author,
          hasLiked,
          // likesCount and commentsCount are already in the post document
        };
      })
    );

    return {
      ...paginatedResult,
      page: enrichedPosts,
    };
  },
});

/**
 * Get paginated posts with likes and comments count
 */
export const getPaginatedPosts = rateLimitedOptionalAuthQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    type: v.optional(
      v.union(
        v.literal("confession"),
        v.literal("story"),
        v.literal("question"),
        v.literal("advice"),
        v.literal("other")
      )
    ),
    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("private"),
        v.literal("friends_only")
      )
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("posts")
      .withIndex("by_creation_time") // Use creation time for chronological order
      .filter((q: any) => q.eq(q.field("status"), "active"));

    // Filter by type if specified
    if (args.type) {
      query = query.filter((q: any) => q.eq(q.field("type"), args.type));
    }

    // Filter by visibility if specified
    if (args.visibility) {
      query = query.filter((q: any) =>
        q.eq(q.field("visibility"), args.visibility)
      );
    } else {
      // Default to public posts only if no visibility specified
      query = query.filter((q: any) => q.eq(q.field("visibility"), "public"));
    }

    const paginatedResult = await query
      .order("desc") // Most recent first
      .paginate(args.paginationOpts);

    // Enrich posts with additional data
    const enrichedPosts = await Promise.all(
      paginatedResult.page.map(async (post: any) => {
        // Get author info (unless anonymous and not the current user)
        let author = null;
        if (!post.isAnonymous || post.authorId === ctx.user?._id) {
          const authorDoc = await ctx.db.get(post.authorId);
          if (authorDoc) {
            // Since post.authorId is guaranteed to be a user ID, this should be a user
            const userDoc = authorDoc as any;
            author = {
              _id: userDoc._id,
              userName: userDoc.userName,
              imageUrl: userDoc.imageUrl,
            };
          }
        }

        // Check if current user has liked this post
        let hasLiked = false;
        if (ctx.user) {
          const like = await ctx.db
            .query("postLikes")
            .withIndex("by_user_post", (q: any) =>
              q.eq("userId", ctx.user!._id).eq("postId", post._id)
            )
            .unique();
          hasLiked = !!like;
        }

        return {
          ...post,
          author,
          hasLiked,
          // likesCount and commentsCount are already in the post document
        };
      })
    );

    return {
      ...paginatedResult,
      page: enrichedPosts,
    };
  },
});

/**
 * Create a new post - requires authentication and rate limiting
 */
export const createPost = rateLimitedAuthMutationMedium({
  args: {
    content: v.string(),
    title: v.optional(v.string()),
    type: v.union(
      v.literal("confession"),
      v.literal("story"),
      v.literal("question"),
      v.literal("advice"),
      v.literal("other")
    ),
    isAnonymous: v.boolean(),
    tags: v.optional(v.array(v.string())),
    visibility: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("friends_only")
    ),
    imageUrl: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // ctx.user is automatically available and guaranteed to exist

    // Validate content length
    if (args.content.length < 10) {
      throw new Error("Post content must be at least 10 characters long");
    }

    if (args.content.length > 5000) {
      throw new Error("Post content cannot exceed 5000 characters");
    }

    // Create the post
    const postId = await ctx.db.insert("posts", {
      authorId: ctx.user._id,
      content: args.content,
      title: args.title,
      type: args.type,
      tags: args.tags,
      likesCount: 0,
      commentsCount: 0,
      reportsCount: 0,
      status: "active",
      visibility: args.visibility,
      imageUrl: args.imageUrl,
      storageId: args.storageId,
    });

    // Update user's post count
    await ctx.db.patch(ctx.user._id, {
      postsPublished: ctx.user.postsPublished + 1,
    });

    return postId;
  },
});

/**
 * Update a post - requires authentication, ownership, and rate limiting
 */
export const updatePost = rateLimitedAuthMutationMedium({
  args: {
    postId: v.id("posts"),
    content: v.optional(v.string()),
    title: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("private"),
        v.literal("friends_only")
      )
    ),
  },
  handler: async (ctx, args) => {
    // Get the post
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check ownership
    if (post.authorId !== ctx.user._id) {
      throw new Error("You can only edit your own posts");
    }

    // Check if post is still editable
    if (post.status !== "active") {
      throw new Error("Cannot edit posts that are hidden or removed");
    }

    // Prepare update object
    const updates: Partial<Doc<"posts">> = {
      editedAt: Date.now(),
    };

    if (args.content !== undefined) {
      if (args.content.length < 10 || args.content.length > 5000) {
        throw new Error("Post content must be between 10 and 5000 characters");
      }
      updates.content = args.content;
    }

    if (args.title !== undefined) {
      updates.title = args.title;
    }

    if (args.tags !== undefined) {
      updates.tags = args.tags;
    }

    if (args.visibility !== undefined) {
      updates.visibility = args.visibility;
    }

    // Update the post
    await ctx.db.patch(args.postId, updates);

    return { success: true };
  },
});

/**
 * Delete a post - requires authentication and ownership
 */
export const deletePost = authenticatedMutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Get the post
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check ownership
    if (post.authorId !== ctx.user._id) {
      throw new Error("You can only delete your own posts");
    }

    // Delete the post
    await ctx.db.delete(args.postId);

    // Update user's post count
    await ctx.db.patch(ctx.user._id, {
      postsPublished: Math.max(0, ctx.user.postsPublished - 1),
    });

    return { success: true };
  },
});

/**
 * Get a single post by ID with detailed information
 */
export const getPostById = rateLimitedOptionalAuthQuery({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Get the post
    const post = await ctx.db.get(args.postId);

    if (!post) {
      throw new Error("Post not found");
    }

    // Check if post is accessible
    if (post.status !== "active") {
      // Only allow author to view hidden posts
      if (!ctx.user || post.authorId !== ctx.user._id) {
        throw new Error("Post not found or not accessible");
      }
    }

    // Check visibility permissions
    if (post.visibility === "private") {
      if (!ctx.user || post.authorId !== ctx.user._id) {
        throw new Error("Private post not accessible");
      }
    }
    // For friends_only, we'd need to implement friendship logic
    // For now, treat it as public if user is authenticated
    if (post.visibility === "friends_only" && !ctx.user) {
      throw new Error("Authentication required to view this post");
    }

    // Get author info (unless anonymous and not the current user)
    let author = null;
    if (post.authorId === ctx.user?._id) {
      // Always show author info for own posts
      author = {
        _id: ctx.user._id,
        userName: ctx.user.userName,
        imageUrl: ctx.user.imageUrl,
      };
    } else {
      const authorDoc = await ctx.db.get(post.authorId);
      if (authorDoc) {
        const userDoc = authorDoc as any;
        author = {
          _id: userDoc._id,
          userName: userDoc.userName,
          imageUrl: userDoc.imageUrl,
        };
      }
    }

    // Check if current user has liked this post
    let hasLiked = false;
    if (ctx.user) {
      const like = await ctx.db
        .query("postLikes")
        .withIndex("by_user_post", (q: any) =>
          q.eq("userId", ctx.user!._id).eq("postId", post._id)
        )
        .unique();
      hasLiked = !!like;
    }

    return {
      ...post,
      author,
      hasLiked,
    };
  },
});

/**
 * Get posts by a specific author
 */
export const getPostsByAuthor = query({
  args: {
    authorId: v.id("users"),
  },
  handler: async (ctx, { authorId }) => {
    // Get all active posts by the author
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", authorId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();

    // Get author info
    const author = await ctx.db.get(authorId);
    if (!author) {
      return [];
    }

    // Return posts with author info
    return posts.map((post) => ({
      ...post,
      author: {
        _id: author._id,
        userName: author.userName,
        imageUrl: author.imageUrl,
      },
      hasLiked: false, // We don't track likes for this simple view
    }));
  },
});

/**
 * Get posts that the current user has liked
 */
export const getLikedPosts = authenticatedQuery({
  args: {},
  handler: async (ctx, args) => {
    // Get all likes by the current user
    const userLikes = await ctx.db
      .query("postLikes")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .order("desc")
      .collect();

    // Get all the posts that were liked
    const likedPosts = await Promise.all(
      userLikes.map(async (like) => {
        const post = await ctx.db.get(like.postId);
        if (!post || post.status !== "active") {
          return null;
        }

        // Get author info
        let author = null;
        const authorDoc = await ctx.db.get(post.authorId);
        if (authorDoc) {
          const userDoc = authorDoc as any;
          author = {
            _id: userDoc._id,
            userName: userDoc.userName,
            imageUrl: userDoc.imageUrl,
          };
        }

        return {
          ...post,
          author,
          hasLiked: true, // Always true since these are liked posts
        };
      })
    );

    // Filter out null posts and return
    return likedPosts.filter((post) => post !== null);
  },
});
