# Process Authority Verification Queue

This folder holds items that require Process Authority (PA) verification of regulatory citations, caps, denominator bases, or other authoritative regulatory values before they can ship in code.

## When does an item land here

CC surfaces a PA-verification-pending item when:

- A regulatory entry (e.g., `REGULATORY_LIMITS` in `lib/regulatoryLimits.ts`) needs a maxPercent / maxPpm value that CC cannot authoritatively assert from code-readable sources
- A citation needs PA confirmation (e.g., which specific CFR section + paragraph applies to a substance's use in a given product context)
- An applies-to-categories or prohibition scope requires PA judgment (e.g., does this substance's restriction apply to bacon specifically, or all cured meats?)
- A subtype-routing decision (contextualLimits) needs PA enumeration (e.g., bacon cure-method-specific nitrite caps)

The discipline is **"PA fills the blanks"** — CC does not pull values from training data and tag them as authoritative. Each queue file lists the fields PA needs to verify; PA returns verified values; CC implements with those values; CC archives the queue file (move to `verified/` subfolder).

## Workflow

```
CC surfaces pending item
  ↓
Operator routes item to PA
  ↓
PA returns verified values (citation, cap, scope, etc.)
  ↓
CC implements in code with verified values
  ↓
CC archives queue file (mv to verified/<date>-<name>.md)
  ↓
Optionally: tests verify the new entry routes correctly
```

## File structure per pending item

Filename convention: `YYYY-MM-DD-section-X-substance-name.md`

Body structure:

```markdown
# [Substance Name] — PA Verification Pending

**Queued:** YYYY-MM-DD
**Round / Section:** Round N Section X
**Status:** PENDING

## What's Needed from PA

[List of fields PA needs to verify — bullet points with each field
named, no placeholder values]

## Where This Lands Once Verified

[Specific file path + structural location in code; what the entry
shape looks like once PA-verified values fill in]

## Open Questions for PA

[Specific edge cases, subtypes, scope questions PA should clarify]
```

## Related queues

This folder is for **regulatory** verification (citations, caps, scope). Two adjacent queues track different categories:

- **Supplier-spec verification queue** — supplier COA / lab measurement of ingredient properties (Iron Bisglycinate Fe%, L. acidophilus NCFM CFU, etc.). Tracked in operator memory: `project_phase_2_verification_queue.md`.
- **Strain/SKU licensing verification queue** — B2B commercial licensing for proprietary strains (L. paracasei F19 Probi standalone, etc.). Tracked in operator memory: `project_licensing_verification_queue.md`.

Keep them separate — different verification authorities (PA vs supplier vs licensor), different unblocks (regulatory citation vs commercial doc vs B2B contract).

## Round 10 Section 3c context

Section 3c (new regulated-substance entries in Round 10) is the first round to populate this queue at scale. Four substances + an open-ended e-numbers enumeration require PA-verified values before they can be added to `REGULATORY_LIMITS`. Section 3c does NOT ship in Round 10 unless PA returns values in time; the directive accommodates this — Section 3d (Bucket A enforcement gate) is composable over whatever entries exist in `REGULATORY_LIMITS` and lands independently. Round 10 ships with the current 18 entries + the 3b.1/3b.2 corrections; Section 3c lands when PA verification completes.
