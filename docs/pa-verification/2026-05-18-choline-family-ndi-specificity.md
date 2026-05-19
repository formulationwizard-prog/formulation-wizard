# Choline-family branded-form NDI specificity — PA Verification Pending

**Queued:** 2026-05-18
**Round / Section:** Round 11 Phase 3 Wave 1.5d → routed to Round 12 PA-research
**Status:** PENDING

## What's Needed from PA

Authoritative NDI status for branded-form choline derivatives currently UNMATCHED in `NDI_TABLE` (post Wave 1.5d keyword-match refactor):

1. **Phosphatidylcholine (PC 35%, Soy)** — `Phosphatidylcholine 30% (Soy Lecithin-Derived)` — `Phosphatidylcholine 30% (Sunflower Lecithin-Derived, Allergen-Free)`
2. **Alpha-GPC (L-Alpha-Glycerylphosphorylcholine)** — branded forms: Chemi Nutra Alpha-GPC, Kyowa Hakko Alpha-GPC
3. **CDP-Choline / Citicoline** — branded form: Kyowa Hakko Cognizin

## Where This Lands Once Verified

`lib/supplementNDI.ts` `NDI_TABLE` — for each PA-verified entry, add:

```ts
// Example if Cognizin has accepted NDI:
{ keywords: ['cdp-choline', 'citicoline', 'cognizin'], displayName: 'CDP-Choline / Citicoline', status: 'notified', ndiNumber: '<PA-supplied NDI#>', note: '<PA citation; clarify generic-citicoline vs Cognizin distinction>' }

// Example if Chemi Nutra Alpha-GPC has accepted NDI:
{ keywords: ['alpha-gpc', 'l-alpha-glycerylphosphorylcholine', 'glycerylphosphorylcholine'], displayName: 'Alpha-GPC', status: 'notified', ndiNumber: '<PA-supplied>', note: '<PA citation>' }
```

If PA cannot confirm authoritatively (i.e., generic forms lack NDI even though branded forms have one), entries stay OUT of NDI_TABLE (safe-default).

## Open Questions for PA

1. **Cognizin (Kyowa Hakko CDP-Choline / Citicoline)** — does it have an accepted NDI? What's the NDI number? Does the NDI's scope cover generic citicoline preparations or only the Cognizin-branded form?

2. **Chemi Nutra Alpha-GPC** — accepted NDI status? Does it cover generic L-α-GPC or only Chemi Nutra's specific manufacturing process?

3. **Phosphatidylcholine 30% (both Soy and Sunflower variants)** — PC is the isolated phospholipid fraction of lecithin (parent material is GRAS per 21 CFR 184.1400). Does isolated 35% PC inherit lecithin's grandfathered status, or does it require separate documentation? The same question for the Sunflower-derived variant.

4. **Generic vs branded distinction** — if a branded form (Cognizin, Chemi Nutra Alpha-GPC) has accepted NDI but the generic substance does not, what's the right keyword discipline in NDI_TABLE? Match only the brand name to documented status, leave generic UNMATCHED? Or match both with a note that distinguishes them?

## Context

Surfaced during Wave 1.5d (Round 11 Phase 3) NDI keyword-match refactor. Pre-1.5d, the generic 'choline' keyword in NDI_TABLE substring-matched into Phosphatidylcholine, Alpha-GPC, CDP-Choline — classifying all three as grandfathered (Choline parent status). Post-1.5d the keyword uses `boundaryMode: 'standalone-token'` which prevents the substring overgeneralization — but leaves the three compound choline derivatives UNMATCHED.

UNMATCHED is the correct safe-default — the verbose advisory tells the operator to verify independently. But the branded forms DO have specific NDI history (Cognizin's NDI, Chemi Nutra's NDI) that, if documented authoritatively, would let the platform classify them correctly without overgeneralizing from generic choline.

Per the Wave 1.5d two-state NDI discipline: DOCUMENTED with authoritative basis OR UNDOCUMENTED. PA research provides the authoritative basis.

## Worked example of the substring overgeneralization (now fixed)

Pre-1.5d, operator paste of `Alpha-GPC 300 mg` would have classified as grandfathered via the generic 'choline' keyword matching inside `glycerylphosphorylcholine`. Operator would see "Pre-1994 ODI (grandfathered)" advisory — incorrect, because Alpha-GPC's branded forms have specific notified NDIs distinct from generic-choline grandfathered status.

Post-1.5d the operator sees the verbose UNMATCHED advisory — correct under the safe-default discipline, but actionable PA-research replaces the silent overgeneralization with explicit documentation work.
