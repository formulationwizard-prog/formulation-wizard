# Provenance Run — Defect Audit (top-100)

**Source:** the 2026-06-05 provenance Workflow over the top-100 entries (full results: `provenance-run-results-2026-06-05.json`). The provenance pass surfaced these defects as a byproduct — agents refused to fabricate a source and flagged the gap instead. **Triage as one pass** (completeness-critic pattern), not per-instance.

## A. Unsubstantiated pharmacopeial-grade claims (10) — 21 CFR mislabeling class
The entry name carries a `(USP)` grade claim, but **no USP-NF monograph exists for that exact compound**, so the claim can't be substantiated. (The agents assigned `unknown`, never a fabricated citation.)

| Entry | Why |
|---|---|
| Zinc Picolinate (USP) | USP covers zinc sulfate/oxide/gluconate/citrate/acetate — not the picolinate |
| Chromium Picolinate (USP) | no USP-NF monograph for chromium picolinate |
| Quercetin (USP, 95%) | no USP-NF monograph for quercetin |
| Alpha-Lipoic Acid (USP, Racemic) | no USP-NF monograph for ALA |
| Creatine Monohydrate (Creapure, USP, Tier-A) | no USP-NF monograph for creatine monohydrate |
| Glucosamine Sulfate 2KCl (USP) | USP has HCl + sodium-chloride forms; the 2KCl is the Ph.Eur. form |
| L-Carnitine L-Tartrate (USP) | USP monograph is "Levocarnitine", not the tartrate salt |
| L-Citrulline Malate 2:1 (USP, Tier-A) | no USP-NF monograph for citrulline malate |
| Curcumin 95% (Sabinsa C3 Complex) | no USP-NF monograph for curcumin as this dietary ingredient |
| Ashwagandha (Sensoril, Natreon) | no USP-NF monograph for Withania somnifera extract |

**Fix options:** drop the `(USP)` suffix (it's a grade claim the form can't support), OR re-grade to the real standard (e.g. Glucosamine 2KCl → Ph. Eur.; L-Carnitine → cite Levocarnitine only for the free base). Per-entry call.

## B. Chemically-wrong value (1) — the standout
- **Taurine (USP, Tier-A):** `nutrition.protein: 100` — but **taurine is a sulfonic acid, not a protein** (the entry's *own notes* say so). An indefensible nutrition value that would mis-drive any protein rollup. Connects to the "nutrition and bioactives must not contradict on the same compound" doctrine. **Correct to protein: 0.**
  *(Also: the Taurine "(USP)" claim — USP-NF *does* carry a Taurine monograph, so the grade claim there is legitimate.)*

## C. GRAS-self-affirmed without a citation (4) — flag, not hard defect
`regulatoryStatus.US = 'GRAS-self-affirmed'` with **no nameable GRN # or 21 CFR part**: **Alpha-GPC**, **Curcumin (Sabinsa C3)**, **Ashwagandha (Sensoril)**, **Saw Palmetto**. Self-affirmed GRAS is legitimate industry practice, but it is *not* an FDA determination — so a bare "GRAS" regulatory status without a basis overstates. Agents assigned `unknown` / caveated. **Decide:** require a basis string (self-affirmed vs FDA-notified GRN# vs 21 CFR) on every GRAS claim.

## Doctrine outcome → validator rule (candidate)
Per [[feedback_pharmacopeial_claims_require_monograph]]: the `catalog-entry-validator` should **block a `(USP)/(NF)/(FCC)/(EP)` suffix unless the entry carries a `regulatory-authority` provenance with a real monograph citation for that exact compound** — turning this whole class into a compile-time gate going forward.

## Clean entries
The other ~89 entries assigned honest provenance with no defect: carrier-loaded → `computed-from-formula`; real USP compounds (ascorbic acid, thiamine, riboflavin, niacin, glycine, taurine, melatonin, etc.) → `regulatory-authority` with monographs; branded forms (KSM-66, Creapure, Cognizin, Quali-C, NCFM, Ferrochel, etc.) → `supplier-spec` (ref blank); supplier-variable values → explicit `unknown`.
