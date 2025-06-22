import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import uuid

from .models import (
    Project, KnowledgeBase, KnowledgeBaseVersion, Document, DocumentVersion,
    User, ProjectUser, UserRole, DocumentStatus
)


class Storage:
    """Storage class that handles both memory and JSON file persistence"""
    
    def __init__(self, data_dir: str = "backend/data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # Memory storage
        self._users: Dict[str, User] = {}
        self._projects: Dict[str, Project] = {}
        self._knowledge_bases: Dict[str, KnowledgeBase] = {}
        self._kb_versions: Dict[str, KnowledgeBaseVersion] = {}
        self._documents: Dict[str, Document] = {}
        self._document_versions: Dict[str, DocumentVersion] = {}
        
        # File paths
        self.users_file = self.data_dir / "users.json"
        self.projects_file = self.data_dir / "projects.json"
        self.knowledge_bases_file = self.data_dir / "knowledge_bases.json"
        self.kb_versions_file = self.data_dir / "kb_versions.json"
        self.documents_file = self.data_dir / "documents.json"
        self.document_versions_file = self.data_dir / "document_versions.json"
        
        # Load data from files or initialize with default data
        self._load_data()
    
    def _load_data(self):
        """Load data from JSON files or initialize with default data"""
        if self._should_initialize_data():
            self._initialize_default_data()
        else:
            self._load_from_files()
    
    def _should_initialize_data(self) -> bool:
        """Check if we should initialize with default data"""
        return not all([
            self.users_file.exists(),
            self.projects_file.exists(),
            self.knowledge_bases_file.exists(),
            self.kb_versions_file.exists(),
            self.documents_file.exists(),
            self.document_versions_file.exists()
        ])
    
    def _initialize_default_data(self):
        """Initialize with default data"""
        # Create default users
        default_users = [
            {
                "id": str(uuid.uuid4()),
                "username": "admin",
                "email": "admin@example.com",
                "full_name": "Administrator",
                "role": UserRole.ADMIN,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
        ]
        
        for user_data in default_users:
            user = User(**user_data)
            self._users[user.id] = user
        
        # Create a default project
        admin_user_id = list(self._users.keys())[0]
        default_project = Project(
            id=str(uuid.uuid4()),
            name="Default Project",
            description="A default project to get you started",
            created_by=admin_user_id,
            access_token="default_token_123",
            users={
                admin_user_id: ProjectUser(user_id=admin_user_id, role=UserRole.ADMIN)
            },
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        self._projects[default_project.id] = default_project
        
        # Save to files
        self._save_all()
    
    def _load_from_files(self):
        """Load data from JSON files"""
        try:
            if self.users_file.exists():
                with open(self.users_file, 'r') as f:
                    users_data = json.load(f)
                    for user_data in users_data:
                        # Convert string dates back to datetime
                        if 'created_at' in user_data:
                            user_data['created_at'] = datetime.fromisoformat(user_data['created_at'].replace('Z', '+00:00'))
                        if 'updated_at' in user_data:
                            user_data['updated_at'] = datetime.fromisoformat(user_data['updated_at'].replace('Z', '+00:00'))
                        
                        user = User(**user_data)
                        self._users[user.id] = user
            
            if self.projects_file.exists():
                with open(self.projects_file, 'r') as f:
                    projects_data = json.load(f)
                    for project_data in projects_data:
                        # Convert string dates back to datetime
                        if 'created_at' in project_data:
                            project_data['created_at'] = datetime.fromisoformat(project_data['created_at'].replace('Z', '+00:00'))
                        if 'updated_at' in project_data:
                            project_data['updated_at'] = datetime.fromisoformat(project_data['updated_at'].replace('Z', '+00:00'))
                        
                        # Convert users dict back to proper format
                        if 'users' in project_data:
                            users_dict = {}
                            for user_id, user_data in project_data['users'].items():
                                if 'joined_at' in user_data:
                                    user_data['joined_at'] = datetime.fromisoformat(user_data['joined_at'].replace('Z', '+00:00'))
                                users_dict[user_id] = ProjectUser(**user_data)
                            project_data['users'] = users_dict
                        
                        project = Project(**project_data)
                        self._projects[project.id] = project
            
            if self.knowledge_bases_file.exists():
                with open(self.knowledge_bases_file, 'r') as f:
                    kb_data = json.load(f)
                    for kb_item in kb_data:
                        # Convert string dates back to datetime
                        if 'created_at' in kb_item:
                            kb_item['created_at'] = datetime.fromisoformat(kb_item['created_at'].replace('Z', '+00:00'))
                        if 'updated_at' in kb_item:
                            kb_item['updated_at'] = datetime.fromisoformat(kb_item['updated_at'].replace('Z', '+00:00'))
                        
                        kb = KnowledgeBase(**kb_item)
                        self._knowledge_bases[kb.id] = kb
            
            if self.kb_versions_file.exists():
                with open(self.kb_versions_file, 'r') as f:
                    versions_data = json.load(f)
                    for version_data in versions_data:
                        # Convert string dates back to datetime
                        if 'created_at' in version_data:
                            version_data['created_at'] = datetime.fromisoformat(version_data['created_at'].replace('Z', '+00:00'))
                        if 'updated_at' in version_data:
                            version_data['updated_at'] = datetime.fromisoformat(version_data['updated_at'].replace('Z', '+00:00'))
                        
                        version = KnowledgeBaseVersion(**version_data)
                        self._kb_versions[version.id] = version
            
            if self.documents_file.exists():
                with open(self.documents_file, 'r') as f:
                    docs_data = json.load(f)
                    for doc_data in docs_data:
                        # Convert string dates back to datetime
                        if 'created_at' in doc_data:
                            doc_data['created_at'] = datetime.fromisoformat(doc_data['created_at'].replace('Z', '+00:00'))
                        if 'updated_at' in doc_data:
                            doc_data['updated_at'] = datetime.fromisoformat(doc_data['updated_at'].replace('Z', '+00:00'))
                        
                        doc = Document(**doc_data)
                        self._documents[doc.id] = doc
            
            if self.document_versions_file.exists():
                with open(self.document_versions_file, 'r') as f:
                    doc_versions_data = json.load(f)
                    for version_data in doc_versions_data:
                        # Convert string dates back to datetime
                        if 'created_at' in version_data:
                            version_data['created_at'] = datetime.fromisoformat(version_data['created_at'].replace('Z', '+00:00'))
                        if 'updated_at' in version_data:
                            version_data['updated_at'] = datetime.fromisoformat(version_data['updated_at'].replace('Z', '+00:00'))
                        
                        version = DocumentVersion(**version_data)
                        self._document_versions[version.id] = version
                        
        except Exception as e:
            print(f"Error loading data from files: {e}")
            # If loading fails, initialize with default data
            self._initialize_default_data()
    
    def _save_all(self):
        """Save all data to JSON files"""
        try:
            # Save users
            users_data = [user.dict() for user in self._users.values()]
            with open(self.users_file, 'w') as f:
                json.dump(users_data, f, indent=2, default=str)
            
            # Save projects
            projects_data = []
            for project in self._projects.values():
                project_dict = project.dict()
                # Convert users dict to serializable format
                users_dict = {}
                for user_id, user_data in project.users.items():
                    users_dict[user_id] = user_data.dict()
                project_dict['users'] = users_dict
                projects_data.append(project_dict)
            
            with open(self.projects_file, 'w') as f:
                json.dump(projects_data, f, indent=2, default=str)
            
            # Save knowledge bases
            kb_data = [kb.dict() for kb in self._knowledge_bases.values()]
            with open(self.knowledge_bases_file, 'w') as f:
                json.dump(kb_data, f, indent=2, default=str)
            
            # Save KB versions
            kb_versions_data = [version.dict() for version in self._kb_versions.values()]
            with open(self.kb_versions_file, 'w') as f:
                json.dump(kb_versions_data, f, indent=2, default=str)
            
            # Save documents
            docs_data = [doc.dict() for doc in self._documents.values()]
            with open(self.documents_file, 'w') as f:
                json.dump(docs_data, f, indent=2, default=str)
            
            # Save document versions
            doc_versions_data = [version.dict() for version in self._document_versions.values()]
            with open(self.document_versions_file, 'w') as f:
                json.dump(doc_versions_data, f, indent=2, default=str)
                
        except Exception as e:
            print(f"Error saving data to files: {e}")
    
    # User methods
    def get_all_users(self) -> List[User]:
        return list(self._users.values())
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        return self._users.get(user_id)
    
    def create_user(self, user_data: dict) -> User:
        user = User(**user_data)
        self._users[user.id] = user
        self._save_all()
        return user
    
    # Project methods
    def get_all_projects(self) -> List[Project]:
        return list(self._projects.values())
    
    def get_project_by_id(self, project_id: str) -> Optional[Project]:
        return self._projects.get(project_id)
    
    def create_project(self, project_data: dict) -> Project:
        project = Project(**project_data)
        self._projects[project.id] = project
        self._save_all()
        return project
    
    def update_project(self, project_id: str, project_data: dict) -> Optional[Project]:
        if project_id in self._projects:
            # Update existing project
            current_project = self._projects[project_id]
            updated_data = current_project.dict()
            updated_data.update(project_data)
            updated_data['updated_at'] = datetime.now().isoformat()
            
            project = Project(**updated_data)
            self._projects[project_id] = project
            self._save_all()
            return project
        return None
    
    def delete_project(self, project_id: str) -> bool:
        if project_id in self._projects:
            del self._projects[project_id]
            # Also delete related knowledge bases, documents, etc.
            self._delete_project_data(project_id)
            self._save_all()
            return True
        return False
    
    def _delete_project_data(self, project_id: str):
        """Delete all data related to a project"""
        # Delete knowledge bases
        kb_ids_to_delete = [
            kb_id for kb_id, kb in self._knowledge_bases.items()
            if kb.project_id == project_id
        ]
        for kb_id in kb_ids_to_delete:
            del self._knowledge_bases[kb_id]
        
        # Delete documents
        doc_ids_to_delete = [
            doc_id for doc_id, doc in self._documents.items()
            if doc.knowledge_base_id in kb_ids_to_delete
        ]
        for doc_id in doc_ids_to_delete:
            del self._documents[doc_id]
    
    # Knowledge Base methods
    def get_knowledge_bases_by_project(self, project_id: str) -> List[KnowledgeBase]:
        return [
            kb for kb in self._knowledge_bases.values()
            if kb.project_id == project_id
        ]
    
    def get_knowledge_base_by_id(self, kb_id: str) -> Optional[KnowledgeBase]:
        return self._knowledge_bases.get(kb_id)
    
    def create_knowledge_base(self, kb_data: dict) -> KnowledgeBase:
        kb = KnowledgeBase(**kb_data)
        self._knowledge_bases[kb.id] = kb
        self._save_all()
        return kb
    
    # Document methods
    def get_documents_by_kb(self, kb_id: str) -> List[Document]:
        return [
            doc for doc in self._documents.values()
            if doc.knowledge_base_id == kb_id
        ]
    
    def get_document_by_id(self, doc_id: str) -> Optional[Document]:
        return self._documents.get(doc_id)
    
    def create_document(self, doc_data: dict) -> Document:
        doc = Document(**doc_data)
        self._documents[doc.id] = doc
        self._save_all()
        return doc
    
    # Version methods
    def get_versions_by_knowledge_base(self, kb_id: str) -> List[KnowledgeBaseVersion]:
        return [
            version for version in self._kb_versions.values()
            if version.knowledge_base_id == kb_id
        ]
    
    def get_version_by_id(self, version_id: str) -> Optional[KnowledgeBaseVersion]:
        return self._kb_versions.get(version_id)
    
    def create_kb_version(self, version_data: dict) -> KnowledgeBaseVersion:
        version = KnowledgeBaseVersion(**version_data)
        self._kb_versions[version.id] = version
        self._save_all()
        return version
    
    def get_document_versions_by_document(self, doc_id: str) -> List[DocumentVersion]:
        return [
            version for version in self._document_versions.values()
            if version.document_id == doc_id
        ]
    
    def get_document_version_by_id(self, version_id: str) -> Optional[DocumentVersion]:
        return self._document_versions.get(version_id)
    
    def get_latest_document_version(self, doc_id: str) -> Optional[DocumentVersion]:
        """Get the latest (highest version number) document version"""
        versions = self.get_document_versions_by_document(doc_id)
        if not versions:
            return None
        
        # Sort by version number (v1, v2, v3, etc.)
        sorted_versions = sorted(versions, key=lambda v: int(v.version_number[1:]) if v.version_number.startswith('v') else 0)
        return sorted_versions[-1]
    
    def get_next_version_number(self, doc_id: str) -> str:
        """Generate the next version number for a document (v1, v2, v3, etc.)"""
        versions = self.get_document_versions_by_document(doc_id)
        if not versions:
            return "v1"
        
        # Find the highest version number
        max_version = 0
        for version in versions:
            if version.version_number.startswith('v'):
                try:
                    version_num = int(version.version_number[1:])
                    max_version = max(max_version, version_num)
                except ValueError:
                    continue
        
        return f"v{max_version + 1}"
    
    def create_document_version(self, version_data: dict) -> DocumentVersion:
        version = DocumentVersion(**version_data)
        self._document_versions[version.id] = version
        self._save_all()
        return version
    
    def deprecate_document_version(self, version_id: str, reason: str, deprecated_by: str) -> bool:
        """Deprecate a document version with a reason"""
        version = self.get_document_version_by_id(version_id)
        if not version:
            return False
        
        version.is_deprecated = True
        version.deprecation_reason = reason
        version.deprecated_at = datetime.now()
        version.deprecated_by = deprecated_by
        version.status = DocumentStatus.DEPRECATED
        version.updated_at = datetime.now()
        
        self._save_all()
        return True
    
    def get_active_document_versions(self, doc_id: str) -> List[DocumentVersion]:
        """Get all non-deprecated document versions"""
        return [
            version for version in self.get_document_versions_by_document(doc_id)
            if not version.is_deprecated
        ]


# Global storage instance
storage = Storage() 