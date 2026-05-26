"""
Landscape Analysis Sub-Analyzers

67 individual analyses organized by category. Each function takes a list of
UnifiedPatent objects and returns a dict of results.
"""

from collections import Counter, defaultdict
from datetime import datetime, date
from typing import List, Dict, Any, Optional
import math


# ═══════════════════════════════════════════════════════════════
# CATEGORY A: FILING ACTIVITY ANALYTICS (9 analyses)
# ═══════════════════════════════════════════════════════════════

def a1_filing_trend_by_year(patents) -> Dict:
    """A1: Patent count per year."""
    counter = Counter()
    for p in patents:
        if p.filing_date:
            counter[p.filing_date.year] += 1
    return {'filing_by_year': [{'year': y, 'count': c} for y, c in sorted(counter.items())]}


def a2_filing_trend_by_month(patents) -> Dict:
    """A2: Granular monthly filing velocity."""
    counter = Counter()
    for p in patents:
        if p.filing_date:
            key = f"{p.filing_date.year}-{p.filing_date.month:02d}"
            counter[key] += 1
    sorted_months = sorted(counter.items())

    # 3-month moving average
    counts = [c for _, c in sorted_months]
    moving_avg = []
    for i in range(len(counts)):
        window = counts[max(0, i-2):i+1]
        moving_avg.append(round(sum(window) / len(window), 1))

    return {'filing_by_month': [
        {'month': m, 'count': c, 'moving_avg': ma}
        for (m, c), ma in zip(sorted_months, moving_avg)
    ]}


def a3_filing_acceleration(patents) -> Dict:
    """A3: Is filing growth speeding up or slowing down? (2nd derivative)"""
    yearly = Counter()
    for p in patents:
        if p.filing_date:
            yearly[p.filing_date.year] += 1

    years = sorted(yearly.keys())
    if len(years) < 3:
        return {'acceleration': 'insufficient_data', 'acceleration_value': 0}

    # Year-over-year growth rates
    growth_rates = []
    for i in range(1, len(years)):
        prev = yearly[years[i-1]]
        curr = yearly[years[i]]
        rate = (curr - prev) / max(prev, 1)
        growth_rates.append({'year': years[i], 'growth_rate': round(rate * 100, 1)})

    # Acceleration = change in growth rate (2nd derivative)
    if len(growth_rates) >= 2:
        recent_growth = growth_rates[-1]['growth_rate']
        prior_growth = growth_rates[-2]['growth_rate']
        accel = round(recent_growth - prior_growth, 1)
        label = 'accelerating' if accel > 5 else 'decelerating' if accel < -5 else 'steady'
    else:
        accel = 0
        label = 'insufficient_data'

    return {
        'acceleration': label,
        'acceleration_value': accel,
        'yoy_growth_rates': growth_rates,
    }


def a6_grant_lag(patents) -> Dict:
    """A6: Time from filing to grant (avg, median, distribution)."""
    lags = []
    for p in patents:
        if p.filing_date and p.grant_date:
            delta = (p.grant_date - p.filing_date).days
            if 0 < delta < 10000:  # sanity check
                lags.append(delta)

    if not lags:
        return {'grant_lag': {'avg_days': 0, 'median_days': 0, 'total_granted': 0}}

    lags.sort()
    avg = round(sum(lags) / len(lags))
    median = lags[len(lags) // 2]

    # Distribution buckets
    buckets = {'<1yr': 0, '1-2yr': 0, '2-3yr': 0, '3-5yr': 0, '>5yr': 0}
    for d in lags:
        if d < 365: buckets['<1yr'] += 1
        elif d < 730: buckets['1-2yr'] += 1
        elif d < 1095: buckets['2-3yr'] += 1
        elif d < 1825: buckets['3-5yr'] += 1
        else: buckets['>5yr'] += 1

    return {'grant_lag': {
        'avg_days': avg,
        'avg_years': round(avg / 365, 1),
        'median_days': median,
        'median_years': round(median / 365, 1),
        'total_granted': len(lags),
        'distribution': [{'bucket': k, 'count': v} for k, v in buckets.items()],
    }}


def a8_publication_type_distribution(patents) -> Dict:
    """A8: Applications vs grants vs design patents."""
    counter = Counter()
    for p in patents:
        ptype = (p.patent_type or 'unknown').lower()
        counter[ptype] += 1

    # Also by legal status
    status_counter = Counter()
    for p in patents:
        status_counter[(p.legal_status or 'unknown').lower()] += 1

    return {
        'patent_type_distribution': [{'type': t, 'count': c} for t, c in counter.most_common()],
        'legal_status_distribution': [{'status': s, 'count': c} for s, c in status_counter.most_common()],
    }


def a9_seasonal_patterns(patents) -> Dict:
    """A9: Which quarters/months have peak filing?"""
    quarter_counter = Counter()
    month_counter = Counter()
    for p in patents:
        if p.filing_date:
            q = (p.filing_date.month - 1) // 3 + 1
            quarter_counter[f"Q{q}"] += 1
            month_counter[p.filing_date.month] += 1

    month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return {
        'quarterly_distribution': [{'quarter': q, 'count': c} for q, c in sorted(quarter_counter.items())],
        'monthly_distribution': [{'month': month_names[m-1], 'count': c} for m, c in sorted(month_counter.items())],
    }


# ═══════════════════════════════════════════════════════════════
# CATEGORY B: ASSIGNEE / PLAYER ANALYTICS (9 analyses)
# ═══════════════════════════════════════════════════════════════

def b10_top_assignees(patents) -> Dict:
    """B10: Top N assignees by count + market share."""
    counter = Counter()
    for p in patents:
        key = (p.parent_assignee or p.assignee or 'Unknown').strip()
        counter[key] += 1

    total = len(patents)
    shares = []
    hhi = 0.0
    for assignee, count in counter.most_common(20):
        share = count / max(total, 1)
        hhi += share ** 2
        shares.append({
            'assignee': assignee,
            'patent_count': count,
            'market_share': round(share * 100, 2),
        })

    hhi_score = round(hhi * 10000, 1)
    concentration = 'highly_concentrated' if hhi_score >= 2500 else 'moderately_concentrated' if hhi_score >= 1500 else 'competitive'

    return {
        'top_assignees': shares,
        'hhi_score': hhi_score,
        'market_concentration': concentration,
        'unique_assignees': len(counter),
    }


def b13_assignee_filing_velocity(patents) -> Dict:
    """B13: Each assignee's filing rate trend (accelerating/decelerating)."""
    current_year = datetime.now().year
    assignee_by_year = defaultdict(lambda: Counter())

    for p in patents:
        if p.filing_date:
            key = (p.parent_assignee or p.assignee or 'Unknown').strip()
            assignee_by_year[key][p.filing_date.year] += 1

    # Top 10 assignees only
    top = Counter()
    for p in patents:
        top[(p.parent_assignee or p.assignee or 'Unknown').strip()] += 1

    results = []
    for assignee, _ in top.most_common(10):
        yearly = assignee_by_year[assignee]
        recent = sum(yearly[y] for y in range(current_year - 2, current_year + 1))
        prior = sum(yearly[y] for y in range(current_year - 5, current_year - 2))
        growth = round((recent - prior) / max(prior, 1) * 100, 1)
        results.append({
            'assignee': assignee,
            'recent_3yr': recent,
            'prior_3yr': prior,
            'growth_pct': growth,
            'trend': 'accelerating' if growth > 20 else 'decelerating' if growth < -20 else 'stable',
        })

    return {'assignee_velocity': results}


def b14_assignee_tech_focus_shift(patents) -> Dict:
    """B14: How each top assignee's CPC distribution changes over time."""
    current_year = datetime.now().year

    # Top 5 assignees
    assignee_counter = Counter()
    for p in patents:
        assignee_counter[(p.parent_assignee or p.assignee or '').strip()] += 1

    results = []
    for assignee, _ in assignee_counter.most_common(5):
        early_cpcs = Counter()  # >3 years ago
        recent_cpcs = Counter()  # last 3 years

        for p in patents:
            if (p.parent_assignee or p.assignee or '').strip() != assignee:
                continue
            if not p.filing_date:
                continue

            cpcs = set()
            for field in [p.ipc_classification, p.cpc_classification]:
                if field:
                    for code in field.split(';'):
                        code = code.strip()
                        if len(code) >= 4:
                            cpcs.add(code[:4])

            target = recent_cpcs if p.filing_date.year >= current_year - 3 else early_cpcs
            for c in cpcs:
                target[c] += 1

        # Identify shifts
        all_codes = set(list(early_cpcs.keys()) + list(recent_cpcs.keys()))
        shifts = []
        for code in all_codes:
            e = early_cpcs.get(code, 0)
            r = recent_cpcs.get(code, 0)
            if e + r >= 3:  # minimum threshold
                shifts.append({
                    'cpc': code,
                    'early_count': e,
                    'recent_count': r,
                    'direction': 'increasing' if r > e * 1.3 else 'decreasing' if r < e * 0.7 else 'stable',
                })
        shifts.sort(key=lambda x: abs(x['recent_count'] - x['early_count']), reverse=True)

        results.append({
            'assignee': assignee,
            'tech_shifts': shifts[:8],
        })

    return {'assignee_tech_shifts': results}


def b15_collaboration_network(patents) -> Dict:
    """B15: Co-assignee patents (joint filings)."""
    # Detect patents with multiple assignees via raw_data
    collabs = []
    for p in patents:
        raw = p.raw_data or {}
        applicants = raw.get('applicationMetaData', {}).get('applicantBag', [])
        if not applicants:
            applicants = raw.get('applicantBag', [])
        if len(applicants) >= 2:
            names = []
            for a in applicants:
                if isinstance(a, dict):
                    names.append(a.get('applicantNameText', '') or a.get('name', ''))
                elif isinstance(a, str):
                    names.append(a)
            names = [n for n in names if n]
            if len(names) >= 2:
                collabs.append({
                    'patent_id': p.patent_id,
                    'co_assignees': names[:5],
                    'title': (p.title or '')[:60],
                })

    # Count co-assignment pairs
    pair_counter = Counter()
    for c in collabs:
        assignees = sorted(c['co_assignees'])
        for i in range(len(assignees)):
            for j in range(i + 1, len(assignees)):
                pair_counter[(assignees[i], assignees[j])] += 1

    top_pairs = [
        {'entity_a': a, 'entity_b': b, 'co_filings': count}
        for (a, b), count in pair_counter.most_common(15)
    ]

    return {
        'collaboration_network': {
            'total_joint_filings': len(collabs),
            'top_collaboration_pairs': top_pairs,
            'joint_filing_examples': collabs[:20],
        }
    }


def b16_portfolio_age_profile(patents) -> Dict:
    """B16: Distribution of patent ages per top assignee."""
    current_year = datetime.now().year

    assignee_counter = Counter()
    for p in patents:
        assignee_counter[(p.parent_assignee or p.assignee or '').strip()] += 1

    results = []
    for assignee, _ in assignee_counter.most_common(10):
        ages = []
        for p in patents:
            if (p.parent_assignee or p.assignee or '').strip() != assignee:
                continue
            if p.filing_date:
                ages.append(current_year - p.filing_date.year)

        if not ages:
            continue

        buckets = {'0-2yr': 0, '3-5yr': 0, '6-10yr': 0, '11-15yr': 0, '16-20yr': 0, '>20yr': 0}
        for a in ages:
            if a <= 2: buckets['0-2yr'] += 1
            elif a <= 5: buckets['3-5yr'] += 1
            elif a <= 10: buckets['6-10yr'] += 1
            elif a <= 15: buckets['11-15yr'] += 1
            elif a <= 20: buckets['16-20yr'] += 1
            else: buckets['>20yr'] += 1

        results.append({
            'assignee': assignee,
            'avg_age': round(sum(ages) / len(ages), 1),
            'median_age': sorted(ages)[len(ages) // 2],
            'age_distribution': [{'bucket': k, 'count': v} for k, v in buckets.items()],
        })

    return {'portfolio_age_profiles': results}


def b17_active_expired_ratio(patents) -> Dict:
    """B17: What % of each assignee's portfolio is still active?"""
    assignee_status = defaultdict(lambda: Counter())

    for p in patents:
        key = (p.parent_assignee or p.assignee or 'Unknown').strip()
        status = (p.legal_status or 'unknown').lower()
        if status in ('active', 'granted', 'patented'):
            assignee_status[key]['active'] += 1
        elif status in ('expired', 'lapsed'):
            assignee_status[key]['expired'] += 1
        elif status in ('pending', 'filed'):
            assignee_status[key]['pending'] += 1
        else:
            assignee_status[key]['other'] += 1

    # Top 10 by total
    totals = {a: sum(c.values()) for a, c in assignee_status.items()}
    top = sorted(totals.items(), key=lambda x: -x[1])[:10]

    results = []
    for assignee, total in top:
        s = assignee_status[assignee]
        results.append({
            'assignee': assignee,
            'total': total,
            'active': s['active'],
            'expired': s['expired'],
            'pending': s['pending'],
            'active_pct': round(s['active'] / max(total, 1) * 100, 1),
        })

    return {'assignee_active_expired': results}


def b18_entity_size_split(patents) -> Dict:
    """B18: Small entity vs large entity from ODP data."""
    counter = Counter()
    for p in patents:
        raw = p.raw_data or {}
        entity_data = raw.get('applicationMetaData', {}).get('entityStatusData', {})
        if isinstance(entity_data, dict):
            entity_type = entity_data.get('businessEntityStatusCategory', '') or entity_data.get('entityStatus', '')
            if entity_type:
                counter[entity_type] += 1
            else:
                counter['unknown'] += 1
        else:
            counter['unknown'] += 1

    return {'entity_size_distribution': [{'entity_type': t, 'count': c} for t, c in counter.most_common()]}


# ═══════════════════════════════════════════════════════════════
# CATEGORY C: INVENTOR ANALYTICS (5 analyses)
# ═══════════════════════════════════════════════════════════════

def c19_top_inventors(patents) -> Dict:
    """C19: Most prolific individual inventors."""
    counter = Counter()
    inventor_assignees = defaultdict(set)

    for p in patents:
        inventor_str = p.inventor or ''
        assignee = (p.parent_assignee or p.assignee or '').strip()
        for inv in inventor_str.split(','):
            inv = inv.strip()
            if inv and len(inv) > 2:
                counter[inv] += 1
                if assignee:
                    inventor_assignees[inv].add(assignee)

    results = []
    for inv, count in counter.most_common(20):
        results.append({
            'inventor': inv,
            'patent_count': count,
            'companies': list(inventor_assignees[inv])[:3],
        })

    return {'top_inventors': results}


def c21_inventor_mobility(patents) -> Dict:
    """C21: Inventors who filed for multiple companies (talent movement)."""
    inventor_companies = defaultdict(lambda: defaultdict(list))

    for p in patents:
        if not p.filing_date:
            continue
        assignee = (p.parent_assignee or p.assignee or '').strip()
        if not assignee:
            continue
        for inv in (p.inventor or '').split(','):
            inv = inv.strip()
            if inv and len(inv) > 2:
                inventor_companies[inv][assignee].append(p.filing_date.year)

    movers = []
    for inv, companies in inventor_companies.items():
        if len(companies) >= 2:
            timeline = []
            for company, years in sorted(companies.items(), key=lambda x: min(x[1])):
                timeline.append({
                    'company': company,
                    'first_year': min(years),
                    'last_year': max(years),
                    'patents': len(years),
                })
            movers.append({
                'inventor': inv,
                'companies_count': len(companies),
                'timeline': timeline,
            })

    movers.sort(key=lambda x: -x['companies_count'])
    return {'inventor_mobility': movers[:15]}


def c23_solo_vs_team(patents) -> Dict:
    """C23: Average inventor count per patent, trend over time."""
    yearly_avg = defaultdict(list)

    for p in patents:
        inventors = [i.strip() for i in (p.inventor or '').split(',') if i.strip()]
        count = max(len(inventors), 1)
        if p.filing_date:
            yearly_avg[p.filing_date.year].append(count)

    trend = []
    for year in sorted(yearly_avg.keys()):
        counts = yearly_avg[year]
        trend.append({
            'year': year,
            'avg_inventors': round(sum(counts) / len(counts), 1),
            'solo_pct': round(sum(1 for c in counts if c == 1) / len(counts) * 100, 1),
            'team_pct': round(sum(1 for c in counts if c > 1) / len(counts) * 100, 1),
        })

    all_counts = [max(len([i.strip() for i in (p.inventor or '').split(',') if i.strip()]), 1) for p in patents]
    return {
        'inventor_team_stats': {
            'overall_avg': round(sum(all_counts) / max(len(all_counts), 1), 1),
            'solo_pct': round(sum(1 for c in all_counts if c == 1) / max(len(all_counts), 1) * 100, 1),
            'trend': trend,
        }
    }


# ═══════════════════════════════════════════════════════════════
# CATEGORY D: CLASSIFICATION / TECHNOLOGY ANALYTICS (8 analyses)
# ═══════════════════════════════════════════════════════════════

def _extract_cpc_codes(patents):
    """Helper: extract all CPC/IPC codes from patents."""
    patent_codes = {}  # patent_id -> set of codes
    all_counter = Counter()
    for p in patents:
        codes = set()
        for field in [p.ipc_classification, p.cpc_classification]:
            if not field:
                continue
            for code in field.split(';'):
                code = code.strip()
                if len(code) >= 4 and code[0].isalpha():
                    subclass = code[:4]
                    codes.add(subclass)
                    all_counter[subclass] += 1
        patent_codes[p.patent_id] = codes
    return patent_codes, all_counter


def d24_cpc_distribution(patents) -> Dict:
    """D24: CPC subclass distribution (top 20)."""
    _, counter = _extract_cpc_codes(patents)
    return {'cpc_distribution': [{'code': c, 'count': n} for c, n in counter.most_common(20)]}


def d27_cpc_cooccurrence(patents) -> Dict:
    """D27: Which CPC codes appear together on same patents? Technology convergence."""
    patent_codes, counter = _extract_cpc_codes(patents)

    # Co-occurrence matrix (top 15 codes only)
    top_codes = [c for c, _ in counter.most_common(15)]
    cooccurrence = Counter()

    for pid, codes in patent_codes.items():
        relevant = codes & set(top_codes)
        codes_list = sorted(relevant)
        for i in range(len(codes_list)):
            for j in range(i + 1, len(codes_list)):
                cooccurrence[(codes_list[i], codes_list[j])] += 1

    pairs = [
        {'code_a': a, 'code_b': b, 'co_occurrences': c}
        for (a, b), c in cooccurrence.most_common(30)
    ]

    return {'cpc_cooccurrence': pairs}


def d28_technology_diversification(patents) -> Dict:
    """D28: Shannon entropy — how spread are patents across CPC codes?"""
    _, counter = _extract_cpc_codes(patents)

    total = sum(counter.values())
    if total == 0:
        return {'diversification_index': 0, 'max_possible': 0, 'normalized': 0}

    entropy = 0
    for count in counter.values():
        p = count / total
        if p > 0:
            entropy -= p * math.log2(p)

    max_entropy = math.log2(len(counter)) if len(counter) > 1 else 1
    normalized = round(entropy / max_entropy, 3) if max_entropy > 0 else 0

    return {
        'diversification': {
            'shannon_entropy': round(entropy, 3),
            'max_possible': round(max_entropy, 3),
            'normalized_index': normalized,  # 0 = concentrated, 1 = maximally diverse
            'unique_cpc_codes': len(counter),
            'interpretation': 'highly_diverse' if normalized > 0.8 else 'diverse' if normalized > 0.6 else 'moderate' if normalized > 0.4 else 'concentrated',
        }
    }


def d29_technology_evolution(patents) -> Dict:
    """D29: How dominant CPC codes shift year over year."""
    current_year = datetime.now().year
    yearly_codes = defaultdict(Counter)

    for p in patents:
        if not p.filing_date:
            continue
        for field in [p.ipc_classification, p.cpc_classification]:
            if not field:
                continue
            for code in field.split(';'):
                code = code.strip()
                if len(code) >= 4:
                    yearly_codes[p.filing_date.year][code[:4]] += 1

    # Track top 3 CPC per year
    evolution = []
    for year in sorted(yearly_codes.keys()):
        top3 = yearly_codes[year].most_common(3)
        evolution.append({
            'year': year,
            'dominant_cpcs': [{'code': c, 'count': n} for c, n in top3],
            'total_filings': sum(yearly_codes[year].values()),
        })

    return {'technology_evolution': evolution[-15:]}  # last 15 years


def d30_cross_domain_bridges(patents) -> Dict:
    """D30: Patents classified in 2+ distinct CPC sections (tech convergence)."""
    bridges = []
    section_counter = Counter()

    for p in patents:
        sections = set()
        for field in [p.ipc_classification, p.cpc_classification]:
            if not field:
                continue
            for code in field.split(';'):
                code = code.strip()
                if code and code[0].isalpha():
                    sections.add(code[0])

        if len(sections) >= 2:
            bridge_key = '-'.join(sorted(sections))
            section_counter[bridge_key] += 1
            if len(bridges) < 20:
                bridges.append({
                    'patent_id': p.patent_id,
                    'title': (p.title or '')[:60],
                    'sections': sorted(sections),
                })

    return {
        'cross_domain_bridges': {
            'total_cross_domain': sum(section_counter.values()),
            'bridge_combinations': [{'sections': s, 'count': c} for s, c in section_counter.most_common(10)],
            'examples': bridges,
        }
    }


# ═══════════════════════════════════════════════════════════════
# CATEGORY E: CITATION ANALYTICS (8 analyses)
# ═══════════════════════════════════════════════════════════════

def e32_citation_influence(patents) -> Dict:
    """E32: Normalized citation influence score per patent."""
    current_year = datetime.now().year
    scored = []
    for p in patents:
        fwd = p.forward_citations or 0
        if fwd == 0:
            continue
        age = max(current_year - (p.filing_date.year if p.filing_date else current_year), 1)
        score = round(fwd / age, 2)
        scored.append({
            'patent_id': p.patent_id,
            'title': (p.title or '')[:80],
            'assignee': p.assignee or '',
            'forward_citations': fwd,
            'age_years': age,
            'influence_score': score,
        })
    scored.sort(key=lambda x: -x['influence_score'])
    return {
        'citation_influence': scored[:20],
        'top_cited_patents': scored[:10],
    }


def e35_citation_density_over_time(patents) -> Dict:
    """E35: Avg citations per patent by filing year."""
    yearly = defaultdict(list)
    for p in patents:
        if p.filing_date and p.forward_citations is not None:
            yearly[p.filing_date.year].append(p.forward_citations)

    trend = []
    for year in sorted(yearly.keys()):
        vals = yearly[year]
        trend.append({
            'year': year,
            'avg_citations': round(sum(vals) / len(vals), 1),
            'max_citations': max(vals),
            'patent_count': len(vals),
        })

    return {'citation_density_trend': trend}


def e36_self_citation_ratio(patents) -> Dict:
    """E36: What % of citations are to the same assignee's own patents?"""
    # Build assignee lookup from our patent set
    patent_assignees = {}
    for p in patents:
        patent_assignees[p.patent_id] = (p.parent_assignee or p.assignee or '').strip().lower()

    total_cites = 0
    self_cites = 0

    for p in patents:
        assignee = patent_assignees.get(p.patent_id, '').lower()
        if not assignee:
            continue
        raw = p.raw_data or {}
        cited_refs = raw.get('applicationMetaData', {}).get('referenceCitedBag', []) or raw.get('referenceCitedBag', []) or []
        for ref in cited_refs:
            cited_id = ''
            if isinstance(ref, dict):
                cited_id = ref.get('patentNumber', '') or ref.get('documentNumber', '')
            elif isinstance(ref, str):
                cited_id = ref
            if cited_id:
                total_cites += 1
                cited_assignee = patent_assignees.get(cited_id, '').lower()
                if cited_assignee and cited_assignee == assignee:
                    self_cites += 1

    ratio = round(self_cites / max(total_cites, 1) * 100, 1)
    return {
        'self_citation': {
            'total_citations_analyzed': total_cites,
            'self_citations': self_cites,
            'self_citation_pct': ratio,
            'interpretation': 'high_self_citation' if ratio > 30 else 'moderate' if ratio > 15 else 'low',
        }
    }


def e38_citation_concentration(patents) -> Dict:
    """E38: Are citations concentrated on a few landmark patents or spread widely?"""
    fwd = [(p.patent_id, p.forward_citations or 0) for p in patents if (p.forward_citations or 0) > 0]
    if not fwd:
        return {'citation_concentration': {'gini': 0, 'top_10_pct_share': 0}}

    fwd.sort(key=lambda x: -x[1])
    total_citations = sum(c for _, c in fwd)
    n = len(fwd)

    # Top 10% share
    top_10_n = max(1, n // 10)
    top_10_cites = sum(c for _, c in fwd[:top_10_n])
    top_10_share = round(top_10_cites / max(total_citations, 1) * 100, 1)

    # Gini coefficient
    citations_sorted = sorted(c for _, c in fwd)
    cumulative = 0
    gini_sum = 0
    for i, c in enumerate(citations_sorted):
        cumulative += c
        gini_sum += (2 * (i + 1) - n - 1) * c
    gini = round(gini_sum / (n * max(total_citations, 1)), 3) if n > 0 else 0

    return {
        'citation_concentration': {
            'gini_coefficient': gini,
            'top_10_pct_share': top_10_share,
            'total_cited_patents': n,
            'total_citations': total_citations,
            'interpretation': 'highly_concentrated' if gini > 0.6 else 'moderate' if gini > 0.3 else 'dispersed',
        }
    }


# ═══════════════════════════════════════════════════════════════
# CATEGORY F: CLAIMS ANALYTICS
# ═══════════════════════════════════════════════════════════════

def f40_claims_stats(patents) -> Dict:
    counts = [p.claims_count for p in patents if p.claims_count and p.claims_count > 0]
    if not counts:
        return {'claims_stats': {'avg': 0, 'median': 0, 'total_with_claims': 0}}
    counts.sort()
    buckets = {'1-5': 0, '6-10': 0, '11-20': 0, '21-50': 0, '>50': 0}
    for c in counts:
        if c <= 5: buckets['1-5'] += 1
        elif c <= 10: buckets['6-10'] += 1
        elif c <= 20: buckets['11-20'] += 1
        elif c <= 50: buckets['21-50'] += 1
        else: buckets['>50'] += 1
    return {'claims_stats': {
        'avg': round(sum(counts) / len(counts), 1), 'median': counts[len(counts) // 2],
        'min': counts[0], 'max': counts[-1],
        'total_with_claims': len(counts), 'total_without': len(patents) - len(counts),
        'distribution': [{'bucket': k, 'count': v} for k, v in buckets.items()],
    }}


def f41_independent_dependent_ratio(patents) -> Dict:
    total_ind = sum(p.independent_claims_count for p in patents if p.independent_claims_count)
    total_dep = sum(p.dependent_claims_count for p in patents if p.dependent_claims_count)
    total = total_ind + total_dep
    return {'claim_type_ratio': {
        'total_independent': total_ind, 'total_dependent': total_dep,
        'independent_pct': round(total_ind / max(total, 1) * 100, 1),
    }}


def f42_claim_count_trend(patents) -> Dict:
    yearly = defaultdict(list)
    for p in patents:
        if p.filing_date and p.claims_count and p.claims_count > 0:
            yearly[p.filing_date.year].append(p.claims_count)
    return {'claim_count_trend': [
        {'year': y, 'avg_claims': round(sum(v) / len(v), 1), 'patent_count': len(v)}
        for y, v in sorted(yearly.items())
    ]}


def f44_claims_by_cpc(patents) -> Dict:
    cpc_claims = defaultdict(list)
    for p in patents:
        if not p.claims_count: continue
        for field in [p.ipc_classification, p.cpc_classification]:
            if not field: continue
            for code in field.split(';'):
                code = code.strip()
                if len(code) >= 4:
                    cpc_claims[code[:4]].append(p.claims_count)
                    break
    return {'claims_by_cpc': [
        {'cpc': c, 'avg_claims': round(sum(v) / len(v), 1), 'patent_count': len(v)}
        for c, v in sorted(cpc_claims.items(), key=lambda x: -len(x[1]))[:15]
    ]}


# ═══════════════════════════════════════════════════════════════
# CATEGORY G: GEOGRAPHIC / JURISDICTION ANALYTICS
# ═══════════════════════════════════════════════════════════════

def g45_geographic_distribution(patents) -> Dict:
    counter = Counter()
    for p in patents:
        counter[(p.country_code or 'Unknown').upper()] += 1
    return {'geographic_distribution': dict(counter.most_common(20))}


def g46_geographic_trend(patents) -> Dict:
    yearly_geo = defaultdict(Counter)
    for p in patents:
        if p.filing_date:
            yearly_geo[p.filing_date.year][(p.country_code or 'XX').upper()] += 1
    total_geo = Counter()
    for p in patents: total_geo[(p.country_code or 'XX').upper()] += 1
    top5 = [c for c, _ in total_geo.most_common(5)]
    trend = []
    for year in sorted(yearly_geo.keys()):
        row = {'year': year}
        for cc in top5: row[cc] = yearly_geo[year].get(cc, 0)
        trend.append(row)
    return {'geographic_trend': trend, 'top_jurisdictions': top5}


def g47_geographic_concentration(patents) -> Dict:
    counter = Counter()
    for p in patents: counter[(p.country_code or 'XX').upper()] += 1
    total = sum(counter.values())
    if total == 0: return {'geographic_concentration': {'hhi': 0}}
    hhi = sum((c / total) ** 2 for c in counter.values()) * 10000
    top1 = counter.most_common(1)[0] if counter else ('', 0)
    return {'geographic_concentration': {
        'hhi': round(hhi, 1), 'top_country': top1[0],
        'top_country_pct': round(top1[1] / total * 100, 1),
        'unique_jurisdictions': len(counter),
        'interpretation': 'highly_concentrated' if hhi > 5000 else 'concentrated' if hhi > 2500 else 'diversified',
    }}


def g48_pct_vs_direct(patents) -> Dict:
    pct = sum(1 for p in patents if (p.raw_data or {}).get('applicationMetaData', {}).get('nationalStageIndicator', False))
    direct = len(patents) - pct
    return {'pct_vs_direct': {'pct_national_phase': pct, 'direct_filing': direct, 'pct_pct': round(pct / max(len(patents), 1) * 100, 1)}}


def g49_jurisdiction_assignee_heatmap(patents) -> Dict:
    ac, gc = Counter(), Counter()
    for p in patents:
        ac[(p.parent_assignee or p.assignee or '').strip()] += 1
        gc[(p.country_code or '').upper()] += 1
    top_a = [a for a, _ in ac.most_common(8)]
    top_g = [g for g, _ in gc.most_common(8)]
    matrix = defaultdict(lambda: defaultdict(int))
    for p in patents:
        a = (p.parent_assignee or p.assignee or '').strip()
        g = (p.country_code or '').upper()
        if a in top_a and g in top_g: matrix[a][g] += 1
    rows = [dict(assignee=a, **{g: matrix[a][g] for g in top_g}) for a in top_a]
    return {'jurisdiction_assignee_heatmap': rows, 'heatmap_jurisdictions': top_g}


# ═══════════════════════════════════════════════════════════════
# CATEGORY H: LEGAL STATUS ANALYTICS
# ═══════════════════════════════════════════════════════════════

def h50_status_distribution(patents) -> Dict:
    counter = Counter()
    for p in patents:
        s = (p.legal_status or 'unknown').lower()
        if s in ('active', 'granted', 'patented'): counter['active'] += 1
        elif s in ('pending', 'filed'): counter['pending'] += 1
        elif s in ('expired', 'lapsed'): counter['expired'] += 1
        elif s in ('abandoned', 'withdrawn'): counter['abandoned'] += 1
        else: counter['other'] += 1
    total = sum(counter.values())
    return {'status_distribution': [{'status': s, 'count': c, 'pct': round(c / max(total, 1) * 100, 1)} for s, c in counter.most_common()]}


def h51_abandonment_rate(patents) -> Dict:
    abandoned = sum(1 for p in patents if (p.legal_status or '').lower() in ('abandoned', 'withdrawn'))
    return {'abandonment_rate': {'total': len(patents), 'abandoned': abandoned, 'rate_pct': round(abandoned / max(len(patents), 1) * 100, 1)}}


def h52_expiry_cliff(patents) -> Dict:
    current_year = datetime.now().year
    ec = Counter()
    for p in patents:
        if p.expiry_date: ec[p.expiry_date.year] += 1
        elif p.grant_date: ec[p.grant_date.year + 20] += 1
        elif p.filing_date and (p.legal_status or '').lower() in ('active', 'granted'): ec[p.filing_date.year + 20] += 1
    total_active = sum(1 for p in patents if (p.legal_status or '').lower() in ('active', 'granted'))
    cum = 0
    timeline = []
    for year in sorted(ec.keys()):
        if year < current_year: continue
        cum += ec[year]
        timeline.append({'year': year, 'expiring': ec[year], 'cumulative': cum, 'cumulative_pct': round(cum / max(total_active, 1) * 100, 1)})
    return {'expiry_cliff': timeline[:20]}


# ═══════════════════════════════════════════════════════════════
# CATEGORY I: PATENT FAMILY ANALYTICS
# ═══════════════════════════════════════════════════════════════

def i55_family_size(patents) -> Dict:
    sizes = []
    for p in patents:
        families = (p.raw_data or {}).get('families', {})
        size = families.get('simple_family', {}).get('size', 0)
        if size > 0: sizes.append(size)
    if not sizes: return {'family_stats': {'avg_size': 0, 'data_available': False}}
    sizes.sort()
    return {'family_stats': {
        'avg_size': round(sum(sizes) / len(sizes), 1), 'median_size': sizes[len(sizes) // 2],
        'max_size': max(sizes), 'total_with_family': len(sizes), 'data_available': True,
    }}


# ═══════════════════════════════════════════════════════════════
# CATEGORY J: QUALITY & IMPACT METRICS
# ═══════════════════════════════════════════════════════════════

def j59_quality_index(patents) -> Dict:
    current_year = datetime.now().year
    scored = []
    for p in patents:
        score = 0
        fwd = p.forward_citations or 0
        age = max(current_year - (p.filing_date.year if p.filing_date else current_year), 1)
        score += min(fwd / max(age, 1) * 10, 30)
        score += min((p.claims_count or 0) / 2, 25)
        score += 20 if (p.legal_status or '').lower() in ('active', 'granted') else 10 if (p.legal_status or '').lower() == 'pending' else 0
        score += 15 if (p.country_code or '').upper() in ('US', 'EP') else 12 if (p.country_code or '').upper() in ('CN', 'JP', 'KR') else 8
        score += max(0, 10 - age) if age < 10 else 0
        scored.append({'patent_id': p.patent_id, 'title': (p.title or '')[:60], 'quality_score': round(score, 1)})
    scored.sort(key=lambda x: -x['quality_score'])
    all_scores = [s['quality_score'] for s in scored]
    return {'quality_index': {
        'avg_score': round(sum(all_scores) / max(len(all_scores), 1), 1),
        'top_quality_patents': scored[:15],
        'score_distribution': {
            'excellent_80plus': sum(1 for s in all_scores if s >= 80),
            'good_60_80': sum(1 for s in all_scores if 60 <= s < 80),
            'average_40_60': sum(1 for s in all_scores if 40 <= s < 60),
            'below_40': sum(1 for s in all_scores if s < 40),
        },
    }}


def j61_breakthrough_detection(patents) -> Dict:
    current_year = datetime.now().year
    avg_cit = sum(p.forward_citations or 0 for p in patents) / max(len(patents), 1)
    threshold = max(avg_cit * 3, 5)
    bk = []
    for p in patents:
        fwd = p.forward_citations or 0
        if fwd < threshold: continue
        age = current_year - (p.filing_date.year if p.filing_date else current_year)
        if age > 15: continue
        bk.append({'patent_id': p.patent_id, 'title': (p.title or '')[:80], 'assignee': p.assignee or '', 'forward_citations': fwd, 'citation_multiple': round(fwd / max(avg_cit, 1), 1)})
    bk.sort(key=lambda x: -x['forward_citations'])
    return {'breakthrough_patents': bk[:10], 'avg_citations': round(avg_cit, 1), 'breakthrough_threshold': round(threshold, 1)}


# ═══════════════════════════════════════════════════════════════
# CATEGORY K: COMPETITIVE INTELLIGENCE
# ═══════════════════════════════════════════════════════════════

def k64_technology_overlap(patents) -> Dict:
    assignee_cpcs = defaultdict(set)
    ac = Counter()
    for p in patents:
        a = (p.parent_assignee or p.assignee or '').strip()
        if not a: continue
        ac[a] += 1
        for field in [p.ipc_classification, p.cpc_classification]:
            if not field: continue
            for code in field.split(';'):
                code = code.strip()
                if len(code) >= 4: assignee_cpcs[a].add(code[:4])
    top = [a for a, _ in ac.most_common(8)]
    overlaps = []
    for i in range(len(top)):
        for j in range(i + 1, len(top)):
            shared = assignee_cpcs[top[i]] & assignee_cpcs[top[j]]
            if shared:
                total = len(assignee_cpcs[top[i]] | assignee_cpcs[top[j]])
                overlaps.append({'entity_a': top[i], 'entity_b': top[j], 'shared_cpcs': sorted(shared), 'shared_count': len(shared), 'jaccard_similarity': round(len(shared) / max(total, 1), 3)})
    overlaps.sort(key=lambda x: -x['jaccard_similarity'])
    return {'technology_overlap': overlaps}


def k66_first_mover(patents) -> Dict:
    cpc_first = {}
    for p in patents:
        if not p.filing_date: continue
        a = (p.parent_assignee or p.assignee or '').strip()
        if not a: continue
        for field in [p.ipc_classification, p.cpc_classification]:
            if not field: continue
            for code in field.split(';'):
                code = code.strip()
                if len(code) >= 4:
                    sc = code[:4]
                    if sc not in cpc_first or p.filing_date.year < cpc_first[sc][1]:
                        cpc_first[sc] = (a, p.filing_date.year, p.patent_id)
    return {'first_movers': [{'cpc': c, 'first_filer': d[0], 'first_year': d[1]} for c, d in sorted(cpc_first.items(), key=lambda x: x[1][1])][:20]}


def k67_blocking_patents(patents) -> Dict:
    _, cpc_counter = _extract_cpc_codes(patents)
    crowded = {c for c, n in cpc_counter.items() if n >= 10}
    avg_cit = sum(p.forward_citations or 0 for p in patents) / max(len(patents), 1)
    blockers = []
    for p in patents:
        fwd = p.forward_citations or 0
        if fwd < avg_cit * 2: continue
        if (p.legal_status or '').lower() not in ('active', 'granted'): continue
        in_crowded = any(code.strip()[:4] in crowded for field in [p.ipc_classification, p.cpc_classification] if field for code in field.split(';'))
        if not in_crowded: continue
        broad = p.independent_claims_count and p.independent_claims_count <= 3
        blockers.append({'patent_id': p.patent_id, 'title': (p.title or '')[:60], 'assignee': p.assignee or '', 'forward_citations': fwd, 'blocking_score': round(fwd * (3 if broad else 1) / max(avg_cit, 1), 1)})
    blockers.sort(key=lambda x: -x['blocking_score'])
    return {'blocking_patents': blockers[:15]}


# ═══════════════════════════════════════════════════════════════
# MISSING ANALYSES — filling the 15 gaps
# ═══════════════════════════════════════════════════════════════

def a5_filing_forecast(patents) -> Dict:
    """A5: 6-month linear forecast with confidence intervals."""
    monthly = Counter()
    for p in patents:
        if p.filing_date:
            monthly[f"{p.filing_date.year}-{p.filing_date.month:02d}"] += 1

    sorted_months = sorted(monthly.items())
    if len(sorted_months) < 6:
        return {'filing_forecast': []}

    recent = sorted_months[-6:]
    counts = [c for _, c in recent]
    n = len(counts)
    x_mean = (n - 1) / 2
    y_mean = sum(counts) / n

    num = sum((i - x_mean) * (counts[i] - y_mean) for i in range(n))
    den = sum((i - x_mean) ** 2 for i in range(n))
    slope = num / den if den != 0 else 0
    intercept = y_mean - slope * x_mean

    residuals = [counts[i] - (slope * i + intercept) for i in range(n)]
    std_err = (sum(r ** 2 for r in residuals) / max(n - 2, 1)) ** 0.5

    # Parse last month to project forward
    last_month = sorted_months[-1][0]
    year, month = int(last_month[:4]), int(last_month[5:])

    forecast = []
    for i in range(1, 7):
        month += 1
        if month > 12:
            month = 1
            year += 1
        predicted = max(0, round(slope * (n - 1 + i) + intercept))
        forecast.append({
            'month': f"{year}-{month:02d}",
            'predicted': predicted,
            'lower_bound': max(0, round(predicted - 1.96 * std_err)),
            'upper_bound': round(predicted + 1.96 * std_err),
        })

    return {'filing_forecast': forecast}


def a7_priority_filing_gap(patents) -> Dict:
    """A7: Gap between priority date and filing date."""
    gaps = []
    for p in patents:
        fd = p.filing_date
        # Priority date from raw_data
        raw = p.raw_data or {}
        meta = raw.get('applicationMetaData', {})
        priority_str = meta.get('effectiveFilingDate', '') or ''
        if not priority_str or not fd:
            continue
        try:
            from datetime import date as dt_date
            pd = dt_date.fromisoformat(priority_str[:10])
            delta = (fd - pd).days
            if 0 < delta < 5000:
                gaps.append(delta)
        except (ValueError, TypeError):
            continue

    if not gaps:
        return {'priority_filing_gap': {'avg_days': 0, 'total_with_priority': 0}}

    gaps.sort()
    return {'priority_filing_gap': {
        'avg_days': round(sum(gaps) / len(gaps)),
        'median_days': gaps[len(gaps) // 2],
        'total_with_priority': len(gaps),
        'pct_with_priority': round(len(gaps) / len([p for p in patents if p.filing_date]) * 100, 1) if patents else 0,
    }}


def b12_new_entrants(patents) -> Dict:
    """B12: Assignees with first filing in last 5 years."""
    current_year = datetime.now().year
    threshold = current_year - 5
    assignee_first = {}
    assignee_recent = Counter()

    for p in patents:
        if not p.filing_date:
            continue
        a = (p.parent_assignee or p.assignee or '').strip()
        if not a:
            continue
        year = p.filing_date.year
        if a not in assignee_first or year < assignee_first[a]:
            assignee_first[a] = year
        if year >= threshold:
            assignee_recent[a] += 1

    entrants = []
    for a, first_year in assignee_first.items():
        if first_year >= threshold:
            entrants.append({
                'assignee': a,
                'first_filing_year': first_year,
                'recent_filings': assignee_recent.get(a, 0),
            })
    entrants.sort(key=lambda x: -x['recent_filings'])

    return {'new_entrants': entrants[:20], 'new_entrant_count': len(entrants)}


def c22_inventor_collaboration_clusters(patents) -> Dict:
    """C22: Groups of inventors who frequently co-file."""
    co_inventor_pairs = Counter()

    for p in patents:
        inventors = [i.strip() for i in (p.inventor or '').split(',') if i.strip() and len(i.strip()) > 2]
        if len(inventors) < 2:
            continue
        inventors_sorted = sorted(inventors)
        for i in range(len(inventors_sorted)):
            for j in range(i + 1, len(inventors_sorted)):
                co_inventor_pairs[(inventors_sorted[i], inventors_sorted[j])] += 1

    clusters = [
        {'inventor_a': a, 'inventor_b': b, 'co_filings': c}
        for (a, b), c in co_inventor_pairs.most_common(20)
        if c >= 2
    ]

    return {'inventor_collaboration_clusters': clusters}


def d26_technology_velocity(patents) -> Dict:
    """D26: Filing growth rate per CPC subclass (2-year vs prior 3-year)."""
    current_year = datetime.now().year
    cpc_recent = Counter()
    cpc_prior = Counter()

    for p in patents:
        if not p.filing_date:
            continue
        year = p.filing_date.year
        for field in [p.ipc_classification, p.cpc_classification]:
            if not field:
                continue
            for code in field.split(';'):
                code = code.strip()
                if len(code) >= 4:
                    sc = code[:4]
                    if year >= current_year - 2:
                        cpc_recent[sc] += 1
                    elif year >= current_year - 5:
                        cpc_prior[sc] += 1

    all_codes = set(list(cpc_recent.keys()) + list(cpc_prior.keys()))
    velocity = []
    for code in all_codes:
        recent = cpc_recent.get(code, 0)
        prior = cpc_prior.get(code, 0)
        growth = round((recent - prior) / max(prior, 1) * 100, 1)
        velocity.append({
            'code': code,
            'recent_2yr': recent,
            'prior_3yr': prior,
            'growth_pct': growth,
            'velocity': 'emerging' if growth > 30 else 'growing' if growth > 0 else 'declining' if growth < -20 else 'stable',
        })
    velocity.sort(key=lambda x: -x['growth_pct'])

    return {'technology_velocity': velocity[:20]}


def d31_technology_maturity(patents) -> Dict:
    """D31: S-curve maturity stage per CPC subclass."""
    cpc_yearly = defaultdict(Counter)

    for p in patents:
        if not p.filing_date:
            continue
        for field in [p.ipc_classification, p.cpc_classification]:
            if not field:
                continue
            for code in field.split(';'):
                code = code.strip()
                if len(code) >= 4:
                    cpc_yearly[code[:4]][p.filing_date.year] += 1

    # Top 15 by total count
    totals = {code: sum(yc.values()) for code, yc in cpc_yearly.items()}
    top_codes = sorted(totals, key=lambda x: -totals[x])[:15]

    results = []
    for code in top_codes:
        yearly = cpc_yearly[code]
        years = sorted(yearly.keys())
        if len(years) < 3:
            results.append({'code': code, 'maturity': 'emerging', 'total': totals[code]})
            continue

        counts = [yearly[y] for y in years]
        peak = max(counts)
        recent = counts[-1] if counts else 0

        if len(years) <= 3:
            stage = 'emerging'
        elif recent >= peak * 0.9:
            stage = 'growing'
        elif recent >= peak * 0.5:
            stage = 'mature'
        else:
            stage = 'declining'

        results.append({'code': code, 'maturity': stage, 'total': totals[code], 'peak_year': years[counts.index(peak)]})

    return {'technology_maturity': results}


def e34_citation_network(patents) -> Dict:
    """E34: Citation network edges from raw ODP data."""
    edges = []
    for p in patents[:500]:
        raw = p.raw_data or {}
        cited_refs = raw.get('applicationMetaData', {}).get('referenceCitedBag', []) or raw.get('referenceCitedBag', []) or []
        for ref in (cited_refs or [])[:10]:
            cited_id = ''
            if isinstance(ref, dict):
                cited_id = ref.get('patentNumber', '') or ref.get('documentNumber', '')
            elif isinstance(ref, str):
                cited_id = ref
            if cited_id:
                edges.append({'source': p.patent_id, 'target': cited_id})

    return {'citation_network': {'nodes': len(patents), 'edges': len(edges), 'edge_list': edges[:1000]}}


def e37_backward_citation_age(patents) -> Dict:
    """E37: How far back do patents cite? Age distribution of backward citations."""
    ages = []

    for p in patents[:500]:
        if not p.filing_date:
            continue
        raw = p.raw_data or {}
        cited_refs = raw.get('applicationMetaData', {}).get('referenceCitedBag', []) or raw.get('referenceCitedBag', []) or []
        for ref in cited_refs:
            if not isinstance(ref, dict):
                continue
            cited_date = ref.get('publicationDate', '') or ref.get('date', '')
            if cited_date and len(cited_date) >= 4:
                try:
                    cited_year = int(cited_date[:4])
                    age = p.filing_date.year - cited_year
                    if 0 <= age <= 100:
                        ages.append(age)
                except (ValueError, TypeError):
                    continue

    if not ages:
        return {'backward_citation_age': {'avg_years': 0, 'total_analyzed': 0}}

    ages.sort()
    buckets = {'0-5yr': 0, '6-10yr': 0, '11-20yr': 0, '21-30yr': 0, '>30yr': 0}
    for a in ages:
        if a <= 5: buckets['0-5yr'] += 1
        elif a <= 10: buckets['6-10yr'] += 1
        elif a <= 20: buckets['11-20yr'] += 1
        elif a <= 30: buckets['21-30yr'] += 1
        else: buckets['>30yr'] += 1

    return {'backward_citation_age': {
        'avg_years': round(sum(ages) / len(ages), 1),
        'median_years': ages[len(ages) // 2],
        'total_analyzed': len(ages),
        'distribution': [{'bucket': k, 'count': v} for k, v in buckets.items()],
    }}


def e39_examiner_vs_applicant_citations(patents) -> Dict:
    """E39: Who added the citation — examiner or applicant?"""
    examiner = 0
    applicant = 0
    unknown = 0

    for p in patents[:500]:
        raw = p.raw_data or {}
        cited_refs = raw.get('applicationMetaData', {}).get('referenceCitedBag', []) or raw.get('referenceCitedBag', []) or []
        for ref in cited_refs:
            if not isinstance(ref, dict):
                continue
            phase = (ref.get('citedPhase', '') or ref.get('cited_phase', '') or '').upper()
            if phase in ('EXA', 'SEA', 'ISR'):
                examiner += 1
            elif phase in ('APP', 'IDS'):
                applicant += 1
            else:
                unknown += 1

    total = examiner + applicant + unknown
    return {'examiner_vs_applicant_citations': {
        'examiner': examiner,
        'applicant': applicant,
        'unknown': unknown,
        'examiner_pct': round(examiner / max(total, 1) * 100, 1),
        'applicant_pct': round(applicant / max(total, 1) * 100, 1),
    }}


def f43_claims_breadth_by_assignee(patents) -> Dict:
    """F43: Which assignees file broader claims (fewer independent = broader)?"""
    assignee_claims = defaultdict(list)

    for p in patents:
        a = (p.parent_assignee or p.assignee or '').strip()
        if not a or not p.claims_count:
            continue
        ind = p.independent_claims_count or 0
        assignee_claims[a].append({
            'total': p.claims_count,
            'independent': ind,
            'ratio': ind / max(p.claims_count, 1),
        })

    results = []
    for a, claims in sorted(assignee_claims.items(), key=lambda x: -len(x[1]))[:10]:
        avg_total = round(sum(c['total'] for c in claims) / len(claims), 1)
        avg_ind = round(sum(c['independent'] for c in claims) / len(claims), 1)
        avg_ratio = round(sum(c['ratio'] for c in claims) / len(claims), 3)
        results.append({
            'assignee': a,
            'patent_count': len(claims),
            'avg_total_claims': avg_total,
            'avg_independent_claims': avg_ind,
            'independence_ratio': avg_ratio,
            'breadth': 'broad' if avg_ratio < 0.2 else 'moderate' if avg_ratio < 0.4 else 'narrow',
        })

    return {'claims_breadth_by_assignee': results}


def h53_maintenance_patterns(patents) -> Dict:
    """H53: Maintenance fee payment patterns from ODP transaction data."""
    maintenance_events = Counter()

    for p in patents:
        raw = p.raw_data or {}
        events = raw.get('eventDataBag', []) or []
        for event in events:
            if not isinstance(event, dict):
                continue
            code = (event.get('eventCode', '') or '').upper()
            desc = (event.get('eventDescriptionText', '') or '').lower()
            if 'maintenance' in desc or 'M1551' in code or 'M2551' in code or 'M3551' in code or 'MAINT' in code:
                if '3.5' in desc or 'M1551' in code:
                    maintenance_events['3.5_year'] += 1
                elif '7.5' in desc or 'M2551' in code:
                    maintenance_events['7.5_year'] += 1
                elif '11.5' in desc or 'M3551' in code:
                    maintenance_events['11.5_year'] += 1
                else:
                    maintenance_events['other'] += 1

    total_granted = sum(1 for p in patents if (p.legal_status or '').lower() in ('active', 'granted'))
    return {'maintenance_patterns': {
        'payments': dict(maintenance_events),
        'total_granted': total_granted,
        'maintenance_rate': round(sum(maintenance_events.values()) / max(total_granted, 1) * 100, 1) if total_granted else 0,
    }}


def h54_revival_rate(patents) -> Dict:
    """H54: How many abandoned patents were revived?"""
    revived = 0
    for p in patents:
        raw = p.raw_data or {}
        events = raw.get('eventDataBag', []) or []
        for event in events:
            if not isinstance(event, dict):
                continue
            desc = (event.get('eventDescriptionText', '') or '').lower()
            code = (event.get('eventCode', '') or '').upper()
            if 'reviv' in desc or 'PETG' in code or 'petition granted' in desc:
                revived += 1
                break

    abandoned = sum(1 for p in patents if (p.legal_status or '').lower() in ('abandoned', 'withdrawn'))
    return {'revival_rate': {
        'revived': revived,
        'abandoned': abandoned,
        'revival_pct': round(revived / max(abandoned, 1) * 100, 1) if abandoned else 0,
    }}


def i57_geographic_family_coverage(patents) -> Dict:
    """I57: Which families cover the most jurisdictions?"""
    family_jurisdictions = defaultdict(set)

    for p in patents:
        raw = p.raw_data or {}
        families = raw.get('families', {})
        simple = families.get('simple_family', {})
        members = simple.get('members', [])
        if not members:
            continue
        # Use first member's lens_id as family key
        family_key = members[0].get('lens_id', '') or p.patent_id
        for member in members:
            doc_id = member.get('document_id', {})
            jur = doc_id.get('jurisdiction', '')
            if jur:
                family_jurisdictions[family_key].add(jur)

    if not family_jurisdictions:
        return {'geographic_family_coverage': {'avg_jurisdictions': 0, 'data_available': False}}

    sizes = [len(j) for j in family_jurisdictions.values()]
    sizes.sort(reverse=True)

    return {'geographic_family_coverage': {
        'avg_jurisdictions': round(sum(sizes) / len(sizes), 1),
        'max_jurisdictions': sizes[0] if sizes else 0,
        'families_analyzed': len(family_jurisdictions),
        'distribution': {
            '1_jurisdiction': sum(1 for s in sizes if s == 1),
            '2-3_jurisdictions': sum(1 for s in sizes if 2 <= s <= 3),
            '4-6_jurisdictions': sum(1 for s in sizes if 4 <= s <= 6),
            '7plus_jurisdictions': sum(1 for s in sizes if s >= 7),
        },
        'data_available': True,
    }}


def i58_family_filing_strategy(patents) -> Dict:
    """I58: PCT-first vs direct filing patterns per family."""
    pct_first = 0
    direct_first = 0

    for p in patents:
        raw = p.raw_data or {}
        families = raw.get('families', {})
        members = families.get('simple_family', {}).get('members', [])
        if not members:
            continue
        # Check if earliest member is WO (PCT)
        earliest = None
        for m in members:
            doc_id = m.get('document_id', {})
            date = doc_id.get('date', '')
            if date and (earliest is None or date < earliest[0]):
                earliest = (date, doc_id.get('jurisdiction', ''))
        if earliest:
            if earliest[1] == 'WO':
                pct_first += 1
            else:
                direct_first += 1

    total = pct_first + direct_first
    return {'family_filing_strategy': {
        'pct_first': pct_first,
        'direct_first': direct_first,
        'pct_first_pct': round(pct_first / max(total, 1) * 100, 1),
        'total_families_analyzed': total,
    }}


def j60_innovation_intensity(patents) -> Dict:
    """J60: Patents per year per assignee (innovation rate)."""
    current_year = datetime.now().year
    assignee_yearly = defaultdict(lambda: Counter())
    assignee_total = Counter()

    for p in patents:
        a = (p.parent_assignee or p.assignee or '').strip()
        if not a or not p.filing_date:
            continue
        assignee_yearly[a][p.filing_date.year] += 1
        assignee_total[a] += 1

    results = []
    for a, _ in assignee_total.most_common(10):
        yearly = assignee_yearly[a]
        years_active = max(len(yearly), 1)
        avg_per_year = round(assignee_total[a] / years_active, 1)
        recent_3yr = sum(yearly[y] for y in range(current_year - 2, current_year + 1))
        results.append({
            'assignee': a,
            'total_patents': assignee_total[a],
            'years_active': years_active,
            'avg_per_year': avg_per_year,
            'recent_3yr': recent_3yr,
            'intensity': 'high' if avg_per_year > 50 else 'moderate' if avg_per_year > 10 else 'low',
        })

    return {'innovation_intensity': results}


def j62_incremental_vs_pioneering(patents) -> Dict:
    """J62: Based on backward citation count — few back-refs = more pioneering."""
    pioneering = 0
    incremental = 0

    for p in patents:
        bwd = p.backward_citations or 0
        if bwd == 0:
            continue
        if bwd <= 3:
            pioneering += 1
        else:
            incremental += 1

    total = pioneering + incremental
    return {'incremental_vs_pioneering': {
        'pioneering': pioneering,
        'incremental': incremental,
        'pioneering_pct': round(pioneering / max(total, 1) * 100, 1),
        'total_with_citations': total,
        'interpretation': 'mostly_pioneering' if pioneering > incremental else 'mostly_incremental',
    }}
