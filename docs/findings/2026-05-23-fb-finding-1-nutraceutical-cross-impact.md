# F&B Finding 1 — Nutraceutical Cross-Impact Confirmation (2026-05-23)

**Surfaced:** 2026-05-23 (CC pre-flight investigation during Step 0.5c.i session, prompted by Opus track flag)
**Source:** [`docs/findings/2026-05-22-fb-workspace-findings.md`](2026-05-22-fb-workspace-findings.md) Finding 1 — Bulk paste mixed-unit conversion produces unformatted floating-point output
**Severity confirmed:** Launch-blocking for August 2026 Nutraceuticals MVP (cross-cuts both verticals)

---

## Hypothesis (from Opus track flag)

F&B Finding 1's bug location ([`lib/parseFormula.ts`](../../lib/parseFormula.ts)) is in shared engine code, meaning the float display bug affects Nutraceuticals too, not just F&B. If confirmed, Finding 1 jumps ahead of Step 0.5c sequencing in launch priority.

---

## Verification

**File header confirms shared-engine status:**

[`lib/parseFormula.ts:1`](../../lib/parseFormula.ts#L1):
> `// Bulk-paste formula parser`

The file is the bulk-paste formula parser shared across all six modes (F&B, Baking, Catering, Feeds, Sausage, Supplements) — see [`lib/modes.ts`](../../lib/modes.ts).

**Damning evidence — Round 11 Phase 3 Nutraceutical fix in the same file:**

[`lib/parseFormula.ts:71-78`](../../lib/parseFormula.ts#L71-L78):
> ```
> // Round 11 Phase 3 (2026-05-17): mg + mcg preserve to canonical unit
> // (previously mg coerced to g per F&B-era "will be small" heuristic;
> // breaks supplement formulator workflows where 500 mg ≠ 500 g —
> // 1000× error class). Phase 2 implementation-discovery finding #11.
> ```

Nutraceuticals already had one float/unit bug class fixed in this exact file (commit ~2026-05-17). The Finding 1 display-layer-rounding-gap is a sibling issue in the same shared infrastructure.

---

## Manifestation caveat

F&B reproduction was "lb + g mixed unit." Nutraceuticals typically operates in mg/mcg/g, not lb. The specific manifestation may not reproduce identically — but the underlying display-layer-lacks-rounding root cause is shared.

**Plausible Nutraceutical reproduction paths:**
- Bulk paste with mixed mg + mcg values
- Bulk paste with mixed g + mg values where conversion produces float artifacts
- Any unit conversion path that exercises the same display-layer code without explicit rounding

**Verification requires operator-driven Nutraceuticals bulk-paste reproduction** — CC cannot do this alone; needs operator at keyboard to construct realistic Nutraceutical paste scenarios and observe the float artifacts (or confirm absence).

---

## Recommended sequencing

**Option 1 — Scope dedicated Nutraceutical reproduction session.** ~30-60 min operator + CC. Construct 3-5 realistic Nutraceutical bulk-paste scenarios; observe behavior. If artifacts reproduce → confirms cross-impact; Finding 1 fix becomes August 2026 launch-blocking and jumps ahead of remaining 0.5c sub-tasks. If artifacts don't reproduce → likely F&B-specific manifestation; Finding 1 stays scoped to F&B post-MVP work (Q4 2026+).

**Option 2 — Defer reproduction; assume cross-impact, schedule fix proactively.** Treat the shared-engine evidence as sufficient prior; schedule Finding 1 fix into Step 1 schema migration sequencing (which already touches lib/ engine code). Higher confidence in launch-readiness; small risk of scope creep if reproduction would have proven no Nutraceutical manifestation.

**Option 3 — Defer entirely until Step 1.** Treat as F&B-specific until proven otherwise. Higher risk of August 2026 launch surprise.

**CC recommendation:** Option 1. ~30-60 min reproduction session is cheap relative to launch-readiness uncertainty. Schedule when operator has capacity adjacent to a Nutraceutical workspace session.

---

## Cross-references

- [`docs/findings/2026-05-22-fb-workspace-findings.md`](2026-05-22-fb-workspace-findings.md) — Original Finding 1 with F&B reproduction context
- [`lib/parseFormula.ts`](../../lib/parseFormula.ts) — Shared bulk-paste engine; Round 11 Phase 3 Nutraceutical fix at lines 71-78
- [`lib/modes.ts`](../../lib/modes.ts) — Mode registry confirming parseFormula is shared across all 6 modes
- CC memory `reference_2026_05_22_operator_session_notes.md` — Operator session context
