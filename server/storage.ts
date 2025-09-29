import { 
  type User, 
  type InsertUser, 
  type Story, 
  type InsertStory, 
  type Comment, 
  type InsertComment, 
  type StoryWithAssignee, 
  type CommentWithUser,
  users,
  stories,
  comments
} from "@shared/schema";
import { db } from "./db";
import { eq, count, sql } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PgSession = ConnectPgSimple(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Story operations
  getStory(id: string): Promise<StoryWithAssignee | undefined>;
  getStoriesByStatus(status: string): Promise<StoryWithAssignee[]>;
  getAllStories(): Promise<StoryWithAssignee[]>;
  getStoriesByWorkspace(workspace: string): Promise<StoryWithAssignee[]>;
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: string, updates: Partial<Story>): Promise<Story | undefined>;
  deleteStory(id: string): Promise<boolean>;

  // Comment operations
  getCommentsByStoryId(storyId: string): Promise<CommentWithUser[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<boolean>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalStories: number;
    completed: number;
    totalPoints: number;
    teamMembers: number;
    storiesByStatus: Record<string, number>;
    storiesByPriority: Record<string, number>;
  }>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    this.sessionStore = new PgSession({
      pool: pool,
      tableName: 'session',
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: insertUser.role || "User",
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getStory(id: string): Promise<StoryWithAssignee | undefined> {
    const [story] = await db
      .select({
        story: stories,
        assignee: users,
      })
      .from(stories)
      .leftJoin(users, eq(stories.assigneeId, users.id))
      .where(eq(stories.id, id));

    if (!story) return undefined;

    const [createdByUser] = await db.select().from(users).where(eq(users.id, story.story.createdBy));
    const [commentCountResult] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.storyId, id));

    return {
      ...story.story,
      assignee: story.assignee || undefined,
      createdByUser: createdByUser || undefined,
      commentCount: commentCountResult?.count || 0,
    };
  }

  async getStoriesByStatus(status: string): Promise<StoryWithAssignee[]> {
    const storyResults = await db
      .select({
        story: stories,
        assignee: users,
      })
      .from(stories)
      .leftJoin(users, eq(stories.assigneeId, users.id))
      .where(eq(stories.status, status));

    const result: StoryWithAssignee[] = [];
    for (const row of storyResults) {
      const [createdByUser] = await db.select().from(users).where(eq(users.id, row.story.createdBy));
      const [commentCountResult] = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.storyId, row.story.id));

      result.push({
        ...row.story,
        assignee: row.assignee || undefined,
        createdByUser: createdByUser || undefined,
        commentCount: commentCountResult?.count || 0,
      });
    }

    return result;
  }

  async getAllStories(): Promise<StoryWithAssignee[]> {
    const storyResults = await db
      .select({
        story: stories,
        assignee: users,
      })
      .from(stories)
      .leftJoin(users, eq(stories.assigneeId, users.id));

    const result: StoryWithAssignee[] = [];
    for (const row of storyResults) {
      const [createdByUser] = await db.select().from(users).where(eq(users.id, row.story.createdBy));
      const [commentCountResult] = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.storyId, row.story.id));

      result.push({
        ...row.story,
        assignee: row.assignee || undefined,
        createdByUser: createdByUser || undefined,
        commentCount: commentCountResult?.count || 0,
      });
    }

    return result;
  }

  async getStoriesByWorkspace(workspace: string): Promise<StoryWithAssignee[]> {
    const storyResults = await db
      .select({
        story: stories,
        assignee: users,
      })
      .from(stories)
      .leftJoin(users, eq(stories.assigneeId, users.id))
      .where(eq(stories.workspace, workspace));

    const result: StoryWithAssignee[] = [];
    for (const row of storyResults) {
      const [createdByUser] = await db.select().from(users).where(eq(users.id, row.story.createdBy));
      const [commentCountResult] = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.storyId, row.story.id));

      result.push({
        ...row.story,
        assignee: row.assignee || undefined,
        createdByUser: createdByUser || undefined,
        commentCount: commentCountResult?.count || 0,
      });
    }

    return result;
  }

  async createStory(story: InsertStory): Promise<Story> {
    // Generate next story number based on project
    const project = story.project || "T&D";
    const existingStories = await db
      .select({ storyNumber: stories.storyNumber })
      .from(stories)
      .where(eq(stories.project, project));

    const existingNumbers = existingStories
      .filter(s => s.storyNumber)
      .map(s => parseInt(s.storyNumber!.split('-')[1]))
      .filter(n => !isNaN(n));

    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1001;
    const storyNumber = `${project}-${nextNumber.toString().padStart(4, '0')}`;

    const [newStory] = await db
      .insert(stories)
      .values({
        ...story,
        storyNumber,
        status: story.status || "To Do",
        priority: story.priority || "Medium",
        storyType: story.storyType || "Story",
        project: project,
        workspace: story.workspace || project,
        activeSprint: story.activeSprint || "sprint-1",
        updatedBy: story.updatedBy || story.createdBy,
      })
      .returning();

    return newStory;
  }

  async updateStory(id: string, updates: Partial<Story>): Promise<Story | undefined> {
    const [story] = await db
      .update(stories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stories.id, id))
      .returning();
    return story || undefined;
  }

  async deleteStory(id: string): Promise<boolean> {
    const result = await db.delete(stories).where(eq(stories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getCommentsByStoryId(storyId: string): Promise<CommentWithUser[]> {
    const commentResults = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.storyId, storyId))
      .orderBy(comments.createdAt);

    return commentResults.map(row => ({
      ...row.comment,
      user: row.user,
    }));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return newComment;
  }

  async deleteComment(id: string): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDashboardMetrics(): Promise<{
    totalStories: number;
    completed: number;
    totalPoints: number;
    teamMembers: number;
    storiesByStatus: Record<string, number>;
    storiesByPriority: Record<string, number>;
  }> {
    const allStories = await db.select().from(stories);
    const allUsers = await db.select().from(users);

    const storiesByStatus = allStories.reduce((acc, story) => {
      acc[story.status] = (acc[story.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const storiesByPriority = allStories.reduce((acc, story) => {
      acc[story.priority] = (acc[story.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalStories: allStories.length,
      completed: storiesByStatus["Completed"] || 0,
      totalPoints: allStories.reduce((sum, story) => sum + (story.pointer || 0), 0),
      teamMembers: allUsers.length,
      storiesByStatus,
      storiesByPriority,
    };
  }
}

export const storage = new DatabaseStorage();