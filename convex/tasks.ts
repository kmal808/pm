import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    priority: v.string(),
    status: v.string(),
    dueDate: v.number(),
    projectId: v.optional(v.id("projects")),
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

    const taskId = await ctx.db.insert("tasks", {
      ...args,
      assignedTo: userId,
    });

    // Update project task count if this task is associated with a project
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (project) {
        await ctx.db.patch(args.projectId, {
          taskCount: (project.taskCount || 0) + 1,
        });
      }
    }

    return taskId;
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.assignedTo !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }

    if (task.assignedTo !== userId) {
      throw new Error("Not authorized");
    }

    // Update project task count if this task is associated with a project
    if (task.projectId) {
      const project = await ctx.db.get(task.projectId);
      if (project) {
        await ctx.db.patch(task.projectId, {
          taskCount: Math.max(0, (project.taskCount || 0) - 1),
        });
      }
    }

    await ctx.db.delete(args.id);
  },
});

export const listAssigned = query({
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
        .query("tasks")
        .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId))
        .filter((q) => q.eq(q.field("assignedTo"), userId))
        .collect();
    } else {
      // Return all tasks for the user (for backward compatibility)
      return await ctx.db
        .query("tasks")
        .withIndex("by_assigned", (q) => q.eq("assignedTo", userId))
        .collect();
    }
  },
});

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});
