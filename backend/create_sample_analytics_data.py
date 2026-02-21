#!/usr/bin/env python
"""
Create sample analytics data for testing
"""
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from domains.analytics.models import (
    AnalyticsProject, TechnologyArea, PatentDataset, 
    CompetitorProfile, AnalyticsVisualization, AnalyticsReport, AnalyticsInsight
)

User = get_user_model()

def create_sample_data():
    print("Creating sample analytics data...")
    
    # Get or create a user
    try:
        user = User.objects.get(email='test@example.com')
        created = False
    except User.DoesNotExist:
        user = User.objects.create_user(
            email='test@example.com',
            first_name='Test',
            last_name='User',
            role='analyst',
            status='active'
        )
        created = True
    print(f"{'Created' if created else 'Found'} user: {user.email}")
    
    # Create sample projects
    projects_data = [
        {
            'name': 'AI Patent Landscape Analysis',
            'description': 'Comprehensive analysis of AI patent landscape focusing on machine learning and neural networks',
            'status': 'active',
            'priority': 'high',
            'analysis_scope': {
                'technology_areas': ['Machine Learning', 'Neural Networks', 'Deep Learning'],
                'date_range': {'start': '2020-01-01', 'end': '2024-06-30'},
                'jurisdictions': ['US', 'EP', 'CN']
            },
            'start_date': timezone.now().date(),
            'due_date': timezone.now().date() + timedelta(days=60),
        },
        {
            'name': 'Quantum Computing Technology Trends',
            'description': 'Analysis of emerging quantum computing technologies and patent filing trends',
            'status': 'data_collection',
            'priority': 'medium',
            'analysis_scope': {
                'technology_areas': ['Quantum Computing', 'Quantum Algorithms', 'Quantum Hardware'],
                'competitors': ['IBM', 'Google', 'Microsoft', 'Rigetti']
            },
            'start_date': timezone.now().date() - timedelta(days=15),
            'due_date': timezone.now().date() + timedelta(days=45),
        },
        {
            'name': 'Green Energy Patent Portfolio Assessment',
            'description': 'Assessment of renewable energy patent portfolio strength and market positioning',
            'status': 'completed',
            'priority': 'low',
            'analysis_scope': {
                'technology_areas': ['Solar Energy', 'Wind Power', 'Energy Storage'],
                'date_range': {'start': '2019-01-01', 'end': '2024-01-01'}
            },
            'start_date': timezone.now().date() - timedelta(days=90),
            'due_date': timezone.now().date() - timedelta(days=30),
            'completed_date': timezone.now().date() - timedelta(days=30),
        },
        {
            'name': 'Autonomous Vehicle FTO Analysis',
            'description': 'Freedom to operate analysis for autonomous vehicle sensor fusion technology',
            'status': 'draft',
            'priority': 'urgent',
            'analysis_scope': {
                'technology_areas': ['Autonomous Vehicles', 'LIDAR', 'Computer Vision'],
                'competitors': ['Tesla', 'Waymo', 'Uber', 'Ford']
            },
            'start_date': timezone.now().date() + timedelta(days=7),
            'due_date': timezone.now().date() + timedelta(days=30),
        }
    ]
    
    created_projects = []
    for project_data in projects_data:
        project, created = AnalyticsProject.objects.get_or_create(
            name=project_data['name'],
            defaults={
                **project_data,
                'created_by': user,
                'assigned_to': user
            }
        )
        created_projects.append(project)
        print(f"{'Created' if created else 'Found'} project: {project.name}")
    
    # Create sample technology areas
    tech_areas = [
        {
            'name': 'Machine Learning',
            'description': 'Machine learning algorithms and applications',
            'keywords': ['machine learning', 'ML', 'algorithm', 'training', 'neural network'],
            'ipc_classes': ['G06N3', 'G06N20'],
            'cpc_classes': ['G06N3/00', 'G06N20/00'],
            'patent_count': 2847
        },
        {
            'name': 'Quantum Computing',
            'description': 'Quantum computing systems and quantum algorithms',
            'keywords': ['quantum', 'qubit', 'quantum computer', 'quantum algorithm'],
            'ipc_classes': ['G06N10'],
            'cpc_classes': ['G06N10/00'],
            'patent_count': 567
        }
    ]
    
    for tech_data in tech_areas:
        tech_area, created = TechnologyArea.objects.get_or_create(
            name=tech_data['name'],
            defaults=tech_data
        )
        # Associate with projects
        tech_area.projects.add(*created_projects[:2])
        print(f"{'Created' if created else 'Found'} technology area: {tech_area.name}")
    
    # Create sample datasets
    datasets = [
        {
            'name': 'USPTO AI Patents 2020-2024',
            'description': 'AI-related patent applications from USPTO',
            'data_source': 'api_import',
            'processing_status': 'completed',
            'total_patents': 15420,
            'processed_patents': 15420,
            'classification_confidence': 0.92
        },
        {
            'name': 'European Quantum Patents',
            'description': 'Quantum computing patents from EPO',
            'data_source': 'database_query',
            'processing_status': 'processing',
            'total_patents': 1200,
            'processed_patents': 800,
            'classification_confidence': 0.87
        }
    ]
    
    for dataset_data in datasets:
        dataset, created = PatentDataset.objects.get_or_create(
            name=dataset_data['name'],
            defaults={
                **dataset_data,
                'created_by': user
            }
        )
        # Associate with projects
        dataset.projects.add(created_projects[0])
        print(f"{'Created' if created else 'Found'} dataset: {dataset.name}")
    
    # Create sample competitors
    competitors = [
        {
            'name': 'Tesla Inc.',
            'legal_name': 'Tesla, Inc.',
            'industry': 'Automotive',
            'headquarters': 'Austin, TX, USA',
            'website': 'https://tesla.com',
            'total_patents': 3200,
            'active_patents': 2800,
            'recent_filings': 127,
            'confidence_score': 0.95
        },
        {
            'name': 'Google LLC',
            'legal_name': 'Google LLC',
            'industry': 'Technology',
            'headquarters': 'Mountain View, CA, USA',
            'website': 'https://google.com',
            'total_patents': 15600,
            'active_patents': 12400,
            'recent_filings': 890,
            'confidence_score': 0.98
        }
    ]
    
    for competitor_data in competitors:
        competitor, created = CompetitorProfile.objects.get_or_create(
            name=competitor_data['name'],
            defaults=competitor_data
        )
        # Associate with projects
        competitor.projects.add(created_projects[0], created_projects[3])
        print(f"{'Created' if created else 'Found'} competitor: {competitor.name}")
    
    print(f"Sample data creation completed!")
    print(f"Created {len(created_projects)} projects")
    print(f"You can now test the analytics functionality at http://localhost:3000/dashboard/analytics")

if __name__ == '__main__':
    create_sample_data()