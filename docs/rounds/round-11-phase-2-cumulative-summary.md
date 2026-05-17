# Round 11 Phase 2 — Cumulative Summary

**Round:** 11
**Phase:** 2 (Track A completion + Track C harm-critical wiring + PA-review state machinery)
**Closed:** 2026-05-17
**Test suite at Phase 2 close:** 466 passed (466), TypeScript clean

---

## Scope closed in Phase 2

Track A (Nutraceuticals workspace correctness):
- ✓ Finding #26 — Serving size input UX (decimal entry, no wrap-around, max cap)
- ✓ Track A cascade verification (Sections 5+6 supplementMath + UL-gate, vitest layer)

Track C (Harm-critical floor + PA-review state machinery):
- ✓ PA-review state machinery (types + validator + transition log + Bucket 1 composition)
- ✓ All 5 §B harm-critical floor items wired through unified Bucket 1 composition gate
- ✓ §B11 Bucket 1 keystone subset (`IdentityTestAttestation` schema + forward-compat storage)
- ✓ Step 5 pre-flight verification of full Bucket 1 gate across canonical operator workflows

---

## Bucket 1 composition gate at Phase 2 close

| Item | Wiring | Citation |
|------|--------|----------|
| §B1 allergen species-naming + Contains generator | Hard-stop composed | 21 CFR 101.36(b)(1)(i)(B); FALCPA |
| §B2 disease-claim hard-stop | Hard-stop composed | 21 CFR 101.93(g); FDCA §201(g)(1)(C) |
| §B3 identity-test attestation | Hard-stop composed | 21 CFR 111.75(a)(1) |
| §B4 disclaimer verbatim | Constants + selector + `buildDisclaimers` consumes routing | 21 CFR 101.93(c)(1)/(c)(2) |
| §B5 net quantity declaration | Hard-stop composed | 21 CFR 101.105 |
| Review.currentState | Hard-stop composed | PA-review state machine |
| §B11 Bucket 1 keystone subset | Schema landed (enablement for §B3) | — |
| §B11 Bucket 2 portion | Deferred Round 12+ (anti-creep held) | — |

---

## Test growth trajectory across Phase 2

| Milestone | Test count | Delta |
|-----------|-----------|-------|
| Phase 2 start | 266 | — |
| §B2 disease-claim hard-stop + Review.currentState | 266 → 314 | +48 (subsequent count includes earlier expansions) |
| §B1 allergen species-naming + Contains generator | 324 | — |
| §B1 Mustard non-FALCPA tier + regulatory metadata | 334 | +10 |
| §B5 net quantity unit conversion + dual-unit generator | 386 | +52 |
| §B3 identity-test attestation + §B11 Bucket 1 keystone | 424 | +38 |
| §B4 `buildDisclaimers` consumes `selectSupplementDisclaimer` | 436 | +12 |
| Step 5 Bucket 1 gate pre-flight verification | 466 | +30 |
| **Phase 2 net growth** | **266 → 466** | **+200 tests** |

---

## Implementation-discovery findings (Phase 2 category)

Distinct from Phase 1 audit-memo corrections list (closed at 6 items, diagnostic of audit-memo specificity drift). Phase 2 implementation-discovery findings are latent regulatory-accuracy bugs surfaced during fresh harm-critical wiring — the harm-critical floor inventory discipline doing its job.

**Phase 2 implementation-discovery findings: 2 items**

| # | Finding | Surfaced during | Fix shipped |
|---|---------|-----------------|-------------|
| 7 | `'butter'` substring keyword in `ALLERGENS_LIST` Milk category falsely matched "peanut butter", "almond butter", "cocoa butter" as Milk allergen | §B1 pre-flight tests | `'butter'` dropped from new `lib/supplementAllergen.ts` Milk keywords (legacy `lib/utils.ts detectAllergens` retained for UI safety-net behavior continuity) |
| 8 | Inline `dsheaDisclaimer` string at `buildDisclaimers` always emitted PLURAL form regardless of claim count, including for labels with exactly one structure/function claim — verbatim-text violation of 21 CFR 101.93(c)(1) | §B4 follow-up migration | `buildDisclaimers` signature migrated from `hasStructureFunctionClaim: boolean` to `claimCount: number`; consumes `selectSupplementDisclaimer` for correct routing |

Both findings were shipping regulatory-accuracy issues that the harm-critical floor discipline caught during the wiring pass.

Audit-memo correction running list (Phase 1) remains closed at 6 items.

---

## Architectural patterns proven and documented in Phase 2

The Phase 2 work proved out four architectural patterns, now reusable for future high-novelty work:

### Pattern 1 — Sibling-file detector / gate boundary

Each §B item exposes a per-item gate evaluator returning `HardStop | cleared`, plus a stable item identifier. Pre-computed flags pass from detector to gate via params. Same boundary discipline as F&B's `evaluateBucketA(ComplianceFinding[])`. Gate testable in isolation, detector testable in isolation, caller chooses invocation cadence.

Module naming convention:
- New-from-scratch modules at `lib/` root use no prefix: `lib/netQuantity.ts`, `lib/identityTest.ts`
- Sibling-to-legacy modules use the `supplement` prefix: `lib/supplementAllergen.ts`, `lib/supplementClaims.ts`

### Pattern 2 — JSDoc anti-pattern callout on harm-critical types

When a type captures attestation, certification, or any operator-declared state that the platform cannot independently verify, the JSDoc explicitly states the integrity model — what platform enforces vs what human authority validates. Proven on `IdentityTestAttestation` in this phase. Prevents future drift (including by AI assistants) toward over-enforcement that would creep beyond the intended gate scope.

### Pattern 3 — Anti-creep rule for high-novelty architectural work

When implementing a feature that touches multiple architectural concerns (schema + logic + composition + boundary work), the implementation plan names the explicit boundaries that trigger stop-and-resurface. Proven on §B3 + §B11 work: zero supplier-side surface touched (no vendor portal, no COA file storage, no supplier registry). The plan's explicit anti-creep boundary held throughout implementation.

### Pattern 4 — Defer-permission design-surface gates for novel work

Low-novelty work (§B1, §B2, §B4 migration) proceeded without design surface — pattern was established. High-novelty work (§B5 net quantity from scratch, §B3 + §B11 keystone) paused at design-surface gates before implementation. Surface points explicitly listed; operator confirmed; refinements incorporated (float-precision epsilon, ±2% asymmetric deferral, boundary tolerance test cases, anti-creep rule).

### Anti-creep boundary test pattern (Phase 2 specific)

The §B3 test suite includes an explicit boundary test that codifies the PA-review territory in executable form: gate CLEARS on present-but-substantively-meaningless attestations (supplier 'Acme Suppliers', method 'we tested it'). Future drift toward substance-checking fails this test. Documentation is necessary but not sufficient; executable enforcement protects against regression.

---

## Round 12+ deferrals logged at `docs/architecture/harm-critical-floor.md`

Each §B item carries an explicit Round 12+ deferral list with rationale. Total deferred enhancements across §B items: 27+ items spanning persistence, UI, COA file storage, lot tracking, method-appropriateness checks, supplier registry, jurisdiction selector, asymmetric tolerance, operator-selectable precision, internal consistency checks, word-boundary detection, ambiguous-ingredient hard flags, dual-confirmation override flows, per-pattern CFR citation enrichment, and product-name × claim cross-screening. Each has a documented reason for deferral and a forward-compat strategy.

---

## Phase 2 Step 5 — Pre-flight verification scope and outcomes

Step 5 closure criteria (per Phase 2 directive):

1. ✓ Canonical happy-path formulations clear the gate with zero evidence emitted
2. ✓ Single-item refusal scenarios produce correct single-source evidence per item (isolation tested across all 5 active items + Review.currentState)
3. ✓ Multi-item refusal cascades produce correct multi-source evidence aggregation for realistic operator-mid-workflow states
4. ✓ Edge cases at the gate-clears-vs-refuses boundary hold at the composition layer
5. ✓ `composedItems` registry integrity (exactly 6 entries, audit-trail visibility)

Test file: [`lib/__tests__/supplement-bucket-1-gate-pre-flight.test.ts`](../../lib/__tests__/supplement-bucket-1-gate-pre-flight.test.ts) (30 cases across 6 sections).

Scenario coverage in Step 5 tests:

- **Section A** (3 cases): canonical Vitamin C + D supplement; whey-protein supplement with Milk allergen properly disclosed; tree-nut supplement with species-named Almonds
- **Section B** (7 cases): §B2 / §B1 / §B3 / §B5 / Review.currentState (draft, rejected, submitted) all isolated
- **Section C** (5 cases): early-draft formulation cascade; operator drafted disease claim in early-draft; label-incomplete with missing dual-unit + generic fish + draft state; customer-zero style submission with 4 simultaneous failures; cascade source-marker integrity
- **Section D** (8 cases): net quantity boundary (102.0% / 102.01% / 4-min clock-skew grace / 2000-01-01 floor / caution-tier advisory / Mustard advisory / Review undefined / netQuantity+identityTest undefined)
- **Section E** (2 cases): composedItems registry integrity (all 6 items present, exactly 6 entries)
- **Section F** (5 cases): detector → gate end-to-end including peanut-butter false-positive regression check at composition layer

Phase 2 implementation-discovery findings ran clean during Step 5 — no new findings surfaced. Items #7 and #8 (closed during their respective wiring commits) remain the Phase 2 implementation-discovery list.

---

## Carries forward to Phase 3

Phase 3 scope per Round 11 directive:

- Track A full pre-flight verification suite execution
- Track C export build — PDS generation (substantive new build for Phase 3)
- Gate-level rendered-text refusal check for §B4 when PDS rendered-disclaimer string becomes available at the export gate boundary
- Display-rule validation for §B4 disclaimer (type size ≥1/16 inch, bold, adjacency, per-panel coverage) with PDS pipeline
- F&B Round 10 regression verification (Phase 4 pre-deploy gate)

The Bucket 1 composition gate is the export-gate enforcement surface that Phase 3 PDS work integrates with.

---

## Phase 2 closure

Closed cleanly. Patterns documented. Implementation-discovery findings logged and categorized. Test suite +200 across the phase. Anti-creep discipline held throughout the architecturally-novel work. Defer-permission gate process proved its value — zero mid-implementation surprises on novel work. All deferrals carry forward with documented rationale.

Ready to transition to Phase 3.
