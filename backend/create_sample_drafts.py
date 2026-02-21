#!/usr/bin/env python
"""
Create Sample Patent Applications for Drafting
Creates 3 sample applications with the specific UUIDs used in frontend mock data
"""

import os
import sys
import django
from datetime import date, datetime
from decimal import Decimal

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.prosecution.models import PatentApplication, Claim
from domains.accounts.models import Organization, User

def create_sample_applications():
    """Create 3 sample patent applications with specific UUIDs"""
    
    try:
        # Get or create a default organization
        organization, created = Organization.objects.get_or_create(
            name='Sample Patent Firm',
            defaults={
                'domain': 'samplefirm.com',
                'industry': 'technology',
                'size': 'medium'
            }
        )
        
        if created:
            print(f"✓ Created organization: {organization.name}")
        else:
            print(f"✓ Using existing organization: {organization.name}")
        
        # Get or create a sample user/attorney
        attorney, created = User.objects.get_or_create(
            email='attorney@samplefirm.com',
            defaults={
                'username': 'sample_attorney',
                'first_name': 'John',
                'last_name': 'Smith',
                'organization': organization,
                'role': 'attorney'
            }
        )
        
        if created:
            print(f"✓ Created attorney: {attorney.get_full_name()}")
        else:
            print(f"✓ Using existing attorney: {attorney.get_full_name()}")
        
        # Sample applications data matching frontend mock data
        applications_data = [
            {
                'id': '00000001-0000-0000-0000-000000000000',
                'title': 'Advanced Machine Learning Algorithm for Patent Analysis',
                'application_type': 'utility',
                'jurisdiction': 'US',
                'status': 'draft',
                'priority_level': 'high',
                'abstract': 'A machine learning system analyzes patent documents using advanced natural language processing techniques. The system automatically extracts technical features, classifies patent content, and provides recommendations for related prior art. The invention improves efficiency in patent analysis workflows and reduces manual review time while maintaining accuracy in document processing.',
                'background': 'Patent analysis has traditionally relied on manual review processes that are time-consuming and prone to human error. With the increasing volume of patent applications and the complexity of modern technological innovations, there is a critical need for automated systems that can efficiently analyze, categorize, and process patent documents. Current solutions lack the sophistication required to handle the nuanced language and technical specifications found in patent documentation.',
                'summary': 'According to one embodiment of the present invention, a machine learning system is provided that comprises a document processing engine configured to analyze patent documents and extract key technical features. The system further comprises a classification module that categorizes patents based on their technical content and a recommendation engine that suggests relevant prior art and similar patents.',
                'detailed_description': 'The present invention provides a comprehensive machine learning system designed specifically for patent document analysis. The system employs advanced natural language processing algorithms to understand the technical content of patent documents and extract meaningful features that can be used for classification, comparison, and analysis purposes.',
                'technology_area': 'Machine Learning and Artificial Intelligence',
                'keywords': ['machine learning', 'patent analysis', 'natural language processing', 'document classification'],
                'ipc_classes': ['G06F40/20', 'G06N20/00'],
                'us_classes': ['706/45', '382/155'],
                'inventors': ['Dr. Alice Johnson', 'Bob Chen', 'Carol Williams'],
                'assignees': ['Tech Innovation Corp'],
                'priority_date': date(2024, 1, 10),
                'filing_date': date(2024, 1, 15),
                'estimated_value': Decimal('500000.00'),
                'costs_to_date': Decimal('75000.00'),
                'estimated_total_cost': Decimal('150000.00')
            },
            {
                'id': '00000002-0000-0000-0000-000000000000',
                'title': 'Improved Battery Management System',
                'application_type': 'utility',
                'jurisdiction': 'EP',
                'status': 'under_examination',
                'priority_level': 'medium',
                'abstract': 'An improved battery management system that monitors and controls the charging and discharging of battery cells in electric vehicles. The system includes advanced algorithms for predicting battery life and optimizing performance while ensuring safety and reliability.',
                'background': 'Electric vehicle battery systems require sophisticated management to ensure optimal performance, safety, and longevity. Traditional battery management systems often lack the precision needed to maximize battery life while maintaining peak performance characteristics.',
                'summary': 'The present invention provides a battery management system comprising sensors for monitoring individual cell voltages and temperatures, a control unit for processing the sensor data, and algorithms for optimizing charging patterns based on usage history and environmental conditions.',
                'detailed_description': 'The battery management system of the present invention incorporates multiple layers of monitoring and control to ensure optimal battery performance. The system includes individual cell monitoring, temperature regulation, and predictive algorithms that adapt to user behavior patterns.',
                'technology_area': 'Battery Technology and Electric Vehicles',
                'keywords': ['battery management', 'electric vehicle', 'charging system', 'cell monitoring'],
                'ipc_classes': ['H02J7/00', 'B60L3/00'],
                'us_classes': ['320/104', '180/65.1'],
                'inventors': ['Mike Wilson', 'Sarah Davis'],
                'assignees': ['EV Systems Inc'],
                'priority_date': date(2024, 1, 8),
                'filing_date': date(2024, 1, 14),
                'estimated_value': Decimal('750000.00'),
                'costs_to_date': Decimal('45000.00'),
                'estimated_total_cost': Decimal('120000.00')
            },
            {
                'id': '00000003-0000-0000-0000-000000000000',
                'title': 'Novel User Interface Design',
                'application_type': 'utility',
                'jurisdiction': 'US',
                'status': 'draft',
                'priority_level': 'medium',
                'abstract': 'A novel user interface design that adapts to user preferences and usage patterns. The interface employs machine learning to customize layouts, predict user actions, and provide contextual assistance, resulting in improved user experience and productivity.',
                'background': 'Traditional user interfaces are static and do not adapt to individual user preferences or behavior patterns. This results in inefficient workflows and reduced user satisfaction, particularly in complex software applications.',
                'summary': 'The present invention provides an adaptive user interface system that learns from user interactions and automatically adjusts interface elements to optimize usability. The system includes machine learning algorithms that analyze usage patterns and predict user needs.',
                'detailed_description': 'The adaptive user interface system monitors user interactions, analyzes behavior patterns, and dynamically adjusts interface elements to improve efficiency and user satisfaction. The system includes contextual help features and predictive text input capabilities.',
                'technology_area': 'User Interface Design and Human-Computer Interaction',
                'keywords': ['user interface', 'adaptive design', 'machine learning', 'user experience'],
                'ipc_classes': ['G06F3/048', 'G06N20/00'],
                'us_classes': ['715/700', '706/45'],
                'inventors': ['Sarah Johnson', 'Lisa Chen', 'David Park'],
                'assignees': ['UI Innovations LLC'],
                'priority_date': date(2024, 1, 5),
                'filing_date': date(2024, 1, 13),
                'estimated_value': Decimal('300000.00'),
                'costs_to_date': Decimal('25000.00'),
                'estimated_total_cost': Decimal('80000.00')
            }
        ]
        
        # Create applications
        created_apps = []
        for app_data in applications_data:
            try:
                # Check if application already exists
                if PatentApplication.objects.filter(id=app_data['id']).exists():
                    print(f"⚠ Application {app_data['id']} already exists, skipping...")
                    continue
                
                app = PatentApplication.objects.create(
                    id=app_data['id'],
                    title=app_data['title'],
                    application_type=app_data['application_type'],
                    jurisdiction=app_data['jurisdiction'],
                    status=app_data['status'],
                    organization=organization,
                    attorney=attorney,
                    priority_level=app_data['priority_level'],
                    abstract=app_data['abstract'],
                    background=app_data['background'],
                    summary=app_data['summary'],
                    detailed_description=app_data['detailed_description'],
                    technology_area=app_data['technology_area'],
                    keywords=app_data['keywords'],
                    ipc_classes=app_data['ipc_classes'],
                    us_classes=app_data['us_classes'],
                    inventors=app_data['inventors'],
                    assignees=app_data['assignees'],
                    priority_date=app_data['priority_date'],
                    filing_date=app_data['filing_date'],
                    estimated_value=app_data['estimated_value'],
                    costs_to_date=app_data['costs_to_date'],
                    estimated_total_cost=app_data['estimated_total_cost']
                )
                
                created_apps.append(app)
                print(f"✓ Created application: {app.title} ({app.id})")
                
                # Create sample claims for each application
                sample_claims = [
                    {
                        'claim_number': 1,
                        'claim_type': 'independent',
                        'claim_text': f'A system for {app_data["title"].lower()}, comprising: a processor configured to execute instructions; a memory coupled to the processor; and software components stored in the memory and executable by the processor.'
                    },
                    {
                        'claim_number': 2,
                        'claim_type': 'dependent',
                        'claim_text': 'The system of claim 1, wherein the processor is further configured to perform real-time processing of input data.'
                    },
                    {
                        'claim_number': 3,
                        'claim_type': 'dependent',
                        'claim_text': 'The system of claim 1, further comprising a user interface module configured to display results and receive user input.'
                    }
                ]
                
                for claim_data in sample_claims:
                    claim = Claim.objects.create(
                        application=app,
                        claim_number=claim_data['claim_number'],
                        claim_type=claim_data['claim_type'],
                        claim_text=claim_data['claim_text']
                    )
                    
                    # Set up dependencies for dependent claims
                    if claim_data['claim_type'] == 'dependent' and claim_data['claim_number'] > 1:
                        parent_claim = Claim.objects.filter(
                            application=app, 
                            claim_number=1
                        ).first()
                        if parent_claim:
                            claim.depends_on.add(parent_claim)
                
                print(f"  ✓ Created {len(sample_claims)} claims for {app.title}")
                
            except Exception as e:
                print(f"❌ Error creating application {app_data['id']}: {e}")
                continue
        
        print(f"\n🎉 Successfully created {len(created_apps)} patent applications!")
        print("\nApplicationations created:")
        for app in created_apps:
            print(f"  - {app.title} ({app.id})")
            print(f"    Status: {app.status} | Jurisdiction: {app.jurisdiction}")
        
        print(f"\nYou can now test the drafting interface with these applications at:")
        for app in created_apps:
            print(f"  http://localhost:3000/dashboard/prosecution/drafting/{app.id}")
        
        return created_apps
        
    except Exception as e:
        print(f"❌ Error creating sample applications: {e}")
        return []

if __name__ == '__main__':
    print("Creating sample patent applications for drafting...")
    apps = create_sample_applications()
    if apps:
        print("\n✅ Sample applications created successfully!")
    else:
        print("\n❌ Failed to create sample applications.")