from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn
import asyncio
import uuid
from datetime import datetime

from .models import (
    Project, KnowledgeBase, KnowledgeBaseVersion, Document, DocumentVersion,
    ProjectList, KnowledgeBaseList, DocumentList, DocumentVersionList, 
    KnowledgeBaseVersionList, ProcessingStatus, CreateKnowledgeBaseRequest,
    CreateVersionRequest, UploadDocumentRequest, User, UserRole, AccessLevel,
    ProjectUser
)
from .data import (
    get_all_projects, get_project_by_id, get_knowledge_bases_by_project,
    get_knowledge_base_by_id, get_versions_by_knowledge_base, get_version_by_id,
    get_documents_by_project, get_document_by_id, get_document_versions_by_document,
    get_document_version_by_id, process_document, create_knowledge_base,
    create_knowledge_base_version, create_document, deprecate_knowledge_base_version,
    deprecate_document_version, set_primary_knowledge_base, get_all_users,
    get_documents_by_kb
)
from .storage import storage

# Create FastAPI app
app = FastAPI(
    title="RAG Knowledge Base API",
    description="API for managing knowledge bases, documents, and RAG workflows",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {"message": "RAG Knowledge Base API is running"}


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# User endpoints
@app.get("/api/users", tags=["Users"])
async def get_users():
    """Get all users"""
    users = get_all_users()
    return {"users": users}


# Project endpoints
@app.get("/api/projects", response_model=ProjectList, tags=["Projects"])
async def get_projects():
    """Get all projects"""
    projects = get_all_projects()
    return ProjectList(projects=projects)


@app.get("/api/projects/{project_id}", response_model=Project, tags=["Projects"])
async def get_project(project_id: str):
    """Get a specific project by ID"""
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.get("/api/projects/{project_id}/knowledge-bases", response_model=KnowledgeBaseList, tags=["Knowledge Bases"])
async def get_project_knowledge_bases(project_id: str):
    """Get all knowledge bases for a specific project"""
    # Verify project exists
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    knowledge_bases = get_knowledge_bases_by_project(project_id)
    return KnowledgeBaseList(knowledge_bases=knowledge_bases)


@app.post("/api/projects/{project_id}/knowledge-bases", response_model=KnowledgeBase, tags=["Knowledge Bases"])
async def create_project_knowledge_base(
    project_id: str, 
    request: CreateKnowledgeBaseRequest
):
    """Create a new knowledge base for a project"""
    # Verify project exists
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # For now, use the first user as creator. In a real app, you'd get this from auth
    users = get_all_users()
    if not users:
        raise HTTPException(status_code=500, detail="No users available")
    
    kb = create_knowledge_base(
        project_id=project_id,
        name=request.name,
        description=request.description or "",
        access_level=request.access_level,
        created_by=users[0].id
    )
    return kb


# Knowledge Base endpoints
@app.get("/api/knowledge-bases/{kb_id}", response_model=KnowledgeBase, tags=["Knowledge Bases"])
async def get_knowledge_base(kb_id: str):
    """Get a specific knowledge base by ID"""
    knowledge_base = get_knowledge_base_by_id(kb_id)
    if not knowledge_base:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return knowledge_base


@app.put("/api/knowledge-bases/{kb_id}/primary", tags=["Knowledge Bases"])
async def set_kb_as_primary(kb_id: str):
    """Set a knowledge base as primary for its project"""
    success = set_primary_knowledge_base(kb_id)
    if not success:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return {"message": "Knowledge base set as primary"}


# Knowledge Base Version endpoints
@app.get("/api/knowledge-bases/{kb_id}/versions", response_model=KnowledgeBaseVersionList, tags=["Versions"])
async def get_knowledge_base_versions(kb_id: str):
    """Get all versions for a specific knowledge base"""
    # Verify knowledge base exists
    knowledge_base = get_knowledge_base_by_id(kb_id)
    if not knowledge_base:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    versions = get_versions_by_knowledge_base(kb_id)
    return KnowledgeBaseVersionList(versions=versions)


@app.post("/api/knowledge-bases/{kb_id}/versions", response_model=KnowledgeBaseVersion, tags=["Versions"])
async def create_kb_version(
    kb_id: str,
    request: CreateVersionRequest
):
    """Create a new version for a knowledge base"""
    # Verify knowledge base exists
    knowledge_base = get_knowledge_base_by_id(kb_id)
    if not knowledge_base:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    # For now, use the first user as creator. In a real app, you'd get this from auth
    users = get_all_users()
    if not users:
        raise HTTPException(status_code=500, detail="No users available")
    
    version_data = {
        "version_number": request.version_number,
        "description": request.description or "",
        "chunking_method": request.chunking_method,
        "embedding_provider": request.embedding_provider,
        "embedding_model": request.embedding_model,
        "chunk_size": request.chunk_size,
        "chunk_overlap": request.chunk_overlap,
        "document_versions": request.document_version_ids
    }
    
    kb_version = create_knowledge_base_version(kb_id, version_data, users[0].id)
    return kb_version


@app.get("/api/knowledge-bases/{kb_id}/versions/{version_id}", response_model=KnowledgeBaseVersion, tags=["Versions"])
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


@app.put("/api/knowledge-bases/{kb_id}/versions/{version_id}/deprecate", tags=["Versions"])
async def deprecate_kb_version(kb_id: str, version_id: str):
    """Deprecate a knowledge base version"""
    # Verify knowledge base exists
    knowledge_base = get_knowledge_base_by_id(kb_id)
    if not knowledge_base:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    success = deprecate_knowledge_base_version(version_id)
    if not success:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return {"message": "Version deprecated successfully"}


# Document endpoints
@app.get("/api/knowledge-bases/{kb_id}/documents", response_model=DocumentList, tags=["Documents"])
async def get_kb_documents(kb_id: str):
    """Get all documents for a specific knowledge base"""
    # Verify knowledge base exists
    knowledge_base = get_knowledge_base_by_id(kb_id)
    if not knowledge_base:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    documents = get_documents_by_kb(kb_id)
    return DocumentList(documents=documents)


@app.post("/api/knowledge-bases/{kb_id}/documents/upload", tags=["Documents"])
async def upload_kb_document(
    kb_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    chunking_method: str = Form("fixed_size"),
    embedding_provider: str = Form("openai"),
    embedding_model: str = Form("text-embedding-ada-002"),
    chunk_size: int = Form(1000),
    chunk_overlap: int = Form(200)
):
    """Upload and process a document for a knowledge base"""
    # Verify knowledge base exists
    knowledge_base = get_knowledge_base_by_id(kb_id)
    if not knowledge_base:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    # For now, use the first user as creator. In a real app, you'd get this from auth
    users = get_all_users()
    if not users:
        raise HTTPException(status_code=500, detail="No users available")
    
    # Create document record
    doc = create_document(
        knowledge_base_id=kb_id,
        name=name,
        description=description or "",
        file_path=f"/uploads/{file.filename}",
        file_size=len(await file.read()),
        mime_type=file.content_type or "application/octet-stream",
        created_by=users[0].id
    )
    
    # Reset file position for background processing
    await file.seek(0)
    
    # Add background task for processing
    processing_config = {
        "chunking_method": chunking_method,
        "embedding_provider": embedding_provider,
        "embedding_model": embedding_model,
        "chunk_size": chunk_size,
        "chunk_overlap": chunk_overlap
    }
    
    background_tasks.add_task(process_document, doc.id, processing_config)
    
    return {"message": "Document uploaded and processing started", "document_id": doc.id}


@app.get("/api/projects/{project_id}/documents", response_model=DocumentList, tags=["Documents"])
async def get_project_documents(project_id: str):
    """Get all documents for a specific project"""
    # Verify project exists
    project = get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    documents = get_documents_by_project(project_id)
    return DocumentList(documents=documents)


@app.get("/api/documents/{doc_id}", response_model=Document, tags=["Documents"])
async def get_document(doc_id: str):
    """Get a specific document by ID"""
    document = get_document_by_id(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@app.get("/api/documents/{doc_id}/versions", response_model=DocumentVersionList, tags=["Documents"])
async def get_document_versions(doc_id: str):
    """Get all versions for a specific document"""
    # Verify document exists
    document = get_document_by_id(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    versions = get_document_versions_by_document(doc_id)
    return DocumentVersionList(document_versions=versions)


@app.get("/api/documents/{doc_id}/versions/{version_id}", response_model=DocumentVersion, tags=["Documents"])
async def get_document_version(doc_id: str, version_id: str):
    """Get a specific document version by ID"""
    # Verify document exists
    document = get_document_by_id(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    version = get_document_version_by_id(version_id)
    if not version or version.document_id != doc_id:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return version


@app.put("/api/documents/{doc_id}/versions/{version_id}/deprecate", tags=["Documents"])
async def deprecate_doc_version(doc_id: str, version_id: str):
    """Deprecate a document version"""
    # Verify document exists
    document = get_document_by_id(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    success = deprecate_document_version(version_id)
    if not success:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return {"message": "Version deprecated successfully"}


@app.get("/api/documents/{doc_id}/status", response_model=ProcessingStatus, tags=["Documents"])
async def get_document_processing_status(doc_id: str):
    """Get the processing status of a document"""
    document = get_document_by_id(doc_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return ProcessingStatus(
        document_id=doc_id,
        status=document.status,
        stage=document.processing_stage,
        progress=document.processing_progress,
        error_message=document.error_message
    )


@app.post("/api/projects", response_model=Project, tags=["Projects"])
async def create_project(request: dict):
    """Create a new project"""
    # Get the first user as creator (in a real app, you'd get this from auth)
    users = storage.get_all_users()
    if not users:
        raise HTTPException(status_code=500, detail="No users available")
    
    creator_id = users[0].id
    
    project_data = {
        "id": str(uuid.uuid4()),
        "name": request.get("name", "New Project"),
        "description": request.get("description", ""),
        "created_by": creator_id,
        "access_token": f"token_{uuid.uuid4().hex[:8]}",
        "users": {
            creator_id: ProjectUser(user_id=creator_id, role=UserRole.ADMIN)
        },
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    project = storage.create_project(project_data)
    return project


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 