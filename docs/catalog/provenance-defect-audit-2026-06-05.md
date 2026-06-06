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

## Fixes applied (2026-06-05)

**A — grade-claim renames (11, incl. 3 sibling entries found outside the top-100):** dropped the unsubstantiated `(USP)` (Refinement 1a); re-graded Glucosamine 2KCl to its real standard; added a `(Standard)` differentiator where dropping `(USP)` left a bare name with a qualified sibling (Refinement 1).

| Old name | New name |
|---|---|
| Zinc Picolinate (USP) | Zinc Picolinate (Standard) |
| Chromium Picolinate (USP) | Chromium Picolinate (Standard) |
| Chromium Picolinate (ChromeMate, USP) *(sibling)* | Chromium Picolinate (ChromeMate) |
| Quercetin (USP, 95%) | Quercetin (95%) |
| Alpha-Lipoic Acid (USP, Racemic) | Alpha-Lipoic Acid (Racemic) |
| Creatine Monohydrate (Creapure, USP, Tier-A) | Creatine Monohydrate (Creapure, Tier-A) |
| Creatine Monohydrate (Creapure, USP, Tier-B) *(sibling)* | Creatine Monohydrate (Creapure, Tier-B) |
| L-Carnitine L-Tartrate (USP) | L-Carnitine L-Tartrate |
| L-Citrulline Malate 2:1 (USP, Tier-A) | L-Citrulline Malate 2:1 (Tier-A) |
| L-Citrulline Malate 2:1 (USP, Tier-B) *(sibling)* | L-Citrulline Malate 2:1 (Tier-B) |
| Glucosamine Sulfate 2KCl (USP) | Glucosamine Sulfate 2KCl (Ph. Eur.) |

> ⚠ **Session-2 apply note:** `provenance-run-results-2026-06-05.json` keys by the OLD names — map old→new (this table) when applying provenance. (Curcumin C3 + Ashwagandha Sensoril had no `(USP)` *in the name* — no rename; their pharmacopeial flag is a `unknown` provenance, not a rename.)

**B — Taurine:** `protein: 100 → 0` (`fcfa0ed`).
**Enforcement:** Rulebook Refinement 1a + mechanical validator check shipped (`fcfa0ed`) — the class is now a commit-time gate.
**Deferred:** the GRAS-self-affirmation basis requirement (§C) + the "protein on non-protein Amino-Acids compounds" pattern (creatine/citrulline/NAC/theanine) — need the labeling/regulatory decision before touching.

## Clean entries
The other ~89 entries assigned honest provenance with no defect: carrier-loaded → `computed-from-formula`; real USP compounds (ascorbic acid, thiamine, riboflavin, niacin, glycine, taurine, melatonin, etc.) → `regulatory-authority` with monographs; branded forms (KSM-66, Creapure, Cognizin, Quali-C, NCFM, Ferrochel, etc.) → `supplier-spec` (ref blank); supplier-variable values → explicit `unknown`.
