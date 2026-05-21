# Vitamin K2 MK-7 — Supplier-Spec Reconciliation Pending

**Queued:** 2026-05-20
**Round / Section:** Q-Audit-1 routing → Round 12 Phase 2 verification queue (B4.4.3 deferral)
**Status:** PENDING

## What's Needed from PA / Supplier-COA

Three substantive inconsistencies between two `Vitamin K2 MK-7` catalog entries that cannot be resolved without supplier-COA evidence:

1. **Cost-per-active-mg discrepancy (~43×).**
   - Line 36 `Vitamin K2 MK-7 (Natto, 0.2% on MCC)` @ $6500/kg with `potencyFactor: 0.002` → active cost $3.25M/kg MK-7
   - Line 128 `Vitamin K2 MK-7 (NattoPharma, 2%)` @ $1500/kg with no `potencyFactor` → at 2% interpretation, active cost $75K/kg MK-7
   - 43× active-cost differential outside legitimate tier-pair spread; one entry's pricing is mis-specified relative to the other

2. **Allergen attribution conflict (HARM-CRITICAL).**
   - Line 36: `allergens: []` (empty — defaults to UNDOCUMENTED per §I.5)
   - Line 128: `allergens: ['Soybeans']`
   - Both entries reference natto fermentation (Bacillus subtilis natto) which is traditionally soy-fermented. **Same supplier set** (NattoPharma + Kappa Bioscience + Gnosis by Lesaffre on both) — cannot simultaneously produce soy-containing AND soy-free MK-7 under identical SKU framing.

3. **Form/carrier inconsistency.**
   - Line 36: MCC carrier explicit in subIngredients (`['Menaquinone-7', 'Microcrystalline Cellulose']`); potencyFactor 0.002 set per §II.10
   - Line 128: No carrier in subIngredients (`['Menaquinone-7']`); potencyFactor absent
   - Unclear whether "2%" on line 128 means (a) 2% standardized concentrated extract or (b) 2% on unspecified carrier

## Where This Lands Once Verified

`lib/data/supplements.ts` lines 36 + 128. Resolution paths:

- **(a) Both entries legitimate form variants (carrier-loaded 0.2% vs concentrated 2%):** retain both; correct allergen attribution per actual supplier substrate; correct cost data; add `potencyFactor: 0.02` to line 128 if confirmed 2% standardization with no carrier
- **(b) One entry mis-specified:** deprecate the incorrect entry; consolidate to the canonical form with corrected cost/allergen data
- **(c) Manufacturer/vendor restructure during Step 1:** split into manufacturer-specific entries (NattoPharma MenaQ7 / Kappa K2VITAL / Gnosis) with proper `manufacturer` field per Round 12 Step 1 architectural lock

## Open Questions for PA / Supplier-COA

1. NattoPharma MenaQ7 supplier-COA: does Bacillus subtilis natto fermentation substrate carry Big-9 Soy allergen via FALCPA disclosure? (Industry split — some commercial MK-7 uses chickpea-based or other-bean substrate to avoid soy declaration.)
2. Kappa Bioscience K2VITAL supplier-COA: same question — is K2VITAL soy-free or soy-containing?
3. Per-supplier potency form: which suppliers offer 0.2%-on-MCC carrier-loaded form vs higher-percent concentrated form?
4. Cost-per-kg current pricing: which entry's cost data is accurate at current supplier list rates?
5. Are line 36 and line 128 the same product with naming inconsistency, OR substantively different commercial forms?

## Context

Surfaced during Q-Audit-1 per-pair routing (B4.4.3 pre-screen mis-categorization correction; see `docs/audits/q-audit-1-pre-screen.md` Section "B4.4.3" + `docs/audits/q-audit-1-final-routing.md` Section 9). Initial pre-screen hypothesis was "legitimate form variants per §IV.23" — overturned when verbatim evidence surfaced three substantive inconsistencies. Same shape as the harm-critical floor discipline operating at the catalog-content layer: surface anomalies signal deeper verification needs.

**Step 0.5 disposition:** Both entries retain with `PENDING SPEC VERIFICATION` suffix until resolution.
