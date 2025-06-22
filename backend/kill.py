#!/usr/bin/env python3
"""
Quick script to kill any process using port 8000
"""

import socket
import subprocess
import sys

def kill_port_8000():
    """Kill any process using port 8000"""
    try:
        # Check if port 8000 is in use
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('localhost', 8000)) == 0:
                print("🔍 Port 8000 is in use. Finding and killing process...")
                
                # Use lsof to find the process
                result = subprocess.run(
                    ['lsof', '-ti:8000'], 
                    capture_output=True, 
                    text=True
                )
                
                if result.stdout.strip():
                    pids = result.stdout.strip().split('\n')
                    for pid in pids:
                        if pid:
                            print(f"💀 Killing process {pid}")
                            subprocess.run(['kill', '-9', pid])
                    
                    print("✅ Killed all processes on port 8000")
                else:
                    print("❌ Could not find process using port 8000")
            else:
                print("✅ Port 8000 is free")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        print("💡 Try running manually:")
        print("   lsof -ti:8000 | xargs kill -9")

if __name__ == "__main__":
    kill_port_8000() 