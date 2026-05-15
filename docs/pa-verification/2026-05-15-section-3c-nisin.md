# Nisin — PA Verification Pending

**Queued:** 2026-05-15
**Round / Section:** Round 10 Section 3c
**Status:** PENDING

## What's Needed from PA

- [ ] **Cap value** — `maxPercent?` or `maxPpm?` and numeric. Nisin caps are typically expressed in IU (international units) and convert to ppm via a unit definition — PA confirms cap basis and units
- [ ] **Citation** — likely 21 CFR 184.1538 (GRAS — pasteurized cheese spreads is the original GRAS use); PA confirms whether other product contexts use the same citation or have separate authorization (e.g., specific cured meats may rely on different rules)
- [ ] **`denominatorBasis`** — depends on application; PA confirms
- [ ] **`appliesToCategories`** — nisin's GRAS use is narrower than other preservatives. Original GRAS = pasteurized cheese spreads; extensions to other categories require PA confirmation. Likely subset of current `ProductClass` enumeration; PA decides
- [ ] **`contextualLimits`** — if nisin's cap is product-class-specific (cheese vs cured meat vs beverage), PA enumerates per-context caps
- [ ] **`namePatterns`** — suggested: `['nisin', 'nisaplin']` (Nisaplin is the common commercial form). PA confirms
- [ ] **`activeFraction`** — Nisaplin is typically 2.5% nisin on a salt carrier; commercial forms vary. PA confirms whether the cap is against neat nisin or as-supplied
- [ ] **Plain-English summary** — one-sentence rule statement

## Where This Lands Once Verified

File: `lib/regulatoryLimits.ts` in the `REGULATORY_LIMITS` array.

Position: alphabetically among FDA preservatives & antioxidants.

Entry shape: as for LAE — full schema treatment, likely with `activeFraction` for commercial blends.

## Open Questions for PA

1. **Unit basis** — caps in IU vs ppm. If PA returns IU-based cap, CC adds an `iu_per_mg` conversion constant alongside the entry to translate, OR convert to ppm at PA verification time. Operator's preference.
2. **productClass coverage** — like natamycin, nisin's primary application (cheese spreads) doesn't map cleanly to the current 8-value `ProductClass` enumeration. PA confirms whether to restrict to existing productClasses or expand the enumeration.
3. **Commercial form (Nisaplin) handling** — `activeFraction: 0.025` (2.5% nisin) is typical but commercial forms vary. PA confirms whether to default to neat-nisin assumption or as-supplied (with `activeFraction`).
