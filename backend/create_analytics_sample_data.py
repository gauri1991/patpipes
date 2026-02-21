#!/usr/bin/env python
"""
Sample data creation script for global competitor and technology area models
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import after Django setup to ensure models are loaded
try:
    from domains.analytics.models import GlobalCompetitorProfile, GlobalTechnologyArea
except ImportError as e:
    print(f"Model import error: {e}")
    print("Note: Global models may not exist in database yet. Run migrations first.")
    sys.exit(1)

def create_sample_data_via_api():
    """Create sample data using direct API calls instead of models"""
    import requests
    import json
    
    base_url = "http://localhost:8000/analytics/api"
    
    # Sample competitor data
    competitors_data = [
        {
            'name': 'TechCorp Industries',
            'legal_name': 'TechCorp Industries Ltd.',
            'aliases': ['TechCorp', 'TechCorp Ltd'],
            'industry': 'Technology',
            'headquarters': 'San Francisco, CA',
            'website': 'https://techcorp.com',
            'description': 'Leading AI technology company specializing in machine learning solutions',
            'total_patents': 1245,
            'active_patents': 987,
            'patent_applications_pending': 156,
            'key_technology_areas': ['AI', 'Machine Learning', 'Computer Vision'],
            'top_inventors': ['Dr. Smith', 'Dr. Johnson', 'Dr. Chen'],
            'filing_trend_6_months': 23,
            'avg_citations_per_patent': 8.5,
            'patent_quality_score': 7.8,
            'competitive_strength': 'high',
            'market_focus': ['North America', 'Europe', 'Asia']
        },
        {
            'name': 'InnovateTech Solutions',
            'legal_name': 'InnovateTech Solutions Inc.',
            'aliases': ['InnovateTech', 'ITS'],
            'industry': 'Software',
            'headquarters': 'Seattle, WA',
            'website': 'https://innovatetech.com',
            'description': 'Innovative software solutions for enterprise automation',
            'total_patents': 567,
            'active_patents': 423,
            'patent_applications_pending': 89,
            'key_technology_areas': ['Software Engineering', 'Automation', 'Cloud Computing'],
            'top_inventors': ['Dr. Williams', 'Dr. Davis'],
            'filing_trend_6_months': 15,
            'avg_citations_per_patent': 6.2,
            'patent_quality_score': 6.9,
            'competitive_strength': 'medium',
            'market_focus': ['North America', 'Europe']
        },
        {
            'name': 'Quantum Dynamics Corp',
            'legal_name': 'Quantum Dynamics Corporation',
            'aliases': ['QDC', 'Quantum Corp'],
            'industry': 'Quantum Computing',
            'headquarters': 'Boston, MA',
            'website': 'https://quantumdynamics.com',
            'description': 'Pioneering quantum computing hardware and software solutions',
            'total_patents': 234,
            'active_patents': 198,
            'patent_applications_pending': 67,
            'key_technology_areas': ['Quantum Computing', 'Quantum Algorithms', 'Superconducting Circuits'],
            'top_inventors': ['Dr. Quantum', 'Dr. Entangle'],
            'filing_trend_6_months': 34,
            'avg_citations_per_patent': 12.3,
            'patent_quality_score': 9.1,
            'competitive_strength': 'high',
            'market_focus': ['Global']
        }
    ]
    
    # Sample technology data
    technologies_data = [
        {
            'name': 'Machine Learning Algorithms',
            'description': 'Advanced ML algorithms for pattern recognition and prediction',
            'ipc_class': 'G06N 20/00',
            'cpc_class': 'G06N 20/00',
            'category': 'Artificial Intelligence',
            'maturity_level': 'developing',
            'patent_count': 1567,
            'growth_rate_6m': 34.5,
            'innovation_score': 8.2,
            'market_potential': 'high',
            'key_players': ['Google', 'Microsoft', 'IBM'],
            'related_technologies': ['Neural Networks', 'Deep Learning', 'Natural Language Processing']
        },
        {
            'name': 'Quantum Computing',
            'description': 'Quantum information processing and computing systems',
            'ipc_class': 'G06N 10/00',
            'cpc_class': 'G06N 10/00',
            'category': 'Quantum Technology',
            'maturity_level': 'emerging',
            'patent_count': 234,
            'growth_rate_6m': 67.8,
            'innovation_score': 9.1,
            'market_potential': 'high',
            'key_players': ['IBM', 'Google', 'Microsoft'],
            'related_technologies': ['Quantum Algorithms', 'Superconducting Circuits', 'Quantum Error Correction']
        },
        {
            'name': 'Blockchain Technology',
            'description': 'Distributed ledger and cryptocurrency technologies',
            'ipc_class': 'H04L 9/06',
            'cpc_class': 'H04L 9/0643',
            'category': 'Distributed Systems',
            'maturity_level': 'mature',
            'patent_count': 892,
            'growth_rate_6m': 12.3,
            'innovation_score': 7.4,
            'market_potential': 'medium',
            'key_players': ['Bitcoin', 'Ethereum', 'Hyperledger'],
            'related_technologies': ['Cryptography', 'Smart Contracts', 'Consensus Algorithms']
        }
    ]
    
    print("Creating sample data via API calls...")
    
    # Create competitors
    for comp_data in competitors_data:
        try:
            response = requests.post(f"{base_url}/global-competitors/", json=comp_data)
            if response.status_code in [200, 201]:
                print(f"✓ Created competitor: {comp_data['name']}")
            else:
                print(f"✗ Failed to create competitor {comp_data['name']}: {response.status_code}")
                print(f"  Response: {response.text}")
        except Exception as e:
            print(f"✗ Error creating competitor {comp_data['name']}: {e}")
    
    # Create technologies
    for tech_data in technologies_data:
        try:
            response = requests.post(f"{base_url}/global-technology-areas/", json=tech_data)
            if response.status_code in [200, 201]:
                print(f"✓ Created technology: {tech_data['name']}")
            else:
                print(f"✗ Failed to create technology {tech_data['name']}: {response.status_code}")
                print(f"  Response: {response.text}")
        except Exception as e:
            print(f"✗ Error creating technology {tech_data['name']}: {e}")

def create_sample_data_direct():
    """Create sample data using Django models directly"""
    
    # Sample competitor data
    competitors_data = [
        {
            'name': 'TechCorp Industries',
            'legal_name': 'TechCorp Industries Ltd.',
            'aliases': ['TechCorp', 'TechCorp Ltd'],
            'industry': 'Technology',
            'headquarters': 'San Francisco, CA',
            'website': 'https://techcorp.com',
            'description': 'Leading AI technology company specializing in machine learning solutions',
            'total_patents': 1245,
            'active_patents': 987,
            'patent_applications_pending': 156,
            'key_technology_areas': ['AI', 'Machine Learning', 'Computer Vision'],
            'top_inventors': ['Dr. Smith', 'Dr. Johnson', 'Dr. Chen'],
            'filing_trend_6_months': 23,
            'avg_citations_per_patent': 8.5,
            'patent_quality_score': 7.8,
            'competitive_strength': 'high',
            'market_focus': ['North America', 'Europe', 'Asia']
        },
        {
            'name': 'InnovateTech Solutions',
            'legal_name': 'InnovateTech Solutions Inc.',
            'aliases': ['InnovateTech', 'ITS'],
            'industry': 'Software',
            'headquarters': 'Seattle, WA',
            'website': 'https://innovatetech.com',
            'description': 'Innovative software solutions for enterprise automation',
            'total_patents': 567,
            'active_patents': 423,
            'patent_applications_pending': 89,
            'key_technology_areas': ['Software Engineering', 'Automation', 'Cloud Computing'],
            'top_inventors': ['Dr. Williams', 'Dr. Davis'],
            'filing_trend_6_months': 15,
            'avg_citations_per_patent': 6.2,
            'patent_quality_score': 6.9,
            'competitive_strength': 'medium',
            'market_focus': ['North America', 'Europe']
        },
        {
            'name': 'Quantum Dynamics Corp',
            'legal_name': 'Quantum Dynamics Corporation',
            'aliases': ['QDC', 'Quantum Corp'],
            'industry': 'Quantum Computing',
            'headquarters': 'Boston, MA',
            'website': 'https://quantumdynamics.com',
            'description': 'Pioneering quantum computing hardware and software solutions',
            'total_patents': 234,
            'active_patents': 198,
            'patent_applications_pending': 67,
            'key_technology_areas': ['Quantum Computing', 'Quantum Algorithms', 'Superconducting Circuits'],
            'top_inventors': ['Dr. Quantum', 'Dr. Entangle'],
            'filing_trend_6_months': 34,
            'avg_citations_per_patent': 12.3,
            'patent_quality_score': 9.1,
            'competitive_strength': 'high',
            'market_focus': ['Global']
        }
    ]
    
    # Sample technology data
    technologies_data = [
        {
            'name': 'Machine Learning Algorithms',
            'description': 'Advanced ML algorithms for pattern recognition and prediction',
            'ipc_class': 'G06N 20/00',
            'cpc_class': 'G06N 20/00',
            'category': 'Artificial Intelligence',
            'maturity_level': 'developing',
            'patent_count': 1567,
            'growth_rate_6m': 34.5,
            'innovation_score': 8.2,
            'market_potential': 'high',
            'key_players': ['Google', 'Microsoft', 'IBM'],
            'related_technologies': ['Neural Networks', 'Deep Learning', 'Natural Language Processing']
        },
        {
            'name': 'Quantum Computing',
            'description': 'Quantum information processing and computing systems',
            'ipc_class': 'G06N 10/00',
            'cpc_class': 'G06N 10/00',
            'category': 'Quantum Technology',
            'maturity_level': 'emerging',
            'patent_count': 234,
            'growth_rate_6m': 67.8,
            'innovation_score': 9.1,
            'market_potential': 'high',
            'key_players': ['IBM', 'Google', 'Microsoft'],
            'related_technologies': ['Quantum Algorithms', 'Superconducting Circuits', 'Quantum Error Correction']
        },
        {
            'name': 'Blockchain Technology',
            'description': 'Distributed ledger and cryptocurrency technologies',
            'ipc_class': 'H04L 9/06',
            'cpc_class': 'H04L 9/0643',
            'category': 'Distributed Systems',
            'maturity_level': 'mature',
            'patent_count': 892,
            'growth_rate_6m': 12.3,
            'innovation_score': 7.4,
            'market_potential': 'medium',
            'key_players': ['Bitcoin', 'Ethereum', 'Hyperledger'],
            'related_technologies': ['Cryptography', 'Smart Contracts', 'Consensus Algorithms']
        },
        {
            'name': 'Computer Vision',
            'description': 'Image and video processing for automated visual recognition',
            'ipc_class': 'G06T 7/00',
            'cpc_class': 'G06T 7/00',
            'category': 'Computer Vision',
            'maturity_level': 'developing',
            'patent_count': 1123,
            'growth_rate_6m': 28.7,
            'innovation_score': 7.9,
            'market_potential': 'high',
            'key_players': ['OpenCV', 'NVIDIA', 'Intel'],
            'related_technologies': ['Image Processing', 'Object Detection', 'Facial Recognition']
        },
        {
            'name': 'Internet of Things',
            'description': 'Connected devices and sensor networks',
            'ipc_class': 'H04W 4/00',
            'cpc_class': 'H04W 4/00',
            'category': 'IoT Systems',
            'maturity_level': 'mature',
            'patent_count': 2156,
            'growth_rate_6m': 15.4,
            'innovation_score': 6.8,
            'market_potential': 'high',
            'key_players': ['Cisco', 'Amazon', 'Microsoft'],
            'related_technologies': ['Sensor Networks', 'Edge Computing', 'Wireless Communication']
        },
        {
            'name': 'Renewable Energy Storage',
            'description': 'Battery and energy storage systems for renewable energy',
            'ipc_class': 'H01M 10/00',
            'cpc_class': 'H01M 10/00',
            'category': 'Energy Technology',
            'maturity_level': 'developing',
            'patent_count': 967,
            'growth_rate_6m': 42.1,
            'innovation_score': 8.5,
            'market_potential': 'high',
            'key_players': ['Tesla', 'LG Chem', 'CATL'],
            'related_technologies': ['Lithium-ion Batteries', 'Solar Energy', 'Grid Integration']
        }
    ]
    
    print("Creating sample data using Django models...")
    
    # Create competitors
    created_competitors = 0
    for data in competitors_data:
        competitor, created = GlobalCompetitorProfile.objects.get_or_create(
            name=data['name'],
            defaults=data
        )
        if created:
            created_competitors += 1
            print(f"✓ Created competitor: {competitor.name}")
        else:
            print(f"- Competitor already exists: {competitor.name}")
    
    # Create technologies
    created_technologies = 0
    for data in technologies_data:
        technology, created = GlobalTechnologyArea.objects.get_or_create(
            name=data['name'],
            defaults=data
        )
        if created:
            created_technologies += 1
            print(f"✓ Created technology: {technology.name}")
        else:
            print(f"- Technology already exists: {technology.name}")
    
    print(f"\nSummary:")
    print(f"- Created {created_competitors} new competitors")
    print(f"- Created {created_technologies} new technologies")

def main():
    """Main function to create all sample data"""
    print("Creating sample data for Global Competitor Profiles and Technology Areas...")
    
    try:
        # Try using Django models first
        create_sample_data_direct()
        print("\n✅ Sample data creation completed successfully!")
    except Exception as e:
        print(f"Error creating sample data with models: {e}")
        print("Trying API approach...")
        try:
            create_sample_data_via_api()
            print("\n✅ Sample data creation via API completed!")
        except Exception as api_error:
            print(f"API approach also failed: {api_error}")
            print("\nPlease ensure:")
            print("1. Django server is running on http://localhost:8000")
            print("2. Database migrations have been applied")
            print("3. Global models exist in the database")
            sys.exit(1)

if __name__ == '__main__':
    main()