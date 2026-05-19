# St. John's Wort — PA Verification Pending (NDI status)

**Queued:** 2026-05-18
**Round / Section:** Round 11 Phase 3 Wave 1.5d → routed to Round 12 PA-research
**Status:** PENDING

**Related queue file:** [2026-05-17-st-johns-wort-label-interaction-text.md](2026-05-17-st-johns-wort-label-interaction-text.md) (separate concern — drug-interaction label text routing)

## What's Needed from PA

NDI (New Dietary Ingredient) regulatory status for St. John's Wort (Hypericum perforatum) under DSHEA §8 / 21 CFR 190.6. Specifically:

- Authoritative basis for marking SJW as DOCUMENTED (grandfathered pre-1994 ODI) vs UNDOCUMENTED.
- Ethnobotanical / traditional-herbal-medicine history is well-documented but is NOT the same as "marketed as a dietary supplement under DSHEA's framework before October 15, 1994."
- Linde 2008 Cochrane Review is clinical-efficacy literature, not regulatory-status citation.

The platform's two-state NDI discipline (Wave 1.5d) requires authoritative basis for the DOCUMENTED state — operator-visible regulatory framing must match what the platform can defensibly assert.

## Where This Lands Once Verified

`lib/supplementNDI.ts` `NDI_TABLE` — if DOCUMENTED:

```ts
{ keywords: ["st. john's wort", 'hypericum', 'hypericum perforatum', 'sjw'], displayName: "St. John's Wort", status: 'grandfathered' /* or 'gras-food' / 'notified' */, note: '<PA citation>' }
```

If UNDOCUMENTED stays the disposition, entry remains OUT of NDI_TABLE (per safe-default discipline). Operator-visible advisory remains the verbose "Not in the platform's NDI reference table. Verify compliance status independently before marketing..." text.

## Open Questions for PA

1. Was St. John's Wort marketed as a dietary supplement in the US before October 15, 1994 in a form FDA would recognize as ODI evidence?
2. The drug-interaction profile (CYP3A4 + P-glycoprotein induction; SSRIs, oral contraceptives, warfarin, HIV protease inhibitors, cyclosporine, digoxin) is documented in `lib/supplementSafetyLimits.ts INTERACTION_WARNINGS` and surfaces in the Dosage Check panel. NDI status is distinct from the drug-interaction warning — both must hold for the entry to ship cleanly. Does PA's authoritative-basis review for NDI status surface anything that should also update the INTERACTION_WARNINGS table?
3. SJW has been intermittently scrutinized by FDA (CYP3A4 induction warning Feb 2000). Has FDA's regulatory posture on SJW's DSHEA status itself ever been formally addressed?

## Context

Surfaced during Wave 1.5d (Round 11 Phase 3) operator browser verification, 2026-05-18. SJW entry in `lib/data/supplements.ts` (`St. John's Wort (Hypericum perforatum, 0.3% Hypericin / 3% Hyperforin)`) — drug-interaction profile is documented and operator-visible via INTERACTION_WARNINGS; NDI status is the open question. Per the Wave 1.5d two-state NDI discipline, SJW stays UNDOCUMENTED pending PA's authoritative-basis review.

The Wizard's explicit framing at Wave 1.5d directive sign-off: "UNDOCUMENTED pending stronger citation is the correct posture for SJW at this stage" — same pattern as Finding #16 (ascorbic acid Tier A confidence promotion) where explicit PA-research work items replace silent assumption.
