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
