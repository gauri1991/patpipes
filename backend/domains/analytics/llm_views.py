"""
LLM Provider Configuration Views

Admin API for managing LLM provider API keys (Anthropic, OpenAI, etc.)
with save, test connection, and delete functionality.
"""

import logging
import os

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import LLMProviderConfig

logger = logging.getLogger(__name__)


class IsAdminOrManager(IsAuthenticated):
    """Allow access to admin or manager roles."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.is_staff or getattr(request.user, 'role', '') in ('admin', 'manager')


class LLMProviderConfigViewSet(viewsets.ViewSet):
    """
    CRUD + test for LLM provider API keys.

    list   → GET  /api/v1/analytics/api/admin/llm-keys/
    create → POST /api/v1/analytics/api/admin/llm-keys/
    update → PUT  /api/v1/analytics/api/admin/llm-keys/{provider}/
    destroy→ DELETE /api/v1/analytics/api/admin/llm-keys/{provider}/
    test   → POST /api/v1/analytics/api/admin/llm-keys/{provider}/test_connection/
    """

    permission_classes = [IsAdminOrManager]

    # -- LIST ------------------------------------------------------------------

    def list(self, request):
        """Return all configured providers with masked keys."""
        configs = LLMProviderConfig.objects.all()
        data = [self._serialize(c) for c in configs]
        return Response(data)

    # -- CREATE ----------------------------------------------------------------

    def create(self, request):
        """Add or update an LLM provider config.

        Body: { provider, display_name, api_key, api_base_url?, is_active?, notes? }
        """
        provider = request.data.get('provider', '').strip()
        if not provider:
            return Response({'error': 'provider is required.'}, status=status.HTTP_400_BAD_REQUEST)

        valid_providers = [c[0] for c in LLMProviderConfig.PROVIDER_CHOICES]
        if provider not in valid_providers:
            return Response(
                {'error': f'Invalid provider. Choose from: {", ".join(valid_providers)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        api_key = request.data.get('api_key', '').strip()
        if not api_key:
            return Response({'error': 'api_key is required.'}, status=status.HTTP_400_BAD_REQUEST)

        display_name = request.data.get(
            'display_name',
            dict(LLMProviderConfig.PROVIDER_CHOICES).get(provider, provider),
        )

        config, created = LLMProviderConfig.objects.update_or_create(
            provider=provider,
            defaults={
                'display_name': display_name,
                'api_key': api_key,
                'api_base_url': request.data.get('api_base_url', ''),
                'is_active': request.data.get('is_active', True),
                'notes': request.data.get('notes', ''),
                'updated_by': request.user,
                'test_status': 'never',
                'test_error': '',
            },
        )

        return Response(
            self._serialize(config),
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    # -- UPDATE ----------------------------------------------------------------

    def update(self, request, pk=None):
        """Partial update of a provider config. pk = provider slug."""
        try:
            config = LLMProviderConfig.objects.get(provider=pk)
        except LLMProviderConfig.DoesNotExist:
            return Response({'error': 'Provider not found.'}, status=status.HTTP_404_NOT_FOUND)

        if 'api_key' in request.data and request.data['api_key'].strip():
            config.api_key = request.data['api_key'].strip()
            config.test_status = 'never'
            config.test_error = ''
        if 'display_name' in request.data:
            config.display_name = request.data['display_name']
        if 'api_base_url' in request.data:
            config.api_base_url = request.data['api_base_url']
        if 'is_active' in request.data:
            config.is_active = request.data['is_active']
        if 'notes' in request.data:
            config.notes = request.data['notes']

        config.updated_by = request.user
        config.save()

        return Response(self._serialize(config))

    # -- DESTROY ---------------------------------------------------------------

    def destroy(self, request, pk=None):
        """Delete a provider config. pk = provider slug."""
        try:
            config = LLMProviderConfig.objects.get(provider=pk)
        except LLMProviderConfig.DoesNotExist:
            return Response({'error': 'Provider not found.'}, status=status.HTTP_404_NOT_FOUND)

        config.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # -- TEST CONNECTION -------------------------------------------------------

    @action(detail=True, methods=['post'], url_path='test_connection')
    def test_connection(self, request, pk=None):
        """Test the API key by making a minimal call to the provider."""
        try:
            config = LLMProviderConfig.objects.get(provider=pk)
        except LLMProviderConfig.DoesNotExist:
            return Response({'error': 'Provider not found.'}, status=status.HTTP_404_NOT_FOUND)

        success, message = self._test_provider(config)

        config.last_tested_at = timezone.now()
        config.test_status = 'passed' if success else 'failed'
        config.test_error = '' if success else message
        config.save(update_fields=['last_tested_at', 'test_status', 'test_error'])

        return Response({
            'provider': config.provider,
            'success': success,
            'message': message,
            'tested_at': config.last_tested_at.isoformat(),
        })

    # -- Helpers ---------------------------------------------------------------

    def _test_provider(self, config: LLMProviderConfig) -> tuple[bool, str]:
        """Run a minimal health-check call for the provider."""
        provider = config.provider
        api_key = config.api_key

        try:
            if provider == 'anthropic':
                return self._test_anthropic(api_key, config.api_base_url)
            elif provider == 'openai':
                return self._test_openai(api_key, config.api_base_url)
            elif provider == 'google':
                return self._test_google(api_key)
            elif provider == 'cohere':
                return self._test_cohere(api_key)
            elif provider == 'mistral':
                return self._test_mistral(api_key)
            else:
                return False, f'Test not implemented for provider: {provider}'
        except Exception as exc:
            logger.exception('LLM provider test failed for %s', provider)
            return False, str(exc)

    def _test_anthropic(self, api_key: str, base_url: str = '') -> tuple[bool, str]:
        try:
            import anthropic
        except ImportError:
            return False, 'anthropic package not installed. Run: pip install anthropic'

        kwargs = {'api_key': api_key}
        if base_url:
            kwargs['base_url'] = base_url

        client = anthropic.Anthropic(**kwargs)
        response = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=10,
            messages=[{'role': 'user', 'content': 'Say "ok"'}],
        )
        return True, f'Connected. Model responded: {response.content[0].text.strip()}'

    def _test_openai(self, api_key: str, base_url: str = '') -> tuple[bool, str]:
        try:
            import openai
        except ImportError:
            return False, 'openai package not installed. Run: pip install openai'

        kwargs = {'api_key': api_key}
        if base_url:
            kwargs['base_url'] = base_url

        client = openai.OpenAI(**kwargs)
        response = client.chat.completions.create(
            model='gpt-4o-mini',
            max_tokens=10,
            messages=[{'role': 'user', 'content': 'Say "ok"'}],
        )
        return True, f'Connected. Model responded: {response.choices[0].message.content.strip()}'

    def _test_google(self, api_key: str) -> tuple[bool, str]:
        try:
            import google.generativeai as genai
        except ImportError:
            return False, 'google-generativeai package not installed. Run: pip install google-generativeai'

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content('Say "ok"', generation_config={'max_output_tokens': 10})
        return True, f'Connected. Model responded: {response.text.strip()}'

    def _test_cohere(self, api_key: str) -> tuple[bool, str]:
        try:
            import cohere
        except ImportError:
            return False, 'cohere package not installed. Run: pip install cohere'

        client = cohere.Client(api_key)
        response = client.chat(message='Say "ok"', model='command-r')
        return True, f'Connected. Model responded: {response.text.strip()}'

    def _test_mistral(self, api_key: str) -> tuple[bool, str]:
        try:
            from mistralai import Mistral
        except ImportError:
            return False, 'mistralai package not installed. Run: pip install mistralai'

        client = Mistral(api_key=api_key)
        response = client.chat.complete(
            model='mistral-small-latest',
            messages=[{'role': 'user', 'content': 'Say "ok"'}],
            max_tokens=10,
        )
        return True, f'Connected. Model responded: {response.choices[0].message.content.strip()}'

    def _serialize(self, config: LLMProviderConfig) -> dict:
        return {
            'id': str(config.id),
            'provider': config.provider,
            'display_name': config.display_name,
            'masked_key': config.masked_key,
            'api_base_url': config.api_base_url,
            'is_active': config.is_active,
            'test_status': config.test_status,
            'test_error': config.test_error,
            'last_tested_at': config.last_tested_at.isoformat() if config.last_tested_at else None,
            'notes': config.notes,
            'created_at': config.created_at.isoformat(),
            'updated_at': config.updated_at.isoformat(),
        }
