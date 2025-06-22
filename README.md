# Knowledge Base Streamlit App

A modern Streamlit application for managing knowledge bases and documents with a FastAPI backend.

## Features

- **User Account Management**: Select and switch between different projects
- **Knowledge Base Management**: List, view, and manage knowledge bases
- **Version Control**: Select different versions for each knowledge base
- **Modern UI**: Clean and intuitive interface with sidebar navigation
- **FastAPI Backend**: RESTful API for data management

## Project Structure

```
kb-streamlit/
├── app/
│   ├── __init__.py
│   ├── main.py              # Streamlit main application
│   ├── components/          # Reusable UI components
│   │   ├── __init__.py
│   │   ├── sidebar.py       # Sidebar navigation
│   │   ├── header.py        # Header with user menu
│   │   └── kb_list.py       # Knowledge base list component
│   └── api/
│       ├── __init__.py
│       └── client.py        # API client for backend communication
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI backend server
│   ├── models.py            # Pydantic models
│   └── data.py              # Mock data and business logic
├── pyproject.toml           # Poetry configuration
└── README.md
```

## Setup

1. **Install Poetry** (if not already installed):
   ```bash
   pip install poetry
   ```

2. **Install dependencies**:
   ```bash
   poetry install
   ```

3. **Run the backend server**:
   ```bash
   poetry run python backend/main.py
   ```

4. **Run the Streamlit app** (in a new terminal):
   ```bash
   poetry run streamlit run app/main.py
   ```

## Usage

1. Open your browser and navigate to `http://localhost:8501`
2. Use the user menu in the top-right corner to select your project
3. Use the sidebar to navigate between different knowledge bases
4. Select different versions for each knowledge base as needed

## Development

- **Backend API**: Runs on `http://localhost:8000`
- **Streamlit App**: Runs on `http://localhost:8501`
- **API Documentation**: Available at `http://localhost:8000/docs`

## API Endpoints

- `GET /projects` - List all projects
- `GET /projects/{project_id}/knowledge-bases` - List knowledge bases for a project
- `GET /knowledge-bases/{kb_id}/versions` - List versions for a knowledge base
- `GET /knowledge-bases/{kb_id}/versions/{version_id}` - Get specific version details 