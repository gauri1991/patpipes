"""Column mapping, template, and infringement risk map views"""

import logging

logger = logging.getLogger(__name__)

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Q, Avg
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from collections import defaultdict
import json

from ..models import (
    AnalyticsProject, PatentDataset, PatentRecord,
    ColumnMappingRule, Template, TemplateUsageLog,
)

class ColumnMappingRuleViewSet(viewsets.ModelViewSet):
    """Column mapping rule management for intelligent Excel parsing"""
    
    # Uses global default: IsAuthenticated
    
    def get_queryset(self):
        return ColumnMappingRule.objects.filter(is_active=True)
    
    def get_serializer_class(self):
        # We'll create this serializer
        from ..serializers import ColumnMappingRuleSerializer
        return ColumnMappingRuleSerializer
    
    @action(detail=False, methods=['get'])
    def builtin_patterns(self, request):
        """Get built-in column patterns for reference"""
        from ..column_mapping_service import IntelligentColumnMappingService
        
        service = IntelligentColumnMappingService()
        patterns = {}
        
        for field, pattern_list in service.BUILTIN_PATTERNS.items():
            patterns[field] = {
                'field_name': field,
                'patterns': pattern_list,
                'field_type': service._get_default_field_type(field),
                'is_core_field': True
            }
        
        return Response(patterns)
    
    @action(detail=False, methods=['post'])
    def test_mapping(self, request):
        """Test column mapping against existing rules"""
        column_name = request.data.get('column_name')
        if not column_name:
            return Response({'error': 'column_name is required'}, status=400)
        
        from ..column_mapping_service import column_mapping_service
        
        # Get active rules
        rules = ColumnMappingRule.objects.filter(is_active=True)
        
        # Find best match
        best_match = None
        best_score = 0.0
        
        for rule in rules:
            score = column_mapping_service._calculate_match_score(column_name, rule.column_patterns)
            if score > best_score:
                best_score = score
                best_match = rule
        
        if best_match:
            response_data = {
                'column_name': column_name,
                'best_match': {
                    'target_field': best_match.target_field,
                    'confidence_score': best_score,
                    'field_type': best_match.field_type,
                    'is_core_field': best_match.is_core_field,
                    'matching_patterns': best_match.column_patterns
                }
            }
        else:
            response_data = {
                'column_name': column_name,
                'best_match': None,
                'message': 'No matching rules found'
            }
        
        return Response(response_data)
    
    @action(detail=False, methods=['post'])  
    def auto_migrate_fields(self, request):
        """Auto-migrate pending dynamic fields"""
        try:
            from ..dynamic_migration_service import dynamic_migration_service
            
            result = dynamic_migration_service.auto_migrate_pending_fields()
            
            return Response({
                'success': result['success'],
                'message': result['message'],
                'fields_migrated': result['fields_migrated'],
                'migration_name': result['migration_name']
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    @action(detail=False, methods=['get'])
    def migration_status(self, request):
        """Get dynamic field migration status"""  
        try:
            from ..models import DynamicPatentField
            from ..dynamic_migration_service import dynamic_migration_service
            
            pending_fields = dynamic_migration_service.get_pending_fields()
            
            return Response({
                'pending_count': len(pending_fields),
                'pending_fields': [
                    {
                        'field_name': field.field_name,
                        'field_type': field.field_type,
                        'display_name': field.display_name
                    }
                    for field in pending_fields
                ],
                'needs_migration': len(pending_fields) > 0
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=500)


class TemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing templates (charts, reports, dashboards, documents, workflows)
    """
    
    queryset = Template.objects.filter(is_active=True)
    # Uses global default: IsAuthenticated
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter by type if specified
        template_type = self.request.query_params.get('type')
        if template_type:
            queryset = queryset.filter(template_type=template_type)
        
        # Filter by category if specified
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by scope if specified
        scope = self.request.query_params.get('scope')
        if scope:
            queryset = queryset.filter(scope=scope)
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(tags__icontains=search)
            )
        
        # For authenticated users, show their templates and public/org templates
        if user and user.is_authenticated:
            queryset = queryset.filter(
                Q(created_by=user) |
                Q(is_public=True) |
                Q(scope='organization')
            ).distinct()
        else:
            # For unauthenticated users, show only public templates
            queryset = queryset.filter(is_public=True)
        
        return queryset
    
    def get_serializer_class(self):
        from ..serializers import TemplateSerializer
        return TemplateSerializer
    
    def perform_create(self, serializer):
        # Set the creator as the current user
        user = self.request.user if self.request.user.is_authenticated else None
        if not user:
            # For development, use first user
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.first()
        
        if user:
            serializer.save(created_by=user)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a template"""
        template = self.get_object()
        new_name = request.data.get('name', f"{template.name} (Copy)")
        
        user = request.user if request.user.is_authenticated else None
        if not user:
            # For development, use first user
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.first()
        
        duplicate = template.duplicate(new_name, user)
        serializer = self.get_serializer(duplicate)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def increment_usage(self, request, pk=None):
        """Increment template usage count"""
        template = self.get_object()
        template.increment_usage()
        
        # Log usage
        user = request.user if request.user.is_authenticated else None
        if user:
            TemplateUsageLog.objects.create(
                template=template,
                user=user,
                context=request.data.get('context', {})
            )
        
        return Response({'usage_count': template.usage_count})
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular templates"""
        limit = int(request.query_params.get('limit', 10))
        template_type = request.query_params.get('type')
        
        queryset = self.get_queryset().order_by('-usage_count')
        if template_type:
            queryset = queryset.filter(template_type=template_type)
        
        queryset = queryset[:limit]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recently created templates"""
        limit = int(request.query_params.get('limit', 10))
        template_type = request.query_params.get('type')
        
        queryset = self.get_queryset().order_by('-created_at')
        if template_type:
            queryset = queryset.filter(template_type=template_type)
        
        queryset = queryset[:limit]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all unique categories"""
        template_type = request.query_params.get('type')
        
        queryset = self.get_queryset()
        if template_type:
            queryset = queryset.filter(template_type=template_type)
        
        categories = queryset.values_list('category', flat=True).distinct()
        return Response(list(categories))
    
    @action(detail=False, methods=['get'])
    def tags(self, request):
        """Get all unique tags"""
        template_type = request.query_params.get('type')
        
        queryset = self.get_queryset()
        if template_type:
            queryset = queryset.filter(template_type=template_type)
        
        # Collect all tags
        all_tags = set()
        for template in queryset:
            if template.tags:
                all_tags.update(template.tags)
        
        return Response(list(all_tags))
    
    @action(detail=False, methods=['get'])
    def count_by_type(self, request):
        """Get template count by type"""
        counts = {}
        for template_type, _ in Template.TEMPLATE_TYPES:
            counts[template_type] = self.get_queryset().filter(template_type=template_type).count()
        
        return Response(counts)



class InfringementRiskMapView(APIView):
    """
    GET /analytics/api/infringement-risk-map/
    Returns infringement case risk distribution grouped by technology area × risk level.
    Used to render a heat map / bubble chart on the analytics dashboard.
    """

    # Uses global default: IsAuthenticated

    def get(self, request):
        from domains.infringement.models import InfringementCase

        cases = InfringementCase.objects.all()
        total = cases.count()

        # Risk level distribution (flat)
        risk_dist = {}
        for level in ['low', 'medium', 'high', 'critical']:
            risk_dist[level] = cases.filter(risk_level=level).count()

        # Technology area × risk level matrix
        # InfringementCase doesn't have a free-text technology_area field directly,
        # but patent_title can be used as a proxy. Group by risk_level and accused_party.
        accused_party_risk = list(
            cases
            .exclude(accused_party_name='')
            .values('accused_party_name', 'risk_level')
            .annotate(count=Count('id'))
            .order_by('-count')[:30]
        )

        # Infringement likelihood distribution (10-bucket histogram)
        likelihood_buckets = [0] * 10
        for case in cases.only('infringement_likelihood'):
            bucket = min(int(case.infringement_likelihood / 10), 9)
            likelihood_buckets[bucket] += 1

        likelihood_histogram = [
            {'range': f'{i * 10}-{(i + 1) * 10}%', 'count': likelihood_buckets[i]}
            for i in range(10)
        ]

        return Response({
            'total_cases': total,
            'risk_distribution': risk_dist,
            'accused_party_risk_matrix': accused_party_risk,
            'infringement_likelihood_histogram': likelihood_histogram,
        })
