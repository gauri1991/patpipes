/**
 * Strip inline HTML/XML markup from claim text.
 *
 * USPTO claim XML carries inline tags (e.g. `<b>1</b>.` for the claim number,
 * `<i>`, `<sub>`, `<sup>`). The current backend parser removes them, but claims
 * imported by older parser versions can still have raw tags stored. Stripping at
 * display time keeps the UI clean regardless of when/how the text was imported.
 */
export function stripClaimMarkup(text?: string | null): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')   // drop tags like <b>, </b>, <sub>
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}
