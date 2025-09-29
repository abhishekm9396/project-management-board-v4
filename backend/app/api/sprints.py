from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.auth import get_current_user, get_admin_or_team_lead_user
from ..models.user import User, UserRole
from ..models.sprint import Sprint
from ..models.project import Project
from ..schemas.sprint import SprintResponse, SprintCreate, SprintUpdate

router = APIRouter()


@router.get("/sprints", response_model=List[SprintResponse])
def get_sprints(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Sprint)
    
    if project_id:
        query = query.filter(Sprint.project_id == project_id)
    
    sprints = query.all()
    return sprints


@router.get("/sprints/{sprint_id}", response_model=SprintResponse)
def get_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found"
        )
    return sprint


@router.post("/sprints", response_model=SprintResponse)
def create_sprint(
    sprint_data: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_team_lead_user)  # Only Team Leads and Admins can create sprints
):
    # Verify project exists
    project = db.query(Project).filter(Project.id == sprint_data.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Validate date range
    if sprint_data.start_date >= sprint_data.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    db_sprint = Sprint(
        name=sprint_data.name,
        goal=sprint_data.goal,
        status=sprint_data.status,
        project_id=sprint_data.project_id,
        start_date=sprint_data.start_date,
        end_date=sprint_data.end_date,
        created_by=current_user.id
    )
    
    db.add(db_sprint)
    db.commit()
    db.refresh(db_sprint)
    
    return db_sprint


@router.put("/sprints/{sprint_id}", response_model=SprintResponse)
def update_sprint(
    sprint_id: int,
    sprint_data: SprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_team_lead_user)  # Only Team Leads and Admins can update sprints
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found"
        )
    
    update_data = sprint_data.dict(exclude_unset=True)
    
    # Validate date range if dates are being updated
    start_date = update_data.get("start_date", sprint.start_date)
    end_date = update_data.get("end_date", sprint.end_date)
    
    if start_date >= end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    for field, value in update_data.items():
        setattr(sprint, field, value)
    
    db.commit()
    db.refresh(sprint)
    
    return sprint


@router.delete("/sprints/{sprint_id}")
def delete_sprint(
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_team_lead_user)  # Only Team Leads and Admins can delete sprints
):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found"
        )
    
    db.delete(sprint)
    db.commit()
    
    return {"message": "Sprint deleted successfully"}