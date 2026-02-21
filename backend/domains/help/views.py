from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F, Q

from .models import HelpCategory, HelpArticle
from .serializers import (
    HelpCategoryListSerializer,
    HelpCategoryDetailSerializer,
    HelpCategoryWriteSerializer,
    HelpArticleListSerializer,
    HelpArticleDetailSerializer,
    HelpArticleWriteSerializer,
)


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or getattr(request.user, 'role', '') in ('admin', 'manager')
        )


class HelpCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        qs = HelpCategory.objects.all()
        if not (self.request.user.is_staff or getattr(self.request.user, 'role', '') in ('admin', 'manager')):
            qs = qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return HelpCategoryDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return HelpCategoryWriteSerializer
        return HelpCategoryListSerializer


class HelpArticleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        qs = HelpArticle.objects.select_related('category', 'author')
        if not (self.request.user.is_staff or getattr(self.request.user, 'role', '') in ('admin', 'manager')):
            qs = qs.filter(is_published=True, category__is_active=True)

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return HelpArticleDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return HelpArticleWriteSerializer
        return HelpArticleListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        HelpArticle.objects.filter(pk=instance.pk).update(view_count=F('view_count') + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response([])

        qs = self.get_queryset().filter(
            Q(title__icontains=q) |
            Q(content__icontains=q) |
            Q(excerpt__icontains=q) |
            Q(tags__icontains=q)
        )
        serializer = HelpArticleListSerializer(qs[:20], many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        qs = self.get_queryset().filter(is_featured=True)
        serializer = HelpArticleListSerializer(qs, many=True)
        return Response(serializer.data)
