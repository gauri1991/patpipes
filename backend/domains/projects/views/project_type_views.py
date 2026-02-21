"""
Project Type Views
API views for managing configurable project types
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db import transaction

from ..models.project_types import ProjectType, DEFAULT_PROJECT_TYPES
from ..serializers.project_type_serializers import (
    ProjectTypeSerializer, 
    CreateProjectTypeSerializer,
    ProjectTypeListSerializer
)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_project_types(request):
    """List all active project types"""
    project_types = ProjectType.objects.filter(is_active=True)
    serializer = ProjectTypeListSerializer(project_types, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_all_project_types(request):
    """Get all project types (including inactive) - admin only"""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    project_types = ProjectType.objects.all()
    serializer = ProjectTypeSerializer(project_types, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_project_type(request):
    """Create a new project type - admin only"""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = CreateProjectTypeSerializer(data=request.data)
    if serializer.is_valid():
        project_type = serializer.save(created_by=request.user)
        response_serializer = ProjectTypeSerializer(project_type)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def project_type_detail(request, type_id):
    """Get, update, or delete a specific project type"""
    try:
        project_type = ProjectType.objects.get(id=type_id)
    except ProjectType.DoesNotExist:
        return Response({'error': 'Project type not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = ProjectTypeSerializer(project_type)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CreateProjectTypeSerializer(project_type, data=request.data, partial=True)
        if serializer.is_valid():
            project_type = serializer.save()
            response_serializer = ProjectTypeSerializer(project_type)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        # Soft delete by setting is_active to False
        project_type.is_active = False
        project_type.save()
        return Response({'message': 'Project type deactivated'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def initialize_default_project_types(request):
    """Initialize default project types - admin only"""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    created_count = 0
    
    with transaction.atomic():
        for type_data in DEFAULT_PROJECT_TYPES:
            # Check if project type already exists
            if not ProjectType.objects.filter(name=type_data['name']).exists():
                ProjectType.objects.create(
                    **type_data,
                    created_by=request.user
                )
                created_count += 1
    
    return Response({
        'message': f'Created {created_count} default project types',
        'total_created': created_count
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reorder_project_types(request):
    """Reorder project types - admin only"""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    type_order = request.data.get('order', [])
    
    if not isinstance(type_order, list):
        return Response({'error': 'Order must be a list'}, status=status.HTTP_400_BAD_REQUEST)
    
    with transaction.atomic():
        for index, type_id in enumerate(type_order):
            try:
                project_type = ProjectType.objects.get(id=type_id)
                project_type.display_order = index
                project_type.save()
            except ProjectType.DoesNotExist:
                return Response(
                    {'error': f'Project type {type_id} not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
    
    return Response({'message': 'Project types reordered successfully'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_types_by_category(request):
    """Get project types grouped by category"""
    project_types = ProjectType.objects.filter(is_active=True)
    
    # Group by category
    categories = {}
    for project_type in project_types:
        category = project_type.category
        if category not in categories:
            categories[category] = []
        
        serializer = ProjectTypeListSerializer(project_type)
        categories[category].append(serializer.data)
    
    return Response(categories)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_type_statistics(request):
    """Get statistics about project type usage"""
    # This would typically include usage counts, popular types, etc.
    # For now, just return basic counts
    
    total_types = ProjectType.objects.count()
    active_types = ProjectType.objects.filter(is_active=True).count()
    categories = ProjectType.objects.values('category').distinct().count()
    
    return Response({
        'total_types': total_types,
        'active_types': active_types,
        'categories_count': categories,
    })