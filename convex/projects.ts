import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    priority: v.string(),
    dueDate: v.number(),
    spaceId: v.optional(v.id("spaces")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the user owns the space if provided
    if (args.spaceId) {
      const space = await ctx.db.get(args.spaceId);
      if (!space || space.ownerId !== userId) {
        throw new Error("Space not found or not authorized");
      }
    }

    return await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      priority: args.priority,
      dueDate: args.dueDate,
      status: "Not Started",
      progress: 0,
      taskCount: 0,
      ownerId: userId,
      spaceId: args.spaceId,
    });
  },
});

export const list = query({
  args: {
    spaceId: v.optional(v.id("spaces")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.spaceId) {
      // Verify the user owns the space
      const space = await ctx.db.get(args.spaceId);
      if (!space || space.ownerId !== userId) {
        throw new Error("Space not found or not authorized");
      }

      return await ctx.db
        .query("projects")
        .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
        .collect();
    } else {
      // Return all projects for the user (for backward compatibility)
      return await ctx.db
        .query("projects")
        .filter((q) => q.eq(q.field("ownerId"), userId))
        .collect();
    }
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.string(),
    description: v.string(),
    priority: v.string(),
    status: v.string(),
    progress: v.number(),
    dueDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== userId) {
      throw new Error("Not authorized");
    }

    return await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
      priority: args.priority,
      status: args.status,
      progress: args.progress,
      dueDate: args.dueDate,
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});
