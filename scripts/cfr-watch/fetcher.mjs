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
 * Retry a fetch with exponential backoff. eCFR/govinfo have occasional
 * transient blips (timeouts, 5xx, brief unreachability) that self-heal in
 * seconds. Without retry, a single blip throws → the entry is reported as
 * fetch-error → the weekly workflow hard-fails and emails an alarm for
 * something that needs no action (alert fatigue). Retrying absorbs the
 * transient case; a genuinely persistent failure (moved URL, API change,
 * sustained outage) still throws after the final attempt, so real problems
 * still surface + alert. Retry notices go to stderr (console.warn) so they
 * never pollute the stdout the --github issue-parsing step reads.
 *
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ attempts?: number, baseDelayMs?: number }} [opts]
 * @returns {Promise<T>}
 */
async function withRetry(fn, { attempts = 3, baseDelayMs = 1000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < attempts) {
        const delay = baseDelayMs * 2 ** (attempt - 1); // 1s, 2s, 4s
        console.warn(
          `[cfr-watch] fetch attempt ${attempt}/${attempts} failed (${err.message}); retrying in ${delay}ms`,
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastErr;
}

/**
 * Dispatch fetch to the registered adapter for this entry, with transient-blip
 * retry (see withRetry). Retry lives here (the dispatcher) so both adapters get
 * it uniformly and neither has to implement its own.
 *
 * @param {WatchEntry} entry
 * @returns {Promise<RegContent>}
 */
export async function fetchRegContent(entry) {
  const adapter = ADAPTERS[entry.fetcher];
  if (!adapter) {
    throw new Error(`No fetcher registered for "${entry.fetcher}" (entry ${entry.id})`);
  }
  return withRetry(() => adapter(entry.source));
}
