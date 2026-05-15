# Common E-Numbers — PA Enumeration Pending

**Queued:** 2026-05-15
**Round / Section:** Round 10 Section 3c
**Status:** PENDING

## What's Needed from PA

Section 3c directive language: "Common e-numbers as operator + PA enumeration produces them during implementation." This item is **scope-open** — PA + operator decide which e-numbers are in/out of Round 10 scope and which deferred.

- [ ] **The list itself** — which e-numbered additives are in scope for Round 10? Candidates from US-relevant regulation include but are not limited to:
   - E200-E299 (preservatives)
   - E300-E399 (antioxidants + acidity regulators)
   - E400-E499 (thickeners, stabilizers, emulsifiers)
   - E500-E599 (acidity regulators + anti-caking agents)
   - E620-E635 (flavor enhancers — MSG / nucleotides)
- [ ] **Per e-number entry** — once the list is locked, each entry needs the full PA-verified schema treatment (citation, cap, denominator basis, applies-to-categories, contextual limits, name patterns, summary)

## Where This Lands Once Verified

File: `lib/regulatoryLimits.ts` in the `REGULATORY_LIMITS` array.

Each e-number gets its own entry. E-numbers that map to substances already in the table (e.g., E211 = sodium benzoate, E202 = potassium sorbate, E300 = ascorbic acid) need their `namePatterns` arrays expanded to include the e-number string for substring matching, not new entries.

## Open Questions for PA

1. **Scope decision** — which e-numbers warrant their own entries vs added to existing `namePatterns`?
   - E-numbers that map to existing entries (E211 / benzoate, E202 / sorbate, E300 / ascorbate, E211, E330 / citric, etc.) → add to existing namePatterns
   - E-numbers for substances NOT in current REGULATORY_LIMITS but commonly used (E160a beta-carotene, E322 lecithin, E330 citric, E440 pectin, etc.) → new entries needed
   - E-numbers without US-jurisdiction caps (most colorants, many thickeners) → likely out of scope for compliance enforcement
2. **EU vs US framing** — e-numbers are EU-codified; US regulation uses CFR citations + common names. Should entries cite both (e.g., `'21 CFR 184.1733 (E211)'`) or only US?
3. **Round 10 vs Round 11+ deferral** — given the open scope, is it preferable to:
   - Pick a conservative 5-10 e-numbers for Round 10 (the ones most likely to appear in customer-zero formulations)
   - Defer the entire e-number expansion to Round 11+ when EU-market readiness is in scope
   Operator + PA call.
