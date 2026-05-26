"""Visualization and insight views"""

import logging

logger = logging.getLogger(__name__)

from django.db.models import Count, Q
from django.http import HttpResponse
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
import json

from ..models import (
    AnalyticsProject, AnalyticsVisualization, AnalyticsInsight,
)
from ..serializers import (
    AnalyticsVisualizationSerializer, AnalyticsInsightSerializer,
)
from ..services import VisualizationEngine

class AnalyticsVisualizationViewSet(viewsets.ModelViewSet):
    """Analytics visualization management"""
    
    serializer_class = AnalyticsVisualizationSerializer
    # Uses global default: IsAuthenticated
    
    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return AnalyticsVisualization.objects.filter(project_id=project_id)
        return AnalyticsVisualization.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def generate_chart(self, request, pk=None):
        """Generate chart data for visualization"""
        visualization = self.get_object()
        
        # Generate chart data using visualization engine
        engine = VisualizationEngine(visualization.project)
        chart_data = engine.generate_visualization_data(
            visualization.visualization_type,
            visualization.filters
        )
        
        # Update visualization with generated data
        visualization.chart_data = chart_data
        visualization.status = 'completed'
        visualization.save()
        
        return Response({
            'status': 'Chart generated',
            'chart_data': chart_data
        })
    
    @action(detail=False, methods=['get'])
    def chart_templates(self, request):
        """Get available chart templates"""
        templates = [
            {
                'id': 'patent_timeline',
                'name': 'Patent Filing Timeline',
                'description': 'Track patent filings over time',
                'category': 'Temporal Analysis'
            },
            {
                'id': 'technology_landscape',
                'name': 'Technology Landscape Map',
                'description': 'Visualize technology areas and relationships',
                'category': 'Technology Analysis'
            },
            {
                'id': 'competitive_positioning',
                'name': 'Competitive Positioning',
                'description': 'Compare competitors in technology space',
                'category': 'Competitive Intelligence'
            },
            {
                'id': 'geographic_distribution',
                'name': 'Geographic Distribution',
                'description': 'Patent activity by geographic region',
                'category': 'Geographic Analysis'
            },
            {
                'id': 'citation_network',
                'name': 'Citation Network',
                'description': 'Patent citation relationships',
                'category': 'Network Analysis'
            },
            {
                'id': 'white_space_analysis',
                'name': 'White Space Analysis',
                'description': 'Identify innovation opportunities',
                'category': 'Opportunity Analysis'
            }
        ]
        
        return Response(templates)
    
    @action(detail=True, methods=['get'])
    def export_chart(self, request, pk=None):
        """Export visualization chart as image or data"""
        visualization = self.get_object()
        format_type = request.query_params.get('format', 'png').lower()
        
        if visualization.status != 'completed' or not visualization.chart_data:
            return Response({
                'error': 'Chart must be completed before export',
                'status': visualization.status
            }, status=400)
        
        if format_type == 'json':
            # Export chart data as JSON
            response = HttpResponse(
                json.dumps(visualization.chart_data, indent=2),
                content_type='application/json'
            )
            response['Content-Disposition'] = f'attachment; filename="{visualization.title}_data.json"'
            return response
            
        elif format_type == 'csv':
            # Export chart data as CSV
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write chart metadata
            writer.writerow(['Chart Export'])
            writer.writerow(['Title', visualization.title])
            writer.writerow(['Description', visualization.description])
            writer.writerow(['Type', visualization.visualization_type])
            writer.writerow(['Created', visualization.created_at.strftime('%Y-%m-%d')])
            writer.writerow([])
            
            # Write chart data
            chart_data = visualization.chart_data
            if isinstance(chart_data, dict) and 'data' in chart_data:
                data_points = chart_data['data']
                if data_points and isinstance(data_points, list):
                    # Write headers
                    if data_points:
                        first_item = data_points[0]
                        if isinstance(first_item, dict):
                            headers = list(first_item.keys())
                            writer.writerow(headers)
                            
                            # Write data rows
                            for item in data_points:
                                writer.writerow([item.get(h, '') for h in headers])
            
            csv_content = output.getvalue()
            output.close()
            
            response = HttpResponse(csv_content, content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{visualization.title}_data.csv"'
            return response
        
        elif format_type in ['png', 'svg', 'pdf']:
            # For image formats, we'll return a placeholder response
            # In a real implementation, you'd use a chart rendering library
            return Response({
                'message': f'{format_type.upper()} export will be available soon',
                'chart_id': str(visualization.id),
                'title': visualization.title,
                'format': format_type,
                'note': 'Image export requires chart rendering service integration'
            })
        
        else:
            return Response({
                'error': 'Unsupported format',
                'supported_formats': ['json', 'csv', 'png', 'svg', 'pdf']
            }, status=400)



class AnalyticsInsightViewSet(viewsets.ModelViewSet):
    """Analytics insight management"""

    serializer_class = AnalyticsInsightSerializer
    # Uses global default: IsAuthenticated
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'importance_score']

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return AnalyticsInsight.objects.filter(project_id=project_id)
        return AnalyticsInsight.objects.all().order_by('-impact_score', '-created_at')


