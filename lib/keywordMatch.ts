// ============================================================
// SHARED KEYWORD MATCHER (Round 11 Phase 3 post-A.5 follow-up;
// 2026-05-17)
// ------------------------------------------------------------
// Used by:
//   • lib/supplementSafetyLimits.ts — UL / banned / interaction
//     keyword lookups against ingredient names
//   • lib/supplementLabeling.ts     — DV table lookup against
//     ingredient names
//
// Replaces String.prototype.includes() substring matching, which
// produced two classes of false positives operator testing
// surfaced:
//
//   Class A — short keyword inside longer chemical name:
//     "dha"  matches "ashwagan*dha*"        (false interaction)
//     "epa"  matches "pr*epa*ration"        (false interaction)
//     "rue"  matches "t*rue*"               (false contra)
//
//   Class B — numeric suffix collision:
//     "vitamin b1" matches "vitamin b1*2*"  (Thiamin DV match
//                                            steals Vit B12 row)
//     "b-1"        matches "b-1*2*"         (same)
//     "vitamin d3" matches "vitamin d3*0*"  (hypothetical)
//
// Fix shape: word-start boundary + conditional word-end boundary.
//
//   • word-start boundary always required — solves Class A
//   • word-END boundary required when the keyword's last character
//     is a digit (or when the keyword is ≤ 3 chars total) — solves
//     Class B without breaking legitimate prefix matches like
//     "pyridox" → "pyridoxal-5-phosphate" or "ferrous" → "ferrous
//     bisglycinate"
//
// Hyphen counts as non-alphanumeric so "5-htp" still matches
// "L-5-HTP" and "ma huang" matches "Ma Huang Extract".
// ============================================================

/**
 * Word-boundary aware keyword match.
 *
 * @param haystack  String to search (caller usually lowercases the
 *                  ingredient name once and reuses for many keywords).
 * @param keyword   Keyword to look for — should be lowercase. Spaces
 *                  and hyphens inside the keyword are matched literally.
 * @returns         true when `keyword` appears at a word boundary in
 *                  `haystack`, with end-boundary required for short or
 *                  digit-suffixed keywords.
 */
export function keywordMatch(haystack: string, keyword: string): boolean {
  if (!keyword) return false;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const lastChar = keyword[keyword.length - 1];
  // Tight end boundary when:
  //   • keyword ends in a digit (prevents b1→b12, d3→d30, etc.)
  //   • OR keyword is ≤ 3 chars (prevents rue→rueellia, dha→ashwagandha
  //     edge cases — though word-start boundary already catches the
  //     specific "ashwagandha" case, this is defense in depth).
  const tightEnd = /[0-9]/.test(lastChar) || keyword.length <= 3;
  const endAnchor = tightEnd ? '(?:[^a-z0-9]|$)' : '';
  const pattern = new RegExp(`(?:^|[^a-z0-9])${escaped}${endAnchor}`, 'i');
  return pattern.test(haystack);
}
