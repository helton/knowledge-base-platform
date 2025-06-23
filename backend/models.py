from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class ProjectStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class UserRole(str, Enum):
    ADMIN = "admin"
    WRITER = "writer"
    READER = "reader"


class KnowledgeBaseStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class VersionStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"


class ProcessingStage(str, Enum):
    DOWNLOAD = "download"
    EXTRACT = "extract"
    CLEAN = "clean"
    CHUNK = "chunk"
    EMBED = "embed"


class ChunkingMethod(str, Enum):
    FIXED_SIZE = "fixed_size"
    SEMANTIC = "semantic"
    SLIDING_WINDOW = "sliding_window"
    RECURSIVE = "recursive"


class EmbeddingProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    COHERE = "cohere"
    HUGGINGFACE = "huggingface"
    LOCAL = "local"


class EmbeddingModel(str, Enum):
    # OpenAI
    TEXT_EMBEDDING_ADA_002 = "text-embedding-ada-002"
    TEXT_EMBEDDING_3_SMALL = "text-embedding-3-small"
    TEXT_EMBEDDING_3_LARGE = "text-embedding-3-large"
    # Cohere
    EMBED_ENGLISH_V3 = "embed-english-v3"
    EMBED_MULTILINGUAL_V3 = "embed-multilingual-v3"
    # Local
    SENTENCE_TRANSFORMERS = "sentence-transformers"


class AccessLevel(str, Enum):
    PRIVATE = "private"
    PROTECTED = "protected"
    PUBLIC = "public"


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    full_name: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class ProjectUser(BaseModel):
    user_id: str
    role: UserRole
    joined_at: datetime = Field(default_factory=datetime.now)


class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.ACTIVE
    access_token: Optional[str] = None
    users: Dict[str, ProjectUser] = Field(default_factory=dict)
    created_by: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    file_path: str
    file_size: int
    mime_type: str
    knowledge_base_id: str
    status: DocumentStatus = DocumentStatus.PENDING
    processing_stage: Optional[ProcessingStage] = None
    processing_progress: float = 0.0  # 0.0 to 1.0
    error_message: Optional[str] = None
    chunk_count: int = 0
    embedding_count: int = 0
    created_by: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    version_count: Optional[int] = None
    latest_version_number: Optional[int] = None


class DocumentVersion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    version_number: str  # e.g., "v1", "v2", "v3"
    version_name: Optional[str] = None  # e.g., "Initial version", "Updated with new data"
    change_description: Optional[str] = None  # Description of changes in this version
    status: DocumentStatus = DocumentStatus.PENDING
    processing_stage: Optional[ProcessingStage] = None
    processing_progress: float = 0.0
    error_message: Optional[str] = None
    chunk_count: int = 0
    embedding_count: int = 0
    chunking_method: Optional[ChunkingMethod] = None
    embedding_provider: Optional[EmbeddingProvider] = None
    embedding_model: Optional[EmbeddingModel] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    file_path: Optional[str] = None  # Path to the versioned file
    file_size: Optional[int] = None  # Size of the versioned file
    mime_type: Optional[str] = None  # MIME type of the versioned file
    is_archived: bool = False
    archive_reason: Optional[str] = None  # Reason for archiving
    archived_at: Optional[datetime] = None
    archived_by: Optional[str] = None  # User ID who archived this version
    created_by: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class KnowledgeBase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    project_id: str
    status: KnowledgeBaseStatus = KnowledgeBaseStatus.ARCHIVED
    access_level: AccessLevel = AccessLevel.PRIVATE
    is_primary: bool = False
    current_version: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class KnowledgeBaseVersion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    knowledge_base_id: str
    version_number: str
    description: Optional[str] = None
    status: VersionStatus = VersionStatus.ARCHIVED
    chunking_method: ChunkingMethod
    embedding_provider: EmbeddingProvider
    embedding_model: EmbeddingModel
    chunk_size: int
    chunk_overlap: int
    document_versions: List[str] = Field(default_factory=list)  # Document version IDs
    total_chunks: int = 0
    total_embeddings: int = 0
    created_by: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


# Response models
class ProjectList(BaseModel):
    projects: List[Project]


class KnowledgeBaseList(BaseModel):
    knowledge_bases: List[KnowledgeBase]


class DocumentList(BaseModel):
    documents: List[Document]


class DocumentVersionList(BaseModel):
    document_versions: List[DocumentVersion]


class KnowledgeBaseVersionList(BaseModel):
    versions: List[KnowledgeBaseVersion]


class ProcessingStatus(BaseModel):
    document_id: str
    status: DocumentStatus
    stage: Optional[ProcessingStage] = None
    progress: float = 0.0
    error_message: Optional[str] = None


class CreateKnowledgeBaseRequest(BaseModel):
    name: str
    description: Optional[str] = None
    access_level: AccessLevel = AccessLevel.PRIVATE


class CreateVersionRequest(BaseModel):
    version_number: str
    description: Optional[str] = None
    chunking_method: ChunkingMethod
    embedding_provider: EmbeddingProvider
    embedding_model: EmbeddingModel
    chunk_size: int = 1000
    chunk_overlap: int = 200
    document_version_ids: List[str] = Field(default_factory=list)


class UploadDocumentRequest(BaseModel):
    name: str
    description: Optional[str] = None
    chunking_method: ChunkingMethod
    embedding_provider: EmbeddingProvider
    embedding_model: EmbeddingModel
    chunk_size: int = 1000
    chunk_overlap: int = 200


class CreateDocumentVersionRequest(BaseModel):
    version_name: Optional[str] = None  # e.g., "Updated with new data"
    change_description: Optional[str] = None  # Description of changes
    chunking_method: ChunkingMethod = ChunkingMethod.FIXED_SIZE
    embedding_provider: EmbeddingProvider = EmbeddingProvider.OPENAI
    embedding_model: EmbeddingModel = EmbeddingModel.TEXT_EMBEDDING_ADA_002
    chunk_size: int = 1000
    chunk_overlap: int = 200


class ArchiveVersionRequest(BaseModel):
    reason: str  # Required reason for archiving


class DocumentBase(BaseModel):
    name: str
    description: str | None = None


class DocumentOut(DocumentBase):
    id: str
    knowledge_base_id: str
    file_name: str
    mime_type: str
    file_size: int
    chunk_count: int
    status: DocumentStatus
    created_at: datetime
    updated_at: datetime
    error_message: str | None = None
    processing_progress: int | None = None
    version_count: int = 0
    latest_version_number: int | None = None
    
    class Config:
        from_attributes = True


class DocumentVersionBase(BaseModel):
    change_description: str | None = None
    

class DocumentVersionOut(DocumentVersionBase):
    id: str
    document_id: str
    version_number: str
    file_path: str | None = None
    file_size: int | None = None
    chunk_count: int
    status: DocumentStatus
    is_archived: bool
    archive_reason: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True 