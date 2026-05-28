"""Dataset and technology area views"""

import logging

logger = logging.getLogger(__name__)

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Q, Avg, Sum
from django.http import HttpResponse
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import timedelta
from collections import defaultdict
import json

from ..models import (
    AnalyticsProject, TechnologyArea, PatentDataset, CompetitorProfile,
    PatentRecord, ColumnMappingRule,
)
from ..serializers import (
    TechnologyAreaSerializer, PatentDatasetSerializer, PatentDatasetListSerializer,
)
from ..serializers_simple import SimpleAnalyticsProjectSerializer
from ..services import AnalyticsDataProcessor
from ..file_processors import process_patent_dataset

import re as _re


def _classify_claim(text: str) -> tuple[str, list[str]]:
    """Return (claim_type, references). Robust against typos and varied phrasings.

    A claim is dependent if any of these signals fire (in priority order):
      1. Opening clause references another claim ("of claim N", "according to claim N",
         "of N,", "as in N,") within the first 200 chars
      2. Body anywhere references "claim N"

    Otherwise independent — typically opens with "A <noun>, comprising:".
    """
    head = text[:200]

    # Layer 1: opener patterns (catches typos like "of 1" instead of "of claim 1")
    opener_patterns = [
        r'\bof\s+claim\s+(\d+)\b',
        r'\baccording\s+to\s+claim\s+(\d+)\b',
        r'\bas\s+(?:in|recited\s+in)\s+claim\s+(\d+)\b',
        r'\bclaim\s+(\d+)\b',
        # Typo fallbacks: "of N,", "of N "  — catches dropped "claim" word
        r'^\s*\d+\.\s*The\s+\w+\s+of\s+(\d+)[,\s]',
        r'^\s*\d+\.\s*The\s+\w+\s+according\s+to\s+(\d+)[,\s]',
    ]
    for pat in opener_patterns:
        m = _re.search(pat, head, _re.I | _re.M)
        if m:
            refs = _re.findall(pat, text, _re.I | _re.M)
            return 'dependent', list(dict.fromkeys(refs))

    # Layer 2: full-text scan for "claim N" references
    refs = _re.findall(r'\bclaim\s+(\d+)\b', text, _re.I)
    if refs:
        return 'dependent', list(dict.fromkeys(refs))

    return 'independent', []


def _build_claims_from_patent(patent_claims):
    """Convert patent.claims (list of {number, text} dicts) into a clean claims_text
    and a claims_structure with reliable independent/dependent classification."""
    if not isinstance(patent_claims, list) or not patent_claims:
        return '', []
    texts, structure = [], []
    for c in patent_claims:
        if isinstance(c, dict):
            num = c.get('number', '')
            raw = c.get('text', str(c))
        else:
            num = ''
            raw = str(c)
        text = _re.sub(r'<[^>]+>', '', raw).strip()
        prefix = f'{num}. ' if num and not text.startswith(f'{num}.') else ''
        full_text = prefix + text
        texts.append(full_text)
        claim_type, refs = _classify_claim(full_text)
        structure.append({
            'number': str(num),
            'text': text,
            'type': claim_type,
            'references': refs,
        })
    return '\n'.join(texts), structure


class PortfolioDatasetView(APIView):
    """
    GET /analytics/api/portfolio/{portfolio_id}/as-dataset/
    Aggregates portfolio patent data as an analytics dataset — no file upload needed.
    Returns filing trends, IPC distribution, assignee breakdown, status breakdown.
    """

    # Uses global default: IsAuthenticated

    def get(self, request, portfolio_id):
        from domains.patents.models import Patent, Portfolio
        from django.db.models.functions import TruncYear

        try:
            portfolio = Portfolio.objects.get(pk=portfolio_id)
        except Portfolio.DoesNotExist:
            return Response({'error': 'Portfolio not found'}, status=status.HTTP_404_NOT_FOUND)

        patents = Patent.objects.filter(portfolio=portfolio)
        total_patents = patents.count()

        # Status breakdown
        status_dist = dict(
            patents.values('status').annotate(n=Count('id')).values_list('status', 'n')
        )

        # IPC tech distribution — first 4 chars of each IPC code (subclass level)
        tech_dist = {}
        for patent in patents.only('ipc_classifications'):
            for ipc in (patent.ipc_classifications or []):
                key = str(ipc)[:4] if len(str(ipc)) >= 4 else str(ipc)
                tech_dist[key] = tech_dist.get(key, 0) + 1

        # Technology area field (free-text)
        tech_area_dist = dict(
            patents.exclude(technology_area='')
            .values('technology_area').annotate(n=Count('id'))
            .values_list('technology_area', 'n')
        )

        # Filing trends by year
        filing_trends_qs = (
            patents.exclude(filing_date=None)
            .annotate(year=TruncYear('filing_date'))
            .values('year')
            .annotate(count=Count('id'))
            .order_by('year')
        )
        filing_trends_formatted = [
            {'year': str(row['year'].year) if row['year'] else 'Unknown', 'count': row['count']}
            for row in filing_trends_qs
        ]

        # Assignee distribution
        assignee_dist = {}
        for patent in patents.only('assignees'):
            for assignee in (patent.assignees or []):
                name = str(assignee) if isinstance(assignee, str) else assignee.get('name', str(assignee))
                assignee_dist[name] = assignee_dist.get(name, 0) + 1

        # AI analysis coverage
        ai_analysis_count = PatentAnalysisResult.objects.filter(
            application_id__in=patents.values_list('application_number', flat=True)
        ).values('application_id').distinct().count()

        return Response({
            'portfolio_id': str(portfolio_id),
            'portfolio_name': portfolio.name,
            'total_patents': total_patents,
            'status_distribution': status_dist,
            'ipc_distribution': tech_dist,
            'technology_area_distribution': tech_area_dist,
            'filing_trends': filing_trends_formatted,
            'assignee_distribution': assignee_dist,
            'ai_analysis_count': ai_analysis_count,
        })


class TechnologyAreaViewSet(viewsets.ModelViewSet):
    """Technology area management"""

    serializer_class = TechnologyAreaSerializer
    # Uses global default: IsAuthenticated
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'keywords']
    ordering_fields = ['created_at', 'name', 'patent_count']
    
    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return TechnologyArea.objects.filter(project_id=project_id)
        return TechnologyArea.objects.all()


class PatentDatasetViewSet(viewsets.ModelViewSet):
    """Patent dataset management"""

    serializer_class = PatentDatasetSerializer
    # Uses global default: IsAuthenticated
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name', 'processing_status']

    def get_serializer_class(self):
        # Use lightweight serializer for list to avoid sending large JSON blobs
        if self.action == 'list':
            return PatentDatasetListSerializer
        return PatentDatasetSerializer

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return PatentDataset.objects.filter(project_id=project_id)
        return PatentDataset.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def process_data(self, request, pk=None):
        """Start processing patent data"""
        dataset = self.get_object()

        # For datasets imported from a portfolio or ODP (no file), records already exist —
        # just mark as completed if any PatentRecords are present.
        no_file_sources = ('portfolio', 'portfolio_import', 'odp_import')
        if dataset.data_source in no_file_sources or not dataset.data_file:
            record_count = PatentRecord.objects.filter(dataset=dataset).count()
            if record_count > 0:
                dataset.processing_status = 'completed'
                dataset.processed_patents = record_count
                dataset.total_patents = record_count
                dataset.processing_progress = 100
                dataset.save(update_fields=[
                    'processing_status', 'processed_patents',
                    'total_patents', 'processing_progress'
                ])
                return Response({
                    'status': 'Processing completed',
                    'dataset_id': str(dataset.id),
                    'processed_records': record_count,
                })
            return Response({
                'status': 'Processing failed',
                'dataset_id': str(dataset.id),
                'error': 'No patent records found for this dataset',
            }, status=400)

        try:
            # Process the uploaded file
            result = process_patent_dataset(str(dataset.id))

            if result['success']:
                return Response({
                    'status': 'Processing completed',
                    'dataset_id': str(dataset.id),
                    'processed_records': result['result']['processed_count'],
                    'total_rows': result['result']['total_rows'],
                    'column_mapping': result['result']['column_mapping']
                })
            else:
                return Response({
                    'status': 'Processing failed',
                    'dataset_id': str(dataset.id),
                    'error': result['error']
                }, status=400)

        except Exception as e:
            return Response({
                'status': 'Processing failed',
                'dataset_id': str(dataset.id),
                'error': str(e)
            }, status=500)
    
    @action(detail=True, methods=['get'])
    def records(self, request, pk=None):
        """Get parsed patent records for this dataset"""
        dataset = self.get_object()
        records = PatentRecord.objects.filter(dataset=dataset)
        
        # Pagination
        page_size = int(request.query_params.get('page_size', 50))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = records.count()
        records_page = records[start:end]
        
        # Serialize records
        records_data = []
        for record in records_page:
            # Use dedicated claims field (now populated for all records)
            
            record_data = {
                'id': str(record.id),
                'row_number': record.row_number,
                'patent_id': record.patent_id,
                'title': record.title,
                'abstract': record.abstract,
                'assignee': record.assignee,
                'parent_assignee': record.raw_data.get('ultimate parent', ''),
                'publication_number': record.raw_data.get('publication number', ''),
                'priority_date': record.raw_data.get('priority date - earliest', ''),
                'inventor': record.inventor,
                'filing_date': record.filing_date.isoformat() if record.filing_date else None,
                'publication_date': record.publication_date.isoformat() if record.publication_date else None,
                'grant_date': record.grant_date.isoformat() if record.grant_date else None,
                'country_code': record.country_code,
                'jurisdiction': record.jurisdiction,
                'patent_type': record.patent_type,
                'legal_status': record.legal_status,
                'ipc_classification': record.ipc_classification,
                'cpc_classification': record.cpc_classification,
                'uspc_classification': record.uspc_classification,
                'claims': record.claims,
                'claims_structure': record.claims_structure,
                'independent_claims_count': record.independent_claims_count,
                'dependent_claims_count': record.dependent_claims_count,
                'claims_count': record.claims_count,
                'forward_citations': record.forward_citations,
                'backward_citations': record.backward_citations,
                'raw_data': record.raw_data,
                'parsing_notes': record.parsing_notes
            }
            records_data.append(record_data)
        
        return Response({
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
            'records': records_data
        })
    
    @action(detail=True, methods=['post'])
    def analyze_columns(self, request, pk=None):
        """Analyze Excel columns and suggest intelligent mappings"""
        dataset = self.get_object()
        
        try:
            from .column_mapping_service import column_mapping_service
            import pandas as pd
            import os
            
            # Get column names and sample data from uploaded file
            if not dataset.data_file:
                return Response({
                    'error': 'No data file found for this dataset'
                }, status=400)
            
            file_path = dataset.data_file.path
            if not os.path.exists(file_path):
                return Response({
                    'error': 'Data file not found on disk'
                }, status=400)
            
            # Read file and extract column information
            if file_path.endswith('.xlsx') or file_path.endswith('.xls'):
                df = pd.read_excel(file_path, nrows=10)  # Read first 10 rows for sample
            elif file_path.endswith('.csv'):
                df = pd.read_csv(file_path, nrows=10)
            else:
                return Response({
                    'error': 'Unsupported file format'
                }, status=400)
            
            column_names = df.columns.tolist()
            sample_data = {col: df[col].dropna().tolist()[:5] for col in column_names}
            
            # Analyze columns
            mapping_result = column_mapping_service.analyze_columns(
                column_names=column_names,
                sample_data=sample_data,
                dataset=dataset
            )
            
            # Serialize results
            response_data = {
                'dataset_id': str(dataset.id),
                'total_columns': len(column_names),
                'matches': [
                    {
                        'source_column': match.source_column,
                        'target_field': match.target_field,
                        'confidence_score': match.confidence_score,
                        'is_core_field': match.is_core_field,
                        'suggested_field_type': match.suggested_field_type,
                        'sample_values': match.sample_values,
                        'mapping_rule_id': str(match.mapping_rule.id) if match.mapping_rule else None
                    }
                    for match in mapping_result.matches
                ],
                'unmapped_columns': mapping_result.unmapped_columns,
                'conflicts': mapping_result.conflicts,
                'high_confidence_count': len(mapping_result.high_confidence_matches),
                'medium_confidence_count': len(mapping_result.medium_confidence_matches),
                'low_confidence_count': len(mapping_result.low_confidence_matches)
            }
            
            return Response(response_data)
            
        except Exception as e:
            return Response({
                'error': f'Column analysis failed: {str(e)}'
            }, status=500)
    
    @action(detail=False, methods=['post'])  
    def auto_migrate_fields(self, request):
        """Auto-migrate pending dynamic fields"""
        try:
            from .dynamic_migration_service import dynamic_migration_service
            
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
            from .models import DynamicPatentField
            from .dynamic_migration_service import dynamic_migration_service
            
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
            
        except Exception as e:
            return Response({
                'error': f'Column analysis failed: {str(e)}'
            }, status=500)
    
    @action(detail=True, methods=['post'])
    def apply_mappings(self, request, pk=None):
        """Apply confirmed column mappings to dataset"""
        dataset = self.get_object()
        
        try:
            from .column_mapping_service import column_mapping_service, ColumnMatch
            
            mappings_data = request.data.get('mappings', [])
            if not mappings_data:
                return Response({
                    'error': 'No mappings provided'
                }, status=400)
            
            # Convert request data to ColumnMatch objects
            mappings = []
            for mapping_data in mappings_data:
                mapping = ColumnMatch(
                    source_column=mapping_data['source_column'],
                    target_field=mapping_data['target_field'],
                    confidence_score=mapping_data['confidence_score'],
                    mapping_rule=None,  # Will be resolved by service
                    is_core_field=mapping_data.get('is_core_field', True),
                    suggested_field_type=mapping_data.get('suggested_field_type', 'CharField'),
                    sample_values=mapping_data.get('sample_values', [])
                )
                mappings.append(mapping)
            
            # Apply mappings
            results = column_mapping_service.apply_mappings(
                dataset=dataset,
                mappings=mappings,
                user=request.user if request.user.is_authenticated else None
            )
            
            return Response({
                'status': 'Mappings applied successfully',
                'dataset_id': str(dataset.id),
                **results
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to apply mappings: {str(e)}'
            }, status=500)
    
    @action(detail=True, methods=['get'])
    def mapping_status(self, request, pk=None):
        """Get current mapping status for dataset"""
        dataset = self.get_object()
        
        mappings = dataset.column_mappings.all()
        
        response_data = {
            'dataset_id': str(dataset.id),
            'total_mappings': mappings.count(),
            'status_breakdown': {
                'pending': mappings.filter(status='pending').count(),
                'confirmed': mappings.filter(status='confirmed').count(),
                'rejected': mappings.filter(status='rejected').count(),
                'auto_applied': mappings.filter(status='auto_applied').count()
            },
            'mappings': [
                {
                    'id': str(mapping.id),
                    'source_column': mapping.source_column,
                    'target_field': mapping.target_field,
                    'confidence_score': mapping.confidence_score,
                    'status': mapping.status,
                    'sample_values': mapping.sample_values,
                    'processing_errors': mapping.processing_errors,
                    'reviewed_by': mapping.reviewed_by.email if mapping.reviewed_by else None,
                    'reviewed_at': mapping.reviewed_at.isoformat() if mapping.reviewed_at else None,
                    'admin_notes': mapping.admin_notes
                }
                for mapping in mappings
            ],
            'needs_review': mappings.filter(status='pending').count() > 0
        }
        
        return Response(response_data)
    
    @action(detail=False, methods=['post'])  
    def auto_migrate_fields(self, request):
        """Auto-migrate pending dynamic fields"""
        try:
            from .dynamic_migration_service import dynamic_migration_service
            
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
            from .models import DynamicPatentField
            from .dynamic_migration_service import dynamic_migration_service
            
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

    @action(detail=False, methods=['post'], url_path='import-from-portfolio')
    def import_from_portfolio(self, request):
        """Import patents from a Portfolio into an analytics PatentDataset."""
        from domains.patents.models import Patent, Portfolio

        portfolio_id = request.data.get('portfolio_id')
        project_id = request.data.get('project_id')
        name = request.data.get('name')

        if not portfolio_id or not project_id:
            return Response(
                {'error': 'portfolio_id and project_id are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        portfolio = get_object_or_404(Portfolio, pk=portfolio_id)
        project = get_object_or_404(AnalyticsProject, pk=project_id)

        patents = Patent.objects.filter(portfolio_id=portfolio_id)
        patent_count = patents.count()

        if patent_count == 0:
            return Response(
                {'error': 'Portfolio has no patents to import'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user

        dataset = PatentDataset.objects.create(
            project=project,
            name=name or f'Import from {portfolio.name}',
            description=f'Imported {patent_count} patents from portfolio "{portfolio.name}"',
            data_source='portfolio_import',
            processing_status='processing',
            total_patents=patent_count,
            created_by=user,
        )

        # Map Patent fields → PatentRecord fields
        records = []
        for idx, patent in enumerate(patents.iterator(), start=1):
            assignee = ', '.join(patent.assignees) if isinstance(patent.assignees, list) else str(patent.assignees or '')
            inventor = ', '.join(patent.inventors) if isinstance(patent.inventors, list) else str(patent.inventors or '')
            ipc  = ', '.join(patent.ipc_classifications)  if isinstance(patent.ipc_classifications, list)  else str(patent.ipc_classifications or '')
            cpc  = ', '.join(patent.cpc_classifications)  if isinstance(patent.cpc_classifications, list)  else str(patent.cpc_classifications or '')
            uspc = ', '.join(patent.uspc_classifications) if isinstance(patent.uspc_classifications, list) else str(patent.uspc_classifications or '')
            claims_text, claims_structure = _build_claims_from_patent(patent.claims)

            records.append(PatentRecord(
                dataset=dataset,
                row_number=idx,
                patent_id=patent.application_number or patent.patent_number or str(patent.id),
                title=patent.title or '',
                abstract=patent.abstract or '',
                description=patent.description or '',
                assignee=assignee,
                inventor=inventor,
                filing_date=patent.filing_date,
                grant_date=patent.grant_date,
                ipc_classification=ipc,
                cpc_classification=cpc,
                uspc_classification=uspc,
                patent_type=patent.patent_type or '',
                legal_status=patent.status or '',
                claims=claims_text,
                claims_structure=claims_structure,
                country_code='US',
                raw_data={'source_patent_id': str(patent.id)},
            ))

        PatentRecord.objects.bulk_create(records, batch_size=500)

        dataset.processed_patents = patent_count
        dataset.processing_status = 'completed'
        dataset.processing_progress = 100
        dataset.save(update_fields=['processed_patents', 'processing_status', 'processing_progress'])

        serializer = PatentDatasetSerializer(dataset)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='import-from-dataset')
    def import_from_dataset(self, request):
        """Copy patent records from another project's dataset into this project."""
        project_id = request.data.get('project_id')
        source_dataset_id = request.data.get('source_dataset_id')
        name = request.data.get('name')

        if not project_id or not source_dataset_id:
            return Response(
                {'error': 'project_id and source_dataset_id are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project = get_object_or_404(AnalyticsProject, pk=project_id)
        source_dataset = get_object_or_404(PatentDataset, pk=source_dataset_id)

        source_records = PatentRecord.objects.filter(dataset=source_dataset)
        record_count = source_records.count()

        if record_count == 0:
            return Response(
                {'error': 'Source dataset has no patent records to import'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dataset = PatentDataset.objects.create(
            project=project,
            name=name or f'Import from {source_dataset.name}',
            description=f'Copied {record_count} patents from dataset "{source_dataset.name}"',
            data_source='manual_upload',
            processing_status='processing',
            total_patents=record_count,
            created_by=request.user,
        )

        new_records = []
        for idx, rec in enumerate(source_records.iterator(), start=1):
            new_records.append(PatentRecord(
                dataset=dataset,
                row_number=idx,
                patent_id=rec.patent_id,
                title=rec.title,
                abstract=rec.abstract,
                assignee=rec.assignee,
                inventor=rec.inventor,
                filing_date=rec.filing_date,
                publication_date=rec.publication_date,
                grant_date=rec.grant_date,
                ipc_classification=rec.ipc_classification,
                cpc_classification=rec.cpc_classification,
                uspc_classification=rec.uspc_classification,
                country_code=rec.country_code,
                jurisdiction=rec.jurisdiction,
                patent_type=rec.patent_type,
                legal_status=rec.legal_status,
                claims=rec.claims,
                claims_structure=rec.claims_structure,
                independent_claims_count=rec.independent_claims_count,
                dependent_claims_count=rec.dependent_claims_count,
                claims_count=rec.claims_count,
                forward_citations=rec.forward_citations,
                backward_citations=rec.backward_citations,
                raw_data=rec.raw_data,
                parsing_notes=rec.parsing_notes,
            ))

        PatentRecord.objects.bulk_create(new_records, batch_size=500)

        dataset.processed_patents = record_count
        dataset.processing_status = 'completed'
        dataset.processing_progress = 100
        dataset.save(update_fields=['processed_patents', 'processing_status', 'processing_progress'])

        serializer = PatentDatasetSerializer(dataset)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='import-from-odp')
    def import_from_odp(self, request):
        """Import patents from USPTO ODP search results into an analytics PatentDataset."""
        project_id = request.data.get('project_id')
        name = request.data.get('name', 'ODP Import')
        search_params = request.data.get('search_params', {})
        application_numbers = request.data.get('application_numbers', [])

        if not project_id:
            return Response(
                {'error': 'project_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project = get_object_or_404(AnalyticsProject, pk=project_id)

        user = request.user

        # Import from ODP
        try:
            from domains.analytics.uspto_odp_service import USPTOODPClient
            client = USPTOODPClient()

            if application_numbers:
                # Import specific applications
                odp_results = []
                for app_num in application_numbers:
                    try:
                        result = client.get_application(app_num)
                        if result:
                            odp_results.append(result)
                    except Exception:
                        continue
            elif search_params:
                # Execute search
                search_response = client.search_applications(**search_params)
                odp_results = search_response.get('results', []) if search_response else []
            else:
                return Response(
                    {'error': 'Either search_params or application_numbers must be provided'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            patent_count = len(odp_results)
            if patent_count == 0:
                return Response(
                    {'error': 'No patents found matching the search criteria'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            dataset = PatentDataset.objects.create(
                project=project,
                name=name,
                description=f'Imported {patent_count} patents from USPTO ODP',
                data_source='odp_import',
                processing_status='processing',
                total_patents=patent_count,
                created_by=user,
            )

            records = []
            for idx, result in enumerate(odp_results, start=1):
                # Map ODP fields → PatentRecord fields
                records.append(PatentRecord(
                    dataset=dataset,
                    row_number=idx,
                    patent_id=result.get('applicationNumberText', result.get('patentNumber', str(idx))),
                    title=result.get('inventionTitle', ''),
                    abstract=result.get('abstractText', ''),
                    assignee=result.get('applicantNameText', result.get('assigneeEntityName', '')),
                    inventor=result.get('inventorNameText', ''),
                    filing_date=result.get('filingDate'),
                    grant_date=result.get('grantDate'),
                    publication_date=result.get('publicationDate'),
                    patent_type=result.get('applicationTypeCategory', ''),
                    legal_status=result.get('applicationStatusCategory', ''),
                    country_code='US',
                    raw_data=result,
                ))

            PatentRecord.objects.bulk_create(records, batch_size=500)

            dataset.processed_patents = patent_count
            dataset.processing_status = 'completed'
            dataset.processing_progress = 100
            dataset.save(update_fields=['processed_patents', 'processing_status', 'processing_progress'])

            serializer = PatentDatasetSerializer(dataset)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ImportError:
            return Response(
                {'error': 'USPTO ODP service is not available'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as e:
            return Response(
                {'error': f'ODP import failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


