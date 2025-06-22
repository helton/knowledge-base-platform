# RAG Knowledge Base Platform

A comprehensive platform for managing knowledge bases and documents with AI-powered RAG (Retrieval-Augmented Generation) workflows.

## 🏗️ Project Structure

```
kb-streamlit/
├── frontend/                 # Streamlit frontend application
│   ├── main.py              # Main Streamlit app entry point
│   └── components/          # UI components
│       ├── header.py        # Header with project selection
│       ├── sidebar.py       # Contextual actions sidebar
│       └── documents.py     # Document management interface
├── backend/                 # FastAPI backend application
│   ├── main.py             # FastAPI app and endpoints
│   ├── models.py           # Pydantic data models
│   ├── data.py             # Mock data and data access functions
│   └── api/                # API client and utilities
│       └── client.py       # HTTP client for frontend-backend communication
├── start_frontend.py       # Frontend startup script
├── start_backend.py        # Backend startup script
└── pyproject.toml          # Project configuration
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Poetry (for dependency management)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd kb-streamlit

# Install dependencies
poetry install

# Activate virtual environment
poetry shell
```

### Running the Application

#### Option 1: Using Poetry Tasks
```bash
# Start the backend API
poe backend

# In another terminal, start the frontend
poe frontend
```

#### Option 2: Using Direct Scripts
```bash
# Start the backend API
python start_backend.py

# In another terminal, start the frontend
python start_frontend.py
```

## 🌐 Access Points

- **Frontend**: http://localhost:8501
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📋 Features

### Frontend (Streamlit)
- **Project Management**: Create and manage projects
- **Knowledge Base Management**: Create, view, and manage KBs with table-based interface
- **Document Management**: Upload, process, and manage documents within KBs
- **Version Control**: Manage KB and document versions
- **Contextual Actions**: Sidebar with context-aware actions
- **Table-based UI**: Scalable table interfaces for large datasets

### Backend (FastAPI)
- **RESTful API**: Complete CRUD operations for all entities
- **Document Processing**: Simulated document processing pipeline
- **Version Management**: KB and document versioning
- **Mock Data**: Comprehensive mock data for testing
- **Health Checks**: API health monitoring

## 🏛️ Architecture

### Frontend-Backend Separation
- **Frontend**: Pure Streamlit application with UI components
- **Backend**: FastAPI REST API with data models and business logic
- **API Client**: HTTP client in backend/api for frontend-backend communication

### Data Flow
1. **Frontend** → **API Client** → **Backend API** → **Data Layer**
2. **Backend** → **Data Models** → **Mock Data** (for development)

### Key Design Principles
- **Separation of Concerns**: Clear frontend/backend separation
- **Table-based UI**: Scalable interfaces for large datasets
- **Contextual Actions**: Actions relevant to current view
- **Mock Implementation**: Ready for real backend integration

## 🔧 Development

### Adding New Features
1. **Backend**: Add models in `backend/models.py`, endpoints in `backend/main.py`
2. **Frontend**: Add components in `frontend/components/`, update `frontend/main.py`
3. **API Client**: Update `backend/api/client.py` for new endpoints

### Code Organization
- **Frontend**: UI logic and user interactions
- **Backend**: Business logic, data models, and API endpoints
- **API Client**: HTTP communication layer

## 📝 Notes

- This is a proof-of-concept with mock data
- Document processing is simulated
- Ready for integration with real document processing and embedding services
- Table-based UI designed for scalability with large datasets 