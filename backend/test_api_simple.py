#!/usr/bin/env python
"""Test API response for analytics projects"""

import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from domains.analytics.views import AnalyticsProjectViewSet

# Create a request factory
factory = RequestFactory()

# Create a GET request
request = factory.get('/api/v1/analytics/api/projects/')

# Create the view
view = AnalyticsProjectViewSet.as_view({'get': 'list'})

try:
    # Get the response
    response = view(request)
    
    if response.status_code == 200:
        data = response.data
        if hasattr(data, 'get') and 'results' in data:
            # Paginated response
            projects = data['results']
            print(f"✓ API returned {data.get('count', len(projects))} total projects")
            if projects:
                print(f"✓ First project: {projects[0].get('name', 'No name')}")
        else:
            # Direct list response
            print(f"✓ API returned {len(data)} projects")
            if data:
                print(f"✓ First project: {data[0].get('name', 'No name')}")
    else:
        print(f"✗ API returned status {response.status_code}")
        print(f"  Response: {response.data}")
        
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()