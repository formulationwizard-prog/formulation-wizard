// ============================================================
// Substring-keyword landmine fixes — claims + stability engines (2026-06-07)
// ------------------------------------------------------------
// CC-direct hunt (the Workflow fan-out returned a false "0 confirmed" — its
// verify agents failed to emit StructuredOutput). Found the SAME dha→ashwagandha
// substring class in two more engines:
//   • supplementClaims.ts:377 — n.includes(k) with 'epa'/'dha' keywords →
//     Ashwagandha surfaced the EPA+DHA omega-3 STRUCTURE/FUNCTION claims
//     (misbranding; was visible in the live Calm & Sleep formula's Claims Validator).
//   • supplementStability.ts:165 — bare /(...|epa|dha|mct|...)/ → Ashwagandha
//     misclassified as 'omega-fatty-acid' (wrong overage/stability).
// Both fixed to word-boundary matching. These tests pin the fix AND guard against
// over-correction (real omega ingredients must still match — no false negatives).
// See [[project_substring_keyword_matching_bug_class]].
// ============================================================
import { describe, it, expect } from 'vitest';
import { detectStructureFunctionClaims } from '../supplementClaims';
import { classifyStability } from '../supplementStability';

const ASH = 'Ashwagandha (KSM-66, Ixoreal, 5% Withanolides)';

describe('claims engine — dha/epa no longer substring-match unrelated names', () => {
  it('Ashwagandha does NOT surface EPA+DHA omega-3 claims (the live-formula bug)', () => {
    const claims = detectStructureFunctionClaims([ASH]);
    expect(claims.find(c => c.ingredient === 'EPA + DHA (Omega-3)')).toBeUndefined();
  });
  it('Ashwagandha still surfaces its OWN claims (prefix match preserved)', () => {
    const claims = detectStructureFunctionClaims([ASH]);
    expect(claims.some(c => /ashwagandha/i.test(c.ingredient))).toBe(true);
  });
  it('a real fish-oil ingredient STILL surfaces EPA+DHA claims (no false negative)', () => {
    const claims = detectStructureFunctionClaims(['Fish Oil Concentrate (EPA/DHA 18/12)']);
    expect(claims.find(c => c.ingredient === 'EPA + DHA (Omega-3)')).toBeDefined();
  });
  it('algae DHA oil still surfaces EPA+DHA claims', () => {
    const claims = detectStructureFunctionClaims(['Algae Oil (Vegan DHA)']);
    expect(claims.find(c => c.ingredient === 'EPA + DHA (Omega-3)')).toBeDefined();
  });
});

describe('stability engine — dha/epa/mct no longer substring-match unrelated names', () => {
  it('Ashwagandha does NOT classify as omega-fatty-acid (dha→ashwagandha fixed)', () => {
    expect(classifyStability(ASH, 'Herbal Extracts')).not.toBe('omega-fatty-acid');
  });
  it('a real fish oil STILL classifies as omega-fatty-acid (no false negative)', () => {
    expect(classifyStability('Fish Oil Concentrate (EPA/DHA)', undefined)).toBe('omega-fatty-acid');
  });
  it('MCT oil still classifies as omega-fatty-acid', () => {
    expect(classifyStability('MCT Oil (C8/C10)', undefined)).toBe('omega-fatty-acid');
  });
});
