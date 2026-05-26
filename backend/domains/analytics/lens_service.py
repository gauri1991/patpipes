"""
Lens.org Patent API Client

Provides an HTTP client for the Lens.org patent search API.
- Bearer token authentication
- POST-based search (JSON body)
- Exponential backoff on 429 (rate limit)
"""

import time
import logging
from typing import Any, Dict, List, Optional

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class LensAPIError(Exception):
    """Exception for Lens.org API errors."""
    pass


class LensClient:
    """
    HTTP client for the Lens.org Patent API.

    Resolves credentials from DB (PatentAPIConfiguration) first,
    then falls back to settings.LENS_API_KEY / LENS_BASE_URL.
    """

    MAX_RETRIES = 3
    BACKOFF_BASE = 2  # seconds
    TIMEOUT = 30

    def __init__(self, api_key: str = '', base_url: str = ''):
        self.base_url = base_url or getattr(settings, 'LENS_BASE_URL', 'https://api.lens.org')
        self.api_key = api_key or self._resolve_api_key()

    def _resolve_api_key(self) -> str:
        """Resolve API key: DB PatentAPIConfiguration first, then settings."""
        try:
            from .models import PatentAPIConfiguration
            config = PatentAPIConfiguration.objects.filter(
                name='lens', is_active=True
            ).first()
            if config:
                from django.core.signing import Signer
                signer = Signer()
                auth = config.auth_config or {}
                signed_key = auth.get('api_key', '')
                if signed_key:
                    try:
                        return signer.unsign(signed_key)
                    except Exception:
                        return signed_key
        except Exception:
            pass
        return getattr(settings, 'LENS_API_KEY', '')

    @property
    def _headers(self) -> Dict[str, str]:
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'
        return headers

    def post(self, path: str, body: Optional[Dict] = None) -> Any:
        """Make a POST request to the Lens API."""
        url = f'{self.base_url}{path}'
        return self._request('POST', url, json_body=body)

    def _request(
        self,
        method: str,
        url: str,
        params: Optional[Dict] = None,
        json_body: Optional[Dict] = None,
    ) -> Any:
        """Execute HTTP request with retry on 429."""
        last_exc = None

        for attempt in range(self.MAX_RETRIES + 1):
            try:
                logger.debug('Lens %s %s attempt=%d', method, url, attempt)
                resp = requests.request(
                    method,
                    url,
                    headers=self._headers,
                    params=params,
                    json=json_body,
                    timeout=self.TIMEOUT,
                )

                if resp.status_code == 429:
                    wait = self.BACKOFF_BASE * (2 ** attempt)
                    logger.warning('Lens 429 rate-limited, retrying in %ds', wait)
                    time.sleep(wait)
                    continue

                if resp.status_code == 404:
                    logger.debug('Lens 404 — no matching records for %s', url)
                    return None

                resp.raise_for_status()
                return resp.json()

            except requests.exceptions.HTTPError as exc:
                if exc.response is not None and exc.response.status_code == 429:
                    wait = self.BACKOFF_BASE * (2 ** attempt)
                    logger.warning('Lens 429 rate-limited, retrying in %ds', wait)
                    time.sleep(wait)
                    last_exc = exc
                    continue
                logger.error('Lens HTTP error: %s', exc)
                raise LensAPIError(f'Lens API error: {exc}') from exc
            except requests.exceptions.RequestException as exc:
                logger.error('Lens request failed: %s', exc)
                raise LensAPIError(f'Lens request failed: {exc}') from exc

        raise LensAPIError(f'Lens API failed after {self.MAX_RETRIES} retries: {last_exc}')

    def search_all(self, body: Dict, max_results: int = 10000) -> List[Dict]:
        """Fetch all results using Lens scroll pagination.

        For result sets >100, uses scroll_id pagination to retrieve all pages.
        Returns a flat list of all patent records.

        Args:
            body: search query body (query, include, etc.)
            max_results: safety cap (default 10K per Lens docs)

        Returns:
            List of patent dicts from all pages
        """
        all_results: List[Dict] = []

        # First request with scroll context
        first_body = {**body}
        first_body['size'] = min(first_body.get('size', 100), 100)
        first_body['scroll'] = '1m'
        first_body.pop('from', None)  # scroll doesn't use from

        data = self.post('/patent/search', first_body)
        if not data or not data.get('data'):
            return all_results

        all_results.extend(data['data'])
        total = data.get('total', 0)
        scroll_id = data.get('scroll_id')

        # Paginate through remaining results
        while scroll_id and len(all_results) < min(total, max_results):
            scroll_body = {
                'scroll_id': scroll_id,
                'scroll': '1m',
            }
            try:
                data = self.post('/patent/search', scroll_body)
                if not data or not data.get('data'):
                    break
                all_results.extend(data['data'])
                scroll_id = data.get('scroll_id')
            except LensAPIError:
                break

            # Rate limit between scroll pages
            time.sleep(0.5)

        return all_results[:max_results]
