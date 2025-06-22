#!/usr/bin/env python3
"""
Backend startup script for RAG Knowledge Base Platform
"""

import subprocess
import sys
from pathlib import Path

def main():
    """Start the FastAPI backend application"""
    
    # Get the project root directory
    project_root = Path(__file__).parent
    
    # Add the project root to Python path
    sys.path.insert(0, str(project_root))
    
    # Start uvicorn with the backend main app
    cmd = [
        sys.executable, "-m", "uvicorn",
        "backend.main:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--reload"
    ]
    
    print("🚀 Starting Knowledge Base API backend...")
    print("📖 API Documentation will be available at: http://localhost:8000/docs")
    print("🔍 Health check available at: http://localhost:8000/health")
    print("⏹️  Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n👋 Backend stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Backend failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 