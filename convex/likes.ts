import { v } from "convex/values";
import { notificationMutation } from "./notificationTriggers";
import { getAuthenticatedUser } from "./users";

/**
 * Toggle like/unlike on a post
 */
export const togglePostLike = notificationMutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }

    // Check account status
    if (user.accountStatus === "paused") {
      throw new Error(
        "Your account has been temporarily paused due to multiple reports. Please contact support."
      );
    }

    if (user.accountStatus === "suspended") {
      throw new Error(
        "Your account has been suspended. Please contact support."
      );
    }

    if (user.accountStatus === "banned") {
      throw new Error("Your account has been permanently banned.");
    }
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
        q.eq("userId", user._id).eq("postId", args.postId)
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
        userId: user._id,
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
