# Ingredient Statement (#2) — 21 CFR 101.36(d) / 101.4(g) Registry + Resolution

**Date:** 2026-06-08 · **Auditor:** CC (authority-anchor §8 step 3; artifact #2).
**Carve-out routed → resolved (b) refined** by Opus: sector-aware, source-declaration-conditional rendering.
**Citations verified against primary source** (Cornell LII / CFR) before finalizing — per the 101.9-vs-101.36 lesson.

---

## Verified citations
- **21 CFR 101.36(d)** — the source-declaration CHOICE. Source ingredient *"**may** be identified within the nutrition label in parentheses…"*; when not, *"it **shall** be listed in an ingredient statement in accordance with **§ 101.4(g)**, which shall appear outside and immediately below the nutrition label."* Either/or — **never both** (the duplicate-dietary-active pattern is misbranding-relevant).
- **§ 101.4(g)** — dietary-supplement ingredient-statement format (when sources declared there).
- **§ 101.4** (generally) — full descending-weight ingredient statement = the FOOD (NFP) structure.
- Nuance (101.36(d)): source parens unnecessary when the dietary-ingredient name IS the source (e.g., "ascorbic acid").

---

## The finding (pre-fix)
In **supplements mode**, the workspace rendered the full food-style "Ingredients:" box (all dietary actives + excipients) **in addition to** the SFP (which already declares those actives via "(as …)" parens). Dietary actives were declared **twice** — the 101.36(d) either/or violated.

## Rendering matrix (resolution)
| Mode | Source choice | SFP source parens | "Other Ingredients" line | Full ingredient statement |
|---|---|---|---|---|
| Supplements | **sfp** (default) | YES | YES (excipients) | **NO** |
| Supplements | statement | **NO** | NO | YES (actives + excipients, sources) |
| F&B (Q4) | n/a (101.4) | n/a | n/a | YES (101.4) |

Default supplements = sources-in-SFP + "Other Ingredients" only (the standard commercial pattern). No double declaration in any mode.

---

## Implementation (this commit)
- `buildSupplementFacts({ omitSourceParens })` — drops the SFP "(as source)" parens when sources move to the statement (`lib/supplementLabeling.ts`). `// REGULATION: 101.36(d)`.
- Per-product config `suppSourceDeclaration: 'sfp' | 'statement'` (default `'sfp'`) + operator `<select>` toggle below the SFP header (supplements only).
- Render gates (`app/workspace/page.tsx`): full statement box renders when `mode !== 'supplements' || choice === 'statement'`; "Other Ingredients" line renders when `choice === 'sfp'`.
- Extends `sector_is_structural` → source-declaration is a per-PRODUCT structural choice *within* the supplements sector (not just per-sector).

## Harness (gate)
`harness-sfp-august-golden.test.ts` → "#2 source-declaration": mode 1 SFP row carries "(as …Glycinate)" parens; mode 2 SFP row drops them (`displayName === 'Magnesium'`). Data-level (no double declaration). The render gates are page.tsx + screenshot-sampled. F&B (mode 3) = existing 101.4 path. 1255 pass.

**Source:** [Cornell LII 21 CFR 101.36](https://www.law.cornell.edu/cfr/text/21/101.36) (§(d) source-declaration choice + §101.4(g) reference).
