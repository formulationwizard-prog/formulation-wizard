# Melatonin — PA Verification Pending

**Queued:** 2026-05-18
**Round / Section:** Round 11 Phase 3 Wave 1.5d → routed to Round 12 PA-research
**Status:** PENDING

## What's Needed from PA

NDI (New Dietary Ingredient) regulatory status for Melatonin under DSHEA §8 / 21 CFR 190.6. Specifically:

- Authoritative basis for marking Melatonin as DOCUMENTED (grandfathered pre-1994 ODI) vs UNDOCUMENTED. The two-state NDI discipline (rulebook + Wave 1.5d) requires authoritative basis for the DOCUMENTED state — pre-1994 supplement-market presence in the form FDA would recognize (commercial sale records, product labels, industry trade data), not just ethnobotanical or clinical-research history.
- Specifically: was melatonin marketed as a dietary supplement in the US before October 15, 1994?
- If yes: what's the citation? (FDA enforcement-discretion practice ≠ formal ODI evidence in DSHEA terms.)

## Where This Lands Once Verified

`lib/supplementNDI.ts` `NDI_TABLE` — add entry:

```ts
{ keywords: ['melatonin', 'n-acetyl-5-methoxytryptamine'], displayName: 'Melatonin', status: 'grandfathered' /* or 'notified' */, note: '<PA citation>' }
```

If PA confirms pre-1994 supplement-market presence with authoritative citation, status is `grandfathered` and the note carries the citation. If PA cannot confirm authoritatively, the entry stays OUT of NDI_TABLE (per safe-default discipline — UNDOCUMENTED → verbose unmatched advisory).

## Open Questions for PA

1. Does melatonin's wide commercial supplement-market presence in the early 1990s (typically cited 1992–1994 era) qualify as pre-1994 ODI evidence under DSHEA's framework?
2. Has FDA ever issued enforcement action against melatonin as a post-1994 NDI requiring filing? (Practical no = effective grandfathered status; but does that meet the authoritative-basis bar for the platform's NDI two-state discipline?)
3. If neither (1) nor (2) is authoritative, should Melatonin stay UNDOCUMENTED indefinitely, or is there an alternative documented status (e.g., 21 CFR 182 GRAS for some specific use case)?

## Context

Surfaced during Wave 1.5d (Round 11 Phase 3) operator browser verification, 2026-05-18. Melatonin entry in `lib/data/supplements.ts` (`Melatonin (USP, Crystalline)`) currently has no `ndiStatus` field; NDI_TABLE has no matching keyword; classification falls through to Unknown.

Per the Wave 1.5d two-state NDI discipline established in operator+Wizard relay: DOCUMENTED entries appear in NDI_TABLE with authoritative basis; UNDOCUMENTED entries are deliberately omitted (verbose unmatched advisory is the correct safe-default UX). Melatonin stays UNDOCUMENTED until PA confirms authoritative basis or determines it should stay so.
