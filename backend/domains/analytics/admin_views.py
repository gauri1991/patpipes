"""
Admin-specific views for Data Configuration management
Provides comprehensive CRUD operations with granular permission checks
"""

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Q, Avg, F
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from datetime import timedelta
from collections import defaultdict

from .models import (
    ColumnMappingRule, DatasetColumnMapping, DynamicPatentField,
    PatentDataset, AnalyticsProject
)
from .serializers import (
    ColumnMappingRuleSerializer, DatasetColumnMappingSerializer, 
    DynamicPatentFieldSerializer
)
from .dynamic_migration_service import dynamic_migration_service


class DataConfigurationPermission(BasePermission):
    """
    Custom permission class for data configuration operations
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Get user's data configuration permissions
        try:
            permissions = request.user.data_configuration_permissions
        except:
            return False
        
        # Map view actions to required permissions
        permission_map = {
            # Column Mapping Rules
            'column_mapping_rules': {
                'list': 'can_view_mapping_rules',
                'retrieve': 'can_view_mapping_rules',
                'create': 'can_create_mapping_rules',
                'update': 'can_edit_mapping_rules',
                'partial_update': 'can_edit_mapping_rules',
                'destroy': 'can_delete_mapping_rules',
                'bulk_activate': 'can_activate_mapping_rules',
                'import_rules': 'can_import_export_rules',
                'export_rules': 'can_import_export_rules',
            },
            # Dataset Mappings
            'dataset_mappings': {
                'list': 'can_view_dataset_mappings',
                'retrieve': 'can_view_dataset_mappings',
                'update': 'can_edit_dataset_mappings',
                'partial_update': 'can_edit_dataset_mappings',
                'approve_mapping': 'can_approve_mappings',
                'reject_mapping': 'can_reject_mappings',
                'bulk_manage': 'can_bulk_manage_mappings',
            },
            # Dynamic Fields
            'dynamic_fields': {
                'list': 'can_view_dynamic_fields',
                'retrieve': 'can_view_dynamic_fields',
                'create': 'can_create_dynamic_fields',
                'update': 'can_edit_dynamic_fields',
                'partial_update': 'can_edit_dynamic_fields',
                'destroy': 'can_delete_dynamic_fields',
                'migrate_field': 'can_migrate_fields',
                'archive_field': 'can_archive_fields',
            }
        }
        
        # Get the required permission for this action
        view_name = getattr(view, 'basename', None)
        action = view.action
        
        if view_name in permission_map and action in permission_map[view_name]:
            required_permission = permission_map[view_name][action]
            return getattr(permissions, required_permission, False)
        
        # For actions not in the map, check if user has any data config permission
        return permissions.has_any_data_config_permission()


class ColumnMappingRuleAdminViewSet(viewsets.ModelViewSet):
    """
    Admin interface for managing column mapping rules
    """
    queryset = ColumnMappingRule.objects.all()
    serializer_class = ColumnMappingRuleSerializer
    permission_classes = [DataConfigurationPermission]
    basename = 'column_mapping_rules'
    
    def get_queryset(self):
        queryset = ColumnMappingRule.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(is_active=(status_filter == 'active'))
        
        # Filter by field type
        field_type = self.request.query_params.get('field_type', None)
        if field_type:
            queryset = queryset.filter(field_type=field_type)
        
        # Search by target field or patterns
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(target_field__icontains=search) |
                Q(column_patterns__icontains=search)
            )
        
        # Order by success rate and creation date
        return queryset.order_by('-success_rate', '-created_at')
    
    @action(detail=False, methods=['post'])
    def bulk_activate(self, request):
        """Bulk activate/deactivate mapping rules"""
        rule_ids = request.data.get('rule_ids', [])
        activate = request.data.get('activate', True)
        
        if not rule_ids:
            return Response({'error': 'No rule IDs provided'}, status=400)
        
        updated = ColumnMappingRule.objects.filter(
            id__in=rule_ids
        ).update(
            is_active=activate,
            updated_at=timezone.now()
        )
        
        return Response({
            'success': True,
            'updated_count': updated,
            'action': 'activated' if activate else 'deactivated'
        })
    
    @action(detail=False, methods=['post'])
    def import_rules(self, request):
        """Import mapping rules from file"""
        # TODO: Implement file import functionality
        return Response({
            'success': False,
            'message': 'Import functionality not yet implemented'
        }, status=501)
    
    @action(detail=False, methods=['get'])
    def export_rules(self, request):
        """Export mapping rules to file"""
        # TODO: Implement file export functionality
        return Response({
            'success': False,
            'message': 'Export functionality not yet implemented'
        }, status=501)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get mapping rules analytics"""
        total_rules = ColumnMappingRule.objects.count()
        active_rules = ColumnMappingRule.objects.filter(is_active=True).count()
        
        # Success rate distribution
        success_rates = list(ColumnMappingRule.objects.values_list('success_rate', flat=True))
        avg_success_rate = sum(success_rates) / len(success_rates) if success_rates else 0
        
        # Field type distribution
        field_types = ColumnMappingRule.objects.values('field_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Core vs non-core fields
        core_fields = ColumnMappingRule.objects.filter(is_core_field=True).count()
        non_core_fields = total_rules - core_fields
        
        return Response({
            'total_rules': total_rules,
            'active_rules': active_rules,
            'average_success_rate': round(avg_success_rate, 2),
            'field_type_distribution': list(field_types),
            'core_vs_non_core': {
                'core_fields': core_fields,
                'non_core_fields': non_core_fields
            }
        })


class DatasetMappingAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin interface for viewing and managing dataset mappings
    """
    queryset = DatasetColumnMapping.objects.all()
    serializer_class = DatasetColumnMappingSerializer
    permission_classes = [DataConfigurationPermission]
    basename = 'dataset_mappings'
    
    def get_queryset(self):
        queryset = DatasetColumnMapping.objects.select_related(
            'dataset', 'dataset__project'
        ).all()
        
        # Filter by dataset
        dataset_id = self.request.query_params.get('dataset_id', None)
        if dataset_id:
            queryset = queryset.filter(dataset_id=dataset_id)
        
        # Filter by project
        project_id = self.request.query_params.get('project_id', None)
        if project_id:
            queryset = queryset.filter(dataset__project_id=project_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by confidence threshold
        min_confidence = self.request.query_params.get('min_confidence', None)
        if min_confidence:
            queryset = queryset.filter(confidence_score__gte=float(min_confidence))
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def approve_mapping(self, request, pk=None):
        """Approve a mapping suggestion"""
        mapping = self.get_object()
        mapping.status = 'confirmed'
        mapping.reviewed_by = request.user
        mapping.reviewed_at = timezone.now()
        mapping.admin_notes = request.data.get('notes', '')
        mapping.save()
        
        return Response({
            'success': True,
            'message': 'Mapping approved successfully',
            'mapping_id': str(mapping.id)
        })
    
    @action(detail=True, methods=['post'])
    def reject_mapping(self, request, pk=None):
        """Reject a mapping suggestion"""
        mapping = self.get_object()
        mapping.status = 'rejected'
        mapping.reviewed_by = request.user
        mapping.reviewed_at = timezone.now()
        mapping.admin_notes = request.data.get('notes', '')
        mapping.save()
        
        return Response({
            'success': True,
            'message': 'Mapping rejected successfully',
            'mapping_id': str(mapping.id)
        })
    
    @action(detail=False, methods=['post'])
    def bulk_manage(self, request):
        """Bulk approve/reject mappings"""
        mapping_ids = request.data.get('mapping_ids', [])
        action_type = request.data.get('action', 'approve')  # approve or reject
        notes = request.data.get('notes', '')
        
        if not mapping_ids:
            return Response({'error': 'No mapping IDs provided'}, status=400)
        
        if action_type not in ['approve', 'reject']:
            return Response({'error': 'Invalid action type'}, status=400)
        
        status_value = 'confirmed' if action_type == 'approve' else 'rejected'
        
        updated = DatasetColumnMapping.objects.filter(
            id__in=mapping_ids
        ).update(
            status=status_value,
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
            admin_notes=notes
        )
        
        return Response({
            'success': True,
            'updated_count': updated,
            'action': f'{action_type}d'
        })
    
    @action(detail=False, methods=['get'])
    def pending_review(self, request):
        """Get mappings pending review"""
        pending_mappings = self.get_queryset().filter(status='pending')
        
        # Group by confidence level
        high_confidence = pending_mappings.filter(confidence_score__gte=90).count()
        medium_confidence = pending_mappings.filter(
            confidence_score__gte=70, confidence_score__lt=90
        ).count()
        low_confidence = pending_mappings.filter(confidence_score__lt=70).count()
        
        return Response({
            'total_pending': pending_mappings.count(),
            'by_confidence': {
                'high': high_confidence,
                'medium': medium_confidence,
                'low': low_confidence
            }
        })


class DynamicFieldAdminViewSet(viewsets.ModelViewSet):
    """
    Admin interface for managing dynamic fields
    """
    queryset = DynamicPatentField.objects.all()
    serializer_class = DynamicPatentFieldSerializer
    permission_classes = [DataConfigurationPermission]
    basename = 'dynamic_fields'
    
    def get_queryset(self):
        queryset = DynamicPatentField.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            if status_filter == 'active':
                queryset = queryset.filter(is_active=True)
            elif status_filter == 'migrated':
                queryset = queryset.filter(migration_applied=True)
            elif status_filter == 'pending':
                queryset = queryset.filter(is_active=True, migration_applied=False)
        
        # Filter by field type
        field_type = self.request.query_params.get('field_type', None)
        if field_type:
            queryset = queryset.filter(field_type=field_type)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def migrate_field(self, request, pk=None):
        """Migrate a specific dynamic field"""
        field = self.get_object()
        
        if field.migration_applied:
            return Response({
                'success': False,
                'message': 'Field is already migrated'
            }, status=400)
        
        # Create migration for this field only
        success, migration_name = dynamic_migration_service.generate_and_apply_migration([field])
        
        if success:
            return Response({
                'success': True,
                'message': 'Field migrated successfully',
                'migration_name': migration_name
            })
        else:
            return Response({
                'success': False,
                'message': 'Migration failed'
            }, status=500)
    
    @action(detail=True, methods=['post'])
    def archive_field(self, request, pk=None):
        """Archive a dynamic field"""
        field = self.get_object()
        field.is_active = False
        field.save()
        
        return Response({
            'success': True,
            'message': 'Field archived successfully'
        })
    
    @action(detail=False, methods=['post'])
    def bulk_migrate(self, request):
        """Migrate all pending dynamic fields"""
        result = dynamic_migration_service.auto_migrate_pending_fields()
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def migration_status(self, request):
        """Get overall migration status"""
        total_fields = DynamicPatentField.objects.filter(is_active=True).count()
        migrated_fields = DynamicPatentField.objects.filter(
            is_active=True, migration_applied=True
        ).count()
        pending_fields = total_fields - migrated_fields
        
        return Response({
            'total_fields': total_fields,
            'migrated_fields': migrated_fields,
            'pending_fields': pending_fields,
            'migration_complete': pending_fields == 0
        })


class DataConfigurationAnalyticsView(viewsets.ViewSet):
    """
    Analytics and insights for data configuration
    """
    permission_classes = [DataConfigurationPermission]
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get overview analytics for data configuration"""
        # Mapping rules stats
        total_rules = ColumnMappingRule.objects.count()
        active_rules = ColumnMappingRule.objects.filter(is_active=True).count()
        
        # Dataset mappings stats
        total_mappings = DatasetColumnMapping.objects.count()
        confirmed_mappings = DatasetColumnMapping.objects.filter(status='confirmed').count()
        pending_mappings = DatasetColumnMapping.objects.filter(status='pending').count()
        
        # Dynamic fields stats
        total_fields = DynamicPatentField.objects.filter(is_active=True).count()
        migrated_fields = DynamicPatentField.objects.filter(
            is_active=True, migration_applied=True
        ).count()
        
        # Recent activity (last 30 days)
        recent_date = timezone.now() - timedelta(days=30)
        recent_mappings = DatasetColumnMapping.objects.filter(
            created_at__gte=recent_date
        ).count()
        recent_fields = DynamicPatentField.objects.filter(
            created_at__gte=recent_date
        ).count()
        
        return Response({
            'mapping_rules': {
                'total': total_rules,
                'active': active_rules,
                'inactive': total_rules - active_rules
            },
            'dataset_mappings': {
                'total': total_mappings,
                'confirmed': confirmed_mappings,
                'pending': pending_mappings,
                'rejected': total_mappings - confirmed_mappings - pending_mappings
            },
            'dynamic_fields': {
                'total': total_fields,
                'migrated': migrated_fields,
                'pending_migration': total_fields - migrated_fields
            },
            'recent_activity': {
                'new_mappings': recent_mappings,
                'new_fields': recent_fields
            }
        })