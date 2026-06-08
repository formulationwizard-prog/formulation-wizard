# Formulation Wizard — World-Class Build Spec (the spec the harness asserts against)

**Created 2026-06-07.** The root cause of the rookie bugs is *feature-by-feature build with the operator as the manual verifier.* The fix is **spec-first build + a verified harness that catches the rookie-bug class before the operator sees it.** This is that spec. The build conforms to THIS, not to current code. Living doc — updated as artifacts/rules are enumerated.

---

## 0. Acceptance criterion (the bar — operationally testable, not aspirational)
> **Wizard runs the full matrix — every workspace section × every input state × every output artifact × every persona path, with bench-test discipline — and finds ZERO rookie bugs before any pilot user does.**

The standing proof is the harness (§5). Wizard sampling at milestones (§6) is the audit, not the verifier.

---

## 1. The 5 W's, operationalized into testable conditions
- **WHO** — passes when each persona's full path completes with no dead-ends or wrong outputs:
  - *Marcus* (first-formula novice): zero → compliant formula → label, no RA expertise; every gate self-explains.
  - *Maya* (experienced formulator): multi-ingredient, multi-source, recipe-ratio, fast, correct aggregation/order.
  - *Dr. Carter* (RA reviewer): every value cited, every verdict traceable, sign-off packet complete.
  - *Aisha* (F&B / functional beverage): sector-correct (NFP not SFP; 101.9 rounding, Atwater calories). **[Q4]**
  - *Hector Morales* (F&B acidified-foods co-packer): pH/aW/process-authority surfaces correct. **[Q4]**
  - *Theo Bautista* (F&B chef-founder): recipe → compliant NFP + label. **[Q4]**
  - *Phase note:* Marcus/Maya/Dr. Carter (Nutraceuticals) are the **August** acceptance set; the three F&B personas serve **Q4** (sector defers per the roadmap).
- **WHAT** — passes when every artifact in §2 is emitted AND correct AND cited.
- **WHEN** — passes when each moment is served: design · pre-production compliance check · manufacturer handoff · ongoing reg-change monitoring.
- **WHERE** — passes when the full path runs in one workspace, no tool-switching.
- **HOW IT WORKS** — passes when the harness (§5) is green across §2 — the citation-anchored, single-source-of-truth, blank-until-real engine + gates + docs.

---

## 2. Complete artifact list (every delivered surface) + authority + rule-set status
Each is a compliance/quality surface; each needs its rule set enumerated to primary source.

| # | Artifact | Governing authority | Rule-set status |
|---|---|---|---|
| 1 | Supplement Facts Panel | 21 CFR 101.36 | ✅ Wave-1 (12 rules) |
| 2 | Ingredient statement | 21 CFR 101.4 | ⏳ enumerate |
| 3 | Allergen statement | FALCPA / FASTER (403(w), incl. sesame) | ⏳ enumerate (refined-oil exemption known) |
| 4 | Claims validator | 21 CFR 101.93 / DSHEA structure-function | ⏳ enumerate |
| 5 | Dosage / UL safety | IOM ULs via NIH ODS | ⏳ audit (next inherited table) |
| 6 | NDI compliance | DSHEA §8 / 21 CFR 190.6 | ⏳ enumerate |
| 7 | Stability & overage | 101.36(f)→101.9(g) / USP <1150> | ✅ audited (citation corrected 2026-06-08) |
| 8 | Producibility (fit/blend) | USP <905>/<2040>, capsule specs | ⏳ capsule-density audit |
| 9 | Cost / Unit Economics | operator inputs (no fab tags) | ⏳ spec |
| 10 | cGMP program | 21 CFR 111 | ⏳ enumerate |
| 11 | Base Sheet (MMR) | 21 CFR 111.205 | ⏳ spec |
| 12 | Batch Sheet (BPR) | 21 CFR 111.255 | ⏳ spec |
| 13 | Packaging Data Sheet | — | ⏳ spec |
| 14 | Master Specs (finished-product) | 111.70 / 111.460 | ⏳ spec |
| 15 | Determination engine (classification) | 111 / 101.36 vs 101.9 | ⏳ enumerate |
| 16 | Ingredient resolver / search | **sector-scoping** (per-entry sector class, source-tier arch, USDA-base-only-for-F&B) + synonyms | 🔴 known gaps: B6→B2, dl-tocopherol unmatch, USDA-in-Nutra leak. Bigger than one rule — see §7 cross-artifact doctrine. |
| 17 | Save / version state | — | 🔴 **launch-blocker — fix PRE-launch** (trial #1 lost-formulas signal). Not parked. |
| 18 | RA-review packet | aggregation of #1–#10 + provenance | ⏳ spec (August MVP, Decision 1) — aggregates the cited verdicts + values into a sign-off bundle |
| 19 | Manufacturer handoff package | aggregation of #11–#14 | ⏳ spec — Base/Batch sheets + master specs + packaging into one handoff |

---

## 3. Rule-set per artifact (the registry the harness asserts against)
Shape per rule: `{ rule, authority, citation, sector, spec, status, // REGULATION anchor }` (the registry from `feedback_inherited_rules_get_the_same_audit`). SFP set is in `docs/audits/cfr-101-36-wave-1-2026-06-07.md`. Each artifact above gets the same treatment — its rules enumerated, cited, status-checked. This IS the authority-anchor workstream (§ sequence step 3).

---

## 4. Persona × moment matrix (defines "complete delivery" per path)
| Persona \ Moment | Design | Compliance check | Manufacturer handoff | Ongoing monitoring |
|---|---|---|---|---|
| Marcus (novice) | SFP + claims + safety, self-explaining | NDI + allergen + cGMP program | Base/Batch (#11/12) + handoff pkg (#19) | reg-change alerts on his formula |
| Maya (formulator) | recipe-ratio SFP, multi-source agg | full gate set | Master specs (#14) + packaging (#13) | NDI rulings / monograph changes affecting her actives |
| Dr. Carter (RA) | — | every verdict cited + traceable | RA-review packet (#18) | warning-letter pattern shifts re-flagging signed formulas |
| Aisha (F&B) **[Q4]** | NFP (101.9), Atwater calories | F&B claims (101.13/.62) | F&B handoff | F&B reg changes |

Every cell names the artifacts (§2) that must be correct for that path to "complete." **Ongoing monitoring** = the platform proactively flags a stored formula when an NDI ruling, FDA warning-letter pattern, or monograph change affects it (the continuous-compliance value). The harness asserts an alert fires when a relevant rule/limit changes.

**Phase alignment (resolves §4↔§10):** the **August** acceptance set = the **Design + Compliance-check** columns for all three Nutra personas, **plus Dr. Carter's RA-packet (#18, August)**. The **Manufacturer-handoff** column (Base/Batch #11–12, packaging #13, master specs #14, handoff pkg #19) is **Phase 2** per §10 — so Marcus's and Maya's handoff cells are **[P2]**, not part of the August gate. The August harness therefore asserts: design + all compliance gates + #18, across all input states, for the 3 Nutra personas.

---

## 5. The harness — and it must itself be verified
- **Golden formulas** (the bench-test set + deliberate edges) **× input states** (blank / partial / full / overfill / below-threshold / multi-source) **× persona paths**, asserting **every surface in §2** (every panel, gate verdict, advisory, blank-until-real state). Coverage = whole delivered artifact, not just SFP.
- **Harness-pass ≠ verified.** Each golden formula carries **two independent expected-output derivations** — harness-computed AND regulator-style hand-derived; **pass requires both to match.** (This is the fix for the morning's `[]` false-all-clear — a harness can be a silent-failure surface too.)
- Runs in CI; gates every change.

---

## 6. Cadence (three layers, different frequencies)
- **Harness** — gates every change. Constant.
- **Wizard** — reviews representative outputs at milestone boundaries. Sampling (not zero — operator perception caught real bugs code-audit missed: USDA-leak, the "30" render, half-shipped recipe-ratio).
- **Opus** — architectural / regulatory-interpretation / harm-critical-reframing. Routing.

---

## 7. Autonomous carve-out (what CC drives vs routes)
- **CC drives, harness-gated:** the rookie-bug class — rounding, aggregation, ordering, fabricated defaults, resolver substitutions, blank-until-real, surface coverage.
- **Routes (does NOT self-decide):** regulatory interpretation (is this the right rule for this surface?), architectural decisions (does this surface need its own engine? sector boundary?), harm-critical reframing (catalog architecture, novel regulatory categories). The morning's misbranding-by-default was a carve-out conflict, not a rookie bug — routing holds there.
- **The rookie-bug class is OPEN, not fixed.** The list above is the classes seen so far; new bug shapes will surface and the harness must extend to cover each. "Caught a new shape" → add a golden case + a class entry.
- **Cross-artifact doctrine — sector-scoping (#16 is bigger than one rule):** per-entry sector classification, source-tier architecture (USDA = base-only for F&B, not Nutra), and the search index respecting sector scope (the USDA-in-Nutra leak). This spans the resolver, the catalog, and search — routed as an architectural item, not a rookie fix.

---

## 8. Sequence (ratified, with Opus's refinements)
1. **This spec** — each W operationalized into testable conditions. *(this doc)*
2. **Engine cutover** — single source of truth. *(in flight)*
3. **Authority-anchor** — §3 audits + registry, per artifact.
4. **Harness against the spec, harness verified by independent derivation.** *(§5)*
5. **Sweep** — every surface × every input state × every persona path.

The number follows from the thing being right. This spec is what "right" means, made testable.

---

## 9. Doctrine layer — constitutional constraints on ALL work (self-contained refs)
Every new artifact/rule/fix must satisfy these (memory files in brackets):
- **Math is the one floor; one pipeline, no bypasses** — single source of truth, every consumer routes through the engine. [serving/dose engine, `project_world_class_build_spec`]
- **Inherited lookups + rules get the same audit as the catalog** — cited to authority, sector-tagged. [`feedback_inherited_rules_get_the_same_audit`]
- **Sector is structural; regulations are per-sector** — SFP≠NFP, 101.36≠101.9, per-sector rounding/format/calories. [in this spec §1/§2]
- **Catalog/resolver never silently substitutes a different nutrient** — B6→B2 class; unmatched → flag, don't fuzzy-cross. [`project_substring_keyword_matching_bug_class`]
- **Blank-until-real** — no fabricated defaults rendered as operator data, anywhere (cost, servings, fill, units, doses). [`*_blank_until_real`]
- **COA / spec-sheet anchored** — supplier-variable values trace to a source. [`feedback_catalog_must_be_coa_spec_sheet_anchored`]
- **Empty harm-critical fields default to UNDOCUMENTED, not VERIFIED-SAFE.** [`feedback_harm_critical_fields_default_undocumented`]
- **Carrier-loaded SKUs carry potencyFactor; blend-floor guard is the net.** [`project_carrier_loaded_potencyfactor_doctrine`]
- **Refactors wait for a stable data layer; rulings ship with the code that enforces them.** [`feedback_refactors_wait_for_stable_data_layer`]
- **Never infer green light; route harm-critical/architectural/reg-interpretation; relay across sessions.** [`feedback_routing_discipline_proportionate_to_stakes`, `feedback_cross_session_direction_needs_relay`]
- **Harm-critical rollback playbook + loop-closed push.** [`reference_harm_critical_rollback_playbook`]
- **Forward-looking, anticipatory, doctrine-by-construction.** [`feedback_forward_looking_anticipatory_building`]

## 10. Scope by phase (bounds the harness target — August ≠ full world-class)
The harness target for **August (Phase 1, Nutraceuticals MVP)** is bounded to the Nutra surfaces × the 3 Nutra personas — NOT all 19 × 7. Mapping:

| Phase | Artifacts (from §2) | Personas |
|---|---|---|
| **August MVP** | #1–10 (label + all compliance gates), #15 determination, #16 resolver, #17 save, #18 RA-packet | Marcus, Maya, Dr. Carter |
| **Launch-adjacent / Phase 2** | #11–14 doc-gen (Base/Batch/packaging/master-specs), #19 handoff pkg | Marcus, Maya |
| **Q4 (F&B)** | F&B variants of all surfaces (NFP, Atwater, pH/aW/cure engines) | Aisha, Hector, Theo |

→ The **August harness gate** = the August row, green, for the 3 Nutra personas across all input states. That is the concrete, bounded "zero rookie bugs before pilot" target. The full table is the world-class horizon.
