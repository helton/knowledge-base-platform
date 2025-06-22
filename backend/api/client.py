import requests
from typing import List, Optional, Dict, Any
from backend.models import (
    Project, KnowledgeBase, KnowledgeBaseVersion, Document, DocumentVersion,
    ProjectList, KnowledgeBaseList, DocumentList, DocumentVersionList, 
    KnowledgeBaseVersionList, ProcessingStatus, CreateKnowledgeBaseRequest,
    CreateVersionRequest, User, UserRole, AccessLevel, ChunkingMethod,
    EmbeddingProvider, EmbeddingModel
)


class APIClient:
    """Client for communicating with the RAG Knowledge Base API"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
    
    def _make_request(self, method: str, endpoint: str, **kwargs):
        """Make a request to the API"""
        url = f"{self.base_url}{endpoint}"
        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {e}")
            return None
    
    # User endpoints
    def get_users(self) -> Optional[List[User]]:
        """Get all users"""
        response = self._make_request("GET", "/users")
        if response:
            return [User(**user) for user in response.get("users", [])]
        return None
    
    # Project endpoints
    def get_projects(self) -> Optional[List[Project]]:
        """Get all projects"""
        response = self._make_request("GET", "/projects")
        if response:
            project_list = ProjectList(**response)
            return project_list.projects
        return None
    
    def get_project(self, project_id: str) -> Optional[Project]:
        """Get a specific project"""
        response = self._make_request("GET", f"/projects/{project_id}")
        if response:
            return Project(**response)
        return None
    
    # Knowledge Base endpoints
    def get_knowledge_bases(self, project_id: str) -> Optional[List[KnowledgeBase]]:
        """Get knowledge bases for a project"""
        response = self._make_request("GET", f"/projects/{project_id}/knowledge-bases")
        if response:
            kb_list = KnowledgeBaseList(**response)
            return kb_list.knowledge_bases
        return None
    
    def get_knowledge_base(self, kb_id: str) -> Optional[KnowledgeBase]:
        """Get a specific knowledge base"""
        response = self._make_request("GET", f"/knowledge-bases/{kb_id}")
        if response:
            return KnowledgeBase(**response)
        return None
    
    def create_knowledge_base(self, project_id: str, name: str, description: str, access_level: AccessLevel) -> Optional[KnowledgeBase]:
        """Create a new knowledge base"""
        request_data = CreateKnowledgeBaseRequest(
            name=name,
            description=description,
            access_level=access_level
        )
        response = self._make_request("POST", f"/projects/{project_id}/knowledge-bases", json=request_data.dict())
        if response:
            return KnowledgeBase(**response)
        return None
    
    def set_primary_knowledge_base(self, kb_id: str) -> bool:
        """Set a knowledge base as primary"""
        response = self._make_request("PUT", f"/knowledge-bases/{kb_id}/primary")
        return response is not None
    
    # Knowledge Base Version endpoints
    def get_kb_versions(self, kb_id: str) -> Optional[List[KnowledgeBaseVersion]]:
        """Get versions for a knowledge base"""
        response = self._make_request("GET", f"/knowledge-bases/{kb_id}/versions")
        if response:
            version_list = KnowledgeBaseVersionList(**response)
            return version_list.versions
        return None
    
    def get_kb_version(self, kb_id: str, version_id: str) -> Optional[KnowledgeBaseVersion]:
        """Get a specific knowledge base version"""
        response = self._make_request("GET", f"/knowledge-bases/{kb_id}/versions/{version_id}")
        if response:
            return KnowledgeBaseVersion(**response)
        return None
    
    def create_kb_version(self, kb_id: str, version_data: dict) -> Optional[KnowledgeBaseVersion]:
        """Create a new knowledge base version"""
        request_data = CreateVersionRequest(**version_data)
        response = self._make_request("POST", f"/knowledge-bases/{kb_id}/versions", json=request_data.dict())
        if response:
            return KnowledgeBaseVersion(**response)
        return None
    
    def deprecate_kb_version(self, kb_id: str, version_id: str) -> bool:
        """Deprecate a knowledge base version"""
        response = self._make_request("PUT", f"/knowledge-bases/{kb_id}/versions/{version_id}/deprecate")
        return response is not None
    
    # Document endpoints
    def get_documents(self, project_id: str) -> Optional[List[Document]]:
        """Get documents for a project"""
        response = self._make_request("GET", f"/projects/{project_id}/documents")
        if response:
            doc_list = DocumentList(**response)
            return doc_list.documents
        return None
    
    def get_documents_by_kb(self, kb_id: str) -> Optional[List[Document]]:
        """Get documents for a knowledge base"""
        response = self._make_request("GET", f"/knowledge-bases/{kb_id}/documents")
        if response:
            doc_list = DocumentList(**response)
            return doc_list.documents
        return None
    
    def get_document(self, doc_id: str) -> Optional[Document]:
        """Get a specific document"""
        response = self._make_request("GET", f"/documents/{doc_id}")
        if response:
            return Document(**response)
        return None
    
    def upload_document(self, kb_id: str, file_path: str, name: str, description: Optional[str] = None, 
                       chunking_method: ChunkingMethod = ChunkingMethod.FIXED_SIZE,
                       embedding_provider: EmbeddingProvider = EmbeddingProvider.OPENAI,
                       embedding_model: EmbeddingModel = EmbeddingModel.TEXT_EMBEDDING_ADA_002,
                       chunk_size: int = 1000, chunk_overlap: int = 200) -> Optional[Dict[str, Any]]:
        """Upload a document for processing to a knowledge base"""
        try:
            with open(file_path, 'rb') as f:
                files = {'file': f}
                data = {
                    'name': name,
                    'description': description if description else '',
                    'chunking_method': chunking_method.value,
                    'embedding_provider': embedding_provider.value,
                    'embedding_model': embedding_model.value,
                    'chunk_size': chunk_size,
                    'chunk_overlap': chunk_overlap
                }
                response = self._make_request("POST", f"/knowledge-bases/{kb_id}/documents/upload", 
                                            files=files, data=data)
                return response
        except Exception as e:
            print(f"Upload failed: {e}")
            return None
    
    def get_document_versions(self, doc_id: str) -> Optional[List[DocumentVersion]]:
        """Get versions for a document"""
        response = self._make_request("GET", f"/documents/{doc_id}/versions")
        if response:
            version_list = DocumentVersionList(**response)
            return version_list.document_versions
        return None
    
    def get_document_version(self, doc_id: str, version_id: str) -> Optional[DocumentVersion]:
        """Get a specific document version"""
        response = self._make_request("GET", f"/documents/{doc_id}/versions/{version_id}")
        if response:
            return DocumentVersion(**response)
        return None
    
    def deprecate_document_version(self, doc_id: str, version_id: str) -> bool:
        """Deprecate a document version"""
        response = self._make_request("PUT", f"/documents/{doc_id}/versions/{version_id}/deprecate")
        return response is not None
    
    def get_document_status(self, doc_id: str) -> Optional[ProcessingStatus]:
        """Get document processing status"""
        response = self._make_request("GET", f"/documents/{doc_id}/status")
        if response:
            return ProcessingStatus(**response)
        return None
    
    def health_check(self) -> bool:
        """Check if the API is healthy"""
        response = self._make_request("GET", "/health")
        return response is not None


# Global API client instance
api_client = APIClient() 