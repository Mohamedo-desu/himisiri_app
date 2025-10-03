import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get unread notification count for badge
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return 0;
    }

    const unreadCount = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    return unreadCount.length;
  },
});

// Get notifications for a user with pagination
export const getUserNotifications = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const result = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    // Enrich notifications with sender information
    const enrichedNotifications = await Promise.all(
      result.page.map(async (notification) => {
        let sender = null;
        if (notification.senderId) {
          sender = await ctx.db.get(notification.senderId);
        }

        return {
          ...notification,
          sender: sender
            ? {
                _id: sender._id,
                userName: sender.userName,
                imageUrl: sender.imageUrl,
              }
            : null,
        };
      })
    );

    return {
      ...result,
      page: enrichedNotifications,
      continueCursor: result.continueCursor || "",
    };
  },
});

// Create a new notification
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    senderId: v.optional(v.id("users")),
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("account_warning"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    entityId: v.optional(v.string()),
    entityType: v.optional(v.union(v.literal("post"), v.literal("comment"))),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Don't create notification if user is trying to notify themselves
    if (args.senderId && args.userId === args.senderId) {
      return null;
    }

    const notificationId = await ctx.db.insert("notifications", {
      userId: args.userId,
      senderId: args.senderId,
      title: args.title,
      message: args.message,
      entityId: args.entityId,
      entityType: args.entityType,
      isRead: false,
      metadata: args.metadata,
      type: args.type,
    });

    return notificationId;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Verify the notification belongs to the current user
    if (notification.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    const updatePromises = unreadNotifications.map((notification) =>
      ctx.db.patch(notification._id, {
        isRead: true,
        readAt: Date.now(),
      })
    );

    await Promise.all(updatePromises);

    return unreadNotifications.length;
  },
});

// Delete a notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Verify the notification belongs to the current user
    if (notification.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.notificationId);
  },
});

// Helper function to create like notification
export const createLikeNotification = mutation({
  args: {
    postId: v.optional(v.string()),
    authorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const liker = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!liker) {
      return null;
    }

    let entityType: "post";
    let entityId: string;
    let title: string;
    let message: string;

    if (args.postId) {
      entityType = "post";
      entityId = args.postId;
      title = "New Like";
      message = `${liker.userName} liked your post`;
    } else {
      return null;
    }

    return await ctx.db.insert("notifications", {
      userId: args.authorId,
      senderId: liker._id,
      type: "like",
      title,
      message,
      entityId,
      entityType,
      isRead: false,
    });
  },
});

// Helper function to create comment notification
export const createCommentNotification = mutation({
  args: {
    postId: v.string(),
    commentId: v.string(),
    postAuthorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const commenter = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!commenter) {
      return null;
    }

    return await ctx.db.insert("notifications", {
      userId: args.postAuthorId,
      senderId: commenter._id,
      type: "comment",
      title: "New Comment",
      message: `${commenter.userName} commented on your post`,
      entityId: args.postId,
      entityType: "post",
      isRead: false,
      metadata: {
        commentId: args.commentId,
      },
    });
  },
});
