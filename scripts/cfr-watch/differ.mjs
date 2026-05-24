// ============================================================
// Differ + change-type classifier
// ------------------------------------------------------------
// Compares freshly-fetched RegContent against a stored baseline.
// Emits structured diff + classifies the change for triage routing
// per Opus tiered-tag scheme 2026-05-25:
//   - 'code-impact'           — encoded business logic affected
//   - 'interpretation-impact' — compliance interpretation affected
//   - 'no-impact'             — formatting/punctuation only
//   - 'needs-discussion'      — ambiguous, route to operator + Opus
// ============================================================

import { createHash } from 'node:crypto';

/**
 * Hash content body for cheap unchanged-vs-changed gate before running
 * the more expensive line-level diff.
 */
export function hashBody(body) {
  return createHash('sha256').update(body).digest('hex');
}

/**
 * Simple line-level diff producer. Returns added/removed line counts
 * + a sample of the first N changes for the report. Not a full unified
 * diff — that lives in the GitHub-issue body via the existing diff text.
 */
export function diffBodies(oldBody, newBody) {
  const oldLines = splitIntoLines(oldBody);
  const newLines = splitIntoLines(newBody);

  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  const added = newLines.filter(line => !oldSet.has(line));
  const removed = oldLines.filter(line => !newSet.has(line));

  return {
    added,
    removed,
    addedCount: added.length,
    removedCount: removed.length,
    totalOld: oldLines.length,
    totalNew: newLines.length,
  };
}

/**
 * Heuristic classifier — first-pass triage tag for the GitHub issue.
 * Operator + Opus can re-tag on review. Conservative: when in doubt,
 * tag 'needs-discussion' rather than 'no-impact' so changes aren't
 * accidentally dismissed.
 *
 * Future maturation: keyword corpora per impact category; NLP scoring;
 * cross-reference to codebase references in cfr-watch-list.json.
 */
export function classifyChange(diff) {
  const { addedCount, removedCount, added, removed } = diff;
  const totalDelta = addedCount + removedCount;

  if (totalDelta === 0) return 'no-impact';

  // Whitespace/punctuation-only edits typically produce very small diffs
  // where added + removed lines are near-identical when normalized.
  const isWhitespaceOnly = totalDelta <= 4 &&
    added.every(a => removed.some(r => normalizeForCompare(a) === normalizeForCompare(r)));
  if (isWhitespaceOnly) return 'no-impact';

  const allText = [...added, ...removed].join(' ').toLowerCase();

  // Hard-signal keywords for code-impact tag. These touch encoded
  // business logic directly (rounding, thresholds, allergen lists,
  // mandatory declarations).
  const codeImpactSignals = [
    'rounded', 'nearest', 'increment', 'milligram', 'microgram', 'gram increment',
    'mandatory', 'shall be declared', 'shall not be declared',
    'percent daily value', '% daily value', '%dv',
    'allergen', 'major food allergen',
  ];
  if (codeImpactSignals.some(sig => allText.includes(sig))) {
    return 'code-impact';
  }

  // Soft-signal keywords for interpretation-impact tag — language
  // changes that affect PA's compliance interpretation but not the
  // numeric/logic surface.
  const interpretationSignals = [
    'significant source', 'serving size', 'reference amount',
    'good manufacturing practice', 'verify', 'qualified', 'guidance',
  ];
  if (interpretationSignals.some(sig => allText.includes(sig))) {
    return 'interpretation-impact';
  }

  return 'needs-discussion';
}

function splitIntoLines(body) {
  // Split on sentence boundaries since our normalized body strips
  // structural newlines. Conservative: keep sentences as the diff unit.
  return body
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function normalizeForCompare(line) {
  return line.replace(/\s+/g, ' ').replace(/[,;:.]/g, '').toLowerCase().trim();
}
