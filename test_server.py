#!/usr/bin/env python3
"""Test if gamification server is running correctly."""
import requests
import time

time.sleep(5)  # Wait for server to start

try:
    r = requests.get('http://localhost:8000/', timeout=10)
    data = r.json()
    
    print("=" * 60)
    print("SERVER STATUS CHECK")
    print("=" * 60)
    print(f"Status Code: {r.status_code}")
    print(f"Server Name: {data.get('name', 'Unknown')}")
    print(f"Version: {data.get('version', 'Unknown')}")
    
    endpoints = data.get('endpoints', {})
    alerts_endpoints = [k for k in endpoints.keys() if 'alerts' in k]
    
    print(f"\nAlerts Endpoints Found: {len(alerts_endpoints)}")
    for ep in alerts_endpoints:
        print(f"  - {ep}: {endpoints[ep]}")
    
    if 'DelhiBreathes Gamification' in str(data.get('name', '')):
        print("\n✅ SUCCESS: Gamification Server is running!")
    else:
        print("\n❌ WARNING: Wrong server on port 8000")
        print("   Expected: DelhiBreathes Gamification Engine")
        print(f"   Got: {data.get('name', 'Unknown')}")
    
    print("=" * 60)
except Exception as e:
    print(f"❌ ERROR: {e}")
    print("Server is not responding on port 8000")

