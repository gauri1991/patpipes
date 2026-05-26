"""
Playwright-based Web Crawler Engine

Uses headless Chromium to render JavaScript content, with full stealth suite
for anti-bot detection and BFS crawl with resume support.
"""

import hashlib
import logging
import random
import re
import time
from collections import deque
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

from .categorizer import categorize_link, get_file_extension, is_downloadable_doc

logger = logging.getLogger(__name__)

# Realistic User-Agent pool
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
]

# CAPTCHA detection patterns
CAPTCHA_PATTERNS = [
    re.compile(r'captcha', re.I),
    re.compile(r'recaptcha', re.I),
    re.compile(r'hcaptcha', re.I),
    re.compile(r'challenge.*required', re.I),
    re.compile(r'verify.*human', re.I),
    re.compile(r'bot.*detection', re.I),
    re.compile(r'access.*denied.*automated', re.I),
]


class CrawlResult:
    """Result of crawling a single page."""

    def __init__(self, url, title='', meta_description='', meta_keywords='',
                 content_type='', links=None, html_content='', error=None, is_blocked=False):
        self.url = url
        self.title = title
        self.meta_description = meta_description
        self.meta_keywords = meta_keywords
        self.content_type = content_type
        self.links = links or []  # List of (url, link_text) tuples
        self.html_content = html_content
        self.error = error
        self.is_blocked = is_blocked


class WebCrawler:
    """
    Playwright-based web crawler with BFS traversal, stealth, and resume support.
    """

    def __init__(self, target_url, max_depth=2, max_pages=100,
                 allowed_domains=None, url_patterns_include=None,
                 url_patterns_exclude=None, crawl_delay=2.0, proxy_url=''):
        self.target_url = target_url
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.allowed_domains = set(allowed_domains or [])
        self.crawl_delay = crawl_delay
        self.proxy_url = proxy_url

        # Compile URL patterns
        self.include_patterns = [re.compile(p) for p in (url_patterns_include or [])]
        self.exclude_patterns = [re.compile(p) for p in (url_patterns_exclude or [])]

        # BFS state
        self.queue = deque()  # (url, depth, parent_url, link_text)
        self.visited = set()
        self.pages_crawled = 0

        # Playwright state
        self._browser = None
        self._context = None
        self._page = None

        # robots.txt cache
        self._robots_cache = {}

        # Auto-populate allowed domains from target URL
        if not self.allowed_domains:
            parsed = urlparse(target_url)
            if parsed.hostname:
                self.allowed_domains.add(parsed.hostname)

    async def start(self):
        """Launch Playwright browser."""
        from playwright.async_api import async_playwright

        self._playwright = await async_playwright().start()

        launch_args = {
            'headless': True,
            'args': [
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
            ],
        }
        if self.proxy_url:
            launch_args['proxy'] = {'server': self.proxy_url}

        self._browser = await self._playwright.chromium.launch(**launch_args)

        ua = random.choice(USER_AGENTS)
        self._context = await self._browser.new_context(
            user_agent=ua,
            viewport={'width': 1920, 'height': 1080},
            java_script_enabled=True,
        )

        # Apply stealth patches
        try:
            from playwright_stealth import stealth_async
            await stealth_async(self._context)
        except ImportError:
            logger.warning("playwright-stealth not installed, proceeding without stealth patches")

        self._page = await self._context.new_page()

    async def stop(self):
        """Close browser and cleanup."""
        if self._page:
            await self._page.close()
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()

    def save_state(self):
        """Serialize BFS state for resume support."""
        return {
            'queue': list(self.queue),
            'visited': list(self.visited),
            'pages_crawled': self.pages_crawled,
        }

    def restore_state(self, state):
        """Restore BFS state from saved checkpoint."""
        self.queue = deque(tuple(item) for item in state.get('queue', []))
        self.visited = set(state.get('visited', []))
        self.pages_crawled = state.get('pages_crawled', 0)

    def seed_queue(self):
        """Initialize the BFS queue with the target URL."""
        self.queue.append((self.target_url, 0, '', ''))
        self.visited.add(self.target_url)

    def _is_allowed_url(self, url):
        """Check if URL passes all filtering rules."""
        parsed = urlparse(url)

        # Must be http/https
        if parsed.scheme not in ('http', 'https'):
            return False

        # Must be in allowed domains
        if self.allowed_domains and parsed.hostname not in self.allowed_domains:
            return False

        # Check include patterns (if any specified, URL must match at least one)
        if self.include_patterns:
            if not any(p.search(url) for p in self.include_patterns):
                return False

        # Check exclude patterns (URL must not match any)
        if self.exclude_patterns:
            if any(p.search(url) for p in self.exclude_patterns):
                return False

        # Skip common non-content URLs
        skip_patterns = [
            r'#', r'javascript:', r'mailto:', r'tel:',
            r'\.(css|js|woff2?|ttf|eot)(\?|$)',
            r'/login', r'/signin', r'/signup', r'/register',
            r'/cart', r'/checkout', r'/account',
        ]
        path_and_fragment = url.lower()
        for pattern in skip_patterns:
            if re.search(pattern, path_and_fragment):
                return False

        return True

    def _check_robots(self, url):
        """Check if URL is allowed by robots.txt."""
        parsed = urlparse(url)
        robots_url = f"{parsed.scheme}://{parsed.hostname}/robots.txt"

        if robots_url not in self._robots_cache:
            rp = RobotFileParser()
            try:
                rp.set_url(robots_url)
                rp.read()
                self._robots_cache[robots_url] = rp
            except Exception:
                # If we can't read robots.txt, allow all
                self._robots_cache[robots_url] = None

        rp = self._robots_cache[robots_url]
        if rp is None:
            return True
        return rp.can_fetch('*', url)

    def _is_captcha_page(self, html_content, title):
        """Detect if the page is a CAPTCHA or bot-detection challenge."""
        text_to_check = f"{title} {html_content[:5000]}"
        return any(p.search(text_to_check) for p in CAPTCHA_PATTERNS)

    def _randomized_delay(self):
        """Get a randomized crawl delay (±30%)."""
        jitter = self.crawl_delay * 0.3
        return self.crawl_delay + random.uniform(-jitter, jitter)

    async def crawl_page(self, url):
        """
        Crawl a single page using Playwright.

        Returns a CrawlResult with extracted links and metadata.
        """
        try:
            # Rotate User-Agent periodically
            if self.pages_crawled % 10 == 0 and self._context:
                ua = random.choice(USER_AGENTS)
                # Can't change UA on existing context, but we set a good one at start

            response = await self._page.goto(url, wait_until='networkidle', timeout=30000)

            if not response:
                return CrawlResult(url, error='No response received')

            status = response.status
            content_type = response.headers.get('content-type', '')

            if status == 429:
                # Rate limited — respect Retry-After
                retry_after = response.headers.get('retry-after', '60')
                return CrawlResult(url, error=f'Rate limited (429). Retry-After: {retry_after}')

            if status >= 400:
                return CrawlResult(url, error=f'HTTP {status}')

            # Get rendered HTML
            html_content = await self._page.content()
            title = await self._page.title()

            # Check for CAPTCHA
            if self._is_captcha_page(html_content, title):
                return CrawlResult(url, title=title, is_blocked=True,
                                   error='CAPTCHA/bot detection page')

            # Parse with BeautifulSoup
            soup = BeautifulSoup(html_content, 'lxml')

            # Extract meta tags
            meta_desc = ''
            meta_kw = ''
            desc_tag = soup.find('meta', attrs={'name': 'description'})
            if desc_tag:
                meta_desc = desc_tag.get('content', '')
            kw_tag = soup.find('meta', attrs={'name': 'keywords'})
            if kw_tag:
                meta_kw = kw_tag.get('content', '')

            # Extract all links
            links = []
            seen_urls = set()

            for tag in soup.find_all(['a', 'link', 'img', 'embed', 'source']):
                href = tag.get('href') or tag.get('src') or ''
                if not href:
                    continue

                # Resolve relative URLs
                absolute_url = urljoin(url, href)
                # Normalize: remove fragment
                parsed = urlparse(absolute_url)
                normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                if parsed.query:
                    normalized += f"?{parsed.query}"

                if normalized in seen_urls:
                    continue
                seen_urls.add(normalized)

                link_text = tag.get_text(strip=True) if tag.name == 'a' else tag.get('alt', '')
                links.append((normalized, link_text[:1000]))

            return CrawlResult(
                url=url,
                title=title,
                meta_description=meta_desc,
                meta_keywords=meta_kw,
                content_type=content_type,
                links=links,
                html_content=html_content,
            )

        except Exception as e:
            error_msg = str(e)
            if 'Timeout' in error_msg:
                error_msg = f'Timeout loading page (30s): {error_msg[:200]}'
            return CrawlResult(url, error=error_msg[:500])

    def get_head_info(self, url):
        """
        HTTP HEAD request for non-HTML URLs to get content type and size.
        Uses requests (not Playwright) for efficiency.
        """
        try:
            headers = {'User-Agent': random.choice(USER_AGENTS)}
            resp = requests.head(url, headers=headers, timeout=10, allow_redirects=True)
            return {
                'content_type': resp.headers.get('content-type', ''),
                'content_length': int(resp.headers.get('content-length', 0)),
            }
        except Exception:
            return {'content_type': '', 'content_length': 0}

    async def render_page_to_pdf(self, url):
        """Render a page and return (html_content, pdf_bytes)."""
        try:
            await self._page.goto(url, wait_until='networkidle', timeout=30000)
            html_content = await self._page.content()
            pdf_bytes = await self._page.pdf(
                format='A4',
                print_background=True,
                margin={'top': '1cm', 'right': '1cm', 'bottom': '1cm', 'left': '1cm'},
            )
            return html_content, pdf_bytes
        except Exception as e:
            logger.error(f"Failed to render page to PDF: {url} - {e}")
            return None, None

    def compute_checksum(self, data):
        """Compute SHA-256 checksum of bytes data."""
        if isinstance(data, str):
            data = data.encode('utf-8')
        return hashlib.sha256(data).hexdigest()

    def download_file(self, url):
        """
        Download a file via streaming HTTP GET.
        Returns (content_bytes, content_type, filename).
        """
        try:
            headers = {'User-Agent': random.choice(USER_AGENTS)}
            resp = requests.get(url, headers=headers, timeout=60, stream=True,
                                allow_redirects=True)
            resp.raise_for_status()

            content_type = resp.headers.get('content-type', 'application/octet-stream')

            # Build filename
            parsed = urlparse(url)
            filename = parsed.path.rstrip('/').split('/')[-1] or 'index.html'

            # Stream to memory (with size limit of 100MB)
            chunks = []
            total = 0
            max_size = 100 * 1024 * 1024
            for chunk in resp.iter_content(chunk_size=8192):
                total += len(chunk)
                if total > max_size:
                    raise ValueError(f"File exceeds 100MB limit: {url}")
                chunks.append(chunk)

            content = b''.join(chunks)
            return content, content_type, filename

        except Exception as e:
            logger.error(f"Failed to download file: {url} - {e}")
            raise
