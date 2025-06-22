import streamlit as st
from typing import Optional
from backend.models import Project
from backend.api.client import api_client


def render_header():
    """Render the application header with project selection in top right"""
    
    # Initialize modal states
    if 'show_project_modal' not in st.session_state:
        st.session_state.show_project_modal = False
    
    # Header layout with title on left, user menu on right
    col1, col2 = st.columns([6, 1])
    
    with col1:
        st.markdown("## 🧠 RAG Knowledge Base Platform")
        st.caption("Manage your knowledge bases and documents with AI-powered RAG workflows")
    
    with col2:
        # User menu combo box - pushed to very right
        render_user_menu()
    
    st.markdown("---")


def render_user_menu():
    """Render the user menu combo box in the header"""
    
    # Get current project name for display
    projects = api_client.get_projects()
    current_project_name = "Select Project"
    if st.session_state.get('selected_project_id') and projects:
        current_project = next((p for p in projects if p.id == st.session_state.selected_project_id), None)
        if current_project:
            current_project_name = current_project.name
    
    # User menu with dropdown - compact design
    with st.popover("👤", help="User menu and settings"):
        st.markdown("**Settings**")
        
        # Project selection
        st.markdown("**Project**")
        st.caption(current_project_name)
        
        if st.button("Change", key="change_project_btn", use_container_width=True):
            st.session_state.show_project_modal = True
            st.rerun()
        
        st.markdown("---")
        
        # Notifications (placeholder)
        st.markdown("**Notifications**")
        st.caption("🔔 No new notifications")
        
        st.markdown("---")
        
        # User info (placeholder)
        st.markdown("**User**")
        user_info = get_current_user_info()
        st.caption(f"👤 {user_info['name']}")
        st.caption(f"📧 {user_info['email']}")
        st.caption(f"🔑 {user_info['role']}")


def render_project_selection_modal():
    """Render the project selection modal"""
    
    if not st.session_state.get('show_project_modal'):
        return
    
    # Get available projects
    projects = api_client.get_projects()
    
    if not projects:
        st.error("No projects available")
        if st.button("Add New Project", key="modal_add_project_empty"):
            st.info("Add project functionality coming soon!")
        return
    
    # Create modal-like experience using sidebar overlay
    with st.sidebar:
        st.markdown("---")
        st.markdown("### 📁 Select Project")
        st.markdown("Choose a project to work with:")
        
        # Project selection with confirm button
        project_options = [p.name for p in projects]
        selected_project_name = st.selectbox(
            "Select a project:",
            options=project_options,
            key="modal_project_selector",
            index=0
        )
        
        # Project details
        selected_project = next((p for p in projects if p.name == selected_project_name), None)
        if selected_project:
            st.caption(f"**Description:** {selected_project.description or 'No description'}")
        
        # Confirm selection and Add buttons
        col1, col2 = st.columns([1, 1])
        with col1:
            if st.button("Select Project", key="modal_select_project_btn"):
                if selected_project:
                    st.session_state.selected_project_id = selected_project.id
                    st.session_state.selected_kb_id = None  # Reset KB selection
                    st.session_state.show_project_modal = False
                    st.rerun()
        with col2:
            if st.button("Add New Project", key="modal_add_project_btn"):
                st.info("Add project functionality coming soon!")
        
        # Close button only
        if st.button("Close", key="close_project_modal"):
            st.session_state.show_project_modal = False
            st.rerun()
        
        st.markdown("---")


def handle_project_selection():
    pass  # No longer needed


def get_current_project() -> Optional[Project]:
    """Get the currently selected project"""
    if st.session_state.get('selected_project_id'):
        return api_client.get_project(st.session_state.selected_project_id)
    return None


def get_current_user_info():
    """Get current user information (placeholder for future implementation)"""
    return {
        "name": "Demo User",
        "email": "demo@example.com",
        "role": "Admin"
    } 