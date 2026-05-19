# Catalog stripped-name collisions surfaced by Wave 1.5d Tier 2 collision detection

**Surfaced:** 2026-05-18 (Round 11 Phase 3 Wave 1.5d)
**Severity:** S2 (operator-blocking) — with one S1 sub-finding (PC 30% Soy/Sunflower allergen-profile differential)
**Disposition:** Round 12 catalog cleanup work

## What was surfaced

The Wave 1.5d Tier 2 stripped-name collision-detection fix (in `lib/parseFormula.ts:findBestMatchWithTier`) was implemented to address the Methylfolate silent-substitution bug. Routing all >1 stripped-name matches through Tier 3 disambiguation rather than first-match-wins is the general fix. During implementation, a catalog-wide audit script enumerated **30+ stripped-name collisions** beyond Methylfolate — most pre-existing from the two-wave value-tier/premium-tier ingestion seam (`project_supplements_two_wave_ingestion`).

The Wave 1.5d fix routes all of these collisions through the Tier 3 amber `⚠ Confirm match` UI surface. This is **correct behavior per the rulebook §I.7 harm-critical floor** (surface ambiguity rather than silently substitute), but it represents a substantial UX shift from pre-1.5d behavior where most of these collisions silently first-match-won.

## Bucket 1 harm-critical floor finding (closed by Wave 1.5d)

**Phosphatidylcholine 30% Soy vs Sunflower — silent allergen-profile substitution. Bucket 1 (FALCPA Big 9 allergen layer breach).**

The catalog has two entries that strip to "Phosphatidylcholine 30%":
- `Phosphatidylcholine 30% (Soy Lecithin-Derived)` — `allergens: ['Soybeans']`
- `Phosphatidylcholine 30% (Sunflower Lecithin-Derived, Allergen-Free)` — `allergens: []`

Pre-1.5d failure mode:
- Operator pastes `Phosphatidylcholine 100 mg` intending Sunflower variant (allergen-free product target)
- Tier 2 stripped-name path returns first-iteration-order match → Soy variant silently committed
- Soy `allergens: ['Soybeans']` propagates through the entire downstream pipeline: SFP "Contains" statement, allergen filing, cross-contamination flags
- Finished product label declares no Soy allergen (operator's intent), but underlying formulation contains soy-derived PC → **undeclared FALCPA Big 9 allergen → mislabeling → recall-level regulatory exposure**

Same class of bug as the Methylfolate disambiguation primary fix (silent wrong-resolution at Tier 2 stripped-name collision); **higher harm severity** because the differential crosses the allergen layer (Bucket 1 harm-critical floor per rulebook §I.7), not just the branded-form / sourcing-tier layer (Bucket 2).

Post-1.5d the Tier 3 disambiguation prompt fires, surfacing the choice to the operator with the candidate list. The allergen-profile differential is no longer silent — operator-visible confirmation prompt forces explicit selection.

This finding demonstrates why the architectural refactor (Wave 1.5d Tier 2 collision-detection fix) was the right shape rather than a three-instance fix scoped only to known Methylfolate-class cases. The bug class has variable harm severity; the fix discipline must address the class.

## Audit categorization by harm-severity (Round 12 work)

Each of the 30+ stripped-name collisions enumerated below requires a per-pair review for harm-severity. Two buckets:

- **Bucket 1 — harm-critical differentials.** Allergen-profile differential, regulatory-status differential, identity differential, claim-gate differential. Pre-1.5d silent substitution would have crossed a harm-critical floor (§I.7). Post-1.5d Tier 3 disambiguation closes the silent-substitution path — but each pair still warrants review for whether the operator-facing disambiguation prompt surfaces ENOUGH context to make the right choice. Some Bucket 1 pairs may need explicit operator-facing warnings about the differential, not just candidate enumeration.
- **Bucket 2 — substance-equivalent collisions.** Both entries have equivalent harm profiles; operator just needs to pick the right one for branded / sourcing / cost-tier preference. Tier 3 disambiguation surfaces them naturally; no additional UX work needed.

Cleanup audit per pair:
1. Compare `allergens` field across the colliding entries
2. Compare `regulatoryStatus` field across the colliding entries
3. Compare claims-relevant fields (functionalRole, bioactives)
4. Categorize: Bucket 1 if any differ → priority review; Bucket 2 if all match → operator-disambiguation-only

## Full collision catalog (as of `d4e8d71`)

Grouped by stripped name. Each row: entries that share the stripped name, separated by `⊕`.

### Provisionally Bucket 2 — substance-equivalent collisions pending audit

These are pairs where operator paste of the bare stripped name should genuinely surface for confirmation — distinct branded forms or sourcing tiers that have meaningful differences. Tier 3 disambiguation is the desired behavior.

**Pending Round 12 audit:** each pair below needs harm-severity check (allergens / regulatoryStatus / claim-relevant fields equal across the pair?). If equal → confirmed Bucket 2. If different → escalate to Bucket 1 priority review.

- `methylfolate` — Metafolin (Calcium L-5-MTHF) ⊕ Quatrefolic (Glucosamine L-5-MTHF) — distinct salt-form branded products
- `inulin` — FOS Chicory Root ⊕ Organic Chicory Root — sourcing / certification choice
- `hypromellose` — HPMC K4M ⊕ HPMC E5 (Coating) — different polymer grades
- `softgel shell base` — Gelatin/Glycerin ⊕ Plant-Based/Carrageenan — vegetarian-positioning choice
- `cordyceps militaris` — Organic Fruiting Body ⊕ 0.3% Adenosine + Cordycepin standardized — positioning choice
- `ashwagandha` — KSM-66 (Ixoreal) ⊕ Sensoril (Natreon) — distinct branded standardizations
- `curcumin 95%` — Commodity Tier ⊕ Sabinsa C3 Complex — cost-tier choice
- `magnesium glycinate` — Albion TRAACS Chelated ⊕ Generic Chelate Commodity Sourcing — sourcing-tier choice
- `iron bisglycinate` — Ferrochel Albion 20% Fe ⊕ Ferrochel 18% Fe PENDING — specification pending
- `zinc gluconate` — USP Pharmaceutical-Grade ⊕ USP Commodity Sourcing — sourcing-tier choice
- `chromium picolinate` — USP ⊕ ChromeMate USP — branded form choice
- `green tea extract` — 98% Polyphenols 50% EGCG ⊕ EGCG 45% Decaffeinated — standardization choice
- `elderberry extract` — 4:1 Sambucol Type ⊕ Sambucus nigra 10% Anthocyanins ⊕ Organic — sourcing/standardization choice
- `lion's mane extract` — 30% Polysaccharides Fruiting Body ⊕ Hericium erinaceus 30% Polysaccharides ⊕ Organic Dual-Extract — sourcing/standardization choice
- `turmeric extract` — 95% Curcuminoids ⊕ Curcumin 95% Sabinsa C3 ⊕ Organic 95% Curcumin — branded form / sourcing choice
- `vitamin d3 cholecalciferol` — 100,000 IU/g on MCC ⊕ Vegan Lichen — vegan-positioning choice
- `vitamin k2 mk-7` — Natto 0.2% on MCC ⊕ NattoPharma 2% — branded form choice
- `calcium carbonate` — USP Limestone ⊕ Limestone Commodity Sourcing — sourcing-tier choice
- `methylcobalamin` — Vitamin B12 Active ⊕ B12 Active Commodity Sourcing — sourcing-tier choice

### Bucket 1 — confirmed harm-critical differential (CLOSED by Wave 1.5d Tier 2 collision detection)

- `phosphatidylcholine 30%` — Soy Lecithin-Derived (`allergens: ['Soybeans']`) ⊕ Sunflower Lecithin-Derived (`allergens: []`) — **FALCPA Big 9 allergen-profile differential**, see Bucket 1 finding section above

(The Round 12 audit should surface any additional Bucket 1 cases hiding in the "Provisionally Bucket 2" list above.)

### Apparent duplicates (possible authoring artifacts — investigate)

These entries appear to have identical stripped names AND identical parens content. They may be intentional duplicates (same entry surfaced in two catalog sections) or genuine authoring duplicates. Audit and resolve in Round 12.

- `calcium citrate` — Calcium Citrate (USP) ⊕ Calcium Citrate (USP)
- `magnesium oxide` — Magnesium Oxide (USP) ⊕ Magnesium Oxide (USP)
- `magnesium citrate` — Magnesium Citrate (USP) ⊕ Magnesium Citrate (USP)
- `copper gluconate` — Copper Gluconate (USP) ⊕ Copper Gluconate (USP)
- `l-arginine hcl` — L-Arginine HCl (USP) ⊕ L-Arginine HCl (USP)
- `taurine` — Taurine (USP, Crystalline) ⊕ Taurine (USP) — near-duplicate
- `zinc picolinate` — Zinc Picolinate (USP) ⊕ Zinc Picolinate (Premium)
- `ferrous sulfate` — Ferrous Sulfate (Dried, USP) ⊕ Ferrous Sulfate (USP)
- `potassium iodide` — Potassium Iodide (USP, Food-Grade) ⊕ Potassium Iodide (USP)
- `l-lysine hcl` — L-Lysine HCl (Pharma Grade, 78%) ⊕ L-Lysine HCl (USP)
- `l-citrulline malate 2:1` — L-Citrulline Malate 2:1 ⊕ L-Citrulline Malate 2:1 (USP)
- `l-theanine` — L-Theanine (Suntheanine, Pharma) ⊕ L-Theanine (Suntheanine, Taiyo)
- `creatine monohydrate` — Creatine Monohydrate (Creapure, USP) ⊕ Creatine Monohydrate (Creapure)
- `ginkgo biloba extract` — Ginkgo Biloba Extract (24% Flavone Glycosides, 6% Terpene Lactones) ⊕ Ginkgo Biloba Extract (24% Flavones, 6% Terpenes) — same content, different phrasing
- `milk thistle extract` — Milk Thistle Extract (80% Silymarin) ⊕ Milk Thistle Extract (Silymarin 80%) — same content, different phrasing
- `saw palmetto extract` — Saw Palmetto Extract (85% Fatty Acids, CO₂) ⊕ Saw Palmetto Extract (85–95% Fatty Acids)
- `chaga extract` — Chaga Extract (30% Polysaccharides, 2% Triterpenes) ⊕ Chaga Extract (Inonotus obliquus, 30% Polysaccharides)
- `vitamin e` — d-alpha Tocopheryl Acetate ⊕ d-Alpha Tocopherol Natural ⊕ d-Mixed Tocopherols 70%

(List is non-exhaustive; full audit available by running the discovery script — see Wave 1.5d implementation notes.)

## Recommended Round 12 work

1. **Bucket 1 / Bucket 2 audit pass — priority work.** For each of the 30+ collision pairs enumerated above, run the harm-severity check (compare allergens / regulatoryStatus / claim-relevant fields across the pair). Categorize as Bucket 1 (harm-critical differential) or Bucket 2 (substance-equivalent). PC 30% is the known Bucket 1 case; the audit should surface whether any others hide in the provisionally-Bucket-2 list.

2. **Bucket 1 follow-up UX work.** For each confirmed Bucket 1 pair, evaluate whether the existing Tier 3 disambiguation prompt surfaces ENOUGH context for the operator to choose correctly. Some may need explicit operator-facing warnings about the differential ("⚠ Allergen profile differs between candidates") beyond just candidate enumeration. PC 30% specifically: confirm the allergen-statement preview in the Tier 3 disambiguation UI shows the Soybeans differential.

3. **PC 30% allergen-profile harm-critical investigation** — verify no operator-facing artifacts (Daily Reset MV v2 or other formulations) currently committed to workspace state have the wrong PC 30% variant from pre-1.5d silent substitution. If any are surfaced, route to allergen-statement re-audit and operator notification.

4. **Apparent-duplicate review** — for each pair flagged as "apparent duplicates" (identical stripped name AND identical parens content), determine whether the duplicate is intentional (two catalog sections referencing the same SKU) or accidental. Rename or merge as appropriate.

5. **Add catalog-wide collision detection to authoring discipline** — the existing wave-1-5b-synonym-backfill.test.ts has catalog-wide invariant tests for normalized synonym collisions. Wave 1.5d added Tier 2 stripped-name collision-detection at the parser layer. Round 12 work: add the corresponding catalog-wide test that asserts no UNINTENDED stripped-name collisions exist — explicitly enumerate expected collisions (carrying the Bucket 1 / Bucket 2 categorization), fail on new collisions during authoring without explicit acknowledgement.

6. **Sunflower Lecithin (Liquid) entry Wave-1.5 schema upgrade** — adjacent F&B-era entry deferred from Wave 1.5d scope per §38a Miss-mode B decision rule. Bundle with this Round 12 cleanup pass (Path A) OR escalate to a Wave 1.5e if customer-zero verification surfaces a Sunflower Lecithin paste failure first (Path B).

## Cross-references

- Wave 1.5d implementation: `lib/parseFormula.ts:findBestMatchWithTier` Tier 2 collision-detection branch
- Wave 1.5d test coverage: `lib/__tests__/wave-1-5d-tier-2-collision.test.ts`
- Original bug report: operator browser verification 2026-05-18 (Methylfolate silent-substitution screenshot)
- Two-wave ingestion context: operator memory `project_supplements_two_wave_ingestion`
- Harm-critical floor discipline: `docs/architecture/catalog-authoring-rulebook.md` §I.7
