import { rateLimitTables } from "convex-helpers/server/rateLimit";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const users = defineTable({
  userName: v.string(),
  emailAddress: v.string(),
  clerkId: v.string(),
  imageUrl: v.optional(v.string()),
  postsPublished: v.number(),
  accountStatus: v.optional(
    v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("suspended"),
      v.literal("banned")
    )
  ),
  pausedAt: v.optional(v.number()),
  pauseReason: v.optional(v.string()),
  // Online status fields
  isOnline: v.optional(v.boolean()),
  lastSeenAt: v.optional(v.number()),
  sessionId: v.optional(v.string()),
});
export const userCounts = defineTable({
  count: v.number(),
});
export const pushTokens = defineTable({
  userId: v.optional(v.id("users")),
  pushToken: v.string(),
  deviceId: v.string(),
  timestamp: v.string(),
});
export const posts = defineTable({
  authorId: v.id("users"),
  content: v.string(),
  title: v.optional(v.string()),
  tagsText: v.optional(v.string()),
  likesCount: v.number(),
  commentsCount: v.number(),
  status: v.union(
    v.literal("active"),
    v.literal("hidden"),
    v.literal("removed"),
    v.literal("pending_review")
  ),
  visibility: v.union(
    v.literal("public"),
    v.literal("private"),
    v.literal("friends_only")
  ),
  moderatorNotes: v.optional(v.string()),
});
export const comments = defineTable({
  postId: v.id("posts"),
  authorId: v.id("users"),
  content: v.string(),
  status: v.union(
    v.literal("active"),
    v.literal("hidden"),
    v.literal("removed"),
    v.literal("pending_review")
  ),
  moderatorNotes: v.optional(v.string()),
});
export const postLikes = defineTable({
  userId: v.id("users"),
  postId: v.id("posts"),
  likedAt: v.optional(v.number()),
});
export const notifications = defineTable({
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
  isRead: v.boolean(),
  readAt: v.optional(v.number()),
  metadata: v.optional(v.any()),
});

export default defineSchema({
  ...rateLimitTables,
  users: users
    .index("by_clerk_id", ["clerkId"])
    .index("by_user_name", ["userName"])
    .index("by_account_status", ["accountStatus"])
    .index("by_online_status", ["isOnline"])
    .index("by_last_seen", ["lastSeenAt"])
    .index("by_session", ["sessionId"]),
  userCounts: userCounts,
  pushTokens: pushTokens
    .index("by_user", ["userId"])
    .index("by_deviceId", ["deviceId"])
    .index("by_push_token", ["pushToken"]),
  posts: posts
    .index("by_author", ["authorId"])
    .index("by_status", ["status"])
    .index("by_visibility", ["visibility"])
    .index("by_status_visibility", ["status", "visibility"])
    .index("by_tags_text", ["tagsText"])
    .index("by_likes", ["likesCount"]),
  comments: comments
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"])
    .index("by_status", ["status"]),
  postLikes: postLikes
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),
  notifications: notifications
    .index("by_user", ["userId"])
    .index("by_sender", ["senderId"])
    .index("by_type", ["type"])
    .index("by_read_status", ["isRead"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_entity", ["entityId", "entityType"]),
});

export type USER_TABLE = Infer<typeof users.validator> & {
  _id: Id<"users">;
  _creationTime: number;
};
export type POST_TABLE = Infer<typeof posts.validator> & {
  _id: Id<"posts">;
  _creationTime: number;
};
export type NOTIFICATION_TABLE = Infer<typeof notifications.validator> & {
  _id: Id<"notifications">;
  _creationTime: number;
};
