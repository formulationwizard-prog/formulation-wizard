# Acidified Foods pH Predictor — Round 12+ Strategic Roadmap

**Status:** Roadmap (not implementation). Captures the strategic vision while the framing is fresh; implementation begins Q4 2026.
**Surfaced:** 2026-05-17 (Round 11 Phase 3 Wave 1.5 close). Wizard-initiated food-science research question on pH prediction methodology for the acidified-foods section of F&B lab spec analysis.
**Scope:** Three-phase implementation plan — F4-A foundation / F4-B predictor / F4-C workspace integration.
**Sequencing:** Round 11 = no work (Nutraceuticals August 2026 launch focus). Q4 2026 onward as F&B re-entry begins.
**Authoring discipline note:** This is a research-and-scope directive deliberately written **months ahead of implementation**. The risk of implementation directives ageing out before execution is real; the risk of strategic-framing documents ageing out is lower because the strategic principle (honest-uncertainty-as-moat) is durable.

---

## Why this artifact exists

During the 2026-05-17 session (Wave 1.5 close), Wizard surfaced a substantive food-science question: *how should the acidified-foods section of the F&B lab spec analysis handle pH prediction?* Web research surfaced a peer-reviewed, USDA-funded methodology with publicly available reference software. The conversation evolved from a "cite/link externally" framing — point operators at the USDA reference tool, defer in-tool prediction — to a strategic "build in-tool screening predictor with accuracy improving over rounds while regulatory disclaimers stay constant" framing.

That strategic shift is what this roadmap captures. The methodology is published; the regulatory boundary is well-understood; the customer-data flywheel implications compound over rounds. Worth documenting now, while the framing is fresh, even though the implementation work is Q4 2026 and beyond.

---

## Strategic framing — honest-uncertainty as moat

**The anchoring principle:**

> Honest disclaimers protect the regulatory boundary. Predictive accuracy improves over time. Both compound.

This principle has applicability beyond pH prediction (cost estimates, shelf-life, bioavailability, allergen confidence, regulatory-status prediction). Worth articulating cleanly here so future cross-domain applications can reference the same framing.

### What stays constant

The regulatory disclaimer surface never moves:

- Predicted pH is **always** presented as a screening estimate
- 21 CFR 114 acidified-foods classification **always** requires measured equilibrium pH from finished product
- Process Authority (PA) review of measured (not predicted) pH is **always** required for regulatory submission
- The disclaimer envelope is locked at launch and does not evolve as accuracy improves

### What improves over rounds

| Dimension | Launch (F4-C) | Round 14 | Round 15 | Round 16+ |
|---|---|---|---|---|
| **Accuracy (confidence interval)** | ±0.15 pH units | ±0.10 | ±0.07 | ±0.05 |
| **Ingredient coverage** | ~50 (Longtin 2020) | 100+ | 250+ | 500+ |
| **Edge cases** | Simple acetic / citric | + salt effects | + heat effects | + fermentation dynamics |
| **Validation dataset size** | Published only | + ~100 customer pairs | + ~500 pairs | + ~2000 pairs |

### Customer data flywheel

Every operator who uses the in-tool screening predictor **AND** obtains lab-measured pH generates a validation data pair. These pairs accumulate into the largest real-world validation dataset for acidified-foods pH prediction in the industry:

- Dataset is proprietary (improves the model, hard for competitors to replicate)
- Trustwell and Recipal shipping today with no in-tool pH prediction cannot catch up without starting their flywheel from zero
- Confidence interval reduction is data-driven, not promotional — each tightening references the validation dataset size and method version that supports it
- Customer consent + data privacy framework for pair storage is deferred to F4-C scope (see Out of Scope below)

### Brand-voice alignment

The "substantial, technically credible, operator-to-operator" positioning is naturally served here. The predictor is exactly the kind of technical capability that earns operator trust: peer-reviewed methodology, citation-backed implementation, honest confidence intervals, no marketing-grade accuracy claims.

---

## Scientific foundation

### Primary references

**Price RE, Longtin M, Conley-Payton S, Osborne JA, Johanningsmeier SD, Bitzer D, Breidt F. 2020.** Modeling buffer capacity and pH in acid and acidified foods. *Journal of Food Science* 85(4):918-925. DOI: [10.1111/1750-3841.15091](https://doi.org/10.1111/1750-3841.15091)

Key findings:
- Buffer capacity (BC) models generated from titration curves for acetic and citric acid systems
- Predicted pH values within **±0.11 pH units** of measured pH
- Linear regression slopes between 0.96 and 1.01 versus measured pH (with and without added salts)
- Acetic acid concentration measurements within 6% accuracy versus HPLC for concentrations below 400 mM
- **Framework handles complex food matrices via empirically-determined buffering profiles rather than requiring known pKa values for every component** — this is the architectural advantage; ingredient databases of buffering profiles are tractable and grow incrementally

**Longtin M, Price RE, Mishra R, Breidt F. 2020.** Modeling the buffer capacity of ingredients in salad dressing products. *Journal of Food Science* 85(4):910-917. DOI: [10.1111/1750-3841.15018](https://doi.org/10.1111/1750-3841.15018)

Companion paper providing published BC values for common acidified-foods ingredients. **Directly usable as the F4-A launch ingredient database** (~50 ingredients with full BC parameters and methodology).

**Breidt F, Skinner CR. 2022.** Buffer models for pH and acid changes occurring in cucumber juice fermented with *Lactiplantibacillus pentosus* and *Leuconostoc mesenteroides*. *Journal of Food Protection* 85(9):1273-1281. DOI: [10.4315/JFP-22-068](https://doi.org/10.4315/JFP-22-068)

Extension of methodology to fermentation systems. Relevant for Round 14+ if the predictor scope expands to fermented acidified foods.

### Public reference implementations

| Tool | Source | License | Use |
|---|---|---|---|
| **BufferCapacity3** | USDA-ARS Food Science Research Unit (Raleigh, NC) | Public-domain typical for USDA-ARS work; **verify before reuse** | MATLAB application + Windows executable. Implements BC model from titration data input. |
| **IngredientDB** | [github.com/breidt-USDA/IngredientDB](https://github.com/breidt-USDA/IngredientDB) | **Must be verified before code reuse** | Companion tool that opens BC database files and predicts pH for ingredient mixtures with per-ingredient buffering contributions. |

**Contact:** Dr. Fred Breidt, USDA-ARS — fred.breidt@usda.gov (per the USDA-ARS software download page).

**License verification gate:** No code reuse or methodology adaptation from the GitHub repository before the license is verified explicitly. USDA-ARS work is typically public-domain or permissively licensed, but the specific repository terms must be confirmed and recorded. The published papers (Price 2020, Longtin 2020) provide a methodology citation path independent of any specific implementation, so even a restrictive GitHub license would not block F4-A or F4-B work.

---

## Three-surface integrity model applied to predicted pH

Same three-surface pattern as harm-critical-floor work (TOS legal layer + JSDoc engineering layer + PDS output artifact layer):

### TOS / regulatory framing surface

```
Predicted pH values produced by Formulation Wizard are screening estimates
derived from published USDA buffer-capacity methodology (Price et al. 2020).
Regulatory pH determination for acidified-foods classification under
21 CFR 114 requires measured equilibrium pH from finished product following
established lab measurement protocols. Predicted pH is not a substitute for
lab measurement. Process Authority review of measured pH remains required
for regulatory submission.
```

This text is **locked at F4-C launch** and treated with the same frozen-snapshot discipline as the supplements DSHEA disclaimer (`lib/__tests__/supplement-build-disclaimers.test.ts` pattern, §B4 SFP renderer constant).

### JSDoc / engineering layer

```typescript
/**
 * Predicted equilibrium pH for an acidified-foods formulation.
 *
 * SCREENING ESTIMATE ONLY — NOT VALID FOR REGULATORY SUBMISSION.
 * 21 CFR 114 requires measured equilibrium pH from finished product.
 *
 * Methodology: Price et al. 2020 (DOI 10.1111/1750-3841.15091).
 * Ingredient BC values: see citation field per IngredientBufferProfile entry.
 *
 * Model version stamped at prediction time; predictions are NOT comparable
 * across model versions without re-computation. When operators retrieve a
 * historical prediction, the model version is rendered alongside.
 *
 * Confidence interval: see PredictedPhEstimate.confidenceInterval. Widens
 * automatically for formulations using ingredients outside the validated
 * envelope (see PriceValidationEnvelope).
 */
interface PredictedPhEstimate {
  /** Best-estimate pH value. */
  estimate: number;
  /** Confidence interval (typically ±0.15 at F4-C launch). */
  confidenceInterval: number;
  /** Model version stamp — frozen at compute time; required for audit trail. */
  modelVersion: string;
  /** Per-ingredient contributions to the prediction; supports operator transparency. */
  contributions: IngredientPhContribution[];
  /** Whether the formulation is within the Price 2020 validation envelope. */
  withinValidatedEnvelope: boolean;
  /** When operator obtains lab-measured pH, captured here for the validation flywheel. */
  measuredPhPairing?: { measuredPh: number; capturedAt: string; consentGranted: boolean };
}
```

### PDS / output artifact layer

- **Predicted pH appears** in product-development reports with confidence interval, model version stamp, and required-measured-pH callout
- **Predicted pH does NOT appear** in regulatory submission packets without a corresponding lab-measured value paired
- **Model version stamp visible** in any artifact containing a predicted pH value
- **Three-surface boundary tests** confirm that TOS + JSDoc + PDS framing stay consistent — same shape as the §B4 SFP renderer test pattern

---

## Implementation phases

### F4-A — Foundation (estimated 5-10 hours, Q4 2026)

**Goal:** Ingredient buffer-capacity database in place. **No prediction logic yet.**

**Tasks:**
- Ingest published BC data from Longtin et al. 2020 ingredient table
- Define `IngredientBufferProfile` schema:
  - Ingredient identity (cross-references existing supplement catalog where overlap exists, e.g., citric acid, ascorbic acid)
  - BC parameters (acid concentrations + pK values from titration curve fits)
  - Citation field (per rulebook §I.2 authority hierarchy — Tier 5 peer-reviewed for Longtin 2020 source values)
  - Version timestamp
  - Confidence rating (Verified-Lab / Verified-Supplier-COA / Estimated / Inferred / Undocumented — per catalog rulebook §I.4)
- Populate launch database from published sources
- Cross-reference with existing supplement catalog: ingredient overlap (citric acid, ascorbic acid, sodium ascorbate, calcium citrate, etc.) should share canonical names + synonyms
- Unit tests on data integrity, citation completeness, schema conformance

**Deliverable:** `lib/data/bufferProfiles.ts` (or equivalent) with 30-50 validated ingredients and full citations. **No predictor code yet** — just the data substrate.

### F4-B — Predictor implementation (estimated 15-25 hours, Round 13)

**Goal:** TypeScript implementation of Price et al. 2020 BC + pH prediction algorithm. Validation tests against published ground-truth.

**Tasks:**
- Implement multi-buffer pH equilibrium solver per Price et al. 2020 methodology
- Numerical solver for the fourth-order (or higher with additional buffers) polynomial equation for `[H⁺]`
- Validation suite: reproduce published pH values from Price et al. 2020 validation cases within **±0.11 pH units** (the published accuracy ceiling)
- **Frozen-snapshot tests** on validation cases — same discipline as §B4 disclaimer constants. Published values are ground truth; deviations indicate implementation drift
- Confidence interval computation: widens automatically for formulations using ingredients outside the validated envelope
- Model version stamp emitted with every prediction (semantic versioning; `model.v.YYYY.QQ.NN`)
- **No UI yet** — pure compute layer, fully unit-tested

**Deliverable:** `lib/acidifiedFoods/phPredictor.ts` with full Price-2020 methodology, ≥20 validation tests passing against published ground-truth.

### F4-C — Workspace integration (estimated 10-15 hours, Round 14)

**Goal:** Confidence-labeled predicted pH appears in acidified-foods spec analysis UI. Three-surface integrity model wired across TOS, JSDoc, and PDS surfaces.

**Tasks:**
- Workspace UI: predicted pH display with confidence interval and required-measured-pH callout
- TOS / disclaimer text updated to cover the predictor (or new dedicated section under acidified-foods)
- PDS section template for product-development reports including predicted pH
- PDS section template for regulatory submission packets explicitly **excluding** predicted pH unless paired with measured value
- Frozen-snapshot tests on all regulatory-facing text
- Three-surface boundary tests confirming TOS + JSDoc + PDS framing stay consistent
- Operator can input lab-measured pH alongside predicted; pair gets captured for future validation dataset (with customer consent + data privacy framing — see F4-C scoping below)

**Deliverable:** End-to-end workspace flow from ingredient mixture → predicted pH with confidence interval → optional lab-measured pH input → product-development report PDS.

---

## Validation discipline

The Price et al. 2020 ±0.11 pH unit accuracy is achieved on simple validated systems. The platform's **launch confidence interval should be ±0.15 pH units** (wider than the published accuracy) to account for:

- Implementation differences from the reference MATLAB code
- Ingredient combinations outside the published validation set
- Cumulative uncertainty from BC values sourced from different studies
- Conservative framing protecting the regulatory disclaimer surface

The launch confidence interval is **deliberately conservative**. Customer-supplied predicted/measured pairs become the validation set that drives confidence-interval reduction over time. Tightening is data-driven; each step references the validation dataset size and method version that supports it. No promotional accuracy claims without paired data backing.

---

## License and attribution

- **USDA-ARS work is typically public-domain or permissively licensed**, but the specific IngredientDB GitHub repository license must be **verified before any code reuse or methodology adaptation**. License verification is a hard gate before F4-B implementation begins.
- **All ingredient BC values used from Longtin et al. 2020 must be cited at the per-ingredient level** in the `IngredientBufferProfile.citation` field.
- **Any direct algorithm implementation from Price et al. 2020 must cite the paper** in the source code header (per catalog rulebook §I.2 citation discipline — Tier 5 peer-reviewed authority).
- Methodology citations are independent of GitHub repository license, so the worst case (restrictive GitHub terms) does not block F4-B; only direct code reuse would be blocked.

---

## Cross-references

### Internal artifacts (forward-looking — may not exist at this directive's authoring time)

- Memory entry #18 — Acidified Foods pH predictor strategic capture (this roadmap's parallel memory artifact)
- **PA-Led HACCP Builder roadmap** (Memory #13) — pH predictor naturally connects to acidified-foods HACCP plan generation. Predicted pH feeds the HACCP framework determination (Critical Control Point identification for pH-controlled acidified foods).
- **CPI-driven Food Safety Plan Builder** (Memory #14) — pH predictor outputs feed into FSMA 117 / LACF (Low-Acid Canned Food, 21 CFR 113) / Acidified Foods (21 CFR 114) framework determination. Predictor confidence interval informs the certainty with which framework routing recommendations are made.

### Rulebook + governance

- **[Catalog Authoring Rulebook](../architecture/catalog-authoring-rulebook.md)** — §I.2 authority hierarchy applies to BC values; §I.4 confidence levels apply to predicted pH; §I.5 harm-critical floor applies to regulatory submission language (analogous to harm-critical fields for supplements).
- **Harm-Critical Floor architecture** ([docs/architecture/harm-critical-floor.md](../architecture/harm-critical-floor.md)) — same three-surface integrity model (TOS / JSDoc / PDS) applied here to predicted pH.

### Brand-voice alignment

The "substantial, technically credible, operator-to-operator" positioning is served by:
- Peer-reviewed methodology citation
- Honest confidence intervals (not promotional accuracy claims)
- Regulatory boundary respect (predicted ≠ measured)
- Customer data flywheel transparency

---

## Sequencing

| Round | Time | Status | Work |
|---|---|---|---|
| **Round 11** | (current) | Nutraceuticals August 2026 launch | **No work on this roadmap.** Focus is Nutraceuticals MVP. |
| **Round 12 — Q4 2026** | F&B re-entry | F4-A foundation phase | Ingredient BC database. ~5-10 hours. |
| **Round 13** | F&B continued | F4-B predictor implementation | Price 2020 algorithm + validation suite. ~15-25 hours. |
| **Round 14** | F&B continued | F4-C workspace integration | First customer-visible predicted pH. ~10-15 hours. |
| **Round 15+** | F&B ongoing | Customer data flywheel begins | Confidence interval tightens; ingredient catalog grows; fermentation-system extension (Breidt 2022) becomes scope candidate. |

---

## Out of scope for this roadmap

- **Implementation code.** This is a roadmap document, not an implementation task. Code work begins F4-A in Q4 2026.
- **Specific UI mockups.** Deferred to F4-C scoping when implementation begins. Premature mockup is wasted effort against an evolving design surface.
- **Customer data privacy framework** for validation pair storage. Deferred to F4-C; needs separate review against the brand's data-handling policies, customer consent UX, and (potentially) jurisdictional privacy regulation (GDPR / CCPA / equivalent depending on target markets).
- **Pricing/packaging decisions** on whether predictor is bundled with the F&B workspace or surfaces as a premium-tier feature. Deferred to Round 12+ business model review.
- **Fermentation-system extension** (Breidt 2022) — Round 15+ scope candidate. Not in launch envelope.
- **Cross-domain application** of the honest-uncertainty-as-moat principle (cost estimates, shelf-life, bioavailability, etc.). Each requires its own scoping. This document captures the principle; future cross-domain applications reference it from their own roadmaps.

---

## Done definition (for this directive)

- ✅ `docs/roadmap/acidified-foods-ph-predictor.md` exists with all sections populated
- ✅ Citations are accurate (verified against directive provided DOIs)
- ✅ Cross-references to memory entries are stated (linkage robust to either case: memory entries already exist or will be authored)
- ✅ AGENTS.md updated with pointer to this roadmap document under the F&B / acidified foods section
- ✅ Document committed to main with descriptive commit message

---

**Closing discipline note.** This document is intentionally durable. The strategic principle (honest-uncertainty-as-moat) survives any specific implementation choice. The phase plan (F4-A/B/C) is scoped to remain meaningful even if implementation chronology shifts. The license verification gate is non-negotiable regardless of what GitHub repository state is when work begins. The three-surface integrity model is the architectural pattern; the specific TOS / JSDoc / PDS text drafts here are illustrative and will be re-frozen at F4-C launch with the same discipline as the §B4 SFP renderer constants.

Authored 2026-05-17. Anchor revisited at Round 12 kickoff.
