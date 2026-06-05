# Packaging — Facet & Visibility Model

**Status:** Co-designed (operator + CC, 2026-06-05). Green-lit for the **Opus pass** — not yet built.
**Builds on:** [Packaging Data Sheet Architecture](packaging-data-sheet-architecture-2026-05-27.md), [Cost & Vendor Four-Layer Roadmap](cost-and-vendor-architecture.md), [Cost is Blank-Until-Real](cost-blank-until-real-2026-06-05.md), the WS-C roles×visibility matrix (lives on the `ws-c` branch).
**Reconciliation note:** §4 (visibility) must be folded into the WS-C roles×visibility matrix doc when next on the `ws-c` branch — it is the packaging worked-example of that model. Written self-contained here so the Opus pass sees the whole model in one place.

---

## 1. The problem

Packaging is currently workspace-global state (`selectedPackaging` / `selectedClosure`, `app/workspace/page.tsx`), shared across every tab. That single blob entangles four genuinely separate concerns — what the formulation needs, what the production floor runs, what procurement manages, and what it costs — and exposes all of them to every role. The model below de-entangles it along **two axes**: *which surface owns each facet*, and *which job function may see it*.

## 2. The core idea

Packaging is **one entity, selected once**, with facets that different surfaces consume and different functions may see. Two governing principles:

- **Identity is an instruction; cost & vendor are intelligence.** Instructions flow to the floor (run the batch); intelligence stays with the functions that own it (procurement, pricing).
- **Stable identifiers at every seam; the mutable detail lives behind them, scoped to the function that owns it.** Two such interface variables: **capacity** (Build↔PDS) and **part number** (procurement↔production).

## 3. Axis 1 — Facet × home

| Facet | Authoring home | Consumed by | Notes |
|---|---|---|---|
| **Capacity** (fl oz / mg / cc) | Build / Base Sheet | Fill mass, servings/container, net qty, headspace | Needs **density** to convert volume→mass (the volume-parens / `fl oz === oz` dependency). The **Build↔PDS interface variable.** |
| **Functional barrier reqs** (amber, O₂/moisture barrier, desiccant, N₂) | Build / Base Sheet *(as requirement)* | Stability & overage prediction | Formulation declares the requirement; PDS realizes it. |
| **Part number + physical spec** (12 fl oz ring-neck, material, closure type/finish) | **PDS** → inherited by Batch Sheet, label, traceability *(read-only)* | Production floor — "pick this for the run" | The **procurement↔production interface variable.** NOT vendor. |
| **Vendor** (distributor / purchase channel) | **Layer 2** (purchasing) | Purchasing only | Mutable *behind* the part number. Re-sourcing for price changes nothing the floor sees. |
| **Cost** (container + closure) | **Layer 2** (purchasing authors) → **Unit Economics** (pricing reads) | Purchasing + pricing only | Per-operator, **blank-until-real** (see cost memo). |

**Flow — requirement → realization → cost:** Build declares "60-serving fill, amber moisture-barrier, ~12 fl oz." PDS realizes it: picks a part-numbered SKU whose spec satisfies the requirement, validates **fit** (fill ≤ capacity − headspace), and whose spec-sheet capacity *supersedes* the typed target once bound (estimate→validated pattern). Unit Economics prices the bound SKU.

**The capacity unification:** "does the fill fit the fl oz capacity" is the *same constraint* as "does the formula fit the capsule's mg capacity" (the capsule-utilization check, `SUPPLEMENT_CONVENTION_B_ENABLED` thread, 2026-06-05). Container capacity is **one universal concept** — holding capacity that bounds fill and drives the fit check — form-specific only in unit (fl oz / mg / cc). One fill-vs-capacity validator; the capsule version is already a special case.

**The part-number stability layer:** the controlled PDS/BPR references the **part number**, never the vendor. A vendor swap (purchasing re-sources for price) is a Layer-2 mapping change — the controlled document is untouched, so **no PDS revision + re-approval is triggered** (clean 21 CFR 111 change-control). **Receiving is the bridge:** when pallets land from whatever vendor, receiving assigns them the correct part number and opens lot traceability — the one function that sees both the incoming vendor shipment and the internal part number, because reconciling them is its job.

## 4. Axis 2 — Facet × visibility (by function)

Visibility is **need-to-know by job function, not by rank.** Pricing/purchasing see cost because cost *is* their job; the batcher doesn't because execution is theirs.

| Function | Sees / owns | Cost? | Vendor? |
|---|---|---|---|
| **Production** (batcher / CMO line) | Part # + physical spec (Batch Sheet) | No | **No** |
| **Receiving** | Vendor↔part# mapping + lot (reconciles incoming) | No (unit cost on PO is purchasing's) | Yes |
| **Purchasing** | Layer 2 — vendor records + quotes; **authors** cost & vendor | **Authors** | Yes |
| **Pricing** | Unit Economics — cost→margin→SRP; **reads** cost | **Reads** | No (only cost) |
| **QA / RA** | PDS spec, manufacturer/COA, qualified-supplier status | No | Manufacturer (for COA), not the purchase channel |
| **Owner** | All | Yes | Yes |

**Mechanism:** "see-cost" (and "see-vendor") is an **assignable capability grant** — the WS-C per-run-grant primitive generalized from per-run to **per-function** — *not* hardwired to the Owner role. Cost/vendor data lives **physically separated** at the data layer (owner-scoped table/view), because row-level security cannot redact a single column of an otherwise-visible row (the logged **"RLS-can't-redact-cost"** WS-C finding). The grant controls who may join/read the separated table.

**Co-pack makes this non-negotiable:** the CMO runs your batch, *must* see the part-numbered container to pick it, and *must not* see your vendor or margin. The grant crosses org boundaries **by person/function**, not by role — a CMO-side purchasing agent may hold the cost grant while the CMO-side line worker does not.

## 5. Open decisions for the Opus pass

1. **Cost/vendor visibility — new role vs capability grant?** The locked WS-C Owner/RA/CMO triad doesn't name a Purchasing/Pricing function. **Recommendation: a capability grant layered on existing roles**, not a 4th role — it handles the small shop (one person does pricing *and* purchasing), the co-pack case (grant by person across orgs), and keeps the triad intact.
2. **Capacity authoring + supersession.** Confirm: operator types a target capacity on Build (container-agnostic) → PDS binds a part-numbered SKU whose spec capacity supersedes the target. Same estimate→validated shape as Master Specs.
3. **Receiving as a first-class function** — confirm it enters the role model (bridges vendor→part#, opens lot trace) vs. deferring to the post-launch traceability work.

## 6. Implementation sketch (post-Opus, not yet built)

- **De-entangle workspace-global packaging state** into the three homes: Build holds capacity (+ barrier reqs), PDS holds part# + spec selection, Layer-2/UE hold vendor + cost.
- **Build:** capacity becomes a first-class formulation input (typed target or read from bound part#); drop the container SKU from the formulation surface.
- **PDS:** owns the part-numbered selection + fit validation; renders part# + spec, **not vendor**.
- **Batch Sheet:** inherits part# + spec read-only — "pick this for the run."
- **Unit Economics:** cost overlay on the bound part#, behind the cost grant.
- **Data layer:** cost + vendor in an owner/grant-scoped table separate from the production-visible packaging row.
- **Scope:** August = de-entanglement + part#-as-production-reference + capacity-as-input + cost/vendor redaction. Layer-2 vendor management, the grant infrastructure, and receiving/lot-trace follow the four-layer doc's post-launch staging (Rounds 13–16).

— Co-designed 2026-06-05 (operator + CC). Green-lit for Opus review. §4 to be reconciled into the WS-C roles×visibility matrix on the `ws-c` branch.
