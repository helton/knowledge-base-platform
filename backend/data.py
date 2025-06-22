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


# Mock data storage
_users: Dict[str, User] = {}
_projects: Dict[str, Project] = {}
_knowledge_bases: Dict[str, KnowledgeBase] = {}
_kb_versions: Dict[str, KnowledgeBaseVersion] = {}
_documents: Dict[str, Document] = {}
_document_versions: Dict[str, DocumentVersion] = {}


def _initialize_mock_data():
    """Initialize mock data for the application"""
    global _users, _projects, _knowledge_bases, _kb_versions, _documents, _document_versions
    
    # Create mock users
    users_data = [
        {
            "username": "john_doe",
            "email": "john.doe@example.com",
            "full_name": "John Doe"
        },
        {
            "username": "jane_smith",
            "email": "jane.smith@example.com", 
            "full_name": "Jane Smith"
        },
        {
            "username": "bob_wilson",
            "email": "bob.wilson@example.com",
            "full_name": "Bob Wilson"
        }
    ]
    
    for user_data in users_data:
        user = User(**user_data)
        _users[user.id] = user
    
    # Create mock projects
    projects_data = [
        {
            "name": "E-commerce Platform",
            "description": "Knowledge base for our main e-commerce platform",
            "created_by": list(_users.keys())[0],
            "access_token": "proj_001_token_abc123"
        },
        {
            "name": "Customer Support",
            "description": "Internal knowledge base for customer support team",
            "created_by": list(_users.keys())[1],
            "access_token": "proj_002_token_def456"
        },
        {
            "name": "Marketing Campaigns",
            "description": "Knowledge base for marketing campaigns and strategies",
            "created_by": list(_users.keys())[2],
            "access_token": "proj_003_token_ghi789"
        }
    ]
    
    for project_data in projects_data:
        project = Project(**project_data)
        # Add users to projects with different roles
        project.users = {
            list(_users.keys())[0]: ProjectUser(user_id=list(_users.keys())[0], role=UserRole.ADMIN),
            list(_users.keys())[1]: ProjectUser(user_id=list(_users.keys())[1], role=UserRole.WRITER),
            list(_users.keys())[2]: ProjectUser(user_id=list(_users.keys())[2], role=UserRole.READER),
        }
        _projects[project.id] = project
    
    # Create mock knowledge bases
    kb_data = [
        {
            "name": "Product Documentation",
            "description": "Complete product documentation and user guides",
            "project_id": list(_projects.keys())[0],
            "status": KnowledgeBaseStatus.ACTIVE,
            "access_level": AccessLevel.PROTECTED,
            "is_primary": True,
            "current_version": "v1.2.0",
            "created_by": list(_users.keys())[0]
        },
        {
            "name": "API Reference",
            "description": "API documentation and integration guides",
            "project_id": list(_projects.keys())[0],
            "status": KnowledgeBaseStatus.ACTIVE,
            "access_level": AccessLevel.PUBLIC,
            "is_primary": False,
            "current_version": "v2.1.0",
            "created_by": list(_users.keys())[0]
        },
        {
            "name": "FAQ Database",
            "description": "Frequently asked questions and solutions",
            "project_id": list(_projects.keys())[1],
            "status": KnowledgeBaseStatus.ACTIVE,
            "access_level": AccessLevel.PROTECTED,
            "is_primary": True,
            "current_version": "v1.0.5",
            "created_by": list(_users.keys())[1]
        }
    ]
    
    for kb_data_item in kb_data:
        kb = KnowledgeBase(**kb_data_item)
        _knowledge_bases[kb.id] = kb
    
    # Create mock documents
    documents_data = [
        {
            "name": "User Manual.pdf",
            "description": "Complete user manual for the platform",
            "file_path": "/uploads/user_manual.pdf",
            "file_size": 2048576,
            "mime_type": "application/pdf",
            "knowledge_base_id": list(_knowledge_bases.keys())[0],
            "status": DocumentStatus.COMPLETED,
            "processing_stage": ProcessingStage.EMBED,
            "processing_progress": 1.0,
            "chunk_count": 45,
            "embedding_count": 45,
            "created_by": list(_users.keys())[0]
        },
        {
            "name": "API Documentation.pdf",
            "description": "REST API documentation",
            "file_path": "/uploads/api_docs.pdf",
            "file_size": 1536000,
            "mime_type": "application/pdf",
            "knowledge_base_id": list(_knowledge_bases.keys())[0],
            "status": DocumentStatus.COMPLETED,
            "processing_stage": ProcessingStage.EMBED,
            "processing_progress": 1.0,
            "chunk_count": 32,
            "embedding_count": 32,
            "created_by": list(_users.keys())[0]
        },
        {
            "name": "FAQ List.docx",
            "description": "Frequently asked questions",
            "file_path": "/uploads/faq_list.docx",
            "file_size": 512000,
            "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "knowledge_base_id": list(_knowledge_bases.keys())[1],
            "status": DocumentStatus.PROCESSING,
            "processing_stage": ProcessingStage.CHUNK,
            "processing_progress": 0.6,
            "chunk_count": 0,
            "embedding_count": 0,
            "created_by": list(_users.keys())[1]
        },
        {
            "name": "Troubleshooting Guide.pdf",
            "description": "Common issues and solutions",
            "file_path": "/uploads/troubleshooting.pdf",
            "file_size": 1024000,
            "mime_type": "application/pdf",
            "knowledge_base_id": list(_knowledge_bases.keys())[1],
            "status": DocumentStatus.FAILED,
            "processing_stage": ProcessingStage.EXTRACT,
            "processing_progress": 0.3,
            "error_message": "Failed to extract text from PDF: Corrupted file",
            "chunk_count": 0,
            "embedding_count": 0,
            "created_by": list(_users.keys())[1]
        }
    ]
    
    for doc_data in documents_data:
        doc = Document(**doc_data)
        _documents[doc.id] = doc
    
    # Create mock document versions
    doc_versions_data = [
        {
            "document_id": list(_documents.keys())[0],
            "version_number": "v1.0.0",
            "status": DocumentStatus.COMPLETED,
            "processing_stage": ProcessingStage.EMBED,
            "processing_progress": 1.0,
            "chunk_count": 45,
            "embedding_count": 45,
            "chunking_method": ChunkingMethod.FIXED_SIZE,
            "embedding_provider": EmbeddingProvider.OPENAI,
            "embedding_model": EmbeddingModel.TEXT_EMBEDDING_ADA_002,
            "chunk_size": 1000,
            "chunk_overlap": 200
        },
        {
            "document_id": list(_documents.keys())[0],
            "version_number": "v1.1.0",
            "status": DocumentStatus.COMPLETED,
            "processing_stage": ProcessingStage.EMBED,
            "processing_progress": 1.0,
            "chunk_count": 52,
            "embedding_count": 52,
            "chunking_method": ChunkingMethod.SEMANTIC,
            "embedding_provider": EmbeddingProvider.OPENAI,
            "embedding_model": EmbeddingModel.TEXT_EMBEDDING_3_SMALL,
            "chunk_size": 800,
            "chunk_overlap": 100
        },
        {
            "document_id": list(_documents.keys())[1],
            "version_number": "v1.0.0",
            "status": DocumentStatus.COMPLETED,
            "processing_stage": ProcessingStage.EMBED,
            "processing_progress": 1.0,
            "chunk_count": 32,
            "embedding_count": 32,
            "chunking_method": ChunkingMethod.FIXED_SIZE,
            "embedding_provider": EmbeddingProvider.OPENAI,
            "embedding_model": EmbeddingModel.TEXT_EMBEDDING_ADA_002,
            "chunk_size": 1000,
            "chunk_overlap": 200
        }
    ]
    
    for doc_ver_data in doc_versions_data:
        doc_ver = DocumentVersion(**doc_ver_data)
        _document_versions[doc_ver.id] = doc_ver
    
    # Create mock knowledge base versions
    kb_versions_data = [
        {
            "knowledge_base_id": list(_knowledge_bases.keys())[0],
            "version_number": "v1.0.0",
            "description": "Initial release",
            "status": VersionStatus.PUBLISHED,
            "chunking_method": ChunkingMethod.FIXED_SIZE,
            "embedding_provider": EmbeddingProvider.OPENAI,
            "embedding_model": EmbeddingModel.TEXT_EMBEDDING_ADA_002,
            "chunk_size": 1000,
            "chunk_overlap": 200,
            "document_versions": [list(_document_versions.keys())[0]],
            "total_chunks": 45,
            "total_embeddings": 45,
            "created_by": list(_users.keys())[0]
        },
        {
            "knowledge_base_id": list(_knowledge_bases.keys())[0],
            "version_number": "v1.1.0",
            "description": "Added new features section",
            "status": VersionStatus.PUBLISHED,
            "chunking_method": ChunkingMethod.SEMANTIC,
            "embedding_provider": EmbeddingProvider.OPENAI,
            "embedding_model": EmbeddingModel.TEXT_EMBEDDING_3_SMALL,
            "chunk_size": 800,
            "chunk_overlap": 100,
            "document_versions": [list(_document_versions.keys())[1]],
            "total_chunks": 52,
            "total_embeddings": 52,
            "created_by": list(_users.keys())[0]
        },
        {
            "knowledge_base_id": list(_knowledge_bases.keys())[1],
            "version_number": "v2.0.0",
            "description": "Major API overhaul",
            "status": VersionStatus.PUBLISHED,
            "chunking_method": ChunkingMethod.FIXED_SIZE,
            "embedding_provider": EmbeddingProvider.OPENAI,
            "embedding_model": EmbeddingModel.TEXT_EMBEDDING_ADA_002,
            "chunk_size": 1000,
            "chunk_overlap": 200,
            "document_versions": [list(_document_versions.keys())[2]],
            "total_chunks": 32,
            "total_embeddings": 32,
            "created_by": list(_users.keys())[0]
        }
    ]
    
    for kb_ver_data in kb_versions_data:
        kb_ver = KnowledgeBaseVersion(**kb_ver_data)
        _kb_versions[kb_ver.id] = kb_ver


# Initialize mock data when module is imported
_initialize_mock_data()


# Data access functions
def get_all_users() -> List[User]:
    """Get all users"""
    return list(_users.values())


def get_user_by_id(user_id: str) -> Optional[User]:
    """Get a user by ID"""
    return _users.get(user_id)


def get_all_projects() -> List[Project]:
    """Get all projects"""
    return list(_projects.values())


def get_project_by_id(project_id: str) -> Optional[Project]:
    """Get a project by ID"""
    return _projects.get(project_id)


def get_knowledge_bases_by_project(project_id: str) -> List[KnowledgeBase]:
    """Get all knowledge bases for a specific project"""
    return [kb for kb in _knowledge_bases.values() if kb.project_id == project_id]


def get_knowledge_base_by_id(kb_id: str) -> Optional[KnowledgeBase]:
    """Get a knowledge base by ID"""
    return _knowledge_bases.get(kb_id)


def get_versions_by_knowledge_base(kb_id: str) -> List[KnowledgeBaseVersion]:
    """Get all versions for a specific knowledge base"""
    return [v for v in _kb_versions.values() if v.knowledge_base_id == kb_id]


def get_version_by_id(version_id: str) -> Optional[KnowledgeBaseVersion]:
    """Get a version by ID"""
    return _kb_versions.get(version_id)


def get_documents_by_project(project_id: str) -> List[Document]:
    """Get all documents for a specific project"""
    # For now, return all documents. In a real app, you'd filter by project
    return list(_documents.values())


def get_documents_by_kb(kb_id: str) -> List[Document]:
    """Get all documents for a specific knowledge base"""
    return [doc for doc in _documents.values() if doc.knowledge_base_id == kb_id]


def get_document_by_id(doc_id: str) -> Optional[Document]:
    """Get a document by ID"""
    return _documents.get(doc_id)


def get_document_versions_by_document(doc_id: str) -> List[DocumentVersion]:
    """Get all versions for a specific document"""
    return [v for v in _document_versions.values() if v.document_id == doc_id]


def get_document_version_by_id(version_id: str) -> Optional[DocumentVersion]:
    """Get a document version by ID"""
    return _document_versions.get(version_id)


# Mock processing functions
async def process_document(document_id: str, processing_config: dict) -> DocumentVersion:
    """Mock document processing pipeline"""
    doc = _documents.get(document_id)
    if not doc:
        raise ValueError("Document not found")
    
    # Create document version
    doc_version = DocumentVersion(
        document_id=document_id,
        version_number=f"v{len(get_document_versions_by_document(document_id)) + 1}.0.0",
        chunking_method=processing_config.get("chunking_method"),
        embedding_provider=processing_config.get("embedding_provider"),
        embedding_model=processing_config.get("embedding_model"),
        chunk_size=processing_config.get("chunk_size", 1000),
        chunk_overlap=processing_config.get("chunk_overlap", 200)
    )
    
    _document_versions[doc_version.id] = doc_version
    
    # Simulate processing pipeline
    stages = [ProcessingStage.DOWNLOAD, ProcessingStage.EXTRACT, ProcessingStage.CLEAN, ProcessingStage.CHUNK, ProcessingStage.EMBED]
    
    for i, stage in enumerate(stages):
        # Update document and version status
        doc.status = DocumentStatus.PROCESSING
        doc.processing_stage = stage
        doc.processing_progress = (i + 1) / len(stages)
        doc.updated_at = datetime.now()
        
        doc_version.status = DocumentStatus.PROCESSING
        doc_version.processing_stage = stage
        doc_version.processing_progress = (i + 1) / len(stages)
        doc_version.updated_at = datetime.now()
        
        # Simulate processing time (1-3 seconds)
        await asyncio.sleep(random.uniform(1, 3))
        
        # Randomly fail some documents (10% chance)
        if random.random() < 0.1:
            error_messages = [
                "Failed to download file: Network timeout",
                "Failed to extract text: Unsupported file format",
                "Failed to clean text: Invalid encoding",
                "Failed to chunk text: Empty content",
                "Failed to generate embeddings: API rate limit exceeded"
            ]
            
            doc.status = DocumentStatus.FAILED
            doc.error_message = error_messages[i]
            doc.updated_at = datetime.now()
            
            doc_version.status = DocumentStatus.FAILED
            doc_version.error_message = error_messages[i]
            doc_version.updated_at = datetime.now()
            
            return doc_version
    
    # Processing completed successfully
    doc.status = DocumentStatus.COMPLETED
    doc.processing_stage = ProcessingStage.EMBED
    doc.processing_progress = 1.0
    doc.chunk_count = random.randint(20, 100)
    doc.embedding_count = doc.chunk_count
    doc.updated_at = datetime.now()
    
    doc_version.status = DocumentStatus.COMPLETED
    doc_version.processing_stage = ProcessingStage.EMBED
    doc_version.processing_progress = 1.0
    doc_version.chunk_count = doc.chunk_count
    doc_version.embedding_count = doc.embedding_count
    doc_version.updated_at = datetime.now()
    
    return doc_version


def create_knowledge_base(project_id: str, name: str, description: str, access_level: AccessLevel, created_by: str) -> KnowledgeBase:
    """Create a new knowledge base"""
    kb = KnowledgeBase(
        name=name,
        description=description,
        project_id=project_id,
        access_level=access_level,
        created_by=created_by
    )
    _knowledge_bases[kb.id] = kb
    return kb


def create_knowledge_base_version(kb_id: str, version_data: dict, created_by: str) -> KnowledgeBaseVersion:
    """Create a new knowledge base version"""
    kb_version = KnowledgeBaseVersion(
        knowledge_base_id=kb_id,
        created_by=created_by,
        **version_data
    )
    _kb_versions[kb_version.id] = kb_version
    return kb_version


def create_document(knowledge_base_id: str, name: str, description: str, file_path: str, file_size: int, mime_type: str, created_by: str) -> Document:
    """Create a new document"""
    doc = Document(
        name=name,
        description=description,
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
        knowledge_base_id=knowledge_base_id,
        created_by=created_by
    )
    _documents[doc.id] = doc
    return doc


def deprecate_knowledge_base_version(version_id: str) -> bool:
    """Deprecate a knowledge base version"""
    version = _kb_versions.get(version_id)
    if version:
        version.status = VersionStatus.DEPRECATED
        version.updated_at = datetime.now()
        return True
    return False


def deprecate_document_version(version_id: str) -> bool:
    """Deprecate a document version"""
    version = _document_versions.get(version_id)
    if version:
        version.status = DocumentStatus.DEPRECATED
        version.updated_at = datetime.now()
        return True
    return False


def set_primary_knowledge_base(kb_id: str) -> bool:
    """Set a knowledge base as primary for its project"""
    kb = _knowledge_bases.get(kb_id)
    if not kb:
        return False
    
    # Remove primary status from other KBs in the same project
    for other_kb in _knowledge_bases.values():
        if other_kb.project_id == kb.project_id:
            other_kb.is_primary = False
            other_kb.updated_at = datetime.now()
    
    # Set this KB as primary
    kb.is_primary = True
    kb.updated_at = datetime.now()
    return True 