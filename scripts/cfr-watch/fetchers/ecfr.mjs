// ============================================================
// eCFR Versioner API adapter
// ------------------------------------------------------------
// Fetches structured section text from the eCFR Versioner API.
// API base: https://www.ecfr.gov/api/versioner/v1
// Returns plain-text body suitable for hashing + diffing.
// ============================================================

const ECFR_BASE = 'https://www.ecfr.gov/api/versioner/v1';

const HEADERS = {
  'Accept': 'application/xml',
  'User-Agent': 'formulation-wizard cfr-watch/1.0 (regulatory currency monitoring)',
};

// Cache title-currency lookups within a single run — each Title needs
// only one /titles fetch even when multiple sections of that title are
// being watched.
const titleDateCache = new Map();

/**
 * Look up the eCFR "up_to_date_as_of" date for a given title number.
 * The Versioner API requires a date in URL path that matches a published
 * version — today's date will often 404 because eCFR confirms currency
 * with a few days' lag from real-world date.
 */
async function resolveCurrentDate(titleNumber) {
  if (titleDateCache.has(titleNumber)) return titleDateCache.get(titleNumber);

  const res = await fetch(`${ECFR_BASE}/titles`, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`eCFR /titles fetch failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const titleMeta = json.titles.find(t => t.number === titleNumber);
  if (!titleMeta) {
    throw new Error(`eCFR /titles returned no entry for title ${titleNumber}`);
  }
  if (!titleMeta.up_to_date_as_of) {
    throw new Error(`Title ${titleNumber} has no up_to_date_as_of (reserved or unpublished)`);
  }
  titleDateCache.set(titleNumber, titleMeta.up_to_date_as_of);
  return titleMeta.up_to_date_as_of;
}

/**
 * Build the eCFR API URL for a single section.
 *
 * Example: 21 CFR 101.9 →
 *   /full/2026-05-21/title-21.xml?chapter=I&part=101&section=101.9
 *
 * Subpart is intentionally omitted from the query — the API filters
 * by section directly and including subpart returns 404 in some cases
 * (observed: 21 CFR 101.9 with subpart=A fails; without subpart succeeds).
 */
function buildUrl(source, date) {
  const params = new URLSearchParams();
  if (source.chapter) params.set('chapter', String(source.chapter));
  if (source.part) params.set('part', String(source.part));
  if (source.section) params.set('section', String(source.section));
  return `${ECFR_BASE}/full/${date}/title-${source.title}.xml?${params.toString()}`;
}

/**
 * Strip XML tags + collapse whitespace to produce a plain-text body
 * suitable for content hashing. Preserves paragraph structure via
 * single newlines but discards formatting/attribute noise.
 */
function xmlToText(xml) {
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {Object} source  Fetcher-specific source descriptor per cfr-watch-list.json
 * @returns {Promise<import('../fetcher.mjs').RegContent>}
 */
export async function fetchEcfrSection(source) {
  const fetchedAt = new Date().toISOString();
  const effectiveDate = await resolveCurrentDate(source.title);
  const url = buildUrl(source, effectiveDate);

  const res = await fetch(url, { headers: HEADERS });

  if (!res.ok) {
    throw new Error(`eCFR fetch failed: ${res.status} ${res.statusText} for ${url}`);
  }

  const xml = await res.text();
  const body = xmlToText(xml);

  return {
    body,
    version: `eCFR effective ${effectiveDate}`,
    sourceUrl: url,
    fetchedAt,
  };
}
