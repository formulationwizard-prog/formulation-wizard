// ============================================================
// Bilingual copy types
// ------------------------------------------------------------
// 'pro'    — terse, jargon-correct strings for trained formulators
// 'novice' — plain-English equivalents (filled in Phase 5; falls
//            back to 'pro' when empty)
// ============================================================

export type Tier = 'pro' | 'novice';

/**
 * Each catalog entry has both tiers. 'novice' may be an empty string
 * during the rollout — getCopy() falls back to 'pro' in that case.
 */
export interface CopyEntry {
  pro: string;
  novice: string;
}

export type CopyCatalog = Record<string, CopyEntry>;
