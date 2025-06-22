from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn

from .models import Project, KnowledgeBase, Version, ProjectList, KnowledgeBaseList, VersionList
from .data import (
    get_all_projects,
    get_project_by_id,
    get_knowledge_bases_by_project,
    get_knowledge_base_by_id,
    get_versions_by_knowledge_base,
    get_version_by_id
)

# Create FastAPI app
app = FastAPI(
    title="Knowledge Base API",
    description="API for managing knowledge bases and documents",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8501"],  # Streamlit app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {"message": "Knowledge Base API is running"}


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/projects", response_model=ProjectList, tags=["Projects"])
async def get_projects():
    """Get all projects"""
    projects = get_all_projects()
    return ProjectList(projects=projects)


@app.get("/projects/{project_id}", response_model=Project, tags=["Projects"])
async def get_project(project_id: str):
    """Get a specific project by ID"""
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.get("/projects/{project_id}/knowledge-bases", response_model=KnowledgeBaseList, tags=["Knowledge Bases"])
async def get_project_knowledge_bases(project_id: str):
    """Get all knowledge bases for a specific project"""
    # Verify project exists
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    knowledge_bases = get_knowledge_bases_by_project(project_id)
    return KnowledgeBaseList(knowledge_bases=knowledge_bases)


@app.get("/knowledge-bases/{kb_id}", response_model=KnowledgeBase, tags=["Knowledge Bases"])
async def get_knowledge_base(kb_id: str):
    """Get a specific knowledge base by ID"""
    knowledge_base = get_knowledge_base_by_id(kb_id)
    if not knowledge_base:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return knowledge_base


@app.get("/knowledge-bases/{kb_id}/versions", response_model=VersionList, tags=["Versions"])
async def get_knowledge_base_versions(kb_id: str):
    """Get all versions for a specific knowledge base"""
    # Verify knowledge base exists
    knowledge_base = get_knowledge_base_by_id(kb_id)
    if not knowledge_base:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    versions = get_versions_by_knowledge_base(kb_id)
    return VersionList(versions=versions)


@app.get("/knowledge-bases/{kb_id}/versions/{version_id}", response_model=Version, tags=["Versions"])
async def get_version(kb_id: str, version_id: str):
    """Get a specific version by ID"""
    # Verify knowledge base exists
    knowledge_base = get_knowledge_base_by_id(kb_id)
    if not knowledge_base:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    version = get_version_by_id(version_id)
    if not version or version.knowledge_base_id != kb_id:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return version


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 