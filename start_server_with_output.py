#!/usr/bin/env python3
"""Start gamification server and show output."""
import subprocess
import sys
import os

# Change to project directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Start server
print("Starting Gamification Server...")
print("=" * 60)
try:
    subprocess.run([sys.executable, "gamification_server.py"], check=False)
except KeyboardInterrupt:
    print("\nServer stopped by user")
except Exception as e:
    print(f"Error: {e}")

