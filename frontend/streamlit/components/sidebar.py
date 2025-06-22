import streamlit as st
from typing import List, Optional
from backend.models import KnowledgeBase, KnowledgeBaseStatus, AccessLevel
from backend.api.client import api_client


def render_sidebar():
    """Render the sidebar with contextual actions"""
    
    # Check if a project is selected
    if not st.session_state.get('selected_project_id'):
        st.sidebar.warning("Please select a project first")
        return
    
    # Sidebar title
    st.sidebar.markdown("### ⚡ Quick Actions")
    
    # Project-level actions (when no KB is selected)
    if not st.session_state.get('selected_kb_id'):
        st.sidebar.markdown("**Project Actions**")
        
        # Create new KB button
        if st.sidebar.button("➕ Create New KB", use_container_width=True):
            st.session_state.show_create_kb = True
        
        # List KBs button
        if st.sidebar.button("📚 View All KBs", use_container_width=True):
            st.session_state.show_kb_list = True
        
        # Show create knowledge base form if requested
        if st.session_state.get('show_create_kb'):
            st.sidebar.markdown("---")
            render_create_knowledge_base_form()
        
        # Show KB list if requested
        if st.session_state.get('show_kb_list'):
            st.sidebar.markdown("---")
            render_knowledge_bases_list()
    
    # KB-level actions (when a KB is selected)
    else:
        kb = api_client.get_knowledge_base(st.session_state.selected_kb_id)
        if kb:
            st.sidebar.markdown(f"**KB: {kb.name}**")
            st.sidebar.caption(f"Status: {kb.status.value.title()}")
            
            # KB actions
            if st.sidebar.button("📄 Upload Document", use_container_width=True):
                # This will show the documents tab
                pass
            
            if st.sidebar.button("🔄 New Version", use_container_width=True):
                st.session_state.show_create_version = True
                st.session_state.create_version_kb_id = kb.id
            
            if st.sidebar.button("⚙️ KB Settings", use_container_width=True):
                # This will show the settings tab
                pass
            
            # Show create version form if requested
            if st.session_state.get('show_create_version'):
                st.sidebar.markdown("---")
                render_create_version_form()


def render_knowledge_bases_list():
    """Render the list of knowledge bases in the sidebar"""
    st.sidebar.markdown("### 📚 Knowledge Bases")
    
    # Get knowledge bases for the selected project
    knowledge_bases = api_client.get_knowledge_bases(st.session_state.selected_project_id)
    
    if not knowledge_bases:
        st.sidebar.info("No knowledge bases found")
        if st.sidebar.button("Add New KB", key="sidebar_add_kb_empty", use_container_width=True):
            st.session_state.show_create_kb = True
            st.rerun()
        return
    
    kb_names = [kb.name for kb in knowledge_bases]
    default_index = 0
    selected_kb_name = st.sidebar.selectbox(
        "Select a knowledge base:",
        options=kb_names,
        index=default_index,
        key="sidebar_kb_selector"
    )
    
    col1, col2 = st.sidebar.columns([1, 1])
    with col1:
        if st.button("Select KB", key="sidebar_select_kb_btn"):
            selected_kb = next((kb for kb in knowledge_bases if kb.name == selected_kb_name), None)
            if selected_kb:
                st.session_state.selected_kb_id = selected_kb.id
                st.session_state.show_kb_list = False
                st.rerun()
    with col2:
        if st.button("Add New KB", key="sidebar_add_kb_btn"):
            st.session_state.show_create_kb = True
            st.rerun()


def get_selected_knowledge_base() -> Optional[KnowledgeBase]:
    """Get the currently selected knowledge base"""
    if st.session_state.get('selected_kb_id'):
        return api_client.get_knowledge_base(st.session_state.selected_kb_id)
    return None


def render_create_knowledge_base_form():
    """Render form to create a new knowledge base"""
    st.sidebar.markdown("### Create Knowledge Base")
    
    with st.sidebar.form("create_kb_form_sidebar"):
        name = st.text_input("Name", key="kb_name_sidebar")
        description = st.text_area("Description", key="kb_description_sidebar")
        access_level = st.selectbox(
            "Access Level",
            options=[AccessLevel.PRIVATE, AccessLevel.PROTECTED, AccessLevel.PUBLIC],
            format_func=lambda x: x.value.title(),
            key="kb_access_level_sidebar"
        )
        
        submitted = st.form_submit_button("Create")
        
        if submitted and name:
            if api_client.create_knowledge_base(
                st.session_state.selected_project_id,
                name,
                description or "",
                access_level
            ):
                st.success("Knowledge base created!")
                st.session_state.show_create_kb = False
                st.rerun()
            else:
                st.error("Failed to create knowledge base")
    
    if st.sidebar.button("Cancel", key="cancel_create_kb"):
        st.session_state.show_create_kb = False
        st.rerun()


def render_create_version_form():
    """Render form to create a new knowledge base version"""
    st.sidebar.markdown("### Create New Version")
    
    kb_id = st.session_state.get('create_version_kb_id')
    if not kb_id:
        st.sidebar.error("No knowledge base selected")
        return
    
    kb = api_client.get_knowledge_base(kb_id)
    if not kb:
        st.sidebar.error("Knowledge base not found")
        return
    
    st.sidebar.info(f"Creating version for: **{kb.name}**")
    
    with st.sidebar.form("create_version_form_sidebar"):
        version_number = st.text_input("Version Number (e.g., 1.0.0)", key="version_number_sidebar")
        description = st.text_area("Description", key="version_description_sidebar")
        
        submitted = st.form_submit_button("Create Version")
        
        if submitted and version_number:
            # Ensure version number follows vX.X.X format
            if not version_number.startswith('v'):
                version_number = f"v{version_number}"
            
            version_data = {
                "version_number": version_number,
                "description": description or ""
            }
            
            if api_client.create_kb_version(kb_id, version_data):
                st.sidebar.success("Version created successfully!")
                st.session_state.show_create_version = False
                st.rerun()
            else:
                st.sidebar.error("Failed to create version")
    
    if st.sidebar.button("Cancel", key="cancel_version_sidebar"):
        st.session_state.show_create_version = False
        st.rerun() 