import {
  customCtx,
  customMutation,
} from "convex-helpers/server/customFunctions";
import { Triggers } from "convex-helpers/server/triggers";
import { DataModel } from "./_generated/dataModel";
import { mutation as rawMutation } from "./_generated/server";

const triggers = new Triggers<DataModel>();

/**
 * User Deletion Trigger
 *
 * When a user is deleted, this trigger:
 * 1. Deletes all user-created content (posts, comments, replies)
 * 2. Deletes all user interactions (likes, push tokens)
 * 3. Deletes user-initiated reports (preserving reports against the user where possible)
 * 4. Updates user counts
 */
triggers.register("users", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const userId = change.id;
    const deletedUser = change.oldDoc;

    console.log(
      `Starting user deletion cascade for user ${userId}: ${deletedUser.userName}`
    );

    // =====================================================
    // DELETE USER-CREATED CONTENT
    // =====================================================

    // 1. Delete all posts/confessions by this user
    const userPosts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();

    for (const post of userPosts) {
      await ctx.db.delete(post._id);
    }
    console.log(`Deleted ${userPosts.length} posts for user ${userId}`);

    // 2. Delete all comments by this user
    const userComments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();

    for (const comment of userComments) {
      await ctx.db.delete(comment._id);
    }
    console.log(`Deleted ${userComments.length} comments for user ${userId}`);

    // 3. Delete all replies by this user
    const userReplies = await ctx.db
      .query("replies")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();

    for (const reply of userReplies) {
      await ctx.db.delete(reply._id);
    }
    console.log(`Deleted ${userReplies.length} replies for user ${userId}`);

    // =====================================================
    // DELETE USER INTERACTIONS
    // =====================================================

    // 4. Delete all post likes by this user
    const userPostLikes = await ctx.db
      .query("postLikes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const like of userPostLikes) {
      await ctx.db.delete(like._id);
    }
    console.log(
      `Deleted ${userPostLikes.length} post likes for user ${userId}`
    );

    // 5. Delete all comment likes by this user
    const userCommentLikes = await ctx.db
      .query("commentLikes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const like of userCommentLikes) {
      await ctx.db.delete(like._id);
    }
    console.log(
      `Deleted ${userCommentLikes.length} comment likes for user ${userId}`
    );

    // 6. Delete all reply likes by this user
    const userReplyLikes = await ctx.db
      .query("replyLikes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const like of userReplyLikes) {
      await ctx.db.delete(like._id);
    }
    console.log(
      `Deleted ${userReplyLikes.length} reply likes for user ${userId}`
    );

    // 7. Delete all push tokens for this user
    const userPushTokens = await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const token of userPushTokens) {
      await ctx.db.delete(token._id);
    }
    console.log(
      `Deleted ${userPushTokens.length} push tokens for user ${userId}`
    );

    // =====================================================
    // HANDLE REPORT TABLES - DELETE USER-INITIATED REPORTS
    // =====================================================

    // 8. Delete user reports made BY this user (lose context without reporter)
    const reportsByUser = await ctx.db
      .query("reportedUsers")
      .withIndex("by_reporter", (q) => q.eq("reporterId", userId))
      .collect();

    for (const report of reportsByUser) {
      await ctx.db.delete(report._id);
    }
    console.log(
      `Deleted ${reportsByUser.length} user reports made by user ${userId}`
    );

    // 9. Delete reports AGAINST this user (user no longer exists to moderate)
    const reportsAgainstUser = await ctx.db
      .query("reportedUsers")
      .withIndex("by_reported_user", (q) => q.eq("reportedUserId", userId))
      .collect();

    for (const report of reportsAgainstUser) {
      await ctx.db.delete(report._id);
    }
    console.log(
      `Deleted ${reportsAgainstUser.length} user reports against user ${userId}`
    );

    // 10. Delete content reports made BY this user
    const contentReportsByUser = await ctx.db
      .query("reportedContents")
      .withIndex("by_reporter", (q) => q.eq("reporterId", userId))
      .collect();

    for (const report of contentReportsByUser) {
      await ctx.db.delete(report._id);
    }
    console.log(
      `Deleted ${contentReportsByUser.length} content reports made by user ${userId}`
    );

    // 11. Delete content reports where this user was the content author (content is deleted anyway)
    const contentReportsAgainstUser = await ctx.db
      .query("reportedContents")
      .withIndex("by_content_author", (q) => q.eq("contentAuthorId", userId))
      .collect();

    for (const report of contentReportsAgainstUser) {
      await ctx.db.delete(report._id);
    }
    console.log(
      `Deleted ${contentReportsAgainstUser.length} content reports against user's content`
    );

    // 12. Nullify reviewer references in remaining reports (if this user was a moderator)
    const reviewedUserReports = await ctx.db
      .query("reportedUsers")
      .withIndex("by_reviewer", (q) => q.eq("reviewedBy", userId))
      .collect();

    for (const report of reviewedUserReports) {
      await ctx.db.patch(report._id, {
        reviewedBy: undefined,
        adminNotes:
          (report.adminNotes || "") + " [Original reviewer account deleted]",
      });
    }
    console.log(
      `Nullified reviewer in ${reviewedUserReports.length} user reports`
    );

    const reviewedContentReports = await ctx.db
      .query("reportedContents")
      .withIndex("by_reviewer", (q) => q.eq("reviewedBy", userId))
      .collect();

    for (const report of reviewedContentReports) {
      await ctx.db.patch(report._id, {
        reviewedBy: undefined,
        adminNotes:
          (report.adminNotes || "") + " [Original reviewer account deleted]",
      });
    }
    console.log(
      `Nullified reviewer in ${reviewedContentReports.length} content reports`
    );

    // =====================================================
    // UPDATE USER COUNTS
    // =====================================================

    // 13. Decrement total user count
    const userCount = await ctx.db.query("userCounts").first();
    if (userCount) {
      await ctx.db.patch(userCount._id, {
        count: Math.max(0, userCount.count - 1),
      });
      console.log(`Decremented user count to ${userCount.count - 1}`);
    }

    console.log(
      `User deletion cascade completed for user ${userId}: ${deletedUser.userName}`
    );
  }
});

/**
 * Post Deletion Trigger
 *
 * When a post is deleted, this trigger:
 * 1. Deletes all related comments and replies
 * 2. Deletes all related likes
 * 3. Deletes all related reports
 */
triggers.register("posts", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const postId = change.id;
    const deletedPost = change.oldDoc;

    console.log(`Starting post deletion cascade for post ${postId}`);

    // 1. Delete all comments on this post (which will cascade to replies)
    const postComments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();

    for (const comment of postComments) {
      await ctx.db.delete(comment._id);
    }
    console.log(`Deleted ${postComments.length} comments for post ${postId}`);

    // 2. Delete all likes on this post
    const postLikes = await ctx.db
      .query("postLikes")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();

    for (const like of postLikes) {
      await ctx.db.delete(like._id);
    }
    console.log(`Deleted ${postLikes.length} likes for post ${postId}`);

    // 3. Delete all content reports for this post
    const postReports = await ctx.db
      .query("reportedContents")
      .withIndex("by_content", (q) => q.eq("contentId", postId))
      .collect();

    for (const report of postReports) {
      await ctx.db.delete(report._id);
    }
    console.log(`Deleted ${postReports.length} reports for post ${postId}`);

    console.log(`Post deletion cascade completed for post ${postId}`);
  }
});

/**
 * Comment Deletion Trigger
 *
 * When a comment is deleted, this trigger:
 * 1. Deletes all related replies
 * 2. Deletes all related likes
 * 3. Deletes all related reports
 * 4. Decrements the parent post's comment count
 */
triggers.register("comments", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const commentId = change.id;
    const deletedComment = change.oldDoc;
    const postId = deletedComment.postId;

    console.log(`Starting comment deletion cascade for comment ${commentId}`);

    // 1. Delete all replies to this comment
    const commentReplies = await ctx.db
      .query("replies")
      .withIndex("by_comment", (q) => q.eq("commentId", commentId))
      .collect();

    for (const reply of commentReplies) {
      await ctx.db.delete(reply._id);
    }
    console.log(
      `Deleted ${commentReplies.length} replies for comment ${commentId}`
    );

    // 2. Delete all likes on this comment
    const commentLikes = await ctx.db
      .query("commentLikes")
      .withIndex("by_comment", (q) => q.eq("commentId", commentId))
      .collect();

    for (const like of commentLikes) {
      await ctx.db.delete(like._id);
    }
    console.log(
      `Deleted ${commentLikes.length} likes for comment ${commentId}`
    );

    // 3. Delete all content reports for this comment
    const commentReports = await ctx.db
      .query("reportedContents")
      .withIndex("by_content", (q) => q.eq("contentId", commentId))
      .collect();

    for (const report of commentReports) {
      await ctx.db.delete(report._id);
    }
    console.log(
      `Deleted ${commentReports.length} reports for comment ${commentId}`
    );

    // 4. Decrement parent post's comment count
    const parentPost = await ctx.db.get(postId);
    if (parentPost) {
      await ctx.db.patch(postId, {
        commentsCount: Math.max(0, parentPost.commentsCount - 1),
      });
      console.log(`Decremented comment count for post ${postId}`);
    }

    console.log(`Comment deletion cascade completed for comment ${commentId}`);
  }
});

/**
 * Reply Deletion Trigger
 *
 * When a reply is deleted, this trigger:
 * 1. Deletes all related likes
 * 2. Deletes all related reports
 * 3. Decrements the parent comment's reply count
 */
triggers.register("replies", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const replyId = change.id;
    const deletedReply = change.oldDoc;
    const commentId = deletedReply.commentId;

    console.log(`Starting reply deletion cascade for reply ${replyId}`);

    // 1. Delete all likes on this reply
    const replyLikes = await ctx.db
      .query("replyLikes")
      .withIndex("by_reply", (q) => q.eq("replyId", replyId))
      .collect();

    for (const like of replyLikes) {
      await ctx.db.delete(like._id);
    }
    console.log(`Deleted ${replyLikes.length} likes for reply ${replyId}`);

    // 2. Delete all content reports for this reply
    const replyReports = await ctx.db
      .query("reportedContents")
      .withIndex("by_content", (q) => q.eq("contentId", replyId))
      .collect();

    for (const report of replyReports) {
      await ctx.db.delete(report._id);
    }
    console.log(`Deleted ${replyReports.length} reports for reply ${replyId}`);

    // 3. Decrement parent comment's reply count
    const parentComment = await ctx.db.get(commentId);
    if (parentComment) {
      await ctx.db.patch(commentId, {
        repliesCount: Math.max(0, parentComment.repliesCount - 1),
      });
      console.log(`Decremented reply count for comment ${commentId}`);
    }

    console.log(`Reply deletion cascade completed for reply ${replyId}`);
  }
});

/**
 * Automatic Moderation Triggers
 *
 * These triggers automatically pause users or hide content when report thresholds are reached
 */

/**
 * User Report Threshold Trigger
 *
 * When a new user report is created, check if the reported user has reached 5 reports
 * If so, automatically pause their account pending review
 */
triggers.register("reportedUsers", async (ctx, change) => {
  if (change.operation === "insert" && change.newDoc) {
    const newReport = change.newDoc;
    const reportedUserId = newReport.reportedUserId;

    // Count total pending reports against this user
    const userReports = await ctx.db
      .query("reportedUsers")
      .withIndex("by_reported_user", (q) =>
        q.eq("reportedUserId", reportedUserId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const reportCount = userReports.length;
    console.log(
      `User ${reportedUserId} now has ${reportCount} pending reports`
    );

    // If user has 5 or more reports, automatically pause their account
    if (reportCount >= 5) {
      const user = await ctx.db.get(reportedUserId);
      if (user && user.accountStatus === "active") {
        await ctx.db.patch(reportedUserId, {
          accountStatus: "paused",
          pausedAt: Date.now(),
          pauseReason: `Automatically paused due to ${reportCount} user reports. Account under review.`,
          reportCount: reportCount,
        });

        console.log(
          `🔒 User ${reportedUserId} automatically paused due to ${reportCount} reports`
        );

        // Optionally, you could also hide all their active posts
        const userPosts = await ctx.db
          .query("posts")
          .withIndex("by_author", (q) => q.eq("authorId", reportedUserId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        for (const post of userPosts) {
          await ctx.db.patch(post._id, {
            status: "pending_review",
            moderatorNotes: `Hidden due to user account being paused for reports`,
          });
        }

        console.log(
          `📝 Hidden ${userPosts.length} posts from paused user ${reportedUserId}`
        );
      }
    } else {
      // Update user's report count
      const user = await ctx.db.get(reportedUserId);
      if (user) {
        await ctx.db.patch(reportedUserId, {
          reportCount: reportCount,
        });
      }
    }
  }
});

/**
 * Content Report Threshold Trigger
 *
 * When a new content report is created, check if the content has reached 5 reports
 * If so, automatically hide the content pending review
 */
triggers.register("reportedContents", async (ctx, change) => {
  if (change.operation === "insert" && change.newDoc) {
    const newReport = change.newDoc;
    const contentId = newReport.contentId;
    const contentType = newReport.contentType;

    // Count total pending reports against this content
    const contentReports = await ctx.db
      .query("reportedContents")
      .withIndex("by_content", (q) => q.eq("contentId", contentId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const reportCount = contentReports.length;
    console.log(
      `Content ${contentId} (${contentType}) now has ${reportCount} pending reports`
    );

    // If content has 5 or more reports, automatically hide it
    if (reportCount >= 5) {
      if (
        contentType === "post" ||
        contentType === "confession" ||
        contentType === "story"
      ) {
        // Handle posts/confessions
        try {
          const post = await ctx.db.get(contentId as any);
          if (post && (post as any).status === "active") {
            await ctx.db.patch(contentId as any, {
              status: "pending_review",
              reportsCount: reportCount,
              moderatorNotes: `Automatically hidden due to ${reportCount} user reports. Content under review.`,
            });

            console.log(
              `🔒 Post ${contentId} automatically hidden due to ${reportCount} reports`
            );
          }
        } catch (error) {
          console.error(`Error hiding post ${contentId}:`, error);
        }
      } else if (contentType === "comment") {
        // Handle comments
        try {
          const comment = await ctx.db.get(contentId as any);
          if (comment && (comment as any).status === "active") {
            await ctx.db.patch(contentId as any, {
              status: "pending_review",
              reportsCount: reportCount,
              moderatorNotes: `Automatically hidden due to ${reportCount} user reports. Comment under review.`,
            });

            console.log(
              `🔒 Comment ${contentId} automatically hidden due to ${reportCount} reports`
            );
          }
        } catch (error) {
          console.error(`Error hiding comment ${contentId}:`, error);
        }
      }

      // Mark all reports for this content as "reviewed" since action was taken
      for (const report of contentReports) {
        await ctx.db.patch(report._id, {
          status: "reviewed",
          adminNotes:
            "Automatically processed - content hidden due to multiple reports",
          reviewedAt: Date.now(),
        });
      }
    }
  }
});

/**
 * Report Status Change Trigger
 *
 * When a report status changes (e.g., dismissed, resolved), update the related counts
 */
triggers.register("reportedUsers", async (ctx, change) => {
  if (change.operation === "update" && change.newDoc && change.oldDoc) {
    const oldReport = change.oldDoc;
    const newReport = change.newDoc;

    // If report status changed from pending to something else
    if (oldReport.status === "pending" && newReport.status !== "pending") {
      const reportedUserId = newReport.reportedUserId;

      // Recount pending reports for this user
      const pendingReports = await ctx.db
        .query("reportedUsers")
        .withIndex("by_reported_user", (q) =>
          q.eq("reportedUserId", reportedUserId)
        )
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();

      const user = await ctx.db.get(reportedUserId);
      if (user) {
        await ctx.db.patch(reportedUserId, {
          reportCount: pendingReports.length,
        });

        // If user was paused but now has less than 5 pending reports,
        // you might want to consider unpausing (but this should probably be manual)
        console.log(
          `Updated report count for user ${reportedUserId}: ${pendingReports.length} pending reports`
        );
      }
    }
  }
});

/**
 * Like Deletion Triggers
 *
 * When likes are deleted, update the corresponding content's like count
 */
triggers.register("postLikes", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const deletedLike = change.oldDoc;
    const post = await ctx.db.get(deletedLike.postId);
    if (post) {
      await ctx.db.patch(deletedLike.postId, {
        likesCount: Math.max(0, post.likesCount - 1),
      });
    }
  }
});

triggers.register("commentLikes", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const deletedLike = change.oldDoc;
    const comment = await ctx.db.get(deletedLike.commentId);
    if (comment) {
      await ctx.db.patch(deletedLike.commentId, {
        likesCount: Math.max(0, comment.likesCount - 1),
      });
    }
  }
});

triggers.register("replyLikes", async (ctx, change) => {
  if (change.operation === "delete" && change.oldDoc) {
    const deletedLike = change.oldDoc;
    const reply = await ctx.db.get(deletedLike.replyId);
    if (reply) {
      await ctx.db.patch(deletedLike.replyId, {
        likesCount: Math.max(0, reply.likesCount - 1),
      });
    }
  }
});

// Export the custom mutation with triggers enabled
export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
