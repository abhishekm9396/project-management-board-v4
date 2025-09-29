from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..core.auth import get_current_user, get_admin_or_team_lead_user
from ..models.user import User
from ..models.project import Project
from ..schemas.project import ProjectResponse, ProjectCreate, ProjectUpdate

router = APIRouter()


@router.get("/projects", response_model=List[ProjectResponse])
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.query(Project).all()
    return projects


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


@router.post("/projects", response_model=ProjectResponse)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_team_lead_user)
):
    # Check if prefix already exists
    if db.query(Project).filter(Project.prefix == project_data.prefix).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project prefix already exists"
        )
    
    db_project = Project(
        name=project_data.name,
        prefix=project_data.prefix,
        description=project_data.description,
        team_lead_id=project_data.team_lead_id,
        created_by=current_user.id
    )
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    return db_project


@router.put("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_team_lead_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    update_data = project_data.dict(exclude_unset=True)
    
    # Check if new prefix conflicts with existing one
    if "prefix" in update_data and update_data["prefix"] != project.prefix:
        if db.query(Project).filter(Project.prefix == update_data["prefix"]).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project prefix already exists"
            )
    
    for field, value in update_data.items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    
    return project


@router.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_team_lead_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}