"""
Management command to create demo portfolios for testing
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from domains.patents.models import Portfolio, PortfolioAccess, Patent
from domains.accounts.models import Organization
import random
from datetime import date, timedelta
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates demo portfolios for Sony, Apple, and Amazon'

    def handle(self, *args, **options):
        self.stdout.write('Creating demo portfolios...')

        # Get or create a default organization
        org, _ = Organization.objects.get_or_create(
            name='Demo Organization',
            defaults={
                'domain': 'demo.com',
                'industry': 'tech',
                'size': 'large'
            }
        )

        # Get the first admin or manager user, or any user
        user = User.objects.filter(role__in=['admin', 'manager']).first()
        if not user:
            user = User.objects.first()
        
        if not user:
            self.stdout.write(self.style.ERROR('No users found. Please create a user first.'))
            return

        # Portfolio data
        portfolios_data = [
            {
                'name': 'Sony Electronics Portfolio',
                'company_name': 'Sony Corporation',
                'description': 'Patent portfolio for Sony electronics and entertainment technologies',
                'total_patents': 156,
                'active_patents': 98,
                'pending_patents': 34,
                'expired_patents': 24,
                'total_value': Decimal('45000000.00'),
                'annual_maintenance_cost': Decimal('890000.00'),
                'tags': ['electronics', 'entertainment', 'gaming', 'sensors'],
            },
            {
                'name': 'Apple Innovation Portfolio',
                'company_name': 'Apple Inc.',
                'description': 'Patent portfolio for Apple consumer electronics and software innovations',
                'total_patents': 289,
                'active_patents': 201,
                'pending_patents': 67,
                'expired_patents': 21,
                'total_value': Decimal('125000000.00'),
                'annual_maintenance_cost': Decimal('2100000.00'),
                'tags': ['mobile', 'computing', 'ui/ux', 'semiconductors'],
            },
            {
                'name': 'Amazon Technologies Portfolio',
                'company_name': 'Amazon.com Inc.',
                'description': 'Patent portfolio for Amazon e-commerce, cloud computing, and logistics',
                'total_patents': 203,
                'active_patents': 145,
                'pending_patents': 48,
                'expired_patents': 10,
                'total_value': Decimal('78000000.00'),
                'annual_maintenance_cost': Decimal('1450000.00'),
                'tags': ['e-commerce', 'cloud', 'logistics', 'ai/ml'],
            },
        ]

        created_portfolios = []
        
        for data in portfolios_data:
            portfolio, created = Portfolio.objects.get_or_create(
                company_name=data['company_name'],
                defaults={
                    **data,
                    'organization': org,
                    'owner': user,
                    'is_active': True,
                    'settings': {
                        'auto_update_metrics': True,
                        'notification_enabled': True
                    }
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created portfolio: {portfolio.company_name}'))
                
                # Grant the user full access
                PortfolioAccess.objects.create(
                    portfolio=portfolio,
                    user=user,
                    access_level='owner',
                    can_view=True,
                    can_edit=True,
                    can_delete=True,
                    can_manage_users=True,
                    granted_by=user
                )
                
                # Create some sample patents for each portfolio
                self.create_sample_patents(portfolio)
                
                created_portfolios.append(portfolio)
            else:
                self.stdout.write(self.style.WARNING(f'Portfolio already exists: {portfolio.company_name}'))

        # Summary
        self.stdout.write(self.style.SUCCESS(f'\nDemo portfolios created successfully!'))
        self.stdout.write(f'User "{user.email}" has been granted access to all portfolios.')
        self.stdout.write(f'\nPortfolios created:')
        for p in Portfolio.objects.all():
            self.stdout.write(f'  - {p.company_name}: {p.total_patents} patents, Value: ${p.total_value:,.0f}')

    def create_sample_patents(self, portfolio):
        """Create sample patents for a portfolio"""
        
        patent_types = ['utility', 'design', 'provisional']
        statuses = ['granted', 'pending', 'filed', 'expired']
        
        # Technology areas based on company
        tech_areas = {
            'Sony Corporation': [
                'Image Sensors', 'Gaming Technology', 'Audio Processing',
                'Display Technology', 'Camera Systems', 'Entertainment Systems'
            ],
            'Apple Inc.': [
                'Touch Interface', 'Mobile Computing', 'Wireless Communication',
                'Biometric Security', 'Operating Systems', 'Hardware Design'
            ],
            'Amazon.com Inc.': [
                'Recommendation Systems', 'Cloud Infrastructure', 'Warehouse Automation',
                'Voice Recognition', 'Payment Systems', 'Delivery Drones'
            ]
        }
        
        company_tech = tech_areas.get(portfolio.company_name, ['General Technology'])
        
        # Create 5-10 sample patents per portfolio
        num_patents = random.randint(5, 10)
        
        for i in range(num_patents):
            patent_num = f"{portfolio.company_name[:3].upper()}-{random.randint(1000000, 9999999)}"
            
            # Random dates
            filing_date = date.today() - timedelta(days=random.randint(30, 1825))
            grant_date = filing_date + timedelta(days=random.randint(180, 730)) if random.choice([True, False]) else None
            expiry_date = filing_date + timedelta(days=365*20) if grant_date else None
            
            Patent.objects.create(
                portfolio=portfolio,
                title=f"{random.choice(company_tech)} - Patent {i+1}",
                application_number=f"US{random.randint(10000000, 99999999)}",
                patent_number=patent_num if grant_date else None,
                status=random.choice(statuses),
                patent_type=random.choice(patent_types),
                filing_date=filing_date,
                grant_date=grant_date,
                expiry_date=expiry_date,
                technology_area=random.choice(company_tech),
                estimated_value=Decimal(random.randint(100000, 5000000)),
                maintenance_cost=Decimal(random.randint(5000, 50000)),
                abstract=f"This patent covers innovative methods and systems for {random.choice(company_tech).lower()}.",
                inventors=[f"Inventor {j+1}" for j in range(random.randint(1, 4))],
                assignees=[portfolio.company_name],
                tags=[portfolio.company_name.lower(), random.choice(company_tech).lower()]
            )
        
        self.stdout.write(f'  Created {num_patents} sample patents for {portfolio.company_name}')