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
});
export const userCount = defineTable({
  count: v.number(),
});

export const pushToken = defineTable({
  userId: v.optional(v.id("users")),
  pushToken: v.string(),
  deviceId: v.string(),
  platform: v.string(),
  deviceName: v.string(),
  deviceType: v.string(),
  modelName: v.string(),
  brand: v.string(),
  manufacturer: v.string(),
  osName: v.string(),
  osVersion: v.string(),
  timestamp: v.string(),
});

export default defineSchema({
  users: users
    .index("by_clerk_id", ["clerkId"])
    .index("by_user_name", ["userName"])
    .index("by_gender", ["gender"])
    .index("by_age", ["age"]),
  userCount: userCount,
  pushToken: pushToken
    .index("by_user", ["userId"])
    .index("by_deviceId", ["deviceId"])
    .index("by_push_token", ["pushToken"]),
});

export type USER_TABLE = Infer<typeof users.validator> & {
  _id: Id<"users">;
  _creationTime: number;
};
