#!/usr/bin/env python3
"""
Quick test script to verify alerts server is working.
"""
import requests
import sys

def test_server():
    url = "http://localhost:8001"
    
    print("Testing Gamification Server...")
    print("=" * 50)
    
    # Test 1: Root endpoint
    try:
        r = requests.get(f"{url}/", timeout=5)
        if r.status_code == 200:
            data = r.json()
            print("✅ Server is RUNNING")
            print(f"   Name: {data.get('name', 'Unknown')}")
            print(f"   Status: {data.get('status', 'Unknown')}")
            
            endpoints = data.get('endpoints', {})
            if 'alerts_status' in endpoints:
                print("✅ Alerts endpoints are available")
                print(f"   - Status: {endpoints.get('alerts_status')}")
                print(f"   - Enable: {endpoints.get('alerts_enable')}")
            else:
                print("❌ Alerts endpoints NOT found")
            
            return True
        else:
            print(f"❌ Server returned status {r.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Server is NOT RUNNING")
        print("   Please start it with: python gamification_server.py")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_server()
    sys.exit(0 if success else 1)

