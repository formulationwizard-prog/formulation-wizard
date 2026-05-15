# LAE (Lauric Arginate Ethyl Ester) — PA Verification Pending

**Queued:** 2026-05-15
**Round / Section:** Round 10 Section 3c
**Status:** PENDING

## What's Needed from PA

Each field below requires PA-verified value before the entry can ship in `REGULATORY_LIMITS`:

- [ ] **Cap value** — `maxPercent?` or `maxPpm?` (which one applies + the numeric value)
- [ ] **Citation** — directive says 21 CFR 184.1118; PA to confirm this is the current authoritative citation, including any paragraph specificity (e.g., `184.1118(c)(1)`)
- [ ] **`denominatorBasis`** — `'total'` / `'fat-and-oil'` / `'meat'` / `'baked-good'` / other. LAE is a cationic antimicrobial — typical use is on meat surfaces and in beverages; basis depends on PA's reading of the GRAS notice
- [ ] **`appliesToCategories`** — which `ProductClass` values does the cap apply to? Likely a subset of `['cured-meat', 'bacon', 'beverage', 'general']` but PA confirms scope
- [ ] **`contextualLimits`** — if the cap varies by application (meat surface vs beverage vs bulk addition), PA enumerates the contexts + per-context caps
- [ ] **`namePatterns`** — substring patterns to match. Suggested: `['lae', 'lauric arginate', 'ethyl lauroyl arginate', 'n-lauroyl-l-arginine', 'mirenat']` (Mirenat is a common commercial brand name). PA confirms any patterns to add or remove
- [ ] **Active fraction** — if LAE is supplied as a blend (e.g., LAE + carrier), `activeFraction` applies. PA confirms whether the cap is against neat LAE or against the as-supplied form
- [ ] **Plain-English summary** — one-sentence rule statement for `summary` field

## Where This Lands Once Verified

File: `lib/regulatoryLimits.ts` in the `REGULATORY_LIMITS` array.

Position: alphabetically among FDA preservatives & antioxidants (after BHT, before sulfites).

Entry shape:

```ts
{
  namePatterns: [/* PA-verified patterns */],
  maxPercent: /* or maxPpm */,
  // denominatorBasis, appliesToCategories, contextualLimits if applicable
  authority: 'FDA',
  citation: '/* PA-verified citation */',
  shortName: 'LAE',
  summary: '/* PA-verified summary */',
}
```

## Open Questions for PA

1. Is LAE permitted across all `appliesToCategories` it's eligible for, or are there productClasses where it's prohibited / restricted? (Affects `prohibitedInCategories` if applicable.)
2. Does LAE have a label-declaration trigger at a sub-cap concentration (similar to sulfites' 10 ppm declaration trigger under 21 CFR 101.100)? If yes, set `declarationTriggerPpm`.
3. Is the GRAS notice (GRN 164 / GRN 218) the load-bearing authority, or is there a separate CFR-codified rule under 21 CFR 184.1118?
4. Are commercial brand-name forms (Mirenat, etc.) chemically equivalent for cap purposes, or do branded forms have different effective concentrations?
