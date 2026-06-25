# Count-Aware Mass Consolidation — Plan + Consolidate-and-Guard Template

**Date:** 2026-06-25 · **Status:** design-stage, for Wizard lock. **No code yet.**
**Purpose:** (1) the launch-blocking fix that makes CFU correct across *every* engine, and (2) the **template** every future consolidation follows (catalog-provenance, UNDOCUMENTED-render, etc.). Sections 1–8 are the reusable template shape.

> **Why this exists:** the CFU build fixed parse + Facts panel, but the grams-fallback `ing.qty × (UNIT_TO_GRAMS[ing.unit] || 1)` — which turns "5 Billion CFU" into 5 grams — is **inlined across the codebase**, and most copies bypass the count guard. "A count isn't a weight" has to be *remembered* in ~20 places instead of *enforced* in 1.

---

## §1. Class identification (the most important section — class-distinction, NOT pattern-matching)

`UNIT_TO_GRAMS[...]` appears **59 times / 13 files**. **They are three different semantic classes.** A single helper for all 59 would be a *category error* (it would route serving/package sizes through an ingredient-mass helper — silent, no test would catch it). The grep finds syntactic similarity; the **class determines what consolidates.**

| Class | Shape | Concept | Count-relevant? | Action |
|---|---|---|---|---|
| **A — ingredient mass** | `ing.qty × UNIT_TO_GRAMS[ing.unit]` | mass of an ingredient | **YES** | route through `toGrams` |
| **B — measure size** | `servingSize × UNIT_TO_GRAMS[servingUnit]`, package, batch | an operator-entered *measure* in its own unit (a serving/package/batch is never "CFU") | NO | leave (separate concern) |
| **C — unit conversion** | `qty × g[old] / g[new]` | generic unit change | N/A | leave |

## §2. Single source of truth

**Already exists: `toGrams(qty, unit)` in `lib/utils.ts`** — made count-aware in the CFU build (`isCountUnit(unit) ? 0 : qty × (UNIT_TO_GRAMS[unit] || 1)`). The consolidation is **routing Class A through it**, not writing a helper. (Optional semantic alias `ingredientMassGrams(ing) = toGrams(ing.qty, ing.unit)` for readability.)

**Behavior preserved:** the `|| 1` fallback for *unrecognized non-count* units (a typo'd mass unit) stays as-is — that's a separate concern (the no-silent-drop net), out of scope here. This consolidation changes **only** the count behavior (→ 0).

## §3. Consumption-site inventory (Class A — the ~20 sites to route)

**Harm-critical / launch-blocking (most care + bench-test):**
| Site | Engine | Today | After |
|---|---|---|---|
| page.tsx **6863** | **Dosage-safety / UL** ⚠ | CFU → 5000 mg phantom | → 0; count excluded, flagged |
| page.tsx **8354** | **Stability / overage** | CFU → "5.0 g" (F-13) | → 0; count excluded, flagged |
| page.tsx **7770** | Claims validator | CFU → 5 g phantom | → 0; excluded |
| supplementLabeling **331** | SFP `ingredientGrams` | ✅ already guarded | (done) |

**Standard (lower-risk):**
- page.tsx **1320** totalCost, **3567/3745/3746/3927** version+saved-formula cost, **3565/3735/3736/3747/3748/3926/3930/1999/9985** saved-formula/version/export mass, **1271/1311/1602/4534/5377/8277/8810** per-ingredient mass, **11074** batch-scaling.
- lib **foodScience.ts ×5** (965/1265/1340/1416/1458 — specs pH/aw/moisture), **servingDoseBridge.ts:28** (M1.5 engine), **regulatoryLimits.ts 597/609** (F&B compliance — supplements skip, but route for correctness).

**Class C (baking baker's-%) — route too (count-safe is harmless; baking has no CFU but consistency):** page.tsx 7405/7428/7496.

## §4. Replacement plan
Replace each Class-A inline `X.qty * (UNIT_TO_GRAMS[X.unit] || 1)` with `toGrams(X.qty, X.unit)`. Mechanical. **Leave Class B** (`servingSize`/`packageSize`/`batchSize` × `UNIT_TO_GRAMS[…Unit]`) and **Class C-conversion** (1725/1726) untouched.
**Carve-out status:** `page.tsx`, `foodScience.ts`, `regulatoryLimits.ts`, `servingDoseBridge.ts` — **not carve-outs** (editable). `supplementLabeling.ts` — carve-out, already-done (its `ingredientGrams` guard). No new carve-out approvals needed.

## §5. Structural guard (class-aware grep-test)
A vitest test that scans source and **fails CI** if the Class-A inline shape appears outside the helper:
- **Ban:** `\.qty\s*\*\s*\(?\s*UNIT_TO_GRAMS\[\s*\w+\.unit\s*\]` (ingredient-mass shape).
- **Allow:** `servingSize`/`packageSize`/`batchSize × UNIT_TO_GRAMS[…Unit]` (Class B — different operand), the conversion util (Class C), and `toGrams` itself.
- **Allow-list** with a comment-rationale per entry; adding to it requires review (same discipline as carve-out edits). Prevents a future contributor restoring the trap via a new inline site.

## §6. Negatives verified (which sites legitimately do NOT route through the helper)
- **Allergen** (`detectAllergensDetailed`) — name-based, no qty math. Count-tolerant. ✓
- **NDI** (`analyzeNDI`) — name-based. ✓
- **Class B (serving/package/batch size)** — a measure in its own unit; count never applies; routing through an ingredient-mass helper would be wrong. ✓
- **Class C (unit conversion)** — generic; not ingredient mass. ✓

## §7. Honest-engine behavior at the ceiling (counts excluded → flag, never silent-zero / phantom)
Routing through `toGrams` stops the *phantom* (no more "5 g"). It does **not** give count-aware *projections* — that's a bigger follow-on. So where a count is excluded from a mass engine, **render honestly, never silently:**
| Engine | NOT this | → render |
|---|---|---|
| Stability/overage | "5.0 g" (phantom) / "0 g" (silent) | *"Count-based actives (CFU): stability/overage projection not yet implemented — set CFU overage manually."* |
| Dosage-safety/UL | 5000 mg phantom | count excluded (probiotics have no mass-UL); note *"count-based actives not evaluated against mass-based UL."* |
| Cost | $/g on CFU | *"count-based ingredients: cost requires supplier per-CFU pricing (not computed)."* |
| Specs (pH/aw) | CFU weighted as g | exclude + footer *"N count-based ingredients excluded from this estimate."* |

*This is the friendly-face-honest-engine doctrine at the analysis layer: each engine states its count-tolerance honestly. Full count-aware projection = scoped follow-on (F-13b).*

## §8. Template applicability (what makes this the template, not a one-off)
This shape — **class-identify → single-source-of-truth → site-inventory → replace → grep-guard → verify-negatives → honest-ceiling** — is the reusable consolidation pattern. Next instances, same shape:
- **Catalog-provenance** (next, launch-blocking): class = "harm-critical assertion (allergen/NDI/safety) rendered without provenance"; source of truth = `PROVENANCE_BY_NAME`; guard = "inline never overrides provenance"; ceiling = render UNDOCUMENTED where provenance says `unknown`.
- **UNDOCUMENTED-render**, **export-egress**, **engine-unit-tolerance (IU/AFU/ppm)** — each: identify the class, find the one source of truth, route, guard, verify negatives, honest ceiling.
- **Doctrine banked:** *consolidation requires class-distinction, not pattern-matching; every audit ends in a chokepoint (helper + grep-guard), not a checklist.*

---

## Build sequence (within this consolidation)
1. (`toGrams` already count-aware — no helper work.)
2. **Harm-critical first:** route 6863 (safety) → bench-test; 8354 (stability) + 7770 (claims).
3. **Honest-ceiling render** for stability/cost/specs (the §7 messages).
4. **Standard sites** (cost/saved-formula/version/export/specs/baking).
5. **grep-guard test** (§5) — locks it.
6. **Bench-test** the probiotic paste through every engine: no phantom 5 g, no silent-zero, honest ceiling messages where count-projection isn't wired.

*Lock §1 (the class split) + §5 (guard scope) + §7 (ceiling copy) and I build once.*
