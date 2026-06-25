# Catalog-Provenance Render Consolidation — Plan (consolidate-and-guard, instance #2)

**Date:** 2026-06-25 · **Status:** design-stage, for Wizard lock (with the count-mass plan). **No code yet.**
**Template:** follows [count-aware-mass-consolidation-plan](count-aware-mass-consolidation-plan-2026-06-25.md) §1–8. This is the **second instance** proving the consolidate-and-guard template reuses.

> **The live evidence (grounded this session):** click Lactobacillus's provenance chip → *"allergens: unknown — pending COA"* (honest). Read the allergen statement two inches away → *"Contains: Milk"* (inline assertion). The honest data is visible-on-click but the **load-bearing render bypasses it.** That contradiction is the canonical bench-test case.

---

## §1. Class identification
**Class = a harm-critical field (allergen / NDI status / safety flag) *rendered from the inline catalog array* when `PROVENANCE_BY_NAME` carries substance-level truth for it.** Distinct from:
- **Name-based detection** (`detectAllergensDetailed`, e.g., "Whey"→Milk): **honest** — the name *is* the evidence. **Keep.** Not in scope.
- **The provenance chip** ([page.tsx:5462](app/workspace/page.tsx#L5462)): **already** reads `PROVENANCE_BY_NAME`. Correct. The proof the pipe works.

So the target is narrow: **inline-array assertions** (`item.allergens: ['Milk']`) that contradict an honest provenance entry.

## §2. Single source of truth
**`PROVENANCE_BY_NAME` (`lib/data/supplementProvenance.ts`)** — already consumed by the chip; the pipe exists. The consolidation **routes the harm-critical *render* through it too**, not "builds the pipe."

**Precedence rule (lock this): A — provenance wins where it exists.** If `PROVENANCE_BY_NAME[name].allergens.kind === 'unknown'`, the inline `['Milk']` is **downgraded to "pending COA"** at render. Where provenance is absent (the ~300 uncovered entries), inline is the fallback (until coverage extends). Name-detected allergens (Class-distinct, honest) render independently.

## §3. Consumption-site inventory (the render sites that read inline harm-critical)
| Site | What it renders | Today | After |
|---|---|---|---|
| page.tsx **~1242-1259** | **allergen statement builder** (`item.allergens?.forEach`) | asserts inline `['Milk']` | defer: provenance-unknown → "pending COA" |
| page.tsx **3568 / 3752-3755** | saved-formula / version allergen aggregation (`flatMap i.allergens`) | inline | defer (same rule) |
| page.tsx **3495** | per-row allergen chips | inline | defer |
| (NDI render) | NDI status display | inline `ndiStatus` *(verify site)* | defer where provenance has NDI |
| page.tsx **5462** | provenance chip | ✅ reads provenance | (correct — the model) |

*(Exact NDI/harm-critical-flag render sites to be enumerated in the build's read-pass — same shape as the count-mass §3 inventory.)*

## §4. Replacement plan
A small **`resolveHarmCritical(name, field, inlineValue)`** accessor: returns the provenance value where `PROVENANCE_BY_NAME[name][field]` exists (incl. `kind:'unknown'` → a "pending COA" sentinel), else the inline fallback. Render sites call it instead of reading `item.allergens` directly.
**Carve-out:** `supplementProvenance.ts` + `supplements.ts` are `lib/data/*` carve-outs — but this consolidation **edits render code (page.tsx, not carve-out)** + adds the accessor (`lib/` non-carve-out). No catalog-data edits → no carve-out approval for the wiring. (Extending *coverage* 100→401 later *does* touch `supplementProvenance.ts` — separate, approval-gated.)

## §5. Structural guard
Grep-test fails CI if a harm-critical render reads `\.allergens` / `\.ndiStatus` / harm-critical flags **without** routing through `resolveHarmCritical`. Allow-list: the chip (correct), `detectAllergensDetailed` name-detection (honest), genuine fallback-when-provenance-absent paths — each with a rationale comment; additions reviewed (carve-out discipline).

## §6. Negatives verified
- **Name-based detection** (`detectAllergensDetailed`) — honest (name-evident); keep, not routed.
- **The provenance chip** — already correct.
- **Class B/C from count-mass** — unrelated (mass, not provenance).

## §7. Honest-engine ceiling
When provenance returns `allergens: {kind:'unknown', reason:'pending COA'}`, render at the workspace surface: **"Allergens: pending supplier COA verification"** — *not* "Contains: Milk" (false assertion) and *not* "No allergens" (false safety). The harm-critical floor doctrine, applied: an unverified allergen is UNDOCUMENTED, surfaced honestly, both directions.

## §8. Template applicability (instance #2 confirms the shape)
Same seven steps as count-mass: class-identify → source-of-truth → site-inventory → replace (accessor) → grep-guard → verify-negatives → honest-ceiling. **The template holds at the second application** — different layer (catalog-render vs. mass-compute), same shape. Next instances (UNDOCUMENTED-render, export-egress) follow.

---

## Scope ceiling (honest)
This wires the **top-100** provenance into the harm-critical render — closing the over-assertion class **for the covered entries immediately** (incl. Lactobacillus). It does **not**: (a) extend coverage to the ~300 uncovered entries (separate agentic run, approval-gated — *those still render inline until covered*), nor (b) build F3 per-lot COA intake (post-August). So: **the contradiction resolves for the top-100; uncovered entries stay inline-fallback + honestly flagged as such.**

## Bench-test (shared with count-mass — same probiotic paste)
Lactobacillus allergen statement renders **"Allergens: pending supplier COA verification"** instead of "Contains: Milk" — the chip and the statement now *agree*. The probiotic paste validates **both** consolidations at once.

*Lock §2 (precedence rule A) + §5 (guard scope) + §7 (ceiling copy) alongside the count-mass plan; I build count-mass first, this second.*
