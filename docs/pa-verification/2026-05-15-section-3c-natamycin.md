# Natamycin — PA Verification Pending

**Queued:** 2026-05-15
**Round / Section:** Round 10 Section 3c
**Status:** PENDING

## What's Needed from PA

- [ ] **Cap value** — `maxPercent?` or `maxPpm?` and numeric value(s). Natamycin caps typically vary by application (cheese surface, baked goods, yogurt, beverage)
- [ ] **Citation** — confirm authoritative CFR section (likely 21 CFR 172.155 for cheese applications, but PA confirms whether other product contexts use the same citation or different ones)
- [ ] **`denominatorBasis`** — likely `'total'` for surface treatments, but PA confirms whether mass-of-cheese-surface or mass-of-finished-product is the denominator basis
- [ ] **`appliesToCategories`** — subset of `ProductClass` enumeration. Cheese applications imply `'cured-meat'`-style productClass extension may be needed (cheese isn't currently a productClass); PA decides whether to:
   - Restrict to existing productClasses (general, beverage)
   - Surface a finding requesting a `cheese` productClass added to the enumeration (deferred to Round 11+)
- [ ] **`contextualLimits`** — natamycin is most-commonly capped at distinct levels for cheese (often 20 ppm on surface) vs other applications. PA enumerates per-context caps if applicable
- [ ] **`namePatterns`** — suggested: `['natamycin', 'pimaricin']` (pimaricin is the chemical name). PA confirms additions / removals
- [ ] **`activeFraction`** — natamycin commercial preparations sometimes blend with carriers; PA confirms whether the cap is against neat natamycin or as-supplied
- [ ] **Plain-English summary** — one-sentence rule statement

## Where This Lands Once Verified

File: `lib/regulatoryLimits.ts` in the `REGULATORY_LIMITS` array.

Position: alphabetically among FDA preservatives & antioxidants (after LAE, before sodium benzoate).

Entry shape: as for LAE — full schema treatment with PA-verified fields.

## Open Questions for PA

1. **productClass coverage** — natamycin's primary applications (cheese, yogurt, dairy) don't map cleanly to the current 8-value `ProductClass` enumeration. Options:
   - Restrict natamycin to a subset of current productClasses (likely incomplete coverage)
   - Add `cheese` and/or `dairy-fermented` productClasses (enumeration expansion — Round 11+ scope)
   - Defer natamycin entirely until productClass enumeration expands
   PA's call on the right framing.
2. Is natamycin's cap context-dependent (e.g., 20 ppm cheese surface vs higher in baked goods)? If yes, `contextualLimits` enumeration needed.
3. Are there subcategories where natamycin is prohibited (e.g., infant formula)? `prohibitedInCategories` if applicable.
