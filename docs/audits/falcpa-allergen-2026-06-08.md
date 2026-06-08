# Allergen Detection (#3) — FALCPA / FASTER Registry + Audit

**Date:** 2026-06-08 · **Auditor:** CC (authority-anchor §8 step 3; artifact #3).
**Citations verified against primary source** (Cornell LII / U.S. Code) per the verify-first lesson.

---

## Verified citations
- **21 U.S.C. 321(qq)(1)** — "major food allergen" list: *"Milk, egg, fish…, Crustacean shellfish…, tree nuts…, wheat, peanuts, soybeans, and sesame."* (Sesame is in the statutory list via FASTER Act — confirmed.)
- **21 U.S.C. 321(qq)(2)(A)** — highly-refined-oil exemption: *"Any highly refined oil derived from a food specified in paragraph (1) and any ingredient derived from such highly refined oil"* is NOT a major food allergen.
- **21 U.S.C. 343(w)** (FALCPA §203) — the labeling requirement.
- **21 CFR 101.36(b)(1)(i)(B)** — SFP allergen disclosure / species-naming (already cited in code).
- **Citation precision:** code comments cite "FALCPA §203(b)(2)" (the public-law section); the **codified** cite for the refined-oil exemption is **321(qq)(2)(A)** — now anchored in `isFalcpaRefinedOilExempt`.

---

## Audit result — detection wiring CONFIRMED sound
`lib/supplementAllergen.ts` is species-aware, cited, and gate-bearing (the pattern holds: built-well, audit confirms):
- **Big-9** + Mollusks (international-additional, advisory) categories with per-category tier + citation metadata.
- **Species-naming gate** (`evaluateAllergenGate`) — refuses export when Tree Nuts / Fish / Crustacean Shellfish are detected via a generic term without species (21 CFR 101.36(b)(1)(i)(B) + FALCPA). Hard-stop only on the `falcpa-faster-big-9` tier; international-additional advisory.
- **Format-B rendering** (umbrella + species in parens) — matches real-label practice; auto-dedupes the generic+species double-render.
- **Taxonomic precision** — mollusks (clam/oyster/…) split OUT of Crustacean Shellfish (correct: mollusks are NOT FALCPA Big-9).

## The B6-analog override — refined-oil exemption (CONFIRMED implemented)
The per-ingredient override on the generic detector, exactly per the operator's 3-state taxonomy (`falcpaExemptionStatus`):
| State | Behavior | Example |
|---|---|---|
| `exempt` | skip allergen declaration | RBD soybean oil (<1 ppm residual protein) |
| `operator-decision` | conservatively DECLARE | coconut oil RBD (ambiguous) |
| `not-exempt` | DECLARE | cold-pressed / virgin (protein-bearing) |
| `undefined` | DECLARE (safe default) | refining grade not yet flagged |

This commit: extracted the decision to the cited pure helper `isFalcpaRefinedOilExempt` (321(qq)(2)(A)), single-sourced in `page.tsx` recalculate, and **harnessed all four states** (`harness-allergen-falcpa-golden.test.ts`). Consequence (skip aggregation) is the page loop + screenshot-sampleable.

---

## Known gap (R12-deferred, NOT a new finding)
**Substring false-positives — OVER-declaration** (documented in `supplementAllergen.ts`): `flour`→Wheat ("almond flour"), `cream`→Milk ("cream of tartar"), `egg`→Eggs ("eggplant"), `malt`→Wheat (barley malt). Harm direction = over-declare (truth-in-labeling / commercial, not consumer-safety). `'butter'` already dropped from Milk. Fix = word-boundary detection ([[project_substring_keyword_matching_bug_class]]). Harnessed as `todo` fix-targets; sequenced R12.

**Source:** [Cornell LII 21 U.S.C. 321](https://www.law.cornell.edu/uscode/text/21/321) ((qq)(1) list + (qq)(2)(A) refined-oil exemption).
