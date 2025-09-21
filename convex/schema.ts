import { rateLimitTables } from "convex-helpers/server/rateLimit";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const users = defineTable({
  userName: v.string(),
  gender: v.optional(
    v.union(v.literal("male"), v.literal("female"), v.literal("other"))
  ),
  age: v.optional(v.number()),
  emailAddress: v.string(),
  emailVerified: v.boolean(),
  clerkId: v.string(),
  imageUrl: v.optional(v.string()),
  storageId: v.optional(v.id("_storage")),
  postsPublished: v.number(),
  followers: v.number(),
  following: v.number(),
  bio: v.optional(v.string()),
  thoughts: v.optional(v.string()),
  reportCount: v.optional(v.number()),
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
  lastActiveAt: v.optional(v.number()),
  sessionId: v.optional(v.string()),
});
export const userCounts = defineTable({
  count: v.number(),
});
export const pushTokens = defineTable({
  userId: v.optional(v.id("users")),
  pushToken: v.string(),
  deviceId: v.string(), // Consistent deviceId across all tables
  timestamp: v.string(),
});

export const userSessions = defineTable({
  userId: v.id("users"),
  clerkSessionId: v.string(), // Use Clerk's session ID as the primary identifier
  deviceId: v.string(), // Consistent deviceId across all tables
  status: v.union(
    v.literal("logged_in"), // User is logged in and app is active
    v.literal("app_background"), // User is logged in but app is in background
    v.literal("logged_out") // User has logged out
  ),
  createdAt: v.number(),
  updatedAt: v.number(),
  expiresAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_clerk_session", ["clerkSessionId"])
  .index("by_user_status", ["userId", "status"])
  .index("by_updated", ["updatedAt"]);

export const appVersions = defineTable({
  version: v.string(),
  type: v.union(v.literal("major"), v.literal("minor"), v.literal("patch")),
  releaseNotes: v.string(),
  downloadUrl: v.optional(v.string()),
});

export const reportedUsers = defineTable({
  reporterId: v.id("users"), // User who is making the report
  reportedUserId: v.id("users"), // User who is being reported
  reason: v.union(
    v.literal("harassment_bullying"), // Harassing or bullying behavior
    v.literal("impersonation"), // Pretending to be someone else
    v.literal("spam_account"), // Spam or bot account
    v.literal("fake_account"), // Fake or fraudulent account
    v.literal("inappropriate_behavior"), // General inappropriate behavior
    v.literal("violation_guidelines"), // Violating community guidelines
    v.literal("other") // Other user-related issues
  ),
  description: v.optional(v.string()), // Additional details about the report
  status: v.union(
    v.literal("pending"),
    v.literal("reviewed"),
    v.literal("resolved"),
    v.literal("dismissed")
  ),
  adminNotes: v.optional(v.string()), // Notes from admin/moderator
  reviewedBy: v.optional(v.id("users")), // Admin who reviewed the report
  reviewedAt: v.optional(v.number()), // Timestamp when reviewed
});

export const reportedContents = defineTable({
  reporterId: v.id("users"), // User who is making the report
  contentId: v.string(), // ID of the content being reported (confession, post, comment)
  contentType: v.union(
    v.literal("confession"),
    v.literal("post"),
    v.literal("comment"),
    v.literal("story"),
    v.literal("other")
  ),
  contentAuthorId: v.id("users"), // Author of the reported content
  reason: v.union(
    v.literal("inappropriate_content"), // General inappropriate content
    v.literal("false_information"), // Misinformation or fake stories
    v.literal("hate_speech"), // Discriminatory language
    v.literal("sexual_content"), // Inappropriate sexual content
    v.literal("violence_threats"), // Violence or threats
    v.literal("self_harm_content"), // Content promoting self-harm
    v.literal("doxxing_personal_info"), // Sharing personal information
    v.literal("illegal_activity"), // Content about illegal activities
    v.literal("spam_repetitive"), // Spam or repetitive content
    v.literal("copyright_violation"), // Copyright infringement
    v.literal("other") // Other content-related issues
  ),
  description: v.optional(v.string()), // Additional details about the report
  status: v.union(
    v.literal("pending"),
    v.literal("reviewed"),
    v.literal("resolved"),
    v.literal("dismissed")
  ),
  adminNotes: v.optional(v.string()), // Notes from admin/moderator
  reviewedBy: v.optional(v.id("users")), // Admin who reviewed the report
  reviewedAt: v.optional(v.number()), // Timestamp when reviewed
  contentRemoved: v.optional(v.boolean()), // Whether the content was removed
  contentRemovedAt: v.optional(v.number()), // When content was removed
});

export const posts = defineTable({
  authorId: v.id("users"), // Author of the post/confession
  content: v.string(), // The confession/post content
  title: v.optional(v.string()), // Optional title for the post
  type: v.union(
    v.literal("confession"),
    v.literal("story"),
    v.literal("question"),
    v.literal("advice"),
    v.literal("other")
  ),
  tags: v.optional(v.array(v.string())), // Tags for categorization
  likesCount: v.number(), // Number of likes
  commentsCount: v.number(), // Number of comments
  reportsCount: v.optional(v.number()), // Number of reports on this post
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
  imageUrl: v.optional(v.string()), // Optional image attachment
  storageId: v.optional(v.id("_storage")), // Optional file storage reference
  moderatorNotes: v.optional(v.string()), // Notes from moderators
  editedAt: v.optional(v.number()), // Timestamp when last edited
});

export const comments = defineTable({
  postId: v.id("posts"), // The post this comment belongs to
  authorId: v.id("users"), // Author of the comment
  content: v.string(), // Comment content
  likesCount: v.number(), // Number of likes on the comment
  repliesCount: v.number(), // Number of replies to this comment
  reportsCount: v.optional(v.number()), // Number of reports on this comment
  status: v.union(
    v.literal("active"),
    v.literal("hidden"),
    v.literal("removed"),
    v.literal("pending_review")
  ),
  moderatorNotes: v.optional(v.string()), // Notes from moderators
  editedAt: v.optional(v.number()), // Timestamp when last edited
});

export const replies = defineTable({
  commentId: v.id("comments"), // The comment this reply belongs to
  postId: v.id("posts"), // The original post (for easier querying)
  authorId: v.id("users"), // Author of the reply
  content: v.string(), // Reply content // Whether the reply is anonymous
  likesCount: v.number(), // Number of likes on the reply
  reportsCount: v.optional(v.number()), // Number of reports on this reply
  status: v.union(
    v.literal("active"),
    v.literal("hidden"),
    v.literal("removed"),
    v.literal("pending_review")
  ),
  moderatorNotes: v.optional(v.string()), // Notes from moderators
  editedAt: v.optional(v.number()), // Timestamp when last edited
});

export const postLikes = defineTable({
  userId: v.id("users"), // User who liked the post
  postId: v.id("posts"), // The post that was liked
  likedAt: v.optional(v.number()), // Timestamp when liked (optional, defaults to _creationTime)
});

export const commentLikes = defineTable({
  userId: v.id("users"), // User who liked the comment
  commentId: v.id("comments"), // The comment that was liked
  postId: v.id("posts"), // The original post (for easier querying)
  likedAt: v.optional(v.number()), // Timestamp when liked (optional, defaults to _creationTime)
});

export const replyLikes = defineTable({
  userId: v.id("users"), // User who liked the reply
  replyId: v.id("replies"), // The reply that was liked
  commentId: v.id("comments"), // The parent comment (for easier querying)
  postId: v.id("posts"), // The original post (for easier querying)
  likedAt: v.optional(v.number()), // Timestamp when liked (optional, defaults to _creationTime)
});

export const follows = defineTable({
  followerId: v.id("users"), // User who is following
  followingId: v.id("users"), // User who is being followed
  followedAt: v.optional(v.number()), // Timestamp when followed (optional, defaults to _creationTime)
});

export const notifications = defineTable({
  userId: v.id("users"), // User who receives the notification
  senderId: v.optional(v.id("users")), // User who triggered the notification (optional for system notifications)
  type: v.union(
    v.literal("like"), // Someone liked your post/comment
    v.literal("comment"), // Someone commented on your post
    v.literal("reply"), // Someone replied to your comment
    v.literal("follow"), // Someone followed you
    v.literal("mention"), // Someone mentioned you
    v.literal("report_resolved"), // Your report was resolved
    v.literal("account_warning"), // Account warning/moderation
    v.literal("post_featured"), // Your post was featured
    v.literal("system") // System notification
  ),
  title: v.string(), // Notification title
  message: v.string(), // Notification message
  entityId: v.optional(v.string()), // ID of related entity (post, comment, etc.)
  entityType: v.optional(
    v.union(
      v.literal("post"),
      v.literal("comment"),
      v.literal("reply"),
      v.literal("user")
    )
  ),
  isRead: v.boolean(),
  readAt: v.optional(v.number()),
  metadata: v.optional(v.any()), // Additional data specific to notification type
});

export default defineSchema({
  ...rateLimitTables,
  users: users
    .index("by_clerk_id", ["clerkId"])
    .index("by_user_name", ["userName"])
    .index("by_gender", ["gender"])
    .index("by_age", ["age"])
    .index("by_account_status", ["accountStatus"])
    .index("by_report_count", ["reportCount"])
    .index("by_online_status", ["isOnline"])
    .index("by_last_seen", ["lastSeenAt"])
    .index("by_last_active", ["lastActiveAt"])
    .index("by_session", ["sessionId"]),
  userCounts: userCounts,
  pushTokens: pushTokens
    .index("by_user", ["userId"])
    .index("by_deviceId", ["deviceId"])
    .index("by_push_token", ["pushToken"]),
  userSessions: userSessions,
  appVersions: appVersions
    .index("by_version", ["version"])
    .index("by_type", ["type"]),
  posts: posts
    .index("by_author", ["authorId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_visibility", ["visibility"])
    .index("by_likes", ["likesCount"]),
  comments: comments
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"])
    .index("by_status", ["status"])
    .index("by_likes", ["likesCount"]),
  replies: replies
    .index("by_comment", ["commentId"])
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"])
    .index("by_status", ["status"])
    .index("by_likes", ["likesCount"]),
  postLikes: postLikes
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]), // Unique constraint: one like per user per post
  commentLikes: commentLikes
    .index("by_user", ["userId"])
    .index("by_comment", ["commentId"])
    .index("by_post", ["postId"])
    .index("by_user_comment", ["userId", "commentId"]), // Unique constraint: one like per user per comment
  replyLikes: replyLikes
    .index("by_user", ["userId"])
    .index("by_reply", ["replyId"])
    .index("by_comment", ["commentId"])
    .index("by_post", ["postId"])
    .index("by_user_reply", ["userId", "replyId"]), // Unique constraint: one like per user per reply
  follows: follows
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_following", ["followerId", "followingId"]), // Unique constraint: one follow relationship per pair
  reportedUsers: reportedUsers
    .index("by_reporter", ["reporterId"])
    .index("by_reported_user", ["reportedUserId"])
    .index("by_status", ["status"])
    .index("by_reason", ["reason"])
    .index("by_reviewer", ["reviewedBy"]),
  reportedContents: reportedContents
    .index("by_reporter", ["reporterId"])
    .index("by_content", ["contentId"])
    .index("by_content_author", ["contentAuthorId"])
    .index("by_content_type", ["contentType"])
    .index("by_status", ["status"])
    .index("by_reason", ["reason"])
    .index("by_reviewer", ["reviewedBy"]),
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
