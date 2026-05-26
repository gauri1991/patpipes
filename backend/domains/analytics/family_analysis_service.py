"""
Patent Family Analysis Service

Provides algorithmic (quick) and LLM-powered (deep) analysis of patent
family claims to identify scope differences, distinctions, and coverage
gaps across jurisdictions.
"""

import json
import logging
import re
import time
from collections import Counter, defaultdict
from typing import Any, Dict, List, Optional, Tuple

from .lens_service import LensClient, LensAPIError

logger = logging.getLogger(__name__)


def _extract_claim_texts(claims_data: list) -> List[str]:
    """Extract flat list of claim text strings from Lens claims structure."""
    texts = []
    for claim_set in claims_data or []:
        for claim in claim_set.get('claims', []):
            claim_text_parts = claim.get('claim_text', [])
            if claim_text_parts:
                texts.append(' '.join(claim_text_parts))
    return texts


def _is_independent(claim_text: str) -> bool:
    """Heuristic: a claim is dependent if it references another claim."""
    return not bool(re.search(r'\bclaim\s+\d+', claim_text, re.IGNORECASE))


def _extract_noun_phrases(text: str) -> List[str]:
    """Simple noun phrase extraction using regex patterns."""
    # Extract multi-word noun phrases (adjective + noun patterns)
    text_lower = text.lower()
    # Remove common claim preamble
    text_lower = re.sub(r'^(a |an |the |said |wherein |comprising |including )', '', text_lower)
    # Extract word sequences that look like technical elements
    phrases = re.findall(r'(?:(?:first|second|third|upper|lower|inner|outer|primary|secondary)\s+)?'
                         r'(?:[a-z]+(?:ing|ed|able|ible|al|ive|ous|ent|ant)\s+)*'
                         r'[a-z]{3,}(?:\s+[a-z]{3,}){0,3}', text_lower)
    # Filter out very common/generic phrases
    stopwords = {'the method', 'the system', 'the apparatus', 'the device', 'a method',
                 'a system', 'an apparatus', 'a device', 'one or more', 'at least one',
                 'configured to', 'adapted to', 'operable to', 'wherein the', 'according to'}
    return [p.strip() for p in phrases if p.strip() and len(p.strip()) > 5 and p.strip() not in stopwords]


def _word_count(text: str) -> int:
    return len(text.split())


class FamilyAnalysisService:
    """Analyzes claims across patent family members."""

    def __init__(self):
        self.client = LensClient()

    def fetch_family_claims(
        self, lens_id: str, family_type: str = 'simple'
    ) -> Dict[str, Dict[str, Any]]:
        """Fetch claims for all family members.

        Returns dict mapping jurisdiction+doc_number → {claims, lens_id, ...}
        """
        # 1. Fetch the root patent with family data
        root_result = self.client.post('/patent/search', {
            'query': {'term': {'lens_id': lens_id}},
            'size': 1,
            'include': ['lens_id', 'doc_number', 'kind', 'jurisdiction',
                        'biblio', 'claims', 'families'],
        })

        if not root_result or not root_result.get('data'):
            raise LensAPIError(f'Root patent {lens_id} not found')

        root = root_result['data'][0]
        families = root.get('families', {})
        family = families.get(f'{family_type}_family', {})
        members = family.get('members', [])

        if not members:
            return {self._member_key(root): self._extract_member_info(root)}

        # 2. Collect lens_ids of family members
        member_ids = [m.get('lens_id') for m in members if m.get('lens_id')]
        if not member_ids:
            return {self._member_key(root): self._extract_member_info(root)}

        # 3. Batch fetch members with claims (Lens max 100 per request)
        all_members = {}
        for i in range(0, len(member_ids), 50):
            batch = member_ids[i:i+50]
            batch_result = self.client.post('/patent/search', {
                'query': {'terms': {'lens_id': batch}},
                'size': len(batch),
                'include': ['lens_id', 'doc_number', 'kind', 'jurisdiction',
                            'biblio', 'claims', 'legal_status'],
            })
            if batch_result and batch_result.get('data'):
                for doc in batch_result['data']:
                    key = self._member_key(doc)
                    all_members[key] = self._extract_member_info(doc)

        return all_members

    def _member_key(self, doc: Dict) -> str:
        return f"{doc.get('jurisdiction', '?')}{doc.get('doc_number', '?')}{doc.get('kind', '')}"

    def _extract_member_info(self, doc: Dict) -> Dict[str, Any]:
        biblio = doc.get('biblio', {})
        titles = biblio.get('invention_title', [])
        title = ''
        for t in titles:
            if isinstance(t, dict):
                if t.get('lang', '').upper() == 'EN' or not title:
                    title = t.get('text', '')
                    if t.get('lang', '').upper() == 'EN':
                        break

        return {
            'lens_id': doc.get('lens_id', ''),
            'jurisdiction': doc.get('jurisdiction', ''),
            'doc_number': doc.get('doc_number', ''),
            'kind': doc.get('kind', ''),
            'title': title,
            'claims': _extract_claim_texts(doc.get('claims', [])),
            'legal_status': doc.get('legal_status', {}),
        }

    # ──────────────────────────────────────────────────────────────────
    # Quick (Algorithmic) Analysis
    # ──────────────────────────────────────────────────────────────────

    def quick_analysis(self, members: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Run algorithmic analysis on family claims."""
        start = time.time()

        claim_scope = self._analyze_claim_scope(members)
        distinctions = self._analyze_distinctions(members)
        coverage = self._build_coverage_matrix(members)

        return {
            'analysis_mode': 'quick',
            'family_size': len(members),
            'claim_scope': claim_scope,
            'distinctions': distinctions,
            'coverage_matrix': coverage,
            'processing_time_seconds': round(time.time() - start, 2),
        }

    def _analyze_claim_scope(self, members: Dict[str, Dict]) -> List[Dict]:
        """Compare claim breadth across family members."""
        results = []

        # Compute max word count for normalization
        all_indep_lengths = []
        for info in members.values():
            for c in info['claims']:
                if _is_independent(c):
                    all_indep_lengths.append(_word_count(c))
        max_length = max(all_indep_lengths) if all_indep_lengths else 1

        for key, info in members.items():
            claims = info['claims']
            independent = [c for c in claims if _is_independent(c)]
            dependent = [c for c in claims if not _is_independent(c)]

            avg_length = (sum(_word_count(c) for c in independent) / len(independent)) if independent else 0
            # Broadness score: shorter independent claims = broader scope (inverse of word count)
            # Normalized to 0-100 scale
            if independent:
                shortest = min(_word_count(c) for c in independent)
                broadness = max(0, 100 - int((shortest / max_length) * 100))
            else:
                broadness = 0

            broadest_claim = min(independent, key=_word_count) if independent else ''
            preview = broadest_claim[:200] + '...' if len(broadest_claim) > 200 else broadest_claim

            results.append({
                'jurisdiction': info['jurisdiction'],
                'doc_number': info['doc_number'],
                'lens_id': info['lens_id'],
                'independent_claim_count': len(independent),
                'dependent_claim_count': len(dependent),
                'total_claim_count': len(claims),
                'avg_claim_length': round(avg_length),
                'broadness_score': broadness,
                'broadest_claim_preview': preview,
            })

        # Sort by broadness (broadest first)
        results.sort(key=lambda x: x['broadness_score'], reverse=True)
        return results

    def _analyze_distinctions(self, members: Dict[str, Dict]) -> List[Dict]:
        """Find unique claim elements per family member."""
        # Build per-member element sets
        member_elements: Dict[str, set] = {}
        for key, info in members.items():
            elements = set()
            for claim in info['claims']:
                if _is_independent(claim):
                    phrases = _extract_noun_phrases(claim)
                    elements.update(phrases)
            member_elements[key] = elements

        # All elements across all members
        all_elements = set()
        for els in member_elements.values():
            all_elements.update(els)

        results = []
        for key, info in members.items():
            my_elements = member_elements.get(key, set())
            other_elements = set()
            for other_key, other_els in member_elements.items():
                if other_key != key:
                    other_elements.update(other_els)

            unique = my_elements - other_elements
            missing = other_elements - my_elements

            results.append({
                'jurisdiction': info['jurisdiction'],
                'doc_number': info['doc_number'],
                'unique_elements': sorted(unique)[:20],  # Cap at 20
                'added_vs_parent': sorted(unique)[:10],
                'removed_vs_parent': sorted(missing)[:10],
            })

        return results

    def _build_coverage_matrix(self, members: Dict[str, Dict]) -> Dict[str, Any]:
        """Build element × jurisdiction coverage matrix."""
        # Collect elements from independent claims
        jurisdiction_elements: Dict[str, set] = {}
        all_elements_counter: Counter = Counter()

        for key, info in members.items():
            jur = info['jurisdiction']
            elements = set()
            for claim in info['claims']:
                if _is_independent(claim):
                    phrases = _extract_noun_phrases(claim)
                    elements.update(phrases)
                    all_elements_counter.update(phrases)
            jurisdiction_elements[jur] = jurisdiction_elements.get(jur, set()) | elements

        # Top elements (most common across jurisdictions)
        top_elements = [el for el, _ in all_elements_counter.most_common(25)]
        jurisdictions = sorted(jurisdiction_elements.keys())

        matrix = []
        for el in top_elements:
            row = []
            for jur in jurisdictions:
                covered = el in jurisdiction_elements.get(jur, set())
                row.append({'covered': covered, 'claim_numbers': []})
            matrix.append(row)

        return {
            'elements': top_elements,
            'jurisdictions': jurisdictions,
            'matrix': matrix,
        }

    # ──────────────────────────────────────────────────────────────────
    # Deep (LLM-Powered) Analysis
    # ──────────────────────────────────────────────────────────────────

    def deep_analysis(
        self,
        members: Dict[str, Dict[str, Any]],
        model: str = 'sonnet',
    ) -> Dict[str, Any]:
        """Run LLM-powered deep analysis on family claims."""
        start = time.time()

        # Get active LLM provider
        from .models import LLMProviderConfig

        api_key = None
        provider = None
        for p in ['anthropic', 'openai', 'google']:
            key = LLMProviderConfig.get_key(p)
            if key:
                api_key = key
                provider = p
                break

        if not api_key:
            raise ValueError('No LLM provider configured. Add an API key in Admin → LLM Keys.')

        # Build prompt with family claims
        prompt = self._build_deep_analysis_prompt(members)

        # Call LLM
        if provider == 'anthropic':
            result = self._call_anthropic(api_key, prompt, model)
        elif provider == 'openai':
            result = self._call_openai(api_key, prompt, model)
        else:
            result = self._call_anthropic(api_key, prompt, model)  # default to anthropic pattern

        # Parse LLM response
        parsed = self._parse_llm_response(result, members)
        parsed['analysis_mode'] = 'deep'
        parsed['family_size'] = len(members)
        parsed['model_used'] = f'{provider}/{model}'
        parsed['processing_time_seconds'] = round(time.time() - start, 2)

        return parsed

    def _build_deep_analysis_prompt(self, members: Dict[str, Dict]) -> str:
        """Build the analysis prompt for LLM."""
        member_sections = []
        for key, info in members.items():
            claims_text = '\n'.join(
                f'  Claim {i+1}: {c[:500]}' for i, c in enumerate(info['claims'][:20])
            )
            member_sections.append(
                f"## {info['jurisdiction']}{info['doc_number']}{info['kind']} "
                f"(Jurisdiction: {info['jurisdiction']})\n"
                f"Title: {info['title']}\n"
                f"Claims ({len(info['claims'])} total):\n{claims_text or '  (No claims available)'}"
            )

        members_text = '\n\n'.join(member_sections)

        return f"""Analyze the following patent family members and their claims. Compare them to identify:

1. **Claim Scope Comparison**: For each member, assess the broadness of independent claims on a 0-100 scale. Identify which jurisdiction has the broadest and narrowest claims.

2. **Distinction Mapping**: For each member, identify unique claim elements not found in other members. What was added or removed compared to other family members?

3. **Coverage Matrix**: Identify the key technical elements/features across all claims and map which jurisdictions cover each element.

4. **Prosecution Narrowing**: Flag any claims that appear narrowed (more limitations, narrower scope) compared to the earliest family member.

5. **Strategic Summary**: Provide a brief strategic assessment of the family's global coverage strength.

Return your analysis as JSON with this structure:
{{
  "claim_scope": [
    {{"jurisdiction": "XX", "doc_number": "...", "broadness_score": 0-100, "assessment": "..."}}
  ],
  "distinctions": [
    {{"jurisdiction": "XX", "doc_number": "...", "unique_elements": ["..."], "description": "..."}}
  ],
  "coverage_matrix": {{
    "elements": ["element1", "element2"],
    "jurisdictions": ["US", "EP"],
    "matrix": [[{{"covered": true}}, {{"covered": false}}]]
  }},
  "prosecution_flags": [
    {{"jurisdiction": "XX", "narrowed_claims": [1, 3], "description": "..."}}
  ],
  "strategic_summary": "..."
}}

PATENT FAMILY MEMBERS:

{members_text}"""

    def _call_anthropic(self, api_key: str, prompt: str, model: str) -> str:
        """Call Anthropic Claude API."""
        import requests as http
        model_id = 'claude-sonnet-4-20250514' if model == 'sonnet' else 'claude-opus-4-20250514'

        resp = http.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            json={
                'model': model_id,
                'max_tokens': 4096,
                'messages': [{'role': 'user', 'content': prompt}],
            },
            timeout=120,
        )
        resp.raise_for_status()
        data = resp.json()
        return data['content'][0]['text']

    def _call_openai(self, api_key: str, prompt: str, model: str) -> str:
        """Call OpenAI API."""
        import requests as http
        model_id = 'gpt-4o' if model == 'opus' else 'gpt-4o-mini'

        resp = http.post(
            'https://api.openai.com/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'model': model_id,
                'max_tokens': 4096,
                'messages': [{'role': 'user', 'content': prompt}],
            },
            timeout=120,
        )
        resp.raise_for_status()
        data = resp.json()
        return data['choices'][0]['message']['content']

    def _parse_llm_response(self, response: str, members: Dict) -> Dict[str, Any]:
        """Parse LLM JSON response, falling back to quick analysis on parse failure."""
        # Try to extract JSON from the response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                # Ensure required fields
                parsed.setdefault('claim_scope', [])
                parsed.setdefault('distinctions', [])
                parsed.setdefault('coverage_matrix', {'elements': [], 'jurisdictions': [], 'matrix': []})
                parsed.setdefault('strategic_summary', '')
                return parsed
            except json.JSONDecodeError:
                pass

        # Fallback: return quick analysis + raw LLM text as summary
        logger.warning('Failed to parse LLM response as JSON, falling back to quick analysis')
        quick = self.quick_analysis(members)
        quick['strategic_summary'] = response[:2000]
        return quick
