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

export default defineSchema({
  users: users
    .index("by_clerk_id", ["clerkId"])
    .index("by_user_name", ["userName"])
    .index("by_gender", ["gender"])
    .index("by_age", ["age"]),
  userCount: userCount,
});

export type USER_TABLE = Infer<typeof users.validator> & {
  _id: Id<"users">;
  _creationTime: number;
};
