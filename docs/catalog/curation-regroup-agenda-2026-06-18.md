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

### C1 — Ratified form-set decisions (working session, 2026-06-22)

**SELENIUM — RATIFIED.**
1. Form-set offered: L-Selenomethionine · Selenized yeast (Se-enriched) · Sodium selenite · Selenocysteine · Sodium selenate (optional).
2. Default: **Force-pick (no default).** Elemental factors span ~0.40–0.47 (~17%) → a silent default is a Facts-panel %DV mis-compute (same family as the elemental-factor S1 guard); form choice is a meaningful operator decision (bioavailability / regulatory / supplier); convenience-can-compromise-honesty applies.
3. Honesty markers per form:
   - Distinct elemental-Se factor per form (**PA-PENDING / B1**: selenite ~0.46, selenomethionine ~0.40, selenocysteine ~0.47, selenate ~0.42). Until PA-ratified, the resolver renders Facts-panel %DV as "PENDING — form-specific factor required" rather than computing — never guesses.
   - Selenized yeast = supplier-variable Se% → COA-anchored, no fixed stoichiometric factor ("requires COA for elemental Se").
   - UL = 400 mcg/d adult (ODS, elemental Se) → form-agnostic, applies post-conversion to elemental.
   - Allergens: none FALCPA. Selenized yeast = yeast-derived (info flag, not a major allergen).

**DHA / EPA / EPA+DHA (omega-3) — RATIFIED.** Unified omega-3 record; the bare term disambiguates by **source**, which sets the allergen.
1. Source-set offered: Algal · Fish oil · Krill oil · Calamari (squid) oil.
2. Default: **Force-pick (no default)** — source determines allergen class; never default. Harm-critical.
3. Honesty markers per source (allergen = regulatory classification):
   - **Algal** (Schizochytrium / Crypthecodinium) — allergen-free, vegan. No FALCPA flag.
   - **Fish oil** — **Fish** (FALCPA major-9). **Forces a species sub-pick** (21 CFR 101.91 requires the species, not "Fish"). Proposed sub-set: anchovy / sardine / mackerel / herring / salmon / tuna / other (specify, COA-attested). *(PENDING CO-FOUNDER: confirm operator-facing species list.)*
   - **Krill oil** — **Crustacean shellfish** (FALCPA major-9).
   - **Calamari / squid oil** — **Mollusk**. KEPT in source-set with dual-jurisdiction marker "Mollusk (non-US-major; declare for EU)" — not a US FALCPA major-9, IS EU/Codex, FDA voluntary-declaration trending standard. *(PENDING CO-FOUNDER: exact marker string must be PA-defensible before it ships in the UI.)*
   - Cross-cutting: active EPA/DHA mg per gram is **supplier-variable** (fish ~18/12 vs concentrates 60–90% vs algal) → COA-anchored, no fixed factor.
   - Limits: no established UL; FDA ≤3 g/d combined (qualified/advisory) → render advisory, not a hard cap.
4. **Heavy-metals cross-link (C2):** the fish species sub-pick feeds **per-species Hg vectors** (tuna/swordfish high; anchovy/sardine low) → classifier renders species-level Hg risk, not blanket "Fish = Hg." Richer input to the existing classifier, no new audit work.

**IODINE — RATIFIED.**
1. Form-set offered (August): Potassium iodide (KI) · Potassium iodate (KIO₃) · Sodium iodide (NaI) · Kelp. **Molecular iodine (I₂) DEFERRED post-launch** — niche (fibrocystic-breast / Iodoral-style KI+I₂ blends), 100% factor = highest mis-pick harm, and a multi-form-compound UX case the single-form engine doesn't fit; August path = free-text → UNDOCUMENTED → PA. *(PENDING CO-FOUNDER: I₂-defer regulatory check — confirm no launch segment depends on it.)*
2. Default: **Force-pick (no default)** — elemental-I spread ~0.59–0.85 across the four (wider than Selenium); wrong default is a large Facts-panel mis-compute.
3. Honesty markers per form:
   - Distinct elemental-I factor (**PA-PENDING / B1**: KI ~0.76, KIO₃ ~0.59, NaI ~0.85). Until PA, %DV renders "PENDING — form-specific factor required."
   - **Kelp = triple-marker, mandatory at intake:** (a) **COA required for iodine** (supplier-variable, can span an order of magnitude per gram); (b) **As heavy-metal vector** (§I.5a; ties to C2 kelp As-not-Hg reclassification); (c) **narrow-therapeutic-window warning** (RDA 150 vs UL 1100 mcg = 7.3×; supplier variability × dose math = compounding over-dose risk — the live failure mode). *(PENDING CO-FOUNDER: triple-marker wording, esp. the therapeutic-window string.)*
   - UL = 1100 mcg/d adult (ODS, elemental I) → form-agnostic post-conversion; safety engine flags high-dose iodine distinctly.
   - Allergens: none FALCPA. Kelp = seaweed (not a major allergen).

**PROBIOTIC MULTI-STRAIN — RATIFIED (structured capture, NOT a force-pick form-set).** A bare "Multi-Strain"/"Probiotic Blend"/lone genus is under-specified → capture a **strain list**, one structured row per strain.
- **August = honest interim; full structured row-builder = Phase-2** (co-located with F3 / verified-intake, both gated on 0003 prod-apply — no orphan UX work).
- Interim per-strain-row fields:
  - **Genus** — force-pick (curated: Lactobacillus, Bifidobacterium, Saccharomyces, Streptococcus, Bacillus, Lactococcus, Pediococcus…).
  - **Species** — text; UNDOCUMENTED if unverified.
  - **Strain-ID** — optional; operator-attested or licensing-pending ([[project_licensing_verification_queue]]); proprietary IDs (NCFM, GG/ATCC 53103…) never catalog-verified without confirmed B2B licensing.
  - **CFU** — numeric (active unit, not mass).
  - **CFU-basis — MANDATORY force-pick: end-of-shelf-life / time-of-manufacture / unspecified.** Basis is part of the claim, not metadata (EOL = FDA/industry-expected; ToM over-states as CFU degrades 10–50% over shelf-life).
  - **Storage** — force-pick: refrigerated / shelf-stable / unknown.
  - **Media-derived allergen** — **per-strain-row, COA-attested** (the allergen is the growth medium, not the organism; a blend renders the **union** of detected allergens, each traceable to its row).
- *(PENDING CO-FOUNDER: media→allergen mapping table [dairy→Milk, soy→Soy, yeast-extract→info-flag, chickpea/pea→voluntary, MRS-broth→confirm contents]; whether yeast-derived stays info-flag or FALCPA-grade for sensitive operators.)*

**DEMAND TIER-3 form-sets — RATIFIED (all force-pick).**
- **Vitamin D:** D2 (ergocalciferol; vegan, lanolin-free) · D3 (cholecalciferol; typically lanolin/wool-derived → **vegan-flag, NOT FALCPA**) · D3-lichen (vegan D3, separate marker).
- **Vitamin C:** Ascorbic acid (typically corn-derived → corn info-flag, not FALCPA) · Sodium ascorbate (Na content → low-sodium-claim + NFP sodium) · Calcium ascorbate (Ca content → Ca %DV + UL) · Ester-C (proprietary → licensing-gated) · mixed mineral ascorbates. *(Mineral-content factors PENDING B1/PA.)*
- **Vitamin E:** dl-alpha tocopherol (synthetic, ~50% bioactive; 1 IU = 0.9 mg) · d-alpha tocopherol (natural, 100%; 1 IU = 0.67 mg) · mixed tocopherols · tocotrienols · tocopheryl acetate/succinate (esters). Bioactivity / IU→mg spread is material to %DV. *(Conversion factors PENDING B1/PA.)*
- **Vitamin B6:** Pyridoxine HCl (→ elemental B6 factor) · P5P (pyridoxal-5-phosphate, active form). *(Conversion factor PENDING B1/PA.)*
- **Ashwagandha:** KSM-66 (proprietary → licensing) · Sensoril (proprietary → licensing) · generic root extract · generic root powder · leaf+root. Withanolide standardization supplier-variable → COA; proprietary route via licensing queue.

**C1 STATUS: bucket CLOSED** — all C1b terms decided. Remaining gates: co-founder sign-offs on the ⚑/PENDING-CO-FOUNDER items above + PA-pending factor values (B1/B2). Engineering unblocked: **CC can build the Tier-3 disambiguation routing** (the §II.8a `findHarmCriticalSiblings` pattern, widened to these force-pick form-sets) — scaffolding can proceed; harm-critical strings wait on the co-founder sign-offs.

**C2 — Heavy-metals classifier per-class refinement** (`lib/heavyMetalVectors.ts` queue). Decision = confirm; **CC updates the classifier.**
- Hg: add mackerel, tuna. · Cd: add oyster/mussel/clam (bivalves). · New 'organ/glandular' class (liver→Cd). · Kelp/algae: As-not-Hg reclassification. · Shark-cartilage species qualification.

## D. Strategic scope
- **Curate-vs-add (the Phase-2/3 call):** the ~116 conformance findings (Tier-A/B name-leaks, grade-claim recording-gaps) vs. the demand adds — which is the August lift? (North-star lean: finish the seed = curate to the bar; adds onto a clean substrate.)

### D — RATIFIED: D3 (minimal-viable curation + 4 evidence-anchored adds). Locked 2026-06-22.
Flywheel-vs-treadmill gate: close the live harm-critical S1s, add only evidence-backed entries, defer noise + speculative adds.
- **August / blocking — engineering:** Tier-3 disambiguation engine (`findHarmCriticalSiblings` widened; **ships safe-by-construction** — force-pick + generic marker, precision strings ratchet in) · fish **species** sub-pick (FALCPA label-compliance gate) · Probiotic Multi-Strain interim row capture.
- **August / blocking — curation (PA-gated, ratchets in):** B1 5 elemental factors · Selenium/Iodine factors (~7) · B2 6 vitamin DV form-equivalences · Vit E IU→mg + B6 + Vit C mineral-content · Pantothenate Ca reconcile · HM per-class refinement (kelp As, fish Hg blanket).
- **August / blocking — demand adds:** Urolithin A (generic; Mitopure→licensing) · Fisetin · **Colostrum** (full allergen-floor: Milk FALCPA + bovine nuance) · Beet Root (+ nitrate/beeturia info-note).
- **Deferred (post-August):** per-species Hg vectors (enrichment, not safety) · synonym sweeps beyond NAC · dup-pair sweep beyond Pantothenate · 30 S3 audit-noise items · Class-2 broad adds (Berberine/HMB/DIM/PQQ/Gymnema/Saffron…) · Probiotic full structured builder (Phase-2, co-located with F3) · molecular I₂.
- **Co-founder = precision gate, NOT ship gate:** scope as if available (precision strings ship); CC sequences engine + curation independently so precision-pending items never block the safe-by-construction ship.
- **A#1 synonym backfills (C1a-style, safe):** the resolved-but-renamed gaps (NAC done; Selenium/Iodine/DHA are C1b not C1a). Confirm any remaining clean single-form synonyms.

## E. External-data / browser (acquisition decisions)
- **§I.6 benchmarks** (NSF Certified-for-Sport list / Examine evidence grades / USP-DSC monograph index) — licensing/acquisition call to make them measurable.
- **#5 live 48-ingredient packet run** (browser) — closes the #1 render-fidelity caveat end-to-end.

---

**Once decisions land, CC's autonomous execution queue:** §II.8 authoring of approved adds · elemental factors → close B1 S2s · vitamin equivalences → close B2 S3s · pantothenate reconcile · Tier-3 disambiguation routing (after C1 form-sets) · classifier refinement (C2). Each gated, bench-tested, audit-guarded.
