import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  spaces: defineTable({
    name: v.string(),
    description: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),
  projects: defineTable({
    name: v.string(),
    description: v.string(),
    priority: v.string(),
    status: v.optional(v.string()),
    progress: v.optional(v.number()),
    dueDate: v.number(),
    taskCount: v.optional(v.number()),
    ownerId: v.id("users"),
    spaceId: v.optional(v.id("spaces")),
  })
    .index("by_owner", ["ownerId"])
    .index("by_space", ["spaceId"]),
  tasks: defineTable({
    name: v.string(),
    description: v.string(),
    priority: v.string(),
    status: v.string(),
    dueDate: v.number(),
    projectId: v.optional(v.id("projects")),
    assignedTo: v.id("users"),
    spaceId: v.optional(v.id("spaces")),
  })
    .index("by_project", ["projectId"])
    .index("by_assigned", ["assignedTo"])
    .index("by_space", ["spaceId"]),
  documents: defineTable({
    name: v.string(),
    type: v.string(),
    size: v.number(),
    storageId: v.id("_storage"),
    projectId: v.optional(v.id("projects")),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    spaceId: v.optional(v.id("spaces")),
  })
    .index("by_project", ["projectId"])
    .index("by_uploaded", ["uploadedBy"])
    .index("by_space", ["spaceId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
