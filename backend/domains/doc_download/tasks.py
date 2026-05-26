"""
Document Download Celery Tasks

Background tasks for website crawling, file downloading, and text extraction.
"""

import asyncio
import logging
import time

from celery import shared_task
from django.core.files.base import ContentFile
from django.utils import timezone

logger = logging.getLogger(__name__)


def _get_job(job_id):
    """Load a CrawlJob by ID."""
    from .models import CrawlJob
    return CrawlJob.objects.get(pk=job_id)


def _check_job_status(job_id):
    """Check if job has been paused or cancelled externally."""
    from .models import CrawlJob
    return CrawlJob.objects.filter(pk=job_id).values_list('status', flat=True).first()


@shared_task(bind=True, name='domains.doc_download.tasks.crawl_website',
             time_limit=1800, soft_time_limit=1740)
def crawl_website(self, job_id, resume=False):
    """
    Crawl a website using Playwright, discovering all links and categorizing them.

    Args:
        job_id: UUID of the CrawlJob
        resume: If True, restore crawl state from saved checkpoint
    """
    from .models import CrawlJob, DiscoveredLink
    from .crawler import WebCrawler
    from .categorizer import categorize_link, get_file_extension, is_downloadable_doc

    job = _get_job(job_id)

    # Don't start if already cancelled
    if job.status in ('cancelled',):
        return {'status': 'cancelled', 'job_id': str(job_id)}

    # Update job status
    job.status = 'crawling'
    job.crawl_task_id = self.request.id or ''
    if not job.started_at:
        job.started_at = timezone.now()
    job.save(update_fields=['status', 'crawl_task_id', 'started_at', 'updated_at'])

    crawler = WebCrawler(
        target_url=job.target_url,
        max_depth=job.max_depth,
        max_pages=job.max_pages,
        allowed_domains=job.allowed_domains,
        url_patterns_include=job.url_patterns_include,
        url_patterns_exclude=job.url_patterns_exclude,
        crawl_delay=job.crawl_delay,
        proxy_url=job.proxy_url,
    )

    # Resume or fresh start
    if resume and job.crawl_queue:
        crawler.restore_state({
            'queue': job.crawl_queue,
            'visited': job.visited_urls,
            'pages_crawled': job.progress.get('pages_crawled', 0),
        })
        logger.info(f"Resuming crawl for job {job_id} with {len(crawler.queue)} queued URLs")
    else:
        crawler.seed_queue()

    start_time = time.time()
    links_buffer = []
    batch_size = 100

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        loop.run_until_complete(crawler.start())

        while crawler.queue and crawler.pages_crawled < crawler.max_pages:
            # Check for pause/cancel every 5 pages
            if crawler.pages_crawled > 0 and crawler.pages_crawled % 5 == 0:
                current_status = _check_job_status(job_id)
                if current_status == 'paused':
                    _save_crawl_state(job, crawler, 'paused')
                    return {'status': 'paused', 'job_id': str(job_id),
                            'pages_crawled': crawler.pages_crawled}
                elif current_status in ('cancelled',):
                    _save_crawl_state(job, crawler, 'cancelled')
                    return {'status': 'cancelled', 'job_id': str(job_id)}

            url, depth, parent_url, link_text = crawler.queue.popleft()

            # Skip if already visited (can happen with resume)
            if url in crawler.visited and url != crawler.target_url:
                continue

            # Check robots.txt
            if not crawler._check_robots(url):
                logger.debug(f"Blocked by robots.txt: {url}")
                continue

            # Check if this is a non-HTML resource
            ext = get_file_extension(url)
            if ext and ext in ('.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
                               '.zip', '.tar', '.gz', '.jpg', '.jpeg', '.png', '.gif',
                               '.svg', '.webp', '.bmp'):
                # HTTP HEAD only — don't render with browser
                head_info = crawler.get_head_info(url)
                category = categorize_link(url, content_type=head_info['content_type'])
                links_buffer.append(DiscoveredLink(
                    job=job,
                    url=url,
                    title=link_text or url.split('/')[-1],
                    link_text=link_text,
                    parent_url=parent_url,
                    depth=depth,
                    category=category,
                    content_type=head_info['content_type'],
                    file_extension=ext,
                    file_size_bytes=head_info['content_length'] or None,
                    has_downloadable_doc=is_downloadable_doc(url, head_info['content_type']),
                ))
                crawler.visited.add(url)
                continue

            # Crawl with Playwright
            result = loop.run_until_complete(crawler.crawl_page(url))
            crawler.visited.add(url)
            crawler.pages_crawled += 1

            if result.is_blocked:
                job.progress['blocked_count'] = job.progress.get('blocked_count', 0) + 1
                job.progress['errors'].append({
                    'url': url, 'error': 'CAPTCHA/bot detection',
                    'timestamp': timezone.now().isoformat(),
                })
                # Don't follow links from blocked pages
            elif result.error:
                job.progress['errors_count'] = job.progress.get('errors_count', 0) + 1
                job.progress['errors'].append({
                    'url': url, 'error': result.error[:200],
                    'timestamp': timezone.now().isoformat(),
                })
                # Keep only last 50 errors
                if len(job.progress['errors']) > 50:
                    job.progress['errors'] = job.progress['errors'][-50:]
            else:
                # Create DiscoveredLink for this page
                category = categorize_link(
                    url, content_type=result.content_type,
                    meta_description=result.meta_description,
                    meta_keywords=result.meta_keywords,
                )
                links_buffer.append(DiscoveredLink(
                    job=job,
                    url=url,
                    title=result.title[:1000],
                    link_text=link_text[:1000],
                    parent_url=parent_url,
                    depth=depth,
                    category=category,
                    content_type=result.content_type,
                    file_extension=get_file_extension(url),
                    meta_description=result.meta_description[:5000] if result.meta_description else '',
                    meta_keywords=result.meta_keywords[:2000] if result.meta_keywords else '',
                    has_downloadable_doc=False,  # This is an HTML page
                ))

                # Enqueue discovered links
                if depth < crawler.max_depth:
                    for link_url, lt in result.links:
                        if link_url not in crawler.visited and crawler._is_allowed_url(link_url):
                            crawler.visited.add(link_url)
                            crawler.queue.append((link_url, depth + 1, url, lt))

            # Batch insert links
            if len(links_buffer) >= batch_size:
                DiscoveredLink.objects.bulk_create(links_buffer, batch_size=batch_size)
                links_buffer.clear()

            # Update progress every 5 pages
            if crawler.pages_crawled % 5 == 0:
                elapsed = time.time() - start_time
                rate = (crawler.pages_crawled / elapsed * 60) if elapsed > 0 else 0
                job.progress.update({
                    'pages_crawled': crawler.pages_crawled,
                    'pages_total': min(len(crawler.queue) + crawler.pages_crawled, crawler.max_pages),
                    'links_discovered': len(crawler.visited),
                    'current_url': url[:500],
                    'crawl_rate_pages_per_min': round(rate, 1),
                })
                # Category counts
                from django.db.models import Count
                cat_counts = dict(
                    DiscoveredLink.objects.filter(job=job)
                    .values_list('category')
                    .annotate(count=Count('id'))
                    .values_list('category', 'count')
                )
                job.progress['category_counts'] = cat_counts
                job.save(update_fields=['progress', 'updated_at'])

                # Checkpoint state every 10 pages
                if crawler.pages_crawled % 10 == 0:
                    state = crawler.save_state()
                    job.crawl_queue = state['queue']
                    job.visited_urls = state['visited']
                    job.save(update_fields=['crawl_queue', 'visited_urls'])

            # Polite delay
            time.sleep(crawler._randomized_delay())

        # Flush remaining links
        if links_buffer:
            DiscoveredLink.objects.bulk_create(links_buffer, batch_size=batch_size)

        # Final progress update
        from django.db.models import Count
        total_links = DiscoveredLink.objects.filter(job=job).count()
        cat_counts = dict(
            DiscoveredLink.objects.filter(job=job)
            .values_list('category')
            .annotate(count=Count('id'))
            .values_list('category', 'count')
        )
        elapsed = time.time() - start_time
        rate = (crawler.pages_crawled / elapsed * 60) if elapsed > 0 else 0

        job.progress.update({
            'pages_crawled': crawler.pages_crawled,
            'links_discovered': total_links,
            'current_url': '',
            'crawl_rate_pages_per_min': round(rate, 1),
            'category_counts': cat_counts,
        })
        job.status = 'discovered'
        job.crawl_queue = []
        job.visited_urls = []
        job.save(update_fields=['status', 'progress', 'crawl_queue', 'visited_urls', 'updated_at'])

        logger.info(f"Crawl completed for job {job_id}: {crawler.pages_crawled} pages, {total_links} links")

        return {
            'status': 'discovered',
            'job_id': str(job_id),
            'pages_crawled': crawler.pages_crawled,
            'links_discovered': total_links,
        }

    except Exception as e:
        logger.exception(f"Crawl failed for job {job_id}: {e}")
        _save_crawl_state(job, crawler, 'failed', error_message=str(e)[:2000])
        raise

    finally:
        loop.run_until_complete(crawler.stop())
        loop.close()


def _save_crawl_state(job, crawler, status, error_message=''):
    """Save crawler state and update job status."""
    state = crawler.save_state()
    job.crawl_queue = state['queue']
    job.visited_urls = state['visited']
    job.status = status
    job.error_message = error_message
    if status == 'paused':
        job.paused_at = timezone.now()
    update_fields = ['status', 'crawl_queue', 'visited_urls', 'error_message', 'updated_at']
    if status == 'paused':
        update_fields.append('paused_at')
    job.save(update_fields=update_fields)


@shared_task(bind=True, name='domains.doc_download.tasks.download_selected_files',
             time_limit=3600, soft_time_limit=3540)
def download_selected_files(self, job_id, resume=False):
    """
    Download all selected files for a crawl job.

    Args:
        job_id: UUID of the CrawlJob
        resume: If True, only download files not yet downloaded
    """
    from .models import CrawlJob, DiscoveredLink, DownloadedFile
    from .crawler import WebCrawler

    job = _get_job(job_id)

    if job.status in ('cancelled',):
        return {'status': 'cancelled', 'job_id': str(job_id)}

    job.status = 'downloading'
    job.download_task_id = self.request.id or ''
    job.save(update_fields=['status', 'download_task_id', 'updated_at'])

    # Get links to download
    links_to_download = DiscoveredLink.objects.filter(
        job=job, is_selected=True, is_downloaded=False
    ).order_by('discovered_at')

    total = links_to_download.count()
    job.progress['files_total'] = total
    job.save(update_fields=['progress', 'updated_at'])

    if total == 0:
        job.status = 'completed'
        job.completed_at = timezone.now()
        job.save(update_fields=['status', 'completed_at', 'updated_at'])
        return {'status': 'completed', 'job_id': str(job_id), 'files_downloaded': 0}

    # Initialize crawler for rendering pages
    crawler = WebCrawler(
        target_url=job.target_url,
        crawl_delay=job.crawl_delay,
        proxy_url=job.proxy_url,
    )

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    browser_started = False

    downloaded_count = 0
    total_size = 0

    try:
        for i, link in enumerate(links_to_download.iterator()):
            # Check for stop every 5 files
            if i > 0 and i % 5 == 0:
                current_status = _check_job_status(job_id)
                if current_status in ('paused', 'cancelled'):
                    job.status = current_status
                    job.save(update_fields=['status', 'updated_at'])
                    return {'status': current_status, 'job_id': str(job_id),
                            'files_downloaded': downloaded_count}

            try:
                if not link.has_downloadable_doc and job.save_rendered_pages:
                    # Render page as HTML + PDF
                    if not browser_started:
                        loop.run_until_complete(crawler.start())
                        browser_started = True

                    html_content, pdf_bytes = loop.run_until_complete(
                        crawler.render_page_to_pdf(link.url)
                    )

                    if html_content:
                        html_bytes = html_content.encode('utf-8')
                        checksum = crawler.compute_checksum(html_bytes)

                        # Check for duplicate
                        if not DownloadedFile.objects.filter(checksum_sha256=checksum, job=job).exists():
                            filename = _sanitize_filename(link.title or link.url, '.html')
                            df = DownloadedFile(
                                link=link,
                                job=job,
                                original_filename=filename,
                                file_size=len(html_bytes),
                                mime_type='text/html',
                                category=link.category,
                                is_rendered_page=True,
                                checksum_sha256=checksum,
                            )
                            df.file.save(filename, ContentFile(html_bytes), save=False)
                            df.save()

                            # Also save PDF if available
                            if pdf_bytes:
                                pdf_filename = _sanitize_filename(link.title or link.url, '.pdf')
                                # Create a separate DownloadedFile for the PDF
                                # but link to the same DiscoveredLink would violate OneToOne
                                # So we store it as the primary and keep HTML as extracted_text
                                df.extracted_text = BeautifulSoup(html_content, 'lxml').get_text(
                                    separator='\n', strip=True
                                )[:50000]
                                df.save(update_fields=['extracted_text'])

                            link.is_downloaded = True
                            link.save(update_fields=['is_downloaded'])
                            downloaded_count += 1
                            total_size += len(html_bytes)

                            job.progress['rendered_pages_saved'] = job.progress.get('rendered_pages_saved', 0) + 1
                else:
                    # Download binary file
                    content, content_type, filename = crawler.download_file(link.url)
                    checksum = crawler.compute_checksum(content)

                    if not DownloadedFile.objects.filter(checksum_sha256=checksum, job=job).exists():
                        filename = _sanitize_filename(filename, get_file_extension(link.url))
                        df = DownloadedFile(
                            link=link,
                            job=job,
                            original_filename=filename,
                            file_size=len(content),
                            mime_type=content_type.split(';')[0].strip(),
                            category=link.category,
                            is_rendered_page=False,
                            checksum_sha256=checksum,
                        )
                        df.file.save(filename, ContentFile(content), save=False)
                        df.save()

                        link.is_downloaded = True
                        link.save(update_fields=['is_downloaded'])
                        downloaded_count += 1
                        total_size += len(content)

                        # Trigger text extraction asynchronously
                        extract_text_content.delay(str(df.pk))

            except Exception as e:
                logger.error(f"Failed to download {link.url}: {e}")
                link.download_error = str(e)[:1000]
                link.save(update_fields=['download_error'])

            # Update progress every 5 files
            if i > 0 and i % 5 == 0:
                job.progress.update({
                    'files_downloaded': downloaded_count,
                    'total_download_size_bytes': total_size,
                })
                job.save(update_fields=['progress', 'updated_at'])

        # Final update
        job.progress.update({
            'files_downloaded': downloaded_count,
            'files_total': total,
            'total_download_size_bytes': total_size,
        })
        job.status = 'completed'
        job.completed_at = timezone.now()
        job.save(update_fields=['status', 'progress', 'completed_at', 'updated_at'])

        logger.info(f"Download completed for job {job_id}: {downloaded_count}/{total} files")

        return {
            'status': 'completed',
            'job_id': str(job_id),
            'files_downloaded': downloaded_count,
            'total_size': total_size,
        }

    except Exception as e:
        logger.exception(f"Download failed for job {job_id}: {e}")
        job.status = 'failed'
        job.error_message = str(e)[:2000]
        job.save(update_fields=['status', 'error_message', 'updated_at'])
        raise

    finally:
        if browser_started:
            loop.run_until_complete(crawler.stop())
        loop.close()


@shared_task(bind=True, name='domains.doc_download.tasks.extract_text_content',
             time_limit=60, soft_time_limit=55)
def extract_text_content(self, file_id):
    """
    Extract searchable text content from a downloaded file.

    Args:
        file_id: UUID of the DownloadedFile
    """
    from .models import DownloadedFile

    try:
        df = DownloadedFile.objects.get(pk=file_id)
    except DownloadedFile.DoesNotExist:
        return

    if df.extracted_text:
        return  # Already extracted

    try:
        mime = df.mime_type.lower()

        if 'html' in mime or df.original_filename.endswith('.html'):
            content = df.file.read().decode('utf-8', errors='ignore')
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(content, 'lxml')
            # Remove script and style elements
            for tag in soup(['script', 'style', 'nav', 'footer', 'header']):
                tag.decompose()
            text = soup.get_text(separator='\n', strip=True)
            df.extracted_text = text[:50000]

        elif 'pdf' in mime or df.original_filename.endswith('.pdf'):
            try:
                import pdfplumber
                with pdfplumber.open(df.file.path) as pdf:
                    pages_text = []
                    for page in pdf.pages[:50]:  # Limit to 50 pages
                        text = page.extract_text()
                        if text:
                            pages_text.append(text)
                    df.extracted_text = '\n\n'.join(pages_text)[:50000]
            except ImportError:
                logger.warning("pdfplumber not installed, skipping PDF text extraction")
            except Exception as e:
                logger.warning(f"PDF text extraction failed for {file_id}: {e}")

        elif 'text/' in mime:
            content = df.file.read().decode('utf-8', errors='ignore')
            df.extracted_text = content[:50000]

        if df.extracted_text:
            df.save(update_fields=['extracted_text'])

    except Exception as e:
        logger.error(f"Text extraction failed for file {file_id}: {e}")


def _sanitize_filename(name, extension=''):
    """Create a safe filename from a title or URL."""
    import re
    # Remove/replace unsafe characters
    safe = re.sub(r'[^\w\s\-.]', '', name)
    safe = re.sub(r'\s+', '_', safe.strip())
    safe = safe[:200]  # Limit length

    if not safe:
        safe = 'download'

    if extension and not safe.endswith(extension):
        safe = safe + extension

    return safe


def get_file_extension(url):
    """Extract file extension from URL."""
    from .categorizer import get_file_extension as _get_ext
    return _get_ext(url)


# Import for use in download task
try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None
