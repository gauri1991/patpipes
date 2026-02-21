#!/usr/bin/env python3
"""
Create sample template data for testing
"""

import os
import sys
import django

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from domains.analytics.models import Template

User = get_user_model()

def create_sample_templates():
    """Create sample templates for testing"""
    
    # Get or create a user for the templates
    try:
        user = User.objects.first()
        if not user:
            user = User.objects.create_user(
                username='admin',
                email='admin@example.com',
                password='admin123',
                first_name='System',
                last_name='Admin'
            )
            print(f"Created user: {user.username}")
    except Exception as e:
        print(f"Using existing user: {e}")
        user = User.objects.first()
    
    if not user:
        print("No user found - creating default user")
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='test123'
        )
    
    # Sample templates data
    templates_data = [
        {
            'name': 'Patent Filing Timeline',
            'description': 'Track patent filings over time periods with trend analysis',
            'template_type': 'chart',
            'category': 'Temporal Analysis',
            'icon': 'LineChart',
            'scope': 'organization',
            'tags': ['patents', 'timeline', 'trends', 'filing'],
            'is_public': True,
            'usage_count': 156,
            'chart_type': 'line',
            'config': {
                'chart_type': 'line',
                'x_axis': 'filing_date',
                'y_axis': 'patent_count',
                'color_by': 'technology_area',
                'aggregation': 'sum',
                'layout': {
                    'legend_position': 'bottom',
                    'grid': True
                },
                'styling': {
                    'color_scheme': 'blue',
                    'animations': True,
                    'interactive': True
                }
            }
        },
        {
            'name': 'Technology Landscape Map',
            'description': 'Visualize technology areas and their relationships',
            'template_type': 'chart',
            'category': 'Technology Analysis',
            'icon': 'Network',
            'scope': 'organization',
            'tags': ['technology', 'landscape', 'innovation', 'relationships'],
            'is_public': True,
            'usage_count': 89,
            'chart_type': 'network',
            'config': {
                'chart_type': 'network',
                'layout': {
                    'legend_position': 'right',
                    'grid': False
                },
                'styling': {
                    'color_scheme': 'purple',
                    'animations': True,
                    'interactive': True
                }
            }
        },
        {
            'name': 'Competitive Intelligence Report',
            'description': 'Comprehensive analysis of competitor patent portfolios',
            'template_type': 'report',
            'category': 'Competitive Analysis',
            'icon': 'Target',
            'scope': 'organization',
            'tags': ['competitive', 'intelligence', 'analysis', 'portfolio'],
            'is_public': True,
            'usage_count': 134,
            'report_type': 'competitive_intelligence',
            'config': {
                'sections': [
                    'executive_summary',
                    'market_overview',
                    'competitor_analysis',
                    'technology_trends',
                    'recommendations'
                ],
                'formatting': {
                    'style': 'professional',
                    'include_charts': True,
                    'include_tables': True
                },
                'export_options': ['pdf', 'word', 'powerpoint']
            }
        },
        {
            'name': 'Innovation Dashboard',
            'description': 'Real-time dashboard for innovation project tracking',
            'template_type': 'dashboard',
            'category': 'Project Management',
            'icon': 'Layout',
            'scope': 'organization',
            'tags': ['innovation', 'dashboard', 'projects', 'tracking'],
            'is_public': True,
            'usage_count': 78,
            'config': {
                'layout': 'grid',
                'widgets': [
                    {
                        'id': 'w1',
                        'type': 'chart',
                        'title': 'Innovation Pipeline',
                        'position': {'x': 0, 'y': 0, 'w': 8, 'h': 3},
                        'config': {'chart_type': 'gantt', 'data_source': 'innovation_projects'}
                    },
                    {
                        'id': 'w2',
                        'type': 'metric',
                        'title': 'Active Projects',
                        'position': {'x': 8, 'y': 0, 'w': 4, 'h': 1},
                        'config': {'metric': 'active_projects', 'format': 'number'}
                    }
                ],
                'refresh_interval': 600000
            }
        },
        {
            'name': 'Patent Application Workflow',
            'description': 'Standard workflow for patent application process',
            'template_type': 'workflow',
            'category': 'Process Management',
            'icon': 'GitBranch',
            'scope': 'organization',
            'tags': ['workflow', 'patent', 'application', 'process'],
            'is_public': True,
            'usage_count': 45,
            'config': {
                'steps': [
                    {
                        'id': 'invention_disclosure',
                        'name': 'Invention Disclosure',
                        'type': 'form',
                        'required_fields': ['title', 'description', 'inventors']
                    },
                    {
                        'id': 'prior_art_search',
                        'name': 'Prior Art Search',
                        'type': 'task',
                        'assigned_role': 'patent_analyst'
                    },
                    {
                        'id': 'patent_draft',
                        'name': 'Patent Drafting',
                        'type': 'task',
                        'assigned_role': 'patent_attorney'
                    },
                    {
                        'id': 'review_approval',
                        'name': 'Review and Approval',
                        'type': 'approval',
                        'approvers': ['legal_team', 'management']
                    }
                ],
                'triggers': [
                    {
                        'event': 'form_submitted',
                        'action': 'assign_next_task'
                    }
                ]
            }
        }
    ]
    
    created_count = 0
    for template_data in templates_data:
        try:
            # Check if template already exists
            existing = Template.objects.filter(
                name=template_data['name'], 
                created_by=user
            ).first()
            
            if existing:
                print(f"Template '{template_data['name']}' already exists, skipping...")
                continue
            
            # Create the template
            template = Template.objects.create(
                created_by=user,
                **template_data
            )
            
            print(f"Created template: {template.name} ({template.template_type})")
            created_count += 1
            
        except Exception as e:
            print(f"Error creating template '{template_data['name']}': {e}")
    
    print(f"\nCreated {created_count} templates successfully!")
    print(f"Total templates in database: {Template.objects.count()}")

if __name__ == '__main__':
    create_sample_templates()