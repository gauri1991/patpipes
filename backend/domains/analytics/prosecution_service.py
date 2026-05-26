"""
Prosecution History Parsing Service (Module 7)

Extracts prosecution events, cited prior art, and builds summaries from
existing ODP raw data stored in Patent.odp_raw_data.

Steps implemented:
7.1 — Fetch prosecution metadata (from odp_raw_data, no API call needed)
7.2 — Classify prosecution events into canonical types
7.9 — Extract examiner-cited prior art from reference bags
7.11 — Build prosecution summary object
"""

import logging
from collections import Counter
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# Step 7.1: Extract Prosecution Events from ODP Data
# ═══════════════════════════════════════════════════════════════

def extract_prosecution_events(odp_raw_data: Dict) -> List[Dict]:
    """Step 7.1: Extract prosecution events from ODP raw data.

    Args:
        odp_raw_data: The Patent.odp_raw_data dict (full ODP response)

    Returns:
        List of event dicts: {date, event_code, description, document_ref}
    """
    events = []

    if not odp_raw_data:
        return events

    # Source 1: eventDataBag (prosecution history events)
    event_bag = odp_raw_data.get('eventDataBag', [])
    if isinstance(event_bag, list):
        for event in event_bag:
            if not isinstance(event, dict):
                continue
            events.append({
                'date': event.get('eventDate', '') or event.get('date', ''),
                'event_code': event.get('eventCode', '') or event.get('code', ''),
                'description': event.get('eventDescriptionText', '') or event.get('description', ''),
                'document_ref': event.get('documentIdentifier', '') or event.get('documentRef', ''),
            })

    # Source 2: transactionBag (if eventDataBag is empty)
    if not events:
        meta = odp_raw_data.get('applicationMetaData', {})
        transactions = meta.get('transactionBag', []) or odp_raw_data.get('transactionBag', [])
        if isinstance(transactions, list):
            for txn in transactions:
                if not isinstance(txn, dict):
                    continue
                events.append({
                    'date': txn.get('recordDate', '') or txn.get('transactionDate', '') or txn.get('date', ''),
                    'event_code': txn.get('transactionCode', '') or txn.get('code', ''),
                    'description': txn.get('transactionDescriptionText', '') or txn.get('description', ''),
                    'document_ref': '',
                })

    # Sort by date
    events.sort(key=lambda e: e.get('date', '') or '')

    return events


# ═══════════════════════════════════════════════════════════════
# Step 7.2: Classify Events into Canonical Types
# ═══════════════════════════════════════════════════════════════

# Map ODP event codes/descriptions to canonical types
EVENT_TYPE_MAP = {
    # Filing events
    'FILED': 'FILED',
    'PGPB': 'PUBLICATION',
    'PG-PUB': 'PUBLICATION',

    # Office actions
    'CTNF': 'OFFICE_ACTION_NON_FINAL',
    'CTFR': 'OFFICE_ACTION_FINAL',
    'NOA': 'NOTICE_OF_ALLOWANCE',
    'EX PARTE QUAYLE': 'QUAYLE_ACTION',

    # Rejections (from description matching)
    'REJECTION_102': 'REJECTION_102',
    'REJECTION_103': 'REJECTION_103',
    'REJECTION_112': 'REJECTION_112',
    'REJECTION_101': 'REJECTION_101',

    # Responses
    'REM': 'RESPONSE',
    'A...': 'AMENDMENT',
    'RESPONSE AFTER': 'RESPONSE_AFTER_FINAL',
    'RCE': 'RCE',

    # Procedural
    'IREM': 'ISSUE_FEE_PAYMENT',
    'IEXX': 'GRANT',
    'ISSUE': 'GRANT',
    'ABN': 'ABANDONMENT',
    'APTS': 'APPEAL',
    'BRDG': 'BOARD_DECISION',
    'PETG': 'PETITION_GRANTED',
    'PETD': 'PETITION_DENIED',
    'RXFR': 'REEXAM_REQUEST',

    # Maintenance
    'M1551': 'MAINTENANCE_FEE',
    'M2551': 'MAINTENANCE_FEE',
    'M3551': 'MAINTENANCE_FEE',
    'LAPS': 'LAPSE',
    'EXPIRATION': 'EXPIRATION',
}

DESCRIPTION_KEYWORDS = {
    '102': 'REJECTION_102',
    '103': 'REJECTION_103',
    '112': 'REJECTION_112',
    '101': 'REJECTION_101',
    'restriction': 'RESTRICTION_REQUIREMENT',
    'interview': 'INTERVIEW',
    'information disclosure': 'IDS',
    'terminal disclaimer': 'TERMINAL_DISCLAIMER',
    'examiner\'s amendment': 'EXAMINER_AMENDMENT',
}


def classify_prosecution_events(raw_events: List[Dict]) -> List[Dict]:
    """Step 7.2: Classify raw events into canonical prosecution types.

    Args:
        raw_events: List from extract_prosecution_events()

    Returns:
        List with added 'canonical_type' field
    """
    classified = []

    for event in raw_events:
        code = (event.get('event_code', '') or '').upper().strip()
        desc = (event.get('description', '') or '').lower()

        # Try code-based mapping first
        canonical = None
        for map_code, canonical_type in EVENT_TYPE_MAP.items():
            if code == map_code or code.startswith(map_code):
                canonical = canonical_type
                break

        # Fall back to description keyword matching
        if not canonical:
            for keyword, canonical_type in DESCRIPTION_KEYWORDS.items():
                if keyword in desc:
                    canonical = canonical_type
                    break

        if not canonical:
            canonical = 'OTHER'

        classified.append({
            **event,
            'canonical_type': canonical,
        })

    return classified


# ═══════════════════════════════════════════════════════════════
# Step 7.9: Extract Examiner-Cited Prior Art
# ═══════════════════════════════════════════════════════════════

def extract_cited_prior_art(odp_raw_data: Dict) -> List[Dict]:
    """Step 7.9: Extract all cited references from ODP data.

    Args:
        odp_raw_data: The Patent.odp_raw_data dict

    Returns:
        List of cited ref dicts: {patent_number, kind, category, cited_phase}
    """
    refs = []
    seen = set()

    if not odp_raw_data:
        return refs

    # Source: referenceCitedBag in applicationMetaData
    meta = odp_raw_data.get('applicationMetaData', {})
    cited_bag = meta.get('referenceCitedBag', []) or odp_raw_data.get('referenceCitedBag', [])

    if not isinstance(cited_bag, list):
        return refs

    for ref in cited_bag:
        if not isinstance(ref, dict):
            continue

        patent_num = (
            ref.get('patentNumber', '')
            or ref.get('documentNumber', '')
            or ref.get('patent_number', '')
            or ref.get('publicationNumber', '')
        )

        if not patent_num or patent_num in seen:
            continue
        seen.add(patent_num)

        refs.append({
            'patent_number': patent_num,
            'kind': ref.get('kindCode', '') or ref.get('kind', ''),
            'category': ref.get('citationCategory', '') or ref.get('category', ''),
            'cited_phase': ref.get('citedPhase', '') or '',
            'is_npl': bool(ref.get('nplCitationText', '') or ref.get('isNPL', False)),
            'npl_text': ref.get('nplCitationText', '') or '',
        })

    return refs


# ═══════════════════════════════════════════════════════════════
# Step 7.11: Build Prosecution Summary
# ═══════════════════════════════════════════════════════════════

def build_prosecution_summary(patent) -> Dict[str, Any]:
    """Step 7.11: Build complete prosecution summary for a single patent.

    Args:
        patent: UnifiedPatent object (needs raw_data with ODP data)

    Returns:
        Prosecution summary dict
    """
    raw = getattr(patent, 'raw_data', {}) or {}

    if not raw:
        return {
            'patent_id': getattr(patent, 'patent_id', ''),
            'has_prosecution_data': False,
        }

    # Extract and classify events
    raw_events = extract_prosecution_events(raw)
    classified_events = classify_prosecution_events(raw_events)

    # Extract cited art
    cited_art = extract_cited_prior_art(raw)

    # Compute summary statistics
    event_types = Counter(e['canonical_type'] for e in classified_events)

    # Count office actions
    oa_count = sum(event_types.get(t, 0) for t in [
        'OFFICE_ACTION_NON_FINAL', 'OFFICE_ACTION_FINAL', 'QUAYLE_ACTION'
    ])

    # Rejection types
    rejection_types = {
        '102': event_types.get('REJECTION_102', 0),
        '103': event_types.get('REJECTION_103', 0),
        '112': event_types.get('REJECTION_112', 0),
        '101': event_types.get('REJECTION_101', 0),
    }

    # Time to grant (if both filing and grant dates available)
    filing_date = getattr(patent, 'filing_date', None)
    grant_date = getattr(patent, 'grant_date', None)
    time_to_grant = None
    if filing_date and grant_date:
        delta = (grant_date - filing_date).days
        if 0 < delta < 10000:
            time_to_grant = delta

    # Has RCE?
    has_rce = event_types.get('RCE', 0) > 0

    # Has appeal?
    has_appeal = event_types.get('APPEAL', 0) > 0 or event_types.get('BOARD_DECISION', 0) > 0

    # Has terminal disclaimer?
    has_td = event_types.get('TERMINAL_DISCLAIMER', 0) > 0

    # Total cited references (patent + NPL)
    patent_refs = [r for r in cited_art if not r.get('is_npl')]
    npl_refs = [r for r in cited_art if r.get('is_npl')]

    return {
        'patent_id': getattr(patent, 'patent_id', ''),
        'has_prosecution_data': len(classified_events) > 0,
        'event_timeline': classified_events,
        'event_summary': dict(event_types.most_common()),
        'office_action_count': oa_count,
        'rejection_types': rejection_types,
        'total_rejections': sum(rejection_types.values()),
        'time_to_grant_days': time_to_grant,
        'time_to_grant_years': round(time_to_grant / 365, 1) if time_to_grant else None,
        'has_rce': has_rce,
        'has_appeal': has_appeal,
        'has_terminal_disclaimer': has_td,
        'cited_patent_refs': len(patent_refs),
        'cited_npl_refs': len(npl_refs),
        'cited_art': cited_art[:50],  # cap
        'prosecution_difficulty': _score_difficulty(oa_count, has_rce, has_appeal, sum(rejection_types.values())),
    }


def _score_difficulty(oa_count: int, has_rce: bool, has_appeal: bool, total_rejections: int) -> Dict:
    """Compute a prosecution difficulty score (0-100)."""
    score = 0
    score += min(oa_count * 15, 40)  # office actions: 0-40
    score += 20 if has_rce else 0    # RCE: +20
    score += 25 if has_appeal else 0  # Appeal: +25
    score += min(total_rejections * 5, 15)  # rejections: 0-15
    score = min(score, 100)

    level = 'easy' if score < 25 else 'moderate' if score < 50 else 'difficult' if score < 75 else 'very_difficult'

    return {
        'score': score,
        'level': level,
    }


# ═══════════════════════════════════════════════════════════════
# Project-Level Orchestrator
# ═══════════════════════════════════════════════════════════════

def analyze_project_prosecution(project_id: str, max_patents: int = 300) -> Dict[str, Any]:
    """Analyze prosecution history across all patents in a project.

    Args:
        project_id: UUID of the AnalyticsProject
        max_patents: Cap on patents to process

    Returns:
        Aggregated prosecution analysis results
    """
    from .patent_data_service import get_project_patents

    patents = get_project_patents(project_id)
    if not patents:
        return {'error': 'No patent data available', 'total_patents': 0}

    patents = patents[:max_patents]
    summaries = []

    for patent in patents:
        try:
            summary = build_prosecution_summary(patent)
            if summary.get('has_prosecution_data'):
                summaries.append(summary)
        except Exception as e:
            logger.warning('Prosecution parsing failed for %s: %s', patent.patent_id, e)

    if not summaries:
        return {
            'project_id': project_id,
            'total_patents': len(patents),
            'patents_with_prosecution_data': 0,
            'note': 'No prosecution data found in patent records. Enrich patents from USPTO ODP to populate prosecution history.',
        }

    # Aggregate statistics
    avg_oa = round(sum(s['office_action_count'] for s in summaries) / len(summaries), 1)
    avg_time = None
    times = [s['time_to_grant_days'] for s in summaries if s['time_to_grant_days']]
    if times:
        avg_time = round(sum(times) / len(times))

    rce_rate = round(sum(1 for s in summaries if s['has_rce']) / len(summaries) * 100, 1)
    appeal_rate = round(sum(1 for s in summaries if s['has_appeal']) / len(summaries) * 100, 1)
    td_rate = round(sum(1 for s in summaries if s['has_terminal_disclaimer']) / len(summaries) * 100, 1)

    # Rejection type distribution
    rejection_totals = Counter()
    for s in summaries:
        for rtype, count in s['rejection_types'].items():
            rejection_totals[rtype] += count

    # Difficulty distribution
    difficulty_dist = Counter()
    for s in summaries:
        difficulty_dist[s['prosecution_difficulty']['level']] += 1

    # Average cited refs
    avg_patent_refs = round(sum(s['cited_patent_refs'] for s in summaries) / len(summaries), 1)
    avg_npl_refs = round(sum(s['cited_npl_refs'] for s in summaries) / len(summaries), 1)

    # Most difficult patents
    hardest = sorted(summaries, key=lambda s: -s['prosecution_difficulty']['score'])[:10]

    return {
        'project_id': project_id,
        'total_patents': len(patents),
        'patents_with_prosecution_data': len(summaries),
        'avg_office_actions': avg_oa,
        'avg_time_to_grant_days': avg_time,
        'avg_time_to_grant_years': round(avg_time / 365, 1) if avg_time else None,
        'rce_rate_pct': rce_rate,
        'appeal_rate_pct': appeal_rate,
        'terminal_disclaimer_rate_pct': td_rate,
        'rejection_type_totals': dict(rejection_totals),
        'difficulty_distribution': [
            {'level': level, 'count': count, 'pct': round(count / len(summaries) * 100, 1)}
            for level, count in difficulty_dist.most_common()
        ],
        'avg_cited_patent_refs': avg_patent_refs,
        'avg_cited_npl_refs': avg_npl_refs,
        'hardest_prosecutions': [
            {
                'patent_id': s['patent_id'],
                'difficulty_score': s['prosecution_difficulty']['score'],
                'difficulty_level': s['prosecution_difficulty']['level'],
                'office_actions': s['office_action_count'],
                'has_rce': s['has_rce'],
                'has_appeal': s['has_appeal'],
                'time_to_grant_years': s['time_to_grant_years'],
            }
            for s in hardest
        ],
    }
