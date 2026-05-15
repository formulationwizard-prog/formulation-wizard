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

### Finding #22 — Regulatory enforcement and catalog should be co-sequenced (architectural principle)

**Observation.** Round 10's 18-entry regulatory enforcement table includes caps for ingredients with no corresponding catalog entries (BHA, BHT, sulfite preservatives, possibly others). Substring-matching for cap enforcement targets ingredients that don't exist in the database — Section 3b.1's `'sulfite '` precision pattern, Section 3b.2's BHA/BHT fat-and-oil basis routing, and the Bucket A gate over these entries all execute correctly, but a formulator can't actually trigger them by selecting an ingredient from the catalog.

**Hypothesis.** Regulatory entries inherited from earlier multi-category concept period when meats / charcuterie / baked goods / animal feeds each had dedicated tooling planned. Section 3b.2 refined existing entries (denominator basis, substring precision, per-context tagging) but didn't audit catalog backing per entry. Code-audit view sees enforcement; formulator view sees unregulated ingredients.

**Severity:** MODERATE. Creates the appearance of regulatory protection that isn't operational. Customer-zero formulator sees no cap fire on a beverage they expect to fail and might assume the absence means compliance — when actually the absence means there's no selectable sulfite ingredient to trigger the cap.

**Recommended Round assignment:** Architectural principle for Round 11+ scoping. Specific application is Finding #23.

**Action.** Future rounds must not add regulatory enforcement entries without corresponding catalog backing. Sequence: catalog entry first → then regulatory enforcement. The discipline is "enforcement infrastructure ships with its activation surface, not ahead of it." Round 11's regulatory table audit (Finding #23) is the first operationalization of this principle.

**Investigation status:** Architectural finding. No memo needed; principle is the deliverable. Round 11 directive should cite this as the rationale for Finding #23's ordering.

---

### Finding #23 — Regulatory table audit for launch-vertical scope

**Observation.** Current 18-entry regulatory table mixes three categories of entry:

- **Operational entries** — backed by catalog ingredients AND relevant to the AF + Nutraceuticals launch verticals. Verified firing during Test 2 (sodium benzoate, potassium sorbate).
- **Forward-prepared entries** — caps and routing wired, but either no catalog backing (BHA, BHT, sulfites — see Finding #15) or no launch vertical (calcium propionate baked-good scope, sodium nitrite bacon contextualLimits, Prague Powder meat-basis denominators).
- **Potentially orphan entries** — no plausible activation path for AF + Nutraceuticals launch and no clear future-vertical timeline.

**Severity:** MODERATE. Audit complexity (which entry is which category?) plus forward-prepared infrastructure without clear activation timeline. Round 10 shipped chemical-limit correctness for what's there; Round 11 must determine what should stay vs. what should be annotated vs. what should be removed.

**Recommended Round assignment:** Round 11 — **FIRST priority** before any new enforcement work, per Finding #22's architectural principle.

**Scope.** Comprehensive review of each regulatory entry against three criteria:

1. **Catalog backing status:** operational (catalog entry exists and is selectable) / forward-prepared (regulatory wiring present, catalog entry missing) / orphan (no foreseeable activation path).
2. **Launch-vertical relevance:** AF / Nutraceuticals / multi-category-benign (applies universally) / future-vertical-only (cured-meat, bacon, baked-good not in launch scope).
3. **Action per entry:** keep as-is / keep with inline comment ("activates Round X when [vertical] catalog lands") / remove with regression test update.

Plus inline documentation comments at each regulatory entry in lib/regulatoryLimits.ts so the rationale persists across rounds and future reviewers don't re-surface as "why is this entry here?"

**Investigation status:** Round 11 scoping deliverable. Not implemented in Round 10 polish per SOW off-limits. Future CC session executes the audit when Round 11 directive opens.

---

### Finding #24 — Custom ingredient handling workflow

**Observation.** Operator can currently add ingredients outside the catalog by typing freeform name into the formulation. The custom ingredient enters the formulation at UNKNOWN confidence and propagates worst-case through downstream gates (architecturally correct — Bucket A treats UNKNOWN inputs as insufficient-data; confidence taxonomy floors at the weakest input). But operator-facing UX doesn't surface the analysis limitation at point of entry or at formulation level.

**Hypothesis.** Round 10's foundation work didn't include explicit custom-ingredient UX because the confidence taxonomy implicitly handles it (UNKNOWN inputs flow through gates correctly without false-positive enforcement). Architectural bones in place; UX surface area missing. The honest-estimate framing operates at the data layer; the operator-to-operator surfacing of "this ingredient is outside our reference library" hasn't been written.

**Severity:** MODERATE. Current behavior is architecturally correct (no silent enforcement of caps against unknown chemistry; no false-positive Bucket A on unverified inputs) but creates "silent acceptance" appearance. Operator might assume the tool has checked the ingredient when it hasn't.

**Recommended Round assignment:** Round 11 — sequenced AFTER catalog audit (#23) and catalog tagging pass (#15 + #21). The custom-ingredient workflow is the operator-facing layer on top of the catalog/enforcement work; it makes sense only once the catalog has been audited and the activation surface clarified.

**Scope.**

- **Schema additions on `IngredientSpec`:** `customIngredient?: boolean`, `operatorAttestation?: { timestamp; fieldsAttested[] }`.
- **UI — Add-as-custom dialog** with required acknowledgment text:
  > "This ingredient is outside the Formulation Wizard reference library. We can track it in your formulation, but our science-based analysis is limited. Process Authority review will be required for compliance determinations involving this ingredient."
- **Required fields in dialog:** ingredient name, function (preservative / sweetener / acidulant / etc.), operator GRAS attestation checkbox.
- **Optional fields with confidence tagging:** supplier, COA upload, pH, aw, allergen disclosure, regulatory citations. Each operator-supplied field carries explicit user-attested confidence rather than catalog-derived confidence.
- **Formulation-level banner** when custom ingredients present: "This formulation contains N custom ingredient(s) outside our reference library. Process Authority review required before commercial use."
- **PA-export packet:** dedicated "Custom Ingredient Disclosure" section per custom ingredient with operator-supplied data, attestation timestamp, audit trail.
- **Filing Readiness gate update:** custom ingredients can't advance Filing Readiness without explicit PA acceptance (sign-off field captured on the custom-ingredient record).

**Investigation status:** Round 11 scoping deliverable. Schema + UI + PA-export packet integration are coordinated changes; recommend single-round scope to land coherently. Not implemented in Round 10 polish per SOW off-limits.

---

### Finding #25 — Nutraceuticals workspace correctness pass

**Observation.** Post-deploy smoke test (2026-05-15) of Immune Support Stack supplement formulation (Vitamin C 500 mg + Vitamin D3 25 mcg + Zinc Gluconate 15 mg, 2 capsules/serving) revealed the Supplement Facts panel displays values that don't match operator-entered amounts:

| Ingredient | Entered | Displayed |
|---|---|---|
| Vitamin C | 500 mg | 1,942 mg (>999% DV) |
| Vitamin D3 | 25 mcg | 0.2 mcg |
| Zinc | 15 mg | 8.2 mg |

Single-ingredient diagnostic (Vitamin C 500 mg alone) showed 2000 mg displayed = 100% × 2 g per-serving mass, confirming the F&B recipe-percentage-of-fill-mass model is leaking into the Nutraceuticals workspace. Operator workaround (align Serving Size to ingredient amount, Package Size to serving × servings-per-container) produces correct math but breaks Servings/Container to a nonsensical fractional value.

Additional issues observed during diagnostic:

- **F&B regulatory panels leaking into Nutraceuticals workflow.** 21 CFR 113/114 LACF/Acid Food classification panels, low-acid-component 5% threshold reporting, Acid Food Filing Readiness — all render despite the top-level engine determination correctly identifying "DSHEA-Regulated Dietary Supplement (21 CFR 111)" with "Acidified-foods and LACF logic do not apply." Direct contradiction between determination engine and rendered panels.
- **HACCP template wrong framework.** Shelf-Stable Dry (Low-Moisture) food framework renders (Salmonella, E. coli on flour, Cronobacter for infant formula, mycotoxins) instead of 21 CFR 111 cGMP supplement framework (identity testing, master manufacturing record, batch production record, holding records, complaints handling).
- **Cost calculations unit-mismatch warnings.** "Serving > batch — check unit", "Package > batch — check unit" — downstream of the math model issue; cost layer doesn't have supplement-context defaults.
- **Spec coverage reports 0%** despite supplier-spec'd ingredients — downstream of math model issue (the denominator math floors the coverage rollup).
- **UL gate fires on incorrectly-calculated displayed values.** Capable of false-positive HARD STOP on safe formulations OR false-negative on actually-dangerous ones. The UL caps themselves (lib/supplementSafetyLimits.ts) are correct; the inputs they receive from the math layer are wrong.

**Hypothesis.** Per the operator's project memory ("take what's applicable from existing F&B AND existing supplement-specific code... plus build Nutraceuticals-specific regulatory engine on top, fill in what's missing — NOT greenfield, NOT simple F&B pivot"), the supplement-specific regulatory engine that overlays the F&B chassis hasn't been fully built. UL caps work (from `lib/supplement*.ts`); regulatory framework and math model layers ABOVE the UL caps are still F&B-native. Round 10 didn't touch this layer; the issues predate Round 10 and were not in Round 10 scope.

**Severity:** LAUNCH-BLOCKING. Nutraceuticals is the P1 launch vertical (August deadline). Math model errors can produce false-positive hard-stops on safe formulations OR false-negative on actually-dangerous formulations — brand-credibility-fatal if shipped to customer-zero in current state. The honest-estimate framing the rest of Round 10 operationalized cannot hold if the underlying numbers are wrong.

**Recommended Round assignment:** Round 11 **FIRST PRIORITY** (Track A, above the existing Round 11 documentation-infrastructure scope per the original Round 10/11 split).

**Scope:**

1. **Per-serving dose math model** — Nutraceuticals mode treats ingredient amounts as per-serving doses, not recipe percentages of fill mass. Replace F&B recipe-percentage model in Nutraceuticals workspace path.
2. **F&B regulatory panel scope-out** — 21 CFR 113/114 panels, Acid Food classification, low-acid components, Filing Readiness for Acid Food all conditionally rendered behind `mode !== 'supplements'` (or equivalent guard). Match the existing `checkCompliance` skip-pattern at app/workspace/page.tsx.
3. **21 CFR 111 cGMP supplement HACCP framework** — replace Shelf-Stable Dry food framework rendering in Nutraceuticals mode with supplement-appropriate framework (identity testing, MMR, BPR, holding records, complaints).
4. **Supplement-context cost calculations** — per-serving cost as primary unit; remove F&B serving-vs-batch unit-mismatch warnings in supplement context.
5. **Spec coverage denominator fix** — calculate against supplement-appropriate denominator (per-serving ingredient mass coverage, not recipe coverage).
6. **Capsule capacity math sanity-check** against the fixed per-serving math.

**Investigation status:** Findings logged here for Round 11 directive input. Optional Round 11 directive scoping memo at [nutraceuticals-workspace-audit-2026-05-15.md](nutraceuticals-workspace-audit-2026-05-15.md) maps the specific code locations that need attention. Not implemented in this session per SOW off-limits.

---

### Finding #26 — Serving Size input UX limitations

**Observation.** In the Nutraceuticals workspace Serving & Package Size section, Serving Size arrow controls cycle `1 → 2 → ... → 30 → 1` (wrap-around at 30). Cannot enter decimal values below 1 (e.g., `0.5 g` for a powder serving). Operator workaround requires switching the unit dropdown from `g` to `mg`, which then triggers Finding #27.

**Hypothesis.** Input control configured for integer-1-to-30 step range — likely defaults appropriate for F&B serving counts (e.g., 1-30 cookies per package) but wrong for supplement context where sub-gram doses are common.

**Severity:** LOW-MODERATE. Blocks natural workflow for common supplement serving sizes (any sub-gram powder, any half-capsule splitting, etc.). Compounds Finding #25's math issues by pushing operators into Finding #27's unit-change trap as a workaround.

**Recommended Round assignment:** Round 11+ Nutraceuticals workspace pass (batch with #25).

**Investigation status:** Round 11 scoping deliverable. Bounded UX fix — allow decimal Serving Size values; adjust step / min / max attributes on the input control. Compose with Finding #25's per-serving math model.

---

### Finding #27 — Unit-change preserves number, not mass

**Observation.** In the Serving & Package Size section, changing the unit dropdown from `g` to `mg` (or vice versa) preserves the numeric value rather than converting the mass. Example: Package Size `60` in `g` → operator switches unit to `mg` → field still displays `60` (now meaning 60 mg, not 60 g). Operator-invisible 1000× mass drop.

**Hypothesis.** Unit dropdown is a label-only control on the numeric field, not a mass-conversion control. F&B context typically uses one unit per workflow (grams for sauce; ounces for retail packaging), so the bug is rarely triggered. Nutraceuticals context routinely shifts between g / mg / mcg / IU depending on dosage tier, exposing the bug.

**Severity:** MODERATE. Operator-invisible mass change. Compounds Finding #25's math issues — operator changing units to work around Finding #26's input limitations triggers unintended 1000× mass change without visible warning, breaking Servings/Container math.

**Recommended Round assignment:** Round 11+ Nutraceuticals workspace pass (batch with #25 and #26).

**Investigation status:** Round 11 scoping deliverable. Two viable fix patterns: (a) auto-convert numeric value when unit changes (60 g → 60000 mg); (b) reset numeric value on unit change with a "set new value in [unit]" prompt. Pattern (a) preserves the operator's intent (the mass) and matches the convention of most unit-switching UIs. Pattern (b) is safer if the engine ever needs to know "this was a re-entry, not a conversion." Round 11 decides.

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

### B.9 — Section 3b.2 per-context routing verified on calcium propionate

Cap correctly scoped to baked-good productClass via `appliesToCategories: ['baked-good']` — calcium propionate did NOT fire in a General productClass formulation containing the ingredient (per-context routing working as designed). Same architectural behavior as Test 3's vitamin C non-firing in beverage productClass. Section 3b.2 scoping discipline holds across productClass-scoped entries.

### B.10 — Bucket A red banner verified on sodium benzoate and potassium sorbate

Both substances at 100% mass in General productClass produced the "Refuse-to-Export" red banner with:
- MEASURED input confidence (universal-cap entries; total-mass denominator)
- 21 CFR citation rendered inline (sodium benzoate → 21 CFR 184.1733; potassium sorbate → 21 CFR 182.3225)
- Legal framing in the evidence list
- Remediation guidance per `bucketAGate.ts:evaluateBucketA` reason text

The Section 3d enforcement gate operationalizes correctly against well-tagged catalog entries.

### B.11 — Bucket B amber path architecturally rare for well-tagged chemical preservatives

Architectural observation: preservatives with MEASURED catalog confidence + universal cap + total-mass denominator route to red Bucket A when over-cap, not amber Bucket B. The amber path exists for:

- Natural variability (ingredients where the chemistry is real but the catalog confidence is ESTIMATED — fat content of butter, meat content estimates)
- Multi-ingredient blends (combined-budget aggregates whose member inputConfidence floors at ESTIMATED)
- Residual carryover (Finding #20 — sulfite carryover from dried fruit or wine; chemistry present but operator hasn't supplied measured ppm)
- Custom ingredients with operator-supplied INFERRED/UNKNOWN data (Finding #24)

This is correct behavior: well-tagged commodity chemistry SHOULD hit MEASURED inputConfidence and route to hard-stop. Bucket B is the honest-estimate band for genuinely uncertain inputs, not a softer enforcement tier for the same data.

### B.12 — Finding #18 visual verification PASS

After Path A productClass mode-aware filter landed (commit 584b571), Nutraceuticals mode dropdown shows only "Dietary Supplement" — no irrelevant F&B-style options visible. Required-state styling + mode-aware hint text render correctly. Save flow blocks until selection per existing UX. Single click selects; save proceeds.

---

## Summary

**Findings requiring future work:** 12 (#14, #15, #16, #17, #18, #19, #22, #23, #24, #25, #26, #27).

- 1 fixed in Round 10 polish session (#18)
- 2 documented with no code change recommended (#14 — principled design; #17 — Round 12+ scope)
- 1 PA-gated, queued for verification (#15 — sulfite catalog gap)
- 1 operator-decision required, single small commit if approved (#16 — ascorbic acid promotion)
- 1 operator-decision required, scope-flexible (#19 — brand voice audit, ship-all / defer-all / selective)
- 1 architectural principle (#22 — co-sequence enforcement with catalog; informs Round 11+ scoping)
- 2 Round 11 Track B priority items (#23 regulatory table audit first; #24 custom ingredient workflow after catalog audit)
- **3 Round 11 Track A LAUNCH-BLOCKERS** (#25 Nutraceuticals workspace correctness; #26 Serving Size input UX; #27 unit-change mass preservation) — post-deploy smoke test on production 2026-05-15

**Verified clean:** 12 behaviors confirmed working as designed (Round 10 surfaces).

**Round 10 ship blockers:** None of the Round 10 findings (#14–#24) blocked merge — all were polish-or-deferred-scope items. Round 10 shipped to production cleanly (verified: pH 2.23 CALCULATED on prod, Finding #18 dropdown filter live).

**Round 11 launch-blockers (NEW, post-deploy):** Findings #25 / #26 / #27 surfaced via production smoke test on the Nutraceuticals workspace. P1 vertical (August deadline). Block August launch until addressed.

**Round 11 priority sequence** (revised in cumulative summary per post-deploy smoke test):
- **Track A (P1 launch-blocker, NEW first priority):** #25 Nutraceuticals workspace correctness pass → #26 Serving Size input UX → #27 unit-change mass preservation
- **Track B (P2 launch, F&B catalog/enforcement coherence):** #23 regulatory table audit → #15 + #21 catalog tagging pass → #16 ascorbic acid promotion → #24 custom ingredient workflow → #20 sulfite carryover schema (parallel)
- **Track C (Original Round 11 documentation infrastructure):** PA-review state machinery, PDS, Pre-production checklist, 5 harm-critical UNKNOWN items wired, HACCP upload, R9 leftovers

Tracks A and B touch different code areas (`lib/supplement*.ts` + Nutraceuticals path vs `lib/regulatoryLimits.ts` + `lib/data/*`) so can proceed in parallel.
