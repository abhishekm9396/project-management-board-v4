# Project Management Web Application

A modern, full-stack project management application built with React, Express.js, and PostgreSQL. Features Kanban boards, story management, role-based access control, and team collaboration tools.

## 🚀 Features

### Core Functionality
- **Kanban Board**: Drag-and-drop interface with customizable columns (Backlog, To Do, In Progress, Blocked, Validation, Completed)
- **Agile Story Board**: Sprint-based story management with timeline views
- **Dashboard Analytics**: Up-to-date metrics, progress tracking, and team insights
- **Story Management**: Create, edit, and track stories with points, priorities, and assignments
- **Comment System**: Team collaboration with threaded discussions
- **Role-Based Access Control**: Three-tier permissions (Admin, Team Lead, User)

### Advanced Features
- **AI-Powered Estimation**: Basic story point estimation based on content analysis
- **WIP Limits**: Kanban workflow optimization with work-in-progress limits
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Automatic theme switching with user preferences

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Drag & Drop**: react-beautiful-dnd for Kanban interactions

### Backend (Express.js)
- **Runtime**: Node.js with Express.js framework
- **Authentication**: Passport.js with local strategy using session-based auth
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations
- **Session Storage**: PostgreSQL session store with connect-pg-simple
- **Password Security**: bcrypt for secure password hashing
- **API Design**: RESTful endpoints with role-based authorization

### Database Schema
- **Users**: Authentication and role management
- **Stories**: Project items with status, priority, and assignments
- **Comments**: Team collaboration and communication
- **Sessions**: Secure session storage in PostgreSQL

## 📋 Prerequisites

### Required Software
- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **PostgreSQL**: Version 12 or higher (Required)
- **VS Code**: Latest version (recommended)

### VS Code Extensions (Recommended)
- **ES7+ React/Redux/React-Native snippets**
- **TypeScript Importer**
- **Tailwind CSS IntelliSense**
- **Auto Rename Tag**
- **Thunder Client** (for API testing)
- **PostgreSQL** (database management)

## 🛠️ Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd project-management-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:

```env
# Database Configuration (Required)
DATABASE_URL=postgresql://username:password@localhost:5432/project_management
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=project_management

# Session Configuration (Required)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Application Configuration
NODE_ENV=development
PORT=5000
```

**Important**: The `SESSION_SECRET` is required for secure session management. Use a strong, random string.

### 4. Database Setup (Required)

#### PostgreSQL Installation

1. **Install PostgreSQL**:
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - **macOS**: Use Homebrew: `brew install postgresql`
   - **Linux**: Use package manager: `sudo apt-get install postgresql`

2. **Create Database**:
   ```bash
   # Start PostgreSQL service
   # Windows: Start from Services
   # macOS: brew services start postgresql
   # Linux: sudo systemctl start postgresql

   # Create database
   createdb project_management

   # Or using psql
   psql -U postgres
   CREATE DATABASE project_management;
   \\q
   ```

3. **Run Database Migrations**:
   ```bash
   npm run db:push
   ```

4. **Create Session Table**:
   ```sql
   -- Connect to your database and run this SQL
   psql -d project_management -c "
   CREATE TABLE session (
     sid varchar NOT NULL COLLATE \"default\",
     sess json NOT NULL,
     expire timestamp(6) NOT NULL
   )
   WITH (OIDS=FALSE);
   ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
   CREATE INDEX IDX_session_expire ON session(expire);
   "
   ```

### 5. Create Initial User

Since there's no automatic seeding, you'll need to register the first user through the application:

1. Start the development server: `npm run dev`
2. Open http://localhost:5000
3. Click "Register" tab and create your first user
4. **Promote to Admin** (required for full access):
   ```sql
   -- Connect to database and promote first user to Admin
   psql -d project_management -c "
   UPDATE users SET role = 'Admin' WHERE username = 'your_username';
   "
   ```

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:5000**

### 7. VS Code Setup

The repository includes pre-configured VS Code settings in `.vscode/`:

- **Launch Configuration**: Debug the application with F5
- **Tasks**: Run common commands with Ctrl+Shift+P
- **Settings**: Optimized for TypeScript and Tailwind CSS
- **Extensions**: Recommended extensions for best experience

## 🔧 Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run check` - Type checking without building
- `npm run db:push` - Push database schema changes

### Production
- `npm run build` - Build for production
- `npm run start` - Start production server

### Database
- `npm run db:push` - Sync database schema with migrations
- `npm run db:push --force` - Force sync schema (use carefully)

## 📊 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Story Management
- `GET /api/stories` - Get all stories
- `GET /api/stories/:id` - Get specific story
- `GET /api/stories/status/:status` - Get stories by status
- `POST /api/stories` - Create new story
- `PATCH /api/stories/:id` - Update story
- `DELETE /api/stories/:id` - Delete story (Admin/Team Lead only)

### Comments
- `GET /api/stories/:storyId/comments` - Get story comments
- `POST /api/stories/:storyId/comments` - Add comment
- `DELETE /api/comments/:id` - Delete comment

### User Management
- `GET /api/users` - Get all users (Admin only)

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics

### AI Features
- `POST /api/stories/ai-estimate` - Get basic story point estimation

## 🎯 User Roles & Permissions

### Admin
- Full access to all features
- User management capabilities
- Can delete stories and comments
- Access to all projects and teams

### Team Lead
- Manage stories within their projects
- Create and modify sprints
- Assign team members to stories
- Delete stories they created
- View team analytics

### User
- View and update assigned stories
- Add comments and collaborate
- Update story status through Kanban
- View project dashboards

## 🔐 Authentication & Security

### Session-Based Authentication
- Secure session management with PostgreSQL storage
- Password hashing using bcrypt with salt rounds
- Automatic session cleanup

### Role-Based Authorization
- Middleware-based permission checking
- Route-level access control
- Feature-level UI restrictions

## 🧪 Testing the Application

### Manual Testing Flow

1. **Registration/Login**:
   - Register a new user account
   - Test login with valid/invalid credentials
   - Verify role-based feature access

2. **Story Management**:
   - Create new stories with different priorities
   - Test drag-and-drop between columns
   - Verify assignee functionality
   - Test AI estimation feature

3. **Collaboration Features**:
   - Add comments to stories
   - Test role-based permissions
   - Verify data updates on page refresh

4. **Dashboard Analytics**:
   - Check metric calculations
   - Verify chart data accuracy
   - Test filtering options

### API Testing with Thunder Client

Create requests in VS Code using Thunder Client extension:

```http
### Login
POST http://localhost:5000/api/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}

### Get Stories
GET http://localhost:5000/api/stories

### Create Story
POST http://localhost:5000/api/stories
Content-Type: application/json

{
  "title": "New Feature Implementation",
  "description": "Implement user dashboard improvements",
  "priority": "High",
  "storyType": "Story",
  "pointer": 8,
  "project": "T&D"
}

### AI Estimation
POST http://localhost:5000/api/stories/ai-estimate
Content-Type: application/json

{
  "title": "Complex feature with many requirements",
  "description": "This is a detailed description of a complex feature that requires significant development effort including database changes, API modifications, and extensive frontend work."
}
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL status
# Windows: Check Services
# macOS: brew services list | grep postgresql
# Linux: sudo systemctl status postgresql

# Verify connection
psql -h localhost -p 5432 -U your_username -d project_management
```

#### Session Secret Error
If you see "SESSION_SECRET must be set":
1. Ensure your `.env` file exists
2. Verify `SESSION_SECRET` is set in `.env`
3. Restart the development server

#### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### Database Schema Issues
```bash
# Reset database schema
npm run db:push --force

# Check current schema
psql -d project_management -c "\\dt"
```

### Development Tips

#### Environment Variables Not Loading
The application uses tsx which automatically loads `.env` files. If environment variables aren't loading:
1. Verify `.env` file exists in root directory
2. Check variable naming (must be exactly as shown in `.env.example`)
3. Restart the development server

#### TypeScript Errors
```bash
# Type checking
npm run check

# Clear TypeScript cache
rm -rf node_modules/.cache
npm install
```

## 🚀 Deployment

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Variables (Production)
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:password@prod-host:5432/project_management
SESSION_SECRET=your-strong-production-secret-key
PORT=5000
```

### Security Considerations
- Use strong session secrets in production
- Enable HTTPS for all communications
- Configure database connection pooling
- Set up proper backup strategies
- Implement rate limiting for API endpoints

## 🤝 Contributing

### Development Workflow
1. Create feature branch from main
2. Follow existing code patterns and conventions
3. Write comprehensive commit messages
4. Test all functionality before submitting
5. Update documentation for new features

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for complex functions
- Use meaningful variable and function names

## 📄 License

This project is licensed under the MIT License.

---

**Happy coding! 🎉**