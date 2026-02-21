#!/usr/bin/env python
"""
Create sample analytics data
Run with: python create_analytics_data.py
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

# Import analytics models
from domains.analytics.models import (
    AnalyticsProject, TechnologyArea, PatentDataset, CompetitorProfile,
    AnalyticsVisualization, AnalyticsReport, AnalyticsInsight
)

User = get_user_model()

def create_sample_analytics_projects():
    """Create sample analytics projects"""
    # Get or create a sample user
    user, created = User.objects.get_or_create(
        username='analytics_user',
        defaults={
            'email': 'analytics@example.com',
            'first_name': 'Analytics',
            'last_name': 'User',
            'role': 'analyst',
            'is_active': True,
        }
    )
    if created:
        user.set_password('password123')
        user.save()
        print(f"Created user: {user.username}")

    projects_data = [
        {
            'name': 'AI/ML Patent Landscape Analysis 2024',
            'description': 'Comprehensive analysis of artificial intelligence and machine learning patent landscape',
            'status': 'completed',
            'priority': 'high',
            'analysis_scope': {
                'technology_areas': ['Machine Learning', 'Neural Networks', 'Computer Vision'],
                'geographic_regions': ['US', 'EU', 'CN', 'JP'],
                'time_period': '2020-2024'
            }
        },
        {
            'name': 'Quantum Computing Competitive Intelligence',
            'description': 'Strategic analysis of quantum computing patent portfolios and competitive positioning',
            'status': 'active',
            'priority': 'medium',
            'analysis_scope': {
                'technology_areas': ['Quantum Algorithms', 'Quantum Hardware', 'Quantum Error Correction'],
                'competitors': ['IBM', 'Google', 'Microsoft', 'Rigetti'],
                'time_period': '2018-2024'
            }
        },
        {
            'name': 'Electric Vehicle Battery Technology Trends',
            'description': 'Analysis of patent trends in electric vehicle battery management and charging systems',
            'status': 'patent_analysis',
            'priority': 'high',
            'analysis_scope': {
                'technology_areas': ['Battery Management', 'Fast Charging', 'Thermal Management'],
                'geographic_regions': ['US', 'EU', 'CN', 'KR'],
                'time_period': '2019-2024'
            }
        },
        {
            'name': 'Biotechnology White Space Analysis',
            'description': 'Identification of innovation opportunities in biotechnology patent landscape',
            'status': 'visualization',
            'priority': 'medium',
            'analysis_scope': {
                'technology_areas': ['Gene Therapy', 'CRISPR', 'Immunotherapy', 'Bioinformatics'],
                'time_period': '2020-2024'
            }
        },
        {
            'name': 'Green Technology Portfolio Assessment',
            'description': 'Portfolio strength assessment for renewable energy and sustainability technologies',
            'status': 'report_generation',
            'priority': 'low',
            'analysis_scope': {
                'technology_areas': ['Solar Power', 'Wind Energy', 'Energy Storage', 'Carbon Capture'],
                'geographic_regions': ['Global'],
                'time_period': '2015-2024'
            }
        }
    ]

    projects = []
    for i, data in enumerate(projects_data):
        # Calculate dates
        start_date = timezone.now().date() - timedelta(days=random.randint(30, 180))
        due_date = start_date + timedelta(days=random.randint(60, 120))
        
        # Set progress based on status
        progress_map = {
            'draft': random.randint(0, 20),
            'scope_definition': random.randint(15, 30),
            'data_collection': random.randint(25, 45),
            'patent_analysis': random.randint(40, 65),
            'visualization': random.randint(60, 80),
            'report_generation': random.randint(75, 90),
            'completed': random.randint(95, 100),
            'active': random.randint(30, 70)
        }
        
        project = AnalyticsProject.objects.create(
            name=data['name'],
            description=data['description'],
            status=data['status'],
            priority=data['priority'],
            created_by=user,
            assigned_to=user,
            start_date=start_date,
            due_date=due_date,
            analysis_scope=data['analysis_scope']
        )
        projects.append(project)
        print(f"Created analytics project: {project.name}")

    return projects, user

def create_technology_areas(projects):
    """Create technology areas for projects"""
    tech_areas_data = [
        {
            'name': 'Artificial Intelligence',
            'description': 'Machine learning, neural networks, and AI applications',
            'keywords': ['artificial intelligence', 'machine learning', 'neural network', 'deep learning', 'AI'],
            'ipc_classes': ['G06N', 'G06F15', 'G06T'],
            'cpc_classes': ['G06N3', 'G06N20', 'G06F17']
        },
        {
            'name': 'Quantum Computing',
            'description': 'Quantum algorithms, hardware, and error correction',
            'keywords': ['quantum computing', 'quantum algorithm', 'qubit', 'quantum gate', 'quantum error'],
            'ipc_classes': ['G06N10', 'B82Y10'],
            'cpc_classes': ['G06N10', 'B82Y10/00', 'H03K19']
        },
        {
            'name': 'Battery Technology',
            'description': 'Electric vehicle batteries, charging systems, and management',
            'keywords': ['lithium battery', 'battery management', 'fast charging', 'thermal management'],
            'ipc_classes': ['H01M10', 'H02J7', 'H01M50'],
            'cpc_classes': ['H01M10/0525', 'H02J7/00', 'H01M50/204']
        },
        {
            'name': 'Gene Therapy',
            'description': 'Genetic engineering and therapeutic applications',
            'keywords': ['gene therapy', 'CRISPR', 'genetic engineering', 'gene editing'],
            'ipc_classes': ['C12N15', 'A61K48'],
            'cpc_classes': ['C12N15/10', 'A61K48/00']
        },
        {
            'name': 'Renewable Energy',
            'description': 'Solar, wind, and sustainable energy technologies',
            'keywords': ['solar cell', 'photovoltaic', 'wind turbine', 'renewable energy'],
            'ipc_classes': ['H01L31', 'F03D'],
            'cpc_classes': ['H01L31/02', 'F03D7/02']
        }
    ]

    tech_areas = []
    for project in projects:
        # Create 2-3 technology areas per project
        num_areas = random.randint(2, 3)
        selected_areas = random.sample(tech_areas_data, min(num_areas, len(tech_areas_data)))
        
        for area_data in selected_areas:
            tech_area = TechnologyArea.objects.create(
                project=project,
                name=area_data['name'],
                description=area_data['description'],
                keywords=area_data['keywords'],
                ipc_classes=area_data['ipc_classes'],
                cpc_classes=area_data['cpc_classes'],
                confidence_threshold=random.uniform(0.7, 0.95),
                patent_count=random.randint(500, 5000)
            )
            tech_areas.append(tech_area)

    print(f"Created {len(tech_areas)} technology areas")
    return tech_areas

def create_patent_datasets(projects, user):
    """Create patent datasets for projects"""
    datasets = []
    for project in projects:
        # Create 1-2 datasets per project
        for i in range(random.randint(1, 2)):
            dataset = PatentDataset.objects.create(
                project=project,
                name=f"{project.name} - Dataset {i+1}",
                description=f"Patent dataset for {project.name}",
                data_source=random.choice(['api_import', 'database_query', 'manual_upload']),
                processing_status=random.choice(['completed', 'processing', 'pending']),
                processing_progress=random.randint(70, 100),
                total_patents=random.randint(1000, 10000),
                processed_patents=random.randint(800, 9500),
                classification_confidence=random.uniform(0.8, 0.95),
                technology_distribution={
                    'AI/ML': random.randint(20, 40),
                    'Software': random.randint(15, 30),
                    'Hardware': random.randint(10, 25),
                    'Other': random.randint(5, 20)
                },
                created_by=user
            )
            datasets.append(dataset)

    print(f"Created {len(datasets)} patent datasets")
    return datasets

def create_competitor_profiles(projects):
    """Create competitor profiles"""
    competitors_data = [
        {
            'name': 'Google/Alphabet',
            'legal_name': 'Alphabet Inc.',
            'aliases': ['Google', 'Alphabet', 'Google LLC'],
            'industry': 'Technology',
            'headquarters': 'Mountain View, CA, USA',
            'website': 'https://abc.xyz'
        },
        {
            'name': 'Microsoft',
            'legal_name': 'Microsoft Corporation',
            'aliases': ['Microsoft Corp', 'MSFT'],
            'industry': 'Technology',
            'headquarters': 'Redmond, WA, USA',
            'website': 'https://microsoft.com'
        },
        {
            'name': 'IBM',
            'legal_name': 'International Business Machines Corporation',
            'aliases': ['IBM Corp', 'International Business Machines'],
            'industry': 'Technology',
            'headquarters': 'Armonk, NY, USA',
            'website': 'https://ibm.com'
        },
        {
            'name': 'Tesla',
            'legal_name': 'Tesla, Inc.',
            'aliases': ['Tesla Motors', 'Tesla Inc'],
            'industry': 'Automotive/Energy',
            'headquarters': 'Austin, TX, USA',
            'website': 'https://tesla.com'
        },
        {
            'name': 'Samsung',
            'legal_name': 'Samsung Electronics Co., Ltd.',
            'aliases': ['Samsung Electronics', 'Samsung Group'],
            'industry': 'Technology/Electronics',
            'headquarters': 'Seoul, South Korea',
            'website': 'https://samsung.com'
        }
    ]

    competitors = []
    for project in projects:
        # Select 2-4 competitors per project
        num_competitors = random.randint(2, 4)
        selected_competitors = random.sample(competitors_data, min(num_competitors, len(competitors_data)))
        
        for comp_data in selected_competitors:
            competitor = CompetitorProfile.objects.create(
                project=project,
                name=comp_data['name'],
                legal_name=comp_data['legal_name'],
                aliases=comp_data['aliases'],
                industry=comp_data['industry'],
                headquarters=comp_data['headquarters'],
                website=comp_data['website'],
                description=f"Competitor analysis for {comp_data['name']} in {project.name}",
                total_patents=random.randint(1000, 10000),
                active_patents=random.randint(500, 8000),
                recent_filings=random.randint(50, 500),
                confidence_score=random.uniform(0.8, 0.95)
            )
            competitors.append(competitor)

    print(f"Created {len(competitors)} competitor profiles")
    return competitors

def create_analytics_insights(projects, user):
    """Create analytics insights"""
    insights_data = [
        {
            'title': 'AI Patent Filing Surge in Computer Vision',
            'insight_type': 'trend_analysis',
            'description': 'Computer vision patents have increased by 45% in the last 18 months, driven by autonomous vehicle and surveillance applications.',
            'confidence_level': 'high',
            'impact_score': 85,
            'priority': 'high'
        },
        {
            'title': 'Quantum Computing Patent Concentration Risk',
            'insight_type': 'risk_assessment',
            'description': 'Over 60% of quantum computing patents are held by top 5 players, creating potential licensing bottlenecks.',
            'confidence_level': 'medium',
            'impact_score': 75,
            'priority': 'medium'
        },
        {
            'title': 'Battery Technology White Space in Solid-State',
            'insight_type': 'opportunity_identification',
            'description': 'Significant patent filing gaps identified in solid-state battery manufacturing processes.',
            'confidence_level': 'high',
            'impact_score': 90,
            'priority': 'high'
        },
        {
            'title': 'Emerging Gene Therapy Patent Clusters',
            'insight_type': 'technology_emergence',
            'description': 'New patent clusters emerging around in-vivo gene editing techniques with 200% growth.',
            'confidence_level': 'medium',
            'impact_score': 80,
            'priority': 'medium'
        },
        {
            'title': 'Competitive Gap in Renewable Energy Storage',
            'insight_type': 'competitive_gap',
            'description': 'Tesla leads in battery storage patents, but opportunities exist in grid-scale solutions.',
            'confidence_level': 'high',
            'impact_score': 70,
            'priority': 'medium'
        }
    ]

    insights = []
    for project in projects:
        # Create 2-3 insights per project
        num_insights = random.randint(2, 3)
        selected_insights = random.sample(insights_data, min(num_insights, len(insights_data)))
        
        for insight_data in selected_insights:
            insight = AnalyticsInsight.objects.create(
                project=project,
                title=insight_data['title'],
                insight_type=insight_data['insight_type'],
                description=insight_data['description'],
                supporting_data={
                    'patent_count': random.randint(100, 1000),
                    'growth_rate': random.randint(10, 200),
                    'time_period': '18 months',
                    'key_players': ['Company A', 'Company B', 'Company C']
                },
                confidence_level=insight_data['confidence_level'],
                impact_score=insight_data['impact_score'],
                recommended_actions=[
                    'Monitor competitor activities in this space',
                    'Consider strategic partnerships',
                    'Evaluate R&D investment opportunities'
                ],
                priority=insight_data['priority'],
                is_actionable=True,
                is_reviewed=random.choice([True, False])
            )
            insights.append(insight)

    print(f"Created {len(insights)} analytics insights")
    return insights

def main():
    print("Creating sample analytics data...")
    
    with transaction.atomic():
        print("\n1. Creating analytics projects...")
        projects, user = create_sample_analytics_projects()
        
        print(f"\n2. Creating technology areas...")
        tech_areas = create_technology_areas(projects)
        
        print(f"\n3. Creating patent datasets...")
        datasets = create_patent_datasets(projects, user)
        
        print(f"\n4. Creating competitor profiles...")
        competitors = create_competitor_profiles(projects)
        
        print(f"\n5. Creating analytics insights...")
        insights = create_analytics_insights(projects, user)
    
    print(f"\n✅ Successfully created analytics sample data:")
    print(f"   - {len(projects)} analytics projects")
    print(f"   - {len(tech_areas)} technology areas")
    print(f"   - {len(datasets)} patent datasets")
    print(f"   - {len(competitors)} competitor profiles")
    print(f"   - {len(insights)} analytics insights")
    print(f"\nSample login: analytics_user / password123")

if __name__ == '__main__':
    main()