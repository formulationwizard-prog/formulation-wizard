# Cost is Blank-Until-Real — removing indicative catalog cost

**Status:** LOCKED (operator + Opus session, 2026-06-05). Green-lit for build.
**Relationship to prior decision:** Evolves [Cost and Vendor Architecture — Four-Layer Roadmap](cost-and-vendor-architecture.md) §2. The four-layer *split* (manufacturer-spec shared / vendor-price private) is reaffirmed in full. This memo **reverses** that doc's "indicative cost as honest reference" compromise. Both stay in version history; neither overwrites the other.

---

## The decision

The platform displays **no fabricated cost anywhere.** Cost is **null-until-the-operator-enters-it**, at every level — ingredient price, packaging price, and everything they roll up into (per-unit, per-serving, margin, SRP). An unfilled cost renders as "—" / "add cost," never a number, and never feeds margin math.

This applies to: catalog `costPerKg` (all `lib/data/*.ts`), `PACKAGING_DB.costPerUnit`, the `priceModifier` buyer-tier multiplier, and every "~$X/kg" / "$X/unit ESTIMATED" display derived from them.

## Why the reversal (bank this — it IS the answer to "why is cost blank by default?")

The 2026-05-20 doc kept an *indicative* `costPerKg`, betting that disclaimers + as-of-dates + buyer-tier labels would make a displayed estimate **more** trustworthy than competitors' opaque numbers. That bet was wrong, for three reasons:

1. **Disclaimers fade; the displayed value becomes the signal.** What an operator reads is "the tool shows a number, so the number means something." The framing erodes; the digits remain.
2. **Supplement price variance is too wide for any indicative to inform.** A 50 kg buy of magnesium glycinate runs ~$25–60/kg across distributors. An "indicative $35/kg" makes a real $48 quote look *high* when it's just market spread — the estimate misleads more than it informs.
3. **It's a forcing function toward real procurement.** "Get a real quote from your real supplier before you size economics" is the correct operator workflow. The platform shouldn't shortcut it with a fabricated anchor.

**The deeper point:** the May-20 split was architecturally right, but the indicative-*display* compromise **leaked fabrication back into the shared layer.** Today's evolution honors the split fully — the shared layer (Layer 1) carries **spec-sheet data only**; the private layer (Layer 2) carries **price only when the operator enters it.** This is the COA doctrine extended to its most supplier-variable case: *data we don't have for THIS operator, we don't pretend to have.* Manufacturer specs are universal; price is per-operator. (See [[feedback_catalog_must_be_coa_spec_sheet_anchored]], [[feedback_regulatory_classification_vs_supplier_data]].)

## What we keep (the manufacturer is the join key)

- **Shared / Layer 1:** manufacturer SKU → spec sheet → nutrition, finished-product spec estimates, elemental/potency factors, allergens, regulatory. Same for every operator. **This is why we still want the manufacturer** — the spec sheet drives the estimate engine, not just cost.
- **Private / Layer 2:** the price *this* operator pays for *that same* SKU, keyed by (operator × SKU). IMS later fills the same rows (the "swappable source").
- The manufacturer-vs-distributor nuance (you may buy through a markup'd distributor) stays a Layer-2 growth field; not built for August.

## Already done (this thread)

- **Cost math is correct.** The 2026-06-05 Convention-A fix (`SUPPLEMENT_CONVENTION_B_ENABLED = false`) made the live cost path (`computeUnitEconomics`, fed by the shared `computePerServingScale`) treat the entered formula as one serving. No second cost bug — the earlier "separate buggy path" claim was wrong; it was dead code.
- **Dead inline cost path deleted** (`costPerServing` / `ingredientCostPerPackage` / `costPerPackage` in `app/workspace/page.tsx`).
- **`unitEconomics.ts` reconciled to Convention A** — stale Convention-B doctrine removed; `perServingScale` retained as the documented post-launch seam (stays 1.0 under the gate).
- **Margin section already user-input** — SRP, overhead %, labor, freight are already operator-entered. That half already follows the model.

## Implementation plan — the "blank-until-real" UI severing (next, not yet built)

1. **Stop seeding fabricated cost into the working formulation** — ingestion sites that copy `item.costPerKg` from the catalog (`app/workspace/page.tsx` ~1150/1658/1884/2377) seed `0`/blank instead; operator input (`updateCost`) becomes the only ingredient-cost source. Remove `priceModifier` tier logic.
2. **Remove fabricated displays** — "~$X/kg" in search/browse sublabels, ingredient cards, the header "$X ± $Y/unit ESTIMATED" chip; replace with honest empty/affordance states. **UX call (joy-of-mastery):** what a blank cost state looks like — recommend a quiet "add cost" affordance, never a zero that reads as "free."
3. **Packaging cost** — same severing for `PACKAGING_DB.costPerUnit`.
4. **Gate the downstream** — margin / per-unit / per-serving compute only from real inputs; unfilled → "needs cost," never computed-from-nothing (harm-critical-floor pattern applied to money).
5. **Catalog field migration (rulebook-governed, deferred):** removing `costPerKg` from ~600 catalog entries + retiring the field is a Catalog Authoring Rulebook change — validator-gated, batched, separate from this UI work. Sever reads first (above); delete the field on the rulebook track.

## Scope line

- **August:** severing (steps 1–4) so the platform never shows a fabricated cost. Layer-2 vendor management (real per-operator quotes) is the post-launch build per the four-layer doc (Stage 2, Round 13–14).
- **Post-launch:** Layers 2–4 (vendor quotes → formulation costing → inventory/IMS), and the catalog-field deletion (step 5).

— Locked 2026-06-05 (operator + Opus). Supersedes the indicative-cost portion of the 2026-05-20 four-layer doc §2; the layer separation itself is unchanged and reaffirmed.
