from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class StoryStatus(str, enum.Enum):
    BACKLOG = "Backlog"
    TO_DO = "To Do"
    IN_PROGRESS = "In Progress"
    BLOCKED = "Blocked"
    VALIDATION = "Validation"
    COMPLETED = "Completed"


class StoryPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class StoryType(str, enum.Enum):
    STORY = "Story"
    BUG = "Bug"
    EPIC = "Epic"


class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    story_number = Column(String, unique=True, nullable=False)  # e.g., "T&D-1001"
    title = Column(String, nullable=False)
    description = Column(Text)
    acceptance_criteria = Column(Text)
    story_points = Column(Integer, default=1)
    status = Column(Enum(StoryStatus), default=StoryStatus.BACKLOG)
    priority = Column(Enum(StoryPriority), default=StoryPriority.MEDIUM)
    story_type = Column(Enum(StoryType), default=StoryType.STORY)
    
    # Foreign Keys
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("users.id"))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    sprint_id = Column(Integer, ForeignKey("sprints.id"))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    due_date = Column(DateTime(timezone=True))

    # Relationships
    project = relationship("Project", back_populates="stories")
    assignee_user = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_stories")
    created_by_user = relationship("User", foreign_keys=[created_by], back_populates="created_stories")
    sprint = relationship("Sprint", back_populates="stories")