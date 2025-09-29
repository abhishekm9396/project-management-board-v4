from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class SprintStatus(str, enum.Enum):
    PLANNING = "Planning"
    ACTIVE = "Active"
    COMPLETED = "Completed"


class Sprint(Base):
    __tablename__ = "sprints"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    goal = Column(Text)
    status = Column(Enum(SprintStatus), default=SprintStatus.PLANNING)
    
    # Foreign Keys
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="sprints")
    created_by_user = relationship("User", back_populates="created_sprints")
    stories = relationship("Story", back_populates="sprint")