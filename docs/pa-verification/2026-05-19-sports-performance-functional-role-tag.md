# sports-performance Functional-Role Tag — PA Verification Pending

**Queued:** 2026-05-19
**Round / Section:** Round 11 Phase 3 Catalog Entry Validator v1 — inaugural smoke test
**Status:** PENDING

## What's Needed from PA

Authoritative basis for adding `sports-performance` as an Appendix A functional-role tag in `docs/architecture/catalog-authoring-rulebook.md`. Specifically:

- Confirmation that `sports-performance` is a well-established functional-role category in dietary-supplement clinical practice with peer-reviewed substantiation at typical-use doses
- Tier-1 / Tier-2 authority citations suitable for Appendix A inclusion. Operator-supplied candidates: IOC Consensus 2018 (Maughan et al., Br J Sports Med 52:439-455); ISSN Position Stand on dietary supplements (Kerksick et al. 2018, J Int Soc Sports Nutr 15:38)
- Threshold dose convention for tag eligibility — differs from `cognitive-support` because acute attention effects (caffeine 50–200 mg) and ergogenic effects (caffeine 3–6 mg/kg, typically 200–400 mg for 70 kg adult) operate at different dose ranges
- Disambiguation between `sports-performance` and adjacent Appendix A tags (`cardiovascular-support`, `cognitive-support`, `methylation-support`) — when is an effect categorized as sports-performance vs one of the others?

## Where This Lands Once Verified

`docs/architecture/catalog-authoring-rulebook.md` Appendix A — add new row to the Common Functional-Role Tags + Dosage Thresholds table:

```
| `sports-performance` | <PA-verified threshold expression — proposed: "≥ ergogenic dose per Tier-1 sports-nutrition authority"> | Caffeine (3-6 mg/kg ergogenic per Maughan 2018), Beta-Alanine (3-6 g/day), Creatine Monohydrate (3-5 g/day), L-Citrulline Malate (6-8 g pre-workout), Betaine Anhydrous (2.5 g/day) |
```

Citation format follows existing Appendix A pattern. Tier-1 authority anchor required (Maughan 2018 IOC Consensus is the leading candidate).

## Open Questions for PA

1. **Canonical tag name:** is `sports-performance` the right label, or should it be more specific (e.g., `ergogenic`, `performance-enhancement`, `athletic-performance`)? The IOC Consensus uses "ergogenic" for the dose-response framework; "sports-performance" is more operator-facing.
2. **Evidence subcategories:** should the tag have subcategories (acute vs chronic effect; aerobic vs anaerobic; recovery vs performance)? Beta-Alanine's chronic-loading effect is a different evidence shape than Caffeine's acute attention effect — both currently would land under `sports-performance` but operate differently.
3. **Re-tagging of existing entries:** two entries currently use the tag (identified during inaugural validator smoke test 2026-05-19):
   - `Caffeine Anhydrous (USP, Pharmaceutical-Grade)` — cognitive-support + sports-performance dual-tag is correct? Or does one mechanism subsume the other at typical dose?
   - `TMG / Betaine Anhydrous (USP, Trimethylglycine)` — sports-performance is the secondary use; primary use is methylation-support. Per §III.18 primary-mechanism-wins, should the tag stay or migrate to methylation-support primary?
4. **Threshold expression format:** Appendix A's existing rows use specific dose thresholds (`adaptogenic: ≥ 200 mg standardized extract`; `nootropic: clinical cognitive effect at typical dose`). The `sports-performance` threshold is substance-dependent (3-6 mg/kg for caffeine; 3-6 g/day for beta-alanine; etc.). Should Appendix A express this as a per-substance threshold ladder, or as a generic "≥ ergogenic dose per Tier-1 sports-nutrition authority"?

## Context

Surfaced during Catalog Entry Validator v1 inaugural smoke test (2026-05-19) against `Caffeine Anhydrous (USP, Pharmaceutical-Grade)`. Agent's H6 (functional-role tag substantiation) + Gap 7 (functional-role tag thresholds vs dose-range straddling) both fired because `functionalRole: ['sports-performance']` is present on the entry but `sports-performance` is not enumerated in Appendix A.

Per §II.12, functional tags MUST be defensible at typical-use dose with:
- Typical-use-dose threshold
- Evidence-grade pointer (Examine.com, NIH ODS, Cochrane Review)
- Clinical-trial citation (≥ 1 trial, ≥ 30 subjects per arm) OR Tier-1/2 authority statement

Caffeine's `sports-performance` tagging at the entry's typical-use dose (per-serving ≤ 200 mg for NSF Certified for Sport compliance) is substantively defensible — IOC 2018 ergogenic threshold is 3 mg/kg pre-training (≈ 200 mg for 70 kg adult, aligned with the entry's typical use). But the Appendix A enumeration doesn't yet include `sports-performance` as a recognized tag, so the agent cannot mechanically verify substantiation against the rulebook.

Until PA confirms Appendix A inclusion + threshold convention, the agent will continue surfacing H6/Gap 7 routing-questions on the two entries above. PA verification unblocks Appendix A amendment.

## Validator behavior in the interim

Per the §II.8 transition rider (also added 2026-05-19), and per Discipline note #6 ("PA fills the blanks"), the validator does NOT auto-promote `sports-performance` to recognized-tag status. The tag stays in the catalog (the substantive claim is honest) but the validator surfaces H6/Gap 7 routing on every entry that uses it until this PA item resolves. Operator may explicitly override on a per-entry basis during the interim.

## Closure criteria

This queue item closes when ALL of the following land:

1. Rulebook §IV Appendix A amended with `sports-performance` row + PA-confirmed Tier-1/2 citations (Maughan 2018 IOC Consensus + ISSN Position Stand as the leading candidates).
2. Validator H6 + Gap 7 routing-questions auto-resolve for the tag on existing entries (mechanical consequence of Appendix A enumeration).
3. Existing entries verified to clear the canonical threshold at typical-use dose:
   - `Caffeine Anhydrous (USP, Pharmaceutical-Grade)` — confirmed defensible at 200 mg per-serving (NSF Certified for Sport ceiling) per Maughan 2018 ergogenic threshold of 3 mg/kg.
   - `TMG / Betaine Anhydrous (USP, Trimethylglycine)` — verified primary-mechanism per §III.18 (sports-performance vs methylation-support); tag confirmed or migrated.
4. File moved to `docs/pa-verification/verified/2026-05-19-sports-performance-functional-role-tag.md` per the README workflow.

Mirrors the §II.8 transition rider's closure-criteria pattern. PA-queue items are work-with-completion-criteria, not open-ended research.
