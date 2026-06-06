# Provenance Assignment Methodology (Phase-1 catalog)

**Status:** 2026-06-05. The rule every provenance agent applies to its assigned entry, so all 100 are consistent. Populates `IndustrialIngredient.provenance: Record<string, Provenance>` (dot-notation per-field keys). Validated by `catalog-entry-validator` per commit.

## The governing rule
Per [[catalog_must_be_coa_spec_sheet_anchored]] + [[regulatory_classification_vs_supplier_data]]: **assign the honest source, never fabricate one.** Every populated value-field gets an explicit provenance — a value with *no* provenance entry is itself a defect (harm-critical floor: surface the gap, never leave it implicit).

## Field-class → provenance-variant map

| Entry field(s) | Class | Variant | How to fill it |
|---|---|---|---|
| `potencyFactor` | Derived (chemistry/label-math) | `computed-from-formula` | method = "carrier loading from stated IU/g or % on the label" |
| `elementalFactor` | Derived (chemistry) | `computed-from-formula` | method = "elemental mass fraction from molecular weight" |
| `regulatoryStatus.US` | Regulatory classification | **`regulatory-authority`** | authority `FDA`; citation = the basis (DSHEA dietary-ingredient / GRAS / 21 CFR part) |
| `ndiStatus` | Regulatory classification | **`regulatory-authority`** | authority `FDA`; citation = NDI notification # or "pre-DSHEA (pre-1994) ODI" |
| Pharmacopeial identity (USP/NF in name) | Published standard | **`regulatory-authority`** | authority `USP`; citation = "USP-NF <monograph>" |
| `nutrition.*` | Supplier-variable | `unknown` (or `usda-fdc` if a true commodity with an FDC ID) | reason = "no supplier spec sheet attached" |
| `allergens` | Supplier-variable / harm-critical | `unknown` | reason = "pending supplier spec / COA" — **never silently empty** |
| `bioactives` standardization % | Supplier-variable | `unknown` | reason = "standardization per supplier spec, not yet attached" |
| Branded-form identity (KSM-66, Creapure, Cognizin, Sabinsa C3, etc.) | Manufacturer | `supplier-spec` (ref pending) | vendor = brand owner; specSheetRef left blank until attached |
| `costPerKg` / `costSource` | Being severed | **skip** | cost is blank-until-real (parallel cost track) — do not annotate |

## Honesty guardrails (the agent must obey)
1. **No fabricated `supplier-spec`/`coa`** — if there's no real spec sheet, the value is `unknown`, full stop. A branded-form *identity* may be `supplier-spec` with a blank ref (the brand IS the manufacturer claim); its *nutrition/standardization numbers* are still `unknown` until the sheet attaches.
2. **`regulatory-authority` requires a real citation** — name the actual CFR part / NDI # / USP monograph. No citation → `unknown`.
3. **Default to `unknown`, not to a confident variant** — when in doubt, `unknown` with a reason is the doctrine-correct answer.
4. **Carrier-loaded entries (the 7 in scope)**: `potencyFactor` → `computed-from-formula` citing the stated IU/g; this is the one numeric value that IS canonically sourceable for them.

## Run shape (avoids write contention)
100 agents editing one `supplements.ts` concurrently = conflict. So: **agents RESEARCH and RETURN structured provenance** (one `{entryName, fields:[{key, variant, detail}]}` object each, schema-validated); **CC applies them to the file in coordinated batches**, `catalog-entry-validator`-gated. Fan out the research; centralize the write.

**Pilot first:** validate this methodology on 5 representative entries (1 carrier-loaded vitamin, 1 mineral, 1 branded botanical, 1 probiotic, 1 plain vitamin) before the full 100.
