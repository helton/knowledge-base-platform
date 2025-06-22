from datetime import datetime, timedelta
from typing import List, Dict, Optional
from .models import Project, KnowledgeBase, Version, ProjectStatus, KnowledgeBaseStatus, VersionStatus


# Mock data storage
_projects: Dict[str, Project] = {}
_knowledge_bases: Dict[str, KnowledgeBase] = {}
_versions: Dict[str, Version] = {}


def _initialize_mock_data():
    """Initialize mock data for the application"""
    global _projects, _knowledge_bases, _versions
    
    # Create mock projects
    projects_data = [
        {
            "id": "proj-001",
            "name": "E-commerce Platform",
            "description": "Knowledge base for our main e-commerce platform",
            "status": ProjectStatus.ACTIVE,
            "created_at": datetime.now() - timedelta(days=30),
            "updated_at": datetime.now() - timedelta(days=5)
        },
        {
            "id": "proj-002", 
            "name": "Customer Support",
            "description": "Internal knowledge base for customer support team",
            "status": ProjectStatus.ACTIVE,
            "created_at": datetime.now() - timedelta(days=45),
            "updated_at": datetime.now() - timedelta(days=2)
        },
        {
            "id": "proj-003",
            "name": "Marketing Campaigns",
            "description": "Knowledge base for marketing campaigns and strategies",
            "status": ProjectStatus.ACTIVE,
            "created_at": datetime.now() - timedelta(days=20),
            "updated_at": datetime.now() - timedelta(days=1)
        }
    ]
    
    for project_data in projects_data:
        project = Project(**project_data)
        _projects[project.id] = project
    
    # Create mock knowledge bases
    kb_data = [
        {
            "id": "kb-001",
            "name": "Product Documentation",
            "description": "Complete product documentation and user guides",
            "project_id": "proj-001",
            "status": KnowledgeBaseStatus.ACTIVE,
            "current_version": "v1.2.0",
            "created_at": datetime.now() - timedelta(days=25),
            "updated_at": datetime.now() - timedelta(days=3)
        },
        {
            "id": "kb-002",
            "name": "API Reference",
            "description": "API documentation and integration guides",
            "project_id": "proj-001",
            "status": KnowledgeBaseStatus.ACTIVE,
            "current_version": "v2.1.0",
            "created_at": datetime.now() - timedelta(days=20),
            "updated_at": datetime.now() - timedelta(days=1)
        },
        {
            "id": "kb-003",
            "name": "FAQ Database",
            "description": "Frequently asked questions and solutions",
            "project_id": "proj-002",
            "status": KnowledgeBaseStatus.ACTIVE,
            "current_version": "v1.0.5",
            "created_at": datetime.now() - timedelta(days=40),
            "updated_at": datetime.now() - timedelta(days=7)
        },
        {
            "id": "kb-004",
            "name": "Troubleshooting Guide",
            "description": "Common issues and troubleshooting steps",
            "project_id": "proj-002",
            "status": KnowledgeBaseStatus.ACTIVE,
            "current_version": "v1.1.2",
            "created_at": datetime.now() - timedelta(days=35),
            "updated_at": datetime.now() - timedelta(days=4)
        },
        {
            "id": "kb-005",
            "name": "Campaign Templates",
            "description": "Marketing campaign templates and best practices",
            "project_id": "proj-003",
            "status": KnowledgeBaseStatus.ACTIVE,
            "current_version": "v1.0.0",
            "created_at": datetime.now() - timedelta(days=15),
            "updated_at": datetime.now() - timedelta(days=2)
        }
    ]
    
    for kb_data_item in kb_data:
        kb = KnowledgeBase(**kb_data_item)
        _knowledge_bases[kb.id] = kb
    
    # Create mock versions
    versions_data = [
        # Product Documentation versions
        {
            "id": "ver-001",
            "knowledge_base_id": "kb-001",
            "version_number": "v1.0.0",
            "description": "Initial release",
            "status": VersionStatus.PUBLISHED,
            "document_count": 45,
            "created_at": datetime.now() - timedelta(days=25),
            "updated_at": datetime.now() - timedelta(days=25)
        },
        {
            "id": "ver-002",
            "knowledge_base_id": "kb-001",
            "version_number": "v1.1.0",
            "description": "Added new features section",
            "status": VersionStatus.PUBLISHED,
            "document_count": 52,
            "created_at": datetime.now() - timedelta(days=15),
            "updated_at": datetime.now() - timedelta(days=15)
        },
        {
            "id": "ver-003",
            "knowledge_base_id": "kb-001",
            "version_number": "v1.2.0",
            "description": "Updated installation guide",
            "status": VersionStatus.PUBLISHED,
            "document_count": 58,
            "created_at": datetime.now() - timedelta(days=3),
            "updated_at": datetime.now() - timedelta(days=3)
        },
        # API Reference versions
        {
            "id": "ver-004",
            "knowledge_base_id": "kb-002",
            "version_number": "v2.0.0",
            "description": "Major API overhaul",
            "status": VersionStatus.PUBLISHED,
            "document_count": 120,
            "created_at": datetime.now() - timedelta(days=20),
            "updated_at": datetime.now() - timedelta(days=20)
        },
        {
            "id": "ver-005",
            "knowledge_base_id": "kb-002",
            "version_number": "v2.1.0",
            "description": "Added authentication endpoints",
            "status": VersionStatus.PUBLISHED,
            "document_count": 135,
            "created_at": datetime.now() - timedelta(days=1),
            "updated_at": datetime.now() - timedelta(days=1)
        },
        # FAQ Database versions
        {
            "id": "ver-006",
            "knowledge_base_id": "kb-003",
            "version_number": "v1.0.0",
            "description": "Initial FAQ collection",
            "status": VersionStatus.PUBLISHED,
            "document_count": 89,
            "created_at": datetime.now() - timedelta(days=40),
            "updated_at": datetime.now() - timedelta(days=40)
        },
        {
            "id": "ver-007",
            "knowledge_base_id": "kb-003",
            "version_number": "v1.0.5",
            "description": "Added customer service FAQs",
            "status": VersionStatus.PUBLISHED,
            "document_count": 95,
            "created_at": datetime.now() - timedelta(days=7),
            "updated_at": datetime.now() - timedelta(days=7)
        }
    ]
    
    for version_data in versions_data:
        version = Version(**version_data)
        _versions[version.id] = version


# Initialize mock data when module is imported
_initialize_mock_data()


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


def get_versions_by_knowledge_base(kb_id: str) -> List[Version]:
    """Get all versions for a specific knowledge base"""
    return [v for v in _versions.values() if v.knowledge_base_id == kb_id]


def get_version_by_id(version_id: str) -> Optional[Version]:
    """Get a version by ID"""
    return _versions.get(version_id) 