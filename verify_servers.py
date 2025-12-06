"""
Verify all servers are running and responding correctly
"""
import requests
import time
import sys

def test_endpoint(url, name, timeout=5):
    """Test an endpoint and return True if successful"""
    try:
        response = requests.get(url, timeout=timeout)
        if response.status_code == 200:
            print(f"[OK] {name}: OK (Status: {response.status_code})")
            return True
        else:
            print(f"[!] {name}: Unexpected status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"[X] {name}: Connection refused (server not running)")
        return False
    except requests.exceptions.Timeout:
        print(f"[!] {name}: Timeout (server may be starting)")
        return False
    except Exception as e:
        print(f"[X] {name}: Error - {str(e)}")
        return False

def main():
    print("=" * 60)
    print("Server Verification Script")
    print("=" * 60)
    print()
    
    # Wait a bit for servers to start
    print("Waiting 5 seconds for servers to initialize...")
    time.sleep(5)
    print()
    
    results = []
    
    # Test Gamification Server (Port 8000)
    print("[1/4] Testing Gamification Server...")
    results.append(("Gamification Server", test_endpoint("http://localhost:8000/health", "Gamification Server")))
    print()
    
    # Test ML/AQI Forecasting Server (Port 8001)
    print("[2/4] Testing ML/AQI Forecasting Server...")
    results.append(("ML Server", test_endpoint("http://localhost:8001/health", "ML Server")))
    print()
    
    # Test Node.js Backend (Port 5000)
    print("[3/4] Testing Node.js Backend...")
    # Try common health endpoints
    backend_ok = False
    for endpoint in ["/api/health", "/health", "/"]:
        if test_endpoint(f"http://localhost:5000{endpoint}", f"Node.js Backend ({endpoint})"):
            backend_ok = True
            break
    results.append(("Node.js Backend", backend_ok))
    print()
    
    # Test Frontend (Port 3000)
    print("[4/4] Testing Frontend...")
    results.append(("Frontend", test_endpoint("http://localhost:3000", "Frontend")))
    print()
    
    # Summary
    print("=" * 60)
    print("Verification Summary")
    print("=" * 60)
    
    all_ok = True
    for name, status in results:
        status_icon = "[OK]" if status else "[X]"
        print(f"{status_icon} {name}: {'Running' if status else 'Not Responding'}")
        if not status:
            all_ok = False
    
    print()
    if all_ok:
        print("[SUCCESS] All servers are running correctly!")
        return 0
    else:
        print("[WARNING] Some servers are not responding. Check the server windows for errors.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

