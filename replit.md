# Project Management Web Application

## Overview

This is a modern project management web application built with React (Vite) frontend and Express.js backend, designed to provide a complete project management solution with Kanban boards, story management, and dashboard analytics. The application features a clean, modern UI built with shadcn/ui components and supports role-based access control for different user types (Admin, Team Lead, User).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with Vite build system for fast development and optimized production builds
- **UI Components**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Drag & Drop**: react-beautiful-dnd for Kanban board interactions
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Styling**: Tailwind CSS with CSS variables for theming support (light/dark mode)

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Authentication**: Passport.js with local strategy using session-based authentication
- **Password Security**: Built-in crypto module with scrypt for secure password hashing
- **Session Management**: Express sessions with configurable storage backend
- **API Design**: RESTful API with role-based authorization middleware
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas shared between frontend and backend for consistent validation

### Data Storage Architecture
- **Database**: PostgreSQL configured through Drizzle with connection pooling via Neon serverless driver
- **Schema Design**: Normalized relational schema with tables for users, stories, comments, and audit logs
- **Migrations**: Drizzle Kit for database schema migrations and version control
- **Data Access**: Repository pattern with in-memory fallback storage for development

### Authentication & Authorization
- **Session-Based Auth**: Express sessions with secure cookie configuration
- **Role-Based Access Control**: Three-tier permission system (Admin, Team Lead, User)
- **Password Security**: Salted password hashing using Node.js crypto scrypt function
- **Protected Routes**: Frontend route protection with authentication state management

### Project Management Features
- **Kanban Board**: Five-column workflow (To Do, In Progress, Blocked, Validation, Completed)
- **Story Management**: Comprehensive story tracking with points, priorities, assignments, and due dates
- **Comments System**: Flat comment structure with user mentions and real-time updates
- **Dashboard Analytics**: Project metrics visualization with completion tracking and team insights
- **AI Integration**: Placeholder API endpoints for future AI-powered effort estimation

## External Dependencies

### Core Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI component primitives for accessibility
- **react-beautiful-dnd**: Drag and drop functionality for Kanban boards
- **react-hook-form**: Form state management and validation
- **@hookform/resolvers**: Integration between React Hook Form and Zod validation
- **wouter**: Lightweight routing library
- **date-fns**: Date manipulation and formatting utilities

### Backend Infrastructure
- **express**: Web application framework
- **passport**: Authentication middleware with local strategy
- **express-session**: Session management middleware
- **bcryptjs**: Password hashing (backup option)
- **connect-pg-simple**: PostgreSQL session store

### Database & ORM
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **drizzle-kit**: Database migration and introspection tools
- **@neondatabase/serverless**: Serverless PostgreSQL connection driver

### Development & Build Tools
- **vite**: Fast build tool and development server
- **@vitejs/plugin-react**: React integration for Vite
- **typescript**: Type safety and enhanced developer experience
- **tailwindcss**: Utility-first CSS framework
- **zod**: Runtime type validation and schema definition

### UI & Styling
- **tailwindcss**: Utility-first CSS framework with design system
- **class-variance-authority**: Type-safe variant API for component styling
- **clsx**: Conditional CSS class name utility
- **lucide-react**: Icon library with React components