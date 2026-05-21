# Phase 2 Verification Queue

This folder holds Phase 2 verification queue items — verification work that exceeds catalog-hygiene capacity at Step 0.5 and requires authority outside the operator's immediate evidence. Two primary verification dimensions:

1. **Regulatory verification (PA's domain)** — questions requiring Process Authority judgment on regulatory framing, claim substantiation, ingredient eligibility, compliance interpretation.

2. **Supplier-spec verification (supplier-COA-driven)** — questions requiring upstream supplier evidence (COA, technical data sheet, manufacturer disambiguation) to resolve catalog identity, allergen accuracy, form/standardization, manufacturer-tier attribution.

Mixed-resolution items (touching both dimensions) land here regardless of which dimension is load-bearing; the file's "Where This Lands Once Verified" section captures the per-item resolution path.

Folder name historical note: originally `pa-verification/` (Process Authority focus). Scope broadened 2026-05-20 via Q-Audit-1 routing — folder name retained for path-stability; scope per this README is authoritative.

## When does an item land here

### Regulatory verification (PA's domain)

CC surfaces a PA-verification-pending item when:

- A regulatory entry (e.g., `REGULATORY_LIMITS` in `lib/regulatoryLimits.ts`) needs a maxPercent / maxPpm value that CC cannot authoritatively assert from code-readable sources
- A citation needs PA confirmation (e.g., which specific CFR section + paragraph applies to a substance's use in a given product context)
- An applies-to-categories or prohibition scope requires PA judgment (e.g., does this substance's restriction apply to bacon specifically, or all cured meats?)
- A subtype-routing decision (contextualLimits) needs PA enumeration (e.g., bacon cure-method-specific nitrite caps)
- NDI / GRAS / pre-DSHEA classification questions require PA judgment

### Supplier-spec verification (supplier-COA-driven)

CC surfaces a supplier-spec verification item when:

- Two catalog entries reference the same substance but disagree on a substantive attribute (allergens, potency factor, form/carrier) without supplier-COA evidence available to disambiguate
- Supplier-set composition mixes raw-ingredient manufacturers with finished-product consumer brands or distributors (manufacturer/vendor confusion pattern; Round 12 Step 1 architectural lock at `docs/architecture/cost-and-vendor-architecture.md` is the resolution path)
- Branded form identity needs supplier confirmation (e.g., is Bergstrom OptiMSM the same product when listed at two different price points?)
- Cost or spec data shows anomalies (cost inversion, outside-typical-tier-pair spread, missing potencyFactor where chemistry requires it)
- Tier-attribution (Pharmaceutical-Grade vs Commodity Sourcing) requires supplier-COA evidence per §II.9a Refinement 5 evidence-strength bar

The discipline is **"PA fills the blanks"** for regulatory items, **"supplier-COA fills the blanks"** for supplier-spec items. CC does not pull values from training data and tag them as authoritative. Each queue file lists the fields the verification authority needs to verify; the authority returns verified values; CC implements with those values; CC archives the queue file (move to `verified/` subfolder).

## Workflow

```
CC surfaces pending item
  ↓
Operator routes item to PA OR requests supplier-COA
  ↓
Authority returns verified values (citation, cap, scope, COA fields, etc.)
  ↓
CC implements in code with verified values
  ↓
CC archives queue file (mv to verified/<date>-<name>.md)
  ↓
Optionally: tests verify the new entry routes correctly
```

## File structure per pending item

Filename convention: `YYYY-MM-DD-substance-or-scope-name.md`

Body structure:

```markdown
# [Substance / Scope Name] — [Verification Type] Pending

**Queued:** YYYY-MM-DD
**Round / Section:** Round N Section X (or routing-session reference, e.g., "Q-Audit-1 routing")
**Status:** PENDING

## What's Needed from PA / Supplier-COA

[List of fields the verification authority needs to verify — bullet points
with each field named, no placeholder values; explicit about which
dimension (regulatory vs supplier-spec) applies per item]

## Where This Lands Once Verified

[Specific file path + structural location in code; what the entry
shape looks like once verified values fill in; multi-path framings
acceptable for mixed-resolution items]

## Open Questions for PA / Supplier-COA

[Specific edge cases, subtypes, scope questions the authority should clarify]

## Context

[Surfacing event reference; Step 0.5 / Step 1 / round-disposition context;
any cross-references to architectural decisions or prior queue items]
```

## Related queues

- **Strain/SKU licensing verification queue** — B2B commercial licensing for proprietary strains (L. paracasei F19 Probi standalone, etc.). Tracked in operator memory: `project_licensing_verification_queue.md`. Separate from Phase 2 verification queue because licensing is a commercial-contract dimension distinct from PA-regulatory or supplier-COA-spec evidence.

(Note: pre-2026-05-20 README listed "supplier-spec verification queue" as a separate adjacent queue tracked in operator memory `project_phase_2_verification_queue.md`. Per scope broadening 2026-05-20, supplier-spec verification queue items now live in this folder; memory file retained as lightweight tracking pointer but heavier queue files surface here.)

## Historical context

### Round 10 Section 3c (regulatory verification)

Section 3c (new regulated-substance entries in Round 10) was the first round to populate this queue at scale. Four substances + an open-ended e-numbers enumeration required PA-verified values before they could be added to `REGULATORY_LIMITS`. Section 3c did NOT ship in Round 10 unless PA returned values in time; the directive accommodated this — Section 3d (Bucket A enforcement gate) was composable over whatever entries existed in `REGULATORY_LIMITS` and landed independently. Round 10 shipped with the current 18 entries + the 3b.1/3b.2 corrections; Section 3c landed when PA verification completed.

### Round 12 Q-Audit-1 routing (supplier-spec verification scope broadening, 2026-05-20)

Q-Audit-1 per-pair routing surfaced 6 substance-disambiguation queue items plus 16 tier-pair verification items (Bucket 3 + Pattern 1 batches). These items are supplier-spec verification (supplier-COA evidence required) rather than PA-regulatory verification, but they fit the same Phase 2 verification queue workflow. Folder scope broadened to accommodate; queue items land at `2026-05-20-*-disambiguation.md` and `2026-05-20-*-verifications.md` paths. See `docs/audits/q-audit-1-final-routing.md` Section 9 for the full Q-Audit-1 queue item enumeration.
