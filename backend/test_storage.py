#!/usr/bin/env python3
"""
Test script for the storage system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from storage import storage
from models import User, Project, UserRole, ProjectUser
from datetime import datetime

def test_storage():
    print("Testing storage system...")
    
    # Test 1: Check if default data was created
    users = storage.get_all_users()
    print(f"Found {len(users)} users")
    for user in users:
        print(f"  - {user.username} ({user.email})")
    
    projects = storage.get_all_projects()
    print(f"Found {len(projects)} projects")
    for project in projects:
        print(f"  - {project.name}: {project.description}")
    
    # Test 2: Create a new project
    print("\nCreating a new test project...")
    admin_user = users[0]
    
    new_project_data = {
        "id": "test-project-123",
        "name": "Test Project",
        "description": "A test project created by the test script",
        "created_by": admin_user.id,
        "access_token": "test_token_456",
        "users": {
            admin_user.id: ProjectUser(user_id=admin_user.id, role=UserRole.ADMIN)
        },
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    new_project = storage.create_project(new_project_data)
    print(f"Created project: {new_project.name}")
    
    # Test 3: Verify the project was saved
    all_projects = storage.get_all_projects()
    print(f"Now have {len(all_projects)} projects")
    
    # Test 4: Check if files were created
    print("\nChecking data files...")
    data_files = [
        "users.json",
        "projects.json", 
        "knowledge_bases.json",
        "kb_versions.json",
        "documents.json",
        "document_versions.json"
    ]
    
    for filename in data_files:
        filepath = storage.data_dir / filename
        if filepath.exists():
            size = filepath.stat().st_size
            print(f"  ✓ {filename} ({size} bytes)")
        else:
            print(f"  ✗ {filename} (missing)")
    
    print("\nStorage test completed!")

if __name__ == "__main__":
    test_storage() 