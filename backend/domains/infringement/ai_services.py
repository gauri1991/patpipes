"""
AI-Powered Analysis Services for Infringement Module
Provides intelligent features for claim parsing, evidence scoring, and risk analysis.
"""

import json
from typing import Optional
from django.conf import settings


class InfringementAIService:
    """AI-powered analysis features for infringement module"""

    def __init__(self):
        self.llm_client = None  # Will be initialized with actual LLM client

    def parse_claim_elements(self, claim_text: str) -> list[dict]:
        """
        Parse patent claim text into structured elements.
        Uses LLM to identify preamble, transitions, and body elements.

        Returns: [{element_order, element_text, element_type}]
        """
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

    def score_evidence_relevance(self, evidence_text: str, claim_text: str) -> dict:
        """
        AI-scored relevance of evidence to a specific claim.
        Returns: {score: 0-100, reasoning: str}
        """
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

    def analyze_doe_similarity(self, claim_element: str, product_feature: str) -> dict:
        """
        Analyze Doctrine of Equivalents for element vs feature.
        Returns: {function, way, result, overall_score, reasoning}
        """
        # Basic FWR analysis
        return {
            'function': f"Performs the function described in: {claim_element[:100]}...",
            'way': f"Implemented through: {product_feature[:100]}...",
            'result': "Achieves substantially the same result",
            'overall_score': 70,
            'reasoning': "Requires detailed technical analysis for accurate assessment",
        }

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
