import streamlit as st
from typing import List, Optional
from backend.models import KnowledgeBase
from api.client import api_client


def render_sidebar():
    """Render the sidebar with knowledge base navigation"""
    
    # Custom CSS for sidebar styling
    st.markdown("""
    <style>
    .sidebar-container {
        padding: 1rem 0;
    }
    .kb-item {
        padding: 0.75rem;
        margin: 0.25rem 0;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    .kb-item:hover {
        background-color: #f3f4f6;
    }
    .kb-item.selected {
        background-color: #dbeafe;
        border-left: 4px solid #3b82f6;
    }
    .kb-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
    }
    .kb-description {
        font-size: 0.875rem;
        color: #6b7280;
        line-height: 1.4;
    }
    .kb-status {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
    }
    .status-active {
        background-color: #dcfce7;
        color: #166534;
    }
    .status-inactive {
        background-color: #fef2f2;
        color: #dc2626;
    }
    .status-draft {
        background-color: #fef3c7;
        color: #92400e;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Initialize session state for selected knowledge base
    if 'selected_kb_id' not in st.session_state:
        st.session_state.selected_kb_id = None
    
    # Check if a project is selected
    if not st.session_state.get('selected_project_id'):
        st.sidebar.warning("Please select a project first")
        return
    
    # Get knowledge bases for the selected project
    knowledge_bases = api_client.get_knowledge_bases(st.session_state.selected_project_id)
    
    if not knowledge_bases:
        st.sidebar.info("No knowledge bases found for this project")
        return
    
    # Sidebar title
    st.sidebar.title("📚 Knowledge Bases")
    st.sidebar.markdown("---")
    
    # Display knowledge bases
    for kb in knowledge_bases:
        render_knowledge_base_item(kb)


def render_knowledge_base_item(kb: KnowledgeBase):
    """Render a single knowledge base item in the sidebar"""
    
    # Determine if this KB is selected
    is_selected = st.session_state.get('selected_kb_id') == kb.id
    
    # Status badge styling
    status_class = {
        'active': 'status-active',
        'inactive': 'status-inactive', 
        'draft': 'status-draft'
    }.get(kb.status.value, 'status-active')
    
    # Create the knowledge base item
    with st.sidebar.container():
        # Clickable area for the KB
        if st.button(
            f"📖 {kb.name}",
            key=f"kb_btn_{kb.id}",
            help=f"Click to view {kb.name}",
            use_container_width=True
        ):
            st.session_state.selected_kb_id = kb.id
            st.rerun()
        
        # Display KB details if selected
        if is_selected:
            st.markdown(f"""
            <div class="kb-item selected">
                <div class="kb-name">{kb.name}</div>
                <div class="kb-description">{kb.description or 'No description available'}</div>
                <div class="kb-status {status_class}">{kb.status.value}</div>
                <small>Current Version: {kb.current_version or 'None'}</small>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
            <div class="kb-item">
                <div class="kb-name">{kb.name}</div>
                <div class="kb-description">{kb.description or 'No description available'}</div>
                <div class="kb-status {status_class}">{kb.status.value}</div>
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown("---")


def get_selected_knowledge_base() -> Optional[KnowledgeBase]:
    """Get the currently selected knowledge base"""
    if st.session_state.get('selected_kb_id'):
        return api_client.get_knowledge_base(st.session_state.selected_kb_id)
    return None 