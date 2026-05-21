# Cost and Vendor Architecture — Four-Layer Roadmap

**Status:** Architectural framing for cost, vendor, formulation, and inventory data across the platform.
**Established:** 2026-05-20 (operator + Opus session, post-Q-Audit-1 closure).
**Surfacing events:** K2 MK-7 supplier-attribution inconsistency surfaced manufacturer/vendor confusion pattern; recurring "cost inversion" anomalies in Q-Audit-1 Pattern 1 surfaced cost-as-staleness-prone-field concern; together these crystallized the four-layer separation.
**Audience:** Claude (catalog-authoring agent) primary; human operator (Wizard) secondary; downstream integrators (validator agent, F&B Recipe Validator build, future-Claude sessions) tertiary.
**Cross-references:** [docs/audits/rulebook-vs-types-drift.md](../audits/rulebook-vs-types-drift.md) §6 (Q-Sh1/Sh2/Sh3/Q1 reconciliations); [docs/architecture/catalog-authoring-rulebook.md](catalog-authoring-rulebook.md) §9a (qualifier-discipline refinements).

---

## 1. Architectural framing — Four-layer separation

The platform separates data into four layers, each with a distinct authority source matching its authority shape. **The key architectural insight: each layer's data structure matches its authority shape.** Catalog data has authoritative external sources. Vendor data has authoritative source per operator. Formulation cost is calculated, not stored. Inventory is event-sourced.

### Authority-source-per-layer mapping

| Layer | Data | Authority source | Authority shape |
|---|---|---|---|
| **Layer 1 — Catalog** | Ingredient identity, regulatory status, allergens, harm-critical fields, chemistry, functional positioning, manufacturer info, manufacturer-verified specifications, Class-3 claims | External authorities + manufacturer verification | FDA decides regulatory categorization; USP-NF decides pharmacopeial standards; molecular structure decides chemistry; manufacturer COA decides product-specific specifications |
| **Layer 1 — Indicative cost** | `costPerKg` (with `costEstimateAsOf` + `costBuyerTierAssumption` framing) | None — explicitly indicative | Reference estimate; honest-uncertainty-as-moat framing; never authoritative |
| **Layer 2 — Operator vendor management** | Vendor records, per-vendor-per-ingredient quotes, MOQ, terms, payment, lead-time | Operator | Each operator's own supplier relationships; per-operator authoritative; no shared catalog truth |
| **Layer 3 — Formulation costing** | Recipes, batch scaling, cost calculations | Calculated, not stored | Catalog identity (Layer 1) + operator vendor pricing (Layer 2) → derived recipe cost |
| **Layer 4 — Inventory management** | Lot-level inventory, batch events, on-hand, reorder triggers | Event-sourced | Purchases, batch consumption, adjustments — operational events, not declarative state |
| **Cross-layer** | PA-review state | PA (Process Authority) | Independent authority for regulatory verification; operates orthogonally across layers via PA-review state machinery |

### The principle

**Each layer has a different authority source matching its authority shape.** Conflating authority sources across layers — e.g., treating catalog cost as authoritative when it should be indicative, or treating vendor relationships as catalog-shared when they should be per-operator — produces silent-failure pathways downstream.

---

## 2. Cost reframe — Catalog cost as indicative reference

### The five reasons catalog-stored cost has structural problems

**1. Cost goes stale faster than almost any other field.** Ingredient suppliers re-quote monthly or quarterly. Commodity ingredients fluctuate with raw-material markets, currency rates, shipping costs, tariff changes. A `costPerKg: 12.00` value authored in March is meaningfully wrong by July.

**2. Cost is never authoritative from a catalog source.** Unlike `regulatoryStatus` (which the FDA decides) or `allergens` (which the molecular structure decides), cost is decided by what your specific supplier quotes you on a specific day. No upstream authority can publish "the cost of Magnesium Glycinate" the way the FDA publishes "Magnesium Glycinate is GRAS."

**3. Cost varies dramatically by buyer.** A contract manufacturer buying 500 kg/month pays meaningfully less than a startup buying 5 kg. A catalog cost value implies a buyer-tier the operator may not match.

**4. Cost data is the most operator-specific catalog field.** Two different operators using the platform have genuinely different costs for the same ingredient. Storing one cost in the catalog forces every operator to override or be wrong.

**5. Cost staleness has economic consequences.** Wrong cost → wrong formulation cost estimate → wrong product margin → real downstream financial damage. This isn't theoretical; cost errors compound into mispriced products.

### Operator framing (verbatim)

> *"What the user needs always is the right/correct information. The user finds vendor, discovers MOQ and Costing — inputs it into their formulation and scales up to 1000 lb batches. All of the ingredients come out of inventory etc. User 1 gets tabasco for price 1; user 2 gets it for price 2."*

> *"If the cost is wrong on our end and not updated or integrated with suppliers, what's the point?"*

### Schema migration

Catalog `costPerKg` stays as a field, with explicit indicative semantics. Two companion fields land during Round 12 Step 1:

- **`costEstimateAsOf: string` (ISO date YYYY-MM-DD)** — makes staleness visible at the entry level. Validator can surface entries with stale or missing `costEstimateAsOf` for refresh routing.
- **`costBuyerTierAssumption: string`** — documents what buyer tier the cost reflects (e.g., `"10-100 kg/month contract manufacturer"`). Operators can compare against their own buyer tier to determine whether the indicative value applies to them.

Documentation framing: catalog cost is reference/indicative, not authoritative. Validator M-rule addition: cost values without `costEstimateAsOf` fire informational warning (not pushback).

---

## 3. Manufacturer/vendor distinction

### The core distinction

**Catalog truth = manufacturer-verified.** The catalog identifies the manufacturer who produced the ingredient and carries manufacturer-verified specifications (COA, identity testing, pharmacopeial references, regulatory status).

**Vendor = operator-layer, per-operator.** Vendors are the distributors/suppliers an operator buys from. The same ingredient from the same manufacturer can be purchased through multiple vendors at different prices. Vendor relationships are per-operator authoritative.

**Brand names belong in the catalog** because they encode manufacturer-verified specifications. KSM-66 Ashwagandha (Ixoreal) is a manufacturer-verified branded form with specific clinical-evidence base, specific standardization, specific identity. The brand IS the manufacturer specification.

### Operator framing (verbatim)

> *"I use all kinds of different vendors and change if I can find a better price or if I need a gluten free version of the same type of ingredient for instance. We need to know the manufacturer for COA and Spec Sheets but the vendor is different sometimes than the manufacturer. We want our ingredient catalog to be verified by the manufacturer so we have brand names."*

### Schema migration

The current `suppliers: string[]` array conflates manufacturers with distributors. Round 12 Step 1 restructures into a structured `manufacturer` field:

```typescript
// Branded ingredient (most common)
manufacturer: {
  type: 'branded',
  name: string,           // e.g., "Ixoreal Biomed"
  brandName?: string,     // e.g., "KSM-66"
  commonlyDistributedThrough?: string[]  // optional: indicative-vendor references for operator orientation
}

// Commodity ingredient (no single brand-owner)
manufacturer: {
  type: 'commodity',
  knownManufacturers: string[],   // e.g., ["Dr. Paul Lohmann", "Jungbunzlauer", "Gadot Biochemical"]
  commonlyDistributedThrough?: string[]
}
```

`commonlyDistributedThrough` is informational reference only — it indicates vendors operators have historically used to source the ingredient, NOT authoritative vendor data. Authoritative vendor data lives at Layer 2.

### Substitution use case

The operator workflow that drives the four-layer separation:

1. **Discovery:** Operator finds a vendor (could be the manufacturer direct or a distributor). Vendor offers an ingredient at a specific price, with specific MOQ, lead time, payment terms.
2. **Quote capture:** Operator records the vendor relationship + quote in the platform (Layer 2 — operator vendor management).
3. **Formulation:** Operator builds a recipe referencing catalog ingredients (Layer 1). The recipe applies the operator's vendor pricing to each ingredient (from Layer 2). Recipe cost is computed at the operator's actual cost, not catalog indicative cost.
4. **Scaling:** Operator scales the recipe from pilot batch (e.g., 1 kg) to production batch (e.g., 1000 lb). All cost calculations propagate.
5. **Production:** Ingredients consume from operator's inventory (Layer 4). Inventory state updates. Reorder triggers fire based on remaining quantities and lead times.

**Key insight:** at no point in this workflow does catalog cost serve as authoritative data. Catalog provides identity (Layer 1) and indicative reference (Stage 1 reframe). All decision-consequential cost data lives operator-side.

### Substitution flexibility at two layers

**Same manufacturer, different vendor** → operator-layer change (Layer 2). Operator switches from NutraScience to direct-Sabinsa for the same Sabinsa C3 product. Same catalog identity (Sabinsa C3 Complex with its potency, bioactives, regulatory status); different vendor relationship.

**Different manufacturer entirely** → catalog-level navigation. Operator searches catalog for a different manufacturer's product that meets different attributes (gluten-free version made by Manufacturer Y vs wheat-derived version by Manufacturer X). Different catalog identity entirely.

---

## 4. Stage 1-4 sequencing

### Stage 1 — Cost reframing in catalog (Round 12+ Step 1, sequenced with schema migration)

**What changes:**
- Catalog `costPerKg` stays as a field but with explicit indicative semantics
- New companion field `costEstimateAsOf: 'YYYY-MM-DD'` makes staleness visible
- New companion field `costBuyerTierAssumption: string` documents what buyer tier the cost reflects (e.g., "10-100 kg/month contract manufacturer")
- Documentation updates: catalog cost is reference/indicative, not authoritative
- Validator M-rule addition: cost values without `costEstimateAsOf` fire informational warning (not pushback)
- Schema migration also lands the manufacturer/vendor distinction (replaces `suppliers: string[]` with structured `manufacturer` field)

**Why this stage:** Honest framing of current data. Cost becomes auditable rather than asserted. No capability removed; semantics tightened.

### Stage 2 — Operator vendor management (post-launch, probably Round 13-14)

**What's added:**
- Per-operator vendor records: vendor name, contact, terms, capabilities
- Vendor-ingredient quotes: per-vendor per-ingredient quote with cost, MOQ, last-quoted-date, lead-time
- Operator UI for managing vendor relationships
- Quote import (paste from supplier email/PDF; structured capture)
- Vendor-to-catalog-entry mapping (operator records which vendor supplies which manufacturer's product)

**Capability gained:** Operator can input "I buy Magnesium Glycinate from Albion at $32/kg, MOQ 25 kg" and have it persist per their account.

**Why this stage:** First real per-operator data. Sets up the multi-tenant pattern. Independent of formulation layer — operators can use vendor management even before formulation costing is built.

### Stage 3 — Formulation costing (Round 14-15)

**What's added:**
- Recipes that reference catalog ingredients (identity from catalog)
- Recipe applies operator's vendor-quote pricing per ingredient (falls back to catalog indicative if no vendor quote exists)
- Batch scaling math (1 kg recipe → arbitrary production volume)
- Per-batch cost calculation with explicit breakdown
- Cost-sensitivity analysis (which ingredients drive cost? what form-swaps save how much?)

**Capability gained:** "Build me a formulation; tell me what it costs at 1000 lb batches with my actual vendor pricing."

**Why this stage:** Builds on Stage 2. Each formulation references operator vendor data. Cost calculations become real, operator-specific, audit-traceable.

### Stage 4 — Inventory management (Round 15-16+)

**What's added:**
- Lot-level inventory tracking per ingredient per operator
- Batch production events: consume inventory, update on-hand
- Inventory reconciliation, reorder triggers, expiry tracking
- Production batch records with traceability

**Capability gained:** Full formulation-to-production traceability. "Show me every batch that used Lot ABC of Magnesium Glycinate."

**Why this stage:** Inventory is the most operationally complex layer. Built last because it depends on Stages 1-3 being stable.

---

## 5. Architectural consistency notes

The four-layer architecture compounds with the platform's broader epistemic posture across multiple existing disciplines:

**Source-based confidenceLevel per Q-Sh1.** The catalog layer's UNDOCUMENTED-as-safe-default discipline is provenance-language. Source-based confidence aligns with manufacturer-as-authoritative-source for catalog identity. Catalog entries that can't trace their identity claim to manufacturer verification default to UNDOCUMENTED, preventing silent overclaims at the harm-critical floor.

**PA-as-authority architecture.** PA (Process Authority) reviews catalog entries for regulatory soundness; manufacturer verification grounds the identity that PA reviews. PA-review state machinery operates cross-layer (orthogonal to the four-layer separation) — PA reviews catalog identity, but operators control their own vendor + formulation + inventory layers. See [docs/pa-verification/README.md](../pa-verification/README.md).

**Honest-uncertainty-as-moat.** Cost as indicative reference is the same pattern as the pH predictor roadmap (Q4 F&B+ research item — see [docs/roadmap/acidified-foods-ph-predictor.md](../roadmap/acidified-foods-ph-predictor.md)) — surface useful estimate, never claim it substitutes for measurement (or in this case, for operator supplier quotes). The principle: explicit uncertainty bounds compound into trust over time as the validation dataset accumulates.

**Harm-critical floor.** Manufacturer verification IS the source dimension for harm-critical fields (allergens, regulatory status, identity testing). Manufacturer-verified catalog entries carry harm-critical floor compliance through to operator formulation. The four-layer separation preserves harm-critical floor integrity — Layer 1's manufacturer-verified identity is the floor every downstream layer builds on.

**Closure-claims-bidirectional.** Each layer makes claims at the appropriate authority level. Catalog claims manufacturer-verified identity. Operator layer claims operator-verified vendor data. Formulation layer claims calculated cost. No layer overclaims into another layer's authority. Silent overclaiming across layers is the failure mode the architecture prevents.

---

## 6. Implications for downstream work

### Round 12 Step 1 scope additions

The cost reframe + manufacturer/vendor distinction add to Audit #2's Step 1 scope. Updated Step 1 scope:

- Original Audit #2: ~51 field additions + 3 shape reconciliations (Q-Sh1/Sh2/Sh3)
- Cost reframe: 2 companion fields (`costEstimateAsOf`, `costBuyerTierAssumption`)
- Manufacturer/vendor distinction: replace `suppliers: string[]` array with structured `manufacturer` field across ~600 entries; add optional `commonlyDistributedThrough` informational reference

Step 1 is ~12-25 sessions of focused migration work (was 10-20). Still field-batched commits; still validator-gated throughout; still bounded.

### Validator implications

Validator M-rules require updates during Step 1:

- Cost informational warning rule: entries without `costEstimateAsOf` fire warning (not pushback)
- Manufacturer-field validator: entries must carry structured `manufacturer` field; `suppliers` array becomes deprecated
- Brand-name-in-name discipline: when name includes branded form (KSM-66, Cognizin, etc.), `manufacturer.brandName` must match

### F&B Recipe Validator build (Q4 2026+)

The four-layer architecture applies cross-domain. When the F&B Recipe Validator is built (Q4 2026+ per [docs/roadmap/acidified-foods-ph-predictor.md](../roadmap/acidified-foods-ph-predictor.md)), the same four-layer separation applies — catalog identity for ingredients, operator vendor management for sourcing, formulation costing for recipe builds, inventory management for production. The architectural pattern transfers.

---

## 7. Closing note

The four-layer architecture is the structural answer to a recurring class of operator-facing UX failures: cost values that go stale silently, vendor changes that orphan formulations, manufacturer-vs-distributor confusion that surfaces only when COAs are requested. By naming the authority source per layer and matching the data structure to it, the architecture prevents the cross-layer silent overclaiming that drives these failures.

This document is itself a worked example of the operator + Opus session producing durable architectural artifacts that survive across CC sessions (per [[feedback_session_boundary_context_handoff]] discipline). Future readers — including AI assistants — should treat this section as authoritative on the four-layer separation and its cost/vendor/formulation/inventory roles.

— Cost and Vendor Architecture established 2026-05-20 (operator + Opus session, post-Q-Audit-1 closure).
