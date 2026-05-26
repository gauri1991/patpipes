/**
 * Google CSE Client-Side Search
 *
 * Uses the Google CSE Widget JavaScript API (cse.js) to execute searches.
 * Renders results into a hidden off-screen container, then extracts
 * structured data from the DOM via MutationObserver.
 *
 * Only needs a CX ID — no API key, no daily quota.
 *
 * Based on the approach used by the googly project.
 */

export interface CseAdvancedParams {
  site_filter?: string;
  file_type?: string;
  date_restrict?: string;
  exact_terms?: string;
  exclude_terms?: string;
}

/** Convert a dateRestrict code to an `after:YYYY-MM-DD` query operator */
function dateRestrictToAfterDate(code: string): string | null {
  const now = new Date();
  const map: Record<string, () => Date> = {
    d1: () => new Date(now.getTime() - 86400000),
    w1: () => new Date(now.getTime() - 7 * 86400000),
    m1: () => { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; },
    m3: () => { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d; },
    m6: () => { const d = new Date(now); d.setMonth(d.getMonth() - 6); return d; },
    y1: () => { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; },
  };
  const fn = map[code];
  if (!fn) return null;
  const d = fn();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Build a full CSE query string by appending Google search operators for advanced params */
export function buildCseQueryString(baseQuery: string, params: CseAdvancedParams): string {
  let q = baseQuery.trim();
  if (params.site_filter?.trim()) {
    q += ` site:${params.site_filter.trim()}`;
  }
  if (params.file_type?.trim()) {
    q += ` filetype:${params.file_type.trim()}`;
  }
  if (params.exact_terms?.trim()) {
    q += ` "${params.exact_terms.trim()}"`;
  }
  if (params.exclude_terms?.trim()) {
    const terms = params.exclude_terms.trim().split(/\s+/);
    q += terms.map(t => ` -${t}`).join('');
  }
  if (params.date_restrict?.trim()) {
    const afterDate = dateRestrictToAfterDate(params.date_restrict.trim());
    if (afterDate) q += ` after:${afterDate}`;
  }
  return q;
}

export interface CseResult {
  title: string;
  url: string;
  snippet: string;
  displayLink: string;
  visibleUrl: string;
  thumbnailUrl: string | null;
}

export interface CseSearchResponse {
  results: CseResult[];
  totalResults: string;
}

const CONTAINER_ID = 'google-cse-container';
const RESULTS_TIMEOUT = 8000; // 8s hard timeout (matches googly)
const DEBOUNCE_MS = 800; // Wait for DOM to stabilize

let scriptLoaded = false;
let scriptLoading: Promise<void> | null = null;
let cachedElement: { execute: (q: string) => void; clearAllResults: () => void } | null = null;

declare global {
  interface Window {
    __gcse?: {
      parsetags: string;
      callback: () => void;
    };
    google?: {
      search?: {
        cse?: {
          element?: {
            go?: (containerId: string) => void;
            render?: (config: Record<string, unknown>) => void;
            getElement?: (name: string) => {
              execute: (query: string) => void;
              clearAllResults: () => void;
            } | null;
          };
        };
      };
    };
  }
}

/** Ensure the hidden off-screen container exists */
function ensureContainer(): HTMLDivElement {
  let el = document.getElementById(CONTAINER_ID) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = CONTAINER_ID;
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, {
      position: 'fixed',
      left: '-9999px',
      top: '0',
      width: '800px',
      height: '600px',
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: '-1',
    });
    document.body.appendChild(el);
  }
  return el;
}

/** Load the Google CSE script */
function loadCseScript(cxId: string): Promise<void> {
  if (scriptLoaded && window.google?.search?.cse?.element) {
    return Promise.resolve();
  }

  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise<void>((resolve, reject) => {
    window.__gcse = {
      parsetags: 'explicit',
      callback: () => {
        scriptLoaded = true;
        resolve();
      },
    };

    const existing = document.querySelector('script[src*="cse.google.com/cse.js"]');
    if (existing) {
      if (window.google?.search?.cse?.element) {
        scriptLoaded = true;
        resolve();
      } else {
        existing.addEventListener('load', () => {
          setTimeout(() => {
            scriptLoaded = true;
            resolve();
          }, 500);
        });
        existing.addEventListener('error', () => reject(new Error('CSE script load failed')));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = `https://cse.google.com/cse.js?cx=${cxId}`;
    script.async = true;
    script.addEventListener('error', () => {
      scriptLoading = null;
      reject(new Error('Failed to load Google CSE script'));
    });
    document.head.appendChild(script);
  });

  return scriptLoading;
}

/** Get or create the CSE widget element. Reuses across searches. */
function getOrCreateElement(container: HTMLDivElement): typeof cachedElement {
  const cse = window.google?.search?.cse?.element;
  if (!cse) return null;

  // Try to reuse cached element
  if (cachedElement) return cachedElement;

  // Check if widget div already exists
  let widgetDiv = container.querySelector('.gcse-searchresults-only');
  if (!widgetDiv) {
    widgetDiv = document.createElement('div');
    widgetDiv.className = 'gcse-searchresults-only';
    widgetDiv.setAttribute('data-queryParameterName', 'q');
    container.appendChild(widgetDiv);
    cse.go?.(CONTAINER_ID);
  }

  // Find the element — try searchresults-only0 first (most common)
  for (let i = 0; i < 20; i++) {
    const el = cse.getElement?.(`searchresults-only${i}`);
    if (el) {
      cachedElement = el;
      return el;
    }
  }

  return null;
}

/** Extract structured results from the CSE widget DOM */
function extractResults(container: HTMLElement): { results: CseResult[]; totalResults: string } {
  const results: CseResult[] = [];

  const resultEls = container.querySelectorAll(
    '.gsc-webResult .gsc-result, .gsc-webResult .gs-result'
  );

  let totalResults = '0';
  const infoEl = container.querySelector('.gsc-result-info');
  if (infoEl?.textContent) {
    const match = infoEl.textContent.match(/[\d,]+/);
    if (match) totalResults = match[0].replace(/,/g, '');
  }

  resultEls.forEach((el) => {
    const titleEl = el.querySelector('a.gs-title') || el.querySelector('.gs-title a');
    const snippetEl = el.querySelector('.gs-snippet');
    const urlEl = el.querySelector('.gs-visibleUrl-long') || el.querySelector('.gs-visibleUrl');

    const title = titleEl?.textContent?.trim() || '';
    let url = titleEl?.getAttribute('href') || titleEl?.getAttribute('data-ctorig') || '';
    const snippet = snippetEl?.textContent?.trim() || '';
    const displayUrl = urlEl?.textContent?.trim() || '';

    if (url.includes('google.com/url')) {
      try {
        const parsed = new URL(url);
        url = parsed.searchParams.get('url') || parsed.searchParams.get('q') || url;
      } catch {
        // keep original
      }
    }

    if (title && url && url.startsWith('http')) {
      results.push({
        title,
        url,
        snippet,
        displayLink: displayUrl,
        visibleUrl: displayUrl,
        thumbnailUrl: null,
      });
    }
  });

  return { results, totalResults };
}

/** Check if the CSE widget is showing a "no results" state */
function hasNoResultsIndicator(container: HTMLElement): boolean {
  if (container.querySelector('.gs-no-results-result')) return true;
  const resultInfo = container.querySelector('.gsc-result-info');
  if (resultInfo?.textContent?.toLowerCase().includes('did not match')) return true;
  if (resultInfo?.textContent?.match(/\b0\s+results/i)) return true;
  return false;
}

let searchCounter = 0;

/**
 * Execute a search via Google CSE widget.
 * Loads cse.js, renders into a hidden container, extracts results from DOM.
 */
export function cseSearch(
  cxId: string,
  query: string,
  advanced?: CseAdvancedParams
): Promise<CseSearchResponse> {
  const fullQuery = advanced ? buildCseQueryString(query, advanced) : query;
  const searchId = ++searchCounter;

  return new Promise(async (resolve) => {
    try {
      // Clean up any CSE hash fragments
      if (window.location.hash.includes('gsc.')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      await loadCseScript(cxId);

      const container = ensureContainer();
      const cse = window.google?.search?.cse?.element;
      if (!cse) {
        resolve({ results: [], totalResults: '0' });
        return;
      }

      // Get or create element — first time needs go() + wait, subsequent reuses cache
      let element = getOrCreateElement(container);
      if (!element) {
        // First time: go() was just called, wait briefly then retry
        await new Promise(r => setTimeout(r, 300));
        element = getOrCreateElement(container);
      }

      if (!element) {
        console.warn(`[CSE #${searchId}] Could not find CSE element`);
        resolve({ results: [], totalResults: '0' });
        return;
      }

      let observer: MutationObserver | null = null;
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      let lastCount = 0;
      let resolved = false;
      let mutationCount = 0;

      function doResolve(extracted: CseSearchResponse) {
        if (resolved) return;
        resolved = true;
        cleanup();
        console.log(`[CSE #${searchId}] "${fullQuery}" → ${extracted.results.length} results`);
        resolve(extracted);
      }

      function cleanup() {
        if (observer) observer.disconnect();
        if (debounceTimer) clearTimeout(debounceTimer);
        if (hardTimeout) clearTimeout(hardTimeout);
      }

      // Hard timeout — extract whatever we have
      const hardTimeout = setTimeout(() => {
        if (hasNoResultsIndicator(container)) {
          doResolve({ results: [], totalResults: '0' });
          return;
        }
        const extracted = extractResults(container);
        doResolve(extracted);
      }, RESULTS_TIMEOUT);

      // Watch for DOM mutations (results rendering)
      observer = new MutationObserver(() => {
        if (resolved) return;
        mutationCount++;
        if (debounceTimer) clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
          if (resolved) return;

          if (mutationCount >= 5 && hasNoResultsIndicator(container)) {
            doResolve({ results: [], totalResults: '0' });
            return;
          }

          const extracted = extractResults(container);
          if (extracted.results.length > 0) {
            if (extracted.results.length === lastCount) {
              doResolve(extracted);
            } else {
              lastCount = extracted.results.length;
            }
          }
        }, DEBOUNCE_MS);
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      // Execute the search — reuses existing widget
      element.execute(fullQuery);

      // Clean up hash after search
      setTimeout(() => {
        if (window.location.hash.includes('gsc.')) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }, 1000);

    } catch (err) {
      console.error(`[CSE #${searchId}] Error:`, err);
      resolve({ results: [], totalResults: '0' });
    }
  });
}
