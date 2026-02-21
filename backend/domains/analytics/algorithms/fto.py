"""
Freedom-to-Operate Analysis Algorithms
Risk scoring, claim-by-claim analysis, coverage mapping
"""
from typing import Dict, Any, List
from collections import defaultdict


def run_fto_analysis(project_id: str, target_description: str = '') -> Dict[str, Any]:
    """
    Run Freedom-to-Operate analysis for a project.
    Analyzes patents for potential infringement risks.
    """
    from ..models import AnalyticsProject, PatentRecord, PatentDataset

    try:
        project = AnalyticsProject.objects.get(id=project_id)
    except AnalyticsProject.DoesNotExist:
        return {'error': 'Project not found'}

    datasets = PatentDataset.objects.filter(project=project)
    patents = PatentRecord.objects.filter(dataset__in=datasets)

    patent_assessments = []
    risk_summary = {'high': 0, 'medium': 0, 'low': 0, 'none': 0}

    for patent in patents[:200]:  # Limit for performance
        # Analyze claims structure
        claims = patent.claims_structure if patent.claims_structure else []
        independent_claims = [c for c in claims if c.get('type') == 'independent']
        dependent_claims = [c for c in claims if c.get('type') == 'dependent']

        # Calculate risk score based on available data
        risk_score = _calculate_patent_risk_score(patent, target_description)
        risk_level = _risk_level_from_score(risk_score)
        risk_summary[risk_level] += 1

        # Claim coverage analysis
        claim_analysis = []
        for claim in independent_claims[:10]:
            coverage = _analyze_claim_coverage(claim, target_description)
            claim_analysis.append({
                'claim_number': claim.get('number', '?'),
                'text': claim.get('text', '')[:200],
                'coverage_score': coverage,
                'risk_level': _risk_level_from_score(coverage),
            })

        patent_assessments.append({
            'patent_id': patent.patent_id,
            'title': patent.title,
            'assignee': patent.assignee,
            'filing_date': str(patent.filing_date) if patent.filing_date else None,
            'risk_score': risk_score,
            'risk_level': risk_level,
            'independent_claims_count': len(independent_claims),
            'dependent_claims_count': len(dependent_claims),
            'claim_analysis': claim_analysis,
            'country_code': patent.country_code,
            'legal_status': patent.legal_status,
        })

    # Sort by risk score
    patent_assessments.sort(key=lambda x: x['risk_score'], reverse=True)

    # Overall risk
    total = sum(risk_summary.values())
    overall_risk_score = (
        (risk_summary['high'] * 100 + risk_summary['medium'] * 50 + risk_summary['low'] * 20)
        / max(total, 1)
    )

    return {
        'project_id': str(project.id),
        'total_patents_analyzed': len(patent_assessments),
        'target_description': target_description,
        'overall_risk_score': round(overall_risk_score, 1),
        'overall_risk_level': _risk_level_from_score(overall_risk_score),
        'risk_summary': risk_summary,
        'patent_assessments': patent_assessments,
        'recommendations': _generate_fto_recommendations(risk_summary, overall_risk_score),
    }


def _calculate_patent_risk_score(patent, target_description: str) -> float:
    """Calculate risk score for a patent (0-100)"""
    score = 0.0
    # Active patents are higher risk
    if patent.legal_status and 'active' in patent.legal_status.lower():
        score += 30
    elif patent.legal_status and 'expired' in patent.legal_status.lower():
        return 5.0  # Expired patents are very low risk

    # More claims = potentially broader coverage
    claims_count = patent.claims_count or 0
    if claims_count > 20:
        score += 25
    elif claims_count > 10:
        score += 15
    elif claims_count > 0:
        score += 10

    # Forward citations indicate patent importance
    citations = patent.forward_citations or 0
    if citations > 50:
        score += 25
    elif citations > 20:
        score += 15
    elif citations > 5:
        score += 10

    # Keyword overlap with target
    if target_description:
        target_words = set(target_description.lower().split())
        title_words = set((patent.title or '').lower().split())
        abstract_words = set((patent.abstract or '').lower().split())
        all_patent_words = title_words | abstract_words
        overlap = len(target_words & all_patent_words) / max(len(target_words), 1)
        score += overlap * 20

    return min(round(score, 1), 100)


def _risk_level_from_score(score: float) -> str:
    if score >= 70:
        return 'high'
    if score >= 40:
        return 'medium'
    if score >= 10:
        return 'low'
    return 'none'


def _analyze_claim_coverage(claim: dict, target: str) -> float:
    """Analyze how much a claim covers the target description"""
    if not target or not claim.get('text'):
        return 25.0
    claim_words = set(claim['text'].lower().split())
    target_words = set(target.lower().split())
    overlap = len(claim_words & target_words)
    return min(round(overlap / max(len(target_words), 1) * 100, 1), 100)


def _generate_fto_recommendations(risk_summary: dict, overall_score: float) -> List[str]:
    recommendations = []
    if overall_score >= 70:
        recommendations.append('High overall risk detected. Consider design-around strategies for high-risk patents.')
        recommendations.append('Engage patent counsel for detailed claim-by-claim analysis.')
    elif overall_score >= 40:
        recommendations.append('Moderate risk level. Review medium and high risk patents carefully.')
        recommendations.append('Consider filing continuation patents to strengthen your position.')
    else:
        recommendations.append('Low overall risk. Monitor identified patents for status changes.')

    if risk_summary['high'] > 0:
        recommendations.append(f'{risk_summary["high"]} high-risk patents identified — prioritize detailed review.')

    return recommendations
