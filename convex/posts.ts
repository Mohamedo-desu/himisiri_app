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
    let fallbackToViewed = false;

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
        fallbackToViewed = true;
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
      metadata: {
        totalFilteredPosts: cleanShuffledPosts.length,
        nonViewedPostsCount: nonViewedPosts.length,
        viewedPostsCount: viewedPosts.length,
        blockedUsersFiltered: blockedUserIds.length,
        strategy:
          args.includeViewed === true
            ? "include_all"
            : fallbackToViewed
              ? "fallback_to_viewed"
              : "prefer_non_viewed",
        isAuthenticated: !!ctx.user,
      },
    };
  },
});

/**
 * Check if there are non-viewed posts available for the current user
 * Useful for client-side logic to decide when to request viewed posts
 */
export const hasNonViewedPosts = authenticatedQuery({
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
    // Get blocked user IDs
    const blockedByMe = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocker", (q) => q.eq("blockerId", ctx.user._id))
      .collect();

    const blockingMe = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blocked_user", (q) => q.eq("blockedUserId", ctx.user._id))
      .collect();

    const blockedUserIds = [
      ...blockedByMe.map((block) => block.blockedUserId),
      ...blockingMe.map((block) => block.blockerId),
    ];

    // Get viewed post IDs
    const viewedPosts = await ctx.db
      .query("postViews")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
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

    // Author info is only shown to the owner; all others remain anonymous
    let author = null;
    if (post.authorId === ctx.user?._id) {
      author = {
        _id: ctx.user._id,
        userName: ctx.user.userName,
        imageUrl: ctx.user.imageUrl,
        age: ctx.user.age,
        gender: ctx.user.gender,
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

/**
 * Get popular posts based on advanced engagement scoring with time decay
 */
export const getPopularPosts = rateLimitedOptionalAuthQuery({
  args: {
    limit: v.optional(v.number()),
    timeframe: v.optional(
      v.union(
        v.literal("day"),
        v.literal("week"),
        v.literal("month"),
        v.literal("all")
      )
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const timeframe = args.timeframe || "week";

    // Get blocked user IDs if user is authenticated
    let blockedUserIds: string[] = [];
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
    }

    // Calculate time threshold
    const now = Date.now();
    let timeThreshold = 0;

    switch (timeframe) {
      case "day":
        timeThreshold = now - 24 * 60 * 60 * 1000;
        break;
      case "week":
        timeThreshold = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        timeThreshold = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "all":
      default:
        timeThreshold = 0;
        break;
    }

    // Get all active posts within timeframe
    let postsQuery = ctx.db
      .query("posts")
      .withIndex("by_status", (q: any) => q.eq("status", "active"));

    if (timeframe !== "all") {
      postsQuery = postsQuery.filter((q: any) =>
        q.gte(q.field("_creationTime"), timeThreshold)
      );
    }

    const allPosts = await postsQuery.collect();

    // Filter out posts from blocked users
    const posts = allPosts.filter(
      (post: any) => !blockedUserIds.includes(post.authorId)
    );

    // Advanced engagement scoring with multiple factors
    const postsWithEngagement = await Promise.all(
      posts.map(async (post: any) => {
        // Get engagement metrics
        const likes = await ctx.db
          .query("postLikes")
          .withIndex("by_post", (q: any) => q.eq("postId", post._id))
          .collect();

        const comments = await ctx.db
          .query("comments")
          .withIndex("by_post", (q: any) => q.eq("postId", post._id))
          .collect();

        const replies = await ctx.db
          .query("replies")
          .withIndex("by_post", (q: any) => q.eq("postId", post._id))
          .collect();

        // Count unique users interacting with the post
        const uniqueUsers = new Set();
        likes.forEach((like: any) => uniqueUsers.add(like.userId));
        comments.forEach((comment: any) => uniqueUsers.add(comment.authorId));
        replies.forEach((reply: any) => uniqueUsers.add(reply.authorId));

        // Calculate time decay factor (newer posts get slight boost)
        const postAge = now - post._creationTime;
        const maxAge =
          timeframe === "day"
            ? 24 * 60 * 60 * 1000
            : timeframe === "week"
              ? 7 * 24 * 60 * 60 * 1000
              : 30 * 24 * 60 * 60 * 1000;
        const timeFactor =
          timeframe === "all" ? 1 : Math.max(0.1, 1 - postAge / maxAge);

        // Advanced scoring algorithm
        const likesScore = likes.length * 1;
        const commentsScore = comments.length * 3; // Comments are more valuable
        const repliesScore = replies.length * 2;
        const uniqueUsersScore = uniqueUsers.size * 2; // User diversity bonus
        const lengthScore = Math.min(post.content?.length || 0, 1000) / 100; // Content quality indicator

        // Velocity score (engagement rate over time)
        const hoursOld = Math.max(1, postAge / (60 * 60 * 1000));
        const velocityScore =
          (likes.length + comments.length + replies.length) / hoursOld;

        // Recency boost for very new posts (first 6 hours)
        const recencyBoost = postAge < 6 * 60 * 60 * 1000 ? 1.5 : 1;

        const baseScore =
          likesScore +
          commentsScore +
          repliesScore +
          uniqueUsersScore +
          lengthScore +
          velocityScore * 5;
        const finalScore = baseScore * timeFactor * recencyBoost;

        return {
          post,
          engagementScore: finalScore,
          metrics: {
            likes: likes.length,
            comments: comments.length,
            replies: replies.length,
            uniqueUsers: uniqueUsers.size,
            velocity: velocityScore.toFixed(2),
            timeFactor: timeFactor.toFixed(2),
          },
        };
      })
    );

    // Sort by engagement score and take top posts
    const topPosts = postsWithEngagement
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit)
      .map((item) => item.post);

    // Enrich posts with additional data
    const enrichedPosts = await Promise.all(
      topPosts.map(async (post: any) => {
        // Only show author for the current user's own posts
        let author = null;
        if (ctx.user && post.authorId === ctx.user._id) {
          author = {
            _id: ctx.user._id,
            userName: ctx.user.userName,
            imageUrl: ctx.user.imageUrl,
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
            .first();
          hasLiked = !!like;
        }

        // Get likes count
        const likesCount = await ctx.db
          .query("postLikes")
          .withIndex("by_post", (q: any) => q.eq("postId", post._id))
          .collect()
          .then((likes) => likes.length);

        return {
          ...post,
          author,
          hasLiked,
          likesCount,
        };
      })
    );

    return enrichedPosts;
  },
});

/**
 * Get trending posts (rapidly gaining engagement) with velocity-based ranking
 */
export const getTrendingPosts = rateLimitedOptionalAuthQuery({
  args: {
    limit: v.optional(v.number()),
    timeframe: v.optional(v.union(v.literal("day"), v.literal("week"))),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const timeframe = args.timeframe || "day";

    // Get blocked user IDs if user is authenticated
    let blockedUserIds: string[] = [];
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
    }

    const now = Date.now();
    const timeThreshold =
      timeframe === "day"
        ? now - 24 * 60 * 60 * 1000
        : now - 7 * 24 * 60 * 60 * 1000;

    // Get recent posts
    const allRecentPosts = await ctx.db
      .query("posts")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .filter((q: any) => q.gte(q.field("_creationTime"), timeThreshold))
      .collect();

    // Filter out posts from blocked users
    const recentPosts = allRecentPosts.filter(
      (post: any) => !blockedUserIds.includes(post.authorId)
    );

    // Calculate trending scores based on velocity
    const postsWithTrendingScore = await Promise.all(
      recentPosts.map(async (post: any) => {
        const postAge = now - post._creationTime;
        const hoursOld = Math.max(0.5, postAge / (60 * 60 * 1000));

        // Get recent engagement (last few hours)
        const recentEngagementTime = now - 6 * 60 * 60 * 1000; // Last 6 hours

        const likes = await ctx.db
          .query("postLikes")
          .withIndex("by_post", (q: any) => q.eq("postId", post._id))
          .collect();

        const comments = await ctx.db
          .query("comments")
          .withIndex("by_post", (q: any) => q.eq("postId", post._id))
          .collect();

        const replies = await ctx.db
          .query("replies")
          .withIndex("by_post", (q: any) => q.eq("postId", post._id))
          .collect();

        // Calculate recent engagement vs total engagement
        const recentLikes = likes.filter(
          (like) => like._creationTime > recentEngagementTime
        );
        const recentComments = comments.filter(
          (comment) => comment._creationTime > recentEngagementTime
        );
        const recentReplies = replies.filter(
          (reply) => reply._creationTime > recentEngagementTime
        );

        const totalEngagement =
          likes.length + comments.length * 2 + replies.length;
        const recentEngagement =
          recentLikes.length + recentComments.length * 2 + recentReplies.length;

        // Velocity score: recent engagement rate
        const velocityScore = recentEngagement / Math.max(1, hoursOld / 6); // Per 6-hour period

        // Acceleration factor: increasing engagement rate
        const accelerationFactor =
          totalEngagement > 0 ? (recentEngagement / totalEngagement) * 10 : 0;

        // Trending score combines velocity and acceleration
        const trendingScore = velocityScore + accelerationFactor;

        return {
          post,
          trendingScore,
          metrics: {
            totalEngagement,
            recentEngagement,
            velocity: velocityScore.toFixed(2),
            acceleration: accelerationFactor.toFixed(2),
          },
        };
      })
    );

    // Filter posts with meaningful trending scores and sort
    const trendingPosts = postsWithTrendingScore
      .filter((item) => item.trendingScore > 0.5) // Minimum threshold for trending
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)
      .map((item) => item.post);

    // Enrich with user data
    const enrichedPosts = await Promise.all(
      trendingPosts.map(async (post: any) => {
        // Only show author for the current user's own posts
        let author = null;
        if (ctx.user && post.authorId === ctx.user._id) {
          author = {
            _id: ctx.user._id,
            userName: ctx.user.userName,
            imageUrl: ctx.user.imageUrl,
          };
        }

        let hasLiked = false;
        if (ctx.user) {
          const like = await ctx.db
            .query("postLikes")
            .withIndex("by_user_post", (q: any) =>
              q.eq("userId", ctx.user!._id).eq("postId", post._id)
            )
            .first();
          hasLiked = !!like;
        }

        const likesCount = await ctx.db
          .query("postLikes")
          .withIndex("by_post", (q: any) => q.eq("postId", post._id))
          .collect()
          .then((likes) => likes.length);

        return {
          ...post,
          author,
          hasLiked,
          likesCount,
        };
      })
    );

    return enrichedPosts;
  },
});

/**
 * Get trending topics using advanced content analysis and engagement weighting
 */
export const getTrendingTopics = query({
  args: {
    limit: v.optional(v.number()),
    timeframe: v.optional(
      v.union(v.literal("day"), v.literal("week"), v.literal("month"))
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 6;
    const timeframe = args.timeframe || "week";

    // Calculate time threshold
    const now = Date.now();
    let timeThreshold = 0;

    switch (timeframe) {
      case "day":
        timeThreshold = now - 24 * 60 * 60 * 1000;
        break;
      case "week":
        timeThreshold = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        timeThreshold = now - 30 * 24 * 60 * 60 * 1000;
        break;
    }

    // Get recent posts within timeframe
    const recentPosts = await ctx.db
      .query("posts")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .filter((q: any) => q.gte(q.field("_creationTime"), timeThreshold))
      .collect();

    // Advanced topic extraction with weighted scoring
    const topicScores = new Map<
      string,
      { count: number; engagementScore: number }
    >();

    // Enhanced topic categories with synonyms and variations
    const topicCategories = {
      "Love & Romance": [
        "love",
        "romance",
        "dating",
        "relationship",
        "boyfriend",
        "girlfriend",
        "partner",
        "soulmate",
        "crush",
        "attraction",
      ],
      "Work & Career": [
        "work",
        "job",
        "career",
        "boss",
        "colleague",
        "office",
        "business",
        "promotion",
        "interview",
        "workplace",
        "professional",
      ],
      "Family & Home": [
        "family",
        "parents",
        "mother",
        "father",
        "siblings",
        "home",
        "house",
        "children",
        "kids",
        "baby",
        "pregnancy",
      ],
      "Mental Health": [
        "anxiety",
        "depression",
        "stress",
        "mental health",
        "therapy",
        "counseling",
        "panic",
        "overwhelmed",
        "emotional",
        "feelings",
      ],
      Education: [
        "school",
        "college",
        "university",
        "student",
        "teacher",
        "education",
        "learning",
        "study",
        "exam",
        "graduation",
      ],
      Friendship: [
        "friends",
        "friendship",
        "bestfriend",
        "social",
        "party",
        "hangout",
        "buddy",
        "companion",
      ],
      "Health & Wellness": [
        "health",
        "fitness",
        "diet",
        "exercise",
        "medical",
        "doctor",
        "hospital",
        "sick",
        "wellness",
        "body",
      ],
      "Money & Finance": [
        "money",
        "financial",
        "debt",
        "salary",
        "income",
        "expensive",
        "broke",
        "rich",
        "poor",
        "budget",
      ],
      "Life Changes": [
        "moving",
        "change",
        "future",
        "past",
        "goals",
        "dreams",
        "plans",
        "decision",
        "choice",
        "opportunity",
      ],
      "Secrets & Confessions": [
        "secret",
        "confession",
        "truth",
        "lie",
        "hidden",
        "reveal",
        "admit",
        "guilty",
        "shame",
        "regret",
      ],
    };

    // Calculate engagement scores for posts
    const postsWithEngagement = await Promise.all(
      recentPosts.map(async (post) => {
        const likes = await ctx.db
          .query("postLikes")
          .withIndex("by_post", (q: any) => q.eq("postId", post._id))
          .collect();

        const comments = await ctx.db
          .query("comments")
          .withIndex("by_post", (q: any) => q.eq("postId", post._id))
          .collect();

        const replies = await ctx.db
          .query("replies")
          .withIndex("by_post", (q: any) => q.eq("postId", post._id))
          .collect();

        // Calculate post engagement score
        const engagementScore =
          likes.length + comments.length * 2 + replies.length;
        const timeDecay = Math.max(
          0.1,
          1 - (now - post._creationTime) / timeThreshold
        );
        const weightedScore = engagementScore * timeDecay;

        return {
          post,
          engagementScore: weightedScore,
        };
      })
    );

    // Analyze content for trending topics
    postsWithEngagement.forEach(({ post, engagementScore }) => {
      const content = post.content?.toLowerCase() || "";

      // Check each topic category
      Object.entries(topicCategories).forEach(([category, keywords]) => {
        const keywordMatches = keywords.filter((keyword) =>
          content.includes(keyword.toLowerCase())
        );

        if (keywordMatches.length > 0) {
          const topicKey = category.toLowerCase();

          const current = topicScores.get(topicKey) || {
            count: 0,
            engagementScore: 0,
          };
          topicScores.set(topicKey, {
            count: current.count + 1,
            engagementScore: current.engagementScore + engagementScore,
          });
        }
      });

      // Extract hashtags if any
      const hashtags = content.match(/#\w+/g) || [];
      hashtags.forEach((tag) => {
        const cleanTag = tag.substring(1); // Remove #
        if (cleanTag.length > 2) {
          const current = topicScores.get(cleanTag) || {
            count: 0,
            engagementScore: 0,
          };
          topicScores.set(cleanTag, {
            count: current.count + 1,
            engagementScore: current.engagementScore + engagementScore,
          });
        }
      });
    });

    // Calculate final trending scores (combine frequency and engagement)
    const trendingTopics = Array.from(topicScores.entries())
      .map(([topic, data]) => ({
        topic,
        score: data.count * 0.4 + data.engagementScore * 0.6, // Weight engagement higher
        count: data.count,
        engagement: data.engagementScore,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.topic);

    // Fallback trending topics if none detected
    const fallbackTopics = [
      "love & romance",
      "work & career",
      "family & home",
      "mental health",
      "friendship",
      "secrets & confessions",
    ];

    // Return trending topics or fallback
    return trendingTopics.length > 0
      ? trendingTopics
      : fallbackTopics.slice(0, limit);
  },
});
