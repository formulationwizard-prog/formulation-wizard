# St. John's Wort — Label Drug-Interaction Warning Text

**Filed:** 2026-05-17 (Round 11 Phase 3 Wave 1.5c, commit-pending)
**Catalog entry:** `St. John's Wort (Hypericum perforatum, 0.3% Hypericin / 3% Hyperforin)` in `lib/data/supplements.ts`
**Status:** Pending qualified Process Authority (PA) / DSHEA-trained regulatory reviewer sign-off before any commercial product carrying this ingredient ships.

---

## Why this is in the queue

The catalog entry intentionally **does not** carry per-product drug-interaction warning text. The reasoning:

1. **Single source of truth.** Drug-class interaction enumeration lives in `lib/supplementSafetyLimits.ts` `INTERACTION_WARNINGS` table. Duplicating Rx-class language in the catalog `notes` field creates two-sources-of-truth drift risk — same class of bug as the legacy `detectAllergens` / SFP renderer regressions.

2. **Commercial-label language is a compliance product, not catalog data.** The exact wording that appears on a commercial supplement label carrying St. John's Wort is governed by:
   - FDA Consumer Update Feb 2000 (CYP3A4 induction warning baseline)
   - DSHEA structure/function disclaimer requirements
   - Specific market jurisdictional requirements (US vs CA NHPID vs EU EFSA)
   - Brand legal review

3. **Workspace surfaces the data; PA-qualified reviewer signs off on commercial label text.** The Safety card and Determination Engine render the safety-engine's authoritative drug-class enumeration. The catalog entry's role is to *exist* and *be discoverable*; the *commercial label text* is downstream of the workspace + PA review.

---

## What PA must verify before commercial release

For any product formulated with this catalog entry's St. John's Wort SKU:

### Authoritative drug-class interaction enumeration (currently surfaced in workspace via `INTERACTION_WARNINGS`)

- **SSRIs** — serotonin syndrome risk via additive serotonergic effect
- **Oral contraceptives** — contraceptive failure via CYP3A4 induction (multiple documented pregnancies in 1999-2003 case series)
- **Warfarin** — INR destabilization via P-glycoprotein + CYP induction
- **HIV protease inhibitors** — antiretroviral failure
- **Cyclosporine** — organ-transplant rejection risk (multiple case reports)
- **Digoxin** — therapeutic failure
- **Anticonvulsants (carbamazepine, phenytoin)** — seizure breakthrough risk
- **Statins** — reduced LDL-lowering effect

### PA decisions required

1. **Exact warning language for the commercial label.** Options range from FDA's minimum "Consult your healthcare provider before using if you take any prescription medications" to the full drug-class enumeration.

2. **Black-box / equivalent prominence.** Some markets (EU, parts of Asia) require boxed warnings; US convention varies by retailer.

3. **Pregnancy / lactation contraindication language.** SJW is generally contraindicated in pregnancy; specific wording required.

4. **Interaction-checker integration.** Whether the brand maintains its own drug-interaction database or refers consumers to a third-party (Natural Medicines, Examine, Mayo Clinic) — both legally and operationally distinct.

5. **NDI status.** SJW is pre-1994 DSHEA-grandfathered, so no NDI required, but PA should confirm the specific Hypericum perforatum variant and standardization is covered.

### Suggested PA workflow

1. Pull current FDA Consumer Update + recent (2020+) FDA Warning Letters mentioning Hypericum / St. John's Wort.
2. Compare brand's planned label language against the Cochrane Drug-Interaction database + Natural Medicines Comprehensive Database SJW monograph.
3. Cross-reference brand's target retail channel requirements (Whole Foods has specific botanical warning requirements; Sprouts requires equivalent).
4. Confirm dosage and standardization match the clinical trials cited in the catalog entry's notes (Linde 2008 Cochrane, Indena Hyperifoss / Schwabe ZE 117 / Bauer Perika).

### Drain criteria

This queue entry drains when:
- PA-qualified reviewer signs off on the commercial-label drug-interaction text **for a specific brand's specific product**
- Sign-off is captured in the brand's regulatory file with date + reviewer credentials
- Catalog entry remains unchanged (the catalog is shared infrastructure; per-product label language stays in per-product compliance docs)

---

## Catalog cross-references

- `lib/data/supplements.ts` → entry: `St. John's Wort (Hypericum perforatum, 0.3% Hypericin / 3% Hyperforin)`
- `lib/supplementSafetyLimits.ts` → `INTERACTION_WARNINGS` table, `St. John's Wort` entry (drug-class enumeration source of truth)
- `lib/data/stacks.ts` → `STACK.MOOD` commonCompanion (where this ingredient appears in stack recommendations)

---

## Authoring discipline note

This file is the canonical PA-verification queue pattern for ingredients whose **catalog presence is straightforward but whose commercial-label language requires expert review**. The catalog entry exists, is discoverable, has correct citations and bioactives — the workspace can use it. The remaining work (exact label warning text) is downstream and properly belongs in the PA queue, not the catalog.

If/when the queue is drained (per-brand commercial label approved), no catalog change is required — only the brand's compliance documentation.
