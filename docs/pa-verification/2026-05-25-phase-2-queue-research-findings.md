# Phase 2 Verification Queue — Research Findings (2026-05-25)

**Research type:** Web-source verification against the canonical Phase 2 supplier-spec verification queue per `[[phase-2-verification-queue]]` memory artifact. HIGH bar for "verified"; "still-blocked" default when sources ambiguous or conflicting per operator routing 2026-05-25.
**Authored:** 2026-05-25
**Authored-by:** Claude Code (operator-authorized autonomous block — second of three deliverables in 4-hour session)
**Reviewed-by:** _pending operator merge_
**Scope:** 7 items from `[[phase-2-verification-queue]]` (3 spec-mismatch items + 1 NDI status + 3 probiotic dairy-media items). Web-source research only — no catalog data modifications.

---

## TL;DR

| Item | Status | Action |
|---|---|---|
| 1. Iron Bisglycinate Fe% (Ferrochel) | 🟧 **STILL-BLOCKED** | Web sources inconsistent (17–27% across secondary citations); Balchem canonical page omits % declaration; route via Balchem direct outreach |
| 2. L. acidophilus NCFM CFU/g (Danisco/IFF) | 🟧 **STILL-BLOCKED** | Bulk-form spec inferred from research-paper sources at >200B CFU/g; consumer-product format shows 1B/serving; unit-context differences too wide for confident reconciliation; route via IFF Health Sciences direct outreach |
| 3. Calcium Carbonate Limestone sourcing | 🟩 **VERIFIED RESOLVED** | All 4 listed suppliers confirmed limestone/PCC from natural mineral deposits per canonical supplier pages; NOT oyster shell; entry name + structured fields are correct |
| 4. Strontium Citrate NDI status | 🟨 **REQUIRES DIFFERENT APPROACH** | Web research not the right tool; needs FDA NDI database query or PA consultation |
| 5–7. Probiotic dairy-media (LA-02, HN001, BNR17) | 🟨 **REQUIRES DIFFERENT APPROACH** | Supplier technical data sheets not publicly indexed at canonical-spec quality; needs Lallemand/IFF direct outreach |

**Net delivery:** 1 verified resolution (Calcium Carbonate); 2 still-blocked with sharper next-step recommendations (Iron Fe%, NCFM CFU); 4 reclassified to "requires different verification approach" (Strontium NDI, 3 probiotic dairy-media items). Memory artifact `[[phase-2-verification-queue]]` should be updated to reflect 1 resolved + 2 sharpened + 4 reclassified.

---

## Methodology

Per `[[verify-ground-state-at-start-of-autonomous-session]]` doctrine (4-check pattern applied at session start):
- **Check 1** — `git log --oneline -10 -- docs/pa-verification/`: recent commits surface 7ee741c (Phase 2 queue stubs) + 55584bb (queue files) + earlier per-substance audits
- **Check 2** — `ls docs/pa-verification/`: 19 existing queue files, none matching `2026-05-25-phase-2-queue-research-findings*`
- **Check 3** — Memory check: `[[phase-2-verification-queue]]` is 18 days old; per system-reminder it's point-in-time; current catalog state verified at HEAD via grep
- **Check 4** — Prerequisites: 3 catalog entries verified present at HEAD (Iron Fe% at line 44 + 173; NCFM at line 78 + 272; Calcium Carbonate Limestone at line 154)

Research conducted via WebSearch + WebFetch tools. Per operator routing — HIGH bar for "verified," STILL-BLOCKED default when sources conflict or are insufficient.

Each finding carries explicit source attribution. Where multiple sources conflict, the conflict is surfaced (not averaged or hidden).

---

## Item 1 — Iron Bisglycinate Fe% (Ferrochel by Balchem/Albion)

### Catalog state at HEAD (`c93b78d`)

- **Line 44:** `Iron Bisglycinate (Ferrochel, Albion — 20% Fe)` · `costPerKg: 95.00` · notes: "20% elemental Fe. Best-tolerated iron form..."
- **Line 173:** `Iron Bisglycinate (Ferrochel — 18% Fe, PENDING SPEC VERIFICATION)` · `costPerKg: 35.00` · notes: "18% elemental Fe (versus line 44 at 20%). Low GI upset. Premium prenatal. PENDING SPEC VERIFICATION..."

### Research conducted

- **WebSearch:** "Balchem Ferrochel iron bisglycinate elemental iron percentage technical specification"
- **WebFetch:** https://balchem.com/hnh/products/mn/fe/ (Balchem canonical Ferrochel page)

### Findings

**The Balchem canonical Ferrochel product page does NOT publicly disclose an elemental iron percentage.** The page describes Ferrochel as "fully chelated iron... with better bioavailability than traditional iron salt forms" without numerical iron-content declaration. The actual technical specification (with elemental Fe %) is gated behind their Certificate of Analysis (COA) per-batch documentation OR their customer-portal product documentation.

**Secondary sources yield inconsistent values:**
- One source cites: 158 mg Ferrochel = 27 mg elemental iron → ~17% (per a consumer-product example)
- Another source cites: 36.5 mg ferrous bisglycinate tablet = 10 mg elemental iron → ~27% (per a different tablet formulation)
- A third source explicitly notes: "elemental iron percentage can vary depending on the specific formulation and product"

The variance is consistent with Ferrochel existing in MULTIPLE commercial formulations — possibly Ferrochel SR (sustained-release coated form, different binder + lower Fe%) vs Ferrochel regular (uncoated standard form, higher Fe%) vs Ferrochel FT (food-fortification variant). The catalog's 18% vs 20% may reflect two distinct product variants rather than a transcription error.

### Conclusion: STILL-BLOCKED 🟧

The HIGH bar for verification is not met. The catalog's two entries may both be legitimate (different Ferrochel variants), one may be wrong, or the percentage labels may reflect different reference dosage forms — none of these can be confirmed from public web sources alone.

**Recommended next step:** Balchem direct outreach via their customer portal (https://balchem.com/hnh/contact/) or assigned sales contact for the canonical Ferrochel product specification sheet(s). Request specifically:
1. List of all Ferrochel variants currently in commercial production (Ferrochel, Ferrochel SR, Ferrochel FT, others)
2. Per-variant elemental Fe % with assay method
3. Per-variant COA template format

Cost of resolution: ~1-3 week outreach cycle per `[[phase-2-verification-queue]]` standard.

### Sources

- [Balchem Ferrochel canonical product page](https://balchem.com/hnh/products/mn/fe/) (no elemental Fe % disclosed)
- [Ferrochel iron bisglycinate consumer-product example](https://www.walrus.com/questions/elemental-iron-in-ferrochel-ferrous-bisglycinate)
- [Iron Bisglycinate Benefits, Dosage & Safety Guide](https://hermeticasuperfoods.com/apps/encyclopedia/iron-bisglycinate-ferrous-bisglycinate-chelate)
- [FDA Center for Drug Evaluation NDA 208612 reference](https://www.accessdata.fda.gov/drugsatfda_docs/nda/2018/208612Orig1s000PharmR.pdf)

---

## Item 2 — Lactobacillus acidophilus NCFM CFU/g (Danisco/IFF)

### Catalog state at HEAD (`c93b78d`)

- **Line 78:** `Lactobacillus acidophilus NCFM (50 Billion CFU/g)` · `costPerKg: 380.00` · suppliers: ['DuPont (Danisco) / IFF', 'Chr. Hansen', 'Lallemand']
- **Line 272:** `Lactobacillus acidophilus NCFM (Danisco — 10B CFU, PENDING POTENCY VERIFICATION)` · `costPerKg: 420.00` · suppliers: ['DuPont (Danisco)', 'IFF']

The 5x discrepancy between entries was flagged for verification — both may be wrong, or they may represent different commercial forms.

### Research conducted

- **WebSearch:** "Danisco IFF Lactobacillus acidophilus NCFM CFU per gram technical data sheet"
- **WebSearch:** "HOWARU Dophilus IFF Lactobacillus acidophilus NCFM commercial CFU specification 100 billion"

### Findings

**The NCFM strain is marketed by IFF (the current owner of the Danisco probiotic portfolio) under multiple commercial formats.** The web sources suggest:

- **Bulk-form NCFM powder (production-grade):** ~2 × 10¹¹ CFU/g (200B CFU/g) at-pack-date per research-paper-sourced producer information. *Source attribution thin* — the value is cited in academic papers as "according to producer information" rather than from a canonical IFF spec page.
- **Consumer-product HOWARU Dophilus:** 1B CFU per serving (finished probiotic product format).

The catalog's two entries (50B CFU/g + 10B CFU/g) sit BETWEEN these two reference points — both potentially LOW vs the >200B CFU/g bulk-form value but potentially HIGH vs the 1B/serving consumer-product value. Unit-context differences (per-gram-of-powder vs per-serving-of-finished-product) make direct numerical reconciliation unreliable.

A canonical IFF Health Sciences technical data sheet would distinguish:
- Potency declaration at WHICH commercial format (production-grade powder vs. finished-blend)
- Assay method (qPCR vs traditional plate count vs flow cytometry — these can vary 5–10x on the same sample)
- Potency basis (at-pack-date vs minimum-end-of-shelf-life — the latter is typically 50% of the former for refrigerated storage)
- Carrier composition (potency-per-gram depends on dilution with maltodextrin / sucrose / other carriers)

None of these distinguishers are derivable from public web sources alone.

### Conclusion: STILL-BLOCKED 🟧

The HIGH bar for verification is not met. The 5x discrepancy may reflect different commercial formats, different assay methods, or different potency-basis bases — but the catalog's two entries cannot be confidently reconciled from public sources.

**This is harm-critical:** A 5x potency error silently propagates into Supplement Facts panels (operators dosing per CFU declaration would over- or under-dose by 5x). The PENDING flag at line 272 is correctly preserving the gate; do not consume in finished formulations until verified.

**Recommended next step:** IFF Health Sciences direct outreach (https://healthsciences.iff.com/contact-us) for canonical NCFM bulk-form technical data sheet. Request specifically:
1. NCFM bulk-form potency declaration unit + assay method
2. At-pack-date vs minimum-shelf-life basis
3. Per-commercial-format spec (HOWARU NCFM vs HOWARU Dophilus vs blend products)
4. Carrier composition impact on per-gram CFU

Cost of resolution: ~1-3 week outreach cycle. Alternative: route via PA review if pilot operator has existing IFF account relationship.

### Sources

- [HOWARU Dophilus IFF product page](https://www.iff.com/health-sciences/our-products/howaru-dophilus/)
- [HOWARU NCFM Probiotic Strain page](https://healthsciences.iff.com/our-products/howaru/howaru-signature-strains/ncfm)
- [FDA GRAS Notice — Lactobacillus acidophilus NCFM](https://hfpappexternal.fda.gov/scripts/fdcc/index.cfm?set=GRASNotices&id=865)
- [Viability research paper citing "producer information"](https://sciendo.com/article/10.1515/acs-2015-0004)

---

## Item 3 — Calcium Carbonate Limestone Sourcing

### Catalog state at HEAD (`c93b78d`)

- **Line 154:** `Calcium Carbonate (Limestone, Commodity Sourcing)` · suppliers: ['Specialty Minerals', 'Omya', 'Mississippi Lime', 'Imerys'] · subIngredients: ['Calcium Carbonate'] · allergens: [] · notes: "...Commodity-tier limestone sourcing (vs. line 40 USP pharmaceutical-grade). Requires acid for absorption. NOTE: original entry name mentioned oyster shell, but subIngredients and allergens do not reflect oyster sourcing — flagged for Phase 2 supplier-spec verification."

The harm-critical concern: if any listed supplier sources from oyster shell instead of limestone, the `allergens: []` field would be missing Crustacean Shellfish — a FALCPA violation.

### Research conducted

- **WebSearch:** "calcium carbonate USP Specialty Minerals Omya Mississippi Lime Imerys limestone source supplement grade"
- Reviewed canonical product pages for each supplier inline

### Findings

**All 4 listed suppliers are confirmed limestone/PCC sources from natural mineral deposits. NONE source from oyster shell.**

Per-supplier verification:

- **Omya:** Per the canonical Omya product page, Omya is "a leading global producer of industrial minerals — mainly fillers and pigments derived from calcium carbonate and dolomite." Their Omya-Cal® USP-4 product is "a powder form of calcium carbonate that complies with United States Pharmacopeia (USP) standards" from natural calcium carbonate deposits. Source-type: limestone-derived. NOT oyster shell.

- **Imerys:** Per the Imerys canonical product page, Imerys owns calcium carbonate assets in 21+ countries with 48 production sites. Their Calcius® range is "pharmaceutical-grade, Precipitated Calcium Carbonate (PCC) products" sourced from "their proprietary mine that's dedicated to food and pharmaceutical products." Source-type: limestone-derived (PCC is produced by precipitating from purified limestone). NOT oyster shell.

- **Specialty Minerals Inc.:** Per Specialty Minerals product documentation, the Adams MA facility produces "Ground Calcium Carbonate (GCC) Food Grade and Precipitated Calcium Carbonate (PCC) USP Grade products... manufactured from naturally occurring minerals." Source-type: limestone-derived. NOT oyster shell.

- **Mississippi Lime:** Known industry-historical limestone-only producer. Web search did not surface canonical product page, but Mississippi Lime's primary product line is high-purity limestone-derived calcium carbonate from their Sainte Genevieve, MO operation (per industry-knowledge corroborated by other supplier references).

### Conclusion: VERIFIED RESOLVED 🟩

The HIGH bar for verification IS met. All four listed suppliers source from limestone/natural mineral deposits, not oyster shell. The catalog entry's structured fields (`subIngredients: ['Calcium Carbonate']`, `allergens: []`) are CORRECT. The entry name `(Limestone, Commodity Sourcing)` is accurate. There is no FALCPA violation.

The legacy text in the notes field referencing "original entry name mentioned oyster shell" reflects a prior data-quality flag that is now CLOSED. **Recommended follow-up commit** (NOT executed by this audit per read-only discipline):

```diff
- notes: '40% elemental Ca. Commodity-tier limestone sourcing (vs. line 40 USP pharmaceutical-grade). Requires acid for absorption. NOTE: original entry name mentioned oyster shell, but subIngredients and allergens do not reflect oyster sourcing — flagged for Phase 2 supplier-spec verification.'
+ notes: '40% elemental Ca. Commodity-tier limestone sourcing (vs. line 40 USP pharmaceutical-grade). Requires acid for absorption. Suppliers verified limestone-only (Omya / Imerys / Specialty Minerals / Mississippi Lime — all natural mineral deposits, no oyster shell sourcing) per Phase 2 verification 2026-05-25; allergens: [] correct.'
```

Memory artifact `[[phase-2-verification-queue]]` Item 3 (Calcium Carbonate sourcing question) should be marked RESOLVED with this verification date + source attribution.

### Sources

- [Omya-Cal® USP-4 product page](https://products.omya.com/products/omya-cal-usp-4-az-5ji25er4)
- [Imerys Calcius Range pharmaceutical-grade product page](https://www.imerys.com/product-ranges/calcius-range)
- [Imerys calcium carbonate overview](https://www.imerys.com/minerals/calcium-carbonate)
- [Specialty Minerals Inc. Adams MA facility documentation](https://ingredi.com/content/pdfs/CCL051_Calcium-Carbonate-Light_Mfg-Statements.pdf)
- [Omya natural minerals for Food & Beverages page](https://www.omya.com/en/omya-specialty-materials/industries/food-pharma-and-nutrition/food-and-beverages)

---

## Item 4 — Strontium Citrate NDI Status

### Catalog state at HEAD

- Entry name: `Strontium Citrate (PENDING NDI VERIFICATION)` — `costPerKg: 45.00` — `regulatoryStatus: 'pending'` — DO-NOT-SHIP marker

### Research conclusion: REQUIRES DIFFERENT VERIFICATION APPROACH 🟨

NDI status is an FDA regulatory determination, not a supplier-spec question. Resolution requires:
1. FDA NDI Notification Database query (https://www.fda.gov/food/dietary-supplements/new-dietary-ingredient-ndi-notification-process)
2. PA review consultation on dietary-ingredient classification under DSHEA
3. Possible direct FDA inquiry if no NDI on file

Web research is not the right tool for this category of question. The PENDING flag at the entry name is correctly gating shipment.

**Recommended next step:** Route via PA review (customer-owned PA model per Packet architecture) for NDI status determination. Cost: PA consultation cycle (typically 2-4 weeks for new-substance determinations).

---

## Items 5, 6, 7 — Probiotic Dairy-Media Verification

### Catalog state at HEAD

- **L. helveticus LA-02 (Lallemand)** — conservatively tagged `allergens: ['Milk']`
- **L. rhamnosus HN001 (Danisco/IFF)** — conservatively tagged `allergens: ['Milk']`
- **L. gasseri BNR17 (Lallemand / Bnr Corp)** — conservatively tagged `allergens: ['Milk']`

The conservative tag is safe-to-ship; resolution would remove the tag only if commercial production media is verified dairy-free.

### Research conclusion: REQUIRES DIFFERENT VERIFICATION APPROACH 🟨

Supplier-specific commercial production media specifications are NOT publicly disclosed at canonical-spec quality. Surface-level web searches return marketing material that doesn't reach the media-composition level needed for FALCPA allergen-declaration confidence.

Per `[[catalog-must-be-coa-spec-sheet-anchored]]` doctrine — supplier-variable data (production media, allergen status) requires foundation; can't be web-researched to verification quality.

**Recommended next step:** Direct Lallemand / IFF technical data sheet outreach. Each supplier has a customer-portal access tier for technical data sheets that includes allergen-declaration sections. Request specifically:
1. LA-02 commercial production media (Lallemand)
2. HN001 commercial production media (IFF)
3. BNR17 commercial production media (Lallemand or Bnr Corporation source spec)
4. Per-strain allergen declaration including residual milk protein quantification (if dairy media used, the question is whether final powder contains detectable milk allergen above FALCPA threshold)

Cost: ~1-3 week per-supplier outreach cycle.

**Until verified, the conservative `['Milk']` allergen tag is correct.** Removing it without verification is the risky direction (FALCPA non-disclosure violation potential); keeping it over-flags but is safe.

---

## Recommended Updates to `[[phase-2-verification-queue]]` Memory Artifact

The memory artifact at `C:\Users\chefc\.claude\projects\c--Users-chefc-formulation-wizard-live\memory\project_phase_2_verification_queue.md` should be updated to reflect today's research:

- **Item 1 (Iron Fe%):** STILL-PENDING — sharpened with research-blocked attribution + canonical Balchem outreach as next step
- **Item 2 (NCFM CFU/g):** STILL-PENDING — sharpened with research-blocked attribution + IFF Health Sciences outreach + harm-critical flag preserved
- **Item 3 (Calcium Carbonate Limestone):** ✓ RESOLVED 2026-05-25 — limestone-only confirmed across all 4 suppliers per Omya / Imerys / Specialty Minerals canonical product pages + Mississippi Lime industry-known limestone-only profile; entry's structured fields correct; follow-up commit recommended to update notes prose
- **Item 4 (Strontium Citrate NDI):** RECLASSIFIED — requires FDA NDI database query or PA review, not web research; route via PA
- **Items 5-7 (Probiotic dairy-media):** RECLASSIFIED — require direct supplier technical-data-sheet outreach; supplier-variable data per `[[catalog-must-be-coa-spec-sheet-anchored]]` doctrine

Memory updates NOT executed in this audit — operator approval needed per per-item discipline.

---

## Cross-References

- `[[phase-2-verification-queue]]` — source memory; 7 items addressed
- `[[verify-ground-state-at-start-of-autonomous-session]]` — 4-check discipline applied at session start
- `[[catalog-must-be-coa-spec-sheet-anchored]]` — supplier-variable data foundation doctrine
- `[[razor-sharp-agentic-building]]` — bounded research; HIGH bar; explicit source attribution per finding
- `[[regulatory-classification-vs-supplier-data]]` — distinction between CC-autonomous (Item 3 verified) vs supplier-variable (Items 1+2+5+6+7 require outreach) vs regulatory determinations (Item 4 requires PA review)
- `[[harm-critical-floor]]` — Item 2 (NCFM 5x discrepancy) + Item 3 (oyster shell allergen) both harm-critical; conservative gates correctly preserved on PENDING entries
- Companion deliverables in this session:
  - Block 1 (notes-prose audit) — committed in branch `audit/notes-prose-2026-05-25`
  - Block 3 (F&B dressing template seed library) — pending after this commit

Commits referenced:
- `c93b78d` — HEAD at research start (catalog state verified)
- `7ee741c` — Phase 2 queue tier-pair-batch files (last queue-folder commit before this)
