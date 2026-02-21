"""
Project Types Model
Configurable project types for dynamic project creation
"""

from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class ProjectType(models.Model):
    """Configurable project types for the patent platform"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    category = models.CharField(max_length=50, db_index=True)
    
    # Configuration
    is_active = models.BooleanField(default=True)
    required_fields = models.JSONField(default=list, help_text="List of required fields for this project type")
    estimated_duration = models.IntegerField(null=True, blank=True, help_text="Estimated duration in days")
    color = models.CharField(max_length=7, null=True, blank=True, help_text="Hex color code")
    
    # Permissions and Access
    permissions = models.JSONField(default=list, help_text="Required permissions for this project type")
    min_role_level = models.CharField(max_length=20, default='viewer', choices=[
        ('viewer', 'Viewer'),
        ('paralegal', 'Paralegal'),
        ('attorney', 'Attorney'),
        ('lead_attorney', 'Lead Attorney'),
        ('admin', 'Admin'),
    ])
    
    # Metadata
    display_order = models.IntegerField(default=0, help_text="Order for displaying in UI")
    icon = models.CharField(max_length=50, null=True, blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['display_order', 'name']
        verbose_name = "Project Type"
        verbose_name_plural = "Project Types"
        
    def __str__(self):
        return self.name


# Default project types data
DEFAULT_PROJECT_TYPES = [
    {
        'name': 'Prior Art Search - Patentability',
        'description': 'Comprehensive prior art search to assess patentability of an invention',
        'category': 'Search Services',
        'required_fields': ['invention_description', 'technical_field', 'search_scope'],
        'estimated_duration': 5,
        'color': '#3B82F6',
        'min_role_level': 'paralegal',
    },
    {
        'name': 'Prior Art Search - Validity',
        'description': 'Search to validate or challenge existing patent claims',
        'category': 'Search Services', 
        'required_fields': ['patent_number', 'claims_to_analyze', 'search_scope'],
        'estimated_duration': 7,
        'color': '#10B981',
        'min_role_level': 'attorney',
    },
    {
        'name': 'Prior Art Search - Invalidity',
        'description': 'Search for prior art to invalidate competitor patents',
        'category': 'Search Services',
        'required_fields': ['target_patent', 'claims_to_challenge', 'search_strategy'],
        'estimated_duration': 10,
        'color': '#F59E0B',
        'min_role_level': 'attorney',
    },
    {
        'name': 'Freedom to Operate Search',
        'description': 'FTO analysis to assess freedom to commercialize a product',
        'category': 'Search Services',
        'required_fields': ['product_description', 'market_regions', 'commercialization_date'],
        'estimated_duration': 14,
        'color': '#EF4444',
        'min_role_level': 'attorney',
    },
    {
        'name': 'Infringement Search',
        'description': 'Search for potential patent infringement issues',
        'category': 'Search Services',
        'required_fields': ['product_specifications', 'patent_portfolio', 'jurisdiction'],
        'estimated_duration': 8,
        'color': '#8B5CF6',
        'min_role_level': 'attorney',
    },
    {
        'name': 'State of Art Search',
        'description': 'Comprehensive technology landscape analysis',
        'category': 'Search Services',
        'required_fields': ['technology_domain', 'time_period', 'geographic_scope'],
        'estimated_duration': 12,
        'color': '#06B6D4',
        'min_role_level': 'paralegal',
    },
    {
        'name': 'Patent Portfolio Analysis',
        'description': 'Strategic analysis of patent portfolios',
        'category': 'Analytics',
        'required_fields': ['portfolio_scope', 'analysis_objectives', 'competitive_landscape'],
        'estimated_duration': 21,
        'color': '#84CC16',
        'min_role_level': 'attorney',
    },
    {
        'name': 'Patent Drafting - Utility',
        'description': 'Professional utility patent application drafting',
        'category': 'Drafting Services',
        'required_fields': ['invention_disclosure', 'inventor_information', 'filing_jurisdiction'],
        'estimated_duration': 30,
        'color': '#F97316',
        'min_role_level': 'attorney',
    },
    {
        'name': 'Patent Drafting - Provisional',
        'description': 'Provisional patent application preparation',
        'category': 'Drafting Services',
        'required_fields': ['invention_summary', 'priority_claims', 'filing_strategy'],
        'estimated_duration': 14,
        'color': '#EC4899',
        'min_role_level': 'attorney',
    },
    {
        'name': 'Patent Illustration',
        'description': 'Professional patent drawing and illustration services',
        'category': 'Support Services',
        'required_fields': ['specification_document', 'drawing_requirements', 'filing_jurisdiction'],
        'estimated_duration': 7,
        'color': '#6366F1',
        'min_role_level': 'paralegal',
    },
    {
        'name': 'Patent Proofreading',
        'description': 'Professional proofreading and quality assurance',
        'category': 'Support Services',
        'required_fields': ['document_type', 'deadline', 'quality_requirements'],
        'estimated_duration': 3,
        'color': '#14B8A6',
        'min_role_level': 'paralegal',
    },
]