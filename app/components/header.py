import streamlit as st
from typing import List, Optional
from backend.models import Project
from api.client import api_client


def render_header():
    """Render the header with user account menu"""
    
    # Custom CSS for header styling
    st.markdown("""
    <style>
    .header-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid #e0e0e0;
        margin-bottom: 2rem;
    }
    .header-title {
        font-size: 2rem;
        font-weight: bold;
        color: #1f2937;
    }
    .user-menu {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Header container
    col1, col2 = st.columns([3, 1])
    
    with col1:
        st.markdown('<div class="header-title">Knowledge Base Manager</div>', unsafe_allow_html=True)
    
    with col2:
        render_user_menu()


def render_user_menu():
    """Render the user account menu with project selection"""
    
    # Initialize session state for user and project selection
    if 'current_user' not in st.session_state:
        st.session_state.current_user = "John Doe"
    
    if 'selected_project_id' not in st.session_state:
        st.session_state.selected_project_id = None
    
    if 'selected_project_name' not in st.session_state:
        st.session_state.selected_project_name = "Select Project"
    
    # User menu container
    st.markdown("""
    <div class="user-menu">
        <div class="user-avatar">JD</div>
    </div>
    """, unsafe_allow_html=True)
    
    # Project selection dropdown
    st.markdown("### Project Selection")
    
    # Get projects from API
    projects = api_client.get_projects()
    
    if projects:
        # Create project options for dropdown
        project_options = ["Select a project"] + [f"{p.name} ({p.id})" for p in projects]
        project_ids = [None] + [p.id for p in projects]
        
        # Project selection dropdown
        selected_index = st.selectbox(
            "Choose your project:",
            range(len(project_options)),
            index=0,
            format_func=lambda x: project_options[x],
            key="project_selector"
        )
        
        # Update session state when project changes
        if selected_index > 0:  # Not "Select a project"
            selected_project_id = project_ids[selected_index]
            selected_project_name = projects[selected_index - 1].name
            
            if st.session_state.selected_project_id != selected_project_id:
                st.session_state.selected_project_id = selected_project_id
                st.session_state.selected_project_name = selected_project_name
                st.rerun()
        
        # Display current project info
        if st.session_state.selected_project_id:
            selected_project = next((p for p in projects if p.id == st.session_state.selected_project_id), None)
            if selected_project:
                st.info(f"**Current Project:** {selected_project.name}")
                if selected_project.description:
                    st.caption(selected_project.description)
    else:
        st.error("Failed to load projects. Please check if the backend server is running.")
        st.info("Make sure to start the backend server with: `poetry run python backend/main.py`")


def get_current_project() -> Optional[Project]:
    """Get the currently selected project"""
    if st.session_state.get('selected_project_id'):
        return api_client.get_project(st.session_state.selected_project_id)
    return None 