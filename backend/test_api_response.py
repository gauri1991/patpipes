#!/usr/bin/env python
"""
Test script to check API response structure with authentication
"""
import requests
import json

def get_auth_token():
    """Get authentication token"""
    # Try different credential combinations
    login_options = [
        {'username': 'admin', 'password': 'admin123'},
        {'username': 'admin', 'password': 'admin'},
        {'username': 'test@example.com', 'password': 'password123'},
        {'email': 'test@example.com', 'password': 'password123'},
        {'username': 'testuser', 'password': 'testpass123'},
    ]
    
    for login_data in login_options:
        try:
            print(f"Trying login with: {login_data}")
            response = requests.post('http://localhost:8000/api/v1/accounts/auth/login/', json=login_data)
            if response.status_code == 200:
                print(f"Login successful!")
                response_data = response.json()
                print(f"Login response keys: {list(response_data.keys())}")
                
                # Try different token locations
                token = (response_data.get('access') or 
                        response_data.get('token') or 
                        response_data.get('access_token'))
                
                # Check if tokens is an object
                if not token and 'tokens' in response_data:
                    tokens = response_data['tokens']
                    print(f"Tokens object keys: {list(tokens.keys()) if isinstance(tokens, dict) else 'Not a dict'}")
                    token = (tokens.get('access') if isinstance(tokens, dict) else None) or \
                           (tokens.get('access_token') if isinstance(tokens, dict) else None) or \
                           (tokens.get('accessToken') if isinstance(tokens, dict) else None)
                
                print(f"Got token: {bool(token)}")
                return token
            else:
                print(f"Login failed: {response.status_code} - {response.text[:200]}")
        except Exception as e:
            print(f"Login error: {e}")
    
    return None

def test_projects_api_authenticated():
    """Test projects API with authentication"""
    try:
        # First, get auth token
        token = get_auth_token()
        if not token:
            print("Could not get authentication token")
            return
            
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get('http://localhost:8000/api/v1/analytics/api/projects/', headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Length: {len(response.text)} characters")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Type: {type(data)}")
            
            if isinstance(data, dict):
                print(f"Response Keys: {list(data.keys())}")
                if 'results' in data:
                    print(f"Results Type: {type(data['results'])}")
                    print(f"Results Length: {len(data['results']) if isinstance(data['results'], list) else 'Not a list'}")
                    if isinstance(data['results'], list) and len(data['results']) > 0:
                        print(f"First Project Keys: {list(data['results'][0].keys())}")
                        print(f"First Project Name: {data['results'][0].get('name', 'No name')}")
                        print(f"First Project ID: {data['results'][0].get('id', 'No ID')}")
                        # Show a couple more projects
                        for i, project in enumerate(data['results'][:3]):
                            print(f"Project {i+1}: {project.get('name', 'No name')} (status: {project.get('status', 'No status')})")
                elif 'count' in data:
                    print(f"Paginated response with count: {data['count']}")
                else:
                    print(f"Unknown dict structure: {data}")
            elif isinstance(data, list):
                print(f"Direct Array Length: {len(data)}")
                if len(data) > 0:
                    print(f"First Project Keys: {list(data[0].keys())}")
                    print(f"First Project Name: {data[0].get('name', 'No name')}")
                    print(f"First Project ID: {data[0].get('id', 'No ID')}")
                    # Show a couple more projects
                    for i, project in enumerate(data[:3]):
                        print(f"Project {i+1}: {project.get('name', 'No name')} (status: {project.get('status', 'No status')})")
            else:
                print(f"Unexpected response type: {type(data)}")
        else:
            print(f"Error Response: {response.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")

def test_projects_api_unauthenticated():
    """Test projects API without authentication"""
    try:
        response = requests.get('http://localhost:8000/api/v1/analytics/api/projects/')
        print(f"Unauthenticated Status Code: {response.status_code}")
        print(f"Unauthenticated Response Length: {len(response.text)} characters")
        
        if response.status_code != 200:
            print(f"Unauthenticated Error Response: {response.text[:200]}")
    except Exception as e:
        print(f"Unauthenticated Error: {e}")

if __name__ == '__main__':
    print("=== Testing API with authentication ===")
    test_projects_api_authenticated()
    print("\n=== Testing API without authentication ===")
    test_projects_api_unauthenticated()