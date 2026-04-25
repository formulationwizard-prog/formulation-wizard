'use client';

// ============================================================
// useTier — current user's copy tier
// ------------------------------------------------------------
// Phase 1: hardcoded to 'pro' until account / preference wiring
// lands in Phase 5. Components consume via:
//
//   const tier = useTier();
//   const text = getCopy('some.key', tier);
// ============================================================

import type { Tier } from '../copy/types';

export function useTier(): Tier {
  return 'pro';
}
