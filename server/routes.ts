import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertStorySchema, insertCommentSchema, type StoryWithAssignee } from "@shared/schema";
import { z } from "zod";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Story routes
  app.get("/api/stories", requireAuth, async (req, res) => {
    try {
      const stories = await storage.getAllStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.get("/api/stories/status/:status", requireAuth, async (req, res) => {
    try {
      const { status } = req.params;
      const stories = await storage.getStoriesByStatus(status);
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stories by status" });
    }
  });

  app.get("/api/stories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const story = await storage.getStory(id);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });

  app.post("/api/stories", requireAuth, async (req, res) => {
    try {
      const storyData = insertStorySchema.parse({
        ...req.body,
        createdBy: req.user!.id,
        updatedBy: req.user!.id,
      });
      const story = await storage.createStory(storyData);
      res.status(201).json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid story data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  app.patch("/api/stories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body, updatedBy: req.user!.id };
      const story = await storage.updateStory(id, updateData);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      res.status(500).json({ message: "Failed to update story" });
    }
  });

  app.delete("/api/stories/:id", requireRole(["Admin", "Team Lead"]), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteStory(id);
      if (!deleted) {
        return res.status(404).json({ message: "Story not found" });
      }
      res.json({ message: "Story deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete story" });
    }
  });

  // Comment routes
  app.get("/api/stories/:storyId/comments", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const comments = await storage.getCommentsByStoryId(storyId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/stories/:storyId/comments", requireAuth, async (req, res) => {
    try {
      const { storyId } = req.params;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        storyId,
        userId: req.user!.id,
      });
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteComment(id);
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // User management routes (Admin only)
  app.get("/api/users", requireRole(["Admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", requireAuth, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // AI Estimation placeholder
  app.post("/api/stories/ai-estimate", requireAuth, async (req, res) => {
    try {
      const { title, description } = req.body;
      
      // Simple AI estimation logic based on content
      let estimatedPointer = 1;
      const contentLength = (title + description).length;
      
      if (contentLength > 200) {
        estimatedPointer = 13;
      } else if (contentLength > 100) {
        estimatedPointer = 8;
      } else if (contentLength > 50) {
        estimatedPointer = 5;
      } else {
        estimatedPointer = 3;
      }

      // Priority suggestion logic
      let prioritySuggestion = "Medium";
      const titleLower = title.toLowerCase();
      const descLower = description.toLowerCase();
      
      if (titleLower.includes("critical") || titleLower.includes("urgent") || 
          descLower.includes("bug") || descLower.includes("security")) {
        prioritySuggestion = "High";
      } else if (titleLower.includes("nice") || titleLower.includes("enhancement") ||
                 descLower.includes("improvement")) {
        prioritySuggestion = "Low";
      }

      res.json({
        estimatedPointer,
        prioritySuggestion,
        confidence: 0.75, // Mock confidence score
        reasoning: `Based on content analysis: ${contentLength} characters suggest ${estimatedPointer} story points. Keywords indicate ${prioritySuggestion} priority.`,
      });
    } catch (error) {
      res.status(500).json({ message: "AI estimation service unavailable" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
