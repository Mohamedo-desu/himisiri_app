import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { internalMutation } from "./triggers";

/**
 * Create a new app version record.
 */
export const createVersion = internalMutation({
  args: {
    version: v.string(),
    type: v.union(v.literal("major"), v.literal("minor"), v.literal("patch")),
    releaseNotes: v.string(),
    downloadUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prevent duplicates of same version
    const existing = await ctx.db
      .query("appVersions")
      .withIndex("by_version", (q) => q.eq("version", args.version))
      .first();

    if (existing) {
      throw new Error(`Version ${args.version} already exists.`);
    }

    await ctx.db.insert("appVersions", {
      version: args.version,
      type: args.type,
      releaseNotes: args.releaseNotes,
      downloadUrl: args.downloadUrl,
    });

    return { success: true, message: "Version created successfully" };
  },
});

/**
 * Get the latest version by type (major, minor, or patch)
 */
export const getLatestVersion = internalQuery({
  args: {
    type: v.union(v.literal("major"), v.literal("minor"), v.literal("patch")),
  },
  handler: async (ctx, { type }) => {
    const versions = await ctx.db
      .query("appVersions")
      .withIndex("by_type", (q) => q.eq("type", type))
      .order("desc")
      .collect();

    if (versions.length === 0) return null;

    // Sort semantically if version uses standard semver (e.g., "1.2.3")
    const sorted = versions.sort((a, b) => {
      const [aMajor, aMinor, aPatch] = a.version.split(".").map(Number);
      const [bMajor, bMinor, bPatch] = b.version.split(".").map(Number);
      return bMajor - aMajor || bMinor - aMinor || bPatch - aPatch;
    });

    return sorted[0];
  },
});

/**
 * List all versions (optionally filtered by type)
 */
export const listVersions = internalQuery({
  args: {
    type: v.optional(
      v.union(v.literal("major"), v.literal("minor"), v.literal("patch"))
    ),
  },
  handler: async (ctx, { type }) => {
    const queryBuilder = ctx.db.query("appVersions");
    const results = type
      ? await queryBuilder
          .withIndex("by_type", (q) => q.eq("type", type))
          .order("desc")
          .collect()
      : await queryBuilder.order("desc").collect();

    return results.sort((a, b) => {
      const [aMajor, aMinor, aPatch] = a.version.split(".").map(Number);
      const [bMajor, bMinor, bPatch] = b.version.split(".").map(Number);
      return bMajor - aMajor || bMinor - aMinor || bPatch - aPatch;
    });
  },
});

/**
 * Optional: Delete a version (for admin cleanup)
 */
export const deleteVersion = internalMutation({
  args: { version: v.string() },
  handler: async (ctx, { version }) => {
    const existing = await ctx.db
      .query("appVersions")
      .withIndex("by_version", (q) => q.eq("version", version))
      .first();

    if (!existing) throw new Error("Version not found");

    await ctx.db.delete(existing._id);
    return { success: true, message: `Version ${version} deleted` };
  },
});
