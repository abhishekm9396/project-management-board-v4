from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.auth import get_current_user
from ..models.user import User
from ..models.story import Story
from ..models.project import Project
from ..schemas.story import StoryResponse, StoryCreate, StoryUpdate

router = APIRouter()


def generate_story_number(db: Session, project_id: int) -> str:
    """Generate next story number for a project (e.g., T&D-1001)"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get the highest story number for this project
    stories = db.query(Story).filter(Story.project_id == project_id).all()
    max_number = 1000  # Start from 1001
    
    for story in stories:
        if story.story_number:
            try:
                number_part = int(story.story_number.split('-')[1])
                max_number = max(max_number, number_part)
            except (IndexError, ValueError):
                continue
    
    return f"{project.prefix}-{max_number + 1:04d}"


@router.get("/stories", response_model=List[StoryResponse])
def get_stories(
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    assignee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Story)
    
    if project_id:
        query = query.filter(Story.project_id == project_id)
    if status:
        query = query.filter(Story.status == status)
    if assignee_id:
        query = query.filter(Story.assignee_id == assignee_id)
    
    stories = query.all()
    return stories


@router.get("/stories/{story_id}", response_model=StoryResponse)
def get_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    return story


@router.post("/stories", response_model=StoryResponse)
def create_story(
    story_data: StoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify project exists
    project = db.query(Project).filter(Project.id == story_data.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Generate story number
    story_number = generate_story_number(db, story_data.project_id)
    
    db_story = Story(
        story_number=story_number,
        title=story_data.title,
        description=story_data.description,
        acceptance_criteria=story_data.acceptance_criteria,
        story_points=story_data.story_points,
        status=story_data.status,
        priority=story_data.priority,
        story_type=story_data.story_type,
        project_id=story_data.project_id,
        assignee_id=story_data.assignee_id,
        sprint_id=story_data.sprint_id,
        due_date=story_data.due_date,
        created_by=current_user.id
    )
    
    db.add(db_story)
    db.commit()
    db.refresh(db_story)
    
    return db_story


@router.put("/stories/{story_id}", response_model=StoryResponse)
def update_story(
    story_id: int,
    story_data: StoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    update_data = story_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(story, field, value)
    
    db.commit()
    db.refresh(story)
    
    return story


@router.delete("/stories/{story_id}")
def delete_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Story not found"
        )
    
    # Check if user has permission to delete (Admin, Team Lead, or story creator)
    if (current_user.role not in ["Admin", "Team Lead"] and 
        story.created_by != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this story"
        )
    
    db.delete(story)
    db.commit()
    
    return {"message": "Story deleted successfully"}