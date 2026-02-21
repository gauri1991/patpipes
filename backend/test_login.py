#!/usr/bin/env python
import requests
import json

# Test login endpoint
url = "http://localhost:8000/api/v1/accounts/auth/login/"
data = {
    "username": "admin",
    "password": "admin123"
}

print(f"Testing login at: {url}")
print(f"Credentials: username='{data['username']}', password='{'*' * len(data['password'])}'")

try:
    response = requests.post(url, json=data)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        print(f"\n✓ Login successful!")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"\n✗ Login failed!")
        print(f"Response: {response.text}")
        
except requests.exceptions.ConnectionError as e:
    print(f"\n✗ Connection error: {e}")
except Exception as e:
    print(f"\n✗ Error: {e}")