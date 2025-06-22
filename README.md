# Knowledge Base Platform

A modern knowledge base platform built with Next.js frontend and FastAPI backend for managing RAG (Retrieval-Augmented Generation) workflows.

## Project Structure

```
kb-platform/
├── backend/              # FastAPI backend
│   ├── api/             # API client utilities
│   ├── main.py          # FastAPI application
│   ├── models.py        # Pydantic models
│   ├── data.py          # Data access layer
│   └── storage.py       # Storage system
├── frontend/
│   └── nextjs/          # Next.js frontend
│       ├── app/         # Next.js App Router
│       ├── components/  # React components
│       └── lib/         # Utilities and API client
├── data/                # JSON storage files
├── pyproject.toml       # Poetry configuration
└── README.md           # This file
```

## Features

- **Modern UI**: Clean, minimal design with Next.js 15 and React 19
- **Type Safety**: Full TypeScript support
- **Real-time Updates**: Client-side state management
- **Document Management**: Upload, process, and manage documents
- **Knowledge Base Management**: Create and manage knowledge bases
- **Project Organization**: Multi-project support
- **RAG Workflows**: Support for document processing and embedding

## Prerequisites

- Python 3.11+
- Node.js 24+
- Poetry (for Python dependency management)
- npm (for Node.js dependency management)

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd kb-platform
   ```

2. **Install Python dependencies**:
   ```bash
   poetry install
   ```

3. **Install Node.js dependencies**:
   ```bash
   cd frontend/nextjs
   npm install
   cd ../..
   ```

4. **Start the backend**:
   ```bash
   poe backend
   ```

5. **Start the frontend** (in a new terminal):
   ```bash
   poe nextjs
   ```

6. **Open your browser**:
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

## Development

### Backend Development

The backend is built with FastAPI and provides:

- RESTful API endpoints
- Automatic API documentation
- Type validation with Pydantic
- JSON file storage system
- CORS support for frontend integration

**Key Endpoints**:
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/{id}/knowledge-bases` - List KBs for a project
- `POST /api/projects/{id}/knowledge-bases` - Create a KB
- `GET /api/knowledge-bases/{id}/documents` - List documents for a KB
- `POST /api/knowledge-bases/{id}/documents/upload` - Upload a document

### Frontend Development

The frontend is built with Next.js 15 and React 19:

- **Modern Architecture**: App Router with server and client components
- **Type Safety**: Full TypeScript support
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks and localStorage
- **API Integration**: Type-safe API client

**Key Components**:
- `UserMenu` - Project selection and management
- `KnowledgeBases` - KB creation and management
- `Documents` - Document upload and status tracking
- `Dashboard` - Overview and analytics
- `Sidebar` - Navigation and KB selection

## Available Commands

### Backend
```bash
poe backend                  # Start FastAPI backend
```

### Frontend
```bash
poe nextjs                  # Start Next.js development server
poe nextjs-install          # Clean install of Node.js dependencies
poe nextjs-build            # Build for production
poe nextjs-start            # Start production server
```

## Architecture

### Backend Architecture
- **FastAPI**: Modern, fast web framework
- **Pydantic**: Data validation and serialization
- **Storage**: Hybrid in-memory and JSON file storage
- **CORS**: Cross-origin resource sharing for frontend

### Frontend Architecture
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **API Client**: Type-safe HTTP client for backend communication

## Data Flow

1. **Project Selection**: User selects or creates a project
2. **Knowledge Base Management**: Create and manage KBs within projects
3. **Document Upload**: Upload documents to specific KBs
4. **Processing**: Documents are processed and chunked
5. **Status Tracking**: Real-time status updates for document processing

## Storage

The platform uses a hybrid storage approach:
- **In-Memory**: Fast access for active data
- **JSON Files**: Persistent storage in the `data/` directory
- **Automatic Sync**: Data is automatically saved and loaded

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the API documentation at http://localhost:8000/docs
- Review the component documentation in the codebase
- Open an issue for bugs or feature requests 