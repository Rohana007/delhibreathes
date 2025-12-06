#!/usr/bin/env python3
"""
Quick check script to verify Gamification Server is running.
"""
import requests
import sys

def check_server(url="http://localhost:8000"):
    try:
        response = requests.get(f"{url}/health", timeout=2)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Gamification Server is RUNNING on {url}")
            print(f"   Status: {data.get('status', 'unknown')}")
            print(f"   Database: {data.get('database', 'unknown')}")
            return True
        else:
            print(f"❌ Server responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Gamification Server is NOT RUNNING on {url}")
        print(f"   Please start it with: python gamification_server.py")
        return False
    except Exception as e:
        print(f"❌ Error checking server: {e}")
        return False

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    success = check_server(url)
    sys.exit(0 if success else 1)

