#!/usr/bin/env python
"""
Create basic analytics projects using Django ORM
"""
import os
import sys
import django
from datetime import datetime, timedelta
import uuid

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.analytics.models import AnalyticsProject
from django.contrib.auth import get_user_model

User = get_user_model()

def create_sample_projects():
    """Create sample analytics projects"""
    print("Creating sample analytics projects...")
    
    # Get or create a user
    try:
        user = User.objects.first()
        if not user:
            user = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='testpass123'
            )
            print("Created test user")
        print(f"Using user: {user.username}")
    except Exception as e:
        print(f"Error with user setup: {e}")
        return
    
    # Sample project data
    projects_data = [
        {
            'name': 'AI Patent Landscape Analysis 2024',
            'description': 'Comprehensive analysis of artificial intelligence patents filed in 2024',
            'status': 'active',
            'priority': 'high',
            'analysis_scope': {
                'type': 'landscape_analysis',
                'technology_areas': ['AI', 'Machine Learning'],
                'keywords': ['artificial intelligence', 'neural networks', 'deep learning'],
                'date_range_start': '2024-01-01',
                'date_range_end': '2024-12-31',
                'jurisdictions': ['US', 'EP', 'CN'],
                'research_goals': ['Market opportunity assessment', 'Competitive landscape mapping']
            },
            'due_date': datetime.now() + timedelta(days=30),
        },
        {
            'name': 'Biotech Competition Intelligence',
            'description': 'Competitive intelligence analysis for biotechnology sector',
            'status': 'data_collection',
            'priority': 'medium',
            'analysis_scope': {
                'type': 'competitive_intelligence',
                'technology_areas': ['Biotechnology', 'Pharmaceuticals'],
                'keywords': ['gene therapy', 'CRISPR', 'biomarkers'],
                'date_range_start': '2023-01-01',
                'date_range_end': '2024-06-30',
                'jurisdictions': ['US', 'EP'],
                'research_goals': ['Competitive landscape mapping', 'Technology trend identification']
            },
            'due_date': datetime.now() + timedelta(days=45),
        },
        {
            'name': 'Renewable Energy FTO Study',
            'description': 'Freedom to operate analysis for renewable energy technologies',
            'status': 'completed',
            'priority': 'high',
            'analysis_scope': {
                'type': 'fto_analysis',
                'technology_areas': ['Solar Energy', 'Wind Energy'],
                'keywords': ['photovoltaic', 'wind turbine', 'energy storage'],
                'date_range_start': '2020-01-01',
                'date_range_end': '2024-01-01',
                'jurisdictions': ['US', 'EP', 'JP'],
                'research_goals': ['Freedom to operate analysis', 'Patent portfolio evaluation']
            },
            'due_date': datetime.now() - timedelta(days=10),
        },
        {
            'name': 'Quantum Computing Trends',
            'description': 'Technology trends analysis in quantum computing',
            'status': 'draft',
            'priority': 'medium',
            'analysis_scope': {
                'type': 'technology_trends',
                'technology_areas': ['Quantum Computing', 'Quantum Algorithms'],
                'keywords': ['quantum', 'qubit', 'quantum algorithm'],
                'date_range_start': '2022-01-01',
                'date_range_end': '2024-12-31',
                'jurisdictions': ['Global'],
                'research_goals': ['Technology trend identification', 'White space discovery']
            },
            'due_date': datetime.now() + timedelta(days=60),
        },
        {
            'name': 'Autonomous Vehicle Patents',
            'description': 'Patent landscape analysis for autonomous vehicle technologies',
            'status': 'patent_analysis',
            'priority': 'high',
            'analysis_scope': {
                'type': 'landscape_analysis',
                'technology_areas': ['Autonomous Vehicles', 'Computer Vision'],
                'keywords': ['autonomous driving', 'LIDAR', 'computer vision'],
                'date_range_start': '2023-01-01',
                'date_range_end': '2024-12-31',
                'jurisdictions': ['US', 'EP', 'CN', 'JP'],
                'research_goals': ['Market opportunity assessment', 'Competitive landscape mapping']
            },
            'due_date': datetime.now() + timedelta(days=20),
        }
    ]
    
    created_count = 0
    for project_data in projects_data:
        try:
            # Check if project with this name already exists
            if AnalyticsProject.objects.filter(name=project_data['name']).exists():
                print(f"- Project '{project_data['name']}' already exists")
                continue
                
            project = AnalyticsProject.objects.create(
                id=str(uuid.uuid4()),
                name=project_data['name'],
                description=project_data['description'],
                status=project_data['status'],
                priority=project_data['priority'],
                analysis_scope=project_data['analysis_scope'],
                due_date=project_data['due_date'],
                created_by=user,
                start_date=datetime.now().date()
            )
            created_count += 1
            print(f"✓ Created project: {project.name}")
            
        except Exception as e:
            print(f"✗ Error creating project '{project_data['name']}': {e}")
    
    print(f"\nSummary: Created {created_count} new projects")
    print(f"Total projects in database: {AnalyticsProject.objects.count()}")

if __name__ == '__main__':
    create_sample_projects()