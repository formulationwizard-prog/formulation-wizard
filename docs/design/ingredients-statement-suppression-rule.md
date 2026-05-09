# Ingredients-statement single-sub-ingredient suppression rule

**Owner:** Round 8 Item 7 (supersedes Round 4 exact-match-only rule)
**Code:** `lib/ingredientStatement.ts` — `renderIngredientName()`

## Why this rule exists

Round 7 verification on the Pickling Salt / Pickling Spice Blend test
formulation surfaced a redundant-parens defect: `Pickling Salt (Salt)`. The
catalog correctly carries `Pickling Salt` with sub-ingredient list
`["Salt"]` (so the chemistry rollup gets the salt classification right),
but the consumer-facing ingredient statement repeated the head noun with
no disclosure benefit.

Round 4 (`7bd6ba2`) installed the **exact-match** suppression: parens are
suppressed only when the single sub-ingredient equals the stripped catalog
name verbatim. That handles `Honey (Industrial Grade) + [Honey] → Honey`
but leaves `Pickling Salt (Salt)` and `Sea Salt (Salt)` looking noisy.

This rule extends the suppression to the head-noun case while explicitly
preserving disclosure-relevant parentheticals.

## The rule (positive — when to SUPPRESS)

Suppress the parenthetical sub-ingredient list when:

1. The sub-ingredient list has **exactly one** entry, AND
2. That single sub-ingredient (after trimming, case-insensitive) is
   EITHER:
   - **(2a)** identical to the qualifier-stripped catalog name, OR
   - **(2b)** a **single word** that equals the **last word** of a
     **multi-word** qualifier-stripped catalog name.

## The rule (negative — when to RETAIN)

The parenthetical is retained (compound disclosure) when ANY of these
conditions hold:

- The sub-ingredient list has more than one entry.
  → Multi-component compounds always disclose. Example: `Smoked Salt
  (Salt, Smoke Flavor)`.
- The single sub-ingredient is **multi-word and not identical** to the
  catalog name.
  → A multi-word sub-ingredient signals a different physical form
  (`Vanilla` + `[Vanilla Extract]` → `Vanilla (Vanilla Extract)`) or
  a chemical/process disclosure that 21 CFR 101.4 favors retaining.
  Suppression rule (2b) deliberately fires only when the
  sub-ingredient is single-word.
- The single sub-ingredient is a different word from the catalog
  name's head noun.
  → Example: `Salt` + `[Sodium Chloride]` → `Salt (Sodium Chloride)`.
  The chemical-name disclosure may be 21 CFR 101.4-relevant even when
  chemically the same compound. Default to retention; if a future
  rule narrows this we surface it as a Round 9+ ticket.
- **Default to retention when ambiguous.** 21 CFR 101.4 generally
  favors more disclosure, not less. The suppression cases are limited
  to redundant noise.

## 21 CFR 101.4 compliance

- § 101.4(a)(1) requires the common or usual name.
- § 101.4(b) provides for parenthetical disclosure of sub-components in
  compound ingredients.
- The rule suppresses parens only when the single sub-component is a
  redundant repetition of the head noun (no information added).
- Round 4 compliance posture (compound disclosure when sub-list genuinely
  differs from the common name) is preserved verbatim.
- The conservative default — when the rule is ambiguous, retain parens —
  reflects the regulation's disclosure preference.

## Test matrix

| Catalog name | Sub-ingredients | Expected render | Branch |
|---|---|---|---|
| `Sea Salt` | `["Salt"]` | `Sea Salt` | suppress 2b |
| `Pickling Salt` | `["Salt"]` | `Pickling Salt` | suppress 2b |
| `Smoked Salt` | `["Salt", "Smoke Flavor"]` | `Smoked Salt (Salt, Smoke Flavor)` | retain (multi) |
| `Salt` | `["Sodium Chloride"]` | `Salt (Sodium Chloride)` | retain (different word) |
| `Vanilla` | `["Vanilla Extract"]` | `Vanilla (Vanilla Extract)` | retain (sub multi-word) |
| `Cucumber` | `["Cucumber"]` | `Cucumber` | suppress 2a |
| `Honey (Industrial Grade)` | `["Honey"]` | `Honey` | suppress 2a (qualifier stripped) |
| `Cold-Pressed Olive Oil` | `["Oil"]` | `Cold-Pressed Olive Oil` | suppress 2b |
| `Distilled White Vinegar (50 Grain / 5%)` | `["Diluted Acetic Acid"]` | `Distilled White Vinegar (Diluted Acetic Acid)` | retain (different word) |
| `Pickling Spice Blend (Mixed Whole)` | `["Mustard Seed", "Bay Leaves", ...]` | `Pickling Spice Blend (Mustard Seed, Bay Leaves, ...)` | retain (multi) |

## What this rule does NOT change

- Multi-component sub-ingredient lists always disclose. Round 4's behavior
  on these is preserved.
- Different-form disclosures (multi-word sub differing from the catalog
  name) are preserved.
- Different-word disclosures (chemical names, etc.) are preserved.
- The qualifier-strip preprocessor (Round 4) is unchanged.

## Open questions deferred

- **Chemical-name disclosure (test row 4):** "Salt + Sodium Chloride"
  retains parens by current rule. If a future regulatory analysis
  determines that chemical-name disclosure is conditional (e.g.,
  required for additives but not for table salt), update the rule
  with a per-pair allowlist. Surface as Round 9+ if it becomes a
  recurring pattern.
- **Hyphenated compound tokens:** the tokenization splits on whitespace
  only, so `Cold-Pressed Olive Oil + [Oil]` → suppresses (last token
  is "Oil"). If a future case shows hyphenated tokens shouldn't merge,
  refine the tokenizer.
