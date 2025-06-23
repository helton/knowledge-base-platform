import os
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from .storage import Storage, get_storage
from .models import (
    Project, ProjectList, CreateProjectRequest,
    KnowledgeBase, KnowledgeBaseList, CreateKnowledgeBaseRequest,
    KnowledgeBaseVersion, KnowledgeBaseVersionList, CreateKbVersionRequest,
    Document, DocumentList, UploadDocumentRequest,
    DocumentVersion, DocumentVersionList,
    User,
)

app = FastAPI(title="Knowledge Base API", version="1.0.0")

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

storage = get_storage()

# ========
# API Routes
# ========

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# Projects
@app.get("/api/projects", response_model=ProjectList, tags=["Projects"])
def get_projects():
    projects = storage.get_all_projects()
    return ProjectList(projects=projects)

@app.post("/api/projects", response_model=Project, status_code=201, tags=["Projects"])
def create_project(project_data: CreateProjectRequest):
    # In a real app, created_by would come from an auth system
    new_project = storage.create_project(project_data, created_by="user1")
    return new_project

@app.get("/api/projects/{project_id}", response_model=Project, tags=["Projects"])
def get_project(project_id: str):
    project = storage.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# Knowledge Bases
@app.get("/api/projects/{project_id}/knowledge-bases", response_model=KnowledgeBaseList, tags=["Knowledge Bases"])
def get_knowledge_bases_for_project(project_id: str):
    kbs = storage.get_knowledge_bases_by_project(project_id)
    return KnowledgeBaseList(knowledge_bases=kbs)

@app.post("/api/projects/{project_id}/knowledge-bases", response_model=KnowledgeBase, status_code=201, tags=["Knowledge Bases"])
def create_knowledge_base(project_id: str, kb_data: CreateKnowledgeBaseRequest):
    # In a real app, created_by would come from an auth system
    new_kb = storage.create_kb(
        project_id=project_id,
        name=kb_data.name,
        description=kb_data.description,
        created_by="user1"
    )
    return new_kb

@app.get("/api/knowledge-bases/{kb_id}", response_model=KnowledgeBase, tags=["Knowledge Bases"])
def get_knowledge_base(kb_id: str):
    kb = storage.get_knowledge_base_by_id(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge Base not found")
    return kb

# KB Versions
@app.get("/api/knowledge-bases/{kb_id}/versions", response_model=KnowledgeBaseVersionList, tags=["Versions"])
def get_kb_versions(kb_id: str):
    versions = storage.get_versions_by_kb(kb_id)
    return KnowledgeBaseVersionList(versions=versions)

@app.post("/api/knowledge-bases/{kb_id}/versions", response_model=KnowledgeBaseVersion, tags=["Versions"])
def create_kb_version(kb_id: str, request: CreateKbVersionRequest):
    # In a real app, user_id would come from an authentication dependency
    user_id = "user1" 
    try:
        new_version = storage.create_kb_version(
            kb_id=kb_id,
            user_id=user_id,
            version_bump=request.version_bump,
            version_name=request.version_name,
            release_notes=request.release_notes,
            document_version_ids=request.document_version_ids,
            access_level=request.access_level
        )
        return new_version
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/knowledge-bases/{kb_id}/versions/{version_id}/publish", response_model=KnowledgeBaseVersion, tags=["Versions"])
def publish_kb_version(kb_id: str, version_id: str):
    user_id = "user1" # Placeholder for auth
    try:
        updated_version = storage.publish_kb_version(kb_id=kb_id, version_id=version_id, user_id=user_id)
        return updated_version
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.put("/api/knowledge-bases/{kb_id}/versions/{version_id}/archive", response_model=KnowledgeBaseVersion, tags=["Versions"])
def archive_kb_version(kb_id: str, version_id: str):
    user_id = "user1" # Placeholder for auth
    try:
        updated_version = storage.archive_kb_version(kb_id=kb_id, version_id=version_id, user_id=user_id)
        return updated_version
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/knowledge-bases/{kb_id}/versions/{version_id}/set-primary", response_model=KnowledgeBaseVersion, tags=["Versions"])
def set_primary_kb_version(kb_id: str, version_id: str):
    # In a real app, user_id would come from an authentication dependency
    user_id = "user1"
    try:
        updated_version = storage.set_primary_kb_version(kb_id=kb_id, version_id=version_id, user_id=user_id)
        return updated_version
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/kb-versions/{version_id}/documents", response_model=List[Document], tags=["Versions"])
def get_documents_for_kb_version(version_id: str):
    try:
        documents = storage.get_documents_for_kb_version(version_id)
        return documents
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Documents
@app.get("/api/knowledge-bases/{kb_id}/documents", response_model=DocumentList, tags=["Documents"])
def get_documents_in_kb(kb_id: str):
    docs = storage.get_documents_by_kb(kb_id)
    return DocumentList(documents=docs)

@app.get("/api/documents/{doc_id}/versions", response_model=DocumentVersionList, tags=["Documents"])
def get_document_versions(doc_id: str):
    versions = storage.get_document_versions_by_document(doc_id)
    return DocumentVersionList(document_versions=versions)

@app.post("/api/knowledge-bases/{kb_id}/documents", response_model=Document, status_code=201, tags=["Documents"])
def create_document(kb_id: str, document_data: dict):
    # In a real app, created_by would come from an auth system
    new_doc = storage.create_document(
        kb_id=kb_id,
        name=document_data["name"],
        description=document_data.get("description", ""),
        created_by="user1"
    )
    return new_doc

@app.post("/api/documents/{doc_id}/versions", response_model=DocumentVersion, status_code=201, tags=["Documents"])
def create_document_version(doc_id: str, version_data: dict):
    # In a real app, created_by would come from an auth system
    new_version = storage.create_document_version(
        doc_id=doc_id,
        version_name=version_data.get("version_name"),
        change_description=version_data.get("change_description"),
        created_by="user1"
    )
    return new_version

@app.get("/api/projects/{project_id}/documents", response_model=List[Document])
def get_project_documents(project_id: str):
    return storage.get_documents_by_project(project_id)

@app.get("/api/projects/{project_id}/document-versions", response_model=List[DocumentVersion])
def get_all_document_versions(project_id: str):
    documents = storage.get_documents_by_project(project_id)
    all_versions = []
    for doc in documents:
        all_versions.extend(storage.get_document_versions_by_document(doc.id))
    return all_versions

@app.get("/api/documents/{document_id}", response_model=Document)
def get_document(document_id: str):
    db_document = storage.get_document(document_id)
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    return db_document

@app.get("/api/document-versions/{version_id}", response_model=DocumentVersion, tags=["Documents"])
def get_document_version(version_id: str):
    from backend.data import get_document_version_by_id
    version = get_document_version_by_id(version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Document version not found")
    return version 