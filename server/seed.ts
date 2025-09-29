import { db } from "./db";
import { users, stories, comments } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Check if users already exist
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  // Create sample users
  const adminUser = await db.insert(users).values({
    username: "admin",
    email: "admin@project.com",
    password: "$2b$10$vje0iEeqeBEfFpWOz21RLu4EMG9jQ28Bq7q/puUP18NqodIdlbRs2", // password: admin123
    name: "Admin User",
    role: "Admin",
  }).returning();

  const shantnu = await db.insert(users).values({
    username: "shantnu",
    email: "shantnu@project.com",
    password: "$2b$10$vje0iEeqeBEfFpWOz21RLu4EMG9jQ28Bq7q/puUP18NqodIdlbRs2", // password: admin123
    name: "Shantnu",
    role: "Team Lead",
  }).returning();

  const pranav = await db.insert(users).values({
    username: "pranav",
    email: "pranav@project.com",
    password: "$2b$10$vje0iEeqeBEfFpWOz21RLu4EMG9jQ28Bq7q/puUP18NqodIdlbRs2", // password: admin123
    name: "Pranav",
    role: "Team Lead",
  }).returning();

  const abhishek = await db.insert(users).values({
    username: "abhishek",
    email: "abhishek@project.com",
    password: "$2b$10$vje0iEeqeBEfFpWOz21RLu4EMG9jQ28Bq7q/puUP18NqodIdlbRs2", // password: admin123
    name: "Abhishek",
    role: "User",
  }).returning();

  const tanay = await db.insert(users).values({
    username: "tanay",
    email: "tanay@project.com",
    password: "$2b$10$vje0iEeqeBEfFpWOz21RLu4EMG9jQ28Bq7q/puUP18NqodIdlbRs2", // password: admin123
    name: "Tanay",
    role: "User",
  }).returning();

  console.log("Created users:", [adminUser[0], shantnu[0], pranav[0], abhishek[0], tanay[0]]);

  // Create sample stories
  const sampleStories = [
    {
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
      activeSprint: "sprint-1",
      sprintId: "sprint-1",
      tags: ["auth", "security"],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      assigneeId: adminUser[0].id,
      createdBy: adminUser[0].id,
      updatedBy: adminUser[0].id,
    },
    {
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
      activeSprint: "sprint-1",
      sprintId: "sprint-1",
      tags: ["database", "schema"],
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      assigneeId: tanay[0].id,
      createdBy: shantnu[0].id,
      updatedBy: shantnu[0].id,
    },
    {
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
      activeSprint: "sprint-1",
      sprintId: "sprint-1",
      tags: ["frontend", "kanban"],
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      assigneeId: shantnu[0].id,
      createdBy: pranav[0].id,
      updatedBy: pranav[0].id,
    },
    {
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
      activeSprint: "sprint-1",
      sprintId: "sprint-1",
      tags: ["frontend", "dashboard"],
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      assigneeId: pranav[0].id,
      createdBy: adminUser[0].id,
      updatedBy: adminUser[0].id,
    },
    {
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
      activeSprint: "sprint-1",
      sprintId: "sprint-1",
      tags: ["setup", "initial"],
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      assigneeId: adminUser[0].id,
      createdBy: adminUser[0].id,
      updatedBy: adminUser[0].id,
    },
  ];

  const insertedStories = await db.insert(stories).values(sampleStories).returning();
  console.log("Created stories:", insertedStories);

  // Create sample comments
  const sampleComments = [
    {
      storyId: insertedStories[0].id,
      userId: shantnu[0].id,
      commentText: "We should consider using @admin for the password hashing implementation. What do you think about bcrypt vs argon2?",
    },
    {
      storyId: insertedStories[0].id,
      userId: adminUser[0].id,
      commentText: "@shantnu Good point! I think bcrypt should be sufficient for our use case. It's well-tested and Express has good support for it.",
    },
  ];

  const insertedComments = await db.insert(comments).values(sampleComments).returning();
  console.log("Created comments:", insertedComments);

  console.log("Database seeded successfully!");
}

seed().catch(console.error);