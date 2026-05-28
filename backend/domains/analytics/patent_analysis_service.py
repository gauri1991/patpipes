"""
Patent Analysis Service

Deep AI-powered analysis of patent text: keyword extraction, novel element
identification, claim scope analysis, embodiment mapping, prosecution
vulnerability assessment, claim dependency tree, and means-plus-function detection.

Uses Anthropic Claude models with parallel execution for each analysis section.
Prompts are loaded from AnalysisPromptTemplate DB (with hardcoded fallbacks)
and the exact prompt sent per section is recorded in the analysis result.
"""

import json
import logging
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model configuration
# ---------------------------------------------------------------------------

# Fallback model IDs when the admin LLMProviderConfig isn't configured.
# Production should read from LLMProviderConfig.resolved_model — see _resolve_model_id().
MODEL_MAP = {
    'sonnet': 'claude-sonnet-4-6',
    'opus':   'claude-opus-4-6',
    'haiku':  'claude-haiku-4-5-20251001',
}

# Current Anthropic pricing per million tokens (sourced from docs.anthropic.com).
# Note: Opus 4.x is $5/$25, NOT $15/$75 — Opus 4.1 (legacy) is the only one at the higher rate.
MODEL_PRICING = {
    # Opus family (current — $5/$25)
    'claude-opus-4-8':           {'input': 5.00,  'output': 25.00},
    'claude-opus-4-7':           {'input': 5.00,  'output': 25.00},
    'claude-opus-4-6':           {'input': 5.00,  'output': 25.00},
    'claude-opus-4-5':           {'input': 5.00,  'output': 25.00},
    # Opus 4.1 — legacy, higher cost
    'claude-opus-4-1':           {'input': 15.00, 'output': 75.00},
    # Sonnet family ($3/$15)
    'claude-sonnet-4-6':         {'input': 3.00,  'output': 15.00},
    'claude-sonnet-4-5':         {'input': 3.00,  'output': 15.00},
    # Haiku ($1/$5)
    'claude-haiku-4-5-20251001': {'input': 1.00,  'output': 5.00},
}


def _resolve_model_id(model_key: str) -> str:
    """Resolve a UI model key (sonnet/opus/haiku) to a concrete Anthropic model ID.

    Priority:
      1. Admin LLMProviderConfig.resolved_model (if anthropic provider is active)
      2. Hardcoded MODEL_MAP fallback
    """
    try:
        from .models import LLMProviderConfig
        cfg = LLMProviderConfig.objects.filter(provider='anthropic', is_active=True).first()
        if cfg:
            resolved = cfg.resolved_model
            # If the admin chose a model that matches the tier the user picked, prefer it
            if resolved and (
                (model_key == 'sonnet' and 'sonnet' in resolved) or
                (model_key == 'opus'   and 'opus'   in resolved) or
                (model_key == 'haiku'  and 'haiku'  in resolved)
            ):
                return resolved
    except Exception:
        pass
    return MODEL_MAP.get(model_key, MODEL_MAP['sonnet'])


def _estimate_cost(model_id: str, input_tokens: int, output_tokens: int) -> float:
    pricing = MODEL_PRICING.get(model_id, {'input': 3.0, 'output': 15.0})
    return (input_tokens * pricing['input'] + output_tokens * pricing['output']) / 1_000_000


# ---------------------------------------------------------------------------
# Text helpers
# ---------------------------------------------------------------------------

def _split_description_sections(description: str) -> dict:
    sections = {
        'background': '',
        'summary': '',
        'detailed_description': '',
        'brief_description_drawings': '',
    }

    markers = [
        (r'(?i)BACKGROUND\s+OF\s+THE\s+INVENTION|BACKGROUND', 'background'),
        (r'(?i)SUMMARY\s+OF\s+THE\s+INVENTION|SUMMARY', 'summary'),
        (r'(?i)BRIEF\s+DESCRIPTION\s+OF\s+(?:THE\s+)?DRAWINGS?', 'brief_description_drawings'),
        (r'(?i)DETAILED\s+DESCRIPTION(?:\s+OF\s+(?:THE\s+)?(?:PREFERRED\s+)?EMBODIMENTS?)?', 'detailed_description'),
    ]

    positions = []
    for pattern, key in markers:
        m = re.search(pattern, description)
        if m:
            positions.append((m.start(), m.end(), key))

    if not positions:
        sections['detailed_description'] = description
        return sections

    positions.sort(key=lambda x: x[0])

    for i, (start, end, key) in enumerate(positions):
        next_start = positions[i + 1][0] if i + 1 < len(positions) else len(description)
        sections[key] = description[end:next_start].strip()

    return sections


def _truncate(text: str, max_tokens: int = 40000) -> str:
    max_chars = max_tokens * 4
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + '\n...[truncated]'


# ---------------------------------------------------------------------------
# Claim dependency detection — robust against source-data typos
# (e.g. "The system of 1, wherein..." missing the word "claim")
# ---------------------------------------------------------------------------

_DEP_CLAIM_PATTERNS = [
    r'\bof\s+claim\s+(\d+)\b',
    r'\baccording\s+to\s+claim\s+(\d+)\b',
    r'\bas\s+(?:in|recited\s+in|claimed\s+in|set\s+forth\s+in)\s+claim\s+(\d+)\b',
    r'\bclaim\s+(\d+)\b',
    # Typo fallbacks — dropped "claim" word
    r'^\s*\d+\.\s*The\s+\w+\s+of\s+(\d+)[,\s]',
    r'^\s*\d+\.\s*The\s+\w+\s+according\s+to\s+(\d+)[,\s]',
]


def _is_dependent_claim(claim_text: str) -> bool:
    """Return True if claim_text references another claim — supports common typos."""
    head = claim_text[:200]
    for pat in _DEP_CLAIM_PATTERNS:
        if re.search(pat, head, re.IGNORECASE | re.MULTILINE):
            return True
    return False


def _find_parent_claim(claim_text: str) -> int | None:
    """Return parent claim number if this is a dependent claim, else None."""
    head = claim_text[:200]
    for pat in _DEP_CLAIM_PATTERNS:
        m = re.search(pat, head, re.IGNORECASE | re.MULTILINE)
        if m:
            try:
                return int(m.group(1))
            except (ValueError, IndexError):
                continue
    return None


def build_claim_tree(claims: list[str]) -> dict:
    tree = {'independent': [], 'dependent': [], 'tree': {}}

    for i, claim_text in enumerate(claims):
        claim_num = i + 1
        num_match = re.match(r'^\s*(\d+)\.\s', claim_text)
        if num_match:
            claim_num = int(num_match.group(1))

        parent = _find_parent_claim(claim_text)
        if parent is not None:
            tree['dependent'].append({
                'claim_number': claim_num,
                'depends_on': parent,
                'text_preview': claim_text[:120].strip(),
            })
            tree['tree'].setdefault(str(parent), []).append(claim_num)
        else:
            tree['independent'].append({
                'claim_number': claim_num,
                'text_preview': claim_text[:120].strip(),
            })
            tree['tree'].setdefault(str(claim_num), [])

    tree['total_claims'] = len(claims)
    tree['independent_count'] = len(tree['independent'])
    tree['dependent_count'] = len(tree['dependent'])
    return tree


# ---------------------------------------------------------------------------
# LLM call helper
# ---------------------------------------------------------------------------

SYSTEM_BASE = (
    "You are a patent analysis expert. Return ONLY valid JSON matching the "
    "requested schema. Do not include commentary outside the JSON."
)


def _call_llm(client, model_id: str, system: str, user: str, max_tokens: int = 4096) -> dict:
    """Call Anthropic with explicit 429 retry — Tier 1 (8K output TPM) is easy to exceed
    when multiple sections of an analysis run back-to-back.
    """
    import anthropic as _anthropic

    response = None
    max_retries = 3
    for attempt in range(max_retries + 1):
        try:
            response = client.messages.create(
                model=model_id,
                max_tokens=max_tokens,
                temperature=0,  # deterministic JSON output
                system=system,
                messages=[{'role': 'user', 'content': user}],
            )
            break
        except _anthropic.RateLimitError:
            if attempt >= max_retries:
                logger.error('Anthropic rate limit: retries exhausted (model=%s, section call)', model_id)
                raise
            wait = 30 * (2 ** attempt)   # 30 s, 60 s, 120 s
            logger.warning('Anthropic rate limit hit (attempt %d/%d) — sleeping %ds', attempt + 1, max_retries, wait)
            time.sleep(wait)
        except _anthropic.APIStatusError as e:
            if e.status_code == 529 and attempt < max_retries:  # overloaded
                wait = 15 * (2 ** attempt)
                logger.warning('Anthropic overloaded — sleeping %ds', wait)
                time.sleep(wait)
                continue
            raise

    assert response is not None  # mypy/lint hint

    text = response.content[0].text
    input_tokens = response.usage.input_tokens
    output_tokens = response.usage.output_tokens

    text = text.strip()
    if text.startswith('```'):
        text = re.sub(r'^```(?:json)?\s*', '', text)
        text = re.sub(r'\s*```$', '', text)

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        json_match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', text)
        if json_match:
            parsed = json.loads(json_match.group(1))
        else:
            parsed = {'raw_response': text, 'parse_error': True}

    return {
        'data': parsed,
        'input_tokens': input_tokens,
        'output_tokens': output_tokens,
    }


# ---------------------------------------------------------------------------
# Default (hardcoded) prompt templates — used when no DB template exists
# ---------------------------------------------------------------------------

DEFAULT_PROMPTS: dict[str, str] = {
    'keywords': """Analyze this patent text and extract categorized technical keywords.

ABSTRACT:
{abstract}

CLAIMS (first 5):
{claims_text}

Return JSON:
{{
  "technical_terms": [
    {{
      "term": "string",
      "category": "method|apparatus|material|process|measurement|software|other",
      "importance": 1-10,
      "claim_locations": [1, 3],
      "context_quote": "short quote from text where term appears"
    }}
  ],
  "key_distinguishing_terms": ["term1", "term2"],
  "technology_domain": "string",
  "ipc_suggestion": "string"
}}""",

    'novel_elements': """Identify the novel elements in these independent patent claims and find their
corresponding support in the specification.

INDEPENDENT CLAIMS:
{independent_claims}

SPECIFICATION (description):
{description}

Return JSON:
{{
  "novel_elements": [
    {{
      "claim_number": 1,
      "element_text": "the novel limitation text from the claim",
      "novelty_reasoning": "why this element is likely novel",
      "spec_support": "quoted passage from description supporting this element",
      "spec_location_hint": "e.g. 'paragraph describing FIG. 3'"
    }}
  ],
  "overall_novelty_assessment": "string summary"
}}""",

    'claim_scope': """Analyze the scope and broadness of this patent claim.

CLAIM {claim_number}:
{claim_text}

RELEVANT SPECIFICATION EXCERPT:
{description_excerpt}

Return JSON:
{{
  "claim_number": {claim_number},
  "broadness_score": 0-100,
  "broadness_reasoning": "explanation",
  "key_limitations": [
    {{
      "text": "limitation text",
      "type": "structural|functional|method_step|material|numerical",
      "narrowing_effect": "high|medium|low"
    }}
  ],
  "functional_language": [
    {{
      "text": "functional phrase",
      "type": "means_plus_function|configured_to|adapted_to|operable_to"
    }}
  ],
  "structural_language": ["structural phrase 1"],
  "overall_assessment": "string"
}}""",

    'embodiments': """Analyze the embodiments described in this patent specification.

DETAILED DESCRIPTION:
{detailed_description}

Return JSON:
{{
  "embodiments": [
    {{
      "number": 1,
      "title": "short descriptive title",
      "summary": "precise summary (2-3 sentences)",
      "figure_references": ["FIG. 1", "FIG. 2A"],
      "distinguishing_aspects": "what makes this embodiment unique"
    }}
  ],
  "total_count": 0,
  "primary_embodiment": 1,
  "variation_summary": "how embodiments relate to each other"
}}""",

    'background_analysis': """Analyze the background section of this patent to identify prior art
deficiencies, problems, and proposed solutions.

BACKGROUND:
{background}

Return JSON:
{{
  "prior_art_deficiencies": [
    {{
      "deficiency": "description of the problem with prior art",
      "source_quote": "exact quote from background"
    }}
  ],
  "problems_identified": [
    {{
      "problem": "problem statement",
      "source_quote": "exact quote"
    }}
  ],
  "proposed_solutions": [
    {{
      "solution": "how the invention addresses the problem",
      "source_quote": "exact quote"
    }}
  ],
  "technical_field": "string",
  "summary": "overall problem-solution narrative"
}}""",

    'means_plus_function': """Identify means-plus-function (MPF) elements in these patent claims under
35 U.S.C. 112(f). Look for "means for", "step for", and functional language
that may invoke 112(f).

CLAIMS:
{claims_text}

SPECIFICATION:
{description}

Return JSON:
{{
  "mpf_elements": [
    {{
      "claim_number": 1,
      "element_text": "means for processing...",
      "function_described": "the function",
      "corresponding_structure": "structure from spec that performs the function",
      "spec_support_quote": "quoted passage",
      "risk_level": "high|medium|low",
      "notes": "any additional context"
    }}
  ],
  "has_mpf_elements": true,
  "total_mpf_count": 0,
  "recommendation": "string"
}}""",

    'vulnerabilities': """Assess prosecution vulnerabilities for these patent claims.

Evaluate:
1. Section 101 eligibility risk (Alice/Mayo abstract idea test)
2. Section 112 indefiniteness issues (vague terms like "substantially" without definition)
3. Overall prosecution risk

ABSTRACT:
{abstract}

INDEPENDENT CLAIMS:
{independent_claims}

Return JSON:
{{
  "section_101_risk": {{
    "risk_level": "high|medium|low",
    "reasoning": "explanation of Alice/Mayo analysis",
    "abstract_idea_candidates": ["potential abstract ideas"],
    "practical_application_arguments": ["arguments for eligibility"]
  }},
  "section_112_issues": [
    {{
      "claim_number": 1,
      "term": "the vague term",
      "issue_type": "indefiniteness|lack_of_antecedent_basis|relative_term",
      "explanation": "why this is problematic",
      "severity": "high|medium|low"
    }}
  ],
  "overall_prosecution_risk": {{
    "rating": "high|medium|low",
    "summary": "overall assessment",
    "recommendations": ["recommendation 1", "recommendation 2"]
  }}
}}""",
}

# Max output tokens per section
SECTION_MAX_TOKENS: dict[str, int] = {
    'keywords': 3000,
    'novel_elements': 4096,
    'claim_scope': 2500,
    'embodiments': 4096,
    'background_analysis': 3000,
    'means_plus_function': 2500,
    'vulnerabilities': 3000,
}


# ---------------------------------------------------------------------------
# Prompt loader
# ---------------------------------------------------------------------------

def _load_prompt(section: str, category: str) -> tuple[str, dict]:
    """Load prompt from DB if available, else use hardcoded default.

    Returns (prompt_template_string, metadata_dict).
    metadata_dict: {source: 'db'|'default', template_id?, version?, category}
    """
    try:
        from .models import AnalysisPromptTemplate
        template = AnalysisPromptTemplate.get_active(section, category)
        if template:
            return template.prompt_text, {
                'source': 'db',
                'template_id': str(template.id),
                'version': template.version,
                'category': template.category,
                'section': section,
            }
    except Exception:
        logger.debug('Could not load DB prompt for %s/%s, using default', section, category)

    return DEFAULT_PROMPTS.get(section, ''), {
        'source': 'default',
        'category': category,
        'section': section,
    }


# ---------------------------------------------------------------------------
# Main Service
# ---------------------------------------------------------------------------

class PatentAnalysisService:
    """Orchestrates parallel AI analysis of patent text."""

    def __init__(self):
        try:
            import anthropic
            api_key = self._get_anthropic_key()
            if api_key:
                self.client = anthropic.Anthropic(api_key=api_key, max_retries=5)
            else:
                self.client = None
        except ImportError:
            self.client = None

    @staticmethod
    def _get_anthropic_key() -> str | None:
        try:
            from .models import LLMProviderConfig
            db_key = LLMProviderConfig.get_key('anthropic')
            if db_key:
                return db_key
        except Exception:
            pass
        return os.getenv('ANTHROPIC_API_KEY')

    def analyze_patent(
        self,
        application_id: str,
        patent_text: dict,
        model_key: str = 'sonnet',
        patent_number: str = '',
        prompt_category: str = 'general',
    ) -> dict:
        """
        Run all 8 analysis sections on patent text.

        Args:
            application_id: USPTO application ID
            patent_text: dict with 'abstract', 'description', 'claims' (list)
            model_key: 'haiku', 'sonnet', or 'opus'
            patent_number: optional patent number string
            prompt_category: prompt template category to use

        Returns:
            dict with all section results + metadata + prompts_used
        """
        if not self.client:
            raise RuntimeError(
                'Anthropic client not available. Set ANTHROPIC_API_KEY in Admin > LLM Keys or as environment variable.'
            )

        # Resolve model via admin config first, fall back to hardcoded map
        model_id = _resolve_model_id(model_key)
        start_time = time.time()

        abstract = patent_text.get('abstract', '')
        description = patent_text.get('description', '')
        claims = patent_text.get('claims', [])

        if not claims and not description:
            raise ValueError('Patent text must include claims or description.')

        # Prepare derived text
        claims_text = '\n\n'.join(
            f"Claim {i + 1}: {c}" for i, c in enumerate(claims)
        )
        # Use the same robust dependent-claim detection as bundle scoring
        # (catches typos like "system of 1" missing the word "claim")
        independent_claims_text = '\n\n'.join(
            f"Claim {i + 1}: {c}" for i, c in enumerate(claims)
            if not _is_dependent_claim(c)
        )

        desc_sections = _split_description_sections(description)
        background = desc_sections.get('background', '') or description[:3000]
        detailed_desc = desc_sections.get('detailed_description', '') or description

        # Build substitution context for prompt templates
        fmt_ctx = {
            'abstract': _truncate(abstract, 500),
            'claims_text': _truncate(claims_text, 8000),
            'independent_claims': _truncate(independent_claims_text, 10000),
            'description': _truncate(detailed_desc, 50000),
            'detailed_description': _truncate(detailed_desc, 60000),
            'background': _truncate(background, 8000),
        }

        # ---- Load prompts for each section ----
        prompts_used: dict[str, dict] = {}

        def _get_prompt(section: str, extra_ctx: dict | None = None) -> str:
            template_str, meta = _load_prompt(section, prompt_category)
            ctx = {**fmt_ctx, **(extra_ctx or {})}
            try:
                rendered = template_str.format(**ctx)
            except KeyError:
                # Template has placeholders we don't have — use as-is
                rendered = template_str
            meta['rendered_prompt'] = rendered
            prompts_used[section] = meta
            return rendered

        # ---- Run analysis sections in parallel ----
        results = {}
        section_status = {}
        total_input = 0
        total_output = 0

        # Claim tree is algorithmic
        try:
            results['claim_tree'] = build_claim_tree(claims)
            section_status['claim_tree'] = 'completed'
            prompts_used['claim_tree'] = {'source': 'algorithmic', 'section': 'claim_tree'}
        except Exception as e:
            logger.exception('Claim tree analysis failed')
            results['claim_tree'] = {'error': str(e)}
            section_status['claim_tree'] = 'failed'

        # LLM sections
        section_tasks = {
            'keywords': lambda: _call_llm(
                self.client, model_id, SYSTEM_BASE,
                _get_prompt('keywords'),
                SECTION_MAX_TOKENS['keywords'],
            ),
            'novel_elements': lambda: _call_llm(
                self.client, model_id, SYSTEM_BASE,
                _get_prompt('novel_elements'),
                SECTION_MAX_TOKENS['novel_elements'],
            ),
            'embodiments': lambda: _call_llm(
                self.client, model_id, SYSTEM_BASE,
                _get_prompt('embodiments'),
                SECTION_MAX_TOKENS['embodiments'],
            ),
            'background_analysis': lambda: _call_llm(
                self.client, model_id, SYSTEM_BASE,
                _get_prompt('background_analysis'),
                SECTION_MAX_TOKENS['background_analysis'],
            ),
            'means_plus_function': lambda: _call_llm(
                self.client, model_id, SYSTEM_BASE,
                _get_prompt('means_plus_function'),
                SECTION_MAX_TOKENS['means_plus_function'],
            ),
            'vulnerabilities': lambda: _call_llm(
                self.client, model_id, SYSTEM_BASE,
                _get_prompt('vulnerabilities'),
                SECTION_MAX_TOKENS['vulnerabilities'],
            ),
        }

        # Claim scope runs per independent claim — robust detection (handles typos)
        independent_claims_list = [
            (i + 1, c) for i, c in enumerate(claims) if not _is_dependent_claim(c)
        ]

        # Pre-load the claim_scope prompt template once
        claim_scope_template, claim_scope_meta = _load_prompt('claim_scope', prompt_category)
        prompts_used['claim_scope'] = {**claim_scope_meta, 'per_claim': True}

        def _run_claim_scope(claim_num, claim_text):
            extra = {
                'claim_number': str(claim_num),
                'claim_text': claim_text,
                'description_excerpt': _truncate(detailed_desc, 15000),
            }
            ctx = {**fmt_ctx, **extra}
            try:
                rendered = claim_scope_template.format(**ctx)
            except KeyError:
                rendered = claim_scope_template
            return _call_llm(
                self.client, model_id, SYSTEM_BASE,
                rendered,
                SECTION_MAX_TOKENS['claim_scope'],
            )

        # Concurrency cap — pinned to the Anthropic tier's output token budget.
        # An AI analysis fires up to 14 LLM calls (6 sections + up to 8 claim_scope).
        # Output budget per call averages ~2.5-3K tokens.
        #
        #   Tier 1 ($5):   8K out-TPM → max_workers=1 (sequential — safe, no 429s)
        #   Tier 2 ($40): 32K out-TPM → max_workers=4 (the historical default)
        #   Tier 3 ($200): 64K+ out-TPM → max_workers=8
        #
        # Set conservatively for Tier 1 — bump after credit purchase.
        with ThreadPoolExecutor(max_workers=1) as executor:
            futures = {}

            for section_name, task_fn in section_tasks.items():
                futures[executor.submit(task_fn)] = section_name

            claim_scope_futures = {}
            for claim_num, claim_text in independent_claims_list[:8]:
                future = executor.submit(_run_claim_scope, claim_num, claim_text)
                claim_scope_futures[future] = claim_num

            for future in as_completed(futures):
                section_name = futures[future]
                try:
                    result = future.result()
                    results[section_name] = result['data']
                    total_input += result['input_tokens']
                    total_output += result['output_tokens']
                    section_status[section_name] = 'completed'
                except Exception as e:
                    logger.exception('Analysis section %s failed', section_name)
                    results[section_name] = {'error': str(e)}
                    section_status[section_name] = 'failed'

            claim_scope_results = []
            for future in as_completed(claim_scope_futures):
                claim_num = claim_scope_futures[future]
                try:
                    result = future.result()
                    claim_scope_results.append(result['data'])
                    total_input += result['input_tokens']
                    total_output += result['output_tokens']
                except Exception as e:
                    logger.exception('Claim scope analysis failed for claim %d', claim_num)
                    claim_scope_results.append({
                        'claim_number': claim_num,
                        'error': str(e),
                    })

            claim_scope_results.sort(key=lambda x: x.get('claim_number', 0))
            results['claim_scope'] = {
                'claims': claim_scope_results,
                'total_independent_claims': len(independent_claims_list),
            }
            section_status['claim_scope'] = (
                'completed'
                if all('error' not in c for c in claim_scope_results)
                else 'partial'
            )

        elapsed = time.time() - start_time
        cost = _estimate_cost(model_id, total_input, total_output)

        return {
            'application_id': application_id,
            'patent_number': patent_number,
            'model_used': model_id,
            'analysis_version': '1.0',
            'total_input_tokens': total_input,
            'total_output_tokens': total_output,
            'total_cost_usd': round(cost, 4),
            'processing_time_seconds': round(elapsed, 1),
            'section_status': section_status,
            'prompt_category': prompt_category,
            'prompts_used': prompts_used,
            **results,
        }
