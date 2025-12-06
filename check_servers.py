#!/usr/bin/env python3
"""Check if all backend servers are running."""
import requests
import time

print("=" * 60)
print("Checking All Backend Servers Status...")
print("=" * 60)

# Check Node.js Backend (5000)
try:
    r0 = requests.get('http://localhost:5000/api/health', timeout=5)
    print(f"OK Node.js Backend (5000): Running")
except Exception as e:
    print(f"X Node.js Backend (5000): Not responding - {str(e)[:50]}")

# Check Gamification Server (8000)
try:
    r1 = requests.get('http://localhost:8000/', timeout=5)
    data1 = r1.json()
    print(f"OK Gamification Server (8000): {data1.get('name', 'OK')}")
except Exception as e:
    print(f"X Gamification Server (8000): Not responding - {str(e)[:50]}")

# Check ML Server (8001)
try:
    r2 = requests.get('http://localhost:8001/', timeout=5)
    data2 = r2.json()
    print(f"OK ML Server (8001): {data2.get('title', 'OK')}")
except Exception as e:
    print(f"X ML Server (8001): Not responding - {str(e)[:50]}")

print("=" * 60)
print("Summary:")
print("  - Node.js Backend: http://localhost:5000")
print("  - Gamification API: http://localhost:8000")
print("  - ML/AQI API: http://localhost:8001")
print("=" * 60)

