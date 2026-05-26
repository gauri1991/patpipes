"""
Unified Patent Data Access Layer

Bridges the gap between:
- patents.Patent (real enriched data from ODP/Lens, linked to Portfolio)
- analytics.PatentRecord (uploaded CSV records, linked to PatentDataset)

Provides a consistent interface for all analytics algorithms regardless of data source.
"""

import logging
from dataclasses import dataclass, field
from datetime import date as dt_date
from typing import List, Optional

from django.db.models import Q

logger = logging.getLogger(__name__)


@dataclass
class UnifiedPatent:
    """Normalized patent view for analytics algorithms.

    All 10 algorithms use this instead of querying PatentRecord directly.
    Fields match what algorithms actually need (verified by field-usage audit).
    """
    patent_id: str = ''
    record_id: Optional[str] = None  # PatentRecord UUID; None for portfolio-sourced patents
    title: str = ''
    abstract: str = ''
    assignee: str = ''
    parent_assignee: str = ''
    inventor: str = ''
    filing_date: Optional[dt_date] = None
    publication_date: Optional[dt_date] = None
    grant_date: Optional[dt_date] = None
    expiry_date: Optional[dt_date] = None
    country_code: str = ''
    jurisdiction: str = ''
    patent_type: str = ''
    legal_status: str = ''
    ipc_classification: str = ''
    cpc_classification: str = ''
    claims_count: int = 0
    independent_claims_count: int = 0
    dependent_claims_count: int = 0
    forward_citations: int = 0
    backward_citations: int = 0
    claims_structure: list = field(default_factory=list)
    raw_data: dict = field(default_factory=dict)


def get_project_patents(project_id: str) -> List[UnifiedPatent]:
    """Get all patent data for an analytics project from any available source.

    Resolution order:
    1. PatentDataset → PatentRecord objects (existing uploaded data path)
    2. AnalyticsProject.portfolio → patents.Patent objects (enriched data path)

    Both sources are merged — datasets take priority for records that exist
    in both (matched by patent_number or application_number).

    Args:
        project_id: UUID of the AnalyticsProject

    Returns:
        List of UnifiedPatent objects normalized for algorithm consumption
    """
    from .models import AnalyticsProject, PatentDataset, PatentRecord

    try:
        project = AnalyticsProject.objects.select_related('portfolio').get(id=project_id)
    except AnalyticsProject.DoesNotExist:
        logger.error('AnalyticsProject %s not found', project_id)
        return []

    results = []
    seen_ids = set()  # track by patent_id and lens_id to avoid duplicates

    # Source 1: PatentRecord from datasets (uploaded CSV/Excel data)
    datasets = PatentDataset.objects.filter(project=project)
    for record in PatentRecord.objects.filter(dataset__in=datasets).iterator():
        up = _from_patent_record(record)
        results.append(up)
        if up.patent_id:
            seen_ids.add(up.patent_id.strip().lower())

    # Source 2: Portfolio patents (enriched from ODP/Lens)
    if project.portfolio_id:
        from domains.patents.models import Patent
        portfolio_patents = Patent.objects.filter(portfolio=project.portfolio)
        for patent in portfolio_patents.iterator():
            # Deduplicate: skip if we already have this patent from dataset upload
            pid = (patent.patent_number or patent.application_number or '').strip().lower()
            if pid and pid in seen_ids:
                continue
            # Also dedup by lens_id if available
            lid = getattr(patent, 'lens_id', '') or ''
            if lid and lid in seen_ids:
                continue
            up = _from_patent(patent)
            results.append(up)
            if up.patent_id:
                seen_ids.add(up.patent_id.strip().lower())
            if lid:
                seen_ids.add(lid)

    logger.info(
        'get_project_patents(%s): %d total (%d from datasets, %d from portfolio)',
        project_id, len(results),
        sum(1 for _ in PatentRecord.objects.filter(dataset__in=datasets)),
        len(results) - sum(1 for _ in PatentRecord.objects.filter(dataset__in=datasets)),
    )
    return results


def get_project_patent_count(project_id: str) -> int:
    """Fast count without loading all records."""
    from .models import AnalyticsProject, PatentDataset, PatentRecord

    try:
        project = AnalyticsProject.objects.select_related('portfolio').get(id=project_id)
    except AnalyticsProject.DoesNotExist:
        return 0

    count = PatentRecord.objects.filter(
        dataset__project=project
    ).count()

    if project.portfolio_id:
        from domains.patents.models import Patent
        count += Patent.objects.filter(portfolio=project.portfolio).count()

    return count


def _from_patent_record(record) -> UnifiedPatent:
    """Convert analytics.PatentRecord → UnifiedPatent."""
    return UnifiedPatent(
        patent_id=record.patent_id or '',
        record_id=str(record.id),
        title=record.title or '',
        abstract=record.abstract or '',
        assignee=record.assignee or '',
        parent_assignee=record.raw_data.get('ultimate_parent', '') if record.raw_data else '',
        inventor=record.inventor or '',
        filing_date=record.filing_date,
        publication_date=record.publication_date,
        grant_date=record.grant_date,
        country_code=record.country_code or '',
        jurisdiction=record.jurisdiction or '',
        patent_type=record.patent_type or '',
        legal_status=record.legal_status or '',
        ipc_classification=record.ipc_classification or '',
        cpc_classification=record.cpc_classification or '',
        claims_count=record.claims_count or 0,
        independent_claims_count=record.independent_claims_count or 0,
        dependent_claims_count=record.dependent_claims_count or 0,
        forward_citations=record.forward_citations or 0,
        backward_citations=record.backward_citations or 0,
        claims_structure=record.claims_structure or [],
        raw_data=record.raw_data or {},
    )


def _from_patent(patent) -> UnifiedPatent:
    """Convert patents.Patent → UnifiedPatent.

    Maps enriched Patent fields to the UnifiedPatent interface algorithms expect.
    """
    # Patent ID: prefer patent_number, fallback to application_number
    patent_id = patent.patent_number or patent.application_number or str(patent.pk)

    # Assignee: Patent stores as JSONField list, algorithms expect single string
    assignees = patent.assignees or []
    assignee = assignees[0] if assignees else ''
    parent_assignee = assignees[0] if assignees else ''  # same as primary for now

    # Inventor: same list→string conversion
    inventors = patent.inventors or []
    inventor = ', '.join(inventors) if inventors else ''

    # Country code: derive from patent_number prefix or application_number
    country_code = _extract_country_code(patent)

    # Legal status: map Patent.status enum to algorithm-expected strings
    status_map = {
        'granted': 'active',
        'pending': 'pending',
        'filed': 'pending',
        'draft': 'pending',
        'expired': 'expired',
        'abandoned': 'abandoned',
    }
    legal_status = status_map.get(patent.status, patent.status or '')

    # IPC classifications: Patent stores as JSONField list, algorithms expect string
    ipc_list = patent.ipc_classifications or []
    ipc_classification = '; '.join(ipc_list) if ipc_list else ''

    # Claims: count from JSONField list
    claims = patent.claims or []
    claims_count = len(claims)
    claims_structure = claims if isinstance(claims, list) else []

    # Count independent vs dependent claims from structure
    independent_count = 0
    dependent_count = 0
    for claim in claims_structure:
        if isinstance(claim, dict):
            text = claim.get('text', '')
            # Claims that reference another claim number are dependent
            if any(phrase in text.lower() for phrase in ['claim 1', 'claim 2', 'according to claim', 'of claim']):
                dependent_count += 1
            else:
                independent_count += 1

    # Forward citations: extract from odp_raw_data if available
    forward_citations = 0
    backward_citations = 0
    odp = patent.odp_raw_data or {}
    if odp:
        # ODP stores citation data in various places
        meta = odp.get('applicationMetaData', {})
        forward_citations = meta.get('forwardCitationsCount', 0) or 0
        backward_citations = meta.get('backwardCitationsCount', 0) or 0

    return UnifiedPatent(
        patent_id=patent_id,
        title=patent.title or '',
        abstract=patent.abstract or '',
        assignee=assignee,
        parent_assignee=parent_assignee,
        inventor=inventor,
        filing_date=patent.filing_date,
        grant_date=patent.grant_date,
        expiry_date=patent.expiry_date,
        country_code=country_code,
        jurisdiction=country_code,  # same for now
        patent_type=patent.patent_type or '',
        legal_status=legal_status,
        ipc_classification=ipc_classification,
        claims_count=claims_count,
        independent_claims_count=independent_count,
        dependent_claims_count=dependent_count,
        forward_citations=forward_citations,
        backward_citations=backward_citations,
        claims_structure=claims_structure,
        raw_data=odp,
    )


def _extract_country_code(patent) -> str:
    """Extract country/jurisdiction code from patent number or application number."""
    for field_val in [patent.patent_number, patent.application_number]:
        if field_val:
            val = field_val.strip()
            # Check for standard 2-letter country prefix (US, EP, WO, CN, JP, etc.)
            if len(val) >= 2 and val[:2].isalpha():
                return val[:2].upper()
    return 'US'  # default for this platform's focus
