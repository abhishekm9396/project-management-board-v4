from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.sprint import SprintStatus


class SprintBase(BaseModel):
    name: str
    goal: Optional[str] = None
    status: SprintStatus = SprintStatus.PLANNING
    start_date: datetime
    end_date: datetime


class SprintCreate(SprintBase):
    project_id: int


class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    status: Optional[SprintStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SprintResponse(SprintBase):
    id: int
    project_id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True