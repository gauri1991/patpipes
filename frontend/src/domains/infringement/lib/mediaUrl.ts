/**
 * Rewrite an absolute backend media URL to a same-origin relative path.
 *
 * The API serializes file/image fields as absolute URLs (request.build_absolute_uri),
 * e.g. `http://147.93.96.76:8000/media/...` or `https://api.patpipes.com/media/...`.
 * Fetching those from the frontend origin is cross-origin and, on an HTTPS site with an
 * HTTP backend URL, blocked as mixed content. Collapsing to `/media/...` lets the browser
 * hit the frontend origin, which proxies `/media/*` to the backend (see next.config.ts) —
 * same-origin, no CORS, no mixed content. Non-media / already-relative URLs pass through.
 */
export function toMediaPath(url?: string | null): string {
  if (!url) return '';
  const idx = url.indexOf('/media/');
  if (idx === -1) return url;          // not a media URL — leave as-is
  if (url.startsWith('/')) return url; // already relative
  return url.slice(idx);               // strip scheme + host, keep /media/...
}
