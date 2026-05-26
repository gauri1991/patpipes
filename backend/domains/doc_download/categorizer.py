"""
Link Categorization Engine

Categorizes discovered URLs using a layered strategy:
1. File extension mapping
2. MIME type mapping
3. URL path pattern matching
4. HTML meta tag analysis
5. Default fallback
"""

import re
from urllib.parse import urlparse


# File extension → category mapping
EXTENSION_MAP = {
    # PDF
    '.pdf': 'pdf',
    # Documents
    '.doc': 'document', '.docx': 'document',
    '.xls': 'document', '.xlsx': 'document',
    '.ppt': 'document', '.pptx': 'document',
    '.odt': 'document', '.ods': 'document', '.odp': 'document',
    '.rtf': 'document', '.csv': 'document',
    # Images
    '.jpg': 'image', '.jpeg': 'image', '.png': 'image',
    '.gif': 'image', '.svg': 'image', '.webp': 'image',
    '.bmp': 'image', '.ico': 'image', '.tiff': 'image',
}

# MIME type prefix → category mapping
MIME_MAP = {
    'application/pdf': 'pdf',
    'application/msword': 'document',
    'application/vnd.openxmlformats-officedocument': 'document',
    'application/vnd.ms-excel': 'document',
    'application/vnd.ms-powerpoint': 'document',
    'application/vnd.oasis.opendocument': 'document',
    'text/csv': 'document',
    'image/': 'image',
}

# URL path patterns → category (compiled regexes)
URL_PATTERNS = [
    # Product pages
    (re.compile(r'/products?/', re.I), 'product_page'),
    (re.compile(r'/shop/', re.I), 'product_page'),
    (re.compile(r'/catalog/', re.I), 'product_page'),
    (re.compile(r'/item/', re.I), 'product_page'),
    (re.compile(r'/model/', re.I), 'product_page'),
    (re.compile(r'/solutions?/', re.I), 'product_page'),
    # Technical documentation
    (re.compile(r'/docs?/', re.I), 'technical_doc'),
    (re.compile(r'/documentation/', re.I), 'technical_doc'),
    (re.compile(r'/technical/', re.I), 'technical_doc'),
    (re.compile(r'/manual/', re.I), 'technical_doc'),
    (re.compile(r'/guide/', re.I), 'technical_doc'),
    (re.compile(r'/api/', re.I), 'technical_doc'),
    (re.compile(r'/support/', re.I), 'technical_doc'),
    # Datasheets / Specs
    (re.compile(r'/datasheet/', re.I), 'datasheet'),
    (re.compile(r'/data-sheet/', re.I), 'datasheet'),
    (re.compile(r'/spec/', re.I), 'datasheet'),
    (re.compile(r'/specifications?/', re.I), 'datasheet'),
    # Legal / IP
    (re.compile(r'/patents?/', re.I), 'legal_ip'),
    (re.compile(r'/legal/', re.I), 'legal_ip'),
    (re.compile(r'/ip/', re.I), 'legal_ip'),
    (re.compile(r'/terms/', re.I), 'legal_ip'),
    (re.compile(r'/privacy/', re.I), 'legal_ip'),
    (re.compile(r'/compliance/', re.I), 'legal_ip'),
    # Marketing
    (re.compile(r'/blog/', re.I), 'marketing'),
    (re.compile(r'/news/', re.I), 'marketing'),
    (re.compile(r'/press/', re.I), 'marketing'),
    (re.compile(r'/marketing/', re.I), 'marketing'),
    (re.compile(r'/brochure/', re.I), 'marketing'),
    (re.compile(r'/case-stud/', re.I), 'marketing'),
    (re.compile(r'/whitepaper/', re.I), 'marketing'),
    (re.compile(r'/white-paper/', re.I), 'marketing'),
    (re.compile(r'/webinar/', re.I), 'marketing'),
]

# Meta keywords that suggest specific categories
META_KEYWORD_PATTERNS = {
    'product_page': ['product', 'buy', 'shop', 'order', 'pricing', 'model', 'sku'],
    'datasheet': ['datasheet', 'data sheet', 'specification', 'specs', 'technical data'],
    'technical_doc': ['documentation', 'manual', 'guide', 'tutorial', 'api', 'reference'],
    'legal_ip': ['patent', 'intellectual property', 'legal', 'trademark', 'copyright'],
    'marketing': ['press release', 'news', 'blog', 'case study', 'whitepaper'],
}


def categorize_link(url, content_type='', meta_description='', meta_keywords=''):
    """
    Categorize a URL using the layered strategy.

    Args:
        url: The URL to categorize
        content_type: MIME type from HTTP response headers
        meta_description: Page meta description (for HTML pages)
        meta_keywords: Page meta keywords (for HTML pages)

    Returns:
        Category string (one of the DiscoveredLink.CATEGORY_CHOICES values)
    """
    parsed = urlparse(url)
    path = parsed.path.lower()

    # Layer 1: File extension
    for ext, category in EXTENSION_MAP.items():
        if path.endswith(ext):
            return category

    # Layer 2: MIME type
    if content_type:
        ct_lower = content_type.lower()
        for mime_prefix, category in MIME_MAP.items():
            if ct_lower.startswith(mime_prefix):
                return category

    # Layer 3: URL path patterns
    for pattern, category in URL_PATTERNS:
        if pattern.search(path):
            return category

    # Layer 4: Meta tag analysis
    if meta_description or meta_keywords:
        combined_meta = f"{meta_description} {meta_keywords}".lower()
        for category, keywords in META_KEYWORD_PATTERNS.items():
            if any(kw in combined_meta for kw in keywords):
                return category

    # Layer 5: Default
    if content_type and content_type.lower().startswith('text/html'):
        return 'page'

    return 'page'


def get_file_extension(url):
    """Extract file extension from URL path."""
    parsed = urlparse(url)
    path = parsed.path.lower()
    # Find last dot in the final path segment
    last_segment = path.rstrip('/').split('/')[-1] if path else ''
    if '.' in last_segment:
        ext = '.' + last_segment.rsplit('.', 1)[-1]
        # Only return known extensions (avoid query params etc.)
        if len(ext) <= 10:
            return ext
    return ''


DOWNLOADABLE_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.odt', '.ods', '.odp', '.rtf', '.csv', '.zip', '.tar', '.gz',
    '.txt', '.xml', '.json',
}


def is_downloadable_doc(url, content_type=''):
    """Check if a URL points to a downloadable document (not just an HTML page)."""
    ext = get_file_extension(url)
    if ext in DOWNLOADABLE_EXTENSIONS:
        return True
    if content_type:
        ct = content_type.lower()
        if any(ct.startswith(prefix) for prefix in [
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats', 'application/vnd.ms-',
            'application/vnd.oasis', 'application/zip',
            'application/x-tar', 'application/gzip',
        ]):
            return True
    return False
