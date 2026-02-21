#!/usr/bin/env python
"""
Test JWT authentication
"""
import os
import sys
import django
import requests

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_auth():
    """Test authentication flow"""
    print("Testing JWT Authentication...")
    print("-" * 80)

    # Test 1: Login as admin
    print("\nTest 1: Login as admin")
    login_url = "http://localhost:8000/api/v1/accounts/auth/login/"
    login_data = {
        "email": "admin@patpipes.com",
        "password": "admin123"
    }

    response = requests.post(login_url, json=login_data)
    if response.status_code == 200:
        data = response.json()
        print(f"  ✓ Login successful")
        print(f"  Response data: {data}")
        access_token = data.get('access_token') or data.get('access')
        if not access_token:
            print(f"  ✗ No access token in response")
            return False
        print(f"  Access token: {access_token[:50]}...")
    else:
        print(f"  ✗ Login failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return False

    # Test 2: Access protected endpoint with token
    print("\nTest 2: Access permission matrix endpoint")
    matrix_url = "http://localhost:8000/api/v1/accounts/permissions/roles/matrix/"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    response = requests.get(matrix_url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"  ✓ GET request successful")
        print(f"  Found {len(data['matrix'])} roles")
    else:
        print(f"  ✗ GET request failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return False

    # Test 3: Update permissions (PUT request)
    print("\nTest 3: Update permission matrix")
    update_data = {
        "permissions": {
            "client": [
                "dashboard_access",
                "profile_management",
                "notifications",
                "projects_view",
                "patents_view",
                "analytics_view",
                "team_collaboration",
                "document_sharing",
                "comments_reviews",
                "file_download",
                "sidebar_dashboard",
                "sidebar_projects",
                "sidebar_patents",
                "sidebar_settings",
                "sidebar_workflows"  # Adding this as test
            ]
        }
    }

    response = requests.put(matrix_url, json=update_data, headers=headers)
    if response.status_code == 200:
        print(f"  ✓ PUT request successful")
        print(f"  Response: {response.json()}")
    else:
        print(f"  ✗ PUT request failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return False

    print("\n" + "-" * 80)
    print("✓ All authentication tests passed!")
    return True


if __name__ == '__main__':
    try:
        success = test_auth()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
