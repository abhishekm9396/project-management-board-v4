import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("User"), // Admin, Team Lead, User
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyNumber: text("story_number").unique(), // PREFIX-#### format (e.g., T&D-1002)
  title: text("title").notNull(),
  description: text("description"),
  pointer: integer("pointer").default(1), // Story points (1-5)
  acceptanceCriteria: text("acceptance_criteria"),
  status: text("status").notNull().default("To Do"), // To Do, In Progress, Blocked, Validation, Completed
  priority: text("priority").notNull().default("Medium"), // Low, Medium, High
  storyType: text("story_type").notNull().default("Story"), // Story, Bug, Epic
  project: text("project").notNull().default("T&D"), // Project name (T&D, ADMS, etc.)
  teamLead: text("team_lead"), // Team lead name for this story
  workspace: text("workspace").notNull().default("T&D"), // Workspace/Team Lead workspace
  epicLink: text("epic_link"),
  activeSprint: text("active_sprint").default("sprint-1"),
  sprintId: text("sprint_id"),
  tags: text("tags").array(),
  dueDate: timestamp("due_date"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sprints = pgTable("sprints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  workspace: text("workspace").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("planning"), // planning, active, completed
  goal: text("goal"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  commentText: text("comment_text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tableName: text("table_name").notNull(),
  recordId: varchar("record_id").notNull(),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE
  performedBy: varchar("performed_by").notNull().references(() => users.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.coerce.date().optional().refine((date) => {
    if (!date) return true; // Optional field
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date >= today;
  }, "Due date cannot be in the past"),
});

export const insertSprintSchema = createInsertSchema(sprints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
export type InsertSprint = z.infer<typeof insertSprintSchema>;
export type Sprint = typeof sprints.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Extended types for API responses
export type StoryWithAssignee = Story & {
  assignee?: User;
  createdByUser?: User;
  commentCount?: number;
};

export type CommentWithUser = Comment & {
  user: User;
};
