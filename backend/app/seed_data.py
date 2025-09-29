from sqlalchemy.orm import Session
from .core.database import SessionLocal, engine
from .core.security import get_password_hash
from .models.user import User, UserRole
from .models.project import Project
from .models.story import Story, StoryStatus, StoryPriority, StoryType
from .models.sprint import Sprint, SprintStatus
from datetime import datetime, timedelta


def create_sample_data():
    # Create all tables
    from .models import user, project, story, sprint
    user.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(User).first():
            print("Sample data already exists, skipping...")
            return
        
        # Create sample users
        admin_user = User(
            username="admin",
            email="admin@projectmanagement.com",
            full_name="Admin User",
            role=UserRole.ADMIN,
            hashed_password=get_password_hash("admin123")
        )
        
        team_lead_1 = User(
            username="shantnu",
            email="shantnu@projectmanagement.com", 
            full_name="Shantnu Sharma",
            role=UserRole.TEAM_LEAD,
            hashed_password=get_password_hash("password123")
        )
        
        team_lead_2 = User(
            username="pranav",
            email="pranav@projectmanagement.com",
            full_name="Pranav Kumar", 
            role=UserRole.TEAM_LEAD,
            hashed_password=get_password_hash("password123")
        )
        
        user1 = User(
            username="abhishek",
            email="abhishek@projectmanagement.com",
            full_name="Abhishek Singh",
            role=UserRole.USER,
            hashed_password=get_password_hash("password123")
        )
        
        user2 = User(
            username="tanay",
            email="tanay@projectmanagement.com",
            full_name="Tanay Patel",
            role=UserRole.USER,
            hashed_password=get_password_hash("password123")
        )
        
        # Add users to database
        users = [admin_user, team_lead_1, team_lead_2, user1, user2]
        db.add_all(users)
        db.commit()
        
        # Refresh to get IDs
        for user in users:
            db.refresh(user)
        
        # Create sample projects
        project1 = Project(
            name="Training & Development",
            prefix="T&D", 
            description="Training and development management system",
            created_by=admin_user.id,
            team_lead_id=team_lead_1.id
        )
        
        project2 = Project(
            name="Asset Management System",
            prefix="ADMS",
            description="Asset and document management system", 
            created_by=admin_user.id,
            team_lead_id=team_lead_2.id
        )
        
        projects = [project1, project2]
        db.add_all(projects)
        db.commit()
        
        # Refresh to get IDs
        for project in projects:
            db.refresh(project)
        
        # Create sample sprints
        sprint1 = Sprint(
            name="Sprint 1 - Q4 2024",
            goal="Complete user authentication and basic CRUD operations",
            status=SprintStatus.ACTIVE,
            project_id=project1.id,
            start_date=datetime.now() - timedelta(days=7),
            end_date=datetime.now() + timedelta(days=7),
            created_by=team_lead_1.id
        )
        
        sprint2 = Sprint(
            name="Sprint 1 - Asset Module",
            goal="Implement asset tracking and management features",
            status=SprintStatus.PLANNING,
            project_id=project2.id,
            start_date=datetime.now() + timedelta(days=1),
            end_date=datetime.now() + timedelta(days=14),
            created_by=team_lead_2.id
        )
        
        sprints = [sprint1, sprint2]
        db.add_all(sprints)
        db.commit()
        
        # Refresh to get IDs
        for sprint in sprints:
            db.refresh(sprint)
        
        # Create sample stories
        stories_data = [
            {
                "story_number": "T&D-1001",
                "title": "User Authentication System",
                "description": "Implement secure user login and registration with JWT tokens",
                "acceptance_criteria": "- Users can register with email and password\n- Users can login securely\n- JWT tokens are generated and validated",
                "story_points": 8,
                "status": StoryStatus.COMPLETED,
                "priority": StoryPriority.HIGH,
                "story_type": StoryType.STORY,
                "project_id": project1.id,
                "assignee_id": user1.id,
                "created_by": team_lead_1.id,
                "sprint_id": sprint1.id
            },
            {
                "story_number": "T&D-1002",
                "title": "Project Management Dashboard",
                "description": "Create a dashboard to view project metrics and KPIs",
                "acceptance_criteria": "- Display project progress\n- Show team performance metrics\n- Interactive charts and graphs",
                "story_points": 13,
                "status": StoryStatus.IN_PROGRESS,
                "priority": StoryPriority.HIGH,
                "story_type": StoryType.STORY,
                "project_id": project1.id,
                "assignee_id": user2.id,
                "created_by": team_lead_1.id,
                "sprint_id": sprint1.id
            },
            {
                "story_number": "T&D-1003",
                "title": "Kanban Board Implementation",
                "description": "Develop drag-and-drop Kanban board for story management",
                "acceptance_criteria": "- Stories can be dragged between columns\n- Real-time updates\n- Status changes automatically",
                "story_points": 21,
                "status": StoryStatus.TO_DO,
                "priority": StoryPriority.MEDIUM,
                "story_type": StoryType.STORY,
                "project_id": project1.id,
                "assignee_id": user1.id,
                "created_by": team_lead_1.id,
                "sprint_id": sprint1.id,
                "due_date": datetime.now() + timedelta(days=10)
            },
            {
                "story_number": "ADMS-1001",
                "title": "Asset Registration Module",
                "description": "Allow users to register and track physical assets",
                "acceptance_criteria": "- Asset details form\n- Asset categorization\n- Barcode generation",
                "story_points": 8,
                "status": StoryStatus.BACKLOG,
                "priority": StoryPriority.HIGH,
                "story_type": StoryType.STORY,
                "project_id": project2.id,
                "created_by": team_lead_2.id,
                "sprint_id": sprint2.id
            },
            {
                "story_number": "ADMS-1002",
                "title": "Asset Search and Filter",
                "description": "Implement search functionality for assets with advanced filters",
                "acceptance_criteria": "- Text-based search\n- Filter by category, status, location\n- Export search results",
                "story_points": 5,
                "status": StoryStatus.BACKLOG,
                "priority": StoryPriority.MEDIUM,
                "story_type": StoryType.STORY,
                "project_id": project2.id,
                "created_by": team_lead_2.id,
                "sprint_id": sprint2.id
            },
            {
                "story_number": "T&D-1004",
                "title": "Bug: Login page crashes on mobile",
                "description": "Login page becomes unresponsive on mobile devices",
                "acceptance_criteria": "- Login works on all mobile devices\n- Responsive design implemented\n- No JavaScript errors",
                "story_points": 3,
                "status": StoryStatus.BLOCKED,
                "priority": StoryPriority.HIGH,
                "story_type": StoryType.BUG,
                "project_id": project1.id,
                "assignee_id": user2.id,
                "created_by": user1.id
            }
        ]
        
        stories = [Story(**story_data) for story_data in stories_data]
        db.add_all(stories)
        db.commit()
        
        print("✅ Sample data created successfully!")
        print("\nSample Users:")
        print("- Admin: admin / admin123")
        print("- Team Lead: shantnu / password123")
        print("- Team Lead: pranav / password123")
        print("- User: abhishek / password123")
        print("- User: tanay / password123")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_sample_data()