import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid

from .models import (
    Project, KnowledgeBase, KnowledgeBaseVersion, Document, DocumentVersion,
    User, ProjectUser, UserRole, VersionStatus, CreateProjectRequest, DocumentStatus
)

class Storage:
    def __init__(self, data_dir: str = "backend/data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        self._users: Dict[str, User] = {}
        self._projects: Dict[str, Project] = {}
        self._knowledge_bases: Dict[str, KnowledgeBase] = {}
        self._kb_versions: Dict[str, KnowledgeBaseVersion] = {}
        self._documents: Dict[str, Document] = {}
        self._document_versions: Dict[str, DocumentVersion] = {}
        
        self.users_file = self.data_dir / "users.json"
        self.projects_file = self.data_dir / "projects.json"
        self.knowledge_bases_file = self.data_dir / "knowledge_bases.json"
        self.kb_versions_file = self.data_dir / "kb_versions.json"
        self.documents_file = self.data_dir / "documents.json"
        self.document_versions_file = self.data_dir / "document_versions.json"
        
        self._load_data()

    def _load_data(self):
        if not self.users_file.exists():
            self._initialize_default_data()
        else:
            self._load_from_files()

    def _initialize_default_data(self):
        admin_user = User(id=str(uuid.uuid4()), username="admin", email="admin@example.com", full_name="Administrator")
        self._users[admin_user.id] = admin_user
        
        default_project = Project(
            id=str(uuid.uuid4()),
            name="Default Project",
            description="A default project",
            created_by=admin_user.id,
            users={admin_user.id: ProjectUser(user_id=admin_user.id, role=UserRole.ADMIN)}
        )
        self._projects[default_project.id] = default_project
        self._save_all()

    def _load_from_files(self):
        self._users = self._load_generic(self.users_file, User)
        self._projects = self._load_generic(self.projects_file, Project)
        self._knowledge_bases = self._load_generic(self.knowledge_bases_file, KnowledgeBase)
        self._kb_versions = self._load_generic(self.kb_versions_file, KnowledgeBaseVersion)
        self._documents = self._load_generic(self.documents_file, Document)
        self._document_versions = self._load_generic(self.document_versions_file, DocumentVersion)

    def _load_generic(self, file_path: Path, model: Any) -> Dict[str, Any]:
        if not file_path.exists():
            return {}
        with open(file_path, 'r') as f:
            data = json.load(f)
        return {item['id']: model(**item) for item in data}

    def _save_all(self):
        self._save_generic(self.users_file, self._users)
        self._save_generic(self.projects_file, self._projects)
        self._save_generic(self.knowledge_bases_file, self._knowledge_bases)
        self._save_generic(self.kb_versions_file, self._kb_versions)
        self._save_generic(self.documents_file, self._documents)
        self._save_generic(self.document_versions_file, self._document_versions)

    def _save_generic(self, file_path: Path, data: Dict[str, Any]):
        with open(file_path, 'w') as f:
            json.dump([item.dict() for item in data.values()], f, indent=2, default=str)

    # User methods
    def get_all_users(self) -> List[User]:
        return list(self._users.values())

    # Project methods
    def get_all_projects(self) -> List[Project]:
        return list(self._projects.values())

    def get_project_by_id(self, project_id: str) -> Optional[Project]:
        return self._projects.get(project_id)
    
    def add_project(self, project: Project):
        self._projects[project.id] = project
        self._save_all()

    def create_project(self, project_data: CreateProjectRequest, created_by: str) -> Project:
        project = Project(
            id=str(uuid.uuid4()),
            name=project_data.name,
            description=project_data.description,
            created_by=created_by
        )
        self._projects[project.id] = project
        self._save_all()
        return project

    # KnowledgeBase methods
    def get_knowledge_bases_by_project(self, project_id: str) -> List[KnowledgeBase]:
        return [kb for kb in self._knowledge_bases.values() if kb.project_id == project_id]

    def get_knowledge_base_by_id(self, kb_id: str) -> Optional[KnowledgeBase]:
        return self._knowledge_bases.get(kb_id)

    def add_knowledge_base(self, kb: KnowledgeBase):
        self._knowledge_bases[kb.id] = kb
        self._save_all()

    def create_kb(self, project_id: str, name: str, description: str, created_by: str) -> KnowledgeBase:
        kb = KnowledgeBase(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            project_id=project_id,
            created_by=created_by
        )
        self._knowledge_bases[kb.id] = kb
        self._save_all()
        return kb

    def update_knowledge_base(self, kb: KnowledgeBase):
        self._knowledge_bases[kb.id] = kb
        self._save_all()

    # KnowledgeBaseVersion methods
    def get_versions_by_kb(self, kb_id: str) -> List[KnowledgeBaseVersion]:
        return [v for v in self._kb_versions.values() if v.knowledge_base_id == kb_id]

    def get_version_by_id(self, version_id: str) -> Optional[KnowledgeBaseVersion]:
        return self._kb_versions.get(version_id)

    def add_kb_version(self, version: KnowledgeBaseVersion):
        self._kb_versions[version.id] = version
        self._save_all()

    def update_kb_version(self, version: KnowledgeBaseVersion):
        self._kb_versions[version.id] = version
        self._save_all()

    def create_kb_version(
        self,
        kb_id: str,
        user_id: str,
        version_bump: str,
        version_name: Optional[str] = None,
        release_notes: Optional[str] = None,
        document_version_ids: List[str] = None,
        access_level: str = "private"
    ) -> KnowledgeBaseVersion:
        # Get the latest version to determine the new version number
        existing_versions = self.get_versions_by_kb(kb_id)
        
        if not existing_versions:
            # First version
            new_version_number = "1.0.0"
        else:
            # Find the latest version and bump accordingly
            latest_version = max(existing_versions, key=lambda v: [int(x) for x in v.version_number.split('.')])
            major, minor, patch = map(int, latest_version.version_number.split('.'))
            
            if version_bump == "major":
                major += 1
                minor = 0
                patch = 0
            elif version_bump == "minor":
                minor += 1
                patch = 0
            else:  # patch
                patch += 1
                
            new_version_number = f"{major}.{minor}.{patch}"
        
        new_version_data = {
            "id": str(uuid.uuid4()),
            "knowledge_base_id": kb_id,
            "version_number": new_version_number,
            "version_name": version_name,
            "release_notes": release_notes,
            "status": "draft",
            "access_level": access_level,
            "is_primary": False,
            "created_by": user_id,
            "created_at": datetime.now().isoformat(),
            "document_version_ids": document_version_ids or [],
        }
        
        new_version = KnowledgeBaseVersion(**new_version_data)
        self._kb_versions[new_version.id] = new_version
        self._save_all()
        return new_version

    def publish_kb_version(self, kb_id: str, version_id: str, user_id: str) -> KnowledgeBaseVersion:
        version = self.get_version_by_id(version_id)
        if not version or version.knowledge_base_id != kb_id:
            raise ValueError("Version not found")
        
        if version.status != VersionStatus.DRAFT:
            raise ValueError("Only draft versions can be published")
            
        version.status = VersionStatus.PUBLISHED
        version.published_at = datetime.now()
        version.published_by = user_id
        version.updated_at = datetime.now()

        self._save_all()
        return version

    def archive_kb_version(self, kb_id: str, version_id: str, user_id: str) -> KnowledgeBaseVersion:
        version = self.get_version_by_id(version_id)
        if not version or version.knowledge_base_id != kb_id:
            raise ValueError("Version not found")

        if version.status != VersionStatus.PUBLISHED:
            raise ValueError("Only published versions can be archived")

        if version.is_primary:
            raise ValueError("Cannot archive a primary version")

        version.status = VersionStatus.ARCHIVED
        version.archived_at = datetime.now()
        version.archived_by = user_id
        version.updated_at = datetime.now()
        
        self._save_all()
        return version

    def set_primary_kb_version(self, kb_id: str, version_id: str, user_id: str) -> KnowledgeBaseVersion:
        target_version = self.get_version_by_id(version_id)
        
        if not target_version or target_version.knowledge_base_id != kb_id:
            raise ValueError("Version not found for this Knowledge Base")

        if target_version.status != VersionStatus.PUBLISHED:
            raise ValueError("Only published versions can be set as primary")

        # Find current primary for this KB and unset it
        for version in self._kb_versions.values():
            if version.knowledge_base_id == kb_id and version.is_primary:
                version.is_primary = False
                version.updated_at = datetime.now()

        # Set the new primary
        target_version.is_primary = True
        target_version.updated_at = datetime.now()
        
        self._save_all()
        return target_version

    # Document methods
    def get_documents_for_kb_version(self, version_id: str) -> List[Document]:
        version = self.get_version_by_id(version_id)
        if not version:
            return []
        
        docs = []
        for doc_version_id in version.document_version_ids:
            doc_version = self.get_document_version_by_id(doc_version_id)
            if doc_version:
                doc = self.get_document_by_id(doc_version.document_id)
                if doc:
                    docs.append(doc)
        return docs

    def get_documents_by_kb(self, kb_id: str) -> List[Document]:
        return [doc for doc in self._documents.values() if doc.knowledge_base_id == kb_id]
        
    def get_documents_by_project(self, project_id: str) -> List[Document]:
        kbs = self.get_knowledge_bases_by_project(project_id)
        kb_ids = [kb.id for kb in kbs]
        return [doc for doc in self._documents.values() if doc.knowledge_base_id in kb_ids]

    def get_document_by_id(self, doc_id: str) -> Optional[Document]:
        return self._documents.get(doc_id)

    def add_document(self, doc: Document):
        self._documents[doc.id] = doc
        self._save_all()

    def update_document(self, doc: Document):
        self._documents[doc.id] = doc
        self._save_all()

    def create_document(self, kb_id: str, name: str, description: str, created_by: str) -> Document:
        doc = Document(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            kb_id=kb_id,
            created_by=created_by,
            status=DocumentStatus.DRAFT,
        )
        self._documents[doc.id] = doc
        self._save_all()
        return doc

    def get_document_versions_by_document(self, doc_id: str) -> List[DocumentVersion]:
        return [v for v in self._document_versions.values() if v.document_id == doc_id]

    def get_document_version_by_id(self, version_id: str) -> Optional[DocumentVersion]:
        return self._document_versions.get(version_id)

    def add_document_version(self, version: DocumentVersion):
        self._document_versions[version.id] = version
        self._save_all()

    def update_document_version(self, version: DocumentVersion):
        self._document_versions[version.id] = version
        self._save_all()
    
    def get_document(self, doc_id: str) -> Optional[Document]:
        return self._documents.get(doc_id)

    def create_document_version(self, doc_id: str, version_name: str = None, change_description: str = None, created_by: str = None) -> DocumentVersion:
        # Get the latest version number
        existing_versions = self.get_document_versions_by_document(doc_id)
        if not existing_versions:
            new_version_number = "1.0"
        else:
            latest_version = max(existing_versions, key=lambda v: float(v.version_number))
            new_version_number = str(float(latest_version.version_number) + 0.1)

        version = DocumentVersion(
            id=str(uuid.uuid4()),
            document_id=doc_id,
            version_number=new_version_number,
            version_name=version_name,
            change_description=change_description,
            created_by=created_by,
        )
        self._document_versions[version.id] = version
        self._save_all()
        return version

# Create a global storage instance
storage = Storage()

def get_storage() -> Storage:
    return storage 