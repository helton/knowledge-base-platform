import streamlit as st
import sys
import os
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from frontend.streamlit.components.header import render_header, render_project_selection_modal
from frontend.streamlit.components.sidebar import render_sidebar, get_selected_knowledge_base
from frontend.streamlit.components.documents import render_documents_tab, render_document_versions
from backend.api.client import api_client


def main():
    """Main Streamlit application"""
    
    # Page configuration
    st.set_page_config(
        page_title="RAG Knowledge Base Platform",
        page_icon="🧠",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Initialize session state
    if 'selected_project_id' not in st.session_state:
        st.session_state.selected_project_id = None
    if 'selected_kb_id' not in st.session_state:
        st.session_state.selected_kb_id = None
    if 'show_create_kb' not in st.session_state:
        st.session_state.show_create_kb = False
    if 'show_create_version' not in st.session_state:
        st.session_state.show_create_version = False
    if 'show_document_versions' not in st.session_state:
        st.session_state.show_document_versions = False
    if 'show_kb_list' not in st.session_state:
        st.session_state.show_kb_list = False
    
    # Render header (this will apply the theme)
    render_header()
    
    # Check API health
    if not api_client.health_check():
        st.error("⚠️ Backend API is not available. Please start the backend server first.")
        st.info("Run `poe backend` to start the backend server.")
        return
    
    # Render project selection modal if needed
    if st.session_state.get('show_project_modal'):
        render_project_selection_modal()
    else:
        # Render sidebar only when modal is not open
        with st.sidebar:
            render_sidebar()
    
    # Main content area
    if not st.session_state.get('selected_project_id'):
        render_welcome_screen()
    elif not st.session_state.get('selected_kb_id'):
        render_project_overview()
    else:
        render_knowledge_base_view()


def render_welcome_screen():
    """Render the welcome screen when no project is selected"""
    st.markdown("## 🧠 Welcome to RAG Knowledge Base Platform")
    st.markdown("Select a project from the menu to get started.")
    
    # Show available projects
    projects = api_client.get_projects()
    if projects:
        st.markdown("### 📁 Available Projects")
        project_names = [p.name for p in projects]
        default_index = 0
        selected_project_name = st.selectbox(
            "Select a project:",
            options=project_names,
            index=default_index,
            key="welcome_project_selector"
        )
        
        col1, col2 = st.columns([1, 1])
        with col1:
            if st.button("Select Project", key="welcome_select_project_btn"):
                selected_project = next((p for p in projects if p.name == selected_project_name), None)
                if selected_project:
                    st.session_state.selected_project_id = selected_project.id
                    st.rerun()
        with col2:
            if st.button("Add New Project", key="welcome_add_project_btn"):
                st.info("Add project functionality coming soon!")
    else:
        st.info("No projects available. Create your first project to get started!")
        if st.button("Add New Project", key="welcome_add_project_btn_empty"):
            st.info("Add project functionality coming soon!")


def render_project_overview():
    """Render the project overview when no KB is selected"""
    
    # Get current project
    project = api_client.get_project(st.session_state.selected_project_id)
    if not project:
        st.error("Project not found")
        return
    
    # Project header
    st.markdown(f"## 📁 {project.name}")
    if project.description:
        st.caption(project.description)
    
    # Main navigation tabs
    tab1, tab2 = st.tabs(["📊 Dashboard", "📚 Knowledge Bases"])
    
    with tab1:
        render_dashboard(project)
    
    with tab2:
        render_knowledge_bases_tab(project)


def render_knowledge_base_view():
    """Render the knowledge base view when a KB is selected"""
    
    # Get current KB
    kb = api_client.get_knowledge_base(st.session_state.selected_kb_id)
    if not kb:
        st.error("Knowledge base not found")
        return
    
    # KB header with back button
    col1, col2 = st.columns([4, 1])
    with col1:
        st.markdown(f"## 📚 {kb.name}")
        st.caption(f"Status: {kb.status.value.title()} | Access: {kb.access_level.value.title()}")
    with col2:
        if st.button("← Back to Project", use_container_width=True):
            st.session_state.selected_kb_id = None
            st.rerun()
    
    # Show create version form if requested
    if st.session_state.get('show_create_version'):
        render_create_version_form()
        return
    
    # Show document versions if requested
    if st.session_state.get('show_document_versions'):
        doc_id = st.session_state.get('selected_document_id')
        if doc_id:
            render_document_versions(doc_id)
            if st.button("← Back to Documents"):
                st.session_state.show_document_versions = False
                st.rerun()
        return
    
    # Main navigation tabs for KB
    tab1, tab2, tab3 = st.tabs(["📊 Overview", "📄 Documents", "⚙️ Settings"])
    
    with tab1:
        render_kb_overview(kb)
    
    with tab2:
        render_documents_tab()
    
    with tab3:
        render_kb_settings(kb)


def render_dashboard(project):
    """Render the project dashboard"""
    
    # Get project statistics
    knowledge_bases = api_client.get_knowledge_bases(project.id)
    documents = api_client.get_documents(project.id)
    
    # Calculate statistics
    total_kbs = len(knowledge_bases) if knowledge_bases else 0
    total_docs = len(documents) if documents else 0
    active_kbs = len([kb for kb in knowledge_bases if kb.status.value == 'active']) if knowledge_bases else 0
    completed_docs = len([doc for doc in documents if doc.status.value == 'completed']) if documents else 0
    
    # Statistics grid
    st.markdown("### 📈 Project Statistics")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Knowledge Bases", total_kbs)
    
    with col2:
        st.metric("Active KBs", active_kbs)
    
    with col3:
        st.metric("Documents", total_docs)
    
    with col4:
        st.metric("Processed Docs", completed_docs)
    
    # Recent activity
    st.markdown("### 📈 Recent Activity")
    
    if knowledge_bases:
        st.markdown("**Recent Knowledge Bases**")
        for kb in knowledge_bases[:3]:  # Show last 3
            st.caption(f"• **{kb.name}** - {kb.status.value.title()} (Updated: {kb.updated_at.strftime('%Y-%m-%d')})")
    
    if documents:
        st.markdown("**Recent Documents**")
        for doc in documents[:3]:  # Show last 3
            st.caption(f"• **{doc.name}** - {doc.status.value.title()} (Uploaded: {doc.created_at.strftime('%Y-%m-%d')})")


def render_knowledge_bases_tab(project):
    """Render the knowledge bases tab"""
    
    # Get knowledge bases
    knowledge_bases = api_client.get_knowledge_bases(project.id)
    
    if not knowledge_bases:
        st.info("No knowledge bases found. Create your first knowledge base to get started!")
        if st.button("Add New KB", key="main_add_kb_empty"):
            st.session_state.show_create_kb = True
            st.rerun()
        return
    
    # KB selection
    kb_names = [kb.name for kb in knowledge_bases]
    default_index = 0
    selected_kb_name = st.selectbox(
        "Select a knowledge base:",
        options=kb_names,
        index=default_index,
        key="main_kb_selector"
    )
    
    col1, col2 = st.columns([1, 1])
    with col1:
        if st.button("Select KB", key="main_select_kb_btn"):
            selected_kb = next((kb for kb in knowledge_bases if kb.name == selected_kb_name), None)
            if selected_kb:
                st.session_state.selected_kb_id = selected_kb.id
                st.rerun()
    with col2:
        if st.button("Add New KB", key="main_add_kb_btn"):
            st.session_state.show_create_kb = True
            st.rerun()
    
    # Knowledge base table
    st.markdown("### 📚 Project Knowledge Bases")
    
    # Create table header
    col1, col2, col3, col4, col5, col6 = st.columns([3, 2, 1, 1, 1, 2])
    
    with col1:
        st.markdown("**Name**")
    with col2:
        st.markdown("**Description**")
    with col3:
        st.markdown("**Status**")
    with col4:
        st.markdown("**Access**")
    with col5:
        st.markdown("**Version**")
    with col6:
        st.markdown("**Actions**")
    
    st.markdown("---")
    
    # Create table rows
    for kb in knowledge_bases:
        col1, col2, col3, col4, col5, col6 = st.columns([3, 2, 1, 1, 1, 2])
        
        with col1:
            st.markdown(f"**{kb.name}**")
        
        with col2:
            st.caption(kb.description or "No description")
        
        with col3:
            st.caption(f"📊 {kb.status.value.title()}")
        
        with col4:
            st.caption(f"🔒 {kb.access_level.value.title()}")
        
        with col5:
            version_display = kb.current_version or 'None'
            if version_display != 'None' and not version_display.startswith('v'):
                version_display = f"v{version_display}"
            st.caption(f"📄 {version_display}")
        
        with col6:
            # Only show New Version button
            if st.button("New Version", key=f"new_version_{kb.id}", use_container_width=True):
                st.session_state.show_create_version = True
                st.session_state.create_version_kb_id = kb.id
                st.rerun()
        
        st.markdown("---")


def render_create_version_form():
    """Render form to create a new knowledge base version"""
    st.markdown("### 🆕 Create New Version")
    
    kb_id = st.session_state.get('create_version_kb_id')
    if not kb_id:
        st.error("No knowledge base selected for version creation")
        return
    
    kb = api_client.get_knowledge_base(kb_id)
    if not kb:
        st.error("Knowledge base not found")
        return
    
    st.info(f"Creating new version for: **{kb.name}**")
    
    with st.form("create_version_form_main"):
        version_number = st.text_input("Version Number (e.g., 1.0.0)", key="version_number_main")
        description = st.text_area("Description", key="version_description_main")
        
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
                st.success("Version created successfully!")
                st.session_state.show_create_version = False
                st.rerun()
            else:
                st.error("Failed to create version")
    
    if st.button("Cancel", key="cancel_version_main"):
        st.session_state.show_create_version = False
        st.rerun()


def render_kb_overview(kb):
    """Render the knowledge base overview"""
    
    # Get KB statistics
    documents = api_client.get_documents_by_kb(st.session_state.selected_kb_id)
    
    # Calculate statistics
    total_docs = len(documents) if documents else 0
    completed_docs = len([doc for doc in documents if doc.status.value == 'completed']) if documents else 0
    processing_docs = len([doc for doc in documents if doc.status.value == 'processing']) if documents else 0
    failed_docs = len([doc for doc in documents if doc.status.value == 'failed']) if documents else 0
    
    # Statistics grid
    st.markdown("### 📈 Knowledge Base Statistics")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Documents", total_docs)
    
    with col2:
        st.metric("Completed", completed_docs)
    
    with col3:
        st.metric("Processing", processing_docs)
    
    with col4:
        st.metric("Failed", failed_docs)
    
    # KB actions
    st.markdown("### ⚡ Quick Actions")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📄 Upload Document", use_container_width=True):
            # This will show the documents tab
            # Don't call st.rerun() - let Streamlit handle the state change
            pass
    
    with col2:
        if st.button("🔄 New Version", use_container_width=True):
            st.session_state.show_create_version = True
            st.session_state.create_version_kb_id = kb.id
            # Don't call st.rerun() - let Streamlit handle the state change
    
    with col3:
        if st.button("🔍 Search", use_container_width=True):
            st.info("Search functionality coming soon!")
    
    # Recent documents
    if documents:
        st.markdown("### 📄 Recent Documents")
        for doc in documents[:5]:  # Show last 5
            st.caption(f"• **{doc.name}** - {doc.status.value.title()} (Updated: {doc.created_at.strftime('%Y-%m-%d')})")


def render_kb_settings(kb):
    """Render the knowledge base settings"""
    
    st.markdown("### ⚙️ Knowledge Base Settings")
    
    # Basic info
    st.markdown("**Basic Information**")
    st.caption(f"**Name:** {kb.name}")
    st.caption(f"**Description:** {kb.description or 'No description'}")
    st.caption(f"**Status:** {kb.status.value.title()}")
    st.caption(f"**Access Level:** {kb.access_level.value.title()}")
    st.caption(f"**Created:** {kb.created_at.strftime('%Y-%m-%d %H:%M')}")
    st.caption(f"**Updated:** {kb.updated_at.strftime('%Y-%m-%d %H:%M')}")
    
    st.markdown("---")
    
    # Actions
    st.markdown("**Actions**")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("🔄 New Version", key="new_version_settings"):
            st.session_state.show_create_version = True
            st.session_state.create_version_kb_id = kb.id
            # Don't call st.rerun() - let Streamlit handle the state change
    
    with col2:
        if st.button("🗑️ Delete KB", key="delete_kb_settings", type="secondary"):
            st.warning("Delete functionality not implemented yet")


if __name__ == "__main__":
    main() 