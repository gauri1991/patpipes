"""
Analysis Prompt Template Views

Admin API for managing versioned, categorized prompt templates
used by the patent analysis engine.
"""

import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AnalysisPromptTemplate

logger = logging.getLogger(__name__)


class IsAdminOrManager(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        if request.method == 'GET':
            return True  # any authenticated user can read prompts
        return request.user.is_staff or getattr(request.user, 'role', '') in ('admin', 'manager')


class AnalysisPromptTemplateViewSet(viewsets.ViewSet):
    """
    CRUD + version history for analysis prompt templates.

    list        → GET    .../prompts/
    list by cat → GET    .../prompts/?category=biomedical
    create      → POST   .../prompts/
    update      → PUT    .../prompts/{id}/
    destroy     → DELETE .../prompts/{id}/
    history     → GET    .../prompts/history/?section=keywords&category=general
    categories  → GET    .../prompts/categories/
    sections    → GET    .../prompts/sections/
    """

    permission_classes = [IsAdminOrManager]

    # -- LIST ------------------------------------------------------------------

    def list(self, request):
        """List prompt templates, optionally filtered by section/category.

        Only returns the latest active version per section+category by default.
        Pass ?all=true to see every version.
        """
        qs = AnalysisPromptTemplate.objects.all()

        section = request.query_params.get('section')
        category = request.query_params.get('category')
        if section:
            qs = qs.filter(section=section)
        if category:
            qs = qs.filter(category=category)

        show_all = request.query_params.get('all', '').lower() == 'true'
        if not show_all:
            # Deduplicate: latest active per section+category
            seen = set()
            templates = []
            for t in qs:
                key = (t.section, t.category)
                if key not in seen and t.is_active:
                    seen.add(key)
                    templates.append(t)
        else:
            templates = list(qs)

        return Response([self._serialize(t) for t in templates])

    # -- CREATE ----------------------------------------------------------------

    def create(self, request):
        """Create a new prompt template.

        If a template already exists for the same section+category, the new one
        gets the next version number automatically.

        Body: { section, category, prompt_text, description? }
        """
        section = request.data.get('section', '').strip()
        category = request.data.get('category', 'general').strip()
        prompt_text = request.data.get('prompt_text', '').strip()

        if not section or not prompt_text:
            return Response(
                {'error': 'section and prompt_text are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_sections = [c[0] for c in AnalysisPromptTemplate.SECTION_CHOICES]
        if section not in valid_sections:
            return Response(
                {'error': f'Invalid section. Choose from: {", ".join(valid_sections)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_categories = [c[0] for c in AnalysisPromptTemplate.CATEGORY_CHOICES]
        if category not in valid_categories:
            return Response(
                {'error': f'Invalid category. Choose from: {", ".join(valid_categories)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Auto-increment version
        latest = (
            AnalysisPromptTemplate.objects
            .filter(section=section, category=category)
            .order_by('-version')
            .first()
        )
        next_version = (latest.version + 1) if latest else 1

        # Deactivate previous versions
        AnalysisPromptTemplate.objects.filter(
            section=section, category=category, is_active=True,
        ).update(is_active=False)

        template = AnalysisPromptTemplate.objects.create(
            section=section,
            category=category,
            version=next_version,
            prompt_text=prompt_text,
            description=request.data.get('description', ''),
            is_active=True,
            created_by=request.user,
        )

        return Response(self._serialize(template), status=status.HTTP_201_CREATED)

    # -- UPDATE ----------------------------------------------------------------

    def update(self, request, pk=None):
        """Update a template's metadata (description, is_active).

        To change prompt_text, create a new version instead.
        """
        try:
            template = AnalysisPromptTemplate.objects.get(pk=pk)
        except AnalysisPromptTemplate.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if 'description' in request.data:
            template.description = request.data['description']
        if 'is_active' in request.data:
            template.is_active = request.data['is_active']
            # If activating, deactivate other versions of same section+category
            if template.is_active:
                AnalysisPromptTemplate.objects.filter(
                    section=template.section,
                    category=template.category,
                    is_active=True,
                ).exclude(pk=pk).update(is_active=False)

        template.save()
        return Response(self._serialize(template))

    # -- DESTROY ---------------------------------------------------------------

    def destroy(self, request, pk=None):
        try:
            template = AnalysisPromptTemplate.objects.get(pk=pk)
        except AnalysisPromptTemplate.DoesNotExist:
            return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # -- VERSION HISTORY -------------------------------------------------------

    @action(detail=False, methods=['get'], url_path='history')
    def history(self, request):
        """Get all versions for a section+category.

        GET .../prompts/history/?section=keywords&category=general
        """
        section = request.query_params.get('section')
        category = request.query_params.get('category', 'general')

        if not section:
            return Response(
                {'error': 'section query param is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        versions = AnalysisPromptTemplate.get_version_history(section, category)
        return Response([self._serialize(t) for t in versions])

    # -- REFERENCE DATA --------------------------------------------------------

    @action(detail=False, methods=['get'], url_path='categories')
    def categories(self, request):
        """Return available prompt categories."""
        return Response([
            {'value': c[0], 'label': c[1]}
            for c in AnalysisPromptTemplate.CATEGORY_CHOICES
        ])

    @action(detail=False, methods=['get'], url_path='sections')
    def sections(self, request):
        """Return available analysis sections."""
        return Response([
            {'value': c[0], 'label': c[1]}
            for c in AnalysisPromptTemplate.SECTION_CHOICES
        ])

    # -- Helpers ---------------------------------------------------------------

    def _serialize(self, t: AnalysisPromptTemplate) -> dict:
        return {
            'id': str(t.id),
            'section': t.section,
            'section_label': t.get_section_display(),
            'category': t.category,
            'category_label': t.get_category_display(),
            'version': t.version,
            'prompt_text': t.prompt_text,
            'description': t.description,
            'is_active': t.is_active,
            'created_at': t.created_at.isoformat(),
            'updated_at': t.updated_at.isoformat(),
            'created_by': str(t.created_by) if t.created_by else None,
        }
