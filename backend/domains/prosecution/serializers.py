"""
Patent Prosecution Serializers
DRF serializers for prosecution-related API endpoints
"""

from rest_framework import serializers
from .models import (
    PatentApplication,
    Claim,
    ProsecutionEvent,
    OfficeAction,
    ProsecutionDeadline,
    ProsecutionDocument
)


class ClaimSerializer(serializers.ModelSerializer):
    """Serializer for patent claims"""
    
    class Meta:
        model = Claim
        fields = [
            'id', 'application', 'claim_number', 'claim_type', 'claim_text',
            'is_cancelled', 'is_amended', 'rejection_history',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProsecutionEventSerializer(serializers.ModelSerializer):
    """Serializer for prosecution events"""
    
    class Meta:
        model = ProsecutionEvent
        fields = [
            'id', 'event_type', 'event_date', 'due_date',
            'title', 'description', 'handled_by', 'documents',
            'metadata', 'is_completed', 'is_urgent',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OfficeActionSerializer(serializers.ModelSerializer):
    """Serializer for office actions"""
    
    class Meta:
        model = OfficeAction
        fields = [
            'id', 'action_type', 'mailing_date', 'response_due_date',
            'examiner_name', 'examiner_phone', 'art_unit', 'summary',
            'rejections', 'response_status', 'response_strategy',
            'response_filed_date', 'office_action_document',
            'response_document', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProsecutionDeadlineSerializer(serializers.ModelSerializer):
    """Serializer for prosecution deadlines"""
    
    class Meta:
        model = ProsecutionDeadline
        fields = [
            'id', 'deadline_type', 'due_date', 'title', 'description',
            'priority', 'is_completed', 'completed_date', 'is_cancelled',
            'reminder_sent', 'reminder_dates', 'assigned_to',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProsecutionDocumentSerializer(serializers.ModelSerializer):
    """Serializer for prosecution documents"""
    
    class Meta:
        model = ProsecutionDocument
        fields = [
            'id', 'document_type', 'title', 'description',
            'file_path', 'file_size', 'file_type', 'version',
            'is_current_version', 'is_filed', 'filing_date',
            'uploaded_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'uploaded_by']


class PatentApplicationSerializer(serializers.ModelSerializer):
    """Main serializer for patent applications"""
    
    claims = ClaimSerializer(many=True, read_only=True)
    events = ProsecutionEventSerializer(many=True, read_only=True)
    office_actions = OfficeActionSerializer(many=True, read_only=True)
    deadlines = ProsecutionDeadlineSerializer(many=True, read_only=True)
    documents = ProsecutionDocumentSerializer(many=True, read_only=True)
    
    class Meta:
        model = PatentApplication
        fields = [
            'id', 'title', 'application_number', 'patent_number',
            'application_type', 'jurisdiction', 'status',
            'organization', 'attorney', 'inventors', 'assignees',
            'priority_date', 'filing_date', 'publication_date',
            'grant_date', 'expiry_date', 'abstract', 'background',
            'summary', 'detailed_description', 'technology_area',
            'ipc_classes', 'us_classes', 'keywords',
            'estimated_value', 'costs_to_date', 'estimated_total_cost',
            'is_confidential', 'priority_level',
            'created_at', 'updated_at',
            'claims', 'events', 'office_actions', 'deadlines', 'documents'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatentApplicationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for application lists"""
    
    claims_count = serializers.SerializerMethodField()
    next_deadline = serializers.SerializerMethodField()
    
    class Meta:
        model = PatentApplication
        fields = [
            'id', 'title', 'application_number', 'application_type',
            'status', 'attorney', 'filing_date', 'priority_level',
            'claims_count', 'next_deadline', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_claims_count(self, obj):
        return obj.claims.count()
    
    def get_next_deadline(self, obj):
        next_deadline = obj.deadlines.filter(
            is_completed=False,
            is_cancelled=False
        ).order_by('due_date').first()
        
        if next_deadline:
            return {
                'id': next_deadline.id,
                'title': next_deadline.title,
                'due_date': next_deadline.due_date,
                'priority': next_deadline.priority
            }
        return None