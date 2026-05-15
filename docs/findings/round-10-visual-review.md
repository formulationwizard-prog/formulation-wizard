# Round 10 Visual Review — Findings Inventory

**Reviewed:** 2026-05-15 (Vercel preview, password-protected)
**Status:** Partial coverage — Tests 1 / 3 / 4 substantially pass; Test 2 partial (gated on Finding #15 catalog gap)
**Reviewer:** Operator (with CC investigation memos as referenced)

---

## Section A — Findings Requiring Future Work

Findings surfaced during visual review. Each documented with observation, hypothesis, severity, recommended Round assignment, and investigation status.

### Finding #14 — pH ±0.20 CI width on Tier A output

**Observation.** Test 1 (1% citric acid + 99% water, Acidified Foods) returned pH 2.23 ± 0.20 CALCULATED. Center value within bench-test acceptance (2.20 ± 0.05); CI width raised the question of whether ±0.20 was intentional, inherited from fallback, or calibrated to system uncertainty.

**Hypothesis evaluated.** Three from the SOW:
- (a) Intended Tier A output ✓ — confirmed
- (b) Inherited from fallback ✗ — ruled out (fallback would render ±0.30 ESTIMATED)
- (c) Calibrated to total-system uncertainty ✓ — explains the wider-than-math calibration

**Severity:** LOW. ±0.20 is the intended CALCULATED-pH display CI from `RANGE_TABLE` at lib/foodScience.ts:757, applied via `rangedSpec`. Principled and consistent with the honest-estimate framing.

**Recommended Round assignment:** No code change. Document rationale to prevent re-surfacing.

**Investigation status:** Complete. Full memo at [finding-14-investigation.md](finding-14-investigation.md). Optional Round 11+ refinement (split 'calculated' into sub-tiers for tighter Tier-A-success display) noted but deferred until clear customer-zero benefit emerges.

---

### Finding #15 — F&B catalog lacks sulfite preservative

**Observation.** Test 2 (Bucket A red-banner verification with sulfite over 100 ppm cap) could not be exercised end-to-end because no sulfite preservative SKU exists in the selectable F&B catalog. Compliance logic IS verified by unit tests against synthetic ingredients (lib/__tests__/section-3b1-regulatory-limits.test.ts + section-3b2-product-class-routing.test.ts); the gap is at the catalog layer.

**Hypothesis.** Catalog gap, not regulatory-limits gap. The SULFITES entry in lib/regulatoryLimits.ts is wired correctly with `declarationTriggerPpm: 10` (Section 3b.1) + `prohibitedInCategories: ['fresh-produce']` (Section 3b.2). User just can't add a sulfite ingredient to a formulation.

**Severity:** COSMETIC for Round 10 ship. The Bucket A red-banner code path is verified via other test paths (sodium benzoate over 0.1% cap in beverage productClass — same MEASURED-input semantics, same hard-stop banner).

**Recommended Round assignment:** Round 10 polish OR Round 11 catalog pass, gated on PA verification of cap values per food category + activeFraction conversions + namePatterns. Catalog-only commit (no chemistry-limits changes).

**Investigation status:** PA-verification queue entry at [docs/pa-verification/2026-05-15-sulfite-preservative-catalog-gap.md](../pa-verification/2026-05-15-sulfite-preservative-catalog-gap.md). Lists fields PA needs to verify across four sulfite forms (sodium meta / potassium meta / sodium bi / SO₂). Open questions on granularity (per-species vs generic-with-secondary), wine-industry scope (TTB jurisdiction), per-category cap variances, activeFraction tagging precedent.

---

### Finding #16 — Ascorbic acid catalog entry not promoted to Tier A verified status

**Observation.** Test 3 (0.1% ascorbic acid + water) returned pH 3.20 ± 0.30 ESTIMATED. Center value matches theoretical H-H (3.20); CI rendered as ESTIMATED rather than CALCULATED.

**Hypothesis.** Tier A IS applying — the math is correct. The output confidence downgrade is the locked taxonomy table's intended behavior when input pKa is ESTIMATED. Ascorbic acid entry already carries pKa1: 4.10 + acidMolarMass: 176.12, but `source: 'ai-estimate'` + `confidence: 'unverified'` → mapSpecToConfidence returns 'estimated'.

**Severity:** LOW. Behavior is correct per the locked taxonomy. The refinement question is whether the entry should be promoted to 'verified' status with proper citations.

**Recommended Round assignment:** Operator decision required. Single small commit if approved. Authority sources for ascorbic acid (21 CFR 182.3013 GRAS; FCC 12th ed. monograph; CRC Handbook 97th ed. pKa1) are the same tier as the citations on citric anhydrous + monohydrate + acetic glacial.

**Investigation status:** Draft proposal at [finding-16-ascorbic-acid-tagging.md](finding-16-ascorbic-acid-tagging.md). Memo proposes; operator reviews on return; CC applies as a single small commit if approved. Same operator-review path that the original 9 standalone acids went through.

---

### Finding #17 — Formulation-feasibility detection layer

**Observation.** Beyond chemical-limit correctness, certain formulations would surface as "calculate-fine but production-infeasible" without a separate detection layer. Categories noted during review:

1. **Single-ingredient dominance** — formulations where one ingredient is >90% of total mass that aren't obvious cases (e.g., a "Beverage" formulated as 99.5% Water + 0.5% Citric Acid + 0% other = technically valid but trivially absurd as a commercial product).

2. **Total-solids absurdity** — formulations where the dry-solids percentage doesn't match the product type's commercial reality (e.g., a "Sauce" with 90% water content and 10% total solids isn't a sauce; it's a brine).

3. **productClass-plausibility** — formulations where the selected regulatory pathway doesn't match the ingredient composition (e.g., productClass='Cured Meat' with zero meat ingredients selected, or productClass='Baked Good' with no flour / leavening / fat).

**Hypothesis.** Separate architectural layer from chemical-limit correctness. Belongs to a "Formulation Feasibility Detection" subsystem, not to the Bucket A compliance gate. Closer to "is this even a coherent formulation of the type you said it is?" rather than "does it violate regulatory caps?"

**Severity:** Round 12+ scope per SOW. Not a regression; not a Round 10 ship blocker. The existing Bucket A enforcement catches the real safety failures; feasibility detection catches "weird but technically not illegal" formulations.

**Recommended Round assignment:** Round 12+ (after Round 11 documentation infrastructure ships and customer-zero usage patterns inform what feasibility checks matter most).

**Investigation status:** Out of scope for Round 10 polish. Requires design conversation with operator + Opus before scoping (which checks fire? at what point in workflow? how to surface — finding band? separate panel? blocking save?). Not implemented or memoized in this session per SOW off-limits.

---

### Finding #18 — ProductClass selector not mode-aware

**Observation.** In Nutraceuticals mode, the Product Class dropdown showed all 8 F&B options (Acidified Food, Dietary Supplement, Beverage, Cured Meat, Bacon, Baked Good, Fresh Produce, General). Should filter to mode-relevant options.

**Hypothesis.** Mode-aware filtering pattern already exists for productType field. Apply same pattern.

**Severity:** MODERATE for Nutraceuticals UX (existing F&B mode already shows the right list).

**Recommended Round assignment:** Round 10 polish.

**Investigation status:** **FIXED in this polish session** (commit 584b571). New `productClassesForMode(mode)` helper in lib/modes.ts mirrors the per-mode-data pattern. Supplements mode shows only 'Dietary Supplement'; F&B-style modes show 7 non-supplement options. Hint text and required-state message also become mode-aware.

---

### Finding #19 — Brand voice consistency between F&B Bucket A and Nutraceuticals hard-stop

**Observation.** Round 10's F&B copy ("Bucket A: Refuse-to-Export — N findings with MEASURED/CALCULATED inputs") reads as workflow-system jargon compared to the supplement-side gold standard ("HARD STOP — Do Not Ship. This formulation exceeds one or more Tolerable Upper Intake Levels. Selling a product in this state is misbranding under DSHEA..."). The Nutraceuticals voice is operator-to-operator with explicit legal framing; the F&B voice is internal-architecture-vocabulary.

**Hypothesis.** Voice inconsistency reflects when the copy was written (Section 3d's banner copy was scaffolded fast during implementation; supplement-side copy is more polished).

**Severity:** MODERATE. Customer-zero who reads "Refuse-to-Export" understands what's blocked; the legal framing is what makes them understand WHY. Honest-estimate framing benefits from this — the BR brand position requires the legal/regulatory voice on safety-critical surfaces.

**Recommended Round assignment:** Operator decision. Three options:
- **Ship in Round 10 polish** — one focused commit; high-impact UX upgrade
- **Defer to Round 11** — preserve current behavior; brand-voice audit lands in Round 11 polish round
- **Selective adoption** — banners + dialogs only in Round 10; per-row dual-confidence display deferred

**Investigation status:** Full audit memo at [finding-19-brand-voice-audit.md](finding-19-brand-voice-audit.md). Each Round 10 UI surface audited with current copy → proposed copy → rationale. Cross-cutting recommendations: vocabulary unification (productClass → regulatory pathway in rendered strings only); citation discipline; action-verb headlines.

---

## Section B — Verified Clean

Behaviors confirmed working as designed during visual review. **NOT bugs.** Documented so future reviewers don't re-surface as concerns.

### B.1 — Engine determination shifts on data-quality drop

When a_w confidence widens to ESTIMATED ± 0.030+ (e.g., a formulation with a category-default-fallback aw input), the engine's classification can shift from "Likely Acid Food" → "Pending classification" because the gate's confidence threshold can't sustain the AF determination. **This is honest-estimate operationalized at the classification layer.** Pre-honest-estimate behavior would have asserted a determination from sketchy inputs; post-reframe behavior surfaces the uncertainty.

### B.2 — Acid Food vs Acidified Food coexistence

Engine-determined classification (computed from chemistry: pH, aw, lowAcidComponentPct) and operator-set productClass (user-asserted regulatory pathway) display as **separate surfaces without silent override**. A formulation can be engine-classified "Acid Food" while the operator selected productClass='Beverage' — both render their own truth in their own panels. No coercion of one to match the other.

### B.3 — Filing Readiness honesty on deferred requirements

Filing Readiness banner correctly surfaces Round 11's deferred Acid Food reduced-requirement set as "not yet available" rather than faking readiness with a computed-but-meaningless score. **Customer-zero sees an empty surface with explanation, not a misleading completion percentage.** Round 9's pathway-aware computation discipline holds.

### B.4 — Save-block on missing Product Class

Required-at-creation enforcement validated visually:
- Red validation styling on selector when productClass is unset
- Red hint text below selector
- Save blocked at the alert layer with mode-appropriate message
- After selection, validation styling resolves to gray and save proceeds

### B.5 — False-positive precision fix scales to extreme doses

Vitamin C in Beverage productClass tested at 70.9% mass (100× the original 0.1% test dose, far beyond any plausible commercial use case). **The cured-meat 547 ppm cap still doesn't false-trigger.** Section 3b.2's appliesToCategories scoping is robust across the dose range, not just at small doses.

### B.6 — Section 4 REGULATORY_DISCLAIMER snapshot test active in CI

Three assertions verify the locked text on every test run:
1. Frozen-string equality (full snapshot match)
2. Non-empty sanity (constant is a string, length > 0)
3. Anchor preservation ("process authority" + "fda" must appear)

Any change to the constant fails CI until the snapshot is updated in the same commit, forcing the change-control discipline (PA consultation + operator approval in PR description + ARCHITECTURE.md update if policy-shifting) to surface in code review. Commit 1004308.

### B.7 — Nutraceuticals supplement safety stack unaffected by Round 10

Supplement-side UL hard-stop fires correctly for over-UL ingredients (validated with retinol over 3,000 mcg). **Zero F&B Bucket A bleed into Nutraceuticals workflow** — checkCompliance is skipped for supplements mode per existing `mode === 'supplements'` guard. Round 10's additions are additive to F&B and don't regress the supplement stack.

### B.8 — Path A-2 productClass save-block validation message

Renders correctly with mode-appropriate text:
- F&B: "Product Class is required for chemical-safety compliance routing. Save will be blocked until selected."
- Supplements: "Product Class is required for the Dietary Supplement DSHEA / UL safety framework. Save will be blocked until selected."

The alert + selector + red hint coordinate without UX confusion.

---

## Summary

**Findings requiring future work:** 6 (#14, #15, #16, #17, #18, #19).

- 1 fixed in this polish session (#18)
- 2 documented with no code change recommended (#14 — principled design; #17 — Round 12+ scope)
- 1 PA-gated, queued for verification (#15 — sulfite catalog gap)
- 1 operator-decision required, single small commit if approved (#16 — ascorbic acid promotion)
- 1 operator-decision required, scope-flexible (#19 — brand voice audit, ship-all / defer-all / selective)

**Verified clean:** 8 behaviors confirmed working as designed.

**Round 10 ship blockers:** None of the findings block merge. All are polish-or-deferred-scope items.

**Recommended pre-merge action:** operator review of #19 brand voice memo; decide ship-vs-defer. If ship, one polish commit covers the high-impact banner + dialog copy upgrades. If defer-all or selective, Round 10 merges with current copy and Round 11 picks up the voice unification.
