#!/usr/bin/env python3
"""
Frontend startup script for RAG Knowledge Base Platform
"""

import subprocess
import sys
from pathlib import Path

def main():
    """Start the Streamlit frontend application"""
    
    # Get the project root directory
    project_root = Path(__file__).parent
    
    # Add the project root to Python path
    sys.path.insert(0, str(project_root))
    
    # Start Streamlit with the frontend main app
    cmd = [
        sys.executable, "-m", "streamlit", "run",
        str(project_root / "frontend" / "main.py"),
        "--server.port", "8501",
        "--server.address", "localhost"
    ]
    
    print("🚀 Starting RAG Knowledge Base Platform Frontend...")
    print("📖 Frontend will be available at: http://localhost:8501")
    print("⏹️  Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        subprocess.run(cmd, check=True)
    except KeyboardInterrupt:
        print("\n👋 Frontend stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 