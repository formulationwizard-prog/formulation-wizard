# Nutraceuticals Workspace QA Test Plan

**Drafted:** 2026-05-22 by Opus (operator + Opus session); organized 2026-05-23 by CC.
**Scope:** Build tab walkthrough + cross-cutting concerns. Other 9 tabs (Section VI) need their own plan extensions.
**Audience:** QA agents new to this project. References to memory files / docs/ artifacts are grep-able from the repo root.
**Status mode:** Pre-execution. Status column blank; populated as tests are run.

---

## 0. Reading this doc

### Tag conventions (added by CC during organization pass)

**Severity tags** (one per test):
- `[HC]` **Harm-critical.** Pass/fail bucket per the customer-owned PA model. Fail loud, block save. Examples: allergen disclosure, disease-claim blocks, identity-test enforcement, disclaimer verbatim text, net-quantity unit conversion.
- `[REG]` **Regulatory correctness.** Verifies regulatory citation accuracy, framework routing, label-text wording. Typically needs `[SME]` co-sign for binary pass/fail.
- `[FUNC]` **Functional code behavior.** Verifies app behavior is correct (inputs produce expected outputs, UI states render correctly). CC-runnable in principle.
- `[PERF]` **Performance or scale.** Verifies behavior under load / large input / edge dimensions.
- `[UX]` **UX polish or cosmetic.** Lower priority unless workflow-blocking.

**Execution-dependency tags** (one or more per test):
- `[CC]` CC can run solo — code reads, test suite invocation, file checks.
- `[OP]` Needs operator at keyboard — browser interaction, screenshot capture, reproduction in running app.
- `[SME]` Needs domain expert — Process Authority reviewer or co-founder for regulatory accuracy verification. CC cannot binary pass/fail.
- `[BE]` Needs running backend — Supabase, auth, or external service.

**Status column** (one per test, fill as run):
- `[ ]` not-started
- `[✓]` passing
- `[✗]` failing
- `[⏸]` blocked (note blocker)
- `[N/A]` not applicable

### Test ID convention

`T-{section}.{subsection}.{n}` — stable references. E.g., `T-I.1.1` is the first test in Section I.1. Reference these in commit messages, bug reports, and inter-session handoffs.

### Two-bucket distinction (per Opus's preamble)

Tests split into:
1. **Harm-critical [HC]** — enforced at 100%, fail loud, block save. Pass/fail binary.
2. **PA-reviewable [REG]** — surfaced with confidence + range; PA decides. "Renders correctly with appropriate uncertainty surfaced."

### Mode-gate testing (per Opus's preamble)

Mode-gate is per-surface, not batched. Every Nutraceuticals-mode test pairs with confirmation that the equivalent F&B path doesn't leak in. Finding #25 documented 4 code points; the principle applies broader. **9 separate mode-gate test points exist across this plan** — they are intentionally distributed, not duplicated.

---

## I. Launch-blocking surface — run first

**Directive D-I:** 4 sub-cards. Suggested execution order: I.1 (disclaimer — gates all access) → I.2 (mode-gate — gates correctness) → I.3 (harm-critical floor — gates safety) → I.4 (F&B Finding 1 cross-impact — gates engine).

### I.1 First-visit disclaimer modal (fw-tos-v2)

| ID | Test | Tags | Status |
|---|---|---|---|
| T-I.1.1 | Renders on first-ever visit per session/device | [HC][FUNC][OP] | [ ] |
| T-I.1.2 | Verbatim disclaimer text matches fw-tos-v2 spec | [HC][REG][SME] | [ ] |
| T-I.1.3 | MLM exclusion present, framed as operating-model-based per Option 1 reframe | [HC][REG][SME] | [ ] |
| T-I.1.4 | "MLM" terminology NOT used anywhere | [HC][REG][CC] | [ ] |
| T-I.1.5 | Nutraceuticals-aware (different text than F&B mode would show) | [HC][FUNC][OP] | [ ] |
| T-I.1.6 | Cannot be dismissed without affirmative acknowledgment | [HC][FUNC][OP] | [ ] |
| T-I.1.7 | Acknowledgment persists across sessions | [FUNC][OP][BE] | [ ] |
| T-I.1.8 | Re-acknowledgment triggered when disclaimer version bumps | [FUNC][OP][BE] | [ ] |
| T-I.1.9 | Renders cleanly on narrow + wide viewports | [UX][OP] | [ ] |

### I.2 Mode-gate behavior (Finding #25 — 4 code points)

| ID | Test | Tags | Status |
|---|---|---|---|
| T-I.2.1 | F&B → Nutraceuticals: math model uses supplement-mode rules (no F&B carry-over) | [HC][FUNC][OP] | [ ] |
| T-I.2.2 | Mode swap: regulatory panel content swaps cleanly (no F&B panels in Nutraceuticals) | [HC][REG][OP][SME] | [ ] |
| T-I.2.3 | Determination engine routes to DSHEA / 21 CFR 111, not LACF / 21 CFR 117 | [HC][REG][OP][SME] | [ ] |
| T-I.2.4 | Filing-required text says cGMP, not Scheduled Process | [HC][REG][OP][SME] | [ ] |
| T-I.2.5 | cGMP Program shows 21 CFR 111, not 21 CFR 117 Preventive Controls | [HC][REG][OP][SME] | [ ] |
| T-I.2.6 | Hazard categories pulled from supplement set (botanical mis-ID, probiotic strain drift), not F&B set | [HC][REG][OP][SME] | [ ] |
| T-I.2.7 | Every regulatory citation in Nutraceuticals mode is supplement-appropriate | [HC][REG][OP][SME] | [ ] |
| T-I.2.8 | Reverse direction also tested: Nutraceuticals → F&B doesn't leak supplement logic | [HC][FUNC][OP] | [ ] |

### I.3 Harm-critical floor defaults

Maps to memory `feedback_harm_critical_fields_default_undocumented.md`. Empty fields default to UNDOCUMENTED, never VERIFIED-SAFE.

| ID | Test | Tags | Status |
|---|---|---|---|
| T-I.3.1 | Empty `allergens` renders as "UNDOCUMENTED — investigation needed," not "No allergens" | [HC][FUNC][OP] | [ ] |
| T-I.3.2 | Empty `drugInteractions` renders as UNDOCUMENTED, not "No known interactions" | [HC][FUNC][OP] | [ ] |
| T-I.3.3 | Empty `ndiStatus` renders as UNDOCUMENTED, not "Not required" | [HC][FUNC][OP] | [ ] |
| T-I.3.4 | Empty `regulatoryStatus.US` renders as UNDOCUMENTED, not "Approved" | [HC][FUNC][OP] | [ ] |
| T-I.3.5 | SFP "No major allergens detected yet" phrasing audited under loaded ingredients with empty-allergen-arrays — verify NOT a VERIFIED-SAFE silent-failure | [HC][REG][SME] | [ ] |

### I.4 F&B Finding 1 cross-impact (bulk-paste float display)

Maps to `docs/findings/2026-05-23-fb-finding-1-nutraceutical-cross-impact.md` (cross-impact confirmed at code-path level; specific manifestation pending operator reproduction).

| ID | Test | Tags | Status |
|---|---|---|---|
| T-I.4.1 | Reproduce exact F&B repro steps in Nutraceuticals bulk-paste | [HC][FUNC][OP] | [ ] |
| T-I.4.2 | Float precision: 1500 mg displays as 1500 mg, not 1500.0000000001 | [HC][FUNC][OP] | [ ] |
| T-I.4.3 | If float bug present in shared code path (`lib/parseFormula.ts`): launch-blocking | [HC][FUNC][OP] | [ ] |

---

## II. Build tab — left column

**Directive D-IIA through D-IIG:** One directive per card. Card-sized scope per directive per Opus's framing.

### II.A Formulation Name & Product Type card — Directive D-IIA

| ID | Test | Tags | Status |
|---|---|---|---|
| T-II.A.1 | Formulation Name accepts: empty / single char / 200+ char / Unicode / apostrophes / ampersands | [FUNC][OP] | [ ] |
| T-II.A.2 | Product Type dropdown lists Nutraceuticals-mode options only (not F&B types) | [FUNC][OP] | [ ] |
| T-II.A.3 | Product Class * lists Dietary Supplement classes per DSHEA | [REG][SME] | [ ] |
| T-II.A.4 | "Product Class is required" error blocks save when class unselected | [HC][FUNC][OP] | [ ] |
| T-II.A.5 | Error clears immediately when class selected | [FUNC][OP] | [ ] |
| T-II.A.6 | Specs to Track defaults — F&B-shape leak audit (pH/Water Activity/Brix/Moisture % defaults vs supplement-shape defaults CFU/peroxide/disintegration/hardness/friability per `project_spec_system_multi_product_class.md`) | [FUNC][SME][OP] | [ ] |
| T-II.A.7 | Acetic Acid % / Bostwick / Brookfield: should not render for capsule-form supplements — mode-gate concern | [FUNC][OP] | [ ] |
| T-II.A.8 | Part Number auto-generates `SUP-26-NNNN` format (not F&B prefix) | [FUNC][OP] | [ ] |
| T-II.A.9 | Part Number override accepts arbitrary ERP/SKU strings | [FUNC][OP] | [ ] |
| T-II.A.10 | Part Number stays stable across version bumps (1.0.0 → 1.0.1) | [FUNC][OP] | [ ] |
| T-II.A.11 | Save button disabled until required fields complete | [FUNC][OP] | [ ] |
| T-II.A.12 | Save persists specs-to-track selections to Supabase | [FUNC][OP][BE] | [ ] |

### II.B Add Ingredient card — Directive D-IIB

| ID | Test | Tags | Status |
|---|---|---|---|
| T-II.B.1 | Search returns matches by name and by supplier | [FUNC][OP] | [ ] |
| T-II.B.2 | Search respects Nutraceuticals category-gate (doesn't surface F&B-only ingredients) | [FUNC][OP] | [ ] |
| T-II.B.3 | Industrial DB primary → USDA fallback works as documented | [FUNC][OP] | [ ] |
| T-II.B.4 | Qty accepts integer + decimal; rejects negative / zero / non-numeric | [HC][FUNC][OP] | [ ] |
| T-II.B.5 | Unit dropdown lists supplement-appropriate units (mg, g, mcg, IU, billion CFU) | [FUNC][OP] | [ ] |
| T-II.B.6 | Add appends to Current Formulation | [FUNC][OP] | [ ] |
| T-II.B.7 | Add triggers right-column re-render (SFP, Spec Analysis, allergen detection, DV recalc) | [FUNC][OP] | [ ] |

### II.C Bulk Paste modal — Directive D-IIC (highest-risk test surface)

| ID | Test | Tags | Status |
|---|---|---|---|
| T-II.C.1 | Opens cleanly from Bulk Paste button | [FUNC][OP] | [ ] |
| T-II.C.2 | Parses ingredient + qty + unit from TSV / CSV / line-delimited input | [FUNC][OP] | [ ] |
| T-II.C.3 | F&B Finding 1 float-display bug regression check — cross-reference T-I.4.1-3 | [HC][FUNC][OP] | [ ] |
| T-II.C.4 | Unknown ingredients surface clearly — never silently dropped | [HC][FUNC][OP] | [ ] |
| T-II.C.5 | Ambiguous names surface match candidates; require user disambiguation | [HC][FUNC][OP] | [ ] |
| T-II.C.6 | `potencyFactor` + `elementalFactor` back-computation correct for known label-claim cases | [HC][FUNC][SME] | [ ] |
| T-II.C.7 | Confidence + range rendering: every back-computed value shows confidence per `feedback_confidence_taxonomy_foundational.md` | [REG][FUNC][OP] | [ ] |
| T-II.C.8 | Mode-gate: doesn't accept F&B-format paste in Nutraceuticals mode | [FUNC][OP] | [ ] |
| T-II.C.9 | Cancel discards pasted content | [FUNC][OP] | [ ] |
| T-II.C.10 | Confirm appends parsed entries atomically | [FUNC][OP] | [ ] |

### II.D Current Formulation card — Directive D-IID

| ID | Test | Tags | Status |
|---|---|---|---|
| T-II.D.1 | "0 ingredients" counter updates as ingredients added/removed | [FUNC][OP] | [ ] |
| T-II.D.2 | Empty state copy renders | [UX][OP] | [ ] |
| T-II.D.3 | Each ingredient renders with name, qty, unit, supplier | [FUNC][OP] | [ ] |
| T-II.D.4 | Remove button removes from list + triggers right-pane re-render | [FUNC][OP] | [ ] |
| T-II.D.5 | Inline qty edit updates SFP + Spec Analysis immediately | [FUNC][OP] | [ ] |
| T-II.D.6 | Ingredients persist across reload (Supabase) | [FUNC][OP][BE] | [ ] |
| T-II.D.7 | 50+ ingredient lists render without UI degradation | [PERF][OP] | [ ] |

### II.E Serving & Package Size card — Directive D-IIE

| ID | Test | Tags | Status |
|---|---|---|---|
| T-II.E.1 | Servings/Container: integer only, no decimal, no negative | [HC][FUNC][OP] | [ ] |
| T-II.E.2 | Total Capsules auto-syncs with Servings × Units Per Serving | [FUNC][OP] | [ ] |
| T-II.E.3 | Per-Capsule Weight derived from formulation mass ÷ total capsules | [FUNC][OP] | [ ] |
| T-II.E.4 | Label preview "2 Capsules" per serving matches Units Per Serving from Delivery Form card | [FUNC][OP] | [ ] |
| T-II.E.5 | Serving Size (mass) = per-capsule weight × units per serving | [FUNC][OP] | [ ] |
| T-II.E.6 | Package Size (mass) = per-capsule weight × total capsules | [FUNC][OP] | [ ] |
| T-II.E.7 | Net quantity unit conversion — mass → label-statement accurate to FDA tolerance | [HC][REG][SME] | [ ] |

### II.F Delivery Form & Dosage card — Directive D-IIF

| ID | Test | Tags | Status |
|---|---|---|---|
| T-II.F.1 | Delivery Form options: capsule hard shell, soft gel, tablet, powder, liquid, gummy | [FUNC][OP] | [ ] |
| T-II.F.2 | Units Per Serving propagates to Serving & Package Size correctly | [FUNC][OP] | [ ] |
| T-II.F.3 | Capsule Size options (#000, #00, #0, #1, #2) with mg-fill ranges | [FUNC][OP] | [ ] |
| T-II.F.4 | Capsule Size changes Per-Capsule Weight ceiling | [FUNC][OP] | [ ] |
| T-II.F.5 | Intended Audience options: General Adult / Pediatric / Geriatric / Pregnancy / Lactation | [FUNC][OP] | [ ] |
| T-II.F.6 | Audience selection tightens dose limits for retinol, iron, caffeine, melatonin — verify each per population | [HC][REG][SME] | [ ] |

### II.G Capsules, Bottles & Closures card — Directive D-IIG

| ID | Test | Tags | Status |
|---|---|---|---|
| T-II.G.1 | Container dropdown lists curated containers across 5 categories | [FUNC][OP] | [ ] |
| T-II.G.2 | Closure dropdown lists curated closures | [FUNC][OP] | [ ] |
| T-II.G.3 | "+ ADD CUSTOM" opens custom-item flow for each | [FUNC][OP] | [ ] |
| T-II.G.4 | Data Sheet button opens spec sheet for selected container/closure | [FUNC][OP] | [ ] |
| T-II.G.5 | Packaging cost rolls into Per Package in Cost Summary (cross-tab verify) | [FUNC][OP] | [ ] |
| T-II.G.6 | Mode-gate: lists supplement-appropriate packaging (HDPE bottles, blister packs), not F&B (jars, pouches) | [FUNC][OP] | [ ] |

---

## III. Build tab — right column

**Directive D-IIIA through D-IIID:** One directive per card.

### III.A Determination Engine card — Directive D-IIIA

| ID | Test | Tags | Status |
|---|---|---|---|
| T-III.A.1 | Title text verbatim "DSHEA-Regulated Dietary Supplement (21 CFR 111)" | [HC][REG][SME] | [ ] |
| T-III.A.2 | Driving metrics text references Safety / Stability / NDI panels (which need to exist below) | [REG][OP][SME] | [ ] |
| T-III.A.3 | Filing-required text wording exact | [HC][REG][SME] | [ ] |
| T-III.A.4 | Why text matches DSHEA/cGMP framework explanation | [REG][SME] | [ ] |
| T-III.A.5 | Citations 21 CFR 111 / 21 CFR 101.36 / 21 CFR 101.93 / DSHEA §403(r)(6) each link to authoritative source | [HC][REG][SME] | [ ] |
| T-III.A.6 | Advisory determination notice present | [HC][REG][OP] | [ ] |
| T-III.A.7 | "Find a qualified reviewer →" link target verified (Process Authorities tab? external?) | [FUNC][OP] | [ ] |
| T-III.A.8 | Mode-gate: F&B mode shows LACF/FSMA framework, not DSHEA | [FUNC][OP] | [ ] |

### III.B Supplement Facts Panel card — Directive D-IIIB (most regulatory-sensitive surface)

| ID | Test | Tags | Status |
|---|---|---|---|
| T-III.B.1 | SFP renders verbatim per 21 CFR 101.36 format | [HC][REG][SME] | [ ] |
| T-III.B.2 | Serving Size matches "{Units Per Serving} {form-name}" pattern | [HC][FUNC][OP] | [ ] |
| T-III.B.3 | Servings Per Container matches input | [HC][FUNC][OP] | [ ] |
| T-III.B.4 | Amount Per Serving aggregated correctly per ingredient | [HC][FUNC][SME] | [ ] |
| T-III.B.5 | % Daily Value pulled from `lib/supplementLabeling.ts` DV table | [HC][REG][SME] | [ ] |
| T-III.B.6 | Ingredients ordered descending by weight | [HC][REG][OP] | [ ] |
| T-III.B.7 | Sub-ingredients in parens per FDA format | [HC][REG][SME] | [ ] |
| T-III.B.8 | "Other Ingredients:" line lists non-SFP components | [HC][REG][OP] | [ ] |
| T-III.B.9 | Save as PDF produces PA-review-ready packet (provenance, flags, version-locked snapshot per `project_honest_estimate_reframe.md`) | [HC][FUNC][OP] | [ ] |
| T-III.B.10 | Allergen Statement auto-detected from `allergens` fields | [HC][FUNC][OP] | [ ] |
| T-III.B.11 | Empty-allergen state messaging audited per harm-critical floor — cross-reference T-I.3.5 | [HC][REG][SME] | [ ] |

### III.C Formulation Spec Analysis card — Directive D-IIIC

| ID | Test | Tags | Status |
|---|---|---|---|
| T-III.C.1 | "4 tracked" counter matches selected checkboxes | [FUNC][OP] | [ ] |
| T-III.C.2 | Each spec renders with confidence + range per `feedback_confidence_taxonomy_foundational.md` | [REG][FUNC][OP] | [ ] |
| T-III.C.3 | Per-spec predicted vs measured rendering | [REG][SME] | [ ] |
| T-III.C.4 | Pass/warn/fail visualization against target | [FUNC][OP] | [ ] |
| T-III.C.5 | Known gap (per `project_spec_system_multi_product_class.md`): spec set currently F&B-shaped; supplement-specific specs (hardness, friability, disintegration, peroxide value, CFU) need to slot in — track as expansion ticket, not pass/fail | [N/A][SME] | [N/A] |

### III.D Suggested cGMP Program card — Directive D-IIID

| ID | Test | Tags | Status |
|---|---|---|---|
| T-III.D.1 | "INFERRED" label present | [HC][REG][OP] | [ ] |
| T-III.D.2 | Title verbatim "21 CFR 111 cGMP (Dietary Supplement)" | [HC][REG][SME] | [ ] |
| T-III.D.3 | Body citations §111.75 / §111.205 / §111.255 / §111.460 / §111.560 / 21 CFR 190.6 — each accurate | [HC][REG][SME] | [ ] |
| T-III.D.4 | Biological hazards supplement-appropriate (botanical mis-ID, probiotic strain drift, microbial contamination) | [HC][REG][SME] | [ ] |
| T-III.D.5 | Chemical hazards supplement-appropriate (heavy metals, Prop 65, USP <232/233>, pesticide residues, solvent residues) | [HC][REG][SME] | [ ] |
| T-III.D.6 | Physical hazards supplement-appropriate (glass fragments, capsule shell breakage, particulate) | [HC][REG][SME] | [ ] |
| T-III.D.7 | CCP 1-5 each renders with §-citation + limit text matching §111 requirements | [HC][REG][SME] | [ ] |
| T-III.D.8 | "Show monitoring..." expandable opens deeper detail | [FUNC][OP] | [ ] |
| T-III.D.9 | "INFERRED — not yet facility-specific" warning visible | [HC][REG][OP] | [ ] |
| T-III.D.10 | Mode-gate: F&B shows 21 CFR 117 Preventive Controls, not 21 CFR 111 | [FUNC][OP] | [ ] |

---

## IV. Top bar / global — Directive D-IV

| ID | Test | Tags | Status |
|---|---|---|---|
| T-IV.1 | Logo + wordmark render | [UX][OP] | [ ] |
| T-IV.2 | Tagline accurate | [REG][SME] | [ ] |
| T-IV.3 | Mode indicator strip accurate | [FUNC][OP] | [ ] |
| T-IV.4 | Search everything (⌘K) — keyboard shortcut works on Mac + Windows | [FUNC][OP] | [ ] |
| T-IV.5 | Search scope verified (formulations + ingredients + ?) | [FUNC][OP] | [ ] |
| T-IV.6 | Theme toggle: Light / Dim / Dark — each renders cleanly, persists across reload | [UX][FUNC][OP] | [ ] |
| T-IV.7 | Text contrast meets WCAG AA in all three themes | [UX][OP] | [ ] |

---

## V. Mode switch — Directive D-V

| ID | Test | Tags | Status |
|---|---|---|---|
| T-V.1 | F&B → Nutraceuticals: confirmation prompt or auto-switch? Verify intent | [FUNC][OP] | [ ] |
| T-V.2 | Workspace state preserved or cleared on switch? Verify intent | [HC][FUNC][OP] | [ ] |
| T-V.3 | URL/route reflects mode for shareability | [FUNC][OP] | [ ] |
| T-V.4 | F&B mode shows F&B-appropriate cards; Nutraceuticals shows DSHEA/cGMP cards | [HC][REG][OP][SME] | [ ] |
| T-V.5 | Zero cross-leakage in either direction (Finding #25 extended) — cross-reference all mode-gate tests | [HC][FUNC][OP] | [ ] |

---

## VI. Tab navigation — DEFERRED TO PER-TAB PLAN EXTENSIONS

Each tab merits its own screenshot + dedicated test pass. Build tab is covered above; the other 9 are stubs here.

| ID | Tab | Status | Next step |
|---|---|---|---|
| T-VI.1 | Home — landing/dashboard; "what does the user see first after disclaimer modal?" | [⏸] | Operator screenshots → plan extension |
| T-VI.2 | Build | [✓] | Sections II + III cover this |
| T-VI.3 | Cost Tool — per-ingredient COGS, packaging roll-up; future CPI expansion noted | [⏸] | Operator screenshots → plan extension |
| T-VI.4 | Sourcing — supplier reference | [⏸] | Operator screenshots → plan extension |
| T-VI.5 | Batch Sheet — production-ready instructions; verify against MMR §111.205 and BPR §111.255 | [⏸] | Operator screenshots → plan extension; SME-heavy |
| T-VI.6 | Filing — packet generation; NDI 30-day FDA notification per DSHEA §403(r)(6) | [⏸] | Operator screenshots → plan extension; SME-heavy |
| T-VI.7 | Services — content placeholder; verify what's offered | [⏸] | Operator screenshots → plan extension |
| T-VI.8 | Process Authorities — PA directory; PA-review request flow | [⏸] | Operator screenshots → plan extension |
| T-VI.9 | Saved — counter accuracy; lists user formulations; load works | [⏸] | Operator screenshots → plan extension |
| T-VI.10 | Ingredient DB — browseable catalog; search/filter; mode-appropriate visibility | [⏸] | Operator screenshots → plan extension |

---

## VII. Cross-cutting — Directive D-VII

| ID | Test | Tags | Status |
|---|---|---|---|
| T-VII.1 | Supabase persistence: save → reload → all fields restored | [FUNC][OP][BE] | [ ] |
| T-VII.2 | Auth / SSO sign-in (Phase 5 parked; verify current state) | [FUNC][OP][BE] | [ ] |
| T-VII.3 | PA verification queue surfaces visibly to user | [HC][REG][OP] | [ ] |
| T-VII.4 | PA-review state machinery (4-state per `project_honest_estimate_reframe.md`): draft / pending-PA / PA-approved / rejected — each renders correctly | [HC][FUNC][OP][SME] | [ ] |
| T-VII.5 | Confidence + range rendering on every numeric value workspace-wide per `feedback_confidence_taxonomy_foundational.md` | [REG][FUNC][OP] | [ ] |
| T-VII.6 | Comprehensive citation audit — every regulatory citation links/matches authoritative source | [HC][REG][SME] | [ ] |
| T-VII.7 | PDF export carries provenance, flags, version snapshot | [HC][FUNC][OP] | [ ] |
| T-VII.8 | Allergen auto-detection covers FDA Top 9 including sesame per FASTER Act | [HC][REG][SME] | [ ] |
| T-VII.9 | Determination engine routing matrix — every product-class × product-type combination routes to correct framework (exhaustive matrix test) | [HC][REG][SME] | [ ] |
| T-VII.10 | Disease-claim block — structure/function permitted, disease claims blocked at input or output | [HC][REG][SME] | [ ] |

---

## VIII. Edge cases & error handling — Directive D-VIII

Run after happy-path tests stabilize.

| ID | Test | Tags | Status |
|---|---|---|---|
| T-VIII.1 | 0-ingredient formulation: SFP empty state, save behavior | [FUNC][OP] | [ ] |
| T-VIII.2 | Single-ingredient formulation | [FUNC][OP] | [ ] |
| T-VIII.3 | 50+ ingredients: performance | [PERF][OP] | [ ] |
| T-VIII.4 | Invalid inputs: negative qty, zero qty, non-numeric, empty required — graceful handling | [HC][FUNC][OP] | [ ] |
| T-VIII.5 | Network failures (Supabase down): save fails gracefully, local state preserved | [FUNC][OP][BE] | [ ] |
| T-VIII.6 | Browser back/forward: prompts before losing unsaved work | [FUNC][OP] | [ ] |
| T-VIII.7 | Concurrent edits two tabs same formulation: conflict detection vs. last-write-wins | [FUNC][OP][BE] | [ ] |
| T-VIII.8 | Browser compat: Chrome / Firefox / Safari / Edge | [FUNC][OP] | [ ] |
| T-VIII.9 | Viewport: desktop / tablet / mobile | [UX][OP] | [ ] |
| T-VIII.10 | Unicode and very long strings in names | [FUNC][OP] | [ ] |

---

## IX. CC organizational observations (post-pass)

Surfaced during the organization pass 2026-05-23. Substance preserved; these are routing notes for operator + Opus.

### IX.1 Cross-cutting concerns intentionally distributed (NOT duplicates)

These appear at multiple surfaces by design — testing them once at one surface doesn't cover the others:

- **Mode-gate testing** — 9 distinct test points: T-I.1.5, T-I.2.* (8 sub-tests), T-II.A.2 + T-II.A.7, T-II.B.2, T-II.C.8, T-II.F (implicit), T-II.G.6, T-III.A.8, T-III.D.10, T-V.4 + T-V.5. Per Opus's preamble note #2: per-surface, not batched. Keep distributed.
- **Harm-critical floor** — anchored in T-I.3.* + reappears at T-II.B.4, T-II.E.1, T-III.B.10-11, T-VII.3, T-VII.8, T-VII.10. The principle is one ([[empty fields default to UNDOCUMENTED]]); the surfaces are many.
- **F&B Finding 1 float bug** — T-I.4.* anchors the bug; T-II.C.3 is the regression check at the bulk-paste surface. Cross-referenced; not duplicated.
- **Confidence + range rendering** — T-II.C.7 + T-III.C.2 + T-VII.5. The taxonomy ([[feedback_confidence_taxonomy_foundational.md]]) is one; surfaces are many.
- **Regulatory citation accuracy** — T-I.2.* (mode-appropriate citations) + T-III.A.5 (Determination Engine cites) + T-III.D.3 (cGMP cites) + T-VII.6 (comprehensive audit). The audit at T-VII.6 is the catch-all; per-card tests are localized verifications.

### IX.2 Suggested execution sequence

1. **Pre-flight:** Section I (Launch-blocking). Cannot ship without these passing. Within I, order: I.1 disclaimer (gates access) → I.2 mode-gate (gates correctness) → I.3 harm-critical floor (gates safety) → I.4 F&B Finding 1 cross-impact (gates engine).
2. **Build tab walkthrough:** Sections II + III. Operator screenshots → CC runs per-card directive (D-IIA through D-IIG, D-IIIA through D-IIID). One commit per card cluster.
3. **Global + cross-cutting:** Sections IV + V + VII. Many of these can run in parallel with Build tab passes if operator capacity allows.
4. **Tab extensions:** Section VI. Each tab gets its own screenshot session + plan extension. Likely 9 additional plan docs.
5. **Edge cases:** Section VIII. After happy-path stabilizes. Some items (T-VIII.5 network failures, T-VIII.7 concurrent edits) need backend setup; defer until late.

### IX.3 Gaps not in Opus's draft (CC observations — operator routes whether to add)

- **Authentication/authorization beyond SSO smoke test.** T-VII.2 mentions "Auth / SSO sign-in (Phase 5 parked)" — but if any auth exists in current state, it needs at least one functional test (login flow, logout, session expiry, unauthorized access). Especially relevant if PA-review state machinery (T-VII.4) involves access control on PA-approved formulations.
- **Data migration when Step 1 schema migration lands.** Existing saved formulations will need to load against the post-Step-1 schema. Not in plan; add when Step 1 sequencing comes up. Maps to `project_supplements_two_wave_ingestion.md` future implications.
- **Keyboard navigation + screen reader accessibility.** T-IV.7 covers color contrast (WCAG AA) but not keyboard nav, focus indicators, ARIA labels, screen reader output. If August 2026 launch has accessibility commitments, add a Section IV-bis.
- **Concurrent multi-user editing on same formulation.** T-VIII.7 covers same-user multi-tab. Multi-user scenarios (PA reviewer + operator on same draft simultaneously) aren't tested.
- **Backup / disaster recovery.** T-VIII.5 covers Supabase-down save behavior. Recovery path post-restoration (saves queued during downtime → reconcile on reconnect) isn't tested.
- **Performance under concurrent load.** T-VIII.3 covers single-user 50+ ingredients. Concurrent-user load on Supabase / API endpoints isn't tested. Lower priority pre-launch; matters more post-launch as user base grows.

### IX.4 Routing decisions surfaced for operator + Opus

1. **SME engagement model.** Many [SME] tests (T-I.1.2, T-I.2.2-7, T-II.A.3, T-II.E.7, T-II.F.6, T-III.A.*, T-III.B.*, T-III.D.*, T-VII.6 + T-VII.8 + T-VII.9 + T-VII.10) need a Process Authority reviewer or your co-founder to binary pass/fail. Plan needs an SME engagement queue: who, when, how (review session vs async checklist), how to capture verdict. Without this, [SME] items stay forever-unrun and the plan's regulatory-accuracy surface stays false-green.
2. **Mode-gate consolidation routing.** Per IX.1, 9 mode-gate test points are distributed. Two patterns possible: (a) run them per-surface as each card's directive executes (current plan); (b) add a single "mode-gate matrix" directive that exercises all 9 in one pass and cross-references back. CC lean: (a) is consistent with Opus's preamble note #2; (b) is faster for regression sweeps. Operator picks.
3. **Test ID convention adoption.** CC added `T-{section}.{subsection}.{n}` IDs. If operator + Opus prefer a different scheme (e.g., flat T-001 numbering, JIRA-style TIC-XXX), the IDs are mechanical to refactor — name it now before any commits reference them.
4. **Status column shape.** Current uses checkboxes `[ ]` `[✓]` `[✗]` `[⏸]` `[N/A]`. Alternatives: RAG status (red/amber/green), date-of-last-pass, owner-tag. Pick before execution begins.
5. **Pass criteria for [SME] items absent an SME.** Until SME engagement lands, what's the default state of [SME] items in launch-readiness assessment? CC lean: treat as `[⏸ blocked-on-SME]` rather than `[ ] not-started` — the distinction matters for launch decisions.
6. **Tab extension prioritization.** Section VI lists 9 deferred tabs. If launch sequencing puts them in a specific order, name it. CC default lean: Filing (T-VI.6) + Batch Sheet (T-VI.5) next because they're regulatory-heavy + launch-blocking; Cost Tool + Sourcing later because they affect operator workflow, not compliance.

### IX.5 Cross-references to existing project artifacts

This plan intersects with:

- `feedback_harm_critical_fields_default_undocumented.md` — anchors Section I.3 doctrine
- `feedback_confidence_taxonomy_foundational.md` — anchors T-II.C.7 + T-III.C.2 + T-VII.5
- `feedback_three_class_value_taxonomy.md` — relevant to rendering primitive selection across cards
- `project_honest_estimate_reframe.md` — anchors T-III.B.9 PDF packet + T-VII.4 PA-review state machinery
- `project_spec_system_multi_product_class.md` — anchors T-II.A.6 + T-III.C.5 spec-set gap
- `project_supplements_two_wave_ingestion.md` — relevant to ingredient lookup surfaces (T-II.B)
- `docs/findings/2026-05-23-fb-finding-1-nutraceutical-cross-impact.md` — anchors T-I.4.* + T-II.C.3
- `docs/findings/2026-05-22-fb-workspace-findings.md` — original F&B Finding 1 reproduction context
- `docs/architecture/catalog-authoring-rulebook.md` — governs §III.15 enum, §II.9a refinements, §VI.29 test gate
- `docs/architecture/harm-critical-floor.md` — anchors Section I.3 + cross-cutting harm-critical surfaces
- `docs/audits/q-audit-1-final-routing.md` — Round 12 routing context
- `docs/pa-verification/` — PA verification queue (relevant to T-VII.3 + T-VII.4)
- `.claude/agents/catalog-entry-validator.md` — validator agent (catalog-side, not workspace-side, but cross-cutting for SFP correctness)

### IX.6 Scope honest acknowledgment (per Opus's closing notes)

- **Plan covers Build tab + cross-cutting only.** 9 other tabs each need their own plan extension per Section VI.
- **[SME] items cannot be CC-runnable as binary pass/fail.** They need co-founder or qualified PA reviewer engagement.
- **Operator drives `[OP]`-tagged items.** Browser-based reproduction, screenshot capture, in-app interaction. CC can write directives but cannot click buttons.
- **`[BE]`-tagged items need running backend.** Supabase + auth + any external services. Set up before running.
- **[HC] tests fail loud, block save** per the customer-owned PA model two-bucket distinction.
- **[REG] tests render with appropriate uncertainty surfaced** — the PA decides; the test verifies the rendering is correct, not the regulatory determination itself.

---

## X. Maintenance notes

- **Update this plan as tests are run.** Fill in `Status` column; add findings notes inline; create supporting artifacts (`docs/findings/{test-id}-{slug}.md`) for any failures.
- **Bump this plan's structure when tabs are extended.** Section VI stubs convert into full per-tab plans; cross-reference from this master plan.
- **Re-derive IX organizational observations at major milestones** (e.g., after Step 1 schema migration, after each ~10 tests run). New patterns emerge as the plan is exercised.
- **Surface AUP false positives if they fire during plan execution.** Per `feedback_aup_verify_dont_retry.md`: verify file integrity, capture Request IDs, surface to operator for Anthropic feedback report.
