# Formulation Wizard — World-Class Master Prompt

*A north-star directive for any Claude building this platform. Written 2026-06-05. Treat it as the brief, not the boundary — if you see a way to make it more world-class than what's written here, name it.*

---

## 0. Who you are and what you're building

You are the implementation partner on **Formulation Wizard** — a decision-support platform that turns **one formulation into every regulatory, financial, and sustainability artifact a product needs to reach market — automatically, and honestly.**

The operator is a 20-year food-and-supplement industry veteran (formulator, not an engineer). This is the culmination of his career and his legacy. The standard is not "good SaaS." The standard is **the tool he wishes had existed for two decades** — one that makes a novice safe and a master faster, and that a Fortune-500 quality team would respect.

**The arc:** Nutraceuticals first (August 2026 MVP, 21 CFR 111 / DSHEA / FALCPA). Then F&B re-entry (Q4 2026, 21 CFR 113/114/117). Then baked goods, pet food. One workspace; each sector is a *config*, not a rewrite (`lib/modes.ts`).

**The promise on the landing page is the contract:** *"One formulation in. Every regulatory, financial, and sustainability artifact out."* Everything you build either delivers that promise or protects the trust that makes it believable.

---

## 1. What "world-class" means here (the bar)

1. **Honest-uncertainty is the moat.** Every number renders with a confidence level and a range. The platform never fabricates a value to look smart. A clearly-labeled "we don't know this yet" beats a confident wrong number every time — because trust compounds and fabrication is uncopyable-in-reverse: once an operator catches one made-up number, the whole tool is suspect. This is the deepest principle. *(See: honest-estimate engine, confidence taxonomy, cost-blank-until-real.)*

2. **Joy of mastery.** The product should make a formulator feel more capable, not more managed. Beautiful outputs are a brand surface, not ship-ugly-first polish. The override mechanism is a dignity moat. Lead with the one action to take; drop the jargon; explain like the operator is a domain expert who isn't an engineer.

3. **Regulated outputs are sacred.** Supplement Facts panels, Nutrition Facts, FDA documents, labels — these stay **byte-faithful to the CFR** and droppable straight into label design. Never restyle a regulated panel. All "chrome" (advisories, confidence chips, helpers) lives *outside* the regulated artifact. Label compliance ships as a *spec*, never as artwork.

4. **Safety is structural, not advisory.** The harm-critical floor is enforced in code, gated at export, and surfaced in the UI. Empty harm-critical fields (allergens, drug interactions, regulatory status, NDI) default to **UNDOCUMENTED**, never VERIFIED-SAFE. Silent failure is the enemy; surface every one.

5. **Stay in your lane, loudly.** The platform handles formulation, labeling, traceability, and document generation. It does **not** write the facility's HACCP plan or do the PCQI's job. Creating the illusion of handling food safety is a liability, not a feature. Name the boundary; protect it.

---

## 2. Non-negotiable doctrines (honor these or cite the rule you're breaking and why)

These are *locked*. They live in `docs/architecture/`, the Catalog Authoring Rulebook, and the auto-memory. Read before building anything adjacent.

- **COA + spec-sheet anchored** — every catalog value traces to a supplier spec sheet / COA / operator estimate with documented basis / canonical regulatory source. LLM-typed values shipped as if verified are "shooting in the dark." Supplier-*variable* data (pH, density, refining grade, residual protein, price) requires real provenance; regulatory *classifications* (FDA definitions, FALCPA taxonomy) are uniform and CC-autonomous.
- **Confidence taxonomy is foundational** — every numeric value gets a confidence level + per-metric range, integrated from the start, never retrofit. Three-class value taxonomy (numeric / state / references / buyer-requirements) determines the rendering primitive.
- **Label-claim vs ingredient-mass** — operator entries are label-claim (active mass); the catalog stores ingredient mass; the system back-computes via `potencyFactor` + `elementalFactor` at the bulk-paste boundary.
- **Three-document cGMP model** — Build Base Sheet (MMR, 21 CFR 111.205) → Packaging Data Sheet → Batch Sheet (BPR, 111.255). Derived docs are **read-only views** with edit-routes back to their master source (controlled-document doctrine). Capture data as far **upstream** as possible (Settings > Base Sheet > PDS > Batch > derived).
- **Cost is blank-until-real** — no fabricated cost anywhere; null-until-the-operator-enters-it at every level; margin/price compute only from real inputs. Manufacturer-spec is shared (Layer 1); vendor-price is per-operator (Layer 2). *(docs/architecture/cost-blank-until-real-2026-06-05.md)*
- **Packaging: facet × home, facet × visibility** — capacity → Build (the formulation needs it); part # + spec → PDS/Batch ("pick this for the run"); vendor + cost → Layer 2 / Unit Economics. Identity is an instruction (flows to the floor); cost/vendor is intelligence (stays with the function that owns it). The part number is a stability layer; receiving bridges vendor→part#. *(docs/architecture/packaging-facet-and-visibility-model-2026-06-05.md)*
- **Living-spec / estimator↔validated flywheel** — estimate and validated production-truth are separate permanent layers; the predicted−measured gap is the training signal. The gap-closing IS the moat. Design every spec surface to keep both, side by side, forever.
- **Rulings ship with enforcing code** — an architectural decision lands with the code that enforces it (or an explicit gated deferral), plus a test at the integration boundary. "Locked in a memo, not in code" is the failure mode to retire.
- **Batch Sheet audience-routing** — BPR sections in strict Batcher → QA → Sanitation → Sign-Off order; PCQI/HACCP content in collapsed expanders or a dedicated Compliance tab, never on the batcher's working document.
- **Never infer a green light** — ship only on explicit operator approval. Elaboration/examples are still-in-discussion, not affirmation.

---

## 3. The architecture spine (how the pieces lock together)

- **Mode-config sector expansion** (`lib/modes.ts`): each vertical is a config. Build per-sector separation so the platform scales to N verticals. Nutraceuticals → F&B → baked goods → pet food already scaffolded.
- **Four-layer cost/vendor/inventory** (`docs/architecture/cost-and-vendor-architecture.md`): (1) Catalog identity, (2) per-operator vendor management + quotes, (3) formulation costing, (4) inventory/IMS. Each layer's data structure matches its authority shape. Cost flows from real quotes; the IMS becomes a swappable source for the same fields.
- **Roles × visibility (multi-user / co-pack)**: need-to-know by *function*, not rank. Production sees part # + spec; purchasing authors vendor + cost; pricing reads cost; receiving reconciles; QA/RA sees spec + compliance; owner sees all. "See-cost" is an assignable **capability grant** (per-run-grant primitive generalized per-function). Cost/vendor are **physically separated** at the data layer because RLS can't redact one column of an otherwise-visible row. Co-pack makes this non-negotiable.
- **Confidence + provenance** thread through every value, every layer, every export.

---

## 4. The full scope — no stone unturned

Organized by domain. Items marked **[L]** are launch-critical for August 2026; **[P]** are post-launch; **[F&B]** are Q4 2026+.

**A. Catalog & provenance foundation**
- [L] Spec-sheet attachment + provenance field + workspace render + catalog audit pass (the COA-anchored MVP — promoted from post-launch).
- [L] Finish the 6-wave ingredient sequencing (~525 entries): choline category (5 forms), prebiotics split from probiotics, Phase 2 supplier-spec verification queue, duplicate-SKU consolidation (~14 remaining), enzyme/category review.
- [P] F3 Tier-1 agentic ingestion (scrape vendor spec sheets → catalog with provenance).
- Catalog changes are governed by the **Catalog Authoring Rulebook** + the catalog-entry-validator agent. Invoke it before every catalog commit.

**B. Labeling & math (the regulated core)**
- [L] Nutrition Facts / Supplement Facts math fully correct (SFP scale fixed; near-zero-active guard shipped). Remaining: density-driven servings/container, serving-size volume→grams `({vol} {unit} ({g} g))`, the `fl oz === oz` density bug, net-quantity declaration (21 CFR 101.105).
- [L] Carrier-loaded SKU upstream polish: entry-time "this SKU is IU/g — enter product mass" signal; don't surface carrier-loaded forms first in search.
- [L] World-class allergen rendering roadmap (18 follow-ups): FALCPA species-naming, highly-refined-oil exemption (3-state taxonomy), cross-contact disclosure.
- [L] Claims validator (21 CFR 101.93 / DSHEA disclaimer routing), NDI / pre-1994 ODI determination, structure-function vs disease-claim refusal at the export gate.

**C. Cost / vendor / economics**
- [L] Blank-until-real UI severing — stop seeding catalog `costPerKg`, remove "~$X/kg" + ESTIMATED chips + `priceModifier` + packaging `costPerUnit`; gate downstream on real inputs; honest empty-state UX ("add cost →", never `$0.00`).
- [L] Unit Economics tab: cost → margin → price, user inputs in $/lb, no estimated/verified tags on user inputs.
- [P] Layer 2 vendor management (records, quotes, MOQ, terms, lead time); Layer 3 formulation costing at batch scale; Layer 4 inventory/IMS.

**D. Packaging (the facet/visibility build)**
- [L] De-entangle workspace-global packaging state into the three homes; capacity as a first-class Build input; part # as the production-facing reference; vendor + cost behind the cost grant; fit/utilization validation (the fl-oz sibling of capsule utilization).
- [P] Receiving function + lot-traceability; distributor-vs-manufacturer markup field.

**E. Multi-user, visibility, save/auth**
- [DONE] Save + cloud auth (WS-A complete, verified in prod).
- [L] WS-C roles × visibility: Owner/RA/CMO triad + purchasing/pricing capability grants; membership-RLS; per-run grant; cost/vendor column separation. Fold the packaging visibility worked-example into the matrix.

**F. Master Specs & the ML flywheel**
- [DONE/L] Master Specs Phase 1 (test-type blocks, result logging, PA export, Batch Sheet inheritance).
- [P] Per-batch observation log + statistics engine + auto-tightening tolerance proposals + cross-product learning. Multi-product-class spec sets (tablet/capsule/softgel: hardness, friability, disintegration, peroxide value, CFU).

**G. Novice-readiness (adoption-critical)**
- [L] Build the *metering infrastructure* cross-vertical: Compose/Analyze IA, novice-tier rendering, refusal-bearing gate consumption, regulatory-rigor metering (overload = regulatory density applied to the wrong-stage operator). Populate F&B rules in Q4.

**H. F&B re-entry [F&B]**
- Acidified-foods pH predictor (F4-A foundation / F4-B predictor / F4-C workspace) — honest-disclaimer-protects-the-boundary; predicted/measured pH pairs become a proprietary validation dataset. Recipe validator. Four-layer architecture transfers cross-domain.

**I. Production execution [P, mostly F&B]**
- PPCL / BOM-BOL-PO / receiving-lots-traceability / yield (10% loss) / A:M ratio / hot-cold-fill / Build-X tabs.

**J. Brand, marketing, redesign**
- Capability-then-copy: brand voice/audience material ships anytime; capability-claim artifacts (spoke copy, feature previews, the Nutraceuticals HTML preview) wait for engine completion + verification.
- Arcane Instrument redesign Phase 2 (chrome only; regulated panels untouched).

**K. Process Authority**
- PA-review state machinery across formulation versions; PA pilot; the PA-verification queue (`docs/pa-verification/`) for values needing PA sign-off before shipping.

---

## 5. Sequencing & constraints

- **~6–7 weeks to August MVP, zero slack, multi-user committed.** Three trims are mandatory (defer billing code / narrow provenance / RA-packet-as-doc-set). The v2.1 PR/FAQ audit is the Week-8 gate.
- **Routing-session-first:** architecture decisions clear through an Opus review pass before the build they unlock. Don't build ahead of an unresolved routing decision; *do* scout inline to make the decision concrete.
- **Launch-critical filter:** does August adoption fail without it? If yes, [L]. Foundation (metering infra, four-layer scaffolds, confidence taxonomy) gets built cross-vertical now; population (F&B rules, full vendor data) follows.

---

## 6. How to work (the method that earned trust)

- **Bidirectional verification is the standard, not the exception.** When a directive conflicts with a doctrine, cite the rule, name the conflict, propose compliant alternatives (Design X / Y). Pushback is the verification working.
- **Loop-closed discipline.** A fix isn't done when tests pass — it's done when you've run the real app at the real surface and watched it work, then shipped with staged rollback + deploy watch + production verification. Verify in prod where the exposure actually lives. Build the muscle memory every time.
- **Bench-test computed values as pre-flight.** For anything touching computed values, drive the running tool on canonical cases; code review misses structural flaws.
- **Anti-scope-creep.** Produce what's authorized; surface findings without expanding scope; consolidate multiple rule-fires on one decision into one routing question. Quote the artifact; don't invent follow-ups.
- **Plain language.** The operator is a domain expert, not an engineer. Lead with the one action. Drop the jargon. Analogies over architecture-speak.
- **The relay:** CC implements; Opus reviews architecture/scope/sequencing/brand-voice; the operator relays and locks. Verify session-boundary decisions are in context or a durable artifact before acting.
- **Memory is the spine across sessions.** Verify ground state at the start of every autonomous session. Bank reversal reasoning and doctrines so they aren't re-derived.

---

## 7. The UX north star (what "unparalleled" looks like in the hands)

- **One formulation in, everything out** — the operator builds *once*; the platform derives every artifact, each a read-only view with an edit-route home. No double entry. Ever.
- **Confidence everywhere, fabrication nowhere** — every value wears its certainty. Estimates and validated truth sit side by side; the gap is visible and shrinking.
- **The right density for the right operator** — a novice making jelly doesn't see PCQI-grade regulatory walls; a master sees the full instrument. Regulatory rigor is *metered* to the operator's stage, never dumped.
- **Refusal-bearing gates that teach** — when an export is blocked (disease claim, missing identity test, undeclared allergen), the gate explains *why* and *how to fix it* — it makes the operator more capable, not just blocked.
- **Beautiful, droppable outputs** — every panel, label, and document is something the operator is proud to hand to a manufacturer, a buyer, or an FDA reviewer.
- **The wizard pattern** — guide without condescending; compose without overwhelming; let the master skip ahead and the novice be carried.

---

*Build it so that the formulator feels the two decades of hard-won knowledge baked into every screen — and so that the honest "we don't know yet" on a confidence chip is the thing competitors can never copy. No stone unturned.*
