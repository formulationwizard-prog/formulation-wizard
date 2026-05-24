// ============================================================
// govinfo.gov Public Law adapter
// ------------------------------------------------------------
// Fetches Public Law text from govinfo.gov for legislation that
// amends or supplements CFR (e.g., FALCPA PL 108-282, FASTER Act
// PL 117-11). Public laws are stable post-enactment, but new laws
// can amend existing regulations — watch surface is the law list,
// not the law text itself.
//
// MVP scope: fetch + hash the primary Public Law HTML page per entry.
// Amendment watching (new laws referencing CFR sections we watch)
// belongs to a separate Federal Register adapter — defer to Phase 2.
// ============================================================

/**
 * @param {Object} source  Fetcher-specific source descriptor per cfr-watch-list.json
 * @param {string[]} source.publicLaws  e.g., ['108-282', '117-11']
 * @param {string} source.primaryUrl    Canonical URL for content fetch
 * @returns {Promise<import('../fetcher.mjs').RegContent>}
 */
export async function fetchGovinfoPublicLaw(source) {
  const fetchedAt = new Date().toISOString();
  const url = source.primaryUrl;

  const res = await fetch(url, {
    headers: {
      'Accept': 'text/html',
      'User-Agent': 'formulation-wizard cfr-watch/1.0 (regulatory currency monitoring)',
    },
  });

  if (!res.ok) {
    throw new Error(`govinfo fetch failed: ${res.status} ${res.statusText} for ${url}`);
  }

  const html = await res.text();
  // Strip HTML tags + collapse whitespace; same approach as eCFR for hash consistency.
  const body = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    body,
    version: `govinfo public-laws ${source.publicLaws.join(', ')}`,
    sourceUrl: url,
    fetchedAt,
  };
}
