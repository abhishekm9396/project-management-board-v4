import { type User, type InsertUser, type Story, type InsertStory, type Comment, type InsertComment, type StoryWithAssignee, type CommentWithUser } from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import bcrypt from "bcryptjs";

const MemoryStore = createMemoryStore(session);

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private stories: Map<string, Story>;
  private comments: Map<string, Comment>;
  public sessionStore: any;

  constructor() {
    this.users = new Map();
    this.stories = new Map();
    this.comments = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize with seed data
    this.initializeSeedData();
  }

  private async initializeSeedData() {
    // Create sample users
    const adminUser = {
      id: randomUUID(),
      username: "admin",
      email: "admin@project.com",
      password: "$2b$10$vje0iEeqeBEfFpWOz21RLu4EMG9jQ28Bq7q/puUP18NqodIdlbRs2", // password: admin123
      name: "Admin User",
      role: "Admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const shantnu = {
      id: randomUUID(),
      username: "shantnu",
      email: "shantnu@project.com",
      password: "$2b$10$vje0iEeqeBEfFpWOz21RLu4EMG9jQ28Bq7q/puUP18NqodIdlbRs2", // password: admin123
      name: "Shantnu",
      role: "Team Lead",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pranav = {
      id: randomUUID(),
      username: "pranav",
      email: "pranav@project.com",
      password: "$2b$10$vje0iEeqeBEfFpWOz21RLu4EMG9jQ28Bq7q/puUP18NqodIdlbRs2", // password: admin123
      name: "Pranav",
      role: "Team Lead",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const abhishek = {
      id: randomUUID(),
      username: "abhishek",
      email: "abhishek@project.com",
      password: "$2b$10$vje0iEeqeBEfFpWOz21RLu4EMG9jQ28Bq7q/puUP18NqodIdlbRs2", // password: admin123
      name: "Abhishek",
      role: "User",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tanay = {
      id: randomUUID(),
      username: "tanay",
      email: "tanay@project.com",
      password: "$2b$10$vje0iEeqeBEfFpWOz21RLu4EMG9jQ28Bq7q/puUP18NqodIdlbRs2", // password: admin123
      name: "Tanay",
      role: "User",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(shantnu.id, shantnu);
    this.users.set(pranav.id, pranav);
    this.users.set(abhishek.id, abhishek);
    this.users.set(tanay.id, tanay);

    // Create sample stories
    const stories = [
      {
        id: randomUUID(),
        storyNumber: "T&D-1001",
        title: "Setup Authentication System",
        description: "Implement JWT-based authentication with role-based access control",
        pointer: 8,
        acceptanceCriteria: "- User can login with email/password\n- JWT tokens are generated\n- Role-based access is enforced",
        status: "To Do",
        priority: "High",
        storyType: "Story",
        project: "T&D",
        workspace: "T&D",
        teamLead: "Shantnu",
        epicLink: null,
        activeSprint: "sprint-1",
        sprintId: "sprint-1",
        tags: ["auth", "security"],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assigneeId: adminUser.id,
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        storyNumber: "T&D-1002",
        title: "Design Database Schema",
        description: "Create SQLAlchemy models for all entities",
        pointer: 5,
        acceptanceCriteria: "- All models defined\n- Relationships established\n- Migrations created",
        status: "To Do",
        priority: "Medium",
        storyType: "Story",
        project: "T&D",
        workspace: "T&D",
        teamLead: "Shantnu",
        epicLink: null,
        activeSprint: "sprint-1",
        sprintId: "sprint-1",
        tags: ["database", "schema"],
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        assigneeId: tanay.id,
        createdBy: shantnu.id,
        updatedBy: shantnu.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        storyNumber: "T&D-1003",
        title: "Implement Kanban Board",
        description: "Create drag-and-drop interface with react-beautiful-dnd",
        pointer: 13,
        acceptanceCriteria: "- Drag and drop functionality\n- Column management\n- Real-time updates",
        status: "In Progress",
        priority: "High",
        storyType: "Story",
        project: "T&D",
        workspace: "T&D",
        teamLead: "Shantnu",
        epicLink: null,
        activeSprint: "sprint-1",
        sprintId: "sprint-1",
        tags: ["frontend", "kanban"],
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        assigneeId: shantnu.id,
        createdBy: pranav.id,
        updatedBy: pranav.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        storyNumber: "ADMS-1001",
        title: "User Dashboard",
        description: "Create responsive dashboard with metrics",
        pointer: 8,
        acceptanceCriteria: "- Metrics display\n- Charts integration\n- Responsive design",
        status: "Validation",
        priority: "Medium",
        storyType: "Story",
        project: "ADMS",
        workspace: "ADMS",
        teamLead: "Pranav",
        epicLink: null,
        activeSprint: "sprint-1",
        sprintId: "sprint-1",
        tags: ["frontend", "dashboard"],
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        assigneeId: pranav.id,
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        storyNumber: "T&D-1004",
        title: "Project Setup",
        description: "Initialize React and Express projects",
        pointer: 3,
        acceptanceCriteria: "- Projects initialized\n- Dependencies installed\n- Basic structure created",
        status: "Completed",
        priority: "Low",
        storyType: "Story",
        project: "T&D",
        workspace: "T&D",
        teamLead: "Shantnu",
        epicLink: null,
        activeSprint: "sprint-1",
        sprintId: "sprint-1",
        tags: ["setup", "initial"],
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        assigneeId: adminUser.id,
        createdBy: adminUser.id,
        updatedBy: adminUser.id,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    ];

    stories.forEach(story => {
      this.stories.set(story.id, story);
    });

    // Create sample comments
    const sampleComments = [
      {
        id: randomUUID(),
        storyId: stories[0].id,
        userId: shantnu.id,
        commentText: "We should consider using @admin for the password hashing implementation. What do you think about bcrypt vs argon2?",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        storyId: stories[0].id,
        userId: adminUser.id,
        commentText: "@shantnu Good point! I think bcrypt should be sufficient for our use case. It's well-tested and Express has good support for it.",
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    ];

    sampleComments.forEach(comment => {
      this.comments.set(comment.id, comment);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "User",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getStory(id: string): Promise<StoryWithAssignee | undefined> {
    const story = this.stories.get(id);
    if (!story) return undefined;

    const assignee = story.assigneeId ? await this.getUser(story.assigneeId) : undefined;
    const createdByUser = await this.getUser(story.createdBy);
    const commentCount = Array.from(this.comments.values()).filter(c => c.storyId === id).length;

    return {
      ...story,
      assignee,
      createdByUser,
      commentCount,
    };
  }

  async getStoriesByStatus(status: string): Promise<StoryWithAssignee[]> {
    const stories = Array.from(this.stories.values()).filter(s => s.status === status);
    const result: StoryWithAssignee[] = [];

    for (const story of stories) {
      const assignee = story.assigneeId ? await this.getUser(story.assigneeId) : undefined;
      const createdByUser = await this.getUser(story.createdBy);
      const commentCount = Array.from(this.comments.values()).filter(c => c.storyId === story.id).length;

      result.push({
        ...story,
        assignee,
        createdByUser,
        commentCount,
      });
    }

    return result;
  }

  async getAllStories(): Promise<StoryWithAssignee[]> {
    const stories = Array.from(this.stories.values());
    const result: StoryWithAssignee[] = [];

    for (const story of stories) {
      const assignee = story.assigneeId ? await this.getUser(story.assigneeId) : undefined;
      const createdByUser = await this.getUser(story.createdBy);
      const commentCount = Array.from(this.comments.values()).filter(c => c.storyId === story.id).length;

      result.push({
        ...story,
        assignee,
        createdByUser,
        commentCount,
      });
    }

    return result;
  }

  async getStoriesByWorkspace(workspace: string): Promise<StoryWithAssignee[]> {
    const stories = Array.from(this.stories.values()).filter(s => s.workspace === workspace);
    const result: StoryWithAssignee[] = [];

    for (const story of stories) {
      const assignee = story.assigneeId ? await this.getUser(story.assigneeId) : undefined;
      const createdByUser = await this.getUser(story.createdBy);
      const commentCount = Array.from(this.comments.values()).filter(c => c.storyId === story.id).length;

      result.push({
        ...story,
        assignee,
        createdByUser,
        commentCount,
      });
    }

    return result;
  }

  async createStory(story: InsertStory): Promise<Story> {
    const id = randomUUID();

    // Generate next story number based on project
    const project = story.project || "T&D";
    const existingNumbers = Array.from(this.stories.values())
      .filter(s => s.project === project && s.storyNumber)
      .map(s => parseInt(s.storyNumber!.split('-')[1]))
      .filter(n => !isNaN(n));

    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1001;
    const storyNumber = `${project}-${nextNumber.toString().padStart(4, '0')}`;

    const newStory: Story = {
      ...story,
      id,
      storyNumber,
      description: story.description || null,
      pointer: story.pointer || 0,
      acceptanceCriteria: story.acceptanceCriteria || null,
      status: story.status || "To Do",
      priority: story.priority || "Medium",
      storyType: story.storyType || "Story",
      project: project,
      workspace: story.workspace || project, // Default workspace to project if not provided
      teamLead: story.teamLead || (project === "T&D" ? "Shantnu" : project === "ADMS" ? "Pranav" : null),
      epicLink: story.epicLink || null,
      activeSprint: story.activeSprint || "sprint-1",
      sprintId: story.sprintId || null,
      tags: story.tags || null,
      dueDate: story.dueDate || null,
      assigneeId: story.assigneeId || null,
      updatedBy: story.updatedBy || story.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.stories.set(id, newStory);
    return newStory;
  }

  async updateStory(id: string, updates: Partial<Story>): Promise<Story | undefined> {
    const story = this.stories.get(id);
    if (!story) return undefined;

    const updatedStory = { ...story, ...updates, updatedAt: new Date() };
    this.stories.set(id, updatedStory);
    return updatedStory;
  }

  async deleteStory(id: string): Promise<boolean> {
    return this.stories.delete(id);
  }

  async getCommentsByStoryId(storyId: string): Promise<CommentWithUser[]> {
    const comments = Array.from(this.comments.values()).filter(c => c.storyId === storyId);
    const result: CommentWithUser[] = [];

    for (const comment of comments) {
      const user = await this.getUser(comment.userId);
      if (user) {
        result.push({ ...comment, user });
      }
    }

    return result.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const newComment: Comment = {
      ...comment,
      id,
      createdAt: new Date(),
    };
    this.comments.set(id, newComment);
    return newComment;
  }

  async deleteComment(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }

  async getDashboardMetrics(): Promise<{
    totalStories: number;
    completed: number;
    totalPoints: number;
    teamMembers: number;
    storiesByStatus: Record<string, number>;
    storiesByPriority: Record<string, number>;
  }> {
    const stories = Array.from(this.stories.values());
    const users = Array.from(this.users.values());

    const storiesByStatus = stories.reduce((acc, story) => {
      acc[story.status] = (acc[story.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const storiesByPriority = stories.reduce((acc, story) => {
      acc[story.priority] = (acc[story.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalStories: stories.length,
      completed: storiesByStatus["Completed"] || 0,
      totalPoints: stories.reduce((sum, story) => sum + (story.pointer || 0), 0),
      teamMembers: users.length,
      storiesByStatus,
      storiesByPriority,
    };
  }
}

export const storage = new MemStorage();