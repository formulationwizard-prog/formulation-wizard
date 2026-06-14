# Q4 F&B-Free Readiness Checklist (and the template for every sector launch)

**Created 2026-06-14.** Surfaced by the 2026-06-14 audit of "can F&B free ship in August?" → **no, defer to Q4.** This is the explicit gate list so Q4 doesn't drift, and it doubles as the **per-sector launch template**: F&B → pet/livestock → baked goods → charcuterie each clear *this same bar* before any free tier ships in that sector.

**Governing doctrine (`feedback_correctness_bar_universal`, pricing-model §2):** *"Free lowers the price, not the correctness bar"* + *"sector expansion is gated on the verified-engine-bar."* A free label is a regulated output (e.g. NFP per 21 CFR 101.9); shipping it wrong is public misbranding under a trust-positioned brand. The platform plumbing reuses (mode-config = config, not rewrite); the per-sector correctness work does not.

---

## Why August was a NO for F&B (the audit findings)
The F&B free-tier "just labels" is the Q4 F&B scope in disguise. Against the five gates, as of 2026-06-14:
- **Harness:** this session hardened SFP/101.36 (supplements). **No F&B NFP (101.9) / Atwater golden harness exists** — the NFP path has no regression net.
- **Catalog/data:** F&B chemistry is largely `ai-estimate` / `unverified` (`foodScience.ts`), not COA/USDA-anchored.
- **Engine bugs:** logged-not-fixed F&B NFP issues (NFP math, density fl-oz≡oz, float-display) — deferred, not verified-fixed, not regression-protected.
- **`/start`:** doesn't exist yet; spec'd Nutraceuticals-only.
- **Mode-aware UI:** partial (cross-mode leaks unfiltered).

Shipping F&B free in August = either do all this now (blows the Nutraceuticals MVP) or ship unverified regulated labels (breaks the floor). Neither acceptable. Q4 is the right, disciplined call.

---

## The gates (each must pass before F&B free ships)

### Gate 1 — F&B nutrition harness, to the supplements bar
- [ ] NFP (21 CFR 101.9) golden harness — golden formulas × input states, two independent derivations (engine-computed + hand-derived), per build-spec §5.
- [ ] Atwater calorie computation verified against canonical cases.
- [ ] FDA-rounding (101.9) coverage for the NFP path (101.9 rounding ≠ 101.36).
- [ ] Runs in CI, gates every change — same standing proof supplements has.

### Gate 2 — Logged F&B engine bugs fixed + regression-tested
- [ ] NFP/SFP math flaw (`project_nutrition_facts_math_broken_2026_05_23`) — fixed + golden case.
- [ ] Density fl-oz≡oz / volume→mass conversion (`project_density_floz_oz_bug`, serving-size-volume-parens directive) — fixed + golden case.
- [ ] Float-display launch-blocker (2026-05-22 Finding 1) — fixed + asserted.

### Gate 3 — F&B nutrition data to COA/USDA-anchored provenance
- [ ] Common SMB F&B ingredients carry verified nutrition values (the operator's Nutritional Calculator workbook is the canonical source — `project_nutritional_calculator_canonical_source_2026_05_24`; USDA FoodData Central as the public base for F&B, NOT for Nutra).
- [ ] Provenance field populated; no `ai-estimate`/`unverified` values shipped as if verified (COA-anchored doctrine).
- [ ] Coverage % target for the SMB long-tail set (define the bar).

### Gate 4 — `/start` sector routing
- [ ] `/start` supports sector selection (or "what are you making?") and routes to the right first-formula (NFP for F&B, SFP for Nutra).
- [ ] The catch-as-save + save-as-conversion path works in F&B mode.

### Gate 5 — Mode-aware UI complete for F&B
- [ ] Recent Activity / Top Ingredients / Saved filter by current sector (the #17 `sector` column is deployed; the UI filter is the remainder).
- [ ] Sector-aware copy, examples, suggested next steps.
- [ ] **Acidified-foods boundary:** a vinegar/acid-based sauce triggers the appropriate honest warning (LIKELY ACIDIFIED FOOD / Process-Authority routing) **without blocking the free label flow** — the warning informs, it doesn't gate the basic label.

---

## The free-tier cut for F&B (matches the pricing model)
- **Always free, unlimited:** NFP + ingredient statement + allergen statement (FALCPA Top-9).
- **Walled "Coming / paid":** Master Specs, COA, batch records, multi-role, acidified-foods PA filing, inventory.

## Strategic upside (why it's worth doing right at Q4)
Captures the ReciPal/farmers-market segment; larger SMB data-moat volume than Nutraceuticals; F&B brand awareness from Q4; `/start` becomes cross-sector. All real — *earned by clearing the bar, not by shipping early.*

## Reuse note (the going-vertical plan)
Pet/livestock (feeds), baked goods (baking), charcuterie (sausage) are scaffolded in `lib/modes.ts`. Each goes live by clearing **this same five-gate checklist** for its own NFP/reg-path + catalog + harness. The platform is the reuse; the verification is the per-sector work. This checklist is that template.
