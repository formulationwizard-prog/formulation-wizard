# Catalog Curation Regroup — Agenda (2026-06-18)

**Convened by:** Wizard (+ co-founder + PA where noted).
**Status:** The autonomous arc reached a coherent completion — audit engine-contract trio guarded, August render-fidelity verified, F3 contract specced, demand corpus turned. **This is the decision queue: surfaced evidence → curation judgment → catalog quality.** Each item names the decision, who decides, and what CC executes once decided. North-star check: every item turns the flywheel; none is treadmill.

---

## A. Demand-anchored adds (Class 2 — novel, real trending evidence)
Source: [demand-gap-list-2026-06-18.md](demand-gap-list-2026-06-18.md) (NCCIH/NIH-ODS/NHANES + NBJ/SPINS + trending). **Decision (Wizard + co-founder):** which to add + priority. **CC executes:** author per §II.8 (verified provenance, citation, harm-critical floor), per-add gated.

- **Urolithin A** · **Fisetin** · **Colostrum** · **Beet Root** — demand-anchored, not in catalog.
- (Also from the §VII-stack A#5 run: Berberine, HMB, DIM, PQQ, Gymnema, Bitter Melon, Saffron, Bilberry, Tart Cherry, Apigenin, etc. — the broader Class-2 list.)

## B. Live engine-correctness fixes (close open S-levels)

**B1 — 5 elemental factors (closes the 5 routed S2; live over-count today).** Decision = the verified chemistry; **CC adds to `lib/elementalFactors.ts`.**
- Boron Glycinate / Boron Citrate (Albion) — chelate **% boron** (supplier-standardized, not stoichiometric).
- Strontium Citrate — **hydrate state** (anhydrous ~0.41 vs cited ~0.34).
- Silica (Horsetail) / Bamboo Silica (70%) — **silica→silicon DV-basis** convention (silicon has no DV).

**B2 — 6 vitamin DV under-disclosures (closes 6 S3; rendering "†" instead of %DV).** Decision = **form-equivalence factor** (e.g. benfotiamine→thiamine is NOT 1:1); **CC adds dvKeyword + conversion.**
- Benfotiamine→B1 · Pantethine→B5 · Adenosylcobalamin + Hydroxocobalamin→B12 · Ascorbyl Palmitate→C · Mixed Carotenoids→A.

**B3 — Pantothenate Ca inconsistency (1 S3).** d-Calcium Pantothenate Tier-A declares `calcium 85000`, Tier-B `90000` (same compound; ~84000 is chemistry-correct). Decision = canonical value; **CC reconciles both.**

## C. Form-ambiguity / disambiguation (unlocks engineering)

**C1 — C1b form-sets (unlocks Tier-3 disambiguation routing).** For each ambiguous bare term: **which forms to offer + the canonical default.** Once decided, **CC builds the Tier-3 routing** (the §II.8a `findHarmCriticalSiblings` pattern, widened) — engineering-autonomous.
- Selenium · Iodine · DHA / EPA-DHA · Probiotic Multi-Strain · (+ demand tier-3: Vitamin D/C/E/B6, Ashwagandha).
- Note the harm case: **DHA = algal (allergen-free) vs fish (Fish allergen)** — disambiguation, never silent default.

**C2 — Heavy-metals classifier per-class refinement** (`lib/heavyMetalVectors.ts` queue). Decision = confirm; **CC updates the classifier.**
- Hg: add mackerel, tuna. · Cd: add oyster/mussel/clam (bivalves). · New 'organ/glandular' class (liver→Cd). · Kelp/algae: As-not-Hg reclassification. · Shark-cartilage species qualification.

## D. Strategic scope
- **Curate-vs-add (the Phase-2/3 call):** the ~116 conformance findings (Tier-A/B name-leaks, grade-claim recording-gaps) vs. the demand adds — which is the August lift? (North-star lean: finish the seed = curate to the bar; adds onto a clean substrate.)
- **A#1 synonym backfills (C1a-style, safe):** the resolved-but-renamed gaps (NAC done; Selenium/Iodine/DHA are C1b not C1a). Confirm any remaining clean single-form synonyms.

## E. External-data / browser (acquisition decisions)
- **§I.6 benchmarks** (NSF Certified-for-Sport list / Examine evidence grades / USP-DSC monograph index) — licensing/acquisition call to make them measurable.
- **#5 live 48-ingredient packet run** (browser) — closes the #1 render-fidelity caveat end-to-end.

---

**Once decisions land, CC's autonomous execution queue:** §II.8 authoring of approved adds · elemental factors → close B1 S2s · vitamin equivalences → close B2 S3s · pantothenate reconcile · Tier-3 disambiguation routing (after C1 form-sets) · classifier refinement (C2). Each gated, bench-tested, audit-guarded.
