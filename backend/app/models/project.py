from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    prefix = Column(String, unique=True, nullable=False)  # e.g., "T&D", "ADMS"
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_lead_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    created_by_user = relationship("User", foreign_keys=[created_by], back_populates="created_projects")
    team_lead = relationship("User", foreign_keys=[team_lead_id])
    stories = relationship("Story", back_populates="project")
    sprints = relationship("Sprint", back_populates="project")