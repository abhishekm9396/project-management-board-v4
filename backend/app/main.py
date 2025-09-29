from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import engine
from .models import user, project, story, sprint  # Import all models
from .api import auth, users, projects, stories, sprints

# Create all tables
user.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(projects.router, prefix="/api", tags=["projects"])
app.include_router(stories.router, prefix="/api", tags=["stories"])
app.include_router(sprints.router, prefix="/api", tags=["sprints"])


@app.get("/")
def read_root():
    return {"message": "Project Management API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}