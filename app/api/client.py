import requests
from typing import List, Optional
from backend.models import Project, KnowledgeBase, Version, ProjectList, KnowledgeBaseList, VersionList


class APIClient:
    """Client for communicating with the Knowledge Base API"""
    
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
    
    def get_versions(self, kb_id: str) -> Optional[List[Version]]:
        """Get versions for a knowledge base"""
        response = self._make_request("GET", f"/knowledge-bases/{kb_id}/versions")
        if response:
            version_list = VersionList(**response)
            return version_list.versions
        return None
    
    def get_version(self, kb_id: str, version_id: str) -> Optional[Version]:
        """Get a specific version"""
        response = self._make_request("GET", f"/knowledge-bases/{kb_id}/versions/{version_id}")
        if response:
            return Version(**response)
        return None
    
    def health_check(self) -> bool:
        """Check if the API is healthy"""
        response = self._make_request("GET", "/health")
        return response is not None


# Global API client instance
api_client = APIClient() 