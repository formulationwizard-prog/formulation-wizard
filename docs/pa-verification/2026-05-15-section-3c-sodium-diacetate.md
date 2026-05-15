# Sodium Diacetate — PA Verification Pending

**Queued:** 2026-05-15
**Round / Section:** Round 10 Section 3c
**Status:** PENDING

## What's Needed from PA

- [ ] **Cap value** — `maxPercent?` or `maxPpm?` and numeric. Sodium diacetate caps vary substantially by application (baked goods, meat, snacks, sauces)
- [ ] **Citation** — likely 21 CFR 184.1754 (GRAS) — PA confirms current authoritative section
- [ ] **`denominatorBasis`** — depends on application context; PA confirms
- [ ] **`appliesToCategories`** — sodium diacetate is permitted across many product types but caps differ. Likely covers `['baked-good', 'cured-meat', 'bacon', 'general']`; PA confirms
- [ ] **`contextualLimits`** — high probability this is needed. Typical product-class-specific caps include baked goods (rope/mold inhibitor), meat (antimicrobial), snacks (acidulant). PA enumerates per-context caps
- [ ] **`namePatterns`** — suggested: `['sodium diacetate', 'sodium hydrogen diacetate']`. PA confirms
- [ ] **Plain-English summary** — one-sentence rule statement

## Where This Lands Once Verified

File: `lib/regulatoryLimits.ts` in the `REGULATORY_LIMITS` array.

Position: alphabetically among FDA preservatives & antioxidants.

Entry shape: as for LAE — full schema treatment, expected to include `contextualLimits` for application-specific caps.

## Open Questions for PA

1. **Per-context cap variance** — sodium diacetate is one of the substances where the cap is most context-dependent. PA confirms the full per-context enumeration (which `ProductClass` values + what cap each).
2. Is sodium diacetate's labeling treatment (vinegar / acetate naming on the ingredient statement) a regulatory consideration that the engine should surface? If yes, `declarationTriggerPpm` or a separate label-flag mechanism.
3. Are there subcategories where sodium diacetate is prohibited (e.g., specific infant or medical-food categories)?
