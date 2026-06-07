# Vitamin D3 Vegan (Lichen-Sourced) — Manufacturer Disambiguation Pending

**Queued:** 2026-05-20
**Round / Section:** Q-Audit-1 routing → Round 12 Phase 2 verification queue (Cluster C C.1 deferral)
**Status:** PENDING

## What's Needed from PA / Supplier-COA

Disambiguate manufacturer-vs-finished-product-brand identity in two distinct supplier ecosystems for vegan lichen-sourced Vitamin D3:

- Line 33 `Vitamin D3 Cholecalciferol (Vegan, Lichen)` Vitamins @ $1100/kg — Kappa Bioscience (K2VITAL D3) + **Nordic Naturals Industrial** + MicrobioCos
- Line 122 `Vitamin D3 Vegan (Lichen-Sourced)` Vitamins @ $1200/kg — **Vitashine (ESB Developments) + Lumi Vegan D3**

Two ecosystems, no supplier overlap. Per manufacturer/vendor distinction (per `docs/architecture/cost-and-vendor-architecture.md`):

- **Kappa Bioscience** — pharma-grade vitamin manufacturer; legitimate raw-ingredient source
- **Nordic Naturals Industrial** — questionable as raw-ingredient supplier; Nordic Naturals is primarily a finished-product brand (omega-3 softgels); "Industrial" suffix unclear (B2B division? misattribution?)
- **MicrobioCos** — unfamiliar; possibly contract manufacturer or finished-product brand
- **Vitashine (ESB Developments)** — dominant vegan D3 brand for finished supplements; raw-ingredient-manufacturer status uncertain
- **Lumi Vegan D3** — vegan D3 specialty brand; raw-ingredient-manufacturer status uncertain

Cost gap modest (1.1×) — not a tier-attribution signal. The substantive question is supplier-classification (manufacturer vs distributor vs finished-product-brand) per the just-locked manufacturer/vendor architectural distinction.

## Where This Lands Once Verified

`lib/data/supplements.ts` lines 33 + 122. Resolution paths:

- **(a) Both ecosystems legitimate manufacturer-tier sources:** retain both as legitimate tier-pair (different ecosystems, potentially different downstream-vegan-supplement-channel orientations); rename per §II.9a to encode the ecosystem difference (e.g., `Vitamin D3 Cholecalciferol (Vegan, Lichen, Pharma-Grade)` vs `Vitamin D3 Vegan (Lichen-Sourced, Vegan-Specialty-Brand)`)
- **(b) One or both entries have finished-product-brand misattribution:** restructure during Step 1 manufacturer/vendor refactor; finished-product brands move to `commonlyDistributedThrough`; upstream lichen-D3 manufacturers identified as `manufacturer`
- **(c) Consolidate to single canonical entry:** if both entries source from the same upstream lichen-D3 manufacturer ecosystem with finished-brand reseller variation only

## Open Questions for PA / Supplier-COA

1. **Nordic Naturals Industrial:** Does Nordic Naturals operate a B2B raw-ingredient division that supplies lichen-D3, or is this attribution incorrect?
2. **MicrobioCos:** Is this a real raw-ingredient manufacturer? (Unfamiliar to industry-standard vegan D3 sourcing.)
3. **Vitashine (ESB Developments):** Vitashine is the dominant vegan D3 consumer brand. Is ESB Developments the upstream lichen-D3 manufacturer they license from, or is Vitashine itself the manufacturer?
4. **Lumi Vegan D3:** Same question — manufacturer or finished-product brand?
5. **Cross-ecosystem question:** Do all five named entities (Kappa, Nordic Naturals, MicrobioCos, Vitashine/ESB, Lumi) ultimately source from one or a small number of lichen-cultivation operations? (Industry-standard vegan D3 production runs through a limited number of lichen-cultivation facilities.)
6. Per Round 12 Step 1 refactor: which entities are legitimate `manufacturer` references, which are `commonlyDistributedThrough` references, which should be deprecated?

## Context

Surfaced during Q-Audit-1 per-pair routing (Cluster C C.1; see `docs/audits/q-audit-1-final-routing.md` Section 7 + Section 11 Pattern B). Same shape as B4.2.1 Zinc Picolinate (Thorne/Jarrow) — pre-manufacturer/vendor-refactor `suppliers: string[]` array conflates finished-product consumer brands with raw-ingredient manufacturers. The manufacturer/vendor architectural lock at Round 12 Step 1 is the natural resolution path.

**Step 0.5 disposition:** Both entries retain with `PENDING SPEC VERIFICATION` suffix until manufacturer/vendor restructure can apply.

---

## ADDENDUM 2026-06-06 — `potencyFactor` carrier-loading backfill (harm-critical)

**Surfaced:** operator review of a live "Calm & Sleep Support" formula — `Vitamin D3 Vegan (Lichen-Sourced)` entered at 25 mcg rendered a mass column of **0.0036%** (0.025 mg of physical material), which is physically unblendable. Root cause: both lichen D3 entries lacked `potencyFactor`, so the engine treated the entered active dose as the raw-material mass (and suppressed the carrier-loaded entry-time warning + the silent-zero guard, both keyed on `potencyFactor`).

**Interim resolution applied (code, not yet PA-verified):**
- `Vitamin D3 Cholecalciferol (Vegan, Lichen)` and `Vitamin D3 Vegan (Lichen-Sourced)` → `potencyFactor: 0.0025`, the **representative** value for the common 100,000 IU/g finished grade (mirrors the lanolin 100k-IU/g sibling and the line-119 "2026-06-05 data-gap fix" precedent). Honest-estimate, basis documented in the entry note; NOT a verified vendor value.

**Still needed from PA / Supplier-COA (adds to the open questions above):**
7. **Exact carrier loading (IU/g) for the Vitashine and Lumi grades you intend to source.** 0.0025 assumes 100,000 IU/g. If the sourced grade differs (the SKUs span 1,000–400,000 IU/g), `potencyFactor` must be corrected: `potencyFactor = (IU/g × 0.000025 mg active/IU) / 1000`. e.g. 200,000 IU/g → 0.005; 400,000 IU/g → 0.010.

Until verified, the representative 0.0025 is acceptable per the honest-estimate doctrine (documented basis + confidence + pending flag), and the structural blend-floor guard (`BLEND_FLOOR_MG`, lib/supplementLabeling.ts) backstops any residual under-/over-statement by flagging physically-unblendable masses regardless of `potencyFactor`.
