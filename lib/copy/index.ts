// ============================================================
// Copy lookup
// ------------------------------------------------------------
// Components consume the catalog via getCopy(key, tier). The
// 'novice' tier falls back to 'pro' until Phase 5 fills it in.
// ============================================================

import { STRINGS, type CopyKey } from './strings';
import type { Tier } from './types';

export type { CopyKey } from './strings';
export type { Tier, CopyEntry, CopyCatalog } from './types';

/**
 * Resolve a catalog key to a string for the current tier.
 *
 * Behavior:
 *   - tier === 'novice' AND a non-empty 'novice' string is set → return novice
 *   - otherwise → return 'pro' (the always-populated baseline)
 *
 * Unknown keys return the key itself in development as a loud signal,
 * empty string in production. This catches typos in the editor without
 * breaking production rendering.
 */
export function getCopy(key: CopyKey, tier: Tier = 'pro'): string {
  const entry = STRINGS[key];
  if (!entry) {
    if (process.env.NODE_ENV !== 'production') {
      return `[missing copy: ${key}]`;
    }
    return '';
  }
  if (tier === 'novice' && entry.novice) return entry.novice;
  return entry.pro;
}
