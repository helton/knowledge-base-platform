#!/usr/bin/env python3
"""
Startup script for the Knowledge Base API backend
"""

import uvicorn

if __name__ == "__main__":
    print("🚀 Starting Knowledge Base API backend...")
    print("📖 API Documentation will be available at: http://localhost:8000/docs")
    print("🔍 Health check available at: http://localhost:8000/health")
    print("⏹️  Press Ctrl+C to stop the server")
    print("-" * 50)
    
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 