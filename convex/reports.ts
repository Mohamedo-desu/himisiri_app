import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import {
  rateLimitedAuthMutationAccount,
  rateLimitedAuthMutationLow,
  rateLimitedAuthMutationMedium,
  rateLimitedOptionalAuthQuery,
} from "./rateLimitedFunctions";

/**
 * Report a user for inappropriate behavior
 */
export const reportUser = rateLimitedAuthMutationLow({
  args: {
    reportedUserId: v.id("users"),
    reason: v.union(
      v.literal("harassment_bullying"),
      v.literal("impersonation"),
      v.literal("spam_account"),
      v.literal("fake_account"),
      v.literal("inappropriate_behavior"),
      v.literal("violation_guidelines"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prevent self-reporting
    if (args.reportedUserId === ctx.user._id) {
      throw new Error("You cannot report yourself");
    }

    // Verify the reported user exists
    const reportedUser = await ctx.db.get(args.reportedUserId);
    if (!reportedUser) {
      throw new Error("User not found");
    }

    // Check if user has already reported this user
    const existingReport = await ctx.db
      .query("reportedUsers")
      .withIndex("by_reporter", (q) => q.eq("reporterId", ctx.user._id))
      .filter((q) => q.eq(q.field("reportedUserId"), args.reportedUserId))
      .first();

    if (existingReport) {
      throw new Error("You have already reported this user");
    }

    // Validate description length if provided
    if (args.description && args.description.length > 500) {
      throw new Error("Description cannot exceed 500 characters");
    }

    // Create the report
    const reportId = await ctx.db.insert("reportedUsers", {
      reporterId: ctx.user._id,
      reportedUserId: args.reportedUserId,
      reason: args.reason,
      description: args.description,
      status: "pending",
    });

    // Increment the user's report count
    const currentReportCount = reportedUser.reportCount || 0;
    await ctx.db.patch(args.reportedUserId, {
      reportCount: currentReportCount + 1,
    });

    return {
      success: true,
      reportId,
      message: "User reported successfully. Our team will review this report.",
    };
  },
});

/**
 * Get paginated list of reports for admin/moderator review
 */
export const getReports = rateLimitedOptionalAuthQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("reviewed"),
        v.literal("resolved"),
        v.literal("dismissed")
      )
    ),
    reason: v.optional(
      v.union(
        v.literal("harassment_bullying"),
        v.literal("impersonation"),
        v.literal("spam_account"),
        v.literal("fake_account"),
        v.literal("inappropriate_behavior"),
        v.literal("violation_guidelines"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin/moderator role check here
    // For now, only return reports if user is authenticated
    if (!ctx.user) {
      throw new Error("Authentication required");
    }

    let query;

    // Filter by status if provided
    if (args.status) {
      query = ctx.db
        .query("reportedUsers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc");
    }
    // Filter by reason if provided (and no status filter)
    else if (args.reason) {
      query = ctx.db
        .query("reportedUsers")
        .withIndex("by_reason", (q) => q.eq("reason", args.reason!))
        .order("desc");
    }
    // No filters - get all reports
    else {
      query = ctx.db.query("reportedUsers").order("desc");
    }

    const reports = await query.paginate(args.paginationOpts);

    // Enrich with user information
    const enrichedReports = await Promise.all(
      reports.page.map(async (report) => {
        const [reporter, reportedUser, reviewer] = await Promise.all([
          ctx.db.get(report.reporterId),
          ctx.db.get(report.reportedUserId),
          report.reviewedBy ? ctx.db.get(report.reviewedBy) : null,
        ]);

        return {
          ...report,
          reporter: reporter
            ? {
                _id: reporter._id,
                userName: reporter.userName,
                emailAddress: reporter.emailAddress,
              }
            : null,
          reportedUser: reportedUser
            ? {
                _id: reportedUser._id,
                userName: reportedUser.userName,
                emailAddress: reportedUser.emailAddress,
                accountStatus: reportedUser.accountStatus,
                reportCount: reportedUser.reportCount || 0,
              }
            : null,
          reviewer: reviewer
            ? {
                _id: reviewer._id,
                userName: reviewer.userName,
              }
            : null,
        };
      })
    );

    return {
      ...reports,
      page: enrichedReports,
    };
  },
});

/**
 * Get reports made by the current user
 */
export const getMyReports = rateLimitedOptionalAuthQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (!ctx.user) {
      throw new Error("Authentication required");
    }

    const reports = await ctx.db
      .query("reportedUsers")
      .withIndex("by_reporter", (q) => q.eq("reporterId", ctx.user!._id))
      .order("desc")
      .paginate(args.paginationOpts);

    // Enrich with reported user information
    const enrichedReports = await Promise.all(
      reports.page.map(async (report) => {
        const reportedUser = await ctx.db.get(report.reportedUserId);

        return {
          ...report,
          reportedUser: reportedUser
            ? {
                _id: reportedUser._id,
                userName: reportedUser.userName,
                accountStatus: reportedUser.accountStatus,
              }
            : null,
        };
      })
    );

    return {
      ...reports,
      page: enrichedReports,
    };
  },
});

/**
 * Get reports against a specific user (for admin/moderator use)
 */
export const getReportsAgainstUser = rateLimitedOptionalAuthQuery({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // TODO: Add admin/moderator role check here
    if (!ctx.user) {
      throw new Error("Authentication required");
    }

    const reports = await ctx.db
      .query("reportedUsers")
      .withIndex("by_reported_user", (q) => q.eq("reportedUserId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts);

    // Enrich with reporter information
    const enrichedReports = await Promise.all(
      reports.page.map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId);

        return {
          ...report,
          reporter: reporter
            ? {
                _id: reporter._id,
                userName: reporter.userName,
                emailAddress: reporter.emailAddress,
              }
            : null,
        };
      })
    );

    return {
      ...reports,
      page: enrichedReports,
    };
  },
});

/**
 * Update report status (for admin/moderator use)
 */
export const updateReportStatus = rateLimitedAuthMutationMedium({
  args: {
    reportId: v.id("reportedUsers"),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin/moderator role check here
    if (!ctx.user) {
      throw new Error("Authentication required");
    }

    // Get the report
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    // Validate admin notes length if provided
    if (args.adminNotes && args.adminNotes.length > 1000) {
      throw new Error("Admin notes cannot exceed 1000 characters");
    }

    // Update the report
    await ctx.db.patch(args.reportId, {
      status: args.status,
      adminNotes: args.adminNotes,
      reviewedBy: ctx.user._id,
      reviewedAt: Date.now(),
    });

    return {
      success: true,
      message: `Report status updated to ${args.status}`,
    };
  },
});

/**
 * Delete a report (for admin use only)
 */
export const deleteReport = rateLimitedAuthMutationAccount({
  args: {
    reportId: v.id("reportedUsers"),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin role check here (higher level than moderator)
    if (!ctx.user) {
      throw new Error("Authentication required");
    }

    // Get the report
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    // Get the reported user to decrement report count
    const reportedUser = await ctx.db.get(report.reportedUserId);
    if (reportedUser) {
      const currentReportCount = reportedUser.reportCount || 0;
      await ctx.db.patch(report.reportedUserId, {
        reportCount: Math.max(0, currentReportCount - 1),
      });
    }

    // Delete the report
    await ctx.db.delete(args.reportId);

    return {
      success: true,
      message: "Report deleted successfully",
    };
  },
});

/**
 * Get report statistics (for admin dashboard)
 */
export const getReportStats = rateLimitedOptionalAuthQuery({
  args: {},
  handler: async (ctx, args) => {
    // TODO: Add admin/moderator role check here
    if (!ctx.user) {
      throw new Error("Authentication required");
    }

    // Get all reports and calculate statistics
    const allReports = await ctx.db.query("reportedUsers").collect();

    const stats = {
      total: allReports.length,
      pending: allReports.filter((r) => r.status === "pending").length,
      reviewed: allReports.filter((r) => r.status === "reviewed").length,
      resolved: allReports.filter((r) => r.status === "resolved").length,
      dismissed: allReports.filter((r) => r.status === "dismissed").length,
      byReason: {
        harassment_bullying: allReports.filter(
          (r) => r.reason === "harassment_bullying"
        ).length,
        impersonation: allReports.filter((r) => r.reason === "impersonation")
          .length,
        spam_account: allReports.filter((r) => r.reason === "spam_account")
          .length,
        fake_account: allReports.filter((r) => r.reason === "fake_account")
          .length,
        inappropriate_behavior: allReports.filter(
          (r) => r.reason === "inappropriate_behavior"
        ).length,
        violation_guidelines: allReports.filter(
          (r) => r.reason === "violation_guidelines"
        ).length,
        other: allReports.filter((r) => r.reason === "other").length,
      },
    };

    return stats;
  },
});

/**
 * Cancel/withdraw a report (by the reporter)
 */
export const cancelReport = rateLimitedAuthMutationLow({
  args: {
    reportId: v.id("reportedUsers"),
  },
  handler: async (ctx, args) => {
    // Get the report
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Report not found");
    }

    // Check if the current user is the reporter
    if (report.reporterId !== ctx.user._id) {
      throw new Error("You can only cancel your own reports");
    }

    // Only allow cancellation of pending reports
    if (report.status !== "pending") {
      throw new Error("You can only cancel pending reports");
    }

    // Get the reported user to decrement report count
    const reportedUser = await ctx.db.get(report.reportedUserId);
    if (reportedUser) {
      const currentReportCount = reportedUser.reportCount || 0;
      await ctx.db.patch(report.reportedUserId, {
        reportCount: Math.max(0, currentReportCount - 1),
      });
    }

    // Delete the report
    await ctx.db.delete(args.reportId);

    return {
      success: true,
      message: "Report cancelled successfully",
    };
  },
});

// =====================================================
// CONTENT REPORTING FUNCTIONALITY
// =====================================================

/**
 * Report content (post, comment, reply) for inappropriate content
 */
export const reportContent = rateLimitedAuthMutationLow({
  args: {
    contentId: v.string(),
    contentType: v.union(
      v.literal("confession"),
      v.literal("post"),
      v.literal("comment"),
      v.literal("story"),
      v.literal("other")
    ),
    contentAuthorId: v.id("users"),
    reason: v.union(
      v.literal("inappropriate_content"),
      v.literal("false_information"),
      v.literal("hate_speech"),
      v.literal("sexual_content"),
      v.literal("violence_threats"),
      v.literal("self_harm_content"),
      v.literal("doxxing_personal_info"),
      v.literal("illegal_activity"),
      v.literal("spam_repetitive"),
      v.literal("copyright_violation"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prevent self-reporting
    if (args.contentAuthorId === ctx.user._id) {
      throw new ConvexError("❌ You cannot report your own content.");
    }

    // Verify the content author exists
    const contentAuthor = await ctx.db.get(args.contentAuthorId);
    if (!contentAuthor) {
      throw new ConvexError("⚠️ Content author not found.");
    }

    // Verify the content exists based on type
    let content = null;
    if (
      args.contentType === "post" ||
      args.contentType === "confession" ||
      args.contentType === "story"
    ) {
      try {
        content = await ctx.db.get(args.contentId as any);
        if (!content || (content as any).status === "removed") {
          throw new ConvexError("⚠️ Content not found or has been removed.");
        }
      } catch (error) {
        throw new ConvexError("⚠️ Content not found or has been removed.");
      }
    } else if (args.contentType === "comment") {
      try {
        content = await ctx.db.get(args.contentId as any);
        if (!content || (content as any).status === "removed") {
          throw new ConvexError("⚠️ Comment not found or has been removed");
        }
      } catch (error) {
        throw new ConvexError("⚠️ Comment not found or has been removed");
      }
    }

    // Check if user has already reported this content
    const existingReport = await ctx.db
      .query("reportedContents")
      .withIndex("by_reporter", (q) => q.eq("reporterId", ctx.user._id))
      .filter((q) => q.eq(q.field("contentId"), args.contentId))
      .first();

    if (existingReport) {
      throw new ConvexError("⚠️ You have already reported this content.");
    }

    // Validate description length if provided
    if (args.description && args.description.length > 500) {
      throw new ConvexError("⚠️ Description cannot exceed 500 characters.");
    }

    // Create the content report
    const reportId = await ctx.db.insert("reportedContents", {
      reporterId: ctx.user._id,
      contentId: args.contentId,
      contentType: args.contentType,
      contentAuthorId: args.contentAuthorId,
      reason: args.reason,
      description: args.description,
      status: "pending",
    });

    // Increment the content's report count if it exists
    if (content && "reportsCount" in content) {
      const currentReportCount = content.reportsCount || 0;
      await ctx.db.patch(args.contentId as any, {
        reportsCount: currentReportCount + 1,
      });
    }

    return {
      success: true,
      reportId,
      message:
        "Content reported successfully. Our team will review this report.",
    };
  },
});

/**
 * Get paginated list of content reports for admin/moderator review
 */
export const getContentReports = rateLimitedOptionalAuthQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("reviewed"),
        v.literal("resolved"),
        v.literal("dismissed")
      )
    ),
    contentType: v.optional(
      v.union(
        v.literal("confession"),
        v.literal("post"),
        v.literal("comment"),
        v.literal("story"),
        v.literal("other")
      )
    ),
    reason: v.optional(
      v.union(
        v.literal("inappropriate_content"),
        v.literal("false_information"),
        v.literal("hate_speech"),
        v.literal("sexual_content"),
        v.literal("violence_threats"),
        v.literal("self_harm_content"),
        v.literal("doxxing_personal_info"),
        v.literal("illegal_activity"),
        v.literal("spam_repetitive"),
        v.literal("copyright_violation"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin/moderator role check here
    if (!ctx.user) {
      throw new Error("Authentication required");
    }

    let query;

    // Filter by status if provided
    if (args.status) {
      query = ctx.db
        .query("reportedContents")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc");
    }
    // Filter by content type if provided
    else if (args.contentType) {
      query = ctx.db
        .query("reportedContents")
        .withIndex("by_content_type", (q) =>
          q.eq("contentType", args.contentType!)
        )
        .order("desc");
    }
    // Filter by reason if provided
    else if (args.reason) {
      query = ctx.db
        .query("reportedContents")
        .withIndex("by_reason", (q) => q.eq("reason", args.reason!))
        .order("desc");
    }
    // No filters - get all content reports
    else {
      query = ctx.db.query("reportedContents").order("desc");
    }

    const reports = await query.paginate(args.paginationOpts);

    // Enrich with user and content information
    const enrichedReports = await Promise.all(
      reports.page.map(async (report) => {
        const [reporter, contentAuthor, reviewer] = await Promise.all([
          ctx.db.get(report.reporterId),
          ctx.db.get(report.contentAuthorId),
          report.reviewedBy ? ctx.db.get(report.reviewedBy) : null,
        ]);

        // Try to get the actual content
        let content = null;
        try {
          if (
            report.contentType === "post" ||
            report.contentType === "confession" ||
            report.contentType === "story"
          ) {
            content = await ctx.db.get(report.contentId as any);
          } else if (report.contentType === "comment") {
            content = await ctx.db.get(report.contentId as any);
          }
        } catch (error) {
          // Content might have been deleted
          content = null;
        }

        return {
          ...report,
          reporter: reporter
            ? {
                _id: reporter._id,
                userName: reporter.userName,
                emailAddress: reporter.emailAddress,
              }
            : null,
          contentAuthor: contentAuthor
            ? {
                _id: contentAuthor._id,
                userName: contentAuthor.userName,
                emailAddress: contentAuthor.emailAddress,
                accountStatus: contentAuthor.accountStatus,
              }
            : null,
          content: content
            ? {
                _id: content._id,
                content: (content as any).content || "Content unavailable",
                status: (content as any).status || "unknown",
                _creationTime: content._creationTime,
              }
            : null,
          reviewer: reviewer
            ? {
                _id: reviewer._id,
                userName: reviewer.userName,
              }
            : null,
        };
      })
    );

    return {
      ...reports,
      page: enrichedReports,
    };
  },
});

/**
 * Get content reports made by the current user
 */
export const getMyContentReports = rateLimitedOptionalAuthQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (!ctx.user) {
      throw new Error("Authentication required");
    }

    const reports = await ctx.db
      .query("reportedContents")
      .withIndex("by_reporter", (q) => q.eq("reporterId", ctx.user!._id))
      .order("desc")
      .paginate(args.paginationOpts);

    // Enrich with content author and content information
    const enrichedReports = await Promise.all(
      reports.page.map(async (report) => {
        const contentAuthor = await ctx.db.get(report.contentAuthorId);

        // Try to get the actual content
        let content = null;
        try {
          if (
            report.contentType === "post" ||
            report.contentType === "confession" ||
            report.contentType === "story"
          ) {
            content = await ctx.db.get(report.contentId as any);
          } else if (report.contentType === "comment") {
            content = await ctx.db.get(report.contentId as any);
          }
        } catch (error) {
          content = null;
        }

        return {
          ...report,
          contentAuthor: contentAuthor
            ? {
                _id: contentAuthor._id,
                userName: contentAuthor.userName,
                accountStatus: contentAuthor.accountStatus,
              }
            : null,
          content: content
            ? {
                _id: content._id,
                content:
                  ((content as any).content || "Content unavailable").substring(
                    0,
                    100
                  ) + "...", // Truncated preview
                status: (content as any).status || "unknown",
              }
            : null,
        };
      })
    );

    return {
      ...reports,
      page: enrichedReports,
    };
  },
});

/**
 * Get content reports against a specific piece of content
 */
export const getReportsAgainstContent = rateLimitedOptionalAuthQuery({
  args: {
    contentId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // TODO: Add admin/moderator role check here
    if (!ctx.user) {
      throw new Error("Authentication required");
    }

    const reports = await ctx.db
      .query("reportedContents")
      .withIndex("by_content", (q) => q.eq("contentId", args.contentId))
      .order("desc")
      .paginate(args.paginationOpts);

    // Enrich with reporter information
    const enrichedReports = await Promise.all(
      reports.page.map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId);

        return {
          ...report,
          reporter: reporter
            ? {
                _id: reporter._id,
                userName: reporter.userName,
                emailAddress: reporter.emailAddress,
              }
            : null,
        };
      })
    );

    return {
      ...reports,
      page: enrichedReports,
    };
  },
});

/**
 * Update content report status (for admin/moderator use)
 */
export const updateContentReportStatus = rateLimitedAuthMutationMedium({
  args: {
    reportId: v.id("reportedContents"),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    adminNotes: v.optional(v.string()),
    contentRemoved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin/moderator role check here
    if (!ctx.user) {
      throw new Error("Authentication required");
    }

    // Get the report
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Content report not found");
    }

    // Validate admin notes length if provided
    if (args.adminNotes && args.adminNotes.length > 1000) {
      throw new Error("Admin notes cannot exceed 1000 characters");
    }

    const updateData: any = {
      status: args.status,
      adminNotes: args.adminNotes,
      reviewedBy: ctx.user._id,
      reviewedAt: Date.now(),
    };

    // If content was removed, update the content status
    if (args.contentRemoved) {
      updateData.contentRemoved = true;
      updateData.contentRemovedAt = Date.now();

      // Try to update the actual content status
      try {
        if (
          report.contentType === "post" ||
          report.contentType === "confession" ||
          report.contentType === "story"
        ) {
          await ctx.db.patch(report.contentId as any, {
            status: "removed",
            moderatorNotes: `Content removed due to report: ${report.reason}`,
          });
        } else if (report.contentType === "comment") {
          await ctx.db.patch(report.contentId as any, {
            status: "removed",
            moderatorNotes: `Content removed due to report: ${report.reason}`,
          });
        }
      } catch (error) {
        // Content might already be deleted - continue with report update
      }
    }

    // Update the report
    await ctx.db.patch(args.reportId, updateData);

    return {
      success: true,
      message: `Content report status updated to ${args.status}`,
      contentRemoved: args.contentRemoved || false,
    };
  },
});

/**
 * Delete a content report (for admin use only)
 */
export const deleteContentReport = rateLimitedAuthMutationAccount({
  args: {
    reportId: v.id("reportedContents"),
  },
  handler: async (ctx, args) => {
    // TODO: Add admin role check here (higher level than moderator)
    if (!ctx.user) {
      throw new Error("Authentication required");
    }

    // Get the report
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Content report not found");
    }

    // Try to decrement the content's report count
    try {
      if (
        report.contentType === "post" ||
        report.contentType === "confession" ||
        report.contentType === "story"
      ) {
        const content = await ctx.db.get(report.contentId as any);
        if (content && "reportsCount" in content) {
          const currentReportCount = content.reportsCount || 0;
          await ctx.db.patch(report.contentId as any, {
            reportsCount: Math.max(0, currentReportCount - 1),
          });
        }
      } else if (report.contentType === "comment") {
        const content = await ctx.db.get(report.contentId as any);
        if (content && "reportsCount" in content) {
          const currentReportCount = content.reportsCount || 0;
          await ctx.db.patch(report.contentId as any, {
            reportsCount: Math.max(0, currentReportCount - 1),
          });
        }
      }
    } catch (error) {
      // Content might be deleted - continue with report deletion
    }

    // Delete the report
    await ctx.db.delete(args.reportId);

    return {
      success: true,
      message: "Content report deleted successfully",
    };
  },
});

/**
 * Get content report statistics (for admin dashboard)
 */
export const getContentReportStats = rateLimitedOptionalAuthQuery({
  args: {},
  handler: async (ctx, args) => {
    // TODO: Add admin/moderator role check here
    if (!ctx.user) {
      throw new Error("Authentication required");
    }

    // Get all content reports and calculate statistics
    const allReports = await ctx.db.query("reportedContents").collect();

    const stats = {
      total: allReports.length,
      pending: allReports.filter((r) => r.status === "pending").length,
      reviewed: allReports.filter((r) => r.status === "reviewed").length,
      resolved: allReports.filter((r) => r.status === "resolved").length,
      dismissed: allReports.filter((r) => r.status === "dismissed").length,
      contentRemoved: allReports.filter((r) => r.contentRemoved === true)
        .length,
      byContentType: {
        confession: allReports.filter((r) => r.contentType === "confession")
          .length,
        post: allReports.filter((r) => r.contentType === "post").length,
        comment: allReports.filter((r) => r.contentType === "comment").length,
        story: allReports.filter((r) => r.contentType === "story").length,
        other: allReports.filter((r) => r.contentType === "other").length,
      },
      byReason: {
        inappropriate_content: allReports.filter(
          (r) => r.reason === "inappropriate_content"
        ).length,
        false_information: allReports.filter(
          (r) => r.reason === "false_information"
        ).length,
        hate_speech: allReports.filter((r) => r.reason === "hate_speech")
          .length,
        sexual_content: allReports.filter((r) => r.reason === "sexual_content")
          .length,
        violence_threats: allReports.filter(
          (r) => r.reason === "violence_threats"
        ).length,
        self_harm_content: allReports.filter(
          (r) => r.reason === "self_harm_content"
        ).length,
        doxxing_personal_info: allReports.filter(
          (r) => r.reason === "doxxing_personal_info"
        ).length,
        illegal_activity: allReports.filter(
          (r) => r.reason === "illegal_activity"
        ).length,
        spam_repetitive: allReports.filter(
          (r) => r.reason === "spam_repetitive"
        ).length,
        copyright_violation: allReports.filter(
          (r) => r.reason === "copyright_violation"
        ).length,
        other: allReports.filter((r) => r.reason === "other").length,
      },
    };

    return stats;
  },
});

/**
 * Cancel/withdraw a content report (by the reporter)
 */
export const cancelContentReport = rateLimitedAuthMutationLow({
  args: {
    reportId: v.id("reportedContents"),
  },
  handler: async (ctx, args) => {
    // Get the report
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("Content report not found");
    }

    // Check if the current user is the reporter
    if (report.reporterId !== ctx.user._id) {
      throw new Error("You can only cancel your own reports");
    }

    // Only allow cancellation of pending reports
    if (report.status !== "pending") {
      throw new Error("You can only cancel pending reports");
    }

    // Try to decrement the content's report count
    try {
      if (
        report.contentType === "post" ||
        report.contentType === "confession" ||
        report.contentType === "story"
      ) {
        const content = await ctx.db.get(report.contentId as any);
        if (content && "reportsCount" in content) {
          const currentReportCount = content.reportsCount || 0;
          await ctx.db.patch(report.contentId as any, {
            reportsCount: Math.max(0, currentReportCount - 1),
          });
        }
      } else if (report.contentType === "comment") {
        const content = await ctx.db.get(report.contentId as any);
        if (content && "reportsCount" in content) {
          const currentReportCount = content.reportsCount || 0;
          await ctx.db.patch(report.contentId as any, {
            reportsCount: Math.max(0, currentReportCount - 1),
          });
        }
      }
    } catch (error) {
      // Content might be deleted - continue with report deletion
    }

    // Delete the report
    await ctx.db.delete(args.reportId);

    return {
      success: true,
      message: "Content report cancelled successfully",
    };
  },
});
