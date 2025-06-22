import streamlit as st
from typing import List, Optional
from backend.models import KnowledgeBase, Version
from api.client import api_client


def render_knowledge_base_details(kb: KnowledgeBase):
    """Render detailed view of a knowledge base with version selection"""
    
    # Custom CSS for KB details
    st.markdown("""
    <style>
    .kb-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        border-radius: 1rem;
        margin-bottom: 2rem;
    }
    .kb-title {
        font-size: 2rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
    }
    .kb-description {
        font-size: 1.1rem;
        opacity: 0.9;
    }
    .version-card {
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin: 1rem 0;
        transition: all 0.2s;
    }
    .version-card:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border-color: #3b82f6;
    }
    .version-card.selected {
        border-color: #3b82f6;
        background-color: #eff6ff;
    }
    .version-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    .version-number {
        font-size: 1.25rem;
        font-weight: bold;
        color: #1f2937;
    }
    .version-status {
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.875rem;
        font-weight: 500;
    }
    .status-published {
        background-color: #dcfce7;
        color: #166534;
    }
    .status-draft {
        background-color: #fef3c7;
        color: #92400e;
    }
    .status-archived {
        background-color: #f3f4f6;
        color: #6b7280;
    }
    .version-meta {
        display: flex;
        gap: 2rem;
        margin-top: 1rem;
        font-size: 0.875rem;
        color: #6b7280;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Knowledge Base Header
    st.markdown(f"""
    <div class="kb-header">
        <div class="kb-title">{kb.name}</div>
        <div class="kb-description">{kb.description or 'No description available'}</div>
    </div>
    """, unsafe_allow_html=True)
    
    # Knowledge Base Info
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Status", kb.status.value.title())
    
    with col2:
        st.metric("Current Version", kb.current_version or "None")
    
    with col3:
        st.metric("Last Updated", kb.updated_at.strftime("%Y-%m-%d"))
    
    st.markdown("---")
    
    # Version Selection
    st.subheader("📋 Available Versions")
    
    # Get versions for this knowledge base
    versions = api_client.get_versions(kb.id)
    
    if not versions:
        st.info("No versions available for this knowledge base")
        return
    
    # Initialize session state for selected version
    if 'selected_version_id' not in st.session_state:
        st.session_state.selected_version_id = None
    
    # Sort versions by creation date (newest first)
    versions.sort(key=lambda v: v.created_at, reverse=True)
    
    # Version selection
    version_options = ["Select a version"] + [f"{v.version_number} - {v.description or 'No description'}" for v in versions]
    version_ids = [None] + [v.id for v in versions]
    
    selected_version_index = st.selectbox(
        "Choose a version to view:",
        range(len(version_options)),
        index=0,
        format_func=lambda x: version_options[x],
        key="version_selector"
    )
    
    # Update selected version
    if selected_version_index > 0:
        st.session_state.selected_version_id = version_ids[selected_version_index]
    
    st.markdown("---")
    
    # Display all versions in cards
    st.subheader("📚 All Versions")
    
    for version in versions:
        render_version_card(version, kb)


def render_version_card(version: Version, kb: KnowledgeBase):
    """Render a version card with details"""
    
    # Determine if this version is selected
    is_selected = st.session_state.get('selected_version_id') == version.id
    
    # Status badge styling
    status_class = {
        'published': 'status-published',
        'draft': 'status-draft',
        'archived': 'status-archived'
    }.get(version.status.value, 'status-draft')
    
    # Version card
    st.markdown(f"""
    <div class="version-card {'selected' if is_selected else ''}">
        <div class="version-header">
            <div class="version-number">{version.version_number}</div>
            <div class="version-status {status_class}">{version.status.value.title()}</div>
        </div>
        <p>{version.description or 'No description available'}</p>
        <div class="version-meta">
            <span>📄 {version.document_count} documents</span>
            <span>📅 Created: {version.created_at.strftime('%Y-%m-%d')}</span>
            <span>🔄 Updated: {version.updated_at.strftime('%Y-%m-%d')}</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Action buttons for the version
    col1, col2, col3 = st.columns([1, 1, 1])
    
    with col1:
        if st.button("View Details", key=f"view_{version.id}"):
            st.session_state.selected_version_id = version.id
            st.rerun()
    
    with col2:
        if st.button("Download", key=f"download_{version.id}"):
            st.success(f"Downloading {version.version_number}...")
    
    with col3:
        if st.button("Compare", key=f"compare_{version.id}"):
            st.info(f"Comparing {version.version_number} with other versions...")
    
    st.markdown("---")


def render_empty_state():
    """Render empty state when no knowledge base is selected"""
    
    st.markdown("""
    <div style="text-align: center; padding: 4rem 2rem;">
        <h2>📚 Welcome to Knowledge Base Manager</h2>
        <p style="font-size: 1.1rem; color: #6b7280; margin: 1rem 0;">
            Select a project and knowledge base to get started
        </p>
        <div style="margin-top: 2rem;">
            <h3>Getting Started:</h3>
            <ol style="text-align: left; max-width: 400px; margin: 1rem auto;">
                <li>Choose your project from the dropdown in the header</li>
                <li>Select a knowledge base from the sidebar</li>
                <li>Browse and manage different versions</li>
                <li>View detailed information and documents</li>
            </ol>
        </div>
    </div>
    """, unsafe_allow_html=True) 