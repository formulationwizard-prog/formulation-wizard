# 0.5c.iii Bromelain — Grep-verification Directive

**Author:** Opus track, 2026-05-23
**Status:** Queued for CC execution (next session or end of current session if 0.5c.i closes with capacity)
**Type:** Read-only verification; no catalog edits, no commits

**Provisional finding (pre-flight 2026-05-23, before directive executed):** [`docs/audits/q-audit-1-final-routing.md`](q-audit-1-final-routing.md) line 366 explicitly records "Bromelain consolidation (Enzymes survivor) | folded into B2.4 in 0.5a" + line 376 "0.5a + 0.5c.iii (Bromelain) ship together — consolidation work". Strong prior that Finding A (fully restructured in B2.4) is the expected outcome when this directive runs. Execution still useful for ground-truth verification (intent ≠ execution outcome).

---

## Question

Was Bromelain restructured to current convention (form-first canonical name, Enzymes category, tier attribution if applicable) during Step 0.5a Bucket 2 B2.4 work?

---

## Procedure

1. **Identify B2.4 commit(s).** Source: 0.5a closure artifact in `docs/audits/` if one exists, or `git log --all --grep="B2.4"`. If B2.4 doesn't map to a specific commit, fall back to scanning all 0.5a commits.
2. **Grep B2.4 commit diff(s)** for `[Bb]romelain`. Note what changed (name / category / fields) and what didn't.
3. **Read current Bromelain entry/entries** in `lib/data/supplements.ts`. Capture: display name structure (form-first canonical?), category (Enzymes vs. Antioxidants vs. Specialty), tier attribution if applicable, supplier reference.
4. **Reconcile.**

---

## Decision tree (surface findings; do not act on them)

| Finding | Surface as | Routing |
|---------|------------|---------|
| **A — fully restructured in B2.4** | "Bromelain verified restructured in B2.4 [commit SHA]. 0.5c.iii closes with no action." | Operator decides closure marking. |
| **B — not restructured, still pre-canonical** | "Bromelain not restructured. Current state: [name / category / fields]. Restructure scope needed." | Route to Opus for scope authorship. |
| **C — partial / ambiguous** | Surface specifics. | Route to Opus for routing decision. |

---

## Hard scope guardrails

- No edits to `lib/data/supplements.ts` regardless of finding
- No category changes
- No commits
- Surface findings only

---

## §IV.22 wave-sizing note

If Finding B surfaces and restructure becomes a real execution task, §IV.22 applies — top-3 predictability companions in `stacks.ts` get evaluated and any missing added in the same commit. Flagging now so a later-session CC doesn't scope Bromelain in isolation. Opus will author full restructure scope if/when needed.

---

## Findings (executed 2026-05-23)

**Verdict: Finding C — partial.** B2.4 (commit `775e323`) executed the consolidation cleanly. The display name was never restructured to form-first canonical convention; that work is owed but was never explicitly scoped to B2.4.

### Step 1 — B2.4 commit identification

**Commit `775e323`** — Step 0.5a Bucket 2 same-SKU consolidations (2026-05-22). Commit message explicitly records:

> "B2.4 Bromelain cross-category consolidation: 1 deletion of Bromelain Antioxidants duplicate, survivor at line 85 in Enzymes per §III.18 primary-mechanism-wins, supplier-set union adds Sabinsa + Enzyme Development Corporation — now 5-supplier entry"

No 0.5a closure artifact in `docs/audits/` (Glob `docs/audits/*0-5a*` returned no files). `git log --all --grep="0\.5a"` surfaced 4 Step 0.5a commits: `0ae72ab` (Bucket 1 partial), `775e323` (Bucket 2 — Bromelain), `5d5ec62` (B4.3.x), `3edb088` (B1.1 CDP-Choline closure).

### Step 2 — B2.4 diff inspection for Bromelain

Pre-B2.4 state (from `git show 775e323 -- lib/data/supplements.ts | grep -i bromelain`):

**Entry 1 (kept, supplier-union'd):**
- Name: `'Bromelain (GDU/g 2,400, from Pineapple)'`
- Category: `'Enzymes'`
- Suppliers (pre): 3 — Enzymatic Deutschland (Brom-mine), Specialty Enzymes, Deerland Enzymes
- Suppliers (post): 5 — added Sabinsa + Enzyme Development Corporation

**Entry 2 (DELETED):**
- Name: `'Bromelain (Pineapple, 2400 GDU/g)'`
- Category: `'Antioxidants'`
- Suppliers: 2 — Sabinsa, Enzyme Development Corporation

B2.4 actions: deleted the Antioxidants duplicate; union'd supplier sets onto the Enzymes survivor. Display name, GDU/g spec, category, allergens, cost — all preserved on survivor (no name restructuring).

### Step 3 — Current Bromelain state in `lib/data/supplements.ts` (post-commit `fcde45e`)

- **Line 83:** `'Bromelain (GDU/g 2,400, from Pineapple)'`, category `'Enzymes'`, **5 suppliers** (Enzymatic Deutschland (Brom-mine), Specialty Enzymes, Deerland Enzymes, Sabinsa, Enzyme Development Corporation) — MATCHES B2.4 post-state exactly.
- **Line 293:** Quercetin (USP, 95%) `notes` mentions "Often paired with bromelain or vitamin C" — narrative reference only, NOT a separate entry.
- **Line 468:** Quercetin Dihydrate (95%, Sophora japonica Source) `notes` mentions "combine with bromelain or use phytosome form for absorption" — narrative reference only, NOT a separate entry.

stacks.ts: 0 Bromelain references.

### Step 4 — Reconciliation against directive's "current convention" question

The directive asks whether Bromelain was restructured to "form-first canonical name, Enzymes category, tier attribution if applicable" during B2.4. Reconciling against §II.9a Refinements:

| Refinement | Applies? | Status |
|------------|----------|--------|
| **R1 — regulatory-baseline qualifier dropping** | N/A | No regulatory-baseline qualifier (USP/etc.) on this entry |
| **R2 — form-first canonical naming** | YES | **PARTIAL** — name has correct components (common name, standardization, source) but unconventional formatting: "GDU/g 2,400" should be "2,400 GDU/g" (number-then-unit per sibling enzymes lines 299/300/302 "10,000 DU/g" / "4000 FIP/g" / "3000 ALU/g"); "from Pineapple" uses preposition where sibling enzymes use direct descriptor (e.g., "Fungal") |
| **R3 — chemistry-form discipline** | YES | **PARTIAL** — "Pineapple" is general; bromelain is primarily from pineapple **stem** (vs fruit), and the deleted Antioxidants duplicate name was also "Pineapple" generic. Convention would name the organ. |
| **R4 — reserved** | N/A | — |
| **R5 — tier-attribution evidence-strength** | N/A | No tier-pair (B2.4 was cross-category consolidation, not tier-pair situation) |

**Category:** ✅ Enzymes (correctly placed per §III.18 primary-mechanism-wins; this part WAS restructured in B2.4 — the consolidation moved the cross-category duplicate's mass into the Enzymes survivor).

**Tier attribution:** N/A.

**Display name form-first canonical:** ❌ Owed.

### Verdict: Finding C — Partial

- B2.4 executed its **scoped work** (consolidation + supplier union + category coalescence) **fully and correctly**.
- B2.4 did **NOT** restructure the display name to convention — but the rename wasn't explicitly in B2.4's scope per the commit message (the §III.18 primary-mechanism-wins framing was about category, not name).
- The display name `'Bromelain (GDU/g 2,400, from Pineapple)'` carries minor §II.9a R2 + R3 deviations from canonical pattern.

### Recommended canonical name

Following the sibling enzyme pattern (`Amylase (Fungal, 10,000 DU/g)` / `Lactase (Fungal, 3000 ALU/g)`):

**`'Bromelain (Pineapple Stem, 2,400 GDU/g)'`**

This matches §II.9a R2 (form-first: source-then-standardization, no preposition) + R3 (chemistry-form: stem specified vs general pineapple). Same pattern as B4.2.2 Selenium yeast-bound rename + B4.8.1 Flaxseed cold-pressed rename.

### Routing recommendation

**Option (a) — Close 0.5c.iii as substantively complete; queue Bromelain rename for the Wave 1.5-era notes-prose audit pass** (the same pass that owns the M12 marketing-overload tokens per [`project_notes_prose_audit_owed.md`](../../../.claude/projects/c--Users-chefc-formulation-wizard-live/memory/project_notes_prose_audit_owed.md) — could expand scope to include name-discipline cleanups too). Pro: anti-proliferation; consistent with how SAMe-style standalone renames have been grouped. Con: name discipline ≠ notes-prose discipline; might warrant separate ticket.

**Option (b) — Close 0.5c.iii as substantively complete; queue Bromelain rename as a standalone §II.9a R2/R3 follow-up** alongside any other catalog entries surfaced with similar deviations. Pro: keeps name discipline scope distinct. Con: scope-of-one risks invisibility.

**Option (c) — Execute the Bromelain rename in this session.** ~5 min CC work: rename string + commit. Pro: closes 0.5c.iii cleanly with full restructure-to-convention. Con: expands scope beyond directive's read-only framing; would need operator OK.

**CC recommendation: Option (b)** — Bromelain rename queued as standalone, but the routing question naturally suggests scoping a catalog-wide §II.9a R2/R3 sweep (similar shape to the duplicate-SKU sweep) before per-entry execution. Operator picks.
