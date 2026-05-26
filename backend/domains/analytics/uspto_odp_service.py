"""
USPTO Open Data Portal (ODP) API Services

Provides HTTP client and service classes for all ODP endpoints:
- Patent application search
- Application details (metadata, continuity, assignment, attorney, documents, etc.)
- PTAB trial proceedings and decisions
- Appeals, interferences, petitions
"""

import hashlib
import time
import logging
from datetime import timedelta
from typing import Any, Callable, Dict, List, Optional

import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class USPTOODPError(Exception):
    """Base exception for ODP API errors."""
    pass


class USPTOODPClient:
    """
    Reusable HTTP client for the USPTO Open Data Portal API.

    Features:
    - x-api-key authentication
    - Exponential backoff on 429 (rate limit)
    - 30s timeout
    - Logging
    """

    MAX_RETRIES = 3
    BACKOFF_BASE = 2  # seconds
    TIMEOUT = 30

    def __init__(self, api_key: str = '', base_url: str = ''):
        self.base_url = base_url or getattr(settings, 'USPTO_ODP_BASE_URL', 'https://api.uspto.gov/api/v1')
        self.api_key = api_key or self._resolve_api_key()

    def _resolve_api_key(self) -> str:
        """Resolve API key: DB PatentAPIConfiguration first, then settings."""
        # Try DB config
        try:
            from .models import PatentAPIConfiguration
            config = PatentAPIConfiguration.objects.filter(
                name='uspto_odp', is_active=True
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
        # Fallback to settings
        return getattr(settings, 'USPTO_ODP_API_KEY', '')

    def _get_headers(self, include_content_type: bool = False) -> Dict[str, str]:
        headers = {'Accept': 'application/json'}
        if include_content_type:
            headers['Content-Type'] = 'application/json'
        if self.api_key:
            headers['x-api-key'] = self.api_key
        return headers

    def get(self, path: str, params: Optional[Dict] = None) -> Any:
        """Make a GET request to ODP."""
        url = f'{self.base_url}{path}'
        return self._request('GET', url, params=params)

    def post(self, path: str, body: Optional[Dict] = None) -> Any:
        """Make a POST request to ODP."""
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
                logger.debug('ODP %s %s attempt=%d', method, url, attempt)
                resp = requests.request(
                    method,
                    url,
                    headers=self._get_headers(include_content_type=method not in ('GET', 'HEAD', 'DELETE')),
                    params=params,
                    json=json_body,
                    timeout=self.TIMEOUT,
                )

                if resp.status_code == 429:
                    wait = self.BACKOFF_BASE * (2 ** attempt)
                    logger.warning('ODP 429 rate-limited, retrying in %ds', wait)
                    time.sleep(wait)
                    continue

                # ODP returns 404 for "no matching records" — treat as empty
                if resp.status_code == 404:
                    logger.debug('ODP 404 — no matching records for %s', url)
                    return None

                resp.raise_for_status()
                return resp.json()

            except requests.exceptions.HTTPError as exc:
                if exc.response is not None and exc.response.status_code == 429:
                    wait = self.BACKOFF_BASE * (2 ** attempt)
                    logger.warning('ODP 429 rate-limited, retrying in %ds', wait)
                    time.sleep(wait)
                    last_exc = exc
                    continue
                logger.error('ODP HTTP error: %s', exc)
                raise USPTOODPError(f'ODP API error: {exc}') from exc
            except requests.exceptions.RequestException as exc:
                logger.error('ODP request failed: %s', exc)
                raise USPTOODPError(f'ODP request failed: {exc}') from exc

        raise USPTOODPError(f'ODP API failed after {self.MAX_RETRIES} retries: {last_exc}')


# ---------------------------------------------------------------------------
# Detail service — individual application data endpoints
# ---------------------------------------------------------------------------

class USPTOODPDetailService:
    """
    Service for fetching detailed patent application data from ODP.
    Covers: application, metadata, continuity, assignment, attorney,
    documents, transactions, foreign-priority, adjustment, associated-documents,
    status-codes, and search download.

    All per-application GET calls are routed through _cached_get() which stores
    responses in the ODPCacheEntry table (TTL: 7 days).
    """

    CACHE_TTL = timedelta(days=7)

    def __init__(self, client: Optional[USPTOODPClient] = None):
        self.client = client or USPTOODPClient()

    @staticmethod
    def _unwrap(data: Optional[Dict]) -> Optional[Dict]:
        """Unwrap ODP response from patentFileWrapperDataBag array."""
        if data is None:
            return None
        bag = data.get('patentFileWrapperDataBag')
        if isinstance(bag, list) and len(bag) > 0:
            return bag[0]
        return data

    def _cached_get(
        self, app_id: str, endpoint: str, fetcher: Callable[[], Optional[Dict]]
    ) -> Optional[Dict]:
        """Return cached ODP response or call fetcher and cache the result."""
        from .models import ODPCacheEntry

        cutoff = timezone.now() - self.CACHE_TTL
        entry = (
            ODPCacheEntry.objects
            .filter(application_id=app_id, endpoint=endpoint, fetched_at__gte=cutoff)
            .first()
        )
        if entry is not None:
            logger.debug('ODP cache HIT %s/%s', app_id, endpoint)
            return entry.response_data

        logger.debug('ODP cache MISS %s/%s', app_id, endpoint)
        data = fetcher()

        if data is not None:
            ODPCacheEntry.objects.update_or_create(
                application_id=app_id,
                endpoint=endpoint,
                defaults={'response_data': data, 'fetched_at': timezone.now()},
            )
        return data

    # -- Single application endpoints --

    def get_application(self, app_id: str) -> Optional[Dict]:
        return self._cached_get(
            app_id, 'application',
            lambda: self._unwrap(self.client.get(f'/patent/applications/{app_id}')),
        )

    def get_metadata(self, app_id: str) -> Optional[Dict]:
        return self._cached_get(
            app_id, 'metadata',
            lambda: self._unwrap(self.client.get(f'/patent/applications/{app_id}/metadata')),
        )

    def get_continuity(self, app_id: str) -> Optional[Dict]:
        return self._cached_get(
            app_id, 'continuity',
            lambda: self._unwrap(self.client.get(f'/patent/applications/{app_id}/continuity')),
        )

    def get_assignment(self, app_id: str) -> Optional[Dict]:
        return self._cached_get(
            app_id, 'assignment',
            lambda: self._unwrap(self.client.get(f'/patent/applications/{app_id}/assignment')),
        )

    def get_attorney(self, app_id: str) -> Optional[Dict]:
        return self._cached_get(
            app_id, 'attorney',
            lambda: self._unwrap(self.client.get(f'/patent/applications/{app_id}/attorney')),
        )

    def get_documents(self, app_id: str) -> Optional[Dict]:
        return self._cached_get(
            app_id, 'documents',
            lambda: self._unwrap(self.client.get(f'/patent/applications/{app_id}/documents')),
        )

    def get_transactions(self, app_id: str) -> Optional[Dict]:
        return self._cached_get(
            app_id, 'transactions',
            lambda: self._unwrap(self.client.get(f'/patent/applications/{app_id}/transactions')),
        )

    def get_foreign_priority(self, app_id: str) -> Optional[Dict]:
        return self._cached_get(
            app_id, 'foreign-priority',
            lambda: self._unwrap(self.client.get(f'/patent/applications/{app_id}/foreign-priority')),
        )

    def get_term_adjustment(self, app_id: str) -> Optional[Dict]:
        return self._cached_get(
            app_id, 'adjustment',
            lambda: self._unwrap(self.client.get(f'/patent/applications/{app_id}/adjustment')),
        )

    def get_associated_documents(self, app_id: str) -> Optional[Dict]:
        return self._cached_get(
            app_id, 'associated-documents',
            lambda: self._unwrap(self.client.get(f'/patent/applications/{app_id}/associated-documents')),
        )

    # -- Reference data --

    def get_status_codes(self) -> Dict:
        return self.client.get('/patent/applications/status-codes')

    # -- Bulk export --

    def download_search(self, body: Dict) -> Dict:
        return self.client.post('/patent/applications/search/download', body)


# ---------------------------------------------------------------------------
# Trial service — PTAB proceedings, decisions, appeals, interferences, petitions
# ---------------------------------------------------------------------------

class USPTOODPTrialService:
    """
    Service for PTAB trial data from ODP.
    Covers: proceedings search/detail, decisions, trial documents,
    appeal decisions, interference decisions, petitions.
    """

    def __init__(self, client: Optional[USPTOODPClient] = None):
        self.client = client or USPTOODPClient()

    # -- Proceedings --

    def search_proceedings(self, query: Dict) -> Dict:
        return self.client.post('/patent/trials/proceedings/search', query)

    def get_proceeding(self, trial_number: str) -> Dict:
        return self.client.get(f'/patent/trials/proceedings/{trial_number}')

    # -- Decisions --

    def search_decisions(self, query: Dict) -> Dict:
        return self.client.post('/patent/trials/decisions/search', query)

    def get_decision(self, decision_id: str) -> Dict:
        return self.client.get(f'/patent/trials/decisions/{decision_id}')

    # -- Trial documents --

    def get_trial_documents(self, trial_number: str) -> Dict:
        return self.client.get(f'/patent/trials/{trial_number}/documents')

    # -- Appeals --

    def search_appeal_decisions(self, query: Dict) -> Dict:
        return self.client.post('/patent/appeals/decisions/search', query)

    def get_appeal_decision(self, decision_id: str) -> Dict:
        return self.client.get(f'/patent/appeals/decisions/{decision_id}')

    # -- Interferences --

    def search_interferences(self, query: Dict) -> Dict:
        return self.client.post('/patent/interferences/decisions/search', query)

    # -- Petitions --

    def search_petitions(self, query: Dict) -> Dict:
        return self.client.post('/patent/petitions/search', query)

    def get_petition_decision(self, petition_id: str) -> Dict:
        return self.client.get(f'/patent/petitions/{petition_id}/decision')
