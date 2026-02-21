#!/usr/bin/env python
"""
Create sample patent application data for testing the frontend prosecution interface
"""
import os
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.prosecution.models import PatentApplication, Claim
from domains.accounts.models import User, Organization

def create_sample_data():
    print("Creating sample prosecution data...")
    
    # Create or get organization and user
    org, _ = Organization.objects.get_or_create(
        name="Demo Organization",
        defaults={
            'email': 'demo@example.com',
            'subscription_plan': 'basic',
            'is_active': True
        }
    )
    
    user, _ = User.objects.get_or_create(
        username="demo_user",
        defaults={
            'email': 'demo@example.com',
            'first_name': 'Demo',
            'last_name': 'User',
            'organization': org,
            'is_active': True
        }
    )
    
    # Create sample patent application with ID=1
    app, created = PatentApplication.objects.get_or_create(
        id=1,
        defaults={
            'title': 'Advanced Machine Learning System for Patent Analytics',
            'application_number': 'US16/123456',
            'status': 'draft',
            'application_type': 'utility',
            'priority_level': 'high',
            'jurisdiction': 'US',
            'abstract': '''This invention relates to a comprehensive patent analytics system that leverages advanced machine learning techniques to analyze patent portfolios, identify trends, and provide actionable insights for intellectual property professionals. The system incorporates natural language processing, pattern recognition, and predictive modeling to enhance patent prosecution workflows.''',
            'background': '''Patent analytics has become increasingly important in modern intellectual property management. Traditional methods of patent analysis are time-consuming and often fail to identify subtle patterns and relationships within large patent datasets. There is a need for automated systems that can process vast amounts of patent data and provide meaningful insights to support strategic decision-making.

Existing patent analytics tools often lack the sophisticated analytical capabilities required to handle the complexity and volume of modern patent data. Furthermore, many solutions fail to integrate seamlessly with existing patent prosecution workflows, creating inefficiencies for patent professionals.''',
            'summary': '''The present invention provides a comprehensive patent analytics platform that addresses the limitations of existing systems. The invention comprises:

1. A machine learning-based patent classification system that automatically categorizes patents based on technological domains and legal characteristics.

2. An advanced natural language processing engine that extracts key technical concepts, identifies similar patents, and generates automated summaries.

3. A predictive modeling component that forecasts patent prosecution outcomes and identifies potential prior art conflicts.

4. An integrated workflow management system that streamlines patent prosecution processes and facilitates collaboration among patent professionals.

The system provides significant improvements in accuracy, efficiency, and user experience compared to existing patent analytics solutions.''',
            'detailed_description': '''DETAILED DESCRIPTION

The patent analytics system of the present invention comprises several interconnected components that work together to provide comprehensive patent analysis capabilities.

SYSTEM ARCHITECTURE

The system architecture includes a data ingestion layer, processing layer, analysis layer, and presentation layer. The data ingestion layer interfaces with various patent databases and document repositories to collect patent documents, prosecution histories, and related metadata.

MACHINE LEARNING ENGINE

The machine learning engine employs deep neural networks trained on large patent datasets to perform various analytical tasks. The engine includes:

- Document classification modules that categorize patents by technology area
- Similarity detection algorithms that identify related patents and potential conflicts
- Trend analysis components that identify emerging technologies and market opportunities
- Risk assessment models that evaluate patent strength and validity

NATURAL LANGUAGE PROCESSING

The natural language processing component processes patent text to extract technical concepts, identify key innovations, and generate structured data representations. This component utilizes:

- Named entity recognition to identify technical terms and concepts
- Relationship extraction to understand connections between different technical elements  
- Automated summarization to generate concise patent summaries
- Translation capabilities for multi-language patent analysis

WORKFLOW INTEGRATION

The system integrates with existing patent prosecution tools and provides APIs for third-party integration. Workflow features include:

- Automated deadline tracking and notification systems
- Collaborative drafting tools with version control
- Quality assurance workflows with automated checks
- Reporting and analytics dashboards for portfolio management

IMPLEMENTATION DETAILS

The system is implemented using cloud-based infrastructure to ensure scalability and reliability. The architecture supports both on-premises and cloud deployments, with robust security measures to protect sensitive patent information.

The user interface provides intuitive access to all system features, with customizable dashboards and reporting capabilities tailored to different user roles and responsibilities.''',
            'filing_date': datetime.now().date(),
            'organization': org,
            'created_by': user
        }
    )
    
    if created:
        print(f"✅ Created patent application: {app.title}")
        
        # Create sample claims
        claims_data = [
            {
                'claim_number': 1,
                'claim_type': 'independent',
                'claim_text': '''A patent analytics system comprising:
a) a data ingestion module configured to collect patent documents from multiple databases;
b) a machine learning engine configured to analyze patent content and identify technical patterns;
c) a natural language processing component configured to extract technical concepts from patent text;
d) a workflow management system configured to integrate with patent prosecution processes; and
e) a user interface configured to present analytical results and facilitate user interaction with the system.''',
                'is_main_claim': True,
                'dependencies': []
            },
            {
                'claim_number': 2,
                'claim_type': 'dependent',
                'claim_text': 'The patent analytics system of claim 1, wherein the machine learning engine employs deep neural networks trained on patent classification tasks.',
                'is_main_claim': False,
                'dependencies': [1]
            },
            {
                'claim_number': 3,
                'claim_type': 'dependent', 
                'claim_text': 'The patent analytics system of claim 1, wherein the natural language processing component includes named entity recognition capabilities for identifying technical terms.',
                'is_main_claim': False,
                'dependencies': [1]
            },
            {
                'claim_number': 4,
                'claim_type': 'dependent',
                'claim_text': 'The patent analytics system of claim 1, wherein the workflow management system provides automated deadline tracking and notification capabilities.',
                'is_main_claim': False,
                'dependencies': [1]
            },
            {
                'claim_number': 5,
                'claim_type': 'independent',
                'claim_text': '''A method for patent analytics comprising the steps of:
a) ingesting patent documents from multiple patent databases;
b) processing the patent documents using machine learning algorithms to identify technical patterns;
c) extracting technical concepts using natural language processing techniques;
d) generating analytical insights based on the processed patent data; and
e) presenting the analytical insights through an interactive user interface.''',
                'is_main_claim': True,
                'dependencies': []
            }
        ]
        
        for claim_data in claims_data:
            claim, created = Claim.objects.get_or_create(
                application=app,
                claim_number=claim_data['claim_number'],
                defaults={
                    'claim_type': claim_data['claim_type'],
                    'claim_text': claim_data['claim_text'],
                    'is_main_claim': claim_data['is_main_claim'],
                    'dependencies': claim_data['dependencies']
                }
            )
            if created:
                print(f"✅ Created claim {claim.claim_number}")
    
    else:
        print(f"✅ Patent application with ID 1 already exists: {app.title}")
    
    print(f"\n🎉 Sample data creation complete!")
    print(f"📱 You can now access the patent application at:")
    print(f"   http://localhost:3000/dashboard/prosecution/drafting/1")

if __name__ == '__main__':
    create_sample_data()