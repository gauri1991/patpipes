"""
Serializers for Patent Portfolio Management
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Portfolio, PortfolioAccess, Patent, ClassificationDefinition

User = get_user_model()


class PortfolioSerializer(serializers.ModelSerializer):
    """Serializer for Portfolio model"""
    
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    accessible_users_count = serializers.IntegerField(source='users.count', read_only=True)
    patents_count = serializers.IntegerField(source='patents.count', read_only=True)
    
    class Meta:
        model = Portfolio
        fields = [
            'id', 'name', 'company_name', 'description',
            'organization', 'owner', 'owner_name',
            'total_patents', 'active_patents', 'pending_patents', 'expired_patents',
            'total_value', 'annual_maintenance_cost',
            'estimated_odp_count',
            'is_active', 'tags', 'settings',
            'accessible_users_count', 'patents_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'estimated_odp_count']


class PortfolioListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for portfolio listing"""
    
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    
    class Meta:
        model = Portfolio
        fields = [
            'id', 'name', 'company_name', 'owner_name',
            'total_patents', 'active_patents', 'pending_patents',
            'total_value', 'estimated_odp_count', 'is_active'
        ]


class PortfolioAccessSerializer(serializers.ModelSerializer):
    """Serializer for PortfolioAccess model"""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    portfolio_name = serializers.CharField(source='portfolio.name', read_only=True)
    
    class Meta:
        model = PortfolioAccess
        fields = [
            'id', 'portfolio', 'portfolio_name',
            'user', 'user_name', 'user_email',
            'access_level', 'can_view', 'can_edit', 
            'can_delete', 'can_manage_users',
            'granted_at', 'granted_by'
        ]
        read_only_fields = ['id', 'granted_at']


class PatentSerializer(serializers.ModelSerializer):
    """Serializer for Patent model"""
    
    portfolio_name = serializers.CharField(source='portfolio.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Patent
        fields = [
            'id', 'portfolio', 'portfolio_name',
            'project', 'project_name',
            'title', 'application_number', 'patent_number',
            'status', 'patent_type',
            'filing_date', 'priority_date', 'grant_date', 'expiry_date',
            'inventors', 'assignees',
            'technology_area', 'ipc_classifications',
            'estimated_value', 'maintenance_cost',
            'abstract', 'claims', 'tags',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for patent listing"""

    class Meta:
        model = Patent
        fields = [
            'id', 'title', 'patent_number', 'application_number',
            'status', 'patent_type', 'filing_date', 'grant_date', 'expiry_date',
            'technology_area', 'estimated_value',
            'assignees', 'inventors', 'tags', 'abstract',
            'portfolio',
        ]


class ClassificationDefinitionSerializer(serializers.ModelSerializer):
    """Serializer for ClassificationDefinition model"""
    child_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = ClassificationDefinition
        fields = ['id', 'code', 'system', 'level', 'title', 'parent_code', 'indent_level', 'child_count']


class UserPortfolioAccessSerializer(serializers.Serializer):
    """Serializer for checking user's portfolio access"""
    
    portfolio_count = serializers.IntegerField()
    portfolios = PortfolioListSerializer(many=True)
    default_portfolio = serializers.UUIDField(allow_null=True)