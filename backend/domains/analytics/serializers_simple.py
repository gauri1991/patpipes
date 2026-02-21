"""Simplified serializers for analytics that work with current database structure"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AnalyticsProject

User = get_user_model()

class SimpleUserSerializer(serializers.ModelSerializer):
    """Simple user serializer"""
    firstName = serializers.CharField(source='first_name', read_only=True, default='')
    lastName = serializers.CharField(source='last_name', read_only=True, default='')
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'firstName', 'lastName']

class SimpleAnalyticsProjectSerializer(serializers.ModelSerializer):
    """Simplified analytics project serializer without nested relations"""
    
    progress_percentage = serializers.ReadOnlyField()
    created_by = SimpleUserSerializer(read_only=True)
    assigned_to = SimpleUserSerializer(read_only=True)
    
    class Meta:
        model = AnalyticsProject
        fields = [
            'id', 'name', 'description', 'status', 'priority',
            'analysis_scope', 'progress_percentage', 'due_date',
            'start_date', 'created_at', 'updated_at', 'created_by', 'assigned_to'
        ]