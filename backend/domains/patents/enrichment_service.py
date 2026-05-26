"""
Patent ODP Enrichment Service

Extracts the core enrichment logic from PatentViewSet.enrich_from_odp
into reusable functions for both single-patent and bulk enrichment.
"""

import logging
import re
import time as _time
from datetime import date as dt_date

from django.utils import timezone

logger = logging.getLogger(__name__)


def _normalize_app_num(raw: str) -> str:
    """Strip non-digit characters so '16/234,891' or 'US16/234,891' becomes '16234891'."""
    return re.sub(r'[^0-9]', '', raw)


# ── Technology area derivation ────────────────────────────────────────────────
# Maps CPC/IPC subclass/class/section and USPC class numbers to human-readable labels.

_CPC_SUBCLASS = {
    'G06F': 'Computing & Software',     'G06N': 'AI & Machine Learning',
    'G06Q': 'Business & FinTech',       'G06T': 'Image Processing',
    'G06V': 'Computer Vision',          'G06K': 'Data Recognition',
    'H04L': 'Data Networking',          'H04W': 'Wireless Communications',
    'H04N': 'Video & Imaging',          'H04M': 'Telephony',
    'H04B': 'Signal Transmission',      'H04J': 'Multiplex Communications',
    'H04R': 'Audio Technology',         'H04S': 'Stereophonic Systems',
    'H01L': 'Semiconductors',           'H01Q': 'Antennas',
    'H02J': 'Power Systems',            'H02M': 'Power Conversion',
    'H03K': 'Pulse Techniques',         'H03M': 'Coding & Decoding',
    'G01S': 'Radar & Navigation',       'G01N': 'Analytical Testing',
    'G01R': 'Electrical Measurement',   'G02B': 'Optical Devices',
    'G05B': 'Control Systems',          'G05D': 'Control Systems',
    'G11B': 'Storage Devices',          'G11C': 'Memory Devices',
    'G16H': 'Healthcare Informatics',   'G16B': 'Bioinformatics',
    'A61B': 'Medical Devices',          'A61K': 'Pharmaceuticals',
    'A61N': 'Medical Therapy',          'A61P': 'Drug Therapy',
    'B60L': 'Electric Vehicles',        'B60W': 'Vehicle Control',
    'B62D': 'Automotive',               'B64C': 'Aerospace',
    'C12N': 'Biotechnology',            'C12Q': 'Biochemistry',
    'C07D': 'Organic Chemistry',        'C08G': 'Polymers',
}

_CPC_CLASS = {
    'G06': 'Computing & Software',  'G05': 'Control Systems',
    'G01': 'Measurement & Testing', 'G02': 'Optics',
    'G11': 'Storage & Memory',      'G16': 'Healthcare IT',
    'H04': 'Telecommunications',    'H01': 'Electronic Components',
    'H02': 'Power Systems',         'H03': 'Electronic Circuits',
    'A61': 'Medical & Healthcare',  'A01': 'Agriculture',
    'B60': 'Vehicles & Transport',  'B64': 'Aerospace',
    'C12': 'Biotechnology',         'C07': 'Organic Chemistry',
    'C08': 'Polymers & Materials',  'C09': 'Dyes & Coatings',
    'F02': 'Combustion Engines',    'F16': 'Mechanical Components',
    'F24': 'Heating & Cooling',     'F41': 'Defense',
}

_CPC_SECTION = {
    'A': 'Consumer Products',       'B': 'Operations & Transport',
    'C': 'Chemistry & Materials',   'D': 'Textiles & Paper',
    'E': 'Civil Engineering',       'F': 'Mechanical Engineering',
    'G': 'Physics & Computing',     'H': 'Electrical & Electronics',
    'Y': 'Emerging Technologies',
}

# USPC class number → technology area (direct mapping for most common classes)
_USPC_CLASS = {
    250: 'Imaging & Optics',        257: 'Semiconductors',
    307: 'Power Systems',           320: 'Power Systems',
    326: 'Electronic Circuits',     340: 'Telecommunications',
    343: 'Telecommunications',      345: 'Computing & Software',
    347: 'Printing & Imaging',      348: 'Video & Imaging',
    355: 'Imaging & Optics',        356: 'Measurement & Testing',
    359: 'Optics',                  360: 'Storage Devices',
    361: 'Electronics & Circuits',  362: 'Lighting',
    363: 'Power Conversion',        370: 'Telecommunications',
    375: 'Telecommunications',      379: 'Telephony',
    380: 'Cybersecurity',           381: 'Audio Technology',
    382: 'Image Processing',        385: 'Optical Fibers',
    386: 'Video Technology',        388: 'Motor Control',
    392: 'Heating & Cooling',       398: 'Optical Communications',
    399: 'Electrophotography',      424: 'Pharmaceuticals',
    429: 'Energy Storage',          430: 'Radiation Imaging',
    455: 'Telecommunications',      462: 'Books & Libraries',
    500: 'Chemistry & Materials',   502: 'Catalysts',
    514: 'Pharmaceuticals',         530: 'Organic Chemistry',
    600: 'Medical & Healthcare',    601: 'Medical Therapy',
    602: 'Medical Devices',         604: 'Medical Devices',
    606: 'Medical Devices',         607: 'Medical Devices',
    623: 'Medical Devices',         700: 'Control Systems',
    701: 'Navigation & Transport',  702: 'Measurement & Testing',
    703: 'Simulation & Modeling',   704: 'Audio & Speech',
    705: 'Business & FinTech',      706: 'AI & Machine Learning',
    707: 'Computing & Software',    708: 'Computing & Software',
    709: 'Computing & Software',    710: 'Computing & Software',
    711: 'Computing & Software',    712: 'Computing & Software',
    713: 'Cybersecurity',           714: 'Computing & Software',
    715: 'Computing & Software',    716: 'Semiconductor Design',
    717: 'Computing & Software',    718: 'Computing & Software',
    719: 'Computing & Software',    720: 'Storage Devices',
    725: 'Video & Streaming',       726: 'Cybersecurity',
    800: 'Biotechnology',           930: 'Biotechnology',
    # Additional common classes
    29:  'Manufacturing & Processing', 73: 'Measurement & Testing',
    74:  'Mechanical Components',   123: 'Combustion Engines',
    174: 'Electronic Components',   180: 'Vehicles & Transport',
    200: 'Electronics & Circuits',  218: 'Electronic Switches',
    235: 'Computing & Software',    244: 'Aerospace',
    280: 'Vehicles & Transport',    296: 'Vehicles & Transport',
    297: 'Furniture & Seating',     310: 'Electrical Machines',
    315: 'Electronic Lighting',     318: 'Motor Control',
    323: 'Power Conversion',        324: 'Measurement & Testing',
    327: 'Electronic Circuits',     336: 'Electronic Components',
    341: 'Computing & Software',    342: 'Radar & Navigation',
    349: 'Display Devices',         365: 'Storage Devices',
    428: 'Chemistry & Materials',   435: 'Biotechnology',
    438: 'Semiconductors',          439: 'Electronic Components',
    463: 'Gaming & Amusement',      475: 'Mechanical Components',
}


def _derive_technology_area(codes: list) -> str:
    """Return the best human-readable technology area from a list of CPC/IPC or USPC codes."""
    for code in codes:
        code = code.strip()
        if not code:
            continue

        # USPC Design patents: D<digits>/<digits> e.g. "D14/495"
        # Must be checked BEFORE the CPC alpha path since 'D' is a CPC section too.
        if re.match(r'^D\d+/', code):
            return 'Design & Aesthetics'

        # CPC/IPC: starts with a letter (e.g. "H04L 29/06", "H04L29/06", "G06F 21/10")
        if code[0].isalpha():
            compact = code.replace(' ', '')
            subclass = compact[:4]  # e.g. "H04L"
            if subclass in _CPC_SUBCLASS:
                return _CPC_SUBCLASS[subclass]
            cls = compact[:3]       # e.g. "H04"
            if cls in _CPC_CLASS:
                return _CPC_CLASS[cls]
            section = compact[:1]   # e.g. "H"
            if section in _CPC_SECTION:
                return _CPC_SECTION[section]

        # USPC: <numeric-class>/<numeric-subclass> e.g. "707/722"
        # Reject codes where subclass contains letters (e.g. "1/PCT.004")
        elif '/' in code:
            parts = code.split('/', 1)
            subclass_part = parts[1] if len(parts) > 1 else ''
            if re.match(r'^[0-9.]+$', subclass_part):
                try:
                    class_num = int(parts[0])
                    if class_num in _USPC_CLASS:
                        return _USPC_CLASS[class_num]
                except (ValueError, IndexError):
                    pass

    return ''


def unenriched_queryset(portfolio=None, filters=None):
    """
    Build a queryset of patents eligible for ODP enrichment.

    Args:
        portfolio: optional Portfolio instance to scope by
        filters: optional dict with keys:
            - status: list of patent statuses, e.g. ['granted', 'pending']
            - patent_type: list of patent types, e.g. ['utility', 'design']

    Returns:
        QuerySet of Patent objects
    """
    from .models import Patent

    qs = Patent.objects.filter(odp_raw_data={}).exclude(
        application_number__isnull=True
    ).exclude(application_number='')

    if portfolio:
        qs = qs.filter(portfolio=portfolio)

    if filters:
        statuses = filters.get('status')
        if statuses and isinstance(statuses, list):
            qs = qs.filter(status__in=statuses)

        patent_types = filters.get('patent_type')
        if patent_types and isinstance(patent_types, list):
            qs = qs.filter(patent_type__in=patent_types)

    return qs


def enrich_patent(patent, svc=None):
    """
    Enrich a single patent with data from the USPTO Open Data Portal.

    Args:
        patent: Patent model instance (must have application_number)
        svc: USPTOODPDetailService instance (created if not provided)

    Returns:
        dict with keys: success (bool), updated_fields (list), error (str|None)
    """
    from domains.analytics.uspto_odp_service import (
        USPTOODPClient,
        USPTOODPDetailService,
        USPTOODPError,
    )

    raw_app_num = (patent.application_number or '').strip()
    if not raw_app_num:
        return {'success': False, 'updated_fields': [], 'error': 'No application_number'}

    # ODP API expects bare digits (e.g. "16234891" not "US16/234,891")
    app_num = _normalize_app_num(raw_app_num)
    if not app_num:
        return {'success': False, 'updated_fields': [], 'error': f'Invalid application_number: {raw_app_num}'}

    if svc is None:
        svc = USPTOODPDetailService(USPTOODPClient())

    try:
        enrichment = {}

        # Fetch the main application endpoint — it has most of the data.
        try:
            enrichment['application'] = svc.get_application(app_num)
        except USPTOODPError as exc:
            return {'success': False, 'updated_fields': [], 'error': f'ODP lookup failed: {exc}'}

        # Secondary endpoints are fetched only when the primary response lacks the data.
        # This reduces API calls from 5 → 1 for most patents.
        _primary_app = enrichment.get('application') or {}
        _primary_parent_bag = _primary_app.get('parentContinuityBag') or []

        # Fetch continuity only if primary lacks a parent chain and priority_date not set
        if not _primary_parent_bag and not patent.priority_date:
            try:
                enrichment['continuity'] = svc.get_continuity(app_num)
            except USPTOODPError:
                enrichment['continuity'] = None

        # Fetch foreign priority only if no parent chain found anywhere and still no priority_date
        _cont_parent_bag = (enrichment.get('continuity') or {}).get('parentContinuityBag') or []
        if not _primary_parent_bag and not _cont_parent_bag and not patent.priority_date:
            try:
                enrichment['foreign_priority'] = svc.get_foreign_priority(app_num)
            except USPTOODPError:
                enrichment['foreign_priority'] = None

        # term_adjustment and assignment endpoints are not used downstream — skip them

        # --- Map ODP fields to Patent model ---
        updated_fields = []
        app_data = enrichment.get('application') or {}
        meta = app_data.get('applicationMetaData', {})

        # title
        odp_title = meta.get('inventionTitle', '')
        if odp_title and (not patent.title or patent.title == 'Untitled'):
            patent.title = odp_title
            updated_fields.append('title')

        # patent_number
        odp_patent_num = meta.get('patentNumber', '')
        if odp_patent_num and not patent.patent_number:
            patent.patent_number = odp_patent_num
            updated_fields.append('patent_number')

        # filing_date
        odp_filing = meta.get('filingDate', '')
        if odp_filing and not patent.filing_date:
            try:
                patent.filing_date = dt_date.fromisoformat(odp_filing)
                updated_fields.append('filing_date')
            except (ValueError, TypeError):
                pass

        # grant_date
        odp_grant = meta.get('grantDate', '')
        if odp_grant and not patent.grant_date:
            try:
                patent.grant_date = dt_date.fromisoformat(odp_grant)
                updated_fields.append('grant_date')
            except (ValueError, TypeError):
                pass

        # status mapping
        odp_status_desc = meta.get('applicationStatusDescriptionText', '')
        if odp_status_desc and patent.status in ('draft', 'pending'):
            status_map = {
                'Patented Case': 'granted',
                'Patent Expired Due to NonPayment of Maintenance Fees Under 37 CFR 1.362': 'expired',
                'Patent Expired': 'expired',
                'Abandoned': 'abandoned',
                'Abandoned -- Failure to Respond to an Office Action': 'abandoned',
                "Abandoned -- After Examiner's Answer or Board of Appeals Decision": 'abandoned',
                'Docketed New Case - Ready for Examination': 'pending',
            }
            mapped = status_map.get(odp_status_desc)
            if mapped and mapped != patent.status:
                patent.status = mapped
                updated_fields.append('status')

        # patent_type mapping
        odp_type_label = meta.get('applicationTypeLabelName', '')
        if odp_type_label:
            type_map = {
                'Utility': 'utility',
                'Design': 'design',
                'Plant': 'plant',
                'Provisional': 'provisional',
            }
            mapped_type = type_map.get(odp_type_label)
            if mapped_type and mapped_type != patent.patent_type:
                patent.patent_type = mapped_type
                updated_fields.append('patent_type')

        # inventors
        inventor_bag = meta.get('inventorBag', []) or []
        if inventor_bag and not patent.inventors:
            names = []
            for inv in inventor_bag:
                if isinstance(inv, str):
                    names.append(inv)
                elif isinstance(inv, dict):
                    name_text = inv.get('inventorNameText', '')
                    if name_text:
                        names.append(name_text)
                    else:
                        parts = []
                        if inv.get('firstName'):
                            parts.append(inv['firstName'])
                        if inv.get('lastName'):
                            parts.append(inv['lastName'])
                        if parts:
                            names.append(' '.join(parts))
            if names:
                patent.inventors = names
                updated_fields.append('inventors')

        # assignees
        if not patent.assignees:
            assignee_names = []
            applicant_bag = meta.get('applicantBag', []) or []
            for a in applicant_bag:
                if isinstance(a, str):
                    assignee_names.append(a)
                elif isinstance(a, dict):
                    name = a.get('applicantNameText', '')
                    if name:
                        assignee_names.append(name)

            if not assignee_names:
                assignment_bag = app_data.get('assignmentBag', []) or []
                if assignment_bag:
                    latest = assignment_bag[-1]
                    for a in latest.get('assigneeBag', []):
                        if isinstance(a, str):
                            assignee_names.append(a)
                        elif isinstance(a, dict):
                            name = a.get('assigneeNameText', '') or a.get('assigneeName', '')
                            if name:
                                assignee_names.append(name)

            if assignee_names:
                patent.assignees = assignee_names
                updated_fields.append('assignees')

        # CPC classifications
        cpc_bag = meta.get('cpcClassificationBag', []) or []
        if cpc_bag and not patent.ipc_classifications:
            codes = [c.strip() for c in cpc_bag if isinstance(c, str) and c.strip()]
            if codes:
                patent.ipc_classifications = codes
                updated_fields.append('ipc_classifications')

        # Derive technology_area from classifications if not already set
        all_codes = patent.ipc_classifications or []
        if all_codes and not patent.technology_area:
            area = _derive_technology_area(all_codes)
            if area:
                patent.technology_area = area
                updated_fields.append('technology_area')

        # priority_date from continuity data
        parent_bag = app_data.get('parentContinuityBag', []) or []
        if not parent_bag:
            continuity_data = enrichment.get('continuity') or {}
            parent_bag = continuity_data.get('parentContinuityBag', []) or []
        if parent_bag and not patent.priority_date:
            earliest = None
            for parent in parent_bag:
                pdate_str = parent.get('filingDate', '') or parent.get('parentFilingDate', '')
                if pdate_str:
                    try:
                        pdate = dt_date.fromisoformat(pdate_str)
                        if earliest is None or pdate < earliest:
                            earliest = pdate
                    except (ValueError, TypeError):
                        pass
            if earliest:
                patent.priority_date = earliest
                updated_fields.append('priority_date')

        # priority_date from foreign priority
        fp_data = enrichment.get('foreign_priority') or {}
        fp_bag = fp_data.get('foreignPriorityBag', []) or []
        if fp_bag and not patent.priority_date:
            earliest = None
            for fp in fp_bag:
                fpdate_str = fp.get('filingDate', '') or fp.get('priorityDate', '')
                if fpdate_str:
                    try:
                        fpdate = dt_date.fromisoformat(fpdate_str)
                        if earliest is None or fpdate < earliest:
                            earliest = fpdate
                    except (ValueError, TypeError):
                        pass
            if earliest:
                patent.priority_date = earliest
                updated_fields.append('priority_date')

        # Fetch full-text (abstract + claims) via XML if available
        if not patent.abstract or not patent.claims:
            try:
                from domains.analytics.odp_views import _fetch_and_parse_xml
                from domains.analytics.models import ODPCacheEntry

                ft_cutoff = timezone.now() - svc.CACHE_TTL
                ft_cached = ODPCacheEntry.objects.filter(
                    application_id=app_num, endpoint='full-text-parsed',
                    fetched_at__gte=ft_cutoff,
                ).first()

                if ft_cached:
                    full_text = ft_cached.response_data
                else:
                    grant_meta = app_data.get('grantDocumentMetaData') or {}
                    pub_meta = app_data.get('pgpubDocumentMetaData') or app_data.get('publicationDocumentMetaData') or {}
                    grant_url = grant_meta.get('fileLocationURI')
                    pgpub_url = pub_meta.get('fileLocationURI')
                    api_key = svc.client.api_key

                    grant_text = _fetch_and_parse_xml(grant_url, api_key) if grant_url else None
                    pgpub_text = _fetch_and_parse_xml(pgpub_url, api_key) if pgpub_url else None

                    full_text = {
                        'grant_text': grant_text,
                        'pgpub_text': pgpub_text,
                    }
                    ODPCacheEntry.objects.update_or_create(
                        application_id=app_num, endpoint='full-text-parsed',
                        defaults={'response_data': full_text, 'fetched_at': timezone.now()},
                    )

                text_src = full_text.get('grant_text') or full_text.get('pgpub_text') or {}
                if text_src.get('abstract') and not patent.abstract:
                    patent.abstract = text_src['abstract']
                    updated_fields.append('abstract')

                if text_src.get('claims') and not patent.claims:
                    patent.claims = [
                        {'number': i + 1, 'text': c}
                        for i, c in enumerate(text_src['claims'])
                    ]
                    updated_fields.append('claims')
            except Exception:
                pass  # full-text is best-effort

        # Store the full raw ODP response
        if app_data and not patent.odp_raw_data:
            patent.odp_raw_data = app_data
            updated_fields.append('odp_raw_data')

        # Save if any fields were updated
        if updated_fields:
            patent.save(update_fields=updated_fields + ['updated_at'])

        return {'success': True, 'updated_fields': updated_fields, 'error': None}

    except Exception as exc:
        logger.exception('ODP enrichment failed for patent %s (app %s)', patent.pk, app_num)
        return {'success': False, 'updated_fields': [], 'error': str(exc)[:500]}


def unenriched_lens_queryset(portfolio=None, filters=None):
    """
    Build a queryset of patents eligible for Lens enrichment.

    Uses lens_id='' as the "not yet enriched by Lens" marker so that
    Lens-enriched patents (which don't set odp_raw_data) don't re-appear
    in the ODP enrichment queue.
    """
    from .models import Patent

    qs = Patent.objects.filter(lens_id='').exclude(
        application_number__isnull=True
    ).exclude(application_number='')

    if portfolio:
        qs = qs.filter(portfolio=portfolio)

    if filters:
        statuses = filters.get('status')
        if statuses and isinstance(statuses, list):
            qs = qs.filter(status__in=statuses)
        patent_types = filters.get('patent_type')
        if patent_types and isinstance(patent_types, list):
            qs = qs.filter(patent_type__in=patent_types)

    return qs


def _clean_number(raw):
    """Strip jurisdiction prefix, kind code and non-digits from a patent/app number."""
    cleaned = re.sub(r'^[A-Z]{2}', '', raw.strip())
    cleaned = re.sub(r'[A-Z]\d*$', '', cleaned)
    cleaned = re.sub(r'[^0-9]', '', cleaned)
    return cleaned


# Fields to request from Lens for enrichment (skip claims/description to reduce payload)
LENS_ENRICHMENT_FIELDS = [
    'lens_id', 'doc_number', 'kind', 'date_published', 'jurisdiction',
    'publication_type', 'biblio', 'abstract', 'legal_status',
]

# Fields to include when claims are also needed
LENS_ENRICHMENT_FIELDS_WITH_CLAIMS = LENS_ENRICHMENT_FIELDS + ['claims']


def enrich_patents_from_lens_batch(patents, client=None, include_claims=True):
    """
    Enrich a batch of patents via Lens API with minimal API calls.

    Patents with a patent_number are searched by doc_number (grant number).
    Patents with only an application_number are searched by application
    reference doc_number. This requires up to 2 API calls per batch.

    Args:
        patents: list of Patent model instances (max ~30)
        client: LensClient instance
        include_claims: whether to fetch claims (larger response)

    Returns:
        dict mapping patent.pk → enrich result dict
    """
    from domains.analytics.lens_service import LensClient, LensAPIError

    if client is None:
        client = LensClient()

    results = {}
    include_fields = LENS_ENRICHMENT_FIELDS_WITH_CLAIMS if include_claims else LENS_ENRICHMENT_FIELDS

    # Split patents into two groups: those with patent_number vs app-number-only
    by_patent_num = {}   # cleaned patent_number → [patents]
    by_app_num = {}      # raw app_number → [patents]

    for patent in patents:
        pn = (patent.patent_number or '').strip()
        an = (patent.application_number or '').strip()
        if pn:
            key = _clean_number(pn)
            if key:
                by_patent_num.setdefault(key, []).append(patent)
                continue
        if an:
            # Use raw app number — Lens application_number field accepts
            # multiple formats: US15/060,643, 15060643, 10/716,854, etc.
            by_app_num.setdefault(an, []).append(patent)
            continue
        results[patent.pk] = {
            'success': False, 'updated_fields': [],
            'error': 'No patent_number or application_number',
        }

    # --- Query 1: Search by doc_number (patent/grant number) ---
    if by_patent_num:
        hits = _lens_batch_search(
            client, 'doc_number', list(by_patent_num.keys()),
            include_fields, index_key='doc_number',
        )
        for doc_num, patent_list in by_patent_num.items():
            hit = hits.get(doc_num)
            for patent in patent_list:
                if hit:
                    results[patent.pk] = _apply_lens_hit_to_patent(patent, hit)
                else:
                    results[patent.pk] = {
                        'success': False, 'updated_fields': [],
                        'error': f'Patent {doc_num} not found in Lens',
                    }

    # --- Query 2: Search by application_number (app-number-only patents) ---
    if by_app_num:
        hits = _lens_batch_search(
            client, 'application_number', list(by_app_num.keys()),
            include_fields, index_key='application_number',
        )
        for app_num, patent_list in by_app_num.items():
            hit = hits.get(app_num)
            for patent in patent_list:
                if hit:
                    results[patent.pk] = _apply_lens_hit_to_patent(patent, hit)
                else:
                    results[patent.pk] = {
                        'success': False, 'updated_fields': [],
                        'error': f'Application {app_num} not found in Lens',
                    }

    return results


def _lens_batch_search(client, field, values, include_fields, index_key='doc_number'):
    """Execute a single Lens terms search and return hits indexed by a response key.

    Args:
        client: LensClient
        field: Lens query field name (e.g. 'doc_number', 'application_number')
        values: list of values to search for
        include_fields: list of fields to include in response
        index_key: how to index results:
            'doc_number' → index by hit doc_number
            'application_number' → index by hit biblio.application_number

    Returns:
        dict mapping value → first matching hit
    """
    from domains.analytics.lens_service import LensAPIError

    body = {
        'query': {'terms': {field: values}},
        'size': 100,  # Lens API max per request
        'include': include_fields,
        'sort': [{'date_published': 'desc'}],
    }

    try:
        data = client.post('/patent/search', body)
    except LensAPIError as exc:
        logger.error('Lens batch search failed for field %s: %s', field, exc)
        return {}

    hits = {}
    if not data or not data.get('data'):
        return hits

    if index_key == 'doc_number':
        for hit in data['data']:
            key = hit.get('doc_number', '')
            if key and key not in hits:
                hits[key] = hit
    elif index_key == 'application_number':
        # Build a lookup set from query values for matching
        query_values_clean = {re.sub(r'[^0-9]', '', v): v for v in values}
        for hit in data['data']:
            # Get the application_number from the response
            app_num = (hit.get('biblio', {})
                       .get('application_number', ''))
            app_ref_doc = (hit.get('biblio', {})
                          .get('application_reference', {})
                          .get('doc_number', ''))
            # Match against query values by comparing cleaned digits
            for raw in [app_num, app_ref_doc]:
                cleaned = re.sub(r'[^0-9]', '', raw)
                if cleaned in query_values_clean:
                    orig_key = query_values_clean[cleaned]
                    if orig_key not in hits:
                        hits[orig_key] = hit

    return hits


def enrich_patent_from_lens(patent, client=None):
    """
    Enrich a single patent with data from the Lens.org API.

    Tries patent_number first (as doc_number), then falls back to
    application_number (as application_reference.doc_number).

    Args:
        patent: Patent model instance
        client: LensClient instance (created if not provided)

    Returns:
        dict with keys: success (bool), updated_fields (list), error (str|None)
    """
    from domains.analytics.lens_service import LensClient, LensAPIError

    if client is None:
        client = LensClient()

    pn = _clean_number(patent.patent_number or '')
    an = _clean_number(patent.application_number or '')

    if not pn and not an:
        return {'success': False, 'updated_fields': [], 'error': 'No patent_number or application_number'}

    try:
        hit = None

        # Try patent_number as doc_number first
        if pn:
            body = {
                'query': {'terms': {'doc_number': [pn]}},
                'size': 1,
                'include': LENS_ENRICHMENT_FIELDS_WITH_CLAIMS,
                'sort': [{'date_published': 'desc'}],
            }
            data = client.post('/patent/search', body)
            if data and data.get('data'):
                hit = data['data'][0]

        # Fall back to application_number (accepts raw format like US15/060,643)
        if not hit and an:
            raw_an = (patent.application_number or '').strip()
            body = {
                'query': {'terms': {'application_number': [raw_an]}},
                'size': 1,
                'include': LENS_ENRICHMENT_FIELDS_WITH_CLAIMS,
                'sort': [{'date_published': 'desc'}],
            }
            data = client.post('/patent/search', body)
            if data and data.get('data'):
                hit = data['data'][0]

        if not hit:
            return {'success': False, 'updated_fields': [], 'error': 'No results from Lens'}

        return _apply_lens_hit_to_patent(patent, hit)

    except LensAPIError as exc:
        logger.error('Lens enrichment failed for patent %s: %s', patent.pk, exc)
        return {'success': False, 'updated_fields': [], 'error': f'Lens lookup failed: {exc}'}
    except Exception as exc:
        logger.exception('Lens enrichment failed for patent %s', patent.pk)
        return {'success': False, 'updated_fields': [], 'error': str(exc)[:500]}


def _apply_lens_hit_to_patent(patent, hit):
    """Apply a single Lens search hit to a Patent model instance.

    Returns:
        dict with keys: success (bool), updated_fields (list), error (str|None)
    """
    try:
        biblio = hit.get('biblio', {})
        updated_fields = []

        # Store lens_id for dedup
        lens_id = hit.get('lens_id', '')
        if lens_id and not getattr(patent, 'lens_id', ''):
            patent.lens_id = lens_id
            updated_fields.append('lens_id')

        # title
        invention_titles = biblio.get('invention_title', [])
        if invention_titles and (not patent.title or patent.title == 'Untitled'):
            title_text = invention_titles[0].get('text', '')
            if title_text:
                patent.title = title_text
                updated_fields.append('title')

        # grant_date (only if publication_type contains 'GRANTED')
        pub_type = hit.get('publication_type', '')
        date_published = hit.get('date_published', '')
        if date_published and 'GRANTED' in (pub_type or '').upper() and not patent.grant_date:
            try:
                patent.grant_date = dt_date.fromisoformat(date_published)
                updated_fields.append('grant_date')
            except (ValueError, TypeError):
                pass

        # filing_date
        app_ref = biblio.get('application_reference', {})
        app_date = app_ref.get('date', '')
        if app_date and not patent.filing_date:
            try:
                patent.filing_date = dt_date.fromisoformat(app_date)
                updated_fields.append('filing_date')
            except (ValueError, TypeError):
                pass

        # priority_date
        priority_claims = biblio.get('priority_claims', {})
        earliest_claim = priority_claims.get('earliest_claim', {})
        earliest_date = earliest_claim.get('date', '')
        if earliest_date and not patent.priority_date:
            try:
                patent.priority_date = dt_date.fromisoformat(earliest_date)
                updated_fields.append('priority_date')
            except (ValueError, TypeError):
                pass

        # assignees
        parties = biblio.get('parties', {})
        if not patent.assignees:
            applicants = parties.get('applicants', [])
            assignee_names = []
            for a in applicants:
                extracted = a.get('extracted_name', {})
                name = extracted.get('value', '')
                if name:
                    assignee_names.append(name)
            if assignee_names:
                patent.assignees = assignee_names
                updated_fields.append('assignees')

        # inventors
        if not patent.inventors:
            inventors_list = parties.get('inventors', [])
            inventor_names = []
            for inv in inventors_list:
                extracted = inv.get('extracted_name', {})
                name = extracted.get('value', '')
                if name:
                    inventor_names.append(name)
            if inventor_names:
                patent.inventors = inventor_names
                updated_fields.append('inventors')

        # CPC classifications
        cpc_data = biblio.get('classifications_cpc', {})
        classifications = cpc_data.get('classifications', [])
        if classifications and not patent.ipc_classifications:
            codes = [c.get('symbol', '') for c in classifications if c.get('symbol')]
            if codes:
                patent.ipc_classifications = codes
                updated_fields.append('ipc_classifications')

        # Derive technology_area from classifications if not already set
        all_codes = patent.ipc_classifications or []
        if all_codes and not patent.technology_area:
            area = _derive_technology_area(all_codes)
            if area:
                patent.technology_area = area
                updated_fields.append('technology_area')

        # abstract
        abstracts = hit.get('abstract', [])
        if abstracts and not patent.abstract:
            abstract_text = abstracts[0].get('text', '')
            if abstract_text:
                patent.abstract = abstract_text
                updated_fields.append('abstract')

        # claims
        claims_data = hit.get('claims', [])
        if claims_data and not patent.claims:
            patent.claims = [
                {'number': i + 1, 'text': claim_text}
                for i, claim_text in enumerate(claims_data)
                if isinstance(claim_text, str)
            ]
            if patent.claims:
                updated_fields.append('claims')

        # status mapping from legal_status.patent_status
        legal_status = hit.get('legal_status', {})
        patent_status = legal_status.get('patent_status', '')
        if patent_status and patent.status in ('draft', 'pending'):
            status_map = {
                'GRANTED': 'granted',
                'PENDING': 'pending',
                'EXPIRED': 'expired',
                'ABANDONED': 'abandoned',
            }
            mapped = status_map.get(patent_status.upper())
            if mapped and mapped != patent.status:
                patent.status = mapped
                updated_fields.append('status')

        # Save if any fields were updated
        if updated_fields:
            patent.save(update_fields=updated_fields + ['updated_at'])

        return {'success': True, 'updated_fields': updated_fields, 'error': None}

    except Exception as exc:
        logger.exception('Lens enrichment mapping failed for patent %s', patent.pk)
        return {'success': False, 'updated_fields': [], 'error': str(exc)[:500]}


def enrich_patent_batch(patents, svc=None, delay=1.0):
    """
    Sequentially enrich a list of patents with inter-patent delay.

    Args:
        patents: iterable of Patent instances
        svc: USPTOODPDetailService instance (shared across batch)
        delay: seconds to sleep between patents (rate limiting)

    Returns:
        dict with keys: enriched (int), skipped (int), failed (int),
                        failed_patents (list of {patent_id, app_num, error})
    """
    from domains.analytics.uspto_odp_service import USPTOODPClient, USPTOODPDetailService

    if svc is None:
        svc = USPTOODPDetailService(USPTOODPClient())

    enriched = 0
    skipped = 0
    failed = 0
    failed_patents = []

    for i, patent in enumerate(patents):
        if i > 0 and delay > 0:
            _time.sleep(delay)

        result = enrich_patent(patent, svc=svc)

        if result['success']:
            if result['updated_fields']:
                enriched += 1
            else:
                skipped += 1
        else:
            failed += 1
            failed_patents.append({
                'patent_id': str(patent.pk),
                'app_num': patent.application_number or '',
                'error': result['error'] or 'Unknown error',
            })

    return {
        'enriched': enriched,
        'skipped': skipped,
        'failed': failed,
        'failed_patents': failed_patents,
    }
