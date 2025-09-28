import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import {
  rateLimitedAuthMutationMedium,
  rateLimitedOptionalAuthQuery,
} from "./rateLimitedFunctions";
import { POST_TABLE, USER_TABLE } from "./schema";

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
    includeViewed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get blocked user IDs if user is authenticated
    let blockedUserIds: string[] = [];
    // Get viewed post IDs if user is authenticated
    let viewedPostIds: string[] = [];

    if (ctx.user) {
      const blockedByMe = await ctx.db
        .query("blockedUsers")
        .withIndex("by_blocker", (q) => q.eq("blockerId", ctx.user!._id))
        .collect();

      const blockingMe = await ctx.db
        .query("blockedUsers")
        .withIndex("by_blocked_user", (q) =>
          q.eq("blockedUserId", ctx.user!._id)
        )
        .collect();

      blockedUserIds = [
        ...blockedByMe.map((block) => block.blockedUserId),
        ...blockingMe.map((block) => block.blockerId),
      ];

      // Get posts the user has already viewed
      const viewedPosts = await ctx.db
        .query("postViews")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user!._id))
        .collect();

      viewedPostIds = viewedPosts.map((view) => view.postId);
    }

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

    const paginatedResult = await query.paginate(args.paginationOpts);

    // Filter out posts from blocked users first
    const postsFromNonBlockedUsers = paginatedResult.page.filter(
      (post: any) => !blockedUserIds.includes(post.authorId)
    );

    // Separate viewed and non-viewed posts
    const nonViewedPosts = postsFromNonBlockedUsers.filter(
      (post: any) => !viewedPostIds.includes(post._id)
    );

    const viewedPosts = postsFromNonBlockedUsers.filter((post: any) =>
      viewedPostIds.includes(post._id)
    );

    // Determine which posts to return based on availability and preferences
    let filteredPosts: any[];
    let isDoneState = paginatedResult.isDone;

    // Strategy 1: If client explicitly wants viewed posts
    if (args.includeViewed === true) {
      filteredPosts = postsFromNonBlockedUsers; // Include both viewed and non-viewed
    }
    // Strategy 2: Default behavior - prefer non-viewed, fallback to viewed
    else {
      if (nonViewedPosts.length > 0) {
        // Prefer non-viewed posts
        filteredPosts = nonViewedPosts;

        // Check if we should supplement with viewed posts to meet requested count
        const requestedCount = args.paginationOpts.numItems || 10;
        if (filteredPosts.length < requestedCount && viewedPosts.length > 0) {
          const additionalViewedPosts = viewedPosts.slice(
            0,
            requestedCount - nonViewedPosts.length
          );
          filteredPosts = [...nonViewedPosts, ...additionalViewedPosts];
        }
      } else if (viewedPosts.length > 0) {
        // Fall back to viewed posts if no non-viewed posts available
        filteredPosts = viewedPosts;
      } else {
        // No posts available from non-blocked users
        filteredPosts = [];
      }
    }

    // Create deterministic shuffle using daily seed + user ID to prevent jumpy posts
    const shuffledPosts = filteredPosts.slice();

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

        return {
          ...post,
          author,
          hasLiked,
        };
      })
    );

    return {
      ...paginatedResult,
      page: enrichedPosts,
      isDone: isDoneState && cleanShuffledPosts.length === 0,
    };
  },
});

/**
 * Check if there are non-viewed posts available for the current user
 * Useful for client-side logic to decide when to request viewed posts
 */
export const hasNonViewedPosts = rateLimitedOptionalAuthQuery({
  args: {
    type: v.optional(
      v.union(
        v.literal("confession"),
        v.literal("story"),
        v.literal("question"),
        v.literal("advice"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    // If user is not authenticated, return default values
    if (!ctx.user) {
      return {
        hasNonViewedPosts: true, // Assume there are posts for unauthenticated users
        nonViewedCount: 0,
        totalRecentPosts: 0,
      };
    }

    // Get blocked user IDs
    const blockedByMe = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker", (q) => q.eq("blockerId", ctx.user!._id))
      .collect();

    const blockingMe = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocked_user", (q) => q.eq("blockedUserId", ctx.user!._id))
      .collect();

    const blockedUserIds = [
      ...blockedByMe.map((block) => block.blockedUserId),
      ...blockingMe.map((block) => block.blockerId),
    ];

    // Get viewed post IDs
    const viewedPosts = await ctx.db
      .query("postViews")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user!._id))
      .collect();

    const viewedPostIds = viewedPosts.map((view) => view.postId);

    let query = ctx.db
      .query("posts")
      .withIndex("by_creation_time")
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .filter((q: any) => q.eq(q.field("visibility"), "public"));

    // Filter by type if specified
    if (args.type) {
      query = query.filter((q: any) => q.eq(q.field("type"), args.type));
    }

    // Get first few posts to check
    const recentPosts = await query.order("desc").take(20);

    // Check if any non-viewed posts exist from non-blocked users
    const nonViewedPosts = recentPosts.filter(
      (post: any) =>
        !blockedUserIds.includes(post.authorId) &&
        !viewedPostIds.includes(post._id)
    );

    return {
      hasNonViewedPosts: nonViewedPosts.length > 0,
      nonViewedCount: nonViewedPosts.length,
      totalRecentPosts: recentPosts.length,
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
    type: v.union(
      v.literal("confession"),
      v.literal("story"),
      v.literal("question"),
      v.literal("advice"),
      v.literal("other")
    ),
    // tags array no longer persisted; only used as input to form tagsText
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

    // Normalize tags to lowercase text string like: #tag1#tag2#
    const normalizedTags = (args.tags || [])
      ?.map((t) => (typeof t === "string" ? t.trim().toLowerCase() : t))
      .filter((t) => typeof t === "string" && t.length > 0);
    const tagsText = normalizedTags.length
      ? `#${normalizedTags.join("#")}#`.replace(/##+/g, "##").replace(/#$/, "#")
      : undefined;

    // Create the post
    const postId = await ctx.db.insert("posts", {
      authorId: ctx.user._id,
      content: args.content,
      title: args.title,
      type: args.type,
      tagsText,
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
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
      const normalized = (args.tags || [])
        ?.map((t) => (typeof t === "string" ? t.trim().toLowerCase() : t))
        .filter((t) => typeof t === "string" && t.length > 0);
      updates.tagsText = normalized.length
        ? `#${normalized.join("#")}#`.replace(/##+/g, "##").replace(/#$/, "#")
        : undefined;
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
    let blockedUserIds: string[] = [];
    if (ctx.user) {
      const [blockedByMe, blockingMe] = await Promise.all([
        ctx.db
          .query("blockedUsers")
          .withIndex("by_blocker", (q) => q.eq("blockerId", ctx.user!._id))
          .collect(),
        ctx.db
          .query("blockedUsers")
          .withIndex("by_blocked_user", (q) =>
            q.eq("blockedUserId", ctx.user!._id)
          )
          .collect(),
      ]);
      blockedUserIds = [
        ...blockedByMe.map((b) => b.blockedUserId),
        ...blockingMe.map((b) => b.blockerId),
      ];
    }

    // Fetch public active posts with pagination
    const paginatedResult = await ctx.db
      .query("posts")
      .withIndex("by_status_visibility", (q) =>
        q.eq("status", "active").eq("visibility", "public")
      )
      .paginate(args.paginationOpts);

    // Filter out blocked users + non-matching tags
    const filtered = paginatedResult.page.filter(
      (post) =>
        !blockedUserIds.includes(post.authorId) &&
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
          gender: null,
          age: null,
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

        return {
          ...post,
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
