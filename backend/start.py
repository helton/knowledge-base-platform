#!/usr/bin/env python3
"""
Start the backend server with improved shutdown handling
"""

import uvicorn
import sys
import os
import signal
import socket
import time
import subprocess
import psutil

# Add the backend directory to the Python path
# sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def is_port_in_use(port):
    """Check if a port is already in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def kill_process_on_port(port):
    """Kill any process using the specified port"""
    try:
        # Find processes using the port
        for proc in psutil.process_iter(['pid', 'name', 'connections']):
            try:
                for conn in proc.info['connections']:
                    if conn.laddr.port == port:
                        print(f"Killing process {proc.info['pid']} ({proc.info['name']}) using port {port}")
                        proc.terminate()
                        proc.wait(timeout=5)  # Wait up to 5 seconds for graceful shutdown
                        return True
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.TimeoutExpired):
                continue
    except Exception as e:
        print(f"Error killing process on port {port}: {e}")
    return False

def wait_for_port_free(port, timeout=10):
    """Wait for port to become free"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        if not is_port_in_use(port):
            return True
        time.sleep(0.5)
    return False

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    print("\n🛑 Shutting down server gracefully...")
    sys.exit(0)

if __name__ == "__main__":
    PORT = 8000
    
    # Set up signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("🚀 Starting Knowledge Base Backend Server...")
    print("📁 Storage system initialized with default data")
    print(f"🌐 API will be available at: http://localhost:{PORT}")
    print(f"📚 API docs will be available at: http://localhost:{PORT}/docs")
    
    # Check if port is already in use
    if is_port_in_use(PORT):
        print(f"⚠️  Port {PORT} is already in use. Attempting to free it...")
        if kill_process_on_port(PORT):
            print("✅ Killed existing process")
            if not wait_for_port_free(PORT):
                print(f"❌ Failed to free port {PORT} within timeout")
                sys.exit(1)
        else:
            print(f"❌ Could not free port {PORT}. Please manually stop the process using it.")
            print("💡 You can find and kill the process with:")
            print(f"   lsof -ti:{PORT} | xargs kill -9")
            sys.exit(1)
    
    print("\n🎯 Server is starting...")
    print("Press Ctrl+C to stop the server")
    
    try:
        uvicorn.run(
            "backend.main:app",
            host="0.0.0.0",
            port=PORT,
            reload=True,
            log_level="info",
            access_log=True,
            # Improved shutdown handling
            loop="asyncio",
            # Faster reload
            reload_dirs=["backend"],
            reload_excludes=["*.pyc", "__pycache__", "*.log"],
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1) 