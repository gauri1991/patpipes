"""
Claim-term extraction + consistent color assignment for EoU coloring.

Identifies the "items" in each claim limitation (antecedent-basis noun phrases — e.g.
"a heating device", later "the heating device") and assigns each a stable color from a
curated palette, consistent case-wide, with at most 5 distinct colors per element and no
two terms in one element sharing a color.

Engine: spaCy noun_chunks (en_core_web_sm); falls back to a regex if spaCy/model is
unavailable. The `strategy` arg is a hook for future extractors (accused_feature / LLM).
"""

import logging
import re

logger = logging.getLogger(__name__)

# Curated, legible, well-separated palette (same hues used for ProjectType chips).
PALETTE = [
    '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1',
]
MAX_TERMS_PER_ELEMENT = 5

_LEADING_DET = re.compile(
    r'^(?:the\s+said|said|at\s+least\s+(?:one|a|an)|one\s+of|one|each|a|an|the|its|their|such|first|second|third)\s+',
    re.IGNORECASE,
)
# Too-generic single-word heads to skip when they appear alone.
_STOP_SINGLE = {
    'method', 'system', 'device', 'apparatus', 'means', 'step', 'steps', 'claim',
    'invention', 'embodiment', 'portion', 'plurality', 'configuration', 'use', 'one',
    'each', 'said', 'such', 'it', 'which', 'that',
}

_nlp = None  # None=unloaded, False=unavailable, else the spaCy pipeline


def _get_nlp():
    global _nlp
    if _nlp is False:
        return None
    if _nlp is None:
        try:
            import spacy
            _nlp = spacy.load('en_core_web_sm', disable=['ner', 'lemmatizer'])
        except Exception as e:  # model not installed, etc.
            logger.warning('spaCy unavailable, claim-term extraction using regex fallback: %s', e)
            _nlp = False
            return None
    return _nlp


def _normalize(phrase: str) -> str:
    """Reduce 'a/the/said heating device' → 'heating device' so all refs share a key."""
    s = (phrase or '').strip().lower()
    prev = None
    while prev != s:
        prev = s
        s = _LEADING_DET.sub('', s).strip()
    s = re.sub(r'\s+', ' ', s).strip(' .,;:()')
    return s


def _collect(text: str):
    """Yield (key, introduced_by_indefinite) for noun phrases in the text."""
    nlp = _get_nlp()
    out = []
    if nlp:
        for nc in nlp(text or '').noun_chunks:
            first = nc[0].text.lower() if len(nc) else ''
            out.append((_normalize(nc.text), first in ('a', 'an')))
    else:
        for m in re.finditer(
            r'\b(a|an|the|said)\s+([a-z][a-z\-]+(?:\s+[a-z][a-z\-]+){0,3})', text or '', re.IGNORECASE
        ):
            out.append((_normalize(m.group(0)), m.group(1).lower() in ('a', 'an')))
    return out


def _ranked_keys(text: str):
    """Distinct term keys for one element, ranked: antecedent (a/an) first, then more
    words, then order of appearance."""
    agg = {}
    for order, (key, indef) in enumerate(_collect(text)):
        if not key or len(key) < 3:
            continue
        if ' ' not in key and key in _STOP_SINGLE:
            continue
        if key not in agg:
            agg[key] = {'indef': indef, 'words': len(key.split()), 'order': order}
        elif indef:
            agg[key]['indef'] = True
    ranked = sorted(agg.items(), key=lambda kv: (not kv[1]['indef'], -kv[1]['words'], kv[1]['order']))
    return [k for k, _ in ranked]


def extract_claim_terms(case, strategy: str = 'antecedent') -> dict:
    """Build/refresh case.claim_term_colors and return it.

    Preserves existing colors (manual overrides / prior runs); assigns a palette color to
    each newly-seen term, avoiding collisions within an element, capped at 5 terms/element.
    """
    color_map = dict(case.claim_term_colors or {})
    excluded = set(case.claim_term_excluded or [])

    elements = []
    for cm in case.claim_mappings.all().order_by('claim_number'):
        elements.extend(cm.elements.all().order_by('element_order'))

    for el in elements:
        keys = [k for k in _ranked_keys(el.element_text or '') if k not in excluded][:MAX_TERMS_PER_ELEMENT]
        used = {color_map[k] for k in keys if k in color_map}
        for key in keys:
            if key in color_map:
                continue
            choice = next((c for c in PALETTE if c not in used), PALETTE[len(color_map) % len(PALETTE)])
            color_map[key] = choice
            used.add(choice)

    case.claim_term_colors = color_map
    case.save(update_fields=['claim_term_colors', 'updated_at'])
    return color_map
