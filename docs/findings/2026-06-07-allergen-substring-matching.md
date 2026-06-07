# Allergen Engine — Substring Keyword Matching (HARM-CRITICAL, needs careful pass)

**Found:** 2026-06-07 (CC-direct substring-landmine hunt). **Status:** ROUTED — NOT a quick fix. Needs a dedicated pass + comprehensive tests + Opus eyes (FALCPA surface).
**File:** `lib/supplementAllergen.ts`, `detectAllergensDetailed()` — 6 raw `lower.includes(keyword)` sites (lines ~323, 350, 377, 412 for Tree Nut / Fish / Shellfish / Mollusk species; ~438 for non-species Milk/Egg/Soy/Wheat/Peanut/Sesame).

## Why this is NOT the same mechanical fix as claims/stability
The claims + stability fixes (commit 374d583) routed substring matches through the word-boundary `keywordMatch()`. **That naive swap is WRONG here, in both directions:**

**Current bug — false POSITIVES (over-declaration):**
- `'cod'` (fish species) `.includes` → **`codonopsis`** (a botanical) → false Fish allergen.
- `'milk'` (non-species) `.includes` → **`milk thistle`** (a botanical) → false Milk/dairy allergen.
- Possibly `'sole'` → supplier strings (e.g. "Ixoreal (sole)"), `'egg'` → `eggplant`.
- Over-declaration is the "safer" consumer direction but is itself a **FALCPA truth-in-labeling violation** (declaring an allergen not present) — the both-directions concern the operator raised on RBD oils.

**Why a plain `keywordMatch()` swap would introduce false NEGATIVES (recall-grade):**
- `keywordMatch('buttermilk', 'milk')` → **FALSE** (milk is embedded mid-word, no word-start boundary) → **buttermilk loses its Milk flag.** That's an under-declaration = recall risk. `.includes` currently catches it.
- And boundary matching does **not** even fix `milk thistle` — `'milk'` is at a word start there, so `keywordMatch` still false-positives it.

So boundary-matching alone is insufficient *both* ways: it drops real compound allergens AND keeps the milk-thistle false friend.

## What the correct fix needs (all three)
1. **Word boundary** to kill mid-word false positives (`cod`→codonopsis, `egg`→eggplant).
2. **Compound-allergen inclusion** so real compounds aren't missed (buttermilk, skim milk, milk powder, egg white/yolk, soy lecithin, wheat germ, etc.) — likely an explicit allergen-term list per category rather than single short keywords.
3. **Known-false-friend exception list** — `milk thistle` ≠ Milk, `codonopsis` ≠ Fish, `coconut` (FDA lists as tree nut, but contested), `nutmeg`/`water chestnut`/`shea` (named "nut" but not FALCPA tree nuts), `cocoa butter`, `tree nut`-named non-nuts. These are semantic, not boundary, decisions.

## Direction / severity
- Current: over-declaration (FALCPA mislabeling) — medium.
- Risk in fixing: a botched fix introduces recall-grade under-declaration — high. **Therefore the fix is harm-critical and must ship with exhaustive "every real allergen in the catalog still detected" coverage**, not a mechanical swap.

## Recommended handling
Dedicated pass: (a) enumerate the real allergen terms per FALCPA Big-9 category (incl. compounds) from the actual catalog; (b) build a matcher = boundary + compound-term list + false-friend exclusions; (c) test EVERY allergen-bearing catalog ingredient still flags + the documented false friends no longer flag; (d) Opus eyes before merge (company-ending-adjacent — a missed allergen is a recall). Until then, the **over-declaration is the safer interim state** (warns extra rather than missing) — so this is not an emergency, but it is launch-relevant for the "everything works before clients see it" bar.

Related: [[project_substring_keyword_matching_bug_class]], [[feedback_generation_safety_and_strategic_verification]] (harm-critical = CC's careful hands), `docs/findings/` allergen-rendering roadmap.
