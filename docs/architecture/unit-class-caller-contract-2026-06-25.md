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
| **Producibility / fit** (Σ per-capsule vs. capsule capacity) | sum **physical** mass via `perCapsulePhysicalMassMg` (no potency — full carrier mass fills the shell) | count adds **0** | **excluded** (mass unknown) |

## Implementation status (2026-06-28)
- **`perServingActiveMgMap(ingredients, unitsPerServing)`** (lib/supplementLabeling.ts) is the single safety-map construction (physical mg × potency). **All four safety/stability/overage consumers route through it** — rule-sets safety, status-strip pills, the Safety/Stability/Overage cards, and the RA review packet (commits `7fb16fe` + Unit 2a). The pre-existing four hand-rolled copies (which carried fill-scaling + the `|| 1` grams-trap) are retired.
- **`perCapsulePhysicalMassMg(ingredients)`** feeds producibility: per-capsule fill = Σ(entered) directly (entered ARE per-capsule under F-3), `totalUnits: 1` — **never `÷ units`** (the retired per-serving-entry model understated fill and could greenlight an unbuildable capsule).
- **Cost / specs rows above are NOT yet routed** — cost de-scale is the named-deferred follow-on; specs is future.

## The two load-bearing rules under the matrix
1. **`null` is excluded, never summed as 0.** Mass engines that aggregate (Σ for the fill check, formula total, cost) must drop `null` rows and **flag** them — summing null-as-zero silently absorbs an unparseable ingredient into the total (the F-10 silent-drop class).
2. **`count` (mg = 0) IS summed** (it genuinely adds no mass) **but never *rendered* as "0 mg of X"** — the dose-display routes on `unitClass: 'count'` to show the count, not the zero.

## Bench-test matrix (every cell is an assertion)
- A paste with one of each class → each engine behaves per its row above (mass computes; count excluded-with-ceiling or count-rendered; unsupported excluded-with-ceiling or recovery-prompted).
- **F-11 convergence (FOUR-WAY, proven):** the SFP path and **all four** safety-map consumers route through `perServingAmounts` (via `perServingActiveMgMap`), producing **identical mass numbers** for every `mass` ingredient — cross-site identity is by construction (same call). Tested in `harness-sfp-august-golden.test.ts` (F-11 describe) + the §A producibility overfill regression.

## Export chokepoint — composed gates (Unit 2b, 2026-06-28)
`gateBeforeExport` (the single supplement export egress) composes TWO sibling gates; export refuses if **either** fires, refusal modal carries combined evidence:
- **`evaluateSupplementBucket1Gate`** — the Companion-Spec §B harm-critical **labeling floor** (CFR-anchored: allergen species-naming, disease-claim, identity-test, disclaimer, net-quantity, review-state).
- **`evaluateSafetyCompletenessGate`** (`lib/safetyCompletenessGate.ts`) — analysis-**completeness preconditions** (NOT a CFR floor; platform-defined). First precondition: **units-per-serving on count-based forms** — **scoped by doc type** to per-serving-rendering artifacts (`sfp-label`, `fvr-packet`); mfg/ingredient docs (`pds`, `raw-material-spec`, `batch-sheet`) are OUT of scope (firing on irrelevant docs would degrade the chokepoint signal → routine override, and the refusal copy would be dishonest for them). Refusal copy: *"Set units per serving in the Serving & Package Size section before export — the per-serving safety (UL) analysis and the Supplement Facts amounts cannot be computed without it."* No CFR cite (citing one would be confabulation). This closes the units-unset window the audit found: with units unset the safety map floors to per-capsule, so a multi-capsule per-serving UL violation could register below the Bucket-1 critical threshold and slip the chokepoint. Both gates carry the DO-NOT-WEAKEN docblock. **Completeness gates declare their relevant `docType` scope — distinct from §B's universal scope, which is correct because every §B floor item applies to any artifact representing the formulation.**

Producibility over/under-fill is a **non-blocking workspace** signal (the corrected `assessProducibility` tile, Unit 2a), NOT an export gate — it's a producibility judgment (operator may have reasons), surfaced with broadened remediation copy (add filler / smaller capsule / larger capsule / split serving).

*This contract is referenced by the resolver docstring; steps 2–8 implement each caller against its row; the bench-test asserts each cell.*
