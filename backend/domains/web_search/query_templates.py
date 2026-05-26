"""
Query Templates - Auto-generate search queries from source context data.
"""


def generate_queries_for_source(source_type: str, context_data: dict) -> list[dict]:
    """
    Generate a list of search query dicts based on the source type and context.

    Args:
        source_type: One of 'infringement', 'prior_art', 'portfolio', 'manual'.
        context_data: Dict with source-specific fields (varies by source_type).

    Returns:
        list[dict]: Each dict has keys 'query_text', 'category', 'is_auto_generated'.
    """
    if source_type == 'infringement':
        return _generate_infringement_queries(context_data)
    elif source_type == 'prior_art':
        return _generate_prior_art_queries(context_data)
    elif source_type == 'portfolio':
        return _generate_portfolio_queries(context_data)
    elif source_type == 'manual':
        return []
    else:
        return []


def _generate_infringement_queries(ctx: dict) -> list[dict]:
    """
    Generate queries for infringement analysis.

    Expected context_data keys:
        patent_number, patent_title, accused_product_name,
        accused_party_name, accused_product_description
    """
    patent_number = ctx.get('patent_number', '')
    patent_title = ctx.get('patent_title', '')
    accused_product = ctx.get('accused_product_name', '')
    accused_party = ctx.get('accused_party_name', '')
    accused_description = ctx.get('accused_product_description', '')

    # Extract key technical terms from patent title (first 5 significant words)
    title_keywords = _extract_keywords(patent_title)

    queries = []

    # Product Evidence queries
    if accused_product and accused_party:
        queries.append({
            'query_text': f'"{accused_product}" "{accused_party}" product specifications',
            'category': 'product_evidence',
            'is_auto_generated': True,
        })

    if accused_product:
        queries.append({
            'query_text': f'"{accused_product}" technical features datasheet',
            'category': 'product_evidence',
            'is_auto_generated': True,
        })

    # Litigation queries
    if patent_number:
        queries.append({
            'query_text': f'"{patent_number}" litigation lawsuit infringement',
            'category': 'litigation',
            'is_auto_generated': True,
        })

    if accused_party:
        queries.append({
            'query_text': f'"{accused_party}" patent lawsuit 2024 2025',
            'category': 'litigation',
            'is_auto_generated': True,
        })

    # Prior Art query
    if title_keywords:
        queries.append({
            'query_text': f'{title_keywords} prior art related technology',
            'category': 'prior_art',
            'is_auto_generated': True,
        })

    # Competitor query
    if accused_party:
        queries.append({
            'query_text': f'"{accused_party}" patent portfolio IP strategy',
            'category': 'competitor',
            'is_auto_generated': True,
        })

    # Technical query
    if accused_product:
        queries.append({
            'query_text': f'"{accused_product}" technical architecture implementation',
            'category': 'technical',
            'is_auto_generated': True,
        })

    # Market query
    if accused_product and accused_party:
        queries.append({
            'query_text': f'"{accused_product}" market share revenue "{accused_party}"',
            'category': 'market',
            'is_auto_generated': True,
        })

    return queries


def _generate_prior_art_queries(ctx: dict) -> list[dict]:
    """
    Generate queries for prior art research.

    Expected context_data keys:
        patent_number, patent_title, patent_abstract, technology_area,
        filing_date, inventors
    """
    patent_number = ctx.get('patent_number', '')
    patent_title = ctx.get('patent_title', '')
    patent_abstract = ctx.get('patent_abstract', '')
    technology_area = ctx.get('technology_area', '')
    filing_date = ctx.get('filing_date', '')
    inventors = ctx.get('inventors', '')

    title_keywords = _extract_keywords(patent_title)
    abstract_keywords = _extract_keywords(patent_abstract, max_words=6)

    queries = []

    # Prior art academic / publications
    if title_keywords:
        queries.append({
            'query_text': f'{title_keywords} prior art publication research paper',
            'category': 'prior_art',
            'is_auto_generated': True,
        })

    if abstract_keywords:
        queries.append({
            'query_text': f'{abstract_keywords} existing technology state of the art',
            'category': 'prior_art',
            'is_auto_generated': True,
        })

    # Technical background
    if technology_area:
        queries.append({
            'query_text': f'"{technology_area}" technical overview survey',
            'category': 'technical',
            'is_auto_generated': True,
        })

    # Filing date context - prior art must predate filing
    if filing_date and title_keywords:
        # Extract year from filing date
        year = filing_date[:4] if len(filing_date) >= 4 else ''
        if year:
            queries.append({
                'query_text': f'{title_keywords} before:{year} technology development',
                'category': 'prior_art',
                'is_auto_generated': True,
            })

    # Patent family / related patents
    if patent_number:
        queries.append({
            'query_text': f'"{patent_number}" related patents patent family citations',
            'category': 'prior_art',
            'is_auto_generated': True,
        })

    # Inventor prior work
    if inventors:
        inventor_str = inventors if isinstance(inventors, str) else ', '.join(inventors[:2])
        queries.append({
            'query_text': f'"{inventor_str}" patent publications prior work',
            'category': 'prior_art',
            'is_auto_generated': True,
        })

    return queries


def _generate_portfolio_queries(ctx: dict) -> list[dict]:
    """
    Generate queries for portfolio analysis.

    Expected context_data keys:
        company_name, portfolio_name, technology_areas, key_patents
    """
    company_name = ctx.get('company_name', '')
    portfolio_name = ctx.get('portfolio_name', '')
    technology_areas = ctx.get('technology_areas', [])
    key_patents = ctx.get('key_patents', [])

    queries = []

    # Company IP landscape
    if company_name:
        queries.append({
            'query_text': f'"{company_name}" patent portfolio intellectual property strategy',
            'category': 'competitor',
            'is_auto_generated': True,
        })

        queries.append({
            'query_text': f'"{company_name}" patent litigation history lawsuits',
            'category': 'litigation',
            'is_auto_generated': True,
        })

    # Technology area analysis
    if isinstance(technology_areas, list):
        for area in technology_areas[:3]:
            queries.append({
                'query_text': f'"{area}" patent landscape market trends 2024 2025',
                'category': 'market',
                'is_auto_generated': True,
            })

    # Key patent analysis
    if isinstance(key_patents, list):
        for patent_num in key_patents[:2]:
            queries.append({
                'query_text': f'"{patent_num}" patent analysis citations licensing',
                'category': 'general',
                'is_auto_generated': True,
            })

    return queries


def _extract_keywords(text: str, max_words: int = 5) -> str:
    """
    Extract significant keywords from a text string, filtering out common stop words.
    Returns a space-separated string of up to max_words keywords.
    """
    if not text:
        return ''

    stop_words = {
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
        'these', 'those', 'it', 'its', 'as', 'not', 'no', 'nor', 'so', 'if',
        'than', 'too', 'very', 'just', 'about', 'above', 'after', 'before',
        'between', 'into', 'through', 'during', 'each', 'both', 'such',
        'method', 'system', 'apparatus', 'device', 'comprising', 'including',
        'wherein', 'thereof',
    }

    words = text.split()
    keywords = [
        w.strip('.,;:!?()[]{}"\'-')
        for w in words
        if w.lower().strip('.,;:!?()[]{}"\'-') not in stop_words
        and len(w.strip('.,;:!?()[]{}"\'-')) > 2
    ]

    return ' '.join(keywords[:max_words])
