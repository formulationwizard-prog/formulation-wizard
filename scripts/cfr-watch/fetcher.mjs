// ============================================================
// RegSourceFetcher interface + dispatcher
// ------------------------------------------------------------
// Pluggable adapter pattern per Opus routing 2026-05-25 — supports
// federal (eCFR) MVP today; extensible to state (CA Prop 65 portal),
// international (EUR-Lex, CFIA), and other regulatory sources by
// adding new adapters in ./fetchers/*.mjs and registering below.
// ============================================================

import { fetchEcfrSection } from './fetchers/ecfr.mjs';
import { fetchGovinfoPublicLaw } from './fetchers/govinfo.mjs';

/**
 * @typedef {Object} RegContent
 * @property {string} body           Plain-text or structured content used for hashing + diff
 * @property {string} version        Source-reported version (e.g., eCFR effective date, govinfo timestamp)
 * @property {string} sourceUrl      Canonical URL for the fetched content
 * @property {string} fetchedAt      ISO timestamp when fetch completed
 */

/**
 * @typedef {Object} WatchEntry
 * @property {string} id
 * @property {string} citation
 * @property {string} shortName
 * @property {'ecfr' | 'govinfo'} fetcher
 * @property {Object} source         Fetcher-specific source descriptor
 */

const ADAPTERS = {
  ecfr: fetchEcfrSection,
  govinfo: fetchGovinfoPublicLaw,
};

/**
 * Dispatch fetch to the registered adapter for this entry.
 *
 * @param {WatchEntry} entry
 * @returns {Promise<RegContent>}
 */
export async function fetchRegContent(entry) {
  const adapter = ADAPTERS[entry.fetcher];
  if (!adapter) {
    throw new Error(`No fetcher registered for "${entry.fetcher}" (entry ${entry.id})`);
  }
  return adapter(entry.source);
}
