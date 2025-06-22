#!/usr/bin/env python3
"""
Startup script for the Knowledge Base Streamlit frontend
"""

import os
import sys
import subprocess

if __name__ == "__main__":
    # Add current directory to Python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, current_dir)
    
    print("🚀 Starting Knowledge Base Streamlit frontend...")
    print("🌐 App will be available at: http://localhost:8501")
    print("⏹️  Press Ctrl+C to stop the server")
    print("-" * 50)
    
    # Run streamlit
    subprocess.run([
        sys.executable, "-m", "streamlit", "run", "app/main.py",
        "--server.port", "8501",
        "--server.address", "localhost"
    ]) 