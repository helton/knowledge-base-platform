from datetime import datetime, timedelta
from typing import List, Dict, Optional
import asyncio
import random
import time
from .models import (
    Project, KnowledgeBase, KnowledgeBaseVersion, Document, DocumentVersion,
    ProjectUser, User, ProjectStatus, KnowledgeBaseStatus, VersionStatus, 
    DocumentStatus, ProcessingStage, ChunkingMethod, EmbeddingProvider, 
    EmbeddingModel, AccessLevel, UserRole
)
from .storage import storage


# User functions
def get_all_users() -> List[User]:
    return storage.get_all_users()

def get_user_by_id(user_id: str) -> Optional[User]:
    return storage.get_user_by_id(user_id)

# Project functions
def get_all_projects() -> List[Project]:
    return storage.get_all_projects()

def get_project_by_id(project_id: str) -> Optional[Project]:
    return storage.get_project_by_id(project_id)

# Knowledge Base functions
def get_knowledge_bases_by_project(project_id: str) -> List[KnowledgeBase]:
    return storage.get_knowledge_bases_by_project(project_id)

def get_knowledge_base_by_id(kb_id: str) -> Optional[KnowledgeBase]:
    return storage.get_knowledge_base_by_id(kb_id)

def get_versions_by_knowledge_base(kb_id: str) -> List[KnowledgeBaseVersion]:
    return storage.get_versions_by_knowledge_base(kb_id)

def get_version_by_id(version_id: str) -> Optional[KnowledgeBaseVersion]:
    return storage.get_version_by_id(version_id)

# Document functions
def get_documents_by_project(project_id: str) -> List[Document]:
    # Get all knowledge bases for the project, then get documents for each
    knowledge_bases = storage.get_knowledge_bases_by_project(project_id)
    documents = []
    for kb in knowledge_bases:
        kb_documents = storage.get_documents_by_kb(kb.id)
        documents.extend(kb_documents)
    return documents

def get_documents_by_kb(kb_id: str) -> List[Document]:
    return storage.get_documents_by_kb(kb_id)

def get_document_by_id(doc_id: str) -> Optional[Document]:
    return storage.get_document_by_id(doc_id)

def get_document_versions_by_document(doc_id: str) -> List[DocumentVersion]:
    return storage.get_document_versions(doc_id)

def get_document_version_by_id(version_id: str) -> Optional[DocumentVersion]:
    return storage.get_document_version_by_id(version_id)

def get_latest_document_version(doc_id: str) -> Optional[DocumentVersion]:
    return storage.get_latest_document_version(doc_id)

def get_next_version_number(doc_id: str) -> str:
    return storage.get_next_version_number(doc_id)

def get_active_document_versions(doc_id: str) -> List[DocumentVersion]:
    return storage.get_active_document_versions(doc_id)

# Create functions
def create_knowledge_base(project_id: str, name: str, description: str, access_level: AccessLevel, created_by: str) -> KnowledgeBase:
    import uuid
    from datetime import datetime
    
    kb_data = {
        "id": str(uuid.uuid4()),
        "name": name,
        "description": description,
        "project_id": project_id,
        "status": KnowledgeBaseStatus.ACTIVE,
        "access_level": access_level,
        "is_primary": False,
        "current_version": None,
        "created_by": created_by,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    return storage.create_knowledge_base(kb_data)

def create_knowledge_base_version(kb_id: str, version_data: dict, created_by: str) -> KnowledgeBaseVersion:
    import uuid
    from datetime import datetime
    
    version_info = {
        "id": str(uuid.uuid4()),
        "knowledge_base_id": kb_id,
        "version_number": version_data.get("version_number", "v1.0.0"),
        "description": version_data.get("description", ""),
        "status": VersionStatus.DRAFT,
        "chunking_method": version_data.get("chunking_method", ChunkingMethod.FIXED_SIZE),
        "embedding_provider": version_data.get("embedding_provider", EmbeddingProvider.OPENAI),
        "embedding_model": version_data.get("embedding_model", EmbeddingModel.TEXT_EMBEDDING_ADA_002),
        "chunk_size": version_data.get("chunk_size", 1000),
        "chunk_overlap": version_data.get("chunk_overlap", 200),
        "document_versions": version_data.get("document_versions", []),
        "created_by": created_by,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    return storage.create_kb_version(version_info)

def create_document(knowledge_base_id: str, name: str, description: str, file_path: str, file_size: int, mime_type: str, created_by: str) -> Document:
    import uuid
    from datetime import datetime
    
    doc_data = {
        "id": str(uuid.uuid4()),
        "name": name,
        "description": description,
        "file_path": file_path,
        "file_size": file_size,
        "mime_type": mime_type,
        "knowledge_base_id": knowledge_base_id,
        "status": DocumentStatus.PENDING,
        "processing_stage": ProcessingStage.DOWNLOAD,
        "processing_progress": 0.0,
        "chunk_count": 0,
        "embedding_count": 0,
        "created_by": created_by,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    return storage.create_document(doc_data)

def create_document_version(doc_id: str, version_data: dict, created_by: str) -> DocumentVersion:
    """Create a new version of an existing document"""
    import uuid
    from datetime import datetime
    
    # Get the next version number
    next_version = storage.get_next_version_number(doc_id)
    
    version_info = {
        "id": str(uuid.uuid4()),
        "document_id": doc_id,
        "version_number": next_version,
        "version_name": version_data.get("version_name"),
        "change_description": version_data.get("change_description"),
        "status": DocumentStatus.PENDING,
        "processing_stage": ProcessingStage.DOWNLOAD,
        "processing_progress": 0.0,
        "chunk_count": 0,
        "embedding_count": 0,
        "chunking_method": version_data.get("chunking_method", ChunkingMethod.FIXED_SIZE),
        "embedding_provider": version_data.get("embedding_provider", EmbeddingProvider.OPENAI),
        "embedding_model": version_data.get("embedding_model", EmbeddingModel.TEXT_EMBEDDING_ADA_002),
        "chunk_size": version_data.get("chunk_size", 1000),
        "chunk_overlap": version_data.get("chunk_overlap", 200),
        "file_path": version_data.get("file_path"),
        "file_size": version_data.get("file_size"),
        "mime_type": version_data.get("mime_type"),
        "is_deprecated": False,
        "created_by": created_by,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    return storage.create_document_version(version_info)

# Archive functions
def archive_knowledge_base_version(version_id: str) -> bool:
    version = storage.get_version_by_id(version_id)
    if version:
        version.status = VersionStatus.ARCHIVED
        version.updated_at = datetime.now()
        # Update in storage
        storage._kb_versions[version_id] = version
        storage._save_all()
        return True
    return False

def archive_document_version(version_id: str) -> bool:
    version = storage.get_document_version_by_id(version_id)
    if version:
        version.status = DocumentStatus.ARCHIVED
        version.updated_at = datetime.now()
        # Update in storage
        storage._document_versions[version_id] = version
        storage._save_all()
        return True
    return False

def archive_document_version_with_reason(version_id: str, reason: str, archived_by: str) -> bool:
    """Archive a document version with a reason"""
    return storage.archive_document_version(version_id, reason, archived_by)

# Set primary knowledge base
def set_primary_knowledge_base(kb_id: str) -> bool:
    kb = storage.get_knowledge_base_by_id(kb_id)
    if not kb:
        return False
    
    # Set all other KBs in the same project as non-primary
    project_kbs = storage.get_knowledge_bases_by_project(kb.project_id)
    for project_kb in project_kbs:
        project_kb.is_primary = (project_kb.id == kb_id)
        project_kb.updated_at = datetime.now()
        storage._knowledge_bases[project_kb.id] = project_kb
    
    storage._save_all()
    return True

# Document processing (simplified for now)
async def process_document(document_id: str, processing_config: dict, created_by: str) -> DocumentVersion:
    """Process a document (simplified version)"""
    import uuid
    from datetime import datetime
    
    doc = storage.get_document_by_id(document_id)
    if not doc:
        raise ValueError("Document not found")
    
    # Update document status to processing
    doc.status = DocumentStatus.PROCESSING
    doc.processing_stage = ProcessingStage.EXTRACT
    doc.processing_progress = 0.1
    doc.updated_at = datetime.now()
    storage._documents[document_id] = doc
    
    # Simulate processing
    await asyncio.sleep(2)
    
    # Update progress
    doc.processing_stage = ProcessingStage.CHUNK
    doc.processing_progress = 0.5
    doc.chunk_count = 25
    doc.updated_at = datetime.now()
    storage._documents[document_id] = doc
    
    await asyncio.sleep(2)
    
    # Complete processing
    doc.status = DocumentStatus.COMPLETED
    doc.processing_stage = ProcessingStage.EMBED
    doc.processing_progress = 1.0
    doc.embedding_count = 25
    doc.updated_at = datetime.now()
    storage._documents[document_id] = doc
    
    # Find the latest version and update it instead of creating a new one
    latest_version = storage.get_latest_document_version(document_id)
    if latest_version:
        # Update the existing version with processing results
        latest_version.status = DocumentStatus.COMPLETED
        latest_version.processing_stage = ProcessingStage.EMBED
        latest_version.processing_progress = 1.0
        latest_version.chunk_count = 25
        latest_version.embedding_count = 25
        latest_version.updated_at = datetime.now()
        
        # Update in storage
        storage._document_versions[latest_version.id] = latest_version
        storage._save_all()
        
        return latest_version
    else:
        # Fallback: create a version if none exists (shouldn't happen)
        version_data = {
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "version_number": "v1",
            "status": DocumentStatus.COMPLETED,
            "processing_stage": ProcessingStage.EMBED,
            "processing_progress": 1.0,
            "chunk_count": 25,
            "embedding_count": 25,
            "chunking_method": processing_config.get("chunking_method", ChunkingMethod.FIXED_SIZE),
            "embedding_provider": processing_config.get("embedding_provider", EmbeddingProvider.OPENAI),
            "embedding_model": processing_config.get("embedding_model", EmbeddingModel.TEXT_EMBEDDING_ADA_002),
            "chunk_size": processing_config.get("chunk_size", 1000),
            "chunk_overlap": processing_config.get("chunk_overlap", 200),
            "created_by": created_by,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        version = storage.create_document_version(version_data)
        return version 