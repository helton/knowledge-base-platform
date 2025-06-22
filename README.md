# RAG Knowledge Base Platform

A comprehensive platform for managing knowledge bases and documents with AI-powered RAG (Retrieval-Augmented Generation) workflows.

## 🏗️ Project Structure

```
kb-streamlit/
├── frontend/                 # Frontend applications
│   ├── streamlit/           # Streamlit frontend (legacy)
│   │   ├── main.py          # Main Streamlit app entry point
│   │   └── components/      # UI components
│   │       ├── header.py    # Header with project selection
│   │       ├── sidebar.py   # Contextual actions sidebar
│   │       └── documents.py # Document management interface
│   └── nextjs/              # Next.js frontend (modern)
│       ├── app/             # Next.js App Router
│       ├── components/      # React components
│       ├── lib/             # Utility libraries
│       └── package.json     # Node.js dependencies
├── backend/                 # FastAPI backend application
│   ├── main.py             # FastAPI app and endpoints
│   ├── models.py           # Pydantic data models
│   ├── data.py             # Mock data and data access functions
│   └── api/                # API client and utilities
│       └── client.py       # HTTP client for frontend-backend communication
├── start_backend.py        # Backend startup script
└── pyproject.toml          # Project configuration
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Poetry (for dependency management)
- Node.js 18+ (for Next.js frontend)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd kb-streamlit

# Install Python dependencies
poetry install

# Activate virtual environment
poetry shell

# Install Node.js dependencies (for Next.js frontend)
poe nextjs-install
```

### Running the Application

#### Backend (Required for both frontends)
```bash
# Start the backend API
poe backend
```

#### Frontend Options

**Option 1: Streamlit Frontend (Legacy)**
```bash
# Start the Streamlit frontend
poe streamlit
```

**Option 2: Next.js Frontend (Modern)**
```bash
# Start the Next.js frontend
poe nextjs
```

## 🌐 Access Points

- **Streamlit Frontend**: http://localhost:8501
- **Next.js Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📋 Features

### Frontend Options

#### Streamlit Frontend (Legacy)
- **Project Management**: Create and manage projects
- **Knowledge Base Management**: Create, view, and manage KBs with table-based interface
- **Document Management**: Upload, process, and manage documents within KBs
- **Version Control**: Manage KB and document versions
- **Contextual Actions**: Sidebar with context-aware actions
- **Table-based UI**: Scalable table interfaces for large datasets

#### Next.js Frontend (Modern)
- **Modern UI**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Type Safety**: Full TypeScript support with proper type definitions
- **Real-time Updates**: Client-side state management with React hooks
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Better Performance**: No full page reruns, smooth interactions
- **True Modals**: Proper modal dialogs and overlays
- **Advanced State Management**: Local storage persistence, better UX

### Backend (FastAPI)
- **RESTful API**: Complete CRUD operations for all entities
- **Document Processing**: Simulated document processing pipeline
- **Version Management**: KB and document versioning
- **Mock Data**: Comprehensive mock data for testing
- **Health Checks**: API health monitoring

## 🏛️ Architecture

### Frontend-Backend Separation
- **Frontends**: Streamlit (legacy) and Next.js (modern) options
- **Backend**: FastAPI REST API with data models and business logic
- **API Client**: HTTP client for frontend-backend communication

### Data Flow
1. **Frontend** → **API Client** → **Backend API** → **Data Layer**
2. **Backend** → **Data Models** → **Mock Data** (for development)

### Key Design Principles
- **Separation of Concerns**: Clear frontend/backend separation
- **Multiple Frontend Options**: Choose between Streamlit and Next.js
- **Table-based UI**: Scalable interfaces for large datasets
- **Contextual Actions**: Actions relevant to current view
- **Mock Implementation**: Ready for real backend integration

## 🔧 Development

### Frontend Development

#### Streamlit Frontend
- Add components in `frontend/streamlit/components/`
- Update `frontend/streamlit/main.py`
- Use `poe streamlit` to run

#### Next.js Frontend
- Add components in `frontend/nextjs/components/`
- Update `frontend/nextjs/app/page.tsx`
- Use `poe nextjs` to run
- See `frontend/nextjs/README.md` for detailed setup

### Backend Development
- Add models in `backend/models.py`
- Add endpoints in `backend/main.py`
- Update `backend/api/client.py` for new endpoints

### Available Commands
```bash
# Backend
poe backend                    # Start FastAPI backend

# Streamlit Frontend
poe streamlit                  # Start Streamlit frontend

# Next.js Frontend
poe nextjs-install            # Install Node.js dependencies
poe nextjs                    # Start Next.js development server
poe nextjs-build              # Build Next.js for production
poe nextjs-start              # Start Next.js production server
```

## 📝 Notes

- **Streamlit Frontend**: Good for rapid prototyping, but limited for complex UIs
- **Next.js Frontend**: Better for production applications with complex interactions
- This is a proof-of-concept with mock data
- Document processing is simulated
- Ready for integration with real document processing and embedding services
- Both frontends share the same FastAPI backend 