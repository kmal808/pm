import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { PDFDocument } from "pdf-lib";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
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

    return await ctx.db.insert("documents", {
      storageId: args.storageId,
      name: args.name,
      type: args.type,
      size: args.size,
      projectId: args.projectId,
      uploadedBy: userId,
      uploadedAt: Date.now(),
      spaceId: args.spaceId,
    });
  },
});

export const list = query({
  args: {
    spaceId: v.optional(v.id("spaces")),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let documentsQuery;

    if (args.spaceId) {
      // Verify the user owns the space
      const space = await ctx.db.get(args.spaceId);
      if (!space || space.ownerId !== userId) {
        throw new Error("Space not found or not authorized");
      }

      if (args.projectId) {
        documentsQuery = ctx.db
          .query("documents")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId));
      } else {
        documentsQuery = ctx.db
          .query("documents")
          .withIndex("by_space", (q) => q.eq("spaceId", args.spaceId));
      }
    } else {
      // Return all documents for the user (for backward compatibility)
      documentsQuery = ctx.db
        .query("documents")
        .withIndex("by_uploaded", (q) => q.eq("uploadedBy", userId));
    }

    const documents = await documentsQuery.collect();

    // Get signed URLs for each document
    return await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        url: await ctx.storage.getUrl(doc.storageId),
      }))
    );
  },
});

export const remove = mutation({
  args: {
    id: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const document = await ctx.db.get(args.id);
    if (!document) {
      throw new Error("Document not found");
    }

    if (document.uploadedBy !== userId) {
      throw new Error("Not authorized");
    }

    // Delete the file from storage
    await ctx.storage.delete(document.storageId);
    // Delete the document record
    await ctx.db.delete(args.id);
  },
});

export const convertToPdf = action({
  args: {
    documentId: v.id("documents"),
    spaceId: v.optional(v.id("spaces")),
  },
  handler: async (ctx, args) => {
    const documents = await ctx.runQuery(api.documents.list, { 
      spaceId: args.spaceId 
    });
    const doc = documents.find(d => d._id === args.documentId);
    if (!doc) {
      throw new Error("Document not found");
    }

    if (!doc.url) {
      throw new Error("Document URL not found");
    }

    // Download the image
    const response = await fetch(doc.url);
    const imageBytes = await response.arrayBuffer();

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    // Embed the image in the PDF
    let image;
    if (doc.type.includes('png')) {
      image = await pdfDoc.embedPng(imageBytes);
    } else if (doc.type.includes('jpeg') || doc.type.includes('jpg')) {
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      throw new Error("Unsupported image format");
    }

    // Get the dimensions of the image
    const { width, height } = image.scale(1);
    
    // Scale the image to fit the page
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const scale = Math.min(pageWidth / width, pageHeight / height);
    
    // Center the image on the page
    const x = (pageWidth - width * scale) / 2;
    const y = (pageHeight - height * scale) / 2;

    // Draw the image on the page
    page.drawImage(image, {
      x,
      y,
      width: width * scale,
      height: height * scale,
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Generate upload URL for the PDF
    const uploadUrl = await ctx.runMutation(api.documents.generateUploadUrl, {});

    // Upload the PDF
    const uploadResp = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: pdfBytes,
    });

    if (!uploadResp.ok) {
      throw new Error("Failed to upload PDF");
    }

    const { storageId } = await uploadResp.json();

    // Create a new document record for the PDF
    await ctx.runMutation(api.documents.create, {
      storageId,
      name: `${doc.name.split('.')[0]}.pdf`,
      type: "application/pdf",
      size: pdfBytes.byteLength,
      projectId: doc.projectId,
      spaceId: args.spaceId,
    });
  },
});
