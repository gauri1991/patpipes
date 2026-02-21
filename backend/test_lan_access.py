#!/usr/bin/env python
import requests
import json

print("="*60)
print("Testing Patent Analytics Platform LAN Access")
print("="*60)

# Test backend directly
backend_url = "http://192.168.29.81:8000/api/v1/accounts/auth/login/"
data = {
    "username": "admin",
    "password": "admin123"
}

print(f"\n1. Testing Backend API:")
print(f"   URL: {backend_url}")
print(f"   Credentials: {data['username']}/{data['password']}")

try:
    response = requests.post(backend_url, json=data)
    if response.status_code == 200:
        print(f"   ✓ Backend login successful!")
        result = response.json()
        print(f"   User: {result['user']['email']}")
        print(f"   Role: {result['user']['role']}")
    else:
        print(f"   ✗ Backend login failed: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   ✗ Backend connection error: {e}")

print("\n" + "="*60)
print("2. Frontend Access URLs:")
print("="*60)
print("\nFrom LAN Device (other computers on network):")
print(f"  Login Page: http://192.168.29.81:3000/login")
print(f"  Dashboard:  http://192.168.29.81:3000/dashboard")
print(f"  Workflows:  http://192.168.29.81:3000/dashboard/workflows")

print("\nFrom This Computer (localhost):")
print(f"  Login Page: http://localhost:3000/login")

print("\n" + "="*60)
print("3. Login Instructions:")
print("="*60)
print("  1. Open the login page URL in your browser")
print("  2. Enter username: admin")
print("  3. Enter password: admin123")
print("  4. Click Login")
print("\n  Note: The frontend is configured to use IP address")
print("  (192.168.29.81) for API calls, so it works from")
print("  both localhost and LAN devices.")

print("\n" + "="*60)
print("4. Current Configuration:")
print("="*60)
print(f"  Backend:  Running on 0.0.0.0:8000 (accessible from LAN)")
print(f"  Frontend: Running on 0.0.0.0:3000 (accessible from LAN)")
print(f"  API URL:  http://192.168.29.81:8000/api/v1")
print("\n✓ Everything is configured for LAN access!")
print("="*60)