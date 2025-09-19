import { defineRateLimits } from "convex-helpers/server/rateLimit";

const SECOND = 1000; // ms
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const { checkRateLimit, rateLimit, resetRateLimit } = defineRateLimits({
  // High-frequency actions - likes, basic queries
  // Allows up to 5 in quick succession if they haven't done many recently
  likeAction: {
    kind: "token bucket",
    rate: 60,
    period: MINUTE,
    capacity: 5,
  },

  // Medium-frequency actions - creating posts, comments, replies
  // More restrictive to prevent spam
  createContent: {
    kind: "token bucket",
    rate: 20,
    period: MINUTE,
    capacity: 3,
  },

  // Low-frequency actions - file uploads, reports
  // Very restrictive for resource-intensive operations
  heavyAction: {
    kind: "fixed window",
    rate: 10,
    period: MINUTE,
  },

  // Account-level actions - profile updates, settings changes
  accountAction: {
    kind: "fixed window",
    rate: 5,
    period: MINUTE,
  },

  // Public queries - for unauthenticated users
  // Global rate limit to prevent abuse
  publicQuery: {
    kind: "fixed window",
    rate: 1000,
    period: HOUR,
  },

  // Pagination queries - allow reasonable browsing
  paginationQuery: {
    kind: "token bucket",
    rate: 100,
    period: MINUTE,
    capacity: 20,
  },
});
