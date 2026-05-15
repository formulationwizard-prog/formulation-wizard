# Nutraceuticals Workspace Audit — Code-Level Pointers for Round 11 Track A

**Generated:** 2026-05-15 (post-deploy smoke test follow-up)
**Purpose:** Map specific code locations Round 11 Track A (Findings #25, #26, #27) needs to address. Brief; not exhaustive. Intended as input for Round 11 directive scoping, not as an implementation plan.

---

## The load-bearing bug — per-serving math model

**Location:** [app/workspace/page.tsx:792-796](../../app/workspace/page.tsx#L792-L796)

```ts
// Nutrition values in `nutrition` are summed totals for the entire batch
// (each ingredient contributes its per-100g × (qty/100)).
// To render per-serving on the FDA label, scale by servingSize / batchWeight.
const scale = totalBatchGrams > 0 ? servingSizeInGrams / totalBatchGrams : 0;
/** Raw per-serving amount for a nutrient (no rounding — use fdaRound* for display). */
const perServing = (val: number) => val * scale;
/** Raw %DV (0-100+) for a nutrient with a valid DV. Returns 0 when DV is 0. */
const rawPct = (val: number, dv: number) => dv > 0 ? (val * scale / dv) * 100 : 0;
```

The `scale` formula is **F&B-native** — it assumes ingredients are batch totals and serving size is a fraction of the batch. Runs **unconditionally** (no `mode === 'supplements'` guard).

**Why it breaks Nutraceuticals:** In supplement formulations, ingredient amounts are entered AS per-serving doses (e.g., Vitamin C 500 mg = 500 mg PER serving), not as batch totals. Applying `scale = servingSize / totalBatchGrams` then multiplies them by an additional factor (~1942/500 in the smoke test case = ~3.9× scaling artifact) producing wrong values on the Supplement Facts panel.

**Fix shape:** Mode-gated math. In supplements mode, `perServing(val)` should be identity (or close to it — capsule fill mass overhead aside) since the ingredient value IS already the per-serving dose. In F&B mode, current `val * scale` stays.

**Caller of the broken math:**
- [app/workspace/page.tsx:4932](../../app/workspace/page.tsx#L4932) — `buildSupplementFacts({...})` call passes data through the broken scaling
- [lib/supplementLabeling.ts](../../lib/supplementLabeling.ts) — `buildSupplementFacts` receives already-scaled values; the function itself is downstream of the bug

The bug is at the upstream scaling layer, not in supplementLabeling.ts. Once `perServing` is mode-gated correctly, Supplement Facts rendering should produce correct values without changes to lib/supplementLabeling.ts.

---

## F&B regulatory panels leaking into Nutraceuticals path

**Mode guards that DO exist** (correct pattern, applied unevenly):

| Guard | Location | Behavior |
|---|---|---|
| `mode === 'supplements' ? [] : checkCompliance(...)` | [page.tsx:615](../../app/workspace/page.tsx#L615) | Skips Bucket A compliance for supplements ✓ |
| `mode === 'supplements' && ingredients.length > 0` | [page.tsx:699, 2748, 3550, 3629, 4572, 4775](../../app/workspace/page.tsx#L699) | Supplement-specific surfaces render only in supplements mode ✓ |

**Mode guards that DO NOT exist** (the leakage):

- **Filing Readiness widget** ([page.tsx:1667](../../app/workspace/page.tsx#L1667) area) — renders unconditionally. The pathway-aware widget surfaces Acid Food / Acidified Food / LACF / Shelf-Stable Dry classifications even in supplements mode. Needs `mode !== 'supplements'` guard OR a supplement-specific Filing Readiness variant (DSHEA-pathway-aware).
- **Determination engine output** — `classifyFormulation` (in lib/foodScience.ts) is F&B-native. It correctly classifies but its OUTPUT renders alongside supplement workflow.
- **Low-acid component percentage** — computed unconditionally; rendered in regulatory panels even in supplements mode. Conceptually irrelevant for supplements (21 CFR 113/114 don't apply to dietary supplements).

**Scope for Round 11 Track A:** systematic audit of every render block in `app/workspace/page.tsx` that displays regulatory classification output. Add `mode !== 'supplements'` guards to F&B-only panels OR create supplement-specific equivalents.

---

## HACCP template selection

**Location:** [page.tsx:769](../../app/workspace/page.tsx#L769)

```ts
const suggestedHaccp = suggestHaccpCategory(...)
```

`suggestHaccpCategory` (in lib/haccp.ts or similar) selects from F&B HACCP categories (Salmonella, E. coli flour, Cronobacter infant formula, mycotoxins, etc.). No supplement framework path.

**Smoke test observation:** Supplements mode shows "Shelf-Stable Dry (Low-Moisture)" framework — the F&B category that most closely matches a dry capsule, selected by composition heuristics. The actual regulatory framework for supplements is **21 CFR 111 cGMP** (identity testing, master manufacturing record, batch production record, holding records, complaints handling).

**Fix shape:** Mode-gated suggestion. In supplements mode, return a 21 CFR 111 framework category instead of routing through `suggestHaccpCategory` (which is F&B-bound). The 21 CFR 111 template needs to be authored — likely a new file like `lib/supplementCgmp.ts` or extend `lib/supplement*.ts` with a `cgmpFramework` export.

**Existing supplement-side code that's adjacent:**
- [lib/supplementSafetyLimits.ts](../../lib/supplementSafetyLimits.ts) — UL caps, banned ingredients, interaction warnings (operational; UL gate works correctly per [Section B.7](round-10-visual-review.md))
- [lib/supplementLabeling.ts](../../lib/supplementLabeling.ts) — Supplement Facts panel construction
- [lib/supplementClaims.ts](../../lib/supplementClaims.ts), [lib/supplementCompatibility.ts](../../lib/supplementCompatibility.ts), [lib/supplementNDI.ts](../../lib/supplementNDI.ts), [lib/supplementRetailFit.ts](../../lib/supplementRetailFit.ts), [lib/supplementStability.ts](../../lib/supplementStability.ts) — domain-specific supplement engines (operational status not audited in this session)

A `lib/supplementCgmp.ts` (or `lib/supplementHaccp.ts`) following the same pattern would slot in cleanly.

---

## Cost / Spec coverage / UL gate downstream effects

These are downstream of the math model bug at line 792:

**Cost calculation unit-mismatch warnings.** Cost layer compares `servingSize` against `batchWeight` (in F&B context: serving < batch is normal). In supplements with broken `scale`, the comparison produces meaningless warnings ("Serving > batch — check unit"). Once `perServing` is mode-gated correctly, the cost calculation downstream should produce sensible per-serving cost without code changes.

**Spec coverage reports 0%.** Coverage is calculated against the rolled-up nutrition/spec output, which floors when the math model is wrong (downstream of line 792). Fix is upstream of coverage; no separate coverage-layer fix needed.

**UL gate firing on wrong displayed values.** The UL caps themselves at [lib/supplementSafetyLimits.ts](../../lib/supplementSafetyLimits.ts) are correct. The `perServingMgByName` map passed to `checkSupplementSafety` at [page.tsx:4576-4586](../../app/workspace/page.tsx#L4576-L4586) is constructed using the `scale` from line 792:

```ts
const perServingMgByName = new Map<string, number>();
// ...
perServingMgByName.set(ing.name, g * scale * 1000 * potency);
```

That's the load-bearing line — uses the broken `scale`. Once `scale` is mode-gated, the map will carry correct per-serving mg values and the UL gate fires correctly. **The UL caps and gate logic don't need changes.** This is critical safety-relevant code; the bug is exclusively in the input layer.

---

## Serving Size input UX (Finding #26) + unit-change (Finding #27)

**Location for #26:** Search `app/workspace/page.tsx` for the Serving Size input control in the Serving & Package Size section. The arrow buttons cycling 1 → 30 → 1 imply `<input type="number" min="1" max="30" step="1">` with wrap-around behavior at min/max. Needs:
- `step` allowing decimals (e.g., `step="0.1"` or `step="any"`)
- `min` allowing sub-1 values (e.g., `0.1` or `0`)
- Wrap-around behavior reviewed

**Location for #27:** The unit dropdown change handler in the same section. Currently preserves the numeric value when unit changes (operator-invisible 1000× mass drop). Two viable fix patterns (Round 11 decides):

(a) **Auto-convert** — when unit changes from `g` to `mg`, multiply value by 1000 (and analogous for other unit pairs). Preserves operator intent (the mass).

(b) **Reset with prompt** — when unit changes, blank the field and prompt "Enter new value in [unit]". Safer if the engine ever needs to distinguish re-entry from conversion.

---

## Summary of what works vs what's still F&B-native

**Working in supplements mode** (correct mode-gating exists):
- UL caps + banned-ingredient enforcement
- Supplement Facts panel render path (downstream of math fix; correct values once `perServing` is mode-gated)
- Path A productClass selector (Finding #18 fix; Nutraceuticals shows only 'Dietary Supplement')
- Compliance routing skip (`checkCompliance` returns `[]` for supplements mode)
- Supplement-specific dosage model intro UI

**Still F&B-native** (the launch-blocker):
- Per-serving math `scale` formula (line 792) — **THE bug**
- Filing Readiness widget — renders Acid Food / LACF classification in supplements mode
- Determination engine output rendering — F&B-native classifications surface in supplements UI
- HACCP framework selection — `suggestHaccpCategory` returns F&B categories only; no 21 CFR 111 cGMP template
- Serving Size input control — F&B-default integer step/range
- Unit dropdown handler — F&B-context number preservation

**Round 11 Track A scope unlocks** by fixing the load-bearing `scale` formula at line 792 plus the surrounding mode-guards. Domain engines in `lib/supplement*.ts` are operational and don't need rework — the issue is exclusively at the workspace-page math + render layer.

---

## Not audited in this session

- Operational status of `lib/supplementClaims.ts`, `lib/supplementNDI.ts`, `lib/supplementRetailFit.ts`, `lib/supplementStability.ts`, `lib/supplementCompatibility.ts`. These engines weren't exercised in the smoke test scope.
- Whether the 21 CFR 111 cGMP framework should live as a new lib/supplementCgmp.ts or extend an existing supplement-side file. Architecture call belongs in Round 11 directive scoping.
- UI styling / brand voice on the Supplement Facts panel render (downstream of math fix; verify visually after math correction lands).
- Save/load behavior for supplement formulations across mode switches.

Round 11 directive will scope what's in vs deferred. This memo provides the entry points.
