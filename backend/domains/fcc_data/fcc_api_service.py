"""
FCC OET Lab Services API Client

Interfaces with the FCC Equipment Authorization System (EAS) API.
Base URL: https://appsat.fcc.gov:443/OETLabServices/
Endpoints: getFCCIDList, getWhitespaceAuthorizations, getCBSDAuthorizations, getAFCAuthorizations
"""

import logging
from datetime import date

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

BASE_URL = 'https://apps.fcc.gov/OETLabServices'


def _create_session():
    """Create a requests session with retry logic."""
    session = requests.Session()
    retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retries)
    session.mount('https://', adapter)
    session.headers.update({
        'Accept': 'application/json',
        'User-Agent': 'PatentAnalyticsPlatform/1.0',
    })
    return session


def _format_date(d):
    """Convert Python date to MM-DD-YYYY string for FCC API."""
    if isinstance(d, date):
        return d.strftime('%m-%d-%Y')
    return str(d)


class FCCApiError(Exception):
    """Raised when FCC API returns an error."""
    def __init__(self, message, status_code=None):
        self.status_code = status_code
        super().__init__(message)


class FCCApiService:
    """Client for FCC OET Lab Services API."""

    def __init__(self):
        self.session = _create_session()

    def get_fcc_id_list(self, fcc_id):
        """
        Search for equipment authorizations by FCC ID.

        Args:
            fcc_id: Full or partial FCC ID (min 3-char grantee code)

        Returns:
            List of dicts with keys: address, applicationPurpose, city, country,
            fccid, grantDate, grantee, state, zipCode
        """
        if not fcc_id or len(fcc_id.strip()) < 3:
            raise FCCApiError("FCC ID must be at least 3 characters (grantee code)")

        url = f"{BASE_URL}/getFCCIDList"
        response = self.session.get(url, params={'fccId': fcc_id.strip()}, timeout=30)
        return self._handle_response(response, 'getFCCIDList')

    def get_whitespace_authorizations(self, begin_date, end_date):
        """
        Get whitespace equipment authorizations for a date range.

        Returns:
            List of dicts with keys: applicationPurpose, equipmentClass, fccid (FCCId),
            status, statusDate
        """
        url = f"{BASE_URL}/getWhitespaceAuthorizations"
        response = self.session.get(url, params={
            'beginDate': _format_date(begin_date),
            'endDate': _format_date(end_date),
        }, timeout=30)
        return self._handle_response(response, 'getWhitespaceAuthorizations')

    def get_cbsd_authorizations(self, begin_date, end_date):
        """
        Get Citizens Broadband Radio Service Device authorizations for a date range.

        Returns:
            List of dicts with nested lSpecs (specs with freq, power, emission)
            and lNotes (grant notes).
        """
        url = f"{BASE_URL}/getCBSDAuthorizations"
        response = self.session.get(url, params={
            'beginDate': _format_date(begin_date),
            'endDate': _format_date(end_date),
        }, timeout=30)
        return self._handle_response(response, 'getCBSDAuthorizations')

    def get_afc_authorizations(self, begin_date, end_date):
        """
        Get AFC (Standard Access Points / Fixed Client) authorizations for a date range.

        Returns:
            List of dicts with nested lSpecs and lNotes (same structure as CBSD).
        """
        url = f"{BASE_URL}/getAFCAuthorizations"
        response = self.session.get(url, params={
            'beginDate': _format_date(begin_date),
            'endDate': _format_date(end_date),
        }, timeout=30)
        return self._handle_response(response, 'getAFCAuthorizations')

    def _handle_response(self, response, endpoint_name):
        """Handle API response, returning parsed JSON data or raising errors."""
        if response.status_code == 204:
            # No results found
            logger.info(f"FCC API {endpoint_name}: no results found")
            return []

        if response.status_code == 400:
            raise FCCApiError(
                f"Bad request to {endpoint_name}: {response.text[:500]}",
                status_code=400,
            )

        if response.status_code == 500:
            raise FCCApiError(
                f"FCC server error on {endpoint_name}: {response.text[:500]}",
                status_code=500,
            )

        response.raise_for_status()

        try:
            data = response.json()
        except ValueError:
            raise FCCApiError(f"Invalid JSON response from {endpoint_name}")

        # API returns a list or a string message for no results
        if isinstance(data, str):
            if 'no results' in data.lower() or '0 records' in data.lower():
                return []
            raise FCCApiError(f"Unexpected string response: {data[:200]}")

        if isinstance(data, list):
            return data

        # Shouldn't happen, but handle dict response
        if isinstance(data, dict):
            return [data]

        return []

    def normalize_fcc_id_results(self, raw_results):
        """Normalize getFCCIDList results into flat records."""
        records = []
        for item in raw_results:
            records.append({
                'fcc_id': item.get('fccid', ''),
                'grantee_name': item.get('grantee', ''),
                'application_purpose': item.get('applicationPurpose', ''),
                'grant_date': item.get('grantDate', ''),
                'address': item.get('address', ''),
                'city': item.get('city', ''),
                'state': item.get('state', ''),
                'zip_code': item.get('zipCode', ''),
                'country': item.get('country', ''),
            })
        return records

    def normalize_whitespace_results(self, raw_results):
        """Normalize getWhitespaceAuthorizations results into flat records."""
        records = []
        for item in raw_results:
            records.append({
                'fcc_id': item.get('fccid', item.get('FCCId', '')),
                'application_purpose': item.get('applicationPurpose', ''),
                'equipment_class': item.get('equipmentClass', ''),
                'status': item.get('status', ''),
                'status_date': item.get('statusDate', ''),
            })
        return records

    def normalize_cbsd_afc_results(self, raw_results):
        """
        Normalize getCBSDAuthorizations / getAFCAuthorizations results.

        Flattens nested lSpecs into one record per spec entry.
        Each spec may contain lNotes (grant notes).
        """
        records = []
        for item in raw_results:
            # Core fields
            core = {
                'fcc_id': item.get('fccid', item.get('FCCId', '')),
                'grantee_name': item.get('granteeName', item.get('grantee', '')),
                'application_purpose': item.get('applicationPurpose', ''),
                'equipment_class': item.get('equipmentClass', ''),
                'description': item.get('description', ''),
                'status': item.get('status', ''),
                'status_date': item.get('statusDate', ''),
                'grant_date': item.get('grantDate', item.get('statusDate', '')),
            }

            specs = item.get('lSpecs', item.get('ISpecs', []))
            if not specs:
                # No specs — create record with core fields only
                records.append(core)
                continue

            for spec in specs:
                record = dict(core)
                record['emission_designator'] = spec.get('emissionDesignator', '')
                record['power_output'] = spec.get('powerOutput')
                record['freq_min'] = spec.get('freqMin')
                record['freq_max'] = spec.get('freqMax')

                # Extract grant notes from nested lNotes/INotes
                notes = spec.get('lNotes', spec.get('INotes', []))
                record['grant_notes'] = [
                    {
                        'grantNote': n.get('grantNote', ''),
                        'grantNoteId': n.get('grantNoteId', ''),
                    }
                    for n in notes
                ] if notes else []

                records.append(record)

        return records
