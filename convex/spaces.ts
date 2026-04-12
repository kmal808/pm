import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("spaces", {
      name: args.name,
      description: args.description,
      ownerId: userId,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("spaces")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("spaces"),
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const space = await ctx.db.get(args.id);
    if (!space) {
      throw new Error("Space not found");
    }

    if (space.ownerId !== userId) {
      throw new Error("Not authorized");
    }

    return await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("spaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const space = await ctx.db.get(args.id);
    if (!space) {
      throw new Error("Space not found");
    }

    if (space.ownerId !== userId) {
      throw new Error("Not authorized");
    }

    // Note: In a production app, you might want to handle cascading deletes
    // or prevent deletion if the space contains projects/tasks/documents
    await ctx.db.delete(args.id);
  },
});
