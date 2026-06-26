# Unit-Class Caller Contract — what each engine does with `perServingAmounts`

**Date:** 2026-06-25 · companion to [perServingAmounts.ts](../../lib/perServingAmounts.ts). **This is the seam contract + the bench-test matrix for the F-3 build (steps 2–8).**

> The resolver returns `{ mg, unitClass, unit }` per ingredient: **mass** (mg computed), **count** (mg = 0, real), **unsupported** (mg = null, unknown). A resolver that's honest but a caller that silently mis-handles a class = the dark-provenance failure. So every consuming engine's behavior per class is fixed below. **Ceiling copy is operator-direct (state the fact + the action; no "coming soon").**

| Engine | `mass` | `count` (CFU) | `unsupported` (IU / typo) |
|---|---|---|---|
| **SFP renderer** | per-serving mg → apply potency × elemental × equiv → DV row | render the **count value** + `†` (no %DV) — *already shipped* | render the entered text + **"amount not computed — re-enter in mg/mcg/g"** |
| **Stability / overage** | mass projection | **exclude** + *"Count-based stability not computed — set overage from supplier shelf-life data."* | **exclude** + *"Unreadable amount — excluded; verify the entry."* |
| **Safety / UL** | UL check on mass × potency | **exclude** (no mass-UL for a count) | **exclude** + *"Unreadable amount — excluded from the UL check."* |
| **Cost** | $/g × mass | **exclude** + *"Count-based cost not computed — needs supplier per-CFU pricing."* | **exclude** + *"Unreadable amount — cost not computed."* |
| **Specs (pH / a_w / moisture)** | mass-weighted | **exclude** + footer *"N count-based ingredient(s) excluded — counts don't contribute mass."* | **exclude** + footer *"N ingredient(s) with unreadable amounts excluded."* |
| **Allergen / NDI / claims** | name-based | name-based | name-based — *unitClass-independent* (CC's earlier finding: these read the name, not the mass) |
| **Incomplete-formula flag** (Σ per-capsule vs. fill) | sum the mass | a count adds **0** to the mass-sum (safe) | **null can't sum** → flag *"N ingredient(s) have unreadable amounts — can't verify the formula fills the capsule. Fix the units, or re-enter in mg/mcg/g."* |

## The two load-bearing rules under the matrix
1. **`null` is excluded, never summed as 0.** Mass engines that aggregate (Σ for the fill check, formula total, cost) must drop `null` rows and **flag** them — summing null-as-zero silently absorbs an unparseable ingredient into the total (the F-10 silent-drop class).
2. **`count` (mg = 0) IS summed** (it genuinely adds no mass) **but never *rendered* as "0 mg of X"** — the dose-display routes on `unitClass: 'count'` to show the count, not the zero.

## Bench-test matrix (every cell is an assertion)
- A paste with one of each class → each engine behaves per its row above (mass computes; count excluded-with-ceiling or count-rendered; unsupported excluded-with-ceiling or recovery-prompted).
- **F-11 convergence:** the SFP path and the `perServingMgByName` (safety/stability/claims) path, both routed through `perServingAmounts`, produce **identical mass numbers** for every `mass` ingredient — no path divergence.

*This contract is referenced by the resolver docstring; steps 2–8 implement each caller against its row; the bench-test asserts each cell.*
