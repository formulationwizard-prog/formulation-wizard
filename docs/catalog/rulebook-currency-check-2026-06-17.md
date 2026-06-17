# Rulebook Currency-Check — 2026-06-17

**Status:** Findings + recommended amendments for operator + Opus review. **This is a proposal, not an edit** — the Catalog Authoring Rulebook is the constitution; amendments to it are drafted by operator + Opus (CC surfaces; you ratify).

**Scope:** Phase 1 of the catalog world-class effort. Verify the Rulebook (the spec the audit enforces) is current before auditing against it, and identify what the "world-class" framing genuinely adds.

---

## Headline: the gap is execution, not specification

The world-class bar is **already written into the Rulebook.** The pressure-test reached for canonical IDs / tier-explicit / coverage-matrix as if they were missing — most are not:

| World-class property | Already in Rulebook? | Where |
|---|---|---|
| Authoritative sourcing / citation tiers | ✅ Specified | §I.2 (7-tier authority hierarchy + 90% Tier-1–4 rule) |
| Confidence taxonomy per value | ✅ Specified | §I.4 (5 levels) + §3 (three-class value taxonomy) |
| Harm-critical floor (UNDOCUMENTED ≠ safe) | ✅ Specified | §I.5 |
| Measurable benchmark bar | ✅ Specified | §I.6 ("checked on every catalog PR via a CI report — **to be built**") |
| Per-entry schema (tier/citation/reg/review/allergen-flag) | ✅ Specified | §II.8 universal-required + the transition rider |
| **Step-0 coverage audit (category × field matrix)** | ✅ Specified | §II.8 → names `docs/catalog/round-12-per-category-audit.md` |
| Review/decay cadence (entries rot) | ✅ Specified | §28 |
| **Canonical-ID integration (UNII / USP-Latin / GTIN)** | ❌ **Absent** | — the one genuine addition |

**So the corrective to the "metadata-maximal" instinct is sharp:** the bar exists on paper; what's missing is (a) the enforcing *fields* in `types/index.ts`, (b) the *populated* values, and (c) the *CI report*. This Phase-1 work just executed (c) and made (a)/(b) measurable and honest.

---

## Measurable evidence (from the new audit — `lib/catalogAudit.ts`)

367 entries, 15 categories. Findings: **S1 0 · S2 4 · S3 112 · S4 57**.

- **S1 = 0** — the carrier-loaded silent-zero trap (101.36 harm class) is *absent*; the 2026-06-06 carrier-loading backfill closed it. The audit now hard-floors it at 0 forever.
- **Several §I.6 benchmarks are unmeasurable** because their enforcing field doesn't exist: confidence-level coverage 0%, tier coverage 0%, Tier-1–4 citation rate unmeasurable (no structured `citation`), canonical-ID coverage 0%. This is the §II.8 schema gap, quantified.
- **Provenance coverage 27%** (the top-100 run) — partial, honest, per-field with `unknown` markers.
- **The §II.8 deliverable now exists** (`docs/catalog/round-12-per-category-audit.md`), regenerated deterministically on every `npm test` — which *is* the §I.6 "CI report (to be built)."

---

## Recommended amendments (operator + Opus draft; CC can execute once ratified)

1. **§I.6 status flip — "CI report" is now built.** Update the line "checked on every catalog PR via a CI report (to be built — currently manual)" → point at `lib/catalogAudit.ts` + `lib/__tests__/catalog-audit.test.ts` (the severity ratchet is the gate). Low-risk, factual.

2. **§II.8 status flip — Step-0 audit is now produced.** The rider says the Step-0 per-category audit is "a Round 12+ audit-step prerequisite." It now exists and regenerates automatically. Update the rider's status; the migration steps 1–8 (land the fields + backfill verified) remain the open work.

3. **New section — Canonical-Identifier doctrine (the one real addition).** Add UNII (substance) / USP-Latin (botanicals) / GTIN (products) as a *trajectory* layer with the honesty-first guardrail baked in: **verified, never bulk-inferred** (UNII is per-substance, not per-SKU; a wrong canonical ID is a confident lie — worse than honest absence). Entries without a verified canonical ID are *flagged*, not *blocked for August*. Botanical USP-Latin assignment is Nate-gated.

4. **Extend the honesty-first framing to the benchmark layer (likely a one-line reinforcement of §I.5).** A benchmark whose enforcing field is absent reports as `null` / structurally-0 — never as fabricated coverage. (The audit already behaves this way; make it doctrine so future work can't dress a gap as data.)

---

## Candidate gaps to verify (do NOT treat as confirmed — surfaced for the Nate + Opus regroup)

- **Heavy-metals / contaminant limits as a harm-critical dimension.** §I.5's harm-critical floor is allergens / drugInteractions / regulatoryStatus / ndiStatus — I found **no** contaminant section (As / Pb / Cd / Hg per USP <232>/<2232>, Prop 65). For botanicals and minerals this is the classic harm vector. *Candidate addition* — verify against the engine side (memory references a "Decision-G heavy-metals" item flagged not-built) before deciding scope.
- **Recall-defense traceability claim (Opus's refinement).** Confirm Batch + COA + Lot + Formulation-Version-snapshot fully covers point-in-time traceability so that **catalog-level versioning is genuinely redundant** (verify-don't-infer on our own architecture). Almost certainly covered by the locked spine — confirm, don't assume.

---

## What this does NOT recommend

- No bulk canonical-ID assignment (doctrine risk).
- No forcing all 367 entries to full metadata by August (timeline + wrong priority — the *honest characterization* is the launch-critical artifact, not closed gaps).
- No catalog-level versioning scope-add until the recall-defense check above confirms a real gap.

**Net:** the Rulebook is current and largely already world-class on paper. The launch-critical move is executing what it specifies (fields + populated values + the now-built CI audit), plus one genuine addition (verified canonical IDs as trajectory). Curation > additions is confirmed by the numbers: 116 S2/S3 conformance findings on existing entries vs. an add-list not yet drafted.
