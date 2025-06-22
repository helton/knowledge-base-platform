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
    DRAFT = "draft"
    DEPRECATED = "deprecated"


class VersionStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    DEPRECATED = "deprecated"


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DEPRECATED = "deprecated"


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


class DocumentVersion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    version_number: str
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
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class KnowledgeBase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    project_id: str
    status: KnowledgeBaseStatus = KnowledgeBaseStatus.DRAFT
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
    status: VersionStatus = VersionStatus.DRAFT
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