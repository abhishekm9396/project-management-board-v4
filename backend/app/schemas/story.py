from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.story import StoryStatus, StoryPriority, StoryType


class StoryBase(BaseModel):
    title: str
    description: Optional[str] = None
    acceptance_criteria: Optional[str] = None
    story_points: int = 1
    status: StoryStatus = StoryStatus.BACKLOG
    priority: StoryPriority = StoryPriority.MEDIUM
    story_type: StoryType = StoryType.STORY
    assignee_id: Optional[int] = None
    sprint_id: Optional[int] = None
    due_date: Optional[datetime] = None


class StoryCreate(StoryBase):
    project_id: int


class StoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    acceptance_criteria: Optional[str] = None
    story_points: Optional[int] = None
    status: Optional[StoryStatus] = None
    priority: Optional[StoryPriority] = None
    story_type: Optional[StoryType] = None
    assignee_id: Optional[int] = None
    sprint_id: Optional[int] = None
    due_date: Optional[datetime] = None


class StoryResponse(StoryBase):
    id: int
    story_number: str
    project_id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True