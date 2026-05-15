# Finding #16 — Ascorbic Acid Tier A Tagging Refinement

**Queued:** 2026-05-15 (Round 10 visual review)
**Status:** Draft proposal — operator review required; NOT activated autonomously

## Observation

Visual review Test 3 (0.1% Ascorbic Acid in water, beverage productClass) returned **pH 3.20 ± 0.30 ESTIMATED**. Theoretical Henderson-Hasselbalch for 0.1% ascorbic acid (~5.7 mM at pKa1 4.10):

```
Ka = 10^-4.10 = 7.94e-5
C  = 0.001g / 176.12 g/mol / 0.1L = 5.68e-3 M
[H+] = (-Ka + √(Ka² + 4·Ka·C)) / 2
     = (-7.94e-5 + √(6.3e-9 + 1.80e-6)) / 2
     = (-7.94e-5 + 1.343e-3) / 2
     = 6.32e-4
pH = -log10(6.32e-4) = 3.20
```

Center value matches theoretical (3.20). But CI is ±0.30 (ESTIMATED display tolerance from RANGE_TABLE) rather than ±0.20 (CALCULATED display tolerance). Tier A's `computeSingleAcidPH` IS applying — the math is correct — but the output confidence is ESTIMATED rather than CALCULATED.

## Trace

The ascorbic acid catalog entry at [lib/foodScience.ts:329](../../lib/foodScience.ts#L329) ALREADY carries pKa1 and acidMolarMass tags:

```ts
'Ascorbic Acid (Vitamin C, Food Grade)': {
  pH: 2.4, brix: 0, moisture: 0, aw: 0,
  pKa1: 4.10,
  acidMolarMass: 176.12,
  source: 'ai-estimate',
  confidence: 'unverified',
  notes: 'CAS 50-81-7. E300. Diprotic; pKa1 4.10 / pKa2 11.79. pH 2.4 in 1% solution. Antioxidant + browning inhibitor + nutrient fortifier.'
}
```

Tier A counts this as a valid pKa-tagged acid (Rule A passes with count=1), and since water is non-buffering (Rule B passes), the H-H math applies. The center value of 3.20 confirms the math is correct.

But the entry's `source: 'ai-estimate'` + `confidence: 'unverified'` → `mapSpecToConfidence` returns `'estimated'` → Tier A output confidence downgrades to ESTIMATED per the locked taxonomy table:

| Inputs | Output |
|---|---|
| MEASURED pKa + 1 acid + no buffering | **CALCULATED pH (target)** |
| ESTIMATED pKa (catalog estimate, not USP/FCC cited) | **ESTIMATED pH** |

So Test 3's behavior is **correct per the locked taxonomy** — the issue is that ascorbic acid is tagged as ai-estimate when its values could be sourced authoritatively.

## Comparison to other tagged acids

The other 8 standalone acids tagged in Section 2 split as follows:

**Verified (source='commodity-standard' or 'cited-reference', → MEASURED → CALCULATED output):**
- Citric Acid (Anhydrous) — pKa1 3.13 / MW 192.12 / citation: 21 CFR 184.1033 + FCC 3rd ed. pp. 86-87 + CRC Handbook 97th ed.
- Citric Acid (Monohydrate, Fine) — same chemistry
- Acetic Acid (Glacial Food Grade) — pKa 4.76 / MW 60.05 / citation: 21 CFR 184.1005 + FCC 3rd ed. p. 8 + CRC Handbook 97th ed.

**Unverified (source='ai-estimate', → ESTIMATED → ESTIMATED output):**
- Malic, Tartaric, Fumaric, Lactic 88%, Phosphoric 85%, Ascorbic, Gluconic Acid (GDL — intentionally untagged with pKa1 per Section 2's hydrolysis-kinetics-violate-H-H carve-out)

Ascorbic acid is in the "unverified" group, but its values are as well-established as citric/acetic — both are GRAS-codified with CFR citations and FCC monographs. The "unverified" status reflects historical catalog hygiene (the entry was AI-generated during scaffolding without provenance audit) rather than chemistry uncertainty.

## Proposed refinement

Promote ascorbic acid entry from `confidence: 'unverified'` (ai-estimate) to `confidence: 'verified'` (cited-reference) with full citations:

```ts
'Ascorbic Acid (Vitamin C, Food Grade)': {
  pH: 2.4, brix: 0, moisture: 0, aw: 0,
  pKa1: 4.10,
  acidMolarMass: 176.12,
  source: 'cited-reference', // CHANGED: was 'ai-estimate'
  citation: '21 CFR 182.3013 (Ascorbic Acid, GRAS); Food Chemicals Codex 12th ed., Ascorbic Acid monograph; pKa1 from CRC Handbook 97th ed.',
  confidence: 'verified', // CHANGED: was 'unverified'
  last_verified: '2026-05-15', // NEW: required when confidence='verified'
  notes: 'CAS 50-81-7. E300. Diprotic; pKa1 4.10 / pKa2 11.79. pH 2.4 in 1% solution. Antioxidant + browning inhibitor + nutrient fortifier.'
}
```

After this change:
- Test 3 would return pH 3.20 ± 0.20 **CALCULATED** (was ± 0.30 ESTIMATED)
- Tier A math output unchanged (center value still 3.20)
- Bucket A gate routing: a violation involving ascorbic acid would route to hard-stop (MEASURED) rather than PA-reviewable (ESTIMATED)

## Citation authority check

Each proposed citation source:

- **21 CFR 182.3013** — "Ascorbic acid. The food additive ascorbic acid (CAS Reg. No. 50-81-7) may be safely used in food..." Authoritative US GRAS codification.
- **Food Chemicals Codex 12th ed.** — Ascorbic Acid monograph specifies identity, purity, packaging, labeling. Industry-standard reference for food-grade chemistry.
- **CRC Handbook of Chemistry and Physics, 97th ed.** — pKa1 4.10 (ascorbic acid first dissociation at 25°C aqueous). Reference value used by other tagged acids in Section 2.

All three are the same authority tier as the citations on citric acid and acetic glacial. No new authority tier introduced.

## Confidence assessment

Low risk:
- pKa1 4.10 is a well-established physical constant; CRC Handbook is the canonical reference
- Molecular weight 176.12 is a chemical-formula derivation, not subject to measurement variance
- GRAS citation is US-codified, not interpretive
- pH 2.4 in 1% solution is per the existing 1%-solution convention used by other standalone acids

The "verified" tier exists exactly for this kind of well-established commodity chemistry — promoting ascorbic matches the precedent set by citric and acetic glacial.

## Recommended action

**Operator decision required.** The 9 standalone acids tagged in Section 2 went through operator review of citation sources; ascorbic acid should follow the same path. Operator decides:

- **Activate the tagging now** — single small commit promoting ascorbic acid to verified status. Test 3 visual result changes from ±0.30 ESTIMATED to ±0.20 CALCULATED.
- **Defer to Round 11** — bundle with broader catalog provenance pass (other ai-estimate acids — malic, tartaric, fumaric, lactic, phosphoric — could be promoted similarly if Section 2 review applies the same standard).
- **Reject** — keep ai-estimate status with explanation (e.g., if Round 10 scope deliberately bounded the verified-acid set to 3 entries).

## Operator decision needed on return

1. Promote ascorbic acid to `confidence: 'verified'` with the proposed citation? (yes / no / defer)
2. If yes — same pass for malic / tartaric / fumaric / lactic / phosphoric as well, or just ascorbic?
3. If no — should the entry's `notes` field reference Finding #16 explicitly so future reviewers don't re-surface?

## Do NOT activate autonomously

The other 9 acids' tagging went through operator review of citation sources before commit. This entry follows the same path — the memo proposes the change; operator approves; CC applies as a single small commit.
