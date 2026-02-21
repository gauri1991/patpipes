#!/usr/bin/env python
import requests
import json

# Test login endpoint
backend_url = "http://192.168.29.81:8000/api/v1/accounts/auth/login/"
data = {
    "username": "admin",
    "password": "admin123"
}

print(f"Testing backend login at: {backend_url}")
print(f"Credentials: username='{data['username']}', password='{'*' * len(data['password'])}'")

try:
    response = requests.post(backend_url, json=data)
    print(f"\nBackend Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print(f"✓ Backend login successful!")
        result = response.json()
        print(f"Access Token: {result['tokens']['accessToken'][:50]}...")
        print(f"User: {result['user']['email']}")
        print(f"Role: {result['user']['role']}")
        
        print("\n" + "="*50)
        print("Frontend Access URLs:")
        print("Port 3000: http://192.168.29.81:3000/login")
        print("Port 3001: http://192.168.29.81:3001/login")
        print("\nUse the same credentials (admin/admin123) on the frontend login page")
    else:
        print(f"✗ Backend login failed!")
        print(f"Response: {response.text}")
        
except requests.exceptions.ConnectionError as e:
    print(f"\n✗ Connection error: Cannot reach backend server")
    print(f"Error: {e}")
except Exception as e:
    print(f"\n✗ Error: {e}")