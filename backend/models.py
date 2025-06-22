from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum


class ProjectStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class KnowledgeBaseStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"


class VersionStatus(str, Enum):
    PUBLISHED = "published"
    DRAFT = "draft"
    ARCHIVED = "archived"


class Project(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime


class KnowledgeBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    project_id: str
    status: KnowledgeBaseStatus
    current_version: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class Version(BaseModel):
    id: str
    knowledge_base_id: str
    version_number: str
    description: Optional[str] = None
    status: VersionStatus
    document_count: int
    created_at: datetime
    updated_at: datetime


class ProjectList(BaseModel):
    projects: List[Project]


class KnowledgeBaseList(BaseModel):
    knowledge_bases: List[KnowledgeBase]


class VersionList(BaseModel):
    versions: List[Version] 