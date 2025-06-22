import streamlit as st
from components.header import render_header, get_current_project
from components.sidebar import render_sidebar, get_selected_knowledge_base
from components.kb_list import render_knowledge_base_details, render_empty_state
from api.client import api_client


def main():
    """Main Streamlit application"""
    
    # Page configuration
    st.set_page_config(
        page_title="Knowledge Base Manager",
        page_icon="📚",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Custom CSS for overall styling
    st.markdown("""
    <style>
    .main-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 2rem;
        border-radius: 0.5rem;
        margin-bottom: 2rem;
    }
    .metric-container {
        background-color: #f8fafc;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #3b82f6;
    }
    .stButton > button {
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        padding: 0.5rem 1rem;
        font-weight: 500;
        transition: all 0.2s;
    }
    .stButton > button:hover {
        border-color: #3b82f6;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
    }
    .stSelectbox > div > div > select {
        border-radius: 0.5rem;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Check API health
    if not api_client.health_check():
        st.error("""
        ⚠️ **Backend API is not available**
        
        Please make sure the backend server is running:
        ```bash
        poetry run python backend/main.py
        ```
        
        The API should be available at: http://localhost:8000
        """)
        st.stop()
    
    # Render header with project selection
    render_header()
    
    # Render sidebar with knowledge base navigation
    render_sidebar()
    
    # Main content area
    st.markdown("---")
    
    # Get current project and selected knowledge base
    current_project = get_current_project()
    selected_kb = get_selected_knowledge_base()
    
    # Display main content based on selection
    if not current_project:
        st.warning("Please select a project to get started")
        render_empty_state()
    elif not selected_kb:
        st.info("Select a knowledge base from the sidebar to view its details")
        render_empty_state()
    else:
        # Render knowledge base details
        render_knowledge_base_details(selected_kb)
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: #6b7280; padding: 1rem;">
        <small>Knowledge Base Manager v1.0.0 | Built with Streamlit & FastAPI</small>
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main() 