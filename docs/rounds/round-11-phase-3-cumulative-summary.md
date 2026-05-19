# Round 11 Phase 3 — Cumulative Summary (DRAFT)

**Round:** 11
**Phase:** 3 (PA-review state machinery integration + harm-critical wiring continuation + supplement-mode rendering substrate cleanup + PDS export build + Track A full pre-flight verification)
**Status:** DRAFT — Phase 3 in progress. This document captures cumulative state as workstreams close; final version commits at Phase 3 close.

**Most recent update:** 2026-05-17 (Workstream A.5 close)

---

## Phase 3 workstream map

| Workstream | Scope | Status |
|------------|-------|--------|
| **Workstream A** | Segmented per-mode TOS + Nutraceuticals disclaimer (`fw-tos-supp-v1`) | ✓ Closed |
| **Workstream A.5** | Supplement-mode rendering substrate cleanup (post-Phase-2 UI verification findings + structural #25l fix) | ✓ Closed (this commit) |
| **Workstream B** | PDS generation pipeline | Pending — kicks off next |
| **Track A** | Full pre-flight verification suite execution | Pending |

---

## Workstream A — close summary

Closed at commits 8eae65e (locked text + frozen-snapshot test) + f0d6790 (state machinery + UI + footer mode-awareness). Two-commit landing of:

- `lib/supplementTos.ts` with `fw-tos-supp-v1` locked text — Sections 1–9 per Round 11 Phase 3 directive scope, including §9 Platform Enforcement Boundary that articulates the platform-vs-PA-authority integrity model in user-facing legal terms
- `lib/workspaceMode.ts` state machinery — mode preference + per-mode TOS acceptance + entry-screen decision + mode-change pre-flight + bidirectional reconcile helper
- UI integration in `app/workspace/page.tsx` — mode selection screen (pre-TOS), supplement TOS modal (renders SUPP_TOS_V1_SECTIONS), F&B modal preserved verbatim, mode-aware command palette + footer
- §7 MLM exclusion via structural-feature reframe (locked at Wizard call): "operating models where dietary supplement claim review and substantiation are distributed across non-employee distributors rather than centralized within a qualified regulatory function" — no "MLM" or "network marketing" terminology

**Phase 2 implementation-discovery finding #9** (pre-Round-11 first-visit disclaimer was entirely F&B-framed) → closed at f0d6790.

**Test growth (Workstream A):** 466 → 532 (+66; 32 TOS frozen-snapshot + 34 state machine).

---

## Workstream A.5 — close summary (this commit)

Workstream A.5 was scoped during Phase 3 from the 2026-05-17 UI verification audit (operator-side discovery: F&B framework leakage into supplement-mode workspace at code locations Phase 1 Finding #25 a/b/c did not cover, plus a §B4 SFP renderer regression). Same Finding #25 pattern at additional code locations.

**All 9 launch-blocking closures landed in 6 commits:**

| Commit | Closes | Hash |
|--------|--------|------|
| 1 | #25d, #25e, #25j — HACCP card cluster mode-aware framing | d03b4bb |
| 2 | #25f, #25g — AdvisoryNotice + filing engine mode-branching | 3da0499 |
| 3 | #25h, #25i — Formulation Spec Analysis mode-aware title + instrument list | 99ba82d |
| 4 | §B4 SFP regression (Phase 2 finding #10) — SFP renderer consumes `selectSupplementDisclaimer` | 7bf50f7 |
| 5a | #25l foundation — `lib/servingModel.ts` helpers + 85 tests | c6ba79f |
| 5b | #25l workspace state + Serving & Package Size card refactor | 720f31f |
| 5c | #25l utilization color bands + over-fill workspace warning | eb2fe5e |
| 5d | #25l 7th Producibility status card + Quality C closure | 04e3aac |
| 6 | §B4 cross-site consistency test extension | 2e38424 |

**Wizard calls locked at design-plan review (commit-message-anchored):**

- **SP3** — Per-unit weight semantics split: capsule + softgel are capacity-derived (capsule shell capacity bounds fill weight); tablet + gummy + lozenge + chewable are operator-input target weights (die-set / mold capacity / dosing semantics). Reasoning: gummy formulators legitimately think in target weight; forcing back-calculation is the Recipal-grade UX failure the structural fix was designed to prevent.

- **SP11** — 7th Producibility status card (Option b) over adjust-existing-6 (Option a). Reasoning: over-fill is a manufacturing concern, not a Safety concern; semantic clarity outweighs visual-surface minimization. Quality C ("all 6 cards green on 0g formulation") closes via the 7th card surfacing 'caution' (Pending) state pre-ingredient, breaking the false-confidence visual aggregate.

All other surface points (SP1, SP2, SP4-7, SP9, SP10, SP12-14) took CC defaults as proposed.

### The 60M-servings UX failure mode — structural elimination

The 2026-05-17 audit surfaced a "1 mcg serving size / 60 g package size / 60,000,000 servings per container" state shipping in the workspace (same failure mode visible in Recipal today). Root cause: structural input redundancy — workspace allowed independent inputs for count-based path (delivery form / units per serving / capsule size) AND mass-based path (serving size / package size) that could be set to mismatched units producing nonsense aggregate output.

Pre-A.5 fix attempted at sanity-cap layer would have been a symptom fix. **Workstream A.5 takes the structural fix** — delivery-form-aware input model where count-based forms (capsule/tablet/softgel/gummy/lozenge/chewable) consume count inputs + per-unit weight; mass is derived display. Mass-based (powder) and volume-based (liquid) forms use constrained unit dropdowns.

**The failure mode is structurally impossible at the input layer** post-5b. The 7th Producibility status card (5d) carries the rollup signal at the row-of-cards layer.

### Three-surface integrity model documentation

The Phase 2 §B3 work introduced the three-surface integrity model architectural pattern (engineering layer via JSDoc + legal layer via TOS §9 + output layer via PDS attestation block). Phase 3 Workstream A.5 extends the pattern to the #25l structural fix:

- **Input layer (5b):** Serving & Package Size card refactor — count-based forms expose count inputs only; mass-unit serving-size input is structurally impossible to enter
- **Card layer (5c):** Delivery Form & Dosage utilization color bands surface low-fill / approaching / over-fill states (SP9 band mapping)
- **Row layer (5d):** Producibility status pill rolls up the manufacturing-feasibility signal alongside Safety / Stability / Compatibility / NDI / Claims / Retail Fit

Same architectural pattern, applied to a different harm-critical-adjacent concern (manufacturing producibility vs regulatory attestation). Pattern reusable for future high-novelty work.

### Audit-memo correction running list — final state at A.5 close

**Phase 1 audit-memo corrections (pre-Round-11): 6 items — closed at Phase 1**

**Phase 2 implementation-discovery findings: 4 items — all closed**

| # | Finding | Closed at |
|---|---------|-----------|
| 7 | Butter/Milk substring collision | Phase 2 (Workstream A.5 finding date discovery) |
| 8 | buildDisclaimers PLURAL-only regression | Phase 2 §B4 migration (commit 928cdba) |
| 9 | TOS F&B framing | Workstream A (commit f0d6790) |
| 10 | §B4 SFP renderer regression | Workstream A.5 [4/N] (commit 7bf50f7) |

**2026-05-17 UI verification audit findings: 8 launch-blocking + Quality C — all closed**

| # | Finding | Closed at |
|---|---------|-----------|
| #25d | HACCP card cluster mode-aware framing | Commit 1 |
| #25e | Scheduled Process Filing F&B-only | Commit 1 |
| #25f | AdvisoryNotice mode-aware copy | Commit 2 |
| #25g | Filing engine supplement-mode citations | Commit 2 |
| #25h | Formulation Spec Analysis title mode-aware | Commit 3 |
| #25i | Supplement-relevant instruments | Commit 3 |
| #25j | HACCP hazard categories | Commit 1 |
| #25l | Serving Size structural fix | Commits 5a–5d |
| Quality C | All-green on 0g formulation | Commit 5d (via 7th Producibility card) |

**Deferred to Round 12+ per design plan:**
- Density-aware capsule capacity adjustments
- Mold-fill / tablet-press tonnage constraints
- Click-to-override fallback for read-only mass values (SP8 Option c)
- Operator-input weight escape hatch for capsule/softgel (SP3 Option c)
- Adjust existing 6 cards' logic for finer-grained 0g state handling (SP11 layered refinement on top of the 7th card)
- USDA fallback verification for supplement-mode ingredient search (potential #25k — may not need action)

### Test growth trajectory across Workstream A.5

| Milestone | Test count | Delta |
|-----------|-----------|-------|
| Phase 2 close | 466 | — |
| Workstream A close | 532 | +66 |
| A.5 Commit 1 (HACCP mode-aware) | 532 | +0 (JSX-conditional only) |
| A.5 Commit 2 (filing engine + AdvisoryNotice) | 542 | +10 |
| A.5 Commit 3 (Spec Analysis mode-aware) | 542 | +0 (JSX-conditional only) |
| A.5 Commit 4 (§B4 SFP migration) | 542 | +0 (defers to existing §B4 tests) |
| A.5 Commit 5a (serving-model helpers) | 627 | +85 |
| A.5 Commits 5b–5d (workspace integration) | 627 | +0 (composition tested via helpers) |
| A.5 Commit 6 (§B4 cross-site consistency) | 636 | +9 |
| **Workstream A.5 net** | **532 → 636** | **+104** |
| **Phase 3 cumulative (Workstream A + A.5)** | **466 → 636** | **+170** |

### Workstream B readiness — clean supplement-mode rendering substrate

The Phase 3 directive flagged Workstream A.5 sequencing as a prerequisite for Workstream B (PDS generation) because PDS reads workspace state — supplement-mode rendering leakage and §B4 SFP regression would have propagated into the PDS export surface at every export. Building PDS pipeline on a leaky substrate produces PDSes that fail the harm-critical floor at export time.

**Substrate state at A.5 close:**

- ✓ Supplement-mode workspace renders zero F&B framework labels (HACCP framework renamed to cGMP framework framing; Scheduled Process Filing F&B-only; Process Authority → qualified regulatory reviewer wording; Food Science → Formulation Spec Analysis; F&B instruments → supplement instruments)
- ✓ Filing engine returns supplement-specific citations (21 CFR 111 + DSHEA + 21 CFR 101.36/.93) in supplement mode
- ✓ §B4 disclaimer routes through `selectSupplementDisclaimer` at BOTH rendering sites (Claims Validator card + Supplement Facts Panel renderer) with cross-site consistency tests preventing drift
- ✓ Supplement Facts Panel renders disclaimer conditionally on claim count (CFR 101.93(c) compliant: 0 claims → no disclaimer; 1 → singular; 2+ → plural)
- ✓ Serving Size / Package Size inputs are structurally constrained per delivery form (count-based forms hide mass input; mass/volume forms use unit-constrained dropdowns)
- ✓ Producibility status pill surfaces manufacturing-feasibility signal at the row-of-cards layer

Workstream B PDS pipeline reads this substrate. Inheriting clean supplement-mode state means PDS export-time output is clean by construction — no per-export workaround needed for substrate gaps.

---

## Wave 1.5 arc — bulk-paste matchability + harm-critical-sibling architectural fix

Inserted between Wave 2 Phase 1 (complete) and Wave 2 Phase 2 (in progress) per the §38 framing in `docs/architecture/catalog-authoring-rulebook.md`. Wave 1.5 closed two architecturally-adjacent failure modes in the bulk-paste resolution pipeline:

1. **Matchability gap** — operator-pastable consumer names didn't resolve to formal-SKU catalog entries (Folate / Biotin / Pantothenic Acid silent-drop from the 2026-05-17 Test 1 multivitamin verification)
2. **Harm-critical-sibling silent-substitution** — bare-name operator paste silently committed one variant when sibling variants existed with materially different harm profiles (allergen / regulatory)

Both surfaced via operator browser verification, both required architectural fixes in the parser (not just catalog data), both extended the rulebook with new authoring discipline.

### Wave 1.5 commit map + test growth

| Wave | Commit | Scope | Tests added | Cumulative |
|------|--------|-------|-------------|------------|
| 1.5a | 9cea217 | `synonyms?: string[]` schema + parser-side matching + rulebook §II.8a / §38a / §IX.40 item 16 | +(infrastructure) | 803 |
| 1.5b | e1b7ddd | 8 Cat 1 backfills (B5 / B9 / Methylfolate ×2 / Melatonin / PC / Alpha-GPC / CDP-Choline) | +36 | 839 |
| 1.5c-partial | 9310d84 | 4 Cat 2 new entries (Biotin Cat 1 + Caffeine / SJW / Garlic Cat 2); 4 entries deferred per Path C | +34 | 873 |
| 1.5d | ba03bcd | Tier 2 stripped-name collision detection + NDI keyword-match refactor + Lecithin §38a grep-gap | +47 | 920 |
| 1.5e | 0b77512 | Cross-entry harm-critical check at three confident-match paths + retroactive synonym cleanup | +39 | 959 |

**Net Wave 1.5 test growth: 803 → 959 (+156).** Three browser verification rounds bracketed the implementation work, each surfacing the next architectural layer to address.

### Per-wave honest narrative

#### Wave 1.5a — synonym infrastructure foundation

Architectural-only commit. Added `synonyms?: string[]` field to `IndustrialIngredient`, wired into `findBestMatchWithTier` at Tier 1 (per-entry synonyms match) via `findBySynonym`, established `normalizeIngredientName` for variant-explosion handling (lowercase + strip parens / punctuation / dashes-to-spaces). Rulebook foundations laid: §II.8a (synonyms mandatory from Wave 1.5 forward), §38a (pre-authoring catalog-state verification via multi-keyword grep), §IX.40 item 16 (≥2 synonyms required per entry). One-time investment unlocked ~400 existing entries for synonym backfill.

#### Wave 1.5b — Cat 1 backfill

Eight pre-existing entries received `synonyms[]` per §II.8a discipline: Vitamin B5, B9, both Methylfolate branded forms (Metafolin + Quatrefolic), Melatonin, Phosphatidylcholine (PC 35% Soy), Alpha-GPC, CDP-Choline. Disambiguation discipline established for bare technical names: bare "Methylfolate" deliberately NOT claimed as synonym by either branded form (operator must specify Metafolin or Quatrefolic). Catalog-wide collision-detection invariant added: no two entries share a normalized synonym. Authoring-time collision check caught a real Alpha-GPC redundancy ('alpha-gpc' + 'alpha gpc' normalizing identically) — the §IX.40 item 16 test earning its keep at authoring time.

#### Wave 1.5c-partial — Cat 2 new entries

Four entries shipped through the full §IX.40 17-item checklist: Biotin (reclassed Cat 1 via §38a multi-keyword grep — entry pre-existed under formal name "d-Biotin (Vitamin H, USP)"), Caffeine Anhydrous, St. John's Wort, Garlic Extract. Four entries deferred (Caffeine-from-Green-Tea / Melatonin Time-Release / Choline Bitartrate / Magtein) per Path C rationale: highest-impact entries shipped today; quality-drift risk on additional entries under session fatigue exceeds operator benefit. PA-verification queue file filed for St. John's Wort label-interaction-text routing.

#### Round 1 browser verification (2026-05-18, post-1.5c-partial)

Operator-side bulk-paste verification round against the synonym infrastructure and Wave 1.5b/c entries. Twelve positive synonym tests + two disambiguation negative tests + Test 1 22-ingredient adult MV paste. Headline results: 12/12 positive PASS (synonym infrastructure working); 21/22 on Test 1 (Iodine surfaced as new catalog gap); two findings surfaced during the negative tests and the constructed-MV audit:

- **Methylfolate Tier 2 stripped-name collision** — bench-test code-trace of `findBestMatchWithTier` predicted silent Metafolin resolution before browser ran the test; operator-observation confirmed exactly. The bench-test → operator-observation discipline working in real time.
- **Lecithin §38a grep-gap** — paste "Soy Lecithin 100 mg" resolved to pre-existing F&B-era entry `Lecithin (Soy, Liquid, USP)` that the 1.5b author had said was "reserved for future dedicated lecithin entry." Author's grep was anchored to focal-entry terms, not anticipated-paste-shape terms.
- **PC 30% Soy/Sunflower allergen-profile differential** — catalog-wide stripped-name audit during 1.5d planning revealed 30+ collisions including PC 30% pair with different allergen profiles. Pre-Wave-1.5d, bare paste "Phosphatidylcholine 30%" would silently commit Soy variant to a Sunflower-targeted formulation.

Verification artifact: `docs/findings/customer-zero-inputs/2026-05-18-adult-mv-22-ingredient.md` (inaugural artifact for the customer-zero-inputs convention, template v1).

#### Wave 1.5d — Tier 2 stripped-name collision detection + NDI keyword-match refactor

Three architecturally-distinct fixes shipped in one commit per Wave 1.5d batched scope:

1. **Parser-side Tier 2 stripped-name collision detection** — `findBestMatchWithTier` now collects all stripped-name matches; if >1, returns Tier 3 with reason text enumerating candidates. Workspace's existing amber `⚠ Confirm match` UI surface fires automatically; no UI change required.
2. **NDI classification keyword-match refactor** — `classifyIngredientNDI` switched from substring matching to whole-word boundary regex with per-keyword `boundaryMode: 'standalone-token'` escape hatch for structural-moiety keywords (the choline-family overgeneralization fix). Partial-token keywords ('pyridox', 'pantothen', 'cobalamin', 'ashwagandh', 'lactobacill', 'bifido', 'saccharo') expanded inline to explicit whole-word forms. Caffeine + Lecithin added as documented (grandfathered / gras-food).
3. **Lecithin entry Wave-1.5 schema upgrade + rulebook §38a refinement** — pre-existing Lecithin (Soy, Liquid, USP) entry upgraded with synonyms / regulatoryStatus / pharmacopeialReference / coaTemplateType. Rulebook §38a extended with two-miss-mode disambiguation (Miss-mode A: grep-discipline gap; Miss-mode B: catalog-data quality gap) + in-commit-vs-defer decision rule.

**Closure-claims scope correction (1.5d retrospective).** The 1.5d commit message stated the "Bucket 1 PC 30% allergen-substitution finding CLOSED." The implementation was correct for its scope — the Tier 2 stripped-name collision-detection fix DID close the paste shape "Phosphatidylcholine 30%" (specific). However, the commit message's closure-claim overclaimed scope: bare "Phosphatidylcholine" paste (the operator-realistic shape) still silently resolved to PC 35% Soy via the Wave 1.5b synonym claim 'phosphatidylcholine', preempting the Wave 1.5d Tier 2 collision-detection layer one tier earlier. This emerged as the Wave 1.5e finding. The implementation didn't have a bug; the commit message's closure-claim was imprecise. Same correction discipline applied later to 1.5e's residual-framing.

**Lecithin Bucket 1 side-effect (1.5d retrospective).** The 1.5d Lecithin schema upgrade added `synonyms: ['soy lecithin', 'lecithin']` to the Soy Lecithin entry. The bare 'lecithin' synonym claim — added in good faith to close the §38a Miss-mode B gap — introduced the same Bucket 1 failure mode as the pre-existing PC case. Bare paste "Lecithin" would silently commit Soy variant; Sunflower Lecithin (allergen-free) became invisible. Surfaced via Round 2 verification and closed in 1.5e. The side-effect demonstrates why parser-layer enforcement is needed alongside authoring discipline: even careful schema-upgrade work can introduce new instances of the bug class if the discipline only exists at the catalog-data layer.

#### Round 2 browser verification (2026-05-18, post-1.5d)

Operator paste of `Phosphatidylcholine 100 mg` post-Wave-1.5d returned single silent Tier 1 match to PC 35% Soy. The Wave 1.5d Tier 2 collision detection did not catch this case — the bug fires at Tier 1 synonym, one tier earlier. Round 2 surfaced the synonym-layer bug class that Wave 1.5e closed.

#### Wave 1.5e — cross-entry harm-critical check at three confident-match paths

Architectural class-of-bugs fix. New module `lib/supplementHarmCritical.ts` defines the three-category harm-critical-difference predicate (allergen profile / identity-test requirement [forward-compat] / regulatory status). Parser-side `findHarmCriticalSiblings` injected at all three confident-match paths in `findBestMatchWithTier`:

- Tier 1 synonym match
- Tier 1 single-sub-ingredient match
- Tier 2 stripped-name single match

When a confident match fires, the cross-entry check searches the catalog for sibling entries whose stripped catalog name contains the paste-text as a whole-word substring (both sides normalized via `normalizeIngredientName` for dash-vs-space variant symmetry). If any sibling has a harm-critical differential, the parser escalates to Tier 3 with reason text enumerating candidates. The existing amber `⚠ Confirm match` UI surfaces the disambiguation automatically; no UI change required.

Retroactive synonym-claim cleanup applied to three Wave 1.5b/d entries per the new rulebook §II.8a harm-critical-sibling discipline:

- **Phosphatidylcholine (PC 35%, Soy)** — bare 'phosphatidylcholine' / 'pc' / 'phosphatidyl choline' removed; qualified-form synonyms 'phosphatidylcholine 35%' / 'pc 35%' / 'soy phosphatidylcholine' retained
- **Lecithin (Soy, Liquid, USP)** — bare 'lecithin' removed (closes the 1.5d side-effect); qualified 'soy lecithin' / 'soybean lecithin' retained
- **Alpha-GPC (L-Alpha-Glycerylphosphorylcholine)** — bare 'alpha-gpc' / 'l-alpha-gpc' / 'glycerophosphocholine' removed; qualified 'alpha-gpc soy' / 'soy alpha-gpc' retained

**Alpha-GPC was discovered during implementation, not pre-impl audit.** Test failure on the Wave 1.5b "Alpha-GPC (dash variant) resolves at Tier 1" assertion surfaced the third Bucket 1 case mid-impl. The Tier 4 audit had identified PC and Lecithin; Alpha-GPC emerged because the parser-layer cross-entry check fired against the AlphaSize Synthetic entry (allergen-free) that the audit hadn't surfaced. Implementation-discovery worked example for the audits-catch-known-failures, implementation-catches-adjacent-failures architectural pattern.

**Closure-claims scope correction (1.5e retrospective).** The 1.5e commit message described the chemical-name IUPAC paste forms (L-Alpha-Glycerylphosphorylcholine, Glycerophosphocholine) as having residual "silent-substitution" exposure. Round 3 browser verification surfaced the empirical truth: Tier 4 No-match, not silent substitution. The chemical-name forms route to the safe-default "no match, search manually" red prompt — operator-friction, not harm-critical-floor failure. The implementation was correct; the residual-framing in the commit message was imprecise in the opposite direction from 1.5d (over-residual-claim vs over-closure-claim).

#### Round 3 browser verification (2026-05-19, post-1.5e)

Three primary Bucket 1 cases verified end-to-end in operator UX. Each paste returned Tier 3 amber `⚠ Confirm match` prompt with both candidates enumerated + allergen differential visible in candidate-name signals:

| Paste | Primary candidate | Sibling candidate (harm-critical) | Allergen signal |
|-------|-------------------|-----------------------------------|-----------------|
| `Phosphatidylcholine 100 mg` | PC 35% Soy | PC 30% Sunflower Lecithin-Derived, Allergen-Free | "Allergen-Free" in name |
| `Lecithin 100 mg` | Lecithin (Soy, Liquid, USP) | Sunflower Lecithin (Liquid) | Source-name visible |
| `Alpha-GPC 300 mg` | Alpha-GPC (L-Alpha-Glycerylphosphorylcholine) | Alpha-GPC 50% (AlphaSize, Synthetic) | "Synthetic" qualifier |

Bonus residual-confirmation paste `L-Alpha-Glycerylphosphorylcholine 300 mg` returned Tier 4 No-match (safer than predicted silent-substitution, per the 1.5e closure-claims correction above).

### Bucket 1 findings closure tally

Four Bucket 1 cases surfaced across three browser verification rounds. Each was closed at the architectural layer where it surfaced, with operator-UX evidence captured:

| Finding | Round | Architectural layer | Closure commit | Closure status |
|---------|-------|---------------------|----------------|----------------|
| Folate / Biotin / Pantothenic Acid silent-drop | 1 | Tier 1 single-sub-ingredient catalog gap (matchability) | 1.5a/b/c-partial | **Closed end-to-end** (Test 1 22-of-22 verification, Round 3 paste-list artifact preserves evidence) |
| Methylfolate Tier 2 stripped-name silent-substitution | 1 | Tier 2 stripped-name collision (first-iteration-order wins) | 1.5d | **Closed end-to-end** (Round 2 browser verification confirmed Tier 3 disambiguation fires) |
| PC 30% Soy / Sunflower allergen-substitution | 1/2 | Tier 2 stripped-name (1.5d closed `Phosphatidylcholine 30%` paste-shape) + Tier 1 synonym (1.5e closed bare `Phosphatidylcholine` paste-shape) | 1.5d + 1.5e | **Closed end-to-end** (Round 3 browser verification confirmed Tier 3 with allergen differential visible) |
| Alpha-GPC Soy / AlphaSize Synthetic allergen-substitution | 3 (impl-discovered) | Tier 1 synonym + Tier 1 single-sub-ingredient | 1.5e | **Closed end-to-end** (Round 3 browser verification confirmed Tier 3 with "Synthetic" qualifier visible) |

The closure-status column is the audit-trail artifact future PA review needs. Each Bucket 1 case is traceable from finding → architectural layer → closure commit → operator-UX evidence.

### Architectural patterns added to cumulative-summary track

Seven patterns named precisely for future Claude sessions and PA review:

1. **Verification-as-discovery channel.** Each browser verification round closes the previously-discovered architectural layer AND probes the next. Empirically demonstrated across three rounds in this arc — Round 1 surfaced the catalog gap + the Tier 2 collision class; Round 2 surfaced the Tier 1 synonym class; Round 3 confirmed closure + surfaced the over-residual-claim. Verification investment IS the architectural-debt paydown channel; alternative is shipping latent harm-critical failures to customer-zero.

2. **Code-trace prediction → operator-observation confirmation discipline.** When verification has a known-suspicious code path, pre-investigate via code-trace before running the browser test. Operator-observation then confirms or refutes the predicted behavior. Worked examples: Methylfolate Tier 2 collision (code-trace of `findBestMatchWithTier` pre-Round-1 predicted silent Metafolin resolution; browser confirmed exactly) and NDI classification gap (5-minute pre-1.5d-implementation code read of `supplementNDI.ts` reframed the entire NDI two-state discipline at the correct architectural layer).

3. **Combinatorial-grep §38a refinement with two-miss-mode disambiguation.** Miss-mode A: grep-discipline gap (search anchored to focal-entry terms, not anticipated-paste-shape terms; rulebook fix, one-time). Miss-mode B: catalog-data quality gap (pre-existing entry surfaced but lacks current-schema fields; per-entry data fix, ongoing). Distinct miss-modes have distinct fixes and distinct velocity profiles. In-commit-vs-defer decision rule prevents routine synonym authoring from quietly becoming a 30-entry F&B-schema upgrade pass.

4. **Closure-claims bidirectional scope discipline.** Closure-claims must scope to specific paste-shapes and observed behavior, not predicted behavior. Demonstrated in BOTH directions across this arc: Wave 1.5d overclaimed fix scope (1.5d's commit message said PC 30% Bucket 1 finding CLOSED when only the qualified-paste-shape was); Wave 1.5e over-claimed residual exposure (1.5e's commit message said chemical-name IUPAC forms had silent-substitution residual when empirical reality is Tier 4 No-match). Both implementations were correct for their scope; both commit messages' scope-claims were imprecise. The discipline correction is bidirectional: commit messages should enumerate which paste-shapes are closed AND which paste-shapes (if any) remain open at adjacent layers.

5. **Harm-critical-sibling structural completeness.** The Wave 1.5e cross-entry harm-critical check fires at all three confident-match paths (Tier 1 synonym, Tier 1 single-sub-ingredient, Tier 2 stripped-name single match). Within the resolution-pipeline architecture, no remaining tier exists where a Tier 1/2 single-match could occur without harm-critical-sibling check. Class-of-bugs closed for the harm-critical-sibling pattern specifically. Note: adjacent bug classes remain possible (catalog-data layer with wrong allergen profile on an entry; display-rendering layer; cross-formulation interaction layer) — the structural-completeness claim bounds to the resolution-pipeline architecture only.

6. **Safe-default-when-unsure across surfaces.** NDI two-state discipline (DOCUMENTED entries appear in NDI_TABLE with authoritative basis; UNDOCUMENTED entries are deliberately omitted to fire the verbose unmatched advisory rather than silently claiming pre-1994 ODI). Tier 4 No-match for chemical-name IUPAC paste forms post-Wave-1.5e synonym cleanup (operator-friction "search manually" prompt rather than silent variant substitution). Same epistemic principle at two different surfaces: when the platform can't authoritatively claim X, surface that uncertainty rather than guessing.

7. **Resolution-pipeline three-layer harm-critical-floor discipline.** Distinct from the Phase 2 §B3 three-surface integrity model (TOS legal layer + JSDoc engineering layer + PDS output attestation block). The Wave 1.5e pattern operates on the resolution-pipeline axis: catalog authoring layer (synonym claims constrained by harm-critical-sibling rule) + parser layer (cross-entry check fires at all confident-match paths) + UI layer (Tier 3 disambiguation surface architecturally pre-existing). Harm-critical safety is enforced redundantly; if one layer fails (e.g., 1.5d's Lecithin authoring introduced a Bucket 1 case at the catalog layer), the next layer catches it (1.5e parser-layer check would have caught the Lecithin case had it shipped without retroactive cleanup).

### Discipline refinements codified in this arc

- **Rulebook §II.8a harm-critical-sibling synonym discipline** — when a substance family has multiple variants with harm-profile differentials, the bare technical name must NOT be claimed as a synonym by any single variant; only qualified synonyms (concentration- / source- / brand-qualified) are claimed
- **Rulebook §38a two-miss-mode + combinatorial grep + in-commit-vs-defer rule** — distinct miss-modes have distinct fixes
- **NDI two-state DOCUMENTED / UNDOCUMENTED** — keep undocumented entries OUT of `NDI_TABLE`; verbose unmatched advisory is the safer default
- **NDIBoundaryMode `standalone-token` escape hatch** — per-keyword discipline for structural-moiety substances; authoring decision-rule docstring codifies when to opt in
- **`docs/findings/customer-zero-inputs/` convention (template v1)** — frontmatter (date / session / formulation / catalog-commit-hash / template-version) + three-category Findings split (resolved-prior / newly-surfaced / unexpected-non-gap) + explicit Disposition mapping
- **Closure-claims bidirectional scope discipline** — commit messages enumerate which paste-shapes are closed AND which paste-shapes remain open at adjacent layers (applies to both over-closure and over-residual framing)

### Round 12 ticket queue from Wave 1.5 arc

Nine items routed forward from this arc:

1. **Chemical-name IUPAC synonyms (operator-friendliness, NOT harm-critical)** — add 'l-alpha-glycerylphosphorylcholine' / 'glycerophosphocholine' / 'l-alpha-gpc' to AlphaSize OR both Alpha-GPC entries so IUPAC paste forms resolve at Tier 3 disambiguation instead of Tier 4 No-match. Per Round 3 verification correction, this is operator-UX-friendliness, not harm-critical-floor failure.
2. **PC categorical anomaly** — PC 35% Soy in `Fatty Acids` category; PC 30% variants in `Vitamins` category. Same substance family, inconsistent taxonomy. Catalog hygiene.
3. **Choline-family branded-form NDI specificity** — Cognizin (Kyowa Hakko CDP-Choline) and Chemi Nutra Alpha-GPC have specific NDIs distinct from generic-choline grandfathered status. PA-research queue file `docs/pa-verification/2026-05-18-choline-family-ndi-specificity.md` filed.
4. **SJW NDI status** — PA-research queue file `docs/pa-verification/2026-05-18-st-johns-wort-ndi-status.md` filed; UNDOCUMENTED per Wave 1.5d two-state discipline pending authoritative-basis citation.
5. **Melatonin NDI status** — PA-research queue file `docs/pa-verification/2026-05-18-melatonin-ndi-status.md` filed; same UNDOCUMENTED status pending citation work.
6. **30+ stripped-name collision Bucket 1 / Bucket 2 audit** — `docs/findings/2026-05-18-catalog-stripped-name-collisions.md` enumerates pairs surfaced by the Wave 1.5d catalog-wide audit. Each pair needs harm-severity review (compare allergens / regulatoryStatus / claim-relevant fields). PC 30% confirmed Bucket 1 (closed by 1.5d/1.5e); remaining pairs provisionally Bucket 2 pending audit.
7. **Sunflower Lecithin (Liquid) Wave-1.5 schema upgrade** — adjacent F&B-era entry deferred from Wave 1.5d scope per §38a Miss-mode B decision rule. Bundle with the Round 12 catalog-hygiene pass (Path A preferred) OR escalate to a Wave 1.5f if customer-zero verification surfaces a Sunflower Lecithin paste failure first (Path B).
8. **CDP-Choline duplicate consolidation** — L228 (CDP-Choline / Citicoline / Cognizin) and L398 (Citicoline / CDP-Choline / Cognizin, Kyowa Hakko) are the same Cognizin substance; both have empty allergens; L228 lacks `regulatoryStatus`, L398 has `NDI-notified`. Not Bucket 1 per the two-state predicate (undefined ≠ differential), but is a catalog-data-quality asymmetry: an operator committing L228 has no NDI metadata even though the substance has an accepted NDI. Catalog hygiene: consolidate to one entry OR mirror L398's metadata onto L228.
9. **Iodine catalog gap** — Wave 2 Phase 1+ candidate (Test 1 22-of-22 audit surfaced; one unmatched line). Add Potassium Iodide or Kelp entry with appropriate forms.

**Additional follow-on audit ticket worth logging:** confirm during Round 12 that NO entry in any of the Wave 1.5d-surfaced stripped-name collision families ALSO claims a bare-name synonym at Tier 1 (synonym-layer follow-on coverage check for the 30+ catalog collisions). Vitamin E specifically (3 entries strip to "Vitamin E", 2 allergen-free + 1 Soy) currently does NOT claim bare 'vitamin e' synonym on any entry, so the Wave 1.5d Tier 2 collision detection catches it cleanly — but a category-wide audit of all 1.5d-surfaced pairs is the right discipline.

**Claim-detection consistency review** (10th item) — Metafolin formulation showed plural disclaimer text while B5 / Quatrefolic formulations showed singular, both at 1-ingredient state. Catalog notes phrasing-sensitivity surfaced during Round 1 verification; not Wave 1.5 scope but related observation worth Round 12 attention.

### Workstream B substrate readiness signal

Wave 1.5 closure establishes a substrate state that Workstream B (PDS generation) inherits:

- **Catalog state:** synonym infrastructure mature (§II.8a discipline operative); harm-critical-sibling discipline enforced at authoring time (qualified-only synonyms for substance families with allergen / regulatory differentials); ~400 entries paste-discoverable via consumer-name synonyms; allergen propagation verified end-to-end (Round 1 PC 35% Soy → SFP Contains statement + Allergen Statement section + Current Formulation badge).
- **Parser state:** Tier 2 stripped-name collision detection operative (Wave 1.5d); cross-entry harm-critical check fires at all three confident-match paths (Wave 1.5e); class-of-bugs closed for the harm-critical-sibling pattern within the resolution-pipeline architecture; NDI two-state discipline operative with `standalone-token` boundary-mode escape hatch.
- **Test state:** 959 tests with frozen-snapshot coverage on disambiguation prompt text (Wave 1.5e Surface F) + catalog-wide synonym collision invariant (Wave 1.5b) + harm-critical-difference predicate unit tests (Wave 1.5e Surface G) + forward-variant simulation test documenting the cross-entry check's auto-fire behavior when new sibling variants land (Wave 1.5e Surface E).
- **Open scope:** 9 Round 12 tickets logged + 4 deferred Wave 1.5 entries (Caffeine-from-Green-Tea / Melatonin TR / Choline Bitartrate / Magtein) still on the Round 11 launch-readiness queue per Path C rationale.
- **What this unblocks for Workstream B:** PDS generation can rely on catalog-resolved ingredients carrying accurate harm profiles at export time. The supplement-mode rendering substrate (cleaned by Workstream A.5) combined with the bulk-paste resolution substrate (cleaned by Wave 1.5) means the PDS pipeline reads ingredients that are (a) the correct branded form for the operator's intent (no silent substitution), (b) carry accurate allergen + regulatory metadata, and (c) surface ambiguity at paste-time rather than at export-time. PDS export-time output is clean by construction for the harm-critical-floor disclosures (Contains statement / Allergen Statement / DSHEA disclaimer / NDI Compliance status).

Workstream B doesn't start fresh; it starts on top of this substrate. The closure-claims scope discipline applies forward to Workstream B closure-claims as well — PDS export commits will enumerate which export paths are byte-reproducible, which §B4 refusal-check shapes fire, and which residual paste-shapes (if any) remain operator-disambiguation-deferred rather than parser-resolved.

### Wave 1.5 deferred scope (Round 11 launch-readiness queue, NOT Round 12)

Four Wave 1.5 entries remain deferred per Path C rationale at 1.5c-partial:

- Caffeine from Green Tea Extract (Focus / premium pre-workout stacks)
- Melatonin Time-Release (Sleep stack premium tier)
- Choline Bitartrate (MV core / Liver-Detox stacks)
- Magtein / Magnesium L-Threonate (Cognitive / Sleep-premium stacks)

These remain on the Round 11 launch-readiness queue rather than rolling to Round 12. Pattern-mechanical authoring per the §IX.40 17-item checklist; rulebook is now seasoned enough that the four entries should flow cleanly when authored. Final Wave 1.5 close commit pending.

---

## Workstream B — pending (PDS generation)

Per Round 11 Phase 3 directive scope (sub-decisions Steps 1–4 confirmed; Steps 5–8 require defer-permission gates before implementation):

### Confirmed (Steps 1–4, no design-surface required)

- **Step 1 — PDF library:** pdf-lib
- **Step 2 — Templating:** Option B section-template abstraction (`lib/pds/sections/` with one module per section)
- **Step 3 — Reproducibility:** Option A epoch (PDF metadata fixed to 1970-01-01T00:00:00Z; document ID from formulation version hash; canonical SHA-256 fixture lock with CI enforcement)
- **Step 4 — PDS layout:** 10 supplement-mode sections (Identity / Supplement Facts Panel-Style / Structure-Function Claims / DSHEA Disclaimer / Allergen Section / Identity Test Attestation Block / 21 CFR 111 cGMP Attestation Block — Option (a) single operator declaration / PA-Review State Block / Footer + Version Stamp / Document Header)

### Defer-permission gates (Steps 5–8)

CC surfaces implementation plan before coding for:
- Step 5 — Version hash-stamp approach
- Step 6 — State-gated export integration
- Step 7 — §B4 rendered-text refusal check
- Step 8 — §B4 display-rule validation

Pattern matches §B5 (net quantity from scratch) and §B3 + §B11 (keystone subset) and #25l (structural fix) defer-permission cadence proven across Phase 2 and Workstream A.5.

### Closure criteria

- pdf-lib + section-template + epoch reproducibility implemented
- All 10 PDS sections render correctly
- Byte-identical reproducibility verified via repeat-render + cross-time + canonical SHA-256 fixture tests
- §B4 rendered-text refusal check at export boundary working
- §B4 display-rule validation passes per CFR 101.93
- State-gated export refuses outside approved/version_locked
- PA-review state machinery integration tests started
- 5 harm-critical items integration tests started

---

## Track A — pending (full pre-flight verification suite)

Comprehensive cross-section integration run beyond Phase 2 Step 1's per-section work. Closes when:
- Full Finding #25 pre-flight verification suite passes (single-ingredient, multi-ingredient, edge cases, cascades)
- F&B regression at code layer (Phase 4 pre-deploy handles customer-zero F&B testing separately)

---

## Phase 3 closure criteria (forward look)

- ✓ Workstream A: TOS segmentation shipped, supplement disclaimer live
- ✓ Workstream A.5: Supplement-mode rendering substrate clean; 9 launch-blocking + Quality C findings closed
- [pending] Workstream B: PDS generation implemented with byte-reproducibility verified, §B4 enforcement at export boundary working
- [pending] Track A: full pre-flight verification suite passes
- [pending] PA-review state machinery integration tests started
- [pending] 5 harm-critical items integration tests started
- [pending] Final Phase 3 cumulative summary committed (this draft becomes final at Phase 3 close)

---

## Architectural patterns reinforced across Workstream A + A.5

Patterns proven in Phase 2 continue to hold through Phase 3 to date:

1. **Sibling-file pattern** for new modules (no-prefix when new-from-scratch like `lib/servingModel.ts`, `lib/netQuantity.ts`, `lib/identityTest.ts`; prefix when sibling-to-legacy like `lib/supplementAllergen.ts`, `lib/supplementTos.ts`).

2. **JSDoc anti-pattern callouts** on harm-critical types and modules — articulate platform-vs-human-authority integrity model in type/module documentation.

3. **Anti-creep rule** for high-novelty work — explicit scope boundaries named in the plan; stop and re-surface if implementation drifts.

4. **Defer-permission design-surface gates** before coding novel work — proven on §B5, §B3+§B11, TOS segmentation, and #25l structural fix. Wizard reviews surface points; implementation kicks off post-green-light.

5. **Frozen-snapshot test pattern** for regulatorily-sensitive text — `lib/supplementDisclaimer.ts`, `lib/supplementTos.ts`. Change-control trail discipline enforced at the test layer.

6. **Three-surface boundary articulation** — extended at #25l from the §B3 / TOS §9 / PDS pattern. Input layer / card layer / row layer for manufacturing producibility. Same architectural model applied to a different harm-critical-adjacent concern.

7. **Boundary tests** that codify architectural principles in executable form — §B3 anti-creep boundary test (Phase 2), §B4 cross-site consistency tests (A.5 Commit 6), serving-model 60M-vector regression test (A.5 5a).

8. **Push per commit** discipline maintained throughout — every commit pushes to origin/main individually; surface-back per commit; rollback paths preserved.

9. **Audit-memo discipline** — Phase 1 audit-memo + Phase 2 implementation-discovery + 2026-05-17 UI verification audit findings tracked separately by discovery channel; closure status updated at each fix commit.

---

## Strategic roadmap items (post-Round 11)

Logged here so they don't get lost during Phase 3 execution focus:

### Round 12 directive scoping (post-Round 11 close)
- Persistence layer (priority A — localStorage / Supabase save/load, "My Formulations" view, JSON export/import)
- Operator UI for attestation entry (§B3 + §B11 + cGMP)
- Multi-reviewer signoff and 6-state PA review evolution
- F&B-side wiring scope (Q4 prep) including F&B substantive TOS rewrite (`fw-tos-fnb-v1`)
- Density-aware capsule capacity adjustments (#25l SP9 refinement)
- Tablet-press tonnage / mold-fill validations (#25l producibility refinement)
- Click-to-override fallback for read-only mass values
- Pint / gallon support in §B5 (#25l-adjacent)

### Round 14+ / Q4 2026 / Q1 2027 strategic features
- PA-Led HACCP Builder (multi-framework: LACF, AF, FSMA 117, juice, seafood; PA pilot with 2-4 partners)
- CPI-driven Food Safety Plan Builder expansion (questionnaire intake determines applicable frameworks + plan structure)
- CPI-driven Economic Model expansion (questionnaire intake determines labor + overhead → true cost-per-unit)
- HTML→PDF migration path (Puppeteer/Playwright) if customer customization demand surfaces post-launch

---

## Phase 3 outlook

Workstream A and A.5 close clean. Phase 3 transitions to Workstream B (PDS generation) and Track A (full pre-flight verification). Both proceed against a clean supplement-mode rendering substrate — the foundational quality investment made by A.5 pays forward into every PDS export and every operator workflow that follows.

Next CC surface points:
- Workstream B Steps 1–4 kickoff (no design-surface required)
- Step 5 design plan (version hash-stamp approach) — defer-permission gate
- Step 6 design plan (state-gated export integration) — defer-permission gate
- Step 7 design plan (§B4 rendered-text refusal check) — defer-permission gate
- Step 8 design plan (§B4 display-rule validation) — defer-permission gate

Workstream A.5 closes here. Phase 3 in progress.
