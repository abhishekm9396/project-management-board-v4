# Development Guide

## 🔧 VS Code Specific Setup

### Quick Start for VS Code

1. **Open in VS Code**:
   ```bash
   code .
   ```

2. **Install Recommended Extensions**:
   - VS Code will prompt to install recommended extensions
   - Click "Install All" when prompted
   - Essential extensions: Prettier, Tailwind CSS, Thunder Client, TypeScript

3. **Run Development Server**:
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "Tasks: Run Task" and select "Start Dev Server"
   - Or use the terminal: `npm run dev`

4. **Debug Configuration**:
   - Press `F5` to start debugging
   - Choose "Launch Development Server" from the dropdown
   - Set breakpoints directly in VS Code

### VS Code Features Configured

#### Tasks (Ctrl+Shift+P → "Tasks: Run Task")
- **Start Dev Server**: Launches the development environment
- **Build Production**: Creates optimized production build
- **Type Check**: Runs TypeScript compilation check
- **Database Push**: Syncs database schema
- **Clean Install**: Fresh dependency installation

#### Debugging (F5)
- **Launch Development Server**: Full stack debugging
- **Debug Backend Only**: Server-side debugging with detailed logs
- **Run Database Migration**: Execute schema changes

#### Code Intelligence
- Auto-import for TypeScript modules
- Tailwind CSS IntelliSense with custom class detection
- Path autocompletion
- TypeScript error highlighting

## 🏗️ Architecture Deep Dive

### Frontend Architecture

#### Component Structure
```
client/src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui primitive components
│   ├── kanban-board.tsx # Main Kanban interface
│   ├── dashboard.tsx    # Analytics dashboard
│   └── sidebar.tsx      # Navigation sidebar
├── pages/               # Route components
│   ├── auth-page.tsx    # Login/register
│   └── home-page.tsx    # Main application
├── hooks/               # Custom React hooks
│   ├── use-auth.tsx     # Authentication state
│   └── use-toast.ts     # Toast notifications
└── lib/                 # Utilities and configuration
    ├── queryClient.ts   # TanStack Query setup
    └── utils.ts         # Helper functions
```

#### State Management Philosophy
- **Server State**: TanStack Query for caching and synchronization
- **UI State**: React useState for local component state
- **Global State**: Context API for authentication and themes
- **Form State**: React Hook Form for form management

#### Data Flow
1. **Component** requests data via useQuery hook
2. **TanStack Query** checks cache, makes API request if needed
3. **API Client** handles authentication and error management
4. **Backend** processes request with authentication/authorization
5. **Database** returns data through Drizzle ORM
6. **Component** receives typed data and updates UI

### Backend Architecture

#### Express.js Structure
```
server/
├── index.ts             # Application entry point
├── routes.ts            # API endpoint definitions
├── auth.ts              # Authentication middleware
├── storage.ts           # Database abstraction layer
├── vite.ts              # Development server setup
└── db.ts                # Database connection
```

#### Middleware Stack
1. **Session Management**: Express sessions with PostgreSQL store
2. **Authentication**: Passport.js local strategy
3. **Authorization**: Role-based access control
4. **Validation**: Zod schema validation
5. **Error Handling**: Centralized error responses
6. **Logging**: Request/response logging

#### Database Design Principles
- **Type Safety**: Drizzle ORM with TypeScript schemas
- **Relationships**: Proper foreign key constraints
- **Audit Trail**: Created/updated timestamps
- **Performance**: Indexed queries and connection pooling

## 🔐 Security Considerations

### Authentication Flow
1. **Login**: Username/password verification with bcrypt
2. **Session**: Secure session creation with PostgreSQL storage
3. **Authorization**: Role-based middleware on protected routes
4. **CSRF**: Session-based CSRF protection
5. **Password Security**: bcrypt with 10 salt rounds

### Role-Based Access Control (RBAC)
```typescript
// Example role checking
function requireRole(roles: string[]) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}
```

### Security Best Practices Implemented
- ✅ Password hashing with bcrypt
- ✅ Session-based authentication
- ✅ Role-based authorization
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ XSS protection (React escaping)
- ✅ Secure session configuration

## 🗄️ Database Schema Details

### Core Tables

#### Users Table
```sql
users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'User',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

#### Stories Table
```sql
stories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  story_number TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  pointer INTEGER DEFAULT 1,
  acceptance_criteria TEXT,
  status TEXT DEFAULT 'To Do',
  priority TEXT DEFAULT 'Medium',
  story_type TEXT DEFAULT 'Story',
  project TEXT DEFAULT 'T&D',
  team_lead TEXT,
  workspace TEXT DEFAULT 'T&D',
  assignee_id VARCHAR REFERENCES users(id),
  created_by VARCHAR REFERENCES users(id),
  updated_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Relationships
- **Stories → Users**: Many-to-one (assignee, creator)
- **Comments → Stories**: Many-to-one
- **Comments → Users**: Many-to-one (author)
- **Audit Logs → Users**: Many-to-one (performer)

## 🧪 Testing Strategies

### Manual Testing Checklist

#### Authentication Testing
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Register new user
- [ ] Logout functionality
- [ ] Session persistence across browser refresh
- [ ] Role-based feature visibility

#### Story Management Testing
- [ ] Create new story
- [ ] Edit story details
- [ ] Drag and drop between columns
- [ ] Delete story (role permissions)
- [ ] Assign users to stories
- [ ] Add comments to stories

#### UI/UX Testing
- [ ] Responsive design on different screen sizes
- [ ] Dark/light mode switching
- [ ] Keyboard navigation
- [ ] Loading states
- [ ] Error messages
- [ ] Toast notifications

### API Testing with Thunder Client

Import these requests into Thunder Client:

```json
{
  "name": "Project Management API",
  "requests": [
    {
      "name": "Login",
      "method": "POST",
      "url": "{{baseUrl}}/api/login",
      "body": {
        "username": "admin",
        "password": "admin123"
      }
    },
    {
      "name": "Get Stories",
      "method": "GET",
      "url": "{{baseUrl}}/api/stories"
    },
    {
      "name": "Create Story",
      "method": "POST",
      "url": "{{baseUrl}}/api/stories",
      "body": {
        "title": "Test Story",
        "description": "Test description",
        "priority": "Medium",
        "storyType": "Story",
        "pointer": 5
      }
    }
  ],
  "environments": [
    {
      "name": "Development",
      "variables": {
        "baseUrl": "http://localhost:5000"
      }
    }
  ]
}
```

## 🚀 Performance Optimization

### Frontend Optimizations
- **Code Splitting**: Lazy loading for routes and heavy components
- **Bundle Analysis**: Monitor bundle size with build tools
- **Image Optimization**: WebP format and lazy loading
- **Caching**: TanStack Query aggressive caching strategy

### Backend Optimizations
- **Database Indexing**: Proper indexes on frequently queried columns
- **Connection Pooling**: Efficient database connection management
- **Response Compression**: Gzip compression for API responses
- **Query Optimization**: N+1 query prevention with joins

### Database Performance
```sql
-- Recommended indexes
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_assignee ON stories(assignee_id);
CREATE INDEX idx_stories_project ON stories(project);
CREATE INDEX idx_comments_story ON comments(story_id);
```

## 🛠️ Development Workflow

### Git Workflow
```bash
# Feature development
git checkout -b feature/story-management
git add .
git commit -m "feat: add story drag and drop functionality"
git push origin feature/story-management

# Create pull request
# Merge after review
```

### Code Quality Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Commit Messages**: Conventional commits format

### Environment Management
```bash
# Development
NODE_ENV=development npm run dev

# Production build
NODE_ENV=production npm run build

# Database operations
npm run db:push              # Sync schema
npm run db:push --force      # Force sync (use carefully)
```

## 🐛 Common Issues & Solutions

### Database Connection Issues
```bash
# Check PostgreSQL service
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Reset connection
npm run db:push --force
```

### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npx tsc --build --clean
npm run check
```

### Port Conflicts
```bash
# Find process using port
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>
```

### Session Storage Issues
```sql
-- Check session table
SELECT * FROM session LIMIT 5;

-- Clear sessions
DELETE FROM session WHERE expire < NOW();
```

## 📊 Monitoring & Debugging

### Application Logs
```typescript
// Server logs
console.log(`[${new Date().toISOString()}] ${message}`);

// Database query logs
// Enable in development by setting DEBUG=drizzle:*
```

### Browser DevTools
- **Network Tab**: Monitor API requests and responses
- **Console**: Check for JavaScript errors
- **Application Tab**: Inspect local storage and sessions
- **Performance Tab**: Analyze rendering performance

### Database Monitoring
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Real-time updates with WebSockets
- [ ] File attachments for stories
- [ ] Advanced search and filtering
- [ ] Sprint planning tools
- [ ] Time tracking
- [ ] Reporting and analytics
- [ ] Mobile app development

### Technical Improvements
- [ ] End-to-end testing with Playwright
- [ ] Unit testing with Jest and React Testing Library
- [ ] CI/CD pipeline setup
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] Monitoring with Prometheus/Grafana

---

This development guide provides comprehensive information for setting up and working with the project management application in VS Code. Follow the setup instructions and refer to this guide for troubleshooting and best practices.