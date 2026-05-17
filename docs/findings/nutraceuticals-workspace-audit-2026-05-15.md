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

---

# Post-Phase-2 UI Verification Audit (2026-05-17)

**Anchor:** Workspace screenshot captured 2026-05-17 in supplement mode (Nutraceuticals selected, "Dietary Supplement" Product Class, 1 ingredient Vitamin C Ascorbic Acid USP). Screenshot surfaced 10 distinct F&B-leakage and §B4-regression issues at code locations Phase 1 Track A (Finding #25 a/b/c) did not cover. Same Finding #25 pattern — F&B regulatory framework leaking into supplement-mode rendering surface — at additional code locations.

**Severity tiering:**
- **Launch-blocking (Finding #25 d–j pattern + §B4 SFP regression):** Issues that would ship F&B-framework labels in supplement-mode workspace or violate CFR 101.93(c) on the Supplement Facts Panel. Must fix before August 2026 Nutraceuticals MVP. **PDS generation depends on clean supplement-mode rendering substrate** — Phase 3 Workstream B (PDS) is gated on these fixes per Workstream A.5 sequencing decision.
- **Non-launch-blocking quality:** UX, validation, and status-logic issues that don't violate CFR but degrade the operator experience. Phase 4 pre-deploy queue or Round 12+ depending on severity.

---

## Launch-blocking findings — Finding #25 pattern at additional code locations

### Finding #25d — Suggested HACCP Program section renders in supplement mode

- **Location:** [app/workspace/page.tsx:6373-6488](../../app/workspace/page.tsx#L6373-L6488)
- **Trace:** The HACCP card wrapper at line 6373 (`<div className="bg-white rounded-xl border border-gray-200 p-6">`) has **no mode gate**. Adjacent card immediately above (Ingredient Compatibility, line 6297) IS properly mode-gated with `{mode === 'supplements' && ingredients.length > 0 && ...}`. The HACCP card was missed.
- **Symptom:** "🛡️ Suggested HACCP Program [INFERRED]" header renders in supplement mode. HACCP is the F&B Hazard Analysis Critical Control Points framework; supplements use 21 CFR 111 cGMP instead.
- **Fix shape:** Add `mode !== 'supplements'` guard wrapping the entire HACCP card section (lines 6373-6488). The 21 CFR 111 cGMP card that DOES render below it (visible in screenshot bottom right) is the supplement-correct equivalent.

### Finding #25e — Scheduled Process Filing subsection in supplement mode

- **Location:** [app/workspace/page.tsx:6439-6458](../../app/workspace/page.tsx#L6439-L6458) (nested inside the HACCP card)
- **Trace:** Subsection at line 6439 renders `Scheduled Process Filing` heading + `filingReq.formName` + "Open 📋 Filing →" button. Inherits the HACCP card's missing mode gate.
- **Symptom:** "SCHEDULED PROCESS FILING" / "Pending verified data — confirm with Process Authority" / explicit "21 CFR 113/114" references render in supplement-mode card. Scheduled Process Filing is 21 CFR 113 / 114 LACF + Acidified Foods workflow; F&B-only.
- **Fix shape:** Closed when #25d mode-gates the parent HACCP card. No separate fix needed.

### Finding #25f — "Process Authority" terminology + "Find a Process Authority →" link in Determination Engine card

- **Location:** [components/AdvisoryNotice.tsx:25-55](../../components/AdvisoryNotice.tsx) (consumes copy keys `'advisory.processAuthority'` + `'advisory.processAuthority.linkLabel'` from `lib/copy/strings.ts`) ; rendered by [components/DeterminationEngineCard.tsx:271-275](../../components/DeterminationEngineCard.tsx#L271-L275) gated by `showAdvisory`
- **Trace:** `showAdvisory` at [DeterminationEngineCard.tsx:226-229](../../components/DeterminationEngineCard.tsx#L226-L229) fires when `filing.processAuthorityRequired === true` OR severity ∈ {critical, warning, caution}. For supplements, severity is `'info'` (per the supplement branch at line 68-75), so the advisory should be gated by `filing.processAuthorityRequired` alone. The filing engine at [lib/scheduledProcess.ts:175](../../lib/scheduledProcess.ts#L175) defaults to `processAuthorityRequired: true` at the catch-all branch, which is what fires for supplements (no supplement-aware filing path exists).
- **Symptom:** "Advisory determination — requires Process Authority sign-off before commercial use." + "⚖️ Find a Process Authority →" link render under the supplement-mode determination card. "Process Authority" is the F&B-canonical 21 CFR 113.83/114.83 term; supplements need "qualified regulatory reviewer" or similar (same mode-aware wording we just shipped at the footer in commit f0d6790).
- **Fix shape:** Two-part:
  - (a) Mode-aware AdvisoryNotice — pass `mode` prop OR `text` + `linkLabel` overrides from `DeterminationEngineCard` based on `modeId === 'supplements'`. Supplement copy uses "qualified regulatory reviewer".
  - (b) Filing engine — `determineFilingRequirement` should branch on mode (or accept mode as input); supplement mode returns `processAuthorityRequired: false` (the supplement-specific "PA verification" semantics live at the §B3 attestation layer + Bucket 1 gate, not at the F&B Scheduled Process Filing layer).

### Finding #25g — Citations "21 CFR 113 · 21 CFR 114" in supplement Determination Engine

- **Location:** [components/DeterminationEngineCard.tsx:262-268](../../components/DeterminationEngineCard.tsx#L262-L268)
- **Trace:** Citations rendered from `filing.citations` array. The filing engine ([lib/scheduledProcess.ts:175](../../lib/scheduledProcess.ts#L175) default branch) returns 21 CFR 113/114 citations for any classification including the supplement fallthrough.
- **Symptom:** Determination card prose says "Acidified-foods and LACF logic do not apply; the relevant analyses are dosage safety (UL), stability/overage, NDI, and label claims." — correctly supplement-aware. BUT the same card's CITATIONS line shows "21 CFR 113 · 21 CFR 114" — internal contradiction within the same card.
- **Fix shape:** Filing engine returns supplement-specific citations array for supplement mode: `['21 CFR 111', 'DSHEA §403(r)(6)', '21 CFR 101.36', '21 CFR 101.93']` or similar. Closes alongside #25f filing-engine mode-branching.

### Finding #25h — "Food Science Spec Analysis" panel title in supplement mode

- **Location:** [app/workspace/page.tsx:5821-5827](../../app/workspace/page.tsx#L5821-L5827)
- **Trace:** Panel wrapper at line 5823 has no mode gate. Title at line 5825 hardcodes "🔬 Food Science Spec Analysis".
- **Symptom:** "Food Science" terminology + 🔬 icon render in supplement-mode workspace. "Food Science" is F&B-branded; supplements would use "Formulation Spec Analysis" or "Quality Spec Analysis".
- **Fix shape:** Two paths possible:
  - (a) Mode-aware title — `mode === 'supplements' ? 'Formulation Spec Analysis' : 'Food Science Spec Analysis'`. Card itself stays visible (supplements still track aw / moisture / other specs — see Specs to Track checklist).
  - (b) Move panel content to a supplement-mode equivalent card already rendering in the supplement workflow; hide the F&B panel entirely.
  - Recommend (a) — simpler, card has legitimate supplement-mode use (aw and moisture% are correctly tracked).

### Finding #25i — F&B-only instruments in Spec Analysis disclaimer (Bostwick consistometer, Brookfield viscometer)

- **Location:** [app/workspace/page.tsx](../../app/workspace/page.tsx) — Food Science Spec Analysis panel disclaimer text, near line 5825 (exact line within the panel block; needs precise locate during fix implementation)
- **Symptom:** Disclaimer text reads "Estimates based on ingredient composition. Use for formulation scoping; final product specs require lab verification (pH meter, Brix refractometer, a_w meter, Bostwick consistometer, Brookfield viscometer)."
  - **pH meter** — applies to liquid supplements but not most solid supplements
  - **Brix refractometer** — F&B sugar measurement; not applicable to supplements
  - **a_w meter** — applies to both
  - **Bostwick consistometer** — F&B sauce/condiment viscosity; not applicable to supplements
  - **Brookfield viscometer** — F&B leaning; some supplement use for liquids/syrups
- **Fix shape:** Mode-aware disclaimer text. Supplement instruments: HPLC (potency), ICP-MS (heavy metals), dissolution tester, disintegration tester, a_w meter. Pulls from per-class instrument registry; coupled with #25h fix.

### Finding #25j — HACCP hazard categories (Biological / Chemical / Physical) in supplement mode

- **Location:** [app/workspace/page.tsx:6469-6488](../../app/workspace/page.tsx#L6469-L6488)
- **Trace:** Three category cards (lines 6471, 6477, 6483) render inside the HACCP card body. Inherit the HACCP card's missing mode gate.
- **Symptom:** Bio/Chem/Phys hazard category labels render in supplement mode. Content under them (Botanical mis-identification / Heavy metals on botanicals / Glass fragments) is partially supplement-relevant, but the surrounding HACCP framework labels are F&B framework.
- **Fix shape:** Closed when #25d mode-gates the parent HACCP card. The supplement-equivalent hazard taxonomy lives downstream in 21 CFR 111 cGMP card content.

---

## Launch-blocking finding — §B4 disclaimer regression at Supplement Facts Panel

### §B4 Supplement Facts Panel renders hardcoded plural disclaimer regardless of claim count

- **Location:** [app/workspace/page.tsx:5239-5241](../../app/workspace/page.tsx#L5239-L5241)
- **Trace:** The Supplement Facts Panel rendering at lines 5163-5244 (inline JSX, not a component) emits the disclaimer at line 5239-5241 as an **inline hardcoded plural string**:
  ```tsx
  <p className="text-[9px] mt-2 leading-tight border-t-2 border-black pt-2 italic">
    * These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.
  </p>
  ```
  Renders **unconditionally** whenever the Supplement Facts panel renders. Does NOT consume `selectSupplementDisclaimer(claimCount)` from `lib/supplementDisclaimer.ts`.
- **Why Phase 2 §B4 migration didn't catch this:** Phase 2 commit 928cdba migrated `buildDisclaimers` at `lib/supplementClaims.ts` and its caller at `app/workspace/page.tsx:5503` (the Claims Validator card rendering — see [page.tsx:5798-5815](../../app/workspace/page.tsx#L5798-L5815)). That migration consumes the selector correctly. But the Supplement Facts Panel renderer at line 5163-5244 is a **second, independent rendering site** for the disclaimer that was not migrated. Two rendering sites; one migrated, one not.
- **CFR violation:** 21 CFR 101.93(c)(1) requires the SINGULAR form when exactly one structure/function claim is present on the label; 21 CFR 101.93(c)(2) requires plural when 2+. Per the regulation, the disclaimer is required only when claims are present (claim count > 0). The SFP renderer ignores claim count entirely.
- **Fix shape:**
  - Replace the inline string with conditional rendering: `{claimCount > 0 && <p>...{selectSupplementDisclaimer(claimCount)}...</p>}`
  - The asterisk-footnote prefix (`'* '`) is the presentational convention preserved in `buildDisclaimers` output; SFP renderer should match — prepend `'* '` to the selector output
  - Extend §B4 frozen-snapshot test discipline to cover this rendering site (e.g., assert SFP renderer consumes `selectSupplementDisclaimer`, OR add a render-time test asserting the panel emits the correct form for 0/1/2+ claim counts)
- **Phase 2 implementation-discovery finding #10** — this is the second §B4 regression discovery (Item #8 was `buildDisclaimers` PLURAL-only; this is the SFP-renderer parallel issue). Both close the §B4 gap. Confirms the value of UI-verification discipline.

---

## Non-launch-blocking quality findings

### Finding #25l — Serving Size unit + Servings/Container validation gap (launch-adjacent)

- **Symptom:** Serving Size = "1" with unit dropdown set to **mcg**. Package Size = 60 g. Auto-computed Servings/Container = **60,000,000** (displayed as "60000000" without thousands separators).
- **Trace:**
  - Mode-switch reconciliation at [app/workspace/page.tsx:135-176](../../app/workspace/page.tsx#L135-L176) correctly sets supplement-appropriate defaults (servingSize=2, packageSize=60, both 'g') when switching from F&B with F&B defaults. So the 1/mcg state must have been set manually OR via load-from-saved.
  - Serving Size unit dropdown at [page.tsx:3762](../../app/workspace/page.tsx#L3762) renders `{mc.units.map(u => <option key={u}>{u}</option>)}` — exposes ALL mode units including mcg, mg, g, kg with no constraint. For supplements, mcg is technically valid for trace-ingredient quantities but clearly absurd as a serving-size aggregate (no capsule/powder serving is 1 microgram total).
  - Auto-compute at [page.tsx:534-535](../../app/workspace/page.tsx#L534-L535): `Math.round((packageSizeInGrams / servingSizeInGrams) * 10) / 10` with no upper-bound clamp. 60g / 0.000001g = 60,000,000 — math is correct given inputs; the upstream input is unsanitary.
  - No `validateServingSizeInput` upper-bound check for combined absurdity (input value within nominal min/max but unit choice produces nonsensical aggregate).
- **Why launch-adjacent rather than pure quality:**
  - PDS export will render "Servings Per Container: 60,000,000" on the Supplement Facts Panel verbatim — that's a wrong-on-the-label value reaching consumer-facing artifact at export time. Not a direct CFR violation (CFR doesn't cap servings/container) but a real-world labeling integrity failure
  - Would survive PA review if PA is rubber-stamping (which the platform's positioning explicitly does NOT assume — but the input is also so obviously wrong that catching it at the platform layer is the right discipline)
  - Phase 2 §B5 net-quantity tolerance check (±2% declared-vs-computed) might catch some downstream effects but the root cause is input-validation upstream of §B5
- **Fix shape (three layers, increasing intrusiveness):**
  - (a) **Sanity cap on Servings/Container** — block / warn when auto-computed value exceeds some threshold (e.g., 500 servings hard-warn for typical supplement containers; allow override with explicit operator acknowledgment). Smallest surface, catches the worst-case immediately.
  - (b) **Serving Size unit auto-suggest by delivery form** — capsule/tablet/softgel → default 'mg'; gummy/chewable → default 'mg'; powder → default 'g'; liquid → default 'mL'. Updates when delivery form changes (similar pattern to the existing mode-switch unit reconciliation at line 135-176). Prevents the mcg-default trap.
  - (c) **Sanity warning on serving size mass** — when `servingSize * UNIT_TO_GRAMS[servingUnit]` produces a value below some threshold (e.g., < 1 mg for solid forms), surface a warning hint near the input. Defensive in depth.
  - Recommend (a) + (b) for Workstream A.5; (c) deferred to Round 12+ refinement.
- **Severity:** Launch-blocking-adjacent. PDS export-time concern. Recommend including in Workstream A.5 scope rather than deferring to Phase 4 pre-deploy.

### Quality Finding B — Determination Engine internal contradiction

- **Symptom:** Same card displays correct supplement prose ("Acidified-foods and LACF logic do not apply") AND incorrect F&B citations ("21 CFR 113 · 21 CFR 114"). Already captured as Finding #25g.
- **Severity:** Launch-blocking. Closes alongside #25g.

### Quality Finding C — Formula Status cards all green on a 0g formulation

- **Symptom:** Top of workspace shows 6 status pills (Safety / Stability / Compatibility / NDI / Claims / Retail Fit) all green with positive copy ("All doses safe", "No bottleneck", "Ready", etc.) when the formulation has 1 ingredient at 0.0g quantity.
- **Trace:** Status logic likely uses presence-of-ingredient rather than quantity-meaningfulness as the input. Showing "All doses safe" on a 0g formulation is technically true (no doses → no doses unsafe) but misleads operator confidence.
- **Severity:** Quality, not regulatory. Phase 4 pre-deploy queue OR Round 12+ depending on operator priority.

---

## Bonus observation — potential Finding #25k (USDA fallback for supplements)

- **Symptom:** Hint text under Add Ingredient reads "Industrial DB first, then USDA fallback. Or browse the 🍎 Ingredient DB tab." USDA FoodData Central is food-specific; supplement ingredients are typically not in USDA database. USDA fallback for supplements may surface false matches (food items partially matching supplement ingredient names).
- **Severity:** Marginal. Could be #25k if it causes ingredient-data quality issues at launch. Worth verifying behavior during Workstream A.5 fixes.

---

## Workstream A.5 scope summary

**In scope (launch-blocking):**
- #25d (HACCP card mode-gate)
- #25e (closes with #25d)
- #25f (AdvisoryNotice + filing-engine mode-branching)
- #25g (filing-engine citations mode-branching — closes with #25f)
- #25h (Food Science panel title mode-aware)
- #25i (Spec Analysis disclaimer instruments mode-aware — closes with #25h)
- #25j (closes with #25d)
- §B4 SFP renderer migration to `selectSupplementDisclaimer`
- #25l (Serving Size unit + Servings/Container validation — fix layers (a) sanity cap + (b) delivery-form-aware unit default)

**Deferred (Phase 4 pre-deploy queue or Round 12+):**
- Quality Finding C (status cards on 0g formulation)
- #25l fix layer (c) — sanity warning on absurdly small serving-size mass (defensive depth)
- Potential #25k (USDA fallback for supplements — verify behavior, may not need action)

**Estimated commit count:** 5-7 commits scoped per concern (mode-gating the HACCP card cluster; mode-branching AdvisoryNotice + filing engine; mode-aware Spec Analysis panel; §B4 SFP renderer migration; #25l Serving Size validation; consolidation + Bucket-1-gate-pre-flight extension for SFP-disclaimer + #25l scenarios). Pre-flight tests where text is regulatorily-sensitive (frozen-snapshot patterns for any new locked strings); state-machine tests where mode-gating logic is non-trivial.

**Workstream B (PDS generation) sequencing gate:** Workstream A.5 closes before Workstream B Step 1 begins. Per Workstream A.5 sequencing decision — PDS reads workspace state, and Workstream A.5 fixes the supplement-mode rendering substrate.

Round 11 directive will scope what's in vs deferred. This memo provides the entry points.
