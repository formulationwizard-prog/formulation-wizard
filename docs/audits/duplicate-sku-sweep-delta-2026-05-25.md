# Audit: Duplicate-SKU Sweep — Delta Addendum (2026-05-25)

**Audit type:** Read-only delta verification. Confirms whether [docs/audits/duplicate-sku-sweep.md](duplicate-sku-sweep.md) (2026-05-20 baseline) is still actionable after 5 days of catalog work.
**Authored:** 2026-05-25
**Authored-by:** Claude Code (operator-supervised; daytime run after overnight automation rescheduling issue)
**Reviewed-by:** _pending operator merge_
**Scope:** Net changes to `lib/data/supplements.ts` between commit `b7bbc01` (May 20 baseline audit landing) and `c93b78d` (May 25 HEAD).

---

## TL;DR

**The May 20 baseline audit is still current + actionable.** No new duplicate-SKU bugs were introduced in the 5-day delta window. Consolidation work HAS been executed against the baseline findings — ~11 of ~25 originally-identified Same-SKU duplicate pairs were resolved in the Step 0.5a Bucket 1+2+3 wave (commits `0ae72ab` + `775e323` + `5d5ec62` + `3edb088`). ~14 pairs remain queued for Round 12 cleanup.

**No retroactive re-audit needed.** Anyone executing the remaining Round 12 consolidation work can use the May 20 audit document as their canonical input list with confidence — minus the resolved pairs called out below.

---

## Delta Inventory

### Net changes since May 20 (b7bbc01 → c93b78d)

| Change class | Count | Notes |
|---|---|---|
| Entries DELETED (resolved duplicates) | 13 | Step 0.5a Bucket 1+2+3 consolidations |
| Entries ADDED (net-new) | 6 | 3 intentional Tier-A/Tier-B pairs per `[[supplements-two-wave-ingestion]]` doctrine — NOT bugs |
| Entries RENAMED (§II.9a form-first canonical) | ~33 | Step 0.5b Cluster 1+2+3 — no count change |
| Entries RECATEGORIZED | 6 | Step 0.5c.i Specialty → Specialty Compounds migration |
| Entries enriched (regulatory-classification population) | many | Today's `9214abf` + earlier addedSugars + FALCPA species notation passes — edits to existing entries, no count change |
| Net entry count change | -7 | 399 (May 20 baseline) → 392 (May 25 HEAD) |

### Resolved duplicate pairs (executed in Step 0.5a Bucket 1+2+3)

Per the May 20 audit's resolution plan, the following Same-SKU duplicate pairs have been consolidated since the audit landed. These should be marked RESOLVED in any Round 12 cleanup tracker built from the May 20 audit:

**Bucket 1 (Choline + tier-pair cluster — commit `0ae72ab` + `3edb088`):**
- B1.1 — CDP-Choline cross-category duplicate (Fatty Acids variant deleted; Vitamins survivor at Citicoline / CDP-Choline (Cognizin, Kyowa Hakko))
- B1.2 — L-Theanine Suntheanine duplicate (Taiyo variant deleted; Pharma variant survivor)
- B1.3 — MCC PH-102 duplicate (Larger variant deleted; standard PH-102 survivor)
- B1.4 — L-Carnitine Tartrate duplicate (non-stereo variant deleted; L-Tartrate stereo survivor)

**Bucket 2 (Curcumin/Saw Palmetto/Bromelain cluster — commit `775e323`):**
- B2.1 — Curcumin Sabinsa C3 triple-consolidation (2 Turmeric Extract duplicates deleted; branded survivor)
- B2.2 — Curcumin Meriva duplicate (Phytosome variant deleted; Meriva survivor with $320 cost)
- B2.3 — Saw Palmetto triple-consolidation (2 Saw Palmetto Extract duplicates deleted; Valensa USPlus survivor with supplier-set union)
- B2.4 — Bromelain cross-category consolidation (Antioxidants variant deleted; Enzymes survivor per §III.18 primary-mechanism-wins)

**Bucket 3 (Glucosamine/Chondroitin/CoQ10 cluster — commit `5d5ec62`):**
- B4.3.1 — Glucosamine Sulfate 2KCl duplicate (Specialty variant deleted; survivor receives HARM-CRITICAL FALCPA allergen string upgrade `Shellfish` → `Crustacean Shellfish` per Big-9 disclosure compliance)
- B4.3.2 — Chondroitin Sulfate Sodium duplicate (Bovine USP Specialty variant deleted; survivor supplier-set union)
- B4.3.4 — CoQ10 Ubiquinol duplicate (Antioxidants variant deleted; Specialty Compounds Kaneka QH survivor)

**Deferred to Phase 2 PA queue (not yet resolved):**
- B4.3.3 — MSM disambiguation (OptiMSM vs USP) — queued at `docs/pa-verification/2026-05-20-msm-optimsm-vs-usp-disambiguation.md` per §II.9a Refinement 4

### Net-new entries (NOT bugs — verified intentional)

The 6 net-new entries added in commit `fa5b735` are explicitly documented as "3 added pairs (6 entries; Mg Stearate + L-Arginine HCl + Creatine Monohydrate Creapure with Step 1 manufacturer/vendor restructure flag — interim rename per Encoding β)" — i.e., they're intentional Tier-A/Tier-B commercial-tier pairs per `[[supplements-two-wave-ingestion]]` doctrine, NOT new duplicate-SKU bugs.

| Substance | Tier-A entry | Tier-B entry | Classification |
|---|---|---|---|
| Magnesium Stearate | `Magnesium Stearate (USP, Tier-A, PENDING TIER VERIFICATION)` | `Magnesium Stearate (USP, Tier-B, PENDING TIER VERIFICATION)` | Intentional tier pair |
| L-Arginine HCl | `L-Arginine HCl (USP, Tier-A, PENDING TIER VERIFICATION)` | `L-Arginine HCl (USP, Tier-B, PENDING TIER VERIFICATION)` | Intentional tier pair |
| Creatine Monohydrate | `Creatine Monohydrate (Creapure, USP, Tier-A, PENDING TIER VERIFICATION)` | `Creatine Monohydrate (USP, Tier-B, PENDING TIER VERIFICATION)` | Intentional tier pair |

These render in the May 20 audit's "Intentional tier pairs (legitimate)" bucket — they expand that count from ~12 to ~15 but don't change the actionable-Same-SKU-duplicate count.

### Renames (§II.9a form-first canonical)

The ~33 rename operations across Step 0.5b Cluster 1+2+3 (commits `5b10e3e` + `fa5b735` + `b8382f8` + `fcde45e`) brought entries into compliance with §II.9a Refinement 2 (form-first canonical) + Refinement 3 (chemistry-form discipline). These DO NOT create new duplicates and DO NOT affect the May 20 audit's substance-family enumeration — they update the entry-name strings used in the canonical input list.

If any Round 12 consolidator references the May 20 audit's entry names verbatim, they should expect minor name-string drift but identical underlying entry identity. Per `[[persistent-refs-use-names-not-line-numbers]]` discipline, name-based references survive renames better than line-number references — but neither is fully drift-proof.

### Recategorizations (Step 0.5c.i)

Step 0.5c.i (commit `fcde45e`) recategorized 6 entries from `Specialty` → `Specialty Compounds`:
- Glucosamine HCl (Wave 2 line) — category move only
- Hyaluronic Acid Injuv — category move only
- Hydrolyzed HA — category move only
- ASU (Avocado-Soybean Unsaponifiables) — category move only
- Spermidine — category move only
- SAMe — category move + rename (`Natural` → `Fermentation-Derived` per §II.9a Refinement 2)

None of these create new duplicate-SKU situations. Per the commit's §38a unscoped grep pre-flight, no stranded duplicates were created (value-tier siblings Glucosamine Sulfate 2KCl + MSM OptiMSM + HA Sodium were already in Specialty Compounds).

### Enrichment passes (regulatory-classification population)

Today's `9214abf` + earlier commits (8c7d140 + b654f49 + fe925de) populated regulatory-classification fields (addedSugars per FDA 21 CFR 101.9(c)(6)(iii); FALCPA species notation via subIngredients) on existing entries. These are PER-FIELD edits — they don't change entry identity and don't create duplicate-SKU situations.

---

## Verification of May 20 Audit Currency

For each of the May 20 audit's 17 substance families, this delta confirms:

| Family | May 20 status | Delta-window impact | Current status |
|---|---|---|---|
| Choline | Three-category split + 1 confirmed duplicate (B1.1) | B1.1 resolved via consolidation | Still has three-category split; 1 duplicate resolved |
| Magnesium | ~5 duplicate pairs across forms | B3.1 + B3.2 renamed to Tier-A/B (legitimate); Magtein synonym fix | Same baseline scope; Magtein issue resolved |
| B-vitamins | ~6 duplicates across forms | Step 0.5b Cluster 2 renamed 8 pairs to Tier-A/B; no consolidations executed | Same baseline scope; entries renamed but not deleted |
| Omega-3 forms | 0 same-SKU duplicates | No changes | No change |
| Probiotic strains | 0 same-SKU duplicates | No changes | No change |
| Curcumin variants | 2 same-SKU duplicates (Sabinsa C3 + Meriva) | B2.1 + B2.2 resolved | 0 duplicates remaining |
| Caffeine variants | 0 same-SKU duplicates | No changes | No change |
| Melatonin variants | 0 same-SKU duplicates | No changes | No change |
| Calcium | ~3 duplicate pairs across forms | B3.3 renamed to Tier-A/B (legitimate); no consolidations | Same baseline scope |
| Iron | ~2 duplicate pairs | No changes | Same baseline scope |
| Zinc | ~2 duplicate pairs | No changes | Same baseline scope |
| Vitamin C | ~3 duplicate pairs across forms | No changes | Same baseline scope |
| Vitamin D | ~2 duplicate pairs | No changes | Same baseline scope |
| Vitamin E | ~2 duplicate pairs | No changes | Same baseline scope |
| Vitamin K | ~2 duplicate pairs | No changes | Same baseline scope |
| Mushroom families | 4-family cross-category split | No changes | Same baseline scope |
| Excipients (Mg Stearate / MCC) | 2 same-SKU duplicates | B1.3 MCC PH-102 resolved; Mg Stearate Tier-A/B pair added (legitimate) | 1 duplicate resolved |

**Conclusion:** The May 20 audit's substance-family enumeration + duplicate inventory is still the canonical input list for Round 12 consolidation work. Approximately 11 of the original ~25 duplicate pairs have been resolved (Bucket 1+2+3); ~14 remain queued.

---

## Routing Implications

1. **Retire** `[[catalog-duplicate-sku-audit-ticket]]` memory artifact — the audit it requested has been completed (2026-05-20 baseline + this 2026-05-25 delta addendum). The ticket should be updated to point at these audit documents as the canonical reference, OR superseded entirely if no further action is owed at the audit-scoping layer.

2. **Round 12 consolidation work continues** against the May 20 audit's remaining ~14 duplicate pairs + 5 cross-category splits. This delta addendum does not expand or contract that scope — it just verifies the audit is still actionable.

3. **No new audit work needed** on duplicate-SKU detection until next batch of major catalog additions (Wave 2 Phase 2 or Wave 3 ingestion, whenever those land).

---

## Cross-References

- [docs/audits/duplicate-sku-sweep.md](duplicate-sku-sweep.md) — May 20 baseline audit (canonical input list)
- `[[catalog-duplicate-sku-audit-ticket]]` — ticket memory artifact (now superseded; should be retired or updated)
- `[[supplements-two-wave-ingestion]]` — Tier-A/Tier-B intentional pair doctrine
- `[[feedback-38a-unscoped-grep]]` — methodology used
- `[[feedback-path-b-cat-1-backfill]]` — consolidation discipline applied in Step 0.5a
- `[[persistent-refs-use-names-not-line-numbers]]` — referencing discipline
- Commits referenced:
  - `b7bbc01` — May 20 audit landing
  - `0ae72ab` + `775e323` + `5d5ec62` + `3edb088` — Step 0.5a Bucket 1+2+3 consolidations
  - `5b10e3e` + `fa5b735` + `b8382f8` — Step 0.5b Cluster 1+2+3 renames
  - `fcde45e` — Step 0.5c.i Specialty Compounds migration
  - `0d2188b` — Magtein synonym normalization fix
  - `7c387c2` — Krill Oil FALCPA string upgrade
  - `9214abf` — addedSugars + FALCPA species notation enrichment pass
  - `c93b78d` — HEAD at time of delta audit
