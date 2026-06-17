# Catalog Schema-Fields Directive — 2026-06-17

**STATUS: DRAFT FOR OPUS REVIEW. No code lands until ratified.**

**Purpose:** Land the world-class enforcing fields the Rulebook specifies (§I.4 confidence, §I.6 benchmarks, §II.8 schema, §14a canonical IDs, §5a heavy-metals) into `types/index.ts` — so the audit's "unmeasurable / structurally-0" benchmarks become *measurable* and the curation phase has somewhere to put verified values.

**This directive is the TYPE additions only (§II.8 migration Step 1).** Population/backfill is the gated curation phase — verified, never bulk (it does NOT happen here).

**Carve-out note:** `types/index.ts` is load-bearing for the catalog + engine. This is a directive (design); execution is gated on this review. The proposed changes are **strictly additive + optional** → zero breakage, no consumer rewrite required.

---

## 1. Fields to add to `IndustrialIngredient` (all optional — additive, no breakage)

```typescript
// §I.4 — confidence taxonomy (5 levels)
export type ConfidenceLevel =
  | 'Verified-Lab' | 'Verified-Supplier-COA' | 'Estimated' | 'Inferred' | 'Undocumented';

// §III.16 — value/premium/specialty tier (replaces the "Tier-A/B" name leaks)
export type CatalogTier = 'value' | 'premium' | 'specialty';

// §I.2 — structured citation (authority tier 1–7)
export interface CatalogCitation {
  authority: string;            // e.g. 'IOM (NAM)', 'USP', 'FDA'
  source: string;               // ≤ 80 chars, UI-tooltip-fit
  tier: 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

// added to IndustrialIngredient:
  confidenceLevel?: ConfidenceLevel;
  tier?: CatalogTier;
  citation?: CatalogCitation[];

  // §14a canonical identifiers (trajectory; verified, never bulk-inferred)
  canonicalIdUnii?: string;       // FDA UNII (per-substance)
  canonicalIdUspLatin?: string;   // genus species (botanicals)
  canonicalIdGtin?: string;       // GS1 GTIN

  // §II.8 Gap #4/#6 — review cadence + allergen-investigation flag pair
  lastReviewedDate?: string;      // ISO date
  reviewedBy?: string;
  allergensInvestigated?: boolean;
  allergensFound?: string[];
```

These five clusters are the un-measurable benchmarks' enforcing fields. Once they land, the audit flips each from "— (unmeasurable)" to "measurable, N% populated" — honest progress made visible.

---

## 2. Three design decisions (Opus calls — I recommend, you rule)

### Decision A — `regulatoryStatus` string vs. object form (§II.8 Gap #3)
`regulatoryStatus?: RegulatoryStatus` is currently a **string union**; §II.8/§14 want a **jurisdiction-keyed object** (`{ US, CA?, EU?, … }`). Changing it is **breaking** — 68 entries use the bare string, and the consumers are in `lib/supplement*.ts` (engine, carve-out).

**Recommend: DEFER (keep the string for August).** §14 already says "defer per-entry encoding of CA/EU/UK/AU until a target market beyond US is named." August is US-only. Migrating the type now buys nothing for launch and risks the engine during crunch. Revisit when a non-US market is named. *(If you want multi-jurisdiction now, it's a separate, tested migration — not folded into this additive pass.)*

### Decision B — heavy-metals vector: classifier function vs. stored field (§5a)
§5a is **class-level**, but the vectors **cross categories**: "all botanicals/minerals" is category-level, while "rice-derived → As" and "cocoa → Cd" are *source-level* (rice protein, cocoa extract live in different categories). A pure `category → metals` map can't express the source-level ones.

**Recommend: a centralized CLASSIFIER, not a per-entry field** — mirroring the `elementalFactor` centralization precedent:
```typescript
export type HeavyMetal = 'Pb' | 'As' | 'Cd' | 'Hg';
// lib/heavyMetalVectors.ts (new): classifyHeavyMetalVectors(ing): HeavyMetal[]
//   category ∈ {Botanicals, Herbal Extracts, Minerals, Mushroom Extracts} → broad
//   + source signals on name/subIngredients: rice→As, cocoa/leafy→Cd, kelp/marine/fish/krill→Hg
```
Plus one optional per-entry **override** for documented exceptions: `heavyMetalsVectorOverride?: HeavyMetal[] | 'verified-clean'` (e.g. a COA-clean SKU in a flagged class, or a vector outside the flagged categories). The flag is **derived at render time**, consistent with §5a "class-level." The per-class list is refined with Nate before the classifier ships.

### Decision C — include the §II.8 allergen-flag + review fields now, or defer?
**Recommend: include now** (`allergensInvestigated`/`allergensFound`/`lastReviewedDate`/`reviewedBy`). They're additive, cheap, and `allergensInvestigated` is the harm-critical floor's own remediation path (§I.5 — lets an entry move from "empty = UNDOCUMENTED" to "investigated, found []"). Landing the field now unblocks honest allergen curation.

---

## 3. Migration discipline

- **One schema commit, all fields** (§39 schema-lock spirit) — land the type additions atomically; no field dribbles in mid-curation.
- **Strictly additive + optional** → existing 367 entries compile unchanged; no consumer touched; the audit keeps passing (new fields read as absent → honest 0%/unmeasurable→measurable flip).
- **No backfill here.** Population is the gated curation phase: verified per the Rulebook (§I.2 citations, §I.4 confidence, COA-anchored), wave-by-wave, Nate-coordinated where domain judgment applies, 3 tests/entry (§VI). Bulk-fill is forbidden (the honesty-first guardrail).
- **Audit ratchet updates** after the fields land + first curation wave: the coverage benchmarks gain real denominators; the S3 naming-discipline ceiling (Tier-A/B leaks) drops as `tier` absorbs them.

---

## 4. Sequence after ratification

1. Land §1 fields + Decision B/C outcomes in `types/index.ts` (+ `lib/heavyMetalVectors.ts` classifier if B = classifier) — one commit.
2. Extend `lib/catalogAudit.ts` to measure the now-present fields (confidence/tier/citation coverage become real %; heavy-metals vector coverage via the classifier).
3. Begin curation wave 1 (per the agreed curation-first order: S2 PENDING drain → grade-claim substantiation → naming-discipline/tier migration → dup-cluster confirmation), gated.

**Open for your review: Decisions A, B, C + the field shapes. On ratify, I execute step 1 (types/index.ts) for your review before step 2.**
