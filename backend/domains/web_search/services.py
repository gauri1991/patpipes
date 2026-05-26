"""
Web Search Services - Google Custom Search Engine integration
"""

import logging
from datetime import date

import requests
from decouple import config
from django.utils import timezone

from .models import DailyQuotaUsage, SearchResult

logger = logging.getLogger(__name__)


class GoogleSearchError(Exception):
    """Base exception for Google Search service errors."""
    pass


class QuotaExceededError(GoogleSearchError):
    """Raised when the daily API quota has been exceeded."""
    pass


class APIKeyMissingError(GoogleSearchError):
    """Raised when the API key or CSE ID is not configured."""
    pass


class GoogleSearchService:
    """
    Service for executing searches via the Google Custom Search JSON API.
    Handles quota tracking, error handling, and result persistence.

    Configuration priority: DB (GoogleSearchConfig singleton) > .env file.
    """

    BASE_URL = 'https://www.googleapis.com/customsearch/v1'
    DAILY_LIMIT = 100

    def __init__(self):
        # Try DB config first, fall back to .env
        try:
            from .models import GoogleSearchConfig
            db_config = GoogleSearchConfig.load()
            self.api_key = db_config.api_key or config('GOOGLE_CSE_API_KEY', default='')
            self.cse_id = db_config.search_engine_id or config('GOOGLE_CSE_ID', default='')
            self.DAILY_LIMIT = db_config.daily_limit or 100
            self._is_active = db_config.is_active
        except Exception:
            self.api_key = config('GOOGLE_CSE_API_KEY', default='')
            self.cse_id = config('GOOGLE_CSE_ID', default='')
            self._is_active = True

    def _ensure_configured(self):
        """Raise an error if API credentials are not set."""
        if not self.api_key or not self.cse_id:
            raise APIKeyMissingError(
                'Google Custom Search API key or CSE ID is not configured. '
                'Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID in your .env file.'
            )

    def _increment_quota(self):
        """Increment today's quota usage counter by 1."""
        today = date.today()
        usage, _ = DailyQuotaUsage.objects.get_or_create(date=today, defaults={'queries_used': 0})
        usage.queries_used += 1
        usage.save(update_fields=['queries_used'])
        return usage.queries_used

    def get_quota_remaining(self):
        """
        Return today's quota status.
        Returns dict: {'used': int, 'limit': int, 'remaining': int, 'date': str}
        """
        today = date.today()
        try:
            usage = DailyQuotaUsage.objects.get(date=today)
            used = usage.queries_used
        except DailyQuotaUsage.DoesNotExist:
            used = 0

        return {
            'used': used,
            'limit': self.DAILY_LIMIT,
            'remaining': max(self.DAILY_LIMIT - used, 0),
            'date': today.isoformat(),
        }

    def search(self, query, num=10, start=1, date_restrict=None, site_search=None,
               exact_terms=None, exclude_terms=None, file_type=None):
        """
        Execute a Google Custom Search and return the raw API response dict.

        Args:
            query: The search query string.
            num: Number of results to return (1-10).
            start: The index of the first result to return.
            date_restrict: Restrict results by age (e.g. 'd7' for past week, 'm3' for past 3 months).
            site_search: Restrict results to a specific site/domain.

        Returns:
            dict: Raw Google CSE API response.

        Raises:
            APIKeyMissingError: If credentials are not configured.
            QuotaExceededError: If the daily quota has been reached.
            GoogleSearchError: For network or API errors.
        """
        self._ensure_configured()

        # Check quota before making the request
        quota = self.get_quota_remaining()
        if quota['remaining'] <= 0:
            raise QuotaExceededError(
                f"Daily quota of {self.DAILY_LIMIT} queries has been reached. "
                f"Resets at midnight. Used: {quota['used']}/{self.DAILY_LIMIT}"
            )

        params = {
            'key': self.api_key,
            'cx': self.cse_id,
            'q': query,
            'num': min(num, 10),
            'start': start,
        }

        if date_restrict:
            params['dateRestrict'] = date_restrict

        if site_search:
            params['siteSearch'] = site_search

        if exact_terms:
            params['exactTerms'] = exact_terms

        if exclude_terms:
            params['excludeTerms'] = exclude_terms

        if file_type:
            params['fileType'] = file_type

        try:
            response = requests.get(self.BASE_URL, params=params, timeout=15)

            # Increment quota after a successful request (even if Google returns an error status)
            self._increment_quota()

            if response.status_code == 403:
                error_data = response.json() if response.content else {}
                error_msg = error_data.get('error', {}).get('message', 'API access forbidden')
                raise GoogleSearchError(f"Google API 403: {error_msg}")

            if response.status_code == 429:
                raise QuotaExceededError("Google API rate limit exceeded (HTTP 429).")

            response.raise_for_status()
            return response.json()

        except requests.exceptions.Timeout:
            raise GoogleSearchError("Google Custom Search API request timed out.")
        except requests.exceptions.ConnectionError:
            raise GoogleSearchError("Could not connect to Google Custom Search API.")
        except requests.exceptions.RequestException as exc:
            raise GoogleSearchError(f"Google API request failed: {exc}")

    def execute_query(self, query_obj):
        """
        Execute a SearchQuery, save results as SearchResult objects,
        and update the query's metadata.

        Args:
            query_obj: A SearchQuery model instance.

        Returns:
            list[SearchResult]: The created SearchResult instances.
        """
        try:
            raw = self.search(
                query_obj.query_text,
                date_restrict=query_obj.date_restrict or None,
                site_search=query_obj.site_filter or None,
                exact_terms=query_obj.exact_terms or None,
                exclude_terms=query_obj.exclude_terms or None,
                file_type=query_obj.file_type or None,
            )
        except GoogleSearchError as exc:
            logger.error("Search failed for query %s: %s", query_obj.id, exc)
            raise

        items = raw.get('items', [])
        created_results = []

        for idx, item in enumerate(items):
            # Extract thumbnail if present
            pagemap = item.get('pagemap', {})
            cse_thumbnail = pagemap.get('cse_thumbnail', [{}])
            thumbnail_url = cse_thumbnail[0].get('src') if cse_thumbnail else None

            result = SearchResult.objects.create(
                query=query_obj,
                title=item.get('title', '')[:1000],
                url=item.get('link', '')[:2000],
                snippet=item.get('snippet', ''),
                display_link=item.get('displayLink', '')[:500],
                source_domain=item.get('displayLink', '')[:500],
                thumbnail_url=thumbnail_url,
                position=idx + 1,
            )
            created_results.append(result)

        # Update query metadata
        query_obj.executed_at = timezone.now()
        query_obj.results_count = len(created_results)
        query_obj.save(update_fields=['executed_at', 'results_count'])

        logger.info(
            "Executed query %s ('%s'): %d results",
            query_obj.id, query_obj.query_text[:60], len(created_results),
        )

        return created_results
