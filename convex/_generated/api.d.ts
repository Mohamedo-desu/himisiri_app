/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as comments from "../comments.js";
import type * as customFunctions from "../customFunctions.js";
import type * as http from "../http.js";
import type * as likes from "../likes.js";
import type * as notificationTriggers from "../notificationTriggers.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as pushTokens from "../pushTokens.js";
import type * as rateLimitedFunctions from "../rateLimitedFunctions.js";
import type * as rateLimits from "../rateLimits.js";
import type * as triggers from "../triggers.js";
import type * as userPresence from "../userPresence.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  comments: typeof comments;
  customFunctions: typeof customFunctions;
  http: typeof http;
  likes: typeof likes;
  notificationTriggers: typeof notificationTriggers;
  notifications: typeof notifications;
  posts: typeof posts;
  pushNotifications: typeof pushNotifications;
  pushTokens: typeof pushTokens;
  rateLimitedFunctions: typeof rateLimitedFunctions;
  rateLimits: typeof rateLimits;
  triggers: typeof triggers;
  userPresence: typeof userPresence;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
