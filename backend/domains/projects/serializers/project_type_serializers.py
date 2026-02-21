"""
Project Type Serializers
API serializers for configurable project types
"""

from rest_framework import serializers
from ..models.project_types import ProjectType


class ProjectTypeSerializer(serializers.ModelSerializer):
    """Serializer for project types"""
    
    class Meta:
        model = ProjectType
        fields = [
            'id', 'name', 'description', 'category',
            'is_active', 'required_fields', 'estimated_duration',
            'color', 'permissions', 'min_role_level', 
            'display_order', 'icon', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CreateProjectTypeSerializer(serializers.ModelSerializer):
    """Serializer for creating project types"""
    
    class Meta:
        model = ProjectType
        fields = [
            'name', 'description', 'category', 'is_active',
            'required_fields', 'estimated_duration', 'color',
            'permissions', 'min_role_level', 'display_order', 'icon'
        ]
        
    def validate_color(self, value):
        """Validate hex color format"""
        if value and not value.startswith('#'):
            raise serializers.ValidationError("Color must be in hex format (e.g., #FF0000)")
        return value
        
    def validate_required_fields(self, value):
        """Validate required fields is a list"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Required fields must be a list")
        return value
        
    def validate_permissions(self, value):
        """Validate permissions is a list"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Permissions must be a list")
        return value


class ProjectTypeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing project types"""
    
    class Meta:
        model = ProjectType
        fields = [
            'id', 'name', 'description', 'category',
            'color', 'estimated_duration', 'display_order'
        ]