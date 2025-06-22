import streamlit as st
import time
from typing import List, Optional
from backend.models import (
    Document, DocumentVersion, DocumentStatus, ProcessingStage,
    ChunkingMethod, EmbeddingProvider, EmbeddingModel
)
from backend.api.client import api_client


def render_documents_tab():
    """Render the documents management tab"""
    
    # Check if a KB is selected
    if not st.session_state.get('selected_kb_id'):
        st.warning("Please select a knowledge base first")
        return
    
    # Tab navigation
    tab1, tab2 = st.tabs(["📄 Documents", "📤 Upload"])
    
    with tab1:
        render_documents_list()
    
    with tab2:
        render_upload_form()


def render_documents_list():
    """Render the list of documents"""
    st.markdown("### 📄 Knowledge Base Documents")
    
    # Get documents for the current KB
    documents = api_client.get_documents_by_kb(st.session_state.selected_kb_id)
    
    if not documents:
        st.info("No documents found. Upload your first document to get started!")
        return
    
    # Filter options
    col1, col2 = st.columns([2, 1])
    with col1:
        status_filter = st.selectbox(
            "Filter by status",
            ["All", "Pending", "Processing", "Completed", "Failed", "Deprecated"],
            key="doc_status_filter"
        )
    
    with col2:
        search_term = st.text_input("Search documents", key="doc_search")
    
    # Filter documents
    filtered_docs = documents
    if status_filter != "All":
        filtered_docs = [doc for doc in documents if doc.status.value == status_filter.lower()]
    
    if search_term:
        filtered_docs = [doc for doc in filtered_docs if search_term.lower() in doc.name.lower()]
    
    # Create table header
    col1, col2, col3, col4, col5, col6, col7 = st.columns([3, 2, 1, 1, 1, 1, 2])
    
    with col1:
        st.markdown("**Name**")
    with col2:
        st.markdown("**Description**")
    with col3:
        st.markdown("**Status**")
    with col4:
        st.markdown("**Type**")
    with col5:
        st.markdown("**Size**")
    with col6:
        st.markdown("**Chunks**")
    with col7:
        st.markdown("**Actions**")
    
    st.markdown("---")
    
    # Create table rows
    for doc in filtered_docs:
        col1, col2, col3, col4, col5, col6, col7 = st.columns([3, 2, 1, 1, 1, 1, 2])
        
        with col1:
            st.markdown(f"**{doc.name}**")
        
        with col2:
            st.caption(doc.description or "No description")
        
        with col3:
            # Status badge
            status_emoji = {
                'pending': '⏳',
                'processing': '🔄',
                'completed': '✅',
                'failed': '❌',
                'deprecated': '🚫'
            }.get(doc.status.value, '❓')
            st.caption(f"{status_emoji} {doc.status.value.title()}")
        
        with col4:
            st.caption(f"📁 {doc.mime_type}")
        
        with col5:
            # Format file size
            def format_file_size(size_bytes):
                if size_bytes < 1024:
                    return f"{size_bytes} B"
                elif size_bytes < 1024 * 1024:
                    return f"{size_bytes / 1024:.1f} KB"
                else:
                    return f"{size_bytes / (1024 * 1024):.1f} MB"
            st.caption(f"💾 {format_file_size(doc.file_size)}")
        
        with col6:
            st.caption(f"📄 {doc.chunk_count}")
        
        with col7:
            # Action buttons in a horizontal layout
            action_col1, action_col2, action_col3 = st.columns(3)
            with action_col1:
                if st.button("Versions", key=f"view_versions_{doc.id}", use_container_width=True):
                    st.session_state.selected_document_id = doc.id
                    st.session_state.show_document_versions = True
            with action_col2:
                if st.button("Upload", key=f"upload_version_{doc.id}", use_container_width=True):
                    st.session_state.upload_version_doc_id = doc.id
            with action_col3:
                if st.button("Refresh", key=f"refresh_{doc.id}", use_container_width=True):
                    # Refresh document status
                    updated_doc = api_client.get_document(doc.id)
                    if updated_doc:
                        st.success("Status updated!")
        
        # Show processing progress if processing
        if doc.status.value == 'processing' and doc.processing_stage:
            progress = doc.processing_progress * 100
            st.progress(progress / 100)
            st.caption(f"Processing: {doc.processing_stage.value.title()} ({progress:.1f}%)")
        
        # Show error message if failed
        if doc.status.value == 'failed' and doc.error_message:
            st.error(f"Processing failed: {doc.error_message}")
        
        st.markdown("---")


def render_upload_form():
    """Render the document upload form"""
    st.markdown("### 📤 Upload Document")
    
    with st.form("upload_document_form"):
        st.info("📄 Upload your document")
        st.caption("Supported formats: PDF, DOCX, TXT, MD")
        
        # File upload
        uploaded_file = st.file_uploader(
            "Choose a file",
            type=['pdf', 'docx', 'txt', 'md'],
            key="document_upload"
        )
        
        # Document metadata
        name = st.text_input("Document Name", key="upload_name")
        description = st.text_area("Description (optional)", key="upload_description")
        
        # Processing configuration
        st.markdown("**Processing Configuration**")
        
        col1, col2 = st.columns(2)
        
        with col1:
            chunking_method = st.selectbox(
                "Chunking Method",
                options=[ChunkingMethod.FIXED_SIZE, ChunkingMethod.SEMANTIC, 
                        ChunkingMethod.SLIDING_WINDOW, ChunkingMethod.RECURSIVE],
                format_func=lambda x: x.value.replace('_', ' ').title(),
                key="upload_chunking"
            )
            
            chunk_size = st.number_input("Chunk Size", min_value=100, max_value=4000, 
                                       value=1000, step=100, key="upload_chunk_size")
        
        with col2:
            embedding_provider = st.selectbox(
                "Embedding Provider",
                options=[EmbeddingProvider.OPENAI, EmbeddingProvider.ANTHROPIC, 
                        EmbeddingProvider.COHERE, EmbeddingProvider.HUGGINGFACE, 
                        EmbeddingProvider.LOCAL],
                format_func=lambda x: x.value.title(),
                key="upload_provider"
            )
            
            chunk_overlap = st.number_input("Chunk Overlap", min_value=0, max_value=1000, 
                                          value=200, step=50, key="upload_overlap")
        
        # Embedding model selection based on provider
        embedding_models = {
            EmbeddingProvider.OPENAI: [
                EmbeddingModel.TEXT_EMBEDDING_ADA_002,
                EmbeddingModel.TEXT_EMBEDDING_3_SMALL,
                EmbeddingModel.TEXT_EMBEDDING_3_LARGE
            ],
            EmbeddingProvider.COHERE: [
                EmbeddingModel.EMBED_ENGLISH_V3,
                EmbeddingModel.EMBED_MULTILINGUAL_V3
            ],
            EmbeddingProvider.LOCAL: [
                EmbeddingModel.SENTENCE_TRANSFORMERS
            ]
        }
        
        available_models = embedding_models.get(embedding_provider, [EmbeddingModel.TEXT_EMBEDDING_ADA_002])
        embedding_model = st.selectbox(
            "Embedding Model",
            options=available_models,
            format_func=lambda x: x.value.replace('_', ' ').title(),
            key="upload_model"
        )
        
        submitted = st.form_submit_button("Upload & Process")
        
        if submitted and uploaded_file and name:
            # Fake the upload result instead of actually uploading
            st.success(f"Document '{name}' uploaded successfully! Processing started.")
            st.info("You can monitor the processing status in the Documents tab.")
            
            # Simulate creating a document in the backend
            # In a real app, this would call the API
            st.caption("📄 Mock upload completed - document processing simulated")


def render_document_versions(doc_id: str):
    """Render document versions for a specific document"""
    st.markdown("### 📄 Document Versions")
    
    # Get document versions
    versions = api_client.get_document_versions(doc_id)
    
    if not versions:
        st.info("No versions found for this document.")
        return
    
    # Create table header
    col1, col2, col3, col4, col5, col6 = st.columns([2, 2, 1, 1, 1, 1])
    
    with col1:
        st.markdown("**Version**")
    with col2:
        st.markdown("**Status**")
    with col3:
        st.markdown("**Method**")
    with col4:
        st.markdown("**Provider**")
    with col5:
        st.markdown("**Chunks**")
    with col6:
        st.markdown("**Actions**")
    
    st.markdown("---")
    
    # Create table rows
    for version in versions:
        col1, col2, col3, col4, col5, col6 = st.columns([2, 2, 1, 1, 1, 1])
        
        with col1:
            st.markdown(f"**{version.version_number}**")
        
        with col2:
            # Status badge
            status_emoji = {
                'pending': '⏳',
                'processing': '🔄',
                'completed': '✅',
                'failed': '❌',
                'deprecated': '🚫'
            }.get(version.status.value, '❓')
            st.caption(f"{status_emoji} {version.status.value.title()}")
        
        with col3:
            st.caption(f"🔧 {version.chunking_method.value.replace('_', ' ').title() if version.chunking_method else 'Unknown'}")
        
        with col4:
            st.caption(f"🤖 {version.embedding_provider.value.title() if version.embedding_provider else 'Unknown'}")
        
        with col5:
            st.caption(f"📄 {version.chunk_count}")
        
        with col6:
            # Action buttons
            action_col1, action_col2 = st.columns(2)
            with action_col1:
                if st.button("Details", key=f"view_version_{version.id}", use_container_width=True):
                    st.session_state.selected_version_id = version.id
            with action_col2:
                if st.button("Deprecate", key=f"deprecate_version_{version.id}", use_container_width=True, type="secondary"):
                    if api_client.deprecate_document_version(version.document_id, version.id):
                        st.success("Version deprecated!")
                    else:
                        st.error("Failed to deprecate version")
        
        # Show processing progress if processing
        if version.status.value == 'processing' and version.processing_stage:
            progress = version.processing_progress * 100
            st.progress(progress / 100)
            st.caption(f"Processing: {version.processing_stage.value.title()} ({progress:.1f}%)")
        
        # Show error message if failed
        if version.status.value == 'failed' and version.error_message:
            st.error(f"Processing failed: {version.error_message}")
        
        st.markdown("---") 