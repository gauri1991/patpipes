"""
FCC Document Scraper

Discovers and downloads FCC exhibit documents for a given FCC ID.
Uses fccid.io as the document source (mirrors official FCC data).
"""

import logging
import re
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

FCCID_IO_BASE = 'https://fccid.io'

USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

# Map fccid.io URL category slugs to our document_type choices
CATEGORY_MAP = {
    'test-report': 'test_report',
    'external-photos': 'external_photos',
    'internal-photos': 'internal_photos',
    'schematics': 'schematics',
    'block-diagram': 'block_diagram',
    'users-manual': 'user_manual',
    'user-manual': 'user_manual',
    'label': 'label',
    'rf-exposure-info': 'sar_report',
    'sar-report': 'sar_report',
    'attestation-statements': 'attestation',
    'letter': 'cover_letter',
    'cover-letter': 'cover_letter',
    'test-setup-photos': 'other',
    'operational-description': 'other',
    'sdr-software-security-inf': 'other',
}


def _categorize_document(url_category, exhibit_name):
    """
    Determine document_type from the fccid.io URL category slug
    and exhibit name.
    """
    slug = url_category.lower()

    # Direct mapping from URL slug
    if slug in CATEGORY_MAP:
        return CATEGORY_MAP[slug]

    # Fallback: check exhibit name
    name_lower = exhibit_name.lower()
    if 'test report' in name_lower or 'testrpt' in name_lower:
        return 'test_report'
    if 'external photo' in name_lower:
        return 'external_photos'
    if 'internal photo' in name_lower:
        return 'internal_photos'
    if 'schematic' in name_lower:
        return 'schematics'
    if 'block diagram' in name_lower:
        return 'block_diagram'
    if 'user manual' in name_lower or 'user guide' in name_lower:
        return 'user_manual'
    if 'label' in name_lower:
        return 'label'
    if 'sar' in name_lower or 'mpe' in name_lower or 'rf exposure' in name_lower:
        return 'sar_report'
    if 'attestation' in name_lower:
        return 'attestation'
    if 'cover letter' in name_lower or 'authorization' in name_lower or 'poa' in name_lower:
        return 'cover_letter'

    return 'other'


class FCCDocumentScraper:
    """Scrapes fccid.io to discover and download FCC exhibit documents."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        })

    def discover_documents(self, fcc_id):
        """
        Discover all exhibit documents for an FCC ID from fccid.io.

        Args:
            fcc_id: The FCC ID (e.g., 'UXX-S5A950A')

        Returns:
            List of dicts: [{exhibit_name, document_url, document_type, category_slug}, ...]
        """
        url = f"{FCCID_IO_BASE}/{fcc_id}"
        logger.info(f"Scraping fccid.io for FCC ID: {fcc_id}")

        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as e:
            logger.error(f"Failed to fetch fccid.io page for {fcc_id}: {e}")
            raise

        soup = BeautifulSoup(response.text, 'lxml')

        # Find the Exhibits section
        exhibit_section = soup.find(id='Exhibits')
        if not exhibit_section:
            logger.warning(f"No Exhibits section found for {fcc_id}")
            return []

        # Walk up to the parent container that holds all exhibit tables
        parent = exhibit_section.parent
        if not parent:
            return []

        # Extract all document links
        all_links = parent.find_all('a', href=True)
        seen_urls = set()
        documents = []

        fcc_id_prefix = f"{FCCID_IO_BASE}/{fcc_id}/"

        for link in all_links:
            href = link['href']
            text = link.get_text(strip=True)

            # Only process links that point to fccid.io document pages
            if not href.startswith(fcc_id_prefix):
                continue

            # Deduplicate
            if href in seen_urls:
                continue
            seen_urls.add(href)

            # Extract category from URL path: /FCC_ID/Category/Name-ID
            relative = href.replace(fcc_id_prefix, '')
            parts = relative.split('/')
            category_slug = parts[0] if parts else 'Unknown'

            document_type = _categorize_document(category_slug, text)

            documents.append({
                'exhibit_name': text,
                'document_url': href,
                'document_type': document_type,
                'category_slug': category_slug,
            })

        logger.info(f"Discovered {len(documents)} documents for {fcc_id}")
        return documents

    def download_document(self, document_url):
        """
        Download a document file from fccid.io.

        fccid.io document URLs are HTML pages that embed the actual file.
        The direct PDF/file download URL is: {page_url}.pdf
        For photos, the URL pattern may differ.

        Args:
            document_url: The fccid.io document page URL
                e.g., https://fccid.io/UXX-S5A950A/Users-Manual/User-Manual-4617910

        Returns:
            Tuple of (content_bytes, filename, mime_type)
        """
        logger.info(f"Downloading document: {document_url}")

        # Try direct PDF URL first (most common): append .pdf to page URL
        pdf_url = document_url.rstrip('/') + '.pdf'

        urls_to_try = [pdf_url, document_url]

        for url in urls_to_try:
            try:
                response = self.session.get(url, timeout=60, stream=True)
                response.raise_for_status()

                mime_type = response.headers.get('content-type', 'application/octet-stream')
                mime_type = mime_type.split(';')[0].strip()

                # Skip if we got an HTML page instead of a file
                if 'text/html' in mime_type:
                    # Try to extract the actual file URL from the HTML page
                    html_content = response.text if hasattr(response, 'text') else b''.join(response.iter_content()).decode('utf-8', errors='ignore')
                    extracted_url = self._extract_file_url_from_page(html_content, document_url)
                    if extracted_url and extracted_url != url:
                        # Try the extracted URL
                        try:
                            file_resp = self.session.get(extracted_url, timeout=60, stream=True)
                            file_resp.raise_for_status()
                            file_mime = file_resp.headers.get('content-type', '').split(';')[0].strip()
                            if 'text/html' not in file_mime:
                                response = file_resp
                                mime_type = file_mime
                                url = extracted_url
                            else:
                                continue
                        except Exception:
                            continue
                    else:
                        continue

                # We have the actual file — read it
                chunks = []
                total = 0
                max_size = 100 * 1024 * 1024
                for chunk in response.iter_content(chunk_size=8192):
                    total += len(chunk)
                    if total > max_size:
                        raise ValueError("File exceeds 100MB limit")
                    chunks.append(chunk)

                content = b''.join(chunks)

                # Build filename
                filename = 'document'
                content_disp = response.headers.get('content-disposition', '')
                if 'filename=' in content_disp:
                    match = re.search(r'filename[*]?=["\']?([^"\';\n]+)', content_disp)
                    if match:
                        filename = match.group(1).strip()
                else:
                    url_path = url.rstrip('/').split('/')[-1]
                    if '.' in url_path:
                        filename = url_path
                    else:
                        ext_map = {
                            'application/pdf': '.pdf',
                            'image/jpeg': '.jpg',
                            'image/png': '.png',
                        }
                        ext = ext_map.get(mime_type, '.bin')
                        filename = f"{url_path}{ext}"

                logger.info(f"Downloaded {len(content)} bytes from {url} (type: {mime_type})")
                return content, filename, mime_type

            except requests.RequestException as e:
                logger.warning(f"Failed to download from {url}: {e}")
                continue

        raise RuntimeError(f"Could not download document from any URL for {document_url}")

    def _extract_file_url_from_page(self, html_content, base_url):
        """Extract actual file download URL from an fccid.io document page."""
        soup = BeautifulSoup(html_content, 'lxml')

        # Check for embed/object/iframe with PDF
        for tag in soup.find_all(['embed', 'object', 'iframe']):
            src = tag.get('src') or tag.get('data') or ''
            if src and ('pdf' in src.lower() or 'attachment' in src.lower()):
                return urljoin(base_url, src)

        # Check for direct download links pointing to FCC or PDF files
        for link in soup.find_all('a', href=True):
            href = link['href']
            if '.pdf' in href.lower() or 'apps.fcc.gov' in href:
                return urljoin(base_url, href)

        # Check for large images (photo exhibits)
        for img in soup.find_all('img'):
            src = img.get('src', '')
            if src and ('/document/' in src or 'nativeSize' in str(img.attrs)):
                return urljoin(base_url, src)

        return None
