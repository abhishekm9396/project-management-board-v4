from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    TEAM_LEAD = "Team Lead"
    USER = "User"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    created_projects = relationship("Project", back_populates="created_by_user")
    assigned_stories = relationship("Story", back_populates="assignee_user")
    created_stories = relationship("Story", foreign_keys="Story.created_by", back_populates="created_by_user")
    created_sprints = relationship("Sprint", back_populates="created_by_user")