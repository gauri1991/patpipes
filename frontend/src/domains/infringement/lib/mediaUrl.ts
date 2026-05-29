/**
 * Resolve a backend media URL the browser can actually load.
 *
 * The API serializes file/image fields with request.build_absolute_uri, whose host/scheme
 * depend on how Django saw the request — behind a TLS-terminating proxy that can come out
 * as `http://…` and get blocked as mixed content on an HTTPS site. We instead point media
 * at the SAME public backend origin the browser already uses for API calls
 * (NEXT_PUBLIC_API_URL) — proven reachable, CORS-allowed, and correct scheme.
 *
 * `http://1.2.3.4:8000/media/x.pdf`  ->  `https://api.example.com/media/x.pdf`
 * (when NEXT_PUBLIC_API_URL = https://api.example.com/api/v1)
 * Non-media / already-correct URLs are returned unchanged.
 */
function backendOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  try {
    return base ? new URL(base).origin : '';
  } catch {
    return '';
  }
}

export function toMediaUrl(url?: string | null): string {
  if (!url) return '';
  const i = url.indexOf('/media/');
  if (i === -1) return url;            // not a media URL — leave as-is
  const path = url.slice(i);           // /media/...
  const origin = backendOrigin();
  return origin ? origin + path : url; // fall back to the original if we can't resolve origin
}
