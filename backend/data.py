from .models import (
    Project, KnowledgeBase, KnowledgeBaseVersion, Document, DocumentVersion, 
    User, VersionStatus, DocumentStatus, AccessLevel
)
from .storage import storage
from datetime import datetime
from typing import List, Optional
import uuid

# Helper function to get the current user (mocked for now)
def _get_current_user_id() -> str:
    users = storage.get_all_users()
    return users[0].id if users else "system"

# Project data functions
def get_all_projects() -> List[Project]:
    return storage.get_all_projects()

def get_project_by_id(project_id: str) -> Optional[Project]:
    return storage.get_project_by_id(project_id)

def create_project(name: str, description: str, created_by: str) -> Project:
    project = Project(name=name, description=description, created_by=created_by)
    storage.add_project(project)
    return project

# Knowledge Base data functions
def get_knowledge_bases_by_project(project_id: str) -> List[KnowledgeBase]:
    return storage.get_knowledge_bases_by_project(project_id)

def get_knowledge_base_by_id(kb_id: str) -> Optional[KnowledgeBase]:
    return storage.get_knowledge_base_by_id(kb_id)

def create_knowledge_base(project_id: str, name: str, description: str, created_by: str) -> KnowledgeBase:
    kb = KnowledgeBase(project_id=project_id, name=name, description=description, created_by=created_by)
    storage.add_knowledge_base(kb)
    return kb

# Knowledge Base Version data functions
def get_versions_by_knowledge_base(kb_id: str) -> List[KnowledgeBaseVersion]:
    return storage.get_versions_by_kb(kb_id)

def get_version_by_id(version_id: str) -> Optional[KnowledgeBaseVersion]:
    return storage.get_version_by_id(version_id)

def create_knowledge_base_version(kb_id: str, version_data: dict, user_id: str) -> KnowledgeBaseVersion:
    version = KnowledgeBaseVersion(knowledge_base_id=kb_id, created_by=user_id, **version_data)
    storage.add_kb_version(version)
    return version

def publish_kb_version(version_id: str, user_id: str) -> Optional[KnowledgeBaseVersion]:
    version = storage.get_version_by_id(version_id)
    if version and version.status == VersionStatus.DRAFT:
        version.status = VersionStatus.PUBLISHED
        version.published_at = datetime.now()
        version.published_by = user_id
        storage.update_kb_version(version)
        return version
    return None

def archive_knowledge_base_version(version_id: str) -> bool:
    version = storage.get_version_by_id(version_id)
    user_id = _get_current_user_id()
    if version and version.status != VersionStatus.ARCHIVED:
        version.status = VersionStatus.ARCHIVED
        version.is_primary = False
        version.archived_at = datetime.now()
        version.archived_by = user_id
        storage.update_kb_version(version)
        return True
    return False

def set_primary_knowledge_base_version(version_id: str) -> bool:
    version_to_set = storage.get_version_by_id(version_id)
    if not version_to_set or version_to_set.status != VersionStatus.PUBLISHED:
        return False

    all_versions = storage.get_versions_by_kb(version_to_set.knowledge_base_id)
    for version in all_versions:
        if version.is_primary and version.id != version_id:
            version.is_primary = False
            storage.update_kb_version(version)

    version_to_set.is_primary = True
    storage.update_kb_version(version_to_set)
    return True

def get_primary_kb_version(kb_id: str) -> Optional[KnowledgeBaseVersion]:
    versions = storage.get_versions_by_kb(kb_id)
    for version in versions:
        if version.is_primary:
            return version
    return None

# Document data functions
def get_documents_by_kb(kb_id: str) -> List[Document]:
    return storage.get_documents_by_kb(kb_id)

def get_documents_by_project(project_id: str) -> List[Document]:
    return storage.get_documents_by_project(project_id)

def get_document_by_id(doc_id: str) -> Optional[Document]:
    return storage.get_document_by_id(doc_id)

def create_document(kb_id: str, name: str, description: str, created_by: str) -> Document:
    doc = Document(
        id=str(uuid.uuid4()),
        knowledge_base_id=kb_id,
        name=name,
        description=description,
        status=DocumentStatus.PENDING,
        created_by=created_by,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    storage.add_document(doc)
    return doc

# Document Version data functions
def get_document_versions_by_document(doc_id: str) -> List[DocumentVersion]:
    return storage.get_document_versions_by_document(doc_id)

def get_document_version_by_id(version_id: str) -> Optional[DocumentVersion]:
    return storage.get_document_version_by_id(version_id)

def get_latest_document_version(doc_id: str) -> Optional[DocumentVersion]:
    versions = get_active_document_versions(doc_id)
    if not versions:
        return None
    return max(versions, key=lambda v: v.created_at)

def get_active_document_versions(doc_id: str) -> List[DocumentVersion]:
    versions = storage.get_document_versions_by_document(doc_id)
    return [v for v in versions if not v.is_archived]

def create_document_version(doc_id: str, version_data: dict, created_by: str) -> DocumentVersion:
    version = DocumentVersion(document_id=doc_id, created_by=created_by, **version_data)
    storage.add_document_version(version)
    return version

def archive_document_version_with_reason(version_id: str, reason: str) -> bool:
    version = storage.get_document_version_by_id(version_id)
    user_id = _get_current_user_id()
    if version and not version.is_archived:
        version.is_archived = True
        version.archive_reason = reason
        version.archived_at = datetime.now()
        version.archived_by = user_id
        storage.update_document_version(version)
        return True
    return False

# User data functions
def get_all_users() -> List[User]:
    return storage.get_all_users()

# Processing functions
def process_document(doc_id: str, version_id: str):
    from time import sleep
    from .models import ProcessingStage
    
    version = storage.get_document_version_by_id(version_id)
    if not version:
        return

    stages = [
        (ProcessingStage.DOWNLOAD, 25),
        (ProcessingStage.EXTRACT, 50),
        (ProcessingStage.CLEAN, 75),
        (ProcessingStage.CHUNK, 90),
        (ProcessingStage.EMBED, 100)
    ]

    version.status = DocumentStatus.PROCESSING
    for stage, progress in stages:
        version.processing_stage = stage
        version.processing_progress = progress
        storage.update_document_version(version)
        sleep(2)

    version.status = DocumentStatus.COMPLETED
    version.chunk_count = 150
    storage.update_document_version(version) 