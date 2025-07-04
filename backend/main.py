import os
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import threading

from .storage import Storage, get_storage
from .models import (
    Project, ProjectList, CreateProjectRequest,
    KnowledgeBase, KnowledgeBaseList, CreateKnowledgeBaseRequest,
    KnowledgeBaseVersion, KnowledgeBaseVersionList, CreateKbVersionRequest,
    Document, DocumentList, UploadDocumentRequest,
    DocumentVersion, DocumentVersionList,
    User,
)
from backend.data import process_document, archive_document_version_with_reason
from backend.models import CreateDocumentVersionFromUrlRequest

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
async def create_document_version(doc_id: str, request: Request):
    # Accept both JSON and form data
    if request.headers.get("content-type", "").startswith("multipart/form-data"):
        form = await request.form()
        version_name = form.get("version_name", "")
        if not isinstance(version_name, str):
            version_name = str(version_name) if version_name else ""
        change_description = form.get("change_description", "")
        if not isinstance(change_description, str):
            change_description = str(change_description) if change_description else ""
    else:
        data = await request.json()
        version_name = data.get("version_name", "")
        if not isinstance(version_name, str):
            version_name = str(version_name) if version_name else ""
        change_description = data.get("change_description", "")
        if not isinstance(change_description, str):
            change_description = str(change_description) if change_description else ""
    new_version = storage.create_document_version(
        doc_id=doc_id,
        version_name=version_name,
        change_description=change_description,
        created_by="user1"
    )
    # Trigger processing in background
    threading.Thread(target=process_document, args=(doc_id, new_version.id), daemon=True).start()
    return new_version

@app.get("/api/projects/{project_id}/documents", response_model=List[Document])
def get_project_documents(project_id: str):
    return storage.get_documents_by_project(project_id)

@app.get("/api/projects/{project_id}/document-versions", tags=["Documents"])
def get_all_document_versions(project_id: str):
    documents = storage.get_documents_by_project(project_id)
    all_versions = []
    for doc in documents:
        all_versions.extend(storage.get_document_versions_by_document(doc.id))
    return {"document_versions": all_versions}

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

@app.post("/api/knowledge-bases/{kb_id}/documents/upload", response_model=Document, status_code=201, tags=["Documents"])
def upload_document(
    kb_id: str,
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(''),
    chunking_method: str = Form('FIXED_SIZE'),
    embedding_provider: str = Form('OPENAI'),
    embedding_model: str = Form('TEXT_EMBEDDING_ADA_002'),
    chunk_size: int = Form(1000),
    chunk_overlap: int = Form(200),
):
    new_doc = storage.create_document(
        kb_id=kb_id,
        name=name,
        description=description,
        created_by="user1"
    )
    # Find the initial version and process it in the background
    from backend.data import get_document_versions_by_document
    versions = get_document_versions_by_document(new_doc.id)
    if versions:
        initial_version = versions[0]
        # Set the file_name on the initial version
        initial_version.file_name = file.filename
        storage.update_document_version(initial_version)
        threading.Thread(target=process_document, args=(new_doc.id, initial_version.id), daemon=True).start()
    return new_doc

class CreateDocumentFromUrlRequest(BaseModel):
    url: str
    name: str = None
    description: str = None

@app.post("/api/knowledge-bases/{kb_id}/documents/from-url", response_model=Document, status_code=201, tags=["Documents"])
def create_document_from_url(kb_id: str, request: CreateDocumentFromUrlRequest):
    new_doc = storage.create_document(
        kb_id=kb_id,
        name=request.name or request.url,
        description=request.description or '',
        created_by="user1"
    )
    from backend.data import get_document_versions_by_document
    versions = get_document_versions_by_document(new_doc.id)
    if versions:
        initial_version = versions[0]
        threading.Thread(target=process_document, args=(new_doc.id, initial_version.id), daemon=True).start()
    return new_doc

@app.put("/api/documents/{doc_id}/versions/{version_id}/archive", response_model=DocumentVersion, tags=["Documents"])
def archive_document_version(doc_id: str, version_id: str, body: dict = Body(...)):
    reason = body.get('reason', '')
    success = archive_document_version_with_reason(version_id, reason)
    from backend.data import get_document_version_by_id
    version = get_document_version_by_id(version_id)
    if not success or not version:
        raise HTTPException(status_code=404, detail="Document version not found or could not be archived")
    return version

@app.post("/api/documents/{doc_id}/versions/from-url", response_model=DocumentVersion, status_code=201, tags=["Documents"])
def create_document_version_from_url(doc_id: str, request: CreateDocumentVersionFromUrlRequest):
    # Create a new document version for the given document using the provided URL
    new_version = storage.create_document_version(
        doc_id=doc_id,
        version_name=f"From URL: {request.url}",
        change_description=request.change_description or f"Added from URL: {request.url}",
        created_by="user1",
        source_url=request.url
    )
    # Trigger processing in background
    threading.Thread(target=process_document, args=(doc_id, new_version.id), daemon=True).start()
    return new_version

@app.put("/api/knowledge-bases/{kb_id}/versions/{version_id}", response_model=KnowledgeBaseVersion, tags=["Versions"])
def update_kb_version(kb_id: str, version_id: str, request: CreateKbVersionRequest):
    user_id = "user1"  # Placeholder for auth
    version = storage.get_version_by_id(version_id)
    if not version or version.knowledge_base_id != kb_id:
        raise HTTPException(status_code=404, detail="Version not found")
    if version.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft versions can be updated")
    # Update fields
    version.version_name = request.version_name
    version.release_notes = request.release_notes
    version.access_level = request.access_level
    version.document_version_ids = request.document_version_ids
    version.updated_at = datetime.now()
    storage.update_kb_version(version)
    return version 