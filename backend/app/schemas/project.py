from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectBase(BaseModel):
    name: str
    prefix: str
    description: Optional[str] = None
    team_lead_id: Optional[int] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    prefix: Optional[str] = None
    description: Optional[str] = None
    team_lead_id: Optional[int] = None


class ProjectResponse(ProjectBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True