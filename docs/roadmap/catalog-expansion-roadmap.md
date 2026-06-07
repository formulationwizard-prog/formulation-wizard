# Catalog Expansion — Consolidated Roadmap (single tracked surface)

**Created:** 2026-06-07 · **Owner:** CC · **Status:** active tracking surface
Consolidates all catalog-breadth expansion into one place so it stops fragmenting across sessions.

---

## Why #1 is now a launch-blocker (the Convention-B consequence)

Convention B (recipe-ratio) was locked 2026-06-07: **the entire capsule fill IS the recipe.** That makes the implicit-excipient gap — invisible under Convention A — a *required, explicit* line item:

- To hold actives at their intended dose **and** fill a real capsule, the excipient must be entered so **formula mass = fill mass**. (200 mg L-Theanine in a 660 mg cap ⇒ 200/660 = 30% active + 460 mg declared fill = 70%. Without the fill line, either the actives scale up wrong, or the capsule is unrealistically underfilled.)
- This is *more honest* than Convention A (the label now declares what's actually in the capsule) — but only buildable if the **"Add Ingredient" search surfaces excipients.**
- Without it, the pilot walkthrough dead-ends on "ingredient not in catalog" for microcrystalline cellulose, magnesium stearate, silicon dioxide, dicalcium phosphate, etc. — and operators **cannot complete a real formula.**

→ The excipients catalog is the **enabler of Convention B's honesty.** Pre-pilot prerequisite, not a Q4 nice-to-have.

---

## Tracked items

### 1. Capsule excipients / mediums — **PRE-PILOT PREREQUISITE** ⚠️
- Six functional buckets, clean-label flags. Seed list already drafted: `docs/catalog/capsule-excipients-seed-list-2026-05-29.md`.
- Must surface in "Add Ingredient" search so operators complete fills under Convention B.
- **Target: Week 4 of the locked sequence, before the pilot operator walkthrough.**
- Each entry follows the Catalog Authoring Rulebook + harm-critical floor (allergens/interactions UNDOCUMENTED until verified) + COA-anchored doctrine.

### 2. Other formulator categories — sector-aware expansion
- Binders, disintegrants, lubricants, glidants, coatings, colorants, flavorings, sweeteners, preservatives.
- Follows #1; same authoring discipline. Sequenced as formulator workflows demand them.

### 3. DSLD ingestion (Tier-2 bulk) — Q4 2026
- NIH DSLD, ~200k CC0 labels (see memory `reference_nih_supplement_databases`).
- **Label-as-declared → Tier 2, explicitly tagged, never a verification source** (COA-anchored doctrine).
- Hard engineering: name normalization (many brand variants per ingredient), dedup, quality filtering, provenance tagging. Re-confirm CC0 license + API terms at ingestion time.
- Alongside F&B catalog work.

### 4. Sector-specific expansions — per vertical
- F&B (Q4), baked goods, pet food, etc. Each adds its own ingredient set via the mode-config architecture (`lib/modes.ts`) — config, not rewrite. See sector-expansion roadmap.

---

## Sequencing summary

| Item | When | Gate |
|---|---|---|
| 1. Capsule excipients | **Week 4 (pre-pilot)** | Convention-B blocker |
| 2. Other formulator categories | Post-pilot, workflow-driven | — |
| 3. DSLD Tier-2 bulk | Q4 2026 | license re-confirm + normalization eng |
| 4. Sector-specific | Per vertical launch | mode-config |

Related: Convention B (`lib/supplementMath.ts`), serving/dose engine (`lib/servingDoseEngine.ts`), `reference_nih_supplement_databases`, sector-expansion roadmap.
