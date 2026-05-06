// ============================================================
// PART NUMBER GENERATOR
// ------------------------------------------------------------
// Issues a unique finished-good SKU to every saved formulation
// for inventory tracking, ERP integration, QA traceability, and
// recall / withdrawal mapping.
//
// Format: {MODE_PREFIX}-{YY}-{4-DIGIT-SEQ}
//   SUP-26-0001  — Supplements, 2026, formula #1
//   FB-26-0042   — Food & Beverage, 2026, formula #42
//   SAU-26-0007  — Sausage & Charcuterie, 2026, formula #7
//
// The sequential counter increments per-mode-per-year so each
// vertical has its own contiguous number space (easier to
// reference on a batch record or ERP PO line). Once issued, a
// part number is immutable unless the user explicitly overrides
// it — the version string (1.0.1, 1.1.0, etc.) conveys revisions.
// ============================================================
import type { SavedFormulation } from '../types';

type ModeId = 'fb' | 'baking' | 'catering' | 'feeds' | 'sausage' | 'supplements';

/** Three-letter prefix for each vertical — short enough for a batch label. */
const MODE_PREFIX: Record<ModeId, string> = {
  fb:          'FB',
  baking:      'BAK',
  catering:    'CAT',
  feeds:       'FDS',
  sausage:     'SAU',
  supplements: 'SUP',
};

/**
 * Generate the next available part number for a formulation in the given mode.
 * Scans existing formulations for the highest sequence number in (mode, year)
 * and returns one greater. Year is the 2-digit current year.
 */
export function generatePartNumber(
  mode: ModeId | undefined,
  existingFormulations: SavedFormulation[],
  now: Date = new Date()
): string {
  const effectiveMode = mode ?? 'fb';
  const prefix = MODE_PREFIX[effectiveMode];
  const yy = String(now.getFullYear()).slice(-2);
  const scope = `${prefix}-${yy}-`;

  // Highest existing sequence for this (mode, year) pattern.
  let maxSeq = 0;
  for (const f of existingFormulations) {
    if (!f.partNumber) continue;
    if (!f.partNumber.startsWith(scope)) continue;
    const tail = f.partNumber.slice(scope.length);
    // Accept either "0007" or "0007-R1" (future revision-suffixed forms)
    const m = tail.match(/^(\d+)/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxSeq) maxSeq = n;
    }
  }

  const nextSeq = maxSeq + 1;
  return `${scope}${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Basic validator — confirms the shape is {PREFIX}-{YY}-{SEQ}. Non-matching
 * strings are allowed (users may use their own numbering scheme) but the
 * sequential generator won't bump them.
 */
export function isStandardPartNumber(pn: string): boolean {
  return /^(FB|BAK|CAT|FDS|SAU|SUP)-\d{2}-\d{4,}$/.test(pn);
}

/**
 * Extract the human-readable vertical name from a part number for display.
 * Returns null if not a standard part number.
 */
export function vertialFromPartNumber(pn: string): string | null {
  const match = pn.match(/^([A-Z]+)-/);
  if (!match) return null;
  const prefix = match[1];
  const entry = (Object.entries(MODE_PREFIX) as [ModeId, string][]).find(([, p]) => p === prefix);
  if (!entry) return null;
  const [modeId] = entry;
  const labels: Record<ModeId, string> = {
    fb: 'Food and Beverage',
    baking: 'Baking & Pastry',
    catering: 'Catering / Foodservice',
    feeds: 'Animal Feeds',
    sausage: 'Sausage & Charcuterie',
    supplements: 'Nutraceuticals',
  };
  return labels[modeId];
}
