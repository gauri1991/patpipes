"""
AI-Powered Analysis Services for Infringement Module
Provides intelligent features for claim parsing, evidence scoring, and risk analysis.

LLM gating
----------
Every method works heuristically by default (no external calls). Passing
``use_llm=True`` opts a single call into the real provider via the shared
``analytics.narrative_service`` path + ``LLMProviderConfig``. If no provider is
configured, the key is missing, or the call/parse fails, we silently fall back to
the heuristic result — so enabling AI never breaks the feature, and leaving it off
(the default) never spends tokens.
"""

import json
import logging
import re
from typing import Optional

from django.conf import settings

logger = logging.getLogger(__name__)


def _llm_enabled() -> bool:
    """Master kill-switch. Live LLM calls are OFF until INFRINGEMENT_AI_LLM_ENABLED is set.

    Even when a request passes use_llm=True, this must also be True for any provider
    call to happen — so the feature ships fully wired but dormant until explicitly turned on.
    """
    return bool(getattr(settings, 'INFRINGEMENT_AI_LLM_ENABLED', False))


def _llm_json(prompt: str, system_text: str = '') -> Optional[dict]:
    """Gated LLM call that returns parsed JSON, or None on any failure / no config.

    Only reached when a caller explicitly passes use_llm=True AND the master switch
    (_llm_enabled) is on. Reuses the proven Anthropic/OpenAI call path from
    analytics.narrative_service.
    """
    if not _llm_enabled():
        return None
    try:
        from domains.analytics.models import LLMProviderConfig
        config = LLMProviderConfig.objects.filter(is_active=True).first()
        if not config:
            return None

        from django.core.signing import Signer
        try:
            api_key = Signer().unsign(config.api_key)
        except Exception:
            api_key = config.api_key
        if not api_key:
            return None

        from domains.analytics.narrative_service import _call_anthropic, _call_openai
        model = config.resolved_model
        if config.provider == 'anthropic':
            raw = _call_anthropic(api_key, prompt, system_text=system_text, model=model)
        elif config.provider == 'openai':
            raw = _call_openai(api_key, prompt, system_text=system_text, model=model)
        else:
            return None
        return _extract_json(raw)
    except Exception as e:
        logger.warning('Infringement LLM call failed, falling back to heuristic: %s', e)
        return None


def _extract_json(raw: Optional[str]):
    """Best-effort parse of a JSON object/array from an LLM response (handles code fences)."""
    if not raw:
        return None
    s = raw.strip()
    # strip ```json ... ``` fences
    fence = re.search(r'```(?:json)?\s*(.*?)\s*```', s, re.DOTALL)
    if fence:
        s = fence.group(1).strip()
    try:
        return json.loads(s)
    except Exception:
        # fall back to the outermost {...} or [...] span
        for open_ch, close_ch in (('{', '}'), ('[', ']')):
            start, end = s.find(open_ch), s.rfind(close_ch)
            if 0 <= start < end:
                try:
                    return json.loads(s[start:end + 1])
                except Exception:
                    continue
    return None


class InfringementAIService:
    """AI-powered analysis features for infringement module"""

    def __init__(self):
        self.llm_client = None  # Will be initialized with actual LLM client

    def parse_claim_elements(self, claim_text: str, use_llm: bool = False) -> list[dict]:
        """
        Parse patent claim text into structured elements.
        Uses LLM (when use_llm=True) to identify preamble, transitions, and body
        elements; otherwise heuristics.

        Returns: [{element_order, element_text, element_type}]
        """
        if use_llm:
            prompt = (
                "Split this patent claim into its individual limitations/elements. "
                "Return ONLY a JSON array of objects with keys "
                "element_order (int, 1-based), element_text (string), and "
                "element_type (one of 'preamble','body','transition'). "
                f"Claim:\n{claim_text}"
            )
            data = _llm_json(prompt)
            if isinstance(data, list) and data:
                out = []
                for i, el in enumerate(data, start=1):
                    if not isinstance(el, dict):
                        continue
                    et = el.get('element_type', 'body')
                    out.append({
                        'element_order': el.get('element_order', i),
                        'element_text': (el.get('element_text') or '').strip(),
                        'element_type': et if et in ('preamble', 'body', 'transition') else 'body',
                    })
                if out:
                    return out
            # fall through to heuristic on any failure

        # Structural parsing using heuristics as fallback
        elements = []
        element_order = 1

        # Split by common claim delimiters
        parts = claim_text.split(';')

        for i, part in enumerate(parts):
            part = part.strip()
            if not part:
                continue

            # Determine element type
            if i == 0 and any(kw in part.lower() for kw in ['comprising', 'including', 'consisting']):
                element_type = 'preamble'
            elif any(kw in part.lower() for kw in ['wherein', 'whereby', 'characterized']):
                element_type = 'transition'
            else:
                element_type = 'body'

            elements.append({
                'element_order': element_order,
                'element_text': part,
                'element_type': element_type,
            })
            element_order += 1

        return elements

    def score_evidence_relevance(self, evidence_text: str, claim_text: str, use_llm: bool = False) -> dict:
        """
        AI-scored relevance of evidence to a specific claim.
        Returns: {score: 0-100, reasoning: str}
        """
        if use_llm:
            prompt = (
                "Score how strongly this evidence supports the patent claim, 0-100, and "
                "explain briefly. Return ONLY JSON: {\"score\": int, \"reasoning\": str}.\n\n"
                f"CLAIM:\n{claim_text}\n\nEVIDENCE:\n{evidence_text}"
            )
            data = _llm_json(prompt)
            if isinstance(data, dict) and 'score' in data:
                try:
                    return {
                        'score': max(0, min(100, int(data['score']))),
                        'reasoning': str(data.get('reasoning', '')).strip() or 'AI relevance assessment',
                    }
                except (ValueError, TypeError):
                    pass
            # fall through to heuristic

        # Keyword-based scoring as baseline
        score = 50
        reasoning = "Baseline relevance score"

        claim_words = set(claim_text.lower().split())
        evidence_words = set(evidence_text.lower().split())

        # Calculate overlap
        overlap = len(claim_words & evidence_words)
        if len(claim_words) > 0:
            overlap_ratio = overlap / len(claim_words)
            score = min(100, int(50 + overlap_ratio * 50))
            reasoning = f"Keyword overlap: {overlap} terms ({overlap_ratio:.1%})"

        return {
            'score': score,
            'reasoning': reasoning,
        }

    def analyze_doe_similarity(self, claim_element: str, product_feature: str, use_llm: bool = False) -> dict:
        """
        Analyze Doctrine of Equivalents for element vs feature.
        Returns: {function, way, result, overall_score, reasoning}
        """
        if use_llm:
            prompt = (
                "Perform a Doctrine of Equivalents function-way-result (FWR) analysis "
                "comparing the claim element to the accused product feature. Return ONLY "
                "JSON: {\"function\": str, \"way\": str, \"result\": str, "
                "\"overall_score\": int(0-100), \"reasoning\": str}.\n\n"
                f"CLAIM ELEMENT:\n{claim_element}\n\nACCUSED FEATURE:\n{product_feature}"
            )
            data = _llm_json(prompt)
            if isinstance(data, dict) and {'function', 'way', 'result'} <= set(data):
                try:
                    score = max(0, min(100, int(data.get('overall_score', 70))))
                except (ValueError, TypeError):
                    score = 70
                return {
                    'function': str(data.get('function', '')).strip(),
                    'way': str(data.get('way', '')).strip(),
                    'result': str(data.get('result', '')).strip(),
                    'overall_score': score,
                    'reasoning': str(data.get('reasoning', '')).strip(),
                }
            # fall through to heuristic

        # Basic FWR analysis
        return {
            'function': f"Performs the function described in: {claim_element[:100]}...",
            'way': f"Implemented through: {product_feature[:100]}...",
            'result': "Achieves substantially the same result",
            'overall_score': 70,
            'reasoning': "Requires detailed technical analysis for accurate assessment",
        }

    def generate_claim_mapping(self, claim_text: str, product_description: str, use_llm: bool = False) -> dict:
        """
        Draft an element-by-element mapping of a claim against an accused product.
        Returns: {
          summary: str,
          elements: [{element_order, element_text, element_type,
                      accused_feature, meets_limitation (bool|None), analysis_notes}]
        }
        AI output is a DRAFT for analyst review — callers persist it with
        review_status='ai_draft'. Heuristic fallback parses elements and leaves the
        accused-feature mapping blank for the analyst to fill.
        """
        if use_llm:
            prompt = (
                "You are a patent litigation analyst. For each limitation of the patent "
                "claim below, decide whether the accused product appears to meet it and "
                "identify the corresponding product feature. Be conservative; use null "
                "for meets_limitation when unclear. Return ONLY JSON: "
                "{\"summary\": str, \"elements\": [{\"element_order\": int, "
                "\"element_text\": str, \"element_type\": \"preamble|body|transition\", "
                "\"accused_feature\": str, \"meets_limitation\": true|false|null, "
                "\"analysis_notes\": str}]}.\n\n"
                f"PATENT CLAIM:\n{claim_text}\n\nACCUSED PRODUCT:\n{product_description}"
            )
            data = _llm_json(prompt)
            if isinstance(data, dict) and isinstance(data.get('elements'), list):
                elements = []
                for i, el in enumerate(data['elements'], start=1):
                    if not isinstance(el, dict):
                        continue
                    et = el.get('element_type', 'body')
                    ml = el.get('meets_limitation', None)
                    elements.append({
                        'element_order': el.get('element_order', i),
                        'element_text': (el.get('element_text') or '').strip(),
                        'element_type': et if et in ('preamble', 'body', 'transition') else 'body',
                        'accused_feature': (el.get('accused_feature') or '').strip(),
                        'meets_limitation': ml if isinstance(ml, bool) else None,
                        'analysis_notes': (el.get('analysis_notes') or '').strip(),
                    })
                if elements:
                    return {'summary': str(data.get('summary', '')).strip(), 'elements': elements}
            # fall through to heuristic

        # Heuristic: split into elements, leave accused-feature mapping for the analyst.
        parsed = self.parse_claim_elements(claim_text, use_llm=False)
        for el in parsed:
            el['accused_feature'] = ''
            el['meets_limitation'] = None
            el['analysis_notes'] = ''
        return {
            'summary': 'Heuristic element split — accused-feature mapping pending analyst input.',
            'elements': parsed,
        }

    def suggest_evidence_passages(self, document_text: str, claim_text: str = '',
                                  use_llm: bool = False, max_results: int = 8) -> list[dict]:
        """Rank candidate evidence passages from a document by relevance to a claim.

        Returns: [{text, score (0-100), reason}]. These are CANDIDATES for the analyst
        to review and optionally save as Evidence — nothing is persisted here.
        """
        text = (document_text or '').strip()
        if not text:
            return []

        if use_llm and claim_text:
            prompt = (
                "From the product document below, extract up to "
                f"{max_results} short passages that are the strongest evidence the product "
                "practices the patent claim. Return ONLY JSON: a list of "
                "{\"text\": str, \"score\": int(0-100), \"reason\": str}.\n\n"
                f"CLAIM:\n{claim_text}\n\nDOCUMENT:\n{text[:12000]}"
            )
            data = _llm_json(prompt)
            if isinstance(data, list) and data:
                out = []
                for item in data:
                    if not isinstance(item, dict) or not item.get('text'):
                        continue
                    try:
                        score = max(0, min(100, int(item.get('score', 50))))
                    except (ValueError, TypeError):
                        score = 50
                    out.append({
                        'text': str(item['text']).strip()[:600],
                        'score': score,
                        'reason': str(item.get('reason', '')).strip(),
                    })
                if out:
                    return out[:max_results]
            # fall through to heuristic

        # Heuristic: split into passages and rank by keyword overlap with the claim.
        import re as _re
        passages = [p.strip() for p in _re.split(r'\n{2,}|(?<=[.!?])\s{2,}', text) if len(p.strip()) > 40]
        if not passages:
            passages = [s.strip() for s in _re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 40]

        claim_terms = {w for w in _re.findall(r'[a-z]{4,}', (claim_text or '').lower())} - {
            'comprising', 'including', 'wherein', 'configured', 'method', 'system', 'device', 'first', 'second'
        }
        scored = []
        for p in passages:
            if claim_terms:
                p_terms = set(_re.findall(r'[a-z]{4,}', p.lower()))
                overlap = len(claim_terms & p_terms)
                score = min(100, int((overlap / max(len(claim_terms), 1)) * 100))
                reason = f'{overlap} shared technical term(s)' if overlap else 'No claim-term overlap'
            else:
                score, reason = 40, 'No claim provided — manual review needed'
            scored.append({'text': p[:600], 'score': score, 'reason': reason})

        scored.sort(key=lambda x: x['score'], reverse=True)
        return scored[:max_results]

    def predict_infringement_risk(self, case_data: dict) -> dict:
        """
        ML model prediction of overall infringement likelihood.
        Returns: {likelihood, confidence, key_factors}
        """
        # Rule-based risk prediction
        likelihood = 50
        key_factors = []

        # Factor: Number of claims mapped
        claim_count = len(case_data.get('claim_mappings', []))
        if claim_count >= 5:
            likelihood += 15
            key_factors.append("Multiple claims mapped")

        # Factor: Evidence count
        evidence_count = len(case_data.get('evidence', []))
        if evidence_count >= 3:
            likelihood += 10
            key_factors.append("Strong evidence base")

        # Factor: Match confidence average
        mappings = case_data.get('claim_mappings', [])
        if mappings:
            avg_confidence = sum(m.get('match_confidence', 50) for m in mappings) / len(mappings)
            if avg_confidence >= 75:
                likelihood += 20
                key_factors.append("High mapping confidence")
            elif avg_confidence >= 50:
                likelihood += 10
                key_factors.append("Moderate mapping confidence")

        return {
            'likelihood': min(100, likelihood),
            'confidence': 65,  # Rule-based has moderate confidence
            'key_factors': key_factors,
        }

    def generate_claim_chart_narrative(self, claim_mapping: dict) -> str:
        """
        Generate professional narrative for claim chart report.
        """
        narrative = f"""
Claim {claim_mapping.get('claim_number', 'N/A')} Analysis:

The claimed element "{claim_mapping.get('claim_text', '')[:200]}..." is mapped to the
accused product feature "{claim_mapping.get('product_feature', '')}".

{claim_mapping.get('product_feature_description', '')}

Analysis Type: {claim_mapping.get('mapping_type', 'literal').replace('_', ' ').title()} Match
Match Confidence: {claim_mapping.get('match_confidence', 50)}%
Limitations Met: {'Yes' if claim_mapping.get('limitations_met') else 'No'}

{claim_mapping.get('analysis_notes', '')}
        """.strip()

        return narrative

    def suggest_prior_art_invalidity(self, patent_claims: list) -> list:
        """
        Find potential invalidity references from Prior Art database.
        Returns: list of potential invalidity risks with references
        """
        # This would integrate with the Prior Art module
        suggestions = []

        for claim in patent_claims:
            claim_text = claim.get('claim_text', '')

            # Extract key technical terms for searching
            technical_terms = self._extract_technical_terms(claim_text)

            if technical_terms:
                suggestions.append({
                    'claim_number': claim.get('claim_number'),
                    'search_terms': technical_terms,
                    'recommendation': f"Search prior art for: {', '.join(technical_terms[:5])}",
                })

        return suggestions

    def _extract_technical_terms(self, text: str) -> list:
        """Extract technical terms from text for prior art search"""
        # Simple extraction - in production would use NLP
        stopwords = {'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                     'of', 'with', 'by', 'from', 'comprising', 'including', 'wherein'}

        words = text.lower().split()
        technical_terms = [w for w in words if len(w) > 4 and w not in stopwords]

        # Return unique terms
        return list(dict.fromkeys(technical_terms))[:10]


# Singleton instance
ai_service = InfringementAIService()
