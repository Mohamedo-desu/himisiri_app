import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import {
  authenticatedMutation,
  authenticatedQuery,
  optionalAuthQuery,
} from "./customFunctions";
import {
  rateLimitedAuthMutationMedium,
  rateLimitedOptionalAuthQuery,
} from "./rateLimitedFunctions";
import { POST_TABLE, USER_TABLE } from "./schema";

const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const phonePattern = /(\+?\d{1,4}[\s-]?)?(\(?\d{1,4}\)?[\s-]?)?[\d\s-]{7,10}/g;
const addressPattern = /\d+\s[A-z]+\s[A-z]+/g;
const urlPattern =
  /(?:https?:\/\/|www\.|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:[^\s]*)/gi;
const ccnPattern = /\b(?:\d[ -]*?){13,16}\b/g;
const ssnPattern = /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g;

/**
 * Get paginated posts for the authenticated user
 */
export const getMyPosts = authenticatedQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // ctx.user is automatically available and guaranteed to exist
    let query = ctx.db
      .query("posts")
      .withIndex("by_author", (q: any) => q.eq("authorId", ctx.user._id));

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
export const getPaginatedPosts = optionalAuthQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("private"),
        v.literal("friends_only")
      )
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("posts");

    // Filter by visibility if specified
    if (args.visibility) {
      query = query.filter((q: any) =>
        q.eq(q.field("visibility"), args.visibility)
      );
    }

    const paginatedResult = await query.paginate(args.paginationOpts);

    // Create deterministic shuffle using daily seed + user ID to prevent jumpy posts
    const shuffledPosts = paginatedResult.page.slice();

    // Use current date + user ID as seed for consistent daily ordering per user
    const today = new Date();
    const baseSeed =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();

    // Add user-specific component to seed for personalized but stable ordering
    // Use a robust string hash to avoid NaN from non-hex characters in IDs
    const userSeed = ctx.user
      ? Array.from(ctx.user._id).reduce((hash, ch) => {
          return ((hash << 5) - hash + ch.charCodeAt(0)) >>> 0; // 32-bit unsigned hash
        }, 0)
      : 0;
    const dailySeed = baseSeed + userSeed;

    // Seeded random function for deterministic shuffle
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    // Deterministic Durstenfeld shuffle with daily seed (guarding against invalid indices)
    for (let i = shuffledPosts.length - 1; i > 0; i--) {
      const rand = seededRandom(dailySeed + i);
      const j = Number.isFinite(rand) ? Math.floor(rand * (i + 1)) : 0;
      const temp = shuffledPosts[i];
      shuffledPosts[i] = shuffledPosts[j];
      shuffledPosts[j] = temp;
    }

    // Filter out any holes or accidental non-object entries caused by bad indices
    const cleanShuffledPosts = shuffledPosts.filter(
      (p: any): p is POST_TABLE => p && typeof p === "object" && "_id" in p
    );

    // Enrich posts with additional data
    const enrichedPosts = await Promise.all(
      cleanShuffledPosts.map(async (post: POST_TABLE) => {
        let author = null;

        const authorDoc = await ctx.db.get(post.authorId);
        if (authorDoc) {
          const userDoc = authorDoc as USER_TABLE;
          author = {
            _id: userDoc._id,
            userName: userDoc.userName,
            imageUrl: userDoc.imageUrl,
          };
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

        const cleanedContent = post.content
          .replace(emailPattern, "[***]")
          .replace(phonePattern, "[***]")
          .replace(addressPattern, "[***]")
          .replace(urlPattern, "[***]")
          .replace(ccnPattern, "[***]")
          .replace(ssnPattern, "[***]");

        return {
          ...post,
          content: cleanedContent,
          author,
          hasLiked,
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
export const createPost = authenticatedMutation({
  args: {
    content: v.string(),
    title: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    visibility: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("friends_only")
    ),
    imageUrl: v.optional(v.string()),
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

    // Normalize tags array to a single string like: #tag1#tag2#
    const normalizedTags = (args.tags || [])
      .filter((t) => typeof t === "string" && t.trim().length > 0) // keep only non-empty strings
      .map((t) => t.trim().toLowerCase()); // lowercase & trim

    const tagsText =
      normalizedTags.length > 0
        ? `#${normalizedTags.join("#")}#` // join with single # separators
        : undefined;

    // Create the post
    const postId = await ctx.db.insert("posts", {
      authorId: ctx.user._id,
      content: args.content,
      title: args.title,
      tagsText,
      likesCount: 0,
      commentsCount: 0,

      visibility: args.visibility,
    });

    // Update user's post count
    await ctx.db.patch(ctx.user._id, {
      postsPublished: ctx.user.postsPublished + 1,
    });

    return postId;
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
export const updatePost = rateLimitedAuthMutationMedium({
  args: {
    postId: v.id("posts"),
    content: v.optional(v.string()),
    title: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
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

    const updates: Partial<Doc<"posts">> = {};

    if (args.visibility !== undefined) {
      updates.visibility = args.visibility;
    }

    // Update the post
    await ctx.db.patch(args.postId, updates);

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

    // Get author info for all posts (consistent with home screen)
    let author = null;
    const authorDoc = await ctx.db.get(post.authorId);
    if (authorDoc) {
      const userDoc = authorDoc as any;
      author = {
        _id: userDoc._id,
        userName: userDoc.userName,
        imageUrl: userDoc.imageUrl,
        age: userDoc.age,
        gender: userDoc.gender,
      };
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

    const cleanedContent = post.content
      .replace(emailPattern, "[***]")
      .replace(phonePattern, "[***]")
      .replace(addressPattern, "[***]")
      .replace(urlPattern, "[***]")
      .replace(ccnPattern, "[***]")
      .replace(ssnPattern, "[***]");

    return {
      ...post,
      content: cleanedContent,
      author,
      hasLiked,
    };
  },
});

export const searchByTag = rateLimitedOptionalAuthQuery({
  args: { tag: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const raw = args.tag.trim().toLowerCase();

    if (!raw || raw === "#") {
      return { page: [], isDone: true, continueCursor: "" };
    }

    // Normalize the tag so "#sad" always becomes "#sad#"
    let normalized = raw.startsWith("#") ? raw : `#${raw}`;

    // Get blocked user IDs

    // Fetch public active posts with pagination
    const paginatedResult = await ctx.db
      .query("posts")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .paginate(args.paginationOpts);

    // Filter out non-matching tags
    const filtered = paginatedResult.page.filter(
      (post) =>
        typeof post.tagsText === "string" &&
        post.tagsText.toLowerCase().includes(normalized)
    );

    // Enrich posts
    const enriched = await Promise.all(
      filtered.map(async (post) => {
        // Fetch actual author info (not just ctx.user)
        const author = (await ctx.db.get(post.authorId)) ?? {
          _id: post.authorId,
          userName: "Unknown",
          imageUrl: null,
        };

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

        const cleanedContent = post.content
          .replace(emailPattern, "[***]")
          .replace(phonePattern, "[***]")
          .replace(addressPattern, "[***]")
          .replace(urlPattern, "[***]")
          .replace(ccnPattern, "[***]")
          .replace(ssnPattern, "[***]");

        return {
          ...post,
          content: cleanedContent,
          author,
          hasLiked,
        };
      })
    );

    return {
      ...paginatedResult,
      page: enriched,
      continueCursor: paginatedResult.continueCursor || "",
    };
  },
});
