# F&B Workspace Findings — 2026-05-22 Session Notes

**Surfaced:** 2026-05-22 (operator + Opus chat thread, post-Step-0.5a session)
**Logged:** 2026-05-23 (CC logging routine per operator + CC session-end discipline)
**Source:** Operator-surfaced findings during platform testing
**Scope classification:** Nutraceuticals workspace correctness pass (launch-blocking severity for Findings 1+2) + UX polish (Finding 3) + competitive feature audit (Finding 4)
**Resolution scheduling:** Between Step 1 schema migration completion and August 2026 MVP launch

---

## Finding 1 — Bulk paste mixed-unit conversion produces unformatted floating-point output

**Severity:** Launch-blocking (UX-blocking; erodes operator trust in computed output)
**Classification:** Nutraceuticals workspace correctness pass scope

### Reproduction context

Formula with multiple ingredients in lb plus a spice portion in g. After bulk paste, displayed values showed extended decimal expansion (example value observed: `0.32665431313546454`).

### Bug-class hypothesis

JavaScript floating-point arithmetic operating correctly at the math layer, but display layer lacks formatting/rounding (no `.toFixed()` or equivalent applied before render). Pattern matches classic JS float behavior (`0.1 + 0.2 = 0.30000000000000004`).

### Investigation scope

- Inspect `lib/parseFormula.ts` for unit-conversion logic
- Inspect display layer (SFP rendering, formulation builder, ingredient totals) for missing rounding
- Verify whether arithmetic itself is correct (148 g ≈ 0.32628 lb is roughly right magnitude — suggests display bug, not arithmetic bug)

### Fix hypothesis

Apply appropriate-precision rounding at display layer (3-4 decimal places for lb; 1-2 for g; context-appropriate precision per unit).

---

## Finding 2 — Nutritional Facts Panel accuracy against determinator outputs

**Severity:** Launch-blocking accuracy concern
**Classification:** Nutraceuticals workspace correctness pass scope
**Status:** Operator-instinct-flag; specific mismatch values pending follow-up

### Concern shape

SFP display values may drift from determinator-computed values; needs verification pass.

### Investigation scope

- Identify the data flow from determinator engine → SFP rendering
- Verify panel values match determinator outputs for representative entries
- Establish whether drift is per-entry or systematic

### Reproduction priority

Needs operator follow-up to surface specific drifts OR systematic audit pass.

---

## Finding 3 — Servings UI buttons clunky

**Severity:** UX polish (may upgrade to launch-blocking if operator workflow friction is significant)
**Classification:** Nutraceuticals workspace correctness pass scope OR launch polish scope (depends on follow-up specifics)
**Status:** Operator-instinct-flag; specific clunkiness shape pending follow-up

### Concern shape

Servings adjustment buttons feel clunky in operator use.

### Investigation scope

- Operator follow-up to specify shape (slow response / wrong increment / multiple-clicks / missing feedback / other)
- UX audit of servings-adjustment component

---

## Finding 4 — Recipal comparative efficiency

**Severity:** Competitive analysis (informs feature prioritization, not launch-blocking)
**Classification:** Competitive analysis scope; informs F&B / Acidified Foods workspace build prioritization
**Status:** Operator-instinct-flag; specific wins pending follow-up

### Concern shape

Operator tested platform against Recipal and found Recipal more efficient in multiple workflow dimensions.

### Investigation scope

- Operator follow-up to enumerate specific wins (faster ingredient entry / better autocomplete / different SFP flow / better unit handling / other)
- Competitive feature audit against Recipal for the identified workflow dimensions
- Prioritize workflow gaps that affect daily formulator velocity

---

## Notes on capture discipline

Findings 2-4 are operator-instinct-flags with pending specifics. Captured per capture-not-expand discipline: preserves the operator's surfaced concerns without overstating what's known; specifics fill in when reproducible.

Pattern matches Phase 2 PA verification queue stub discipline (`docs/pa-verification/2026-05-20-*.md`) — queue items with explicit "pending verification" framing rather than speculative content.

---

## Cross-references

- `docs/findings/2026-05-22-brand-name-usage-legal-review.md` — companion artifact from same operator session (separate scope: legal review vs UX/correctness)
- Memory: `reference_2026_05_22_operator_session_notes.md` — session-context pointer
- Memory: `feedback_unattended_cc_work_discipline.md` — capture-not-expand discipline applied to Findings 2-4
- Memory: `project_august_2026_mvp.md` — launch sequencing context
