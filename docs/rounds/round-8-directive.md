# Round 8 — Rendering Polish and Confidence Treatment Unification

The engine is producing correct outputs, but several display surfaces have rough edges that erode the customer-zero experience. None of these are correctness bugs — they're polish issues that accumulate into "the workspace feels rough." This round addresses 7 specific items clustered around the confidence taxonomy spine.

## Defer-permission discipline

If any item surfaces architectural questions mid-work that can't be cleanly resolved within Round 8 scope, defer it explicitly. Surface as a Round 9+ ticket with the architectural question stated. Do not punt silently. Do not ship a half-fix. Consistent with the "refactors wait for stable data layer" pattern from prior rounds.

## Item 1 — Brix display rounding ambiguity

**Current:** when Brix delta rounds to zero, the display reads `0.2° ± 0.0°`. Visually unclear what the value means.

**Fix:** when delta rounds to zero at current display precision, either (a) increase precision to surface the actual delta value, or (b) suppress the `± 0.0°` framing entirely and signal precision differently. Decide which approach better matches the existing Spec Analysis panel rendering pattern. If unclear, surface as a UX question rather than picking one silently.

## Item 2 — LAC precision mismatch

**Current:** LAC % renders 1 decimal in Spec Analysis (`54.4%`) and 2 decimals in Determination Engine threshold bar (`54.35%`).

**Fix:** standardize precision across both surfaces. The 5%/10% filing thresholds make 2-decimal precision regulatorily meaningful — apply 2-decimal consistently, OR if 1-decimal is intended, ensure the Determination Engine bar matches.

## Item 3 — UNKNOWN confidence rendering

**Current:** ingredients with UNKNOWN confidence render as em-dash with no pill.

**Fix:** render UNKNOWN as an explicit neutral-gray pill labeled "UNKNOWN" so users can distinguish "we don't know this value" from "this surface doesn't have data here." This UPDATES the Round 1 confidence vocabulary — UNKNOWN now has its own visual treatment.

## Item 4 — Sustainability surfaces missing confidence pills

**Current:** Carbon, Water, Sustainability Score, Organic % render as bare values without confidence treatment.

**Fix:** extend confidence pill rendering to Carbon, Water, Sustainability Score, Organic %. Use the updated confidence vocabulary post-Item-3: CALCULATED stone, ESTIMATED+INFERRED amber, MEASURED no pill, UNKNOWN neutral-gray pill per Item 3, Class 3 slate.

**Dependency:** Item 3 must land before Item 4 so Sustainability surfaces pick up the new UNKNOWN treatment.

### Rollup math design caveat — pre-warning before implementation

Confidence rollup for sustainability metrics may NOT cleanly reuse the pH pattern. Per-metric expectation:

- **Carbon footprint (per kg):** likely transfers cleanly — per-mass extensive property, sums by mass weighting
- **Water footprint (per kg):** likely transfers cleanly — same pattern as carbon
- **Sustainability Score:** depends on how the score is computed. If it's a weighted composite, rollup math may not decompose by mass cleanly. Surface the actual computation logic before applying rollup.
- **Organic %:** genuinely different — binary-per-ingredient property aggregating as "% of formulation mass that's organic." Has its own rollup logic that doesn't parallel pH.

The "what to do when a ≥5% ingredient lacks data" question applies to all four:

- (a) Treat as zero — understates if data is missing rather than zero
- (b) Exclude from denominator — distorts rollup
- (c) Flag formulation rollup as INFERRED-only or UNKNOWN — honest about gap

This is a design decision. If the agent encounters this question for any metric, defer that specific metric's rollup to Round 9+ rather than inventing the rule on the fly.

### Fallback hierarchy — agent must NOT collapse "defer rollup math" into "defer Item 4 entirely"

The Round 1 confidence taxonomy operates at per-value granularity. The formulation rollup tier (mass-floor at ≥5%, ESTIMATED floor across the formulation) was added in Session 3 ON TOP OF the per-value taxonomy. These are independently deferrable.

Three levels of scope, ship the highest level achievable per metric:

- **Level 1 — Full scope:** Pill rendering at per-ingredient row + formulation-level rollup tier with mass-floor logic. Reserved for metrics where rollup math cleanly reuses the pH pattern.
- **Level 2 — Partial scope:** Pill rendering at per-ingredient row only; formulation-level rollup deferred to Round 9+. Per-ingredient confidence metadata already exists in the catalog (Poore & Nemecek 2018 for carbon, Mekonnen & Hoekstra for water). Per-ingredient pills render against existing metadata without touching formulation rollup math. This still ships visible customer-zero value.
- **Level 3 — Full defer:** Only justified if per-ingredient confidence metadata is also missing for that metric. Surface as a finding rather than silently shipping nothing.

**Rule:** Default to Level 2 when Level 1's rollup math has unresolved design questions. Never collapse to Level 3 unless per-ingredient metadata is genuinely absent.

Surface in commit message: which sustainability metrics shipped at which Level, and what the deferred design questions are for any deferred rollup math.

## Item 5 — HACCP card vocabulary inconsistency

**Current:** HACCP card uses "Starter Template" vocabulary while other surfaces use ESTIMATED/CALCULATED/MEASURED/INFERRED.

**Fix:** unify to the standard confidence taxonomy vocabulary. If the HACCP card is communicating something genuinely different (template-derived guidance vs verified plan), map onto existing taxonomy — perhaps INFERRED for template-derived HACCP guidance, MEASURED once the customer has uploaded a verified PA-approved HACCP plan. Don't invent new vocabulary; map onto existing.

## Item 6 — Vinegar Powder acetic acid display

**Current:** Vinegar Powder catalog entry has em-dash render where acetic acid metadata should be. Possibly partially addressed in Round 6/7 but worth verifying.

**Fix:** investigate current state of Vinegar Powder (White, Dried) (or equivalent) in the catalog. If `aceticAcid` metadata is missing, populate it (typical commercial vinegar powder has 5-7% bound acetic acid equivalent). If metadata IS populated but display still shows em-dash, find the rendering logic gap. Surface findings either way — don't leave the em-dash there.

## Item 7 — Single-ingredient compound rendering ("Pickling Salt (Salt)" case)

**Current:** when an ingredient's sub-ingredient statement is a single word matching the common name, the assembly logic produces redundant parens. Caught in Round 7 verification: `Pickling Salt (Salt)`.

This is more delicate than it first appears. The fix MUST handle these test cases correctly:

- Sea Salt with sub-ingredient "Salt" → render as `Sea Salt` (suppress redundant parens) ✓
- Pickling Salt with sub-ingredient "Salt" → render as `Pickling Salt` (suppress) ✓
- Smoked Salt with sub-ingredient "Salt, Smoke Flavor" → render as `Smoked Salt (Salt, Smoke Flavor)` (do NOT suppress — multi-component compound)
- Salt with sub-ingredient "Sodium Chloride" → ambiguous, treat as do-not-suppress (chemical name disclosure may be relevant to 21 CFR 101.4 even though substantively the same compound). Document the choice.
- Vanilla with sub-ingredient "Vanilla Extract" → render as `Vanilla (Vanilla Extract)` (do NOT suppress — different form, disclosure-relevant)
- Cucumber with sub-ingredient "Cucumber" → render as `Cucumber` (suppress — exact match)
- Honey (Industrial Grade) with sub-ingredient "Honey" → render as `Honey` (suppress — qualifier-stripped common name matches sub-ingredient exactly)

### Required deliverables for Item 7

- **Enumerate test cases.** Build the test matrix above plus any additional edge cases identified during implementation.
- **Verify 21 CFR 101.4 compliance preservation.** Round 4 explicitly addressed 101.4 compliance for ingredients statement assembly. Round 8 must not regress that compliance. 21 CFR 101.4 generally favors more disclosure, not less. Suppression is for cases where parens are redundant noise, NOT for cases where parens contain disclosure-relevant information.
- **Document the suppression rule explicitly.** Code comments AND a brief design doc (in `/docs/` or as comment block at top of assembly function). State the rule positively and negatively, with test case examples as documentation.
- **The conservative default is to retain parens.** When the rule is ambiguous about a case, default to retaining parens. 21 CFR 101.4 favors disclosure.
- **Audit existing catalog entries against the new rule.** After implementing, run against all existing catalog entries. List which entries change rendering output and which don't. Surface this list so the operator can spot-check that changes match expectations.

## Out of scope

- Filing Readiness percentage logic (Round 9 — needs definitional decision before computation change)
- Bulk paste matcher refinements (Round 10 — Round 5 follow-up)
- Branding/rename items (specifics not yet captured — separate workstream)
- New UX additions like header chip set expansion (item 18 — UX consideration, not polish)
- Any item where architectural questions surface mid-work — defer to Round 9+ with the question stated

## Verification on Vercel after push

For each of the 7 items, build a quick test scenario:

- **Brix:** load any formulation that produces Brix display at low precision. Verify no `± 0.0°` ambiguity.
- **LAC:** load any formulation with LAC > 5%. Verify Spec Analysis and Determination Engine threshold bar render same precision.
- **UNKNOWN:** find or build a formulation with at least one UNKNOWN-confidence value. Verify it renders as explicit pill, not empty em-dash.
- **Sustainability:** load any formulation. Verify Carbon, Water, Sustainability Score, Organic % carry confidence pills at whichever Level shipped.
- **HACCP:** load any formulation. Verify HACCP card vocabulary uses ESTIMATED/CALCULATED/MEASURED/INFERRED, not "Starter Template."
- **Vinegar Powder:** add Vinegar Powder to a formulation. Verify acetic acid metadata renders correctly.
- **Single-ingredient compound:** load the Round 7 test formulation (pickle/Caesar style with Pickling Salt and Pickling Spice Blend). Verify "Pickling Salt" renders without redundant parens AND verify "Pickling Spice Blend (Mustard Seed, Bay Leaves, ...)" still renders WITH parens. Build additional test formulations to verify edge cases from the Item 7 test matrix.

**Hold push pending operator spot-check after Vercel rebuild.**
