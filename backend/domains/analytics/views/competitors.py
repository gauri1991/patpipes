"""Competitor and global taxonomy views"""

import logging

logger = logging.getLogger(__name__)

from django.db.models import Count, Q, Avg, Sum
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import (
    CompetitorProfile, GlobalCompetitorProfile, GlobalTechnologyArea,
)
from ..serializers import (
    CompetitorProfileSerializer, GlobalCompetitorProfileSerializer,
    GlobalTechnologyAreaSerializer,
)

class CompetitorProfileViewSet(viewsets.ModelViewSet):
    """Competitor profile management"""

    serializer_class = CompetitorProfileSerializer
    # Uses global default: IsAuthenticated
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'headquarters_country']
    ordering_fields = ['created_at', 'name']
    
    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return CompetitorProfile.objects.filter(project_id=project_id)
        return CompetitorProfile.objects.all()



class GlobalCompetitorProfileViewSet(viewsets.ModelViewSet):
    """Global competitor profiles management"""
    
    queryset = GlobalCompetitorProfile.objects.all()
    serializer_class = GlobalCompetitorProfileSerializer
    # Uses global default: IsAuthenticated
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by search term
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(legal_name__icontains=search) | 
                Q(industry__icontains=search)
            )
        
        # Filter by industry
        industry = self.request.query_params.get('industry')
        if industry:
            queryset = queryset.filter(industry__icontains=industry)
        
        # Filter by competitive strength
        strength = self.request.query_params.get('strength')
        if strength:
            queryset = queryset.filter(competitive_strength=strength)
        
        return queryset.order_by('-total_patents', 'name')
    
    @action(detail=False, methods=['get'])
    def industries(self, request):
        """Get all unique industries"""
        industries = GlobalCompetitorProfile.objects.values_list('industry', flat=True).distinct()
        return Response([i for i in industries if i])
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get competitor statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total_competitors': queryset.count(),
            'by_strength': {
                'high': queryset.filter(competitive_strength='high').count(),
                'medium': queryset.filter(competitive_strength='medium').count(),
                'low': queryset.filter(competitive_strength='low').count(),
            },
            'total_patents': queryset.aggregate(total=Sum('total_patents'))['total'] or 0,
            'avg_quality_score': queryset.aggregate(avg=Avg('patent_quality_score'))['avg'] or 0,
        }
        
        return Response(stats)


class GlobalTechnologyAreaViewSet(viewsets.ModelViewSet):
    """Global technology areas management"""
    
    queryset = GlobalTechnologyArea.objects.all()
    serializer_class = GlobalTechnologyAreaSerializer
    # Uses global default: IsAuthenticated
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by search term
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) | 
                Q(category__icontains=search) |
                Q(ipc_class__icontains=search) |
                Q(cpc_class__icontains=search)
            )
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__icontains=category)
        
        # Filter by maturity level
        maturity = self.request.query_params.get('maturity')
        if maturity:
            queryset = queryset.filter(maturity_level=maturity)
        
        # Filter by market potential
        potential = self.request.query_params.get('potential')
        if potential:
            queryset = queryset.filter(market_potential=potential)
        
        return queryset.order_by('-innovation_score', 'name')
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all unique categories"""
        categories = GlobalTechnologyArea.objects.values_list('category', flat=True).distinct()
        return Response([c for c in categories if c])
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get technology area statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total_technologies': queryset.count(),
            'by_maturity': {
                'emerging': queryset.filter(maturity_level='emerging').count(),
                'developing': queryset.filter(maturity_level='developing').count(),
                'mature': queryset.filter(maturity_level='mature').count(),
                'declining': queryset.filter(maturity_level='declining').count(),
            },
            'by_potential': {
                'high': queryset.filter(market_potential='high').count(),
                'medium': queryset.filter(market_potential='medium').count(),
                'low': queryset.filter(market_potential='low').count(),
            },
            'total_patents': queryset.aggregate(total=Sum('patent_count'))['total'] or 0,
            'avg_innovation_score': queryset.aggregate(avg=Avg('innovation_score'))['avg'] or 0,
        }

        return Response(stats)


