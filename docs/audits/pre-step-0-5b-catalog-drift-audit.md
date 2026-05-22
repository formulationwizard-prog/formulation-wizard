# Catalog Drift Audit — §II.9a Refinements (Pre-Step-0.5b)

**Authored:** 2026-05-22 (read-only audit pass during unattended CC execution per operator Items 1+2 routing 2026-05-22).
**Purpose:** Surface pre-Step-0.5b §II.9a violation candidates beyond what Q-Audit-1 routed; produce reference findings document for future per-pair routing or Step 0.5b execution planning.
**Scope:** `lib/data/supplements.ts` — display-name pattern audit against the five §II.9a qualifier-discipline refinements committed at `docs/architecture/catalog-authoring-rulebook.md` (§II.9a refinements committed 2026-05-20 at hash `159de40`).
**Method:** Mechanical grep pass with manual disambiguation of false positives; no commits to catalog data; findings classified by routing disposition.

---

## Summary

| Refinement | Pattern | Findings | Disposition |
|---|---|---|---|
| **Refinement 1** | Regulatory-baseline solo qualifiers (USP / Food-Grade / GRAS as sole differentiator) | 13 already-routed via Q-Audit-1; 12 standalone-entry `(USP)` names with no current sibling | Mostly informational; 12 standalone names may warrant future per-pair audit when sibling-creation surfaces |
| **Refinement 2** | Borderline-marketing solo qualifiers (Premium / Super / Best / Pure / Ultra) | 1 in display name (B4.2.1 Zinc Picolinate "Premium" — already routed Q-Audit-1) | No new findings beyond Q-Audit-1 |
| **Refinement 3** | "Organic" qualifier overload (Organic claim without structured-field backing) | 2 routed via Q-Audit-1 (B4.2.2 Selenomethionine; B4.8.1 Flaxseed); 1 new candidate (line 189 Silica Horsetail Extract Organic) | 1 candidate for future verification |
| **Refinement 4** | Positioning-in-naming check (brand-name placement; consolidation-erases-positioning) | Discipline pattern not mechanically greppable; MSM (B4.3.3) routed via Q-Audit-1 as worked example | Case-by-case discipline at future per-pair audit sessions |
| **Refinement 5** | Tier-attribution evidence-strength bar | 1 hyphenated-form claim (line 47 Zinc Gluconate "Pharmaceutical-Grade Sourcing" — passes Refinement 5 per uniformly-pharma supplier set); 1 hidden non-hyphenated claim (line 54 L-Lysine HCl "Pharma Grade, 78%" — already in Pattern 1 6A scope) | Line 47 passes; line 54 covered by Pattern 1 queue |

**Material findings beyond Q-Audit-1 scope:** 12 standalone `(USP)` entries (Refinement 1) + 1 Organic-overload candidate (Refinement 3). Total: 13 findings warranting future review.

---

## Refinement 1 — Regulatory-baseline solo qualifiers

### Already-routed entries (Q-Audit-1 covered)

These entries are already in Q-Audit-1 routing scope:

| Line | Entry | Q-Audit-1 routing |
|---|---|---|
| 40 + 157 | Calcium Citrate (USP) [pair] | Bucket 3 B3.3 — Tier-A/Tier-B rename + PENDING |
| 42 + 162 | Magnesium Oxide (USP) [pair] | Bucket 3 B3.1 — Tier-A/Tier-B rename + PENDING |
| 43 + 163 | Magnesium Citrate (USP) [pair] | Bucket 3 B3.2 — Tier-A/Tier-B rename + PENDING |
| 46 | Zinc Picolinate (USP) | B4.2.1 — paired with line 172 Premium; routed to PA queue |
| 48 | Selenium L-Selenomethionine (USP) | Pattern 1 6B — locks as Pharmaceutical-Grade per Refinement 5 (uniformly-pharma supplier set) |
| 49 + 180 | Copper Gluconate (USP) [pair] | Bucket 3 B3.4 — Tier-A/Tier-B rename + PENDING |
| 51 + 190 | Potassium Iodide [pair] (line 51 currently `(USP, Food-Grade)`; line 190 `(USP)`) | Bucket 3 B3.5 — Tier-A/Tier-B rename + PENDING; "Food-Grade" qualifier replaced per Refinement 1 |
| 55 + 198 | L-Arginine HCl (USP) [pair] | Pattern 1 6C — Tier-A/Tier-B rename + PENDING |
| 61 + 203 | L-Carnitine (Tartrate) (USP) [pair] | Bucket 1 B1.4 — line 61 survivor; line 203 deprecate |
| 91 + 295 | Glucosamine Sulfate (USP) [pair] | B4.3.1 — line 91 survivor; line 295 deprecate |
| 54 + 200 | L-Lysine HCl pair (line 54 currently `(Pharma Grade, 78%)`; line 200 `(USP)`) | Pattern 1 6A — Tier-A/Tier-B rename + PENDING; cost inversion + hidden tier-attribution claim flagged |
| 199 | L-Citrulline Malate 2:1 (USP) | Pattern 1 6A — Tier-A/Tier-B rename + PENDING |
| 208 | Taurine (USP) | Pattern 1 6A — Tier-A/Tier-B rename + PENDING |

### Standalone entries with `(USP)` solo qualifier (no current Wave 2 sibling identified)

These entries use `(USP)` as solo qualifier but have no tier-pair sibling in the current catalog. Per §II.9a Refinement 1, the USP qualifier alone doesn't differentiate — but for standalone entries with no sibling, the qualifier may be informational rather than violation. **Future Step 0.5b consideration:** if Step 0.5b adds sibling entries (Wave 1 ↔ Wave 2 expansion), these become per-pair routing candidates.

| Line | Entry | Category | Suppliers (current) |
|---|---|---|---|
| 159 | Calcium Lactate (USP) | Minerals | Corbion (Purac) + Jungbunzlauer |
| 160 | Calcium Gluconate (USP) | Minerals | Jungbunzlauer + Hebei Huarong |
| 169 | Potassium Citrate (USP) | Minerals | Jungbunzlauer + Cargill + Global Calcium |
| 174 | Zinc Citrate (USP) | Minerals | Jungbunzlauer + Dr. Paul Lohmann |
| 176 | Ferrous Sulfate (USP) | Minerals | Dr. Paul Lohmann + Global Calcium |
| 177 | Ferrous Fumarate (USP) | Minerals | Dr. Paul Lohmann + Aarti Drugs |
| 178 | Ferrous Gluconate (USP) | Minerals | Dr. Paul Lohmann + Jungbunzlauer |
| 195 | L-Leucine (USP) | Amino Acids | Kyowa Hakko + Ajinomoto + CJ Bio |
| 196 | L-Isoleucine (USP) | Amino Acids | Kyowa Hakko + Ajinomoto |
| 197 | L-Valine (USP) | Amino Acids | Kyowa Hakko + Ajinomoto |
| 202 | L-Tyrosine (USP) | Amino Acids | Ajinomoto + Evonik |
| 209 | Glycine (USP) | Amino Acids | Ajinomoto + Kyowa Hakko |

### Excipient entries with `(USP)` or `(Food Grade)` (likely legitimate informational qualifier)

| Line | Entry | Note |
|---|---|---|
| 341 | Talc (USP) | Excipient — USP designates pharmacopeial monograph compliance |
| 347 | Gum Arabic (Acacia, Food Grade) | Excipient — "Food Grade" is industry-standard descriptor; not tier-attribution claim |
| 349 | Propylene Glycol (USP) | Excipient — USP monograph compliance |

These appear to be legitimate informational use (USP signals pharmacopeial-grade compliance; Food Grade signals food-application suitability). No action required pending future Step 0.5b per-pair review.

---

## Refinement 2 — Borderline-marketing solo qualifiers

Grep pattern: `Premium | Super | Best | Amazing | Powerful | Synergistic | Ultra | Advanced | Pure | High-Purity`

**Display-name occurrences:** 1
- Line 172 `Zinc Picolinate (Premium)` — already routed Q-Audit-1 B4.2.1 (deferred to Phase 2 PA queue; "Premium" qualifier flagged for replacement regardless of resolution path)

**Notes-field occurrences:** Many (e.g., "Premium pricing", "Premium nootropic", "Super-disintegrant"). These are marketing-context descriptors in the `notes` field, NOT display-name violations. Per §II.9a Refinement 2, the violation is solo-qualifier in NAME — notes-field marketing language is a separate question (tone discipline, not naming discipline). Not in scope for this audit; flagged as candidate for future tone-discipline review session.

**No new findings beyond Q-Audit-1.**

---

## Refinement 3 — "Organic" qualifier overload

### Already-routed entries (Q-Audit-1 covered)

| Line | Entry | Q-Audit-1 routing |
|---|---|---|
| 186 | Selenomethionine (Organic Selenium) | B4.2.2 — rename to `Selenomethionine (Selenium-Yeast, Yeast-Bound Form)`; "Organic" qualifier overload resolved (chemistry-form rather than certification framing) |
| 224 | Flaxseed Oil (Organic, Cold-Pressed) | B4.8.1 — rename to `Flaxseed Oil (Cold-Pressed)`; drop unsupported Organic claim (structured fields didn't back the claim) |

### Legitimately-backed Organic entries (no action needed)

These entries carry `organicAvailable: true` + `sustainabilityCerts: ['usda-organic', ...]` structured backing for the Organic claim. Per §II.9a Refinement 3, Organic IS a legitimate naming qualifier when structured fields back the certification claim.

Lines 360, 361, 362, 363, 364, 365, 368, 369, 372, 373, 374, 377, 378, 379, 380, 383 (and others) — all carry `organicAvailable: true` + `sustainabilityCerts` arrays per grep evidence.

### New candidate for verification

**Line 189 — `Silica (Horsetail Extract, Organic)` (Minerals category)**
- Suppliers: Naturex (Givaudan) + BioSil
- Notes: "Hair / skin / nail marketing. Collagen cofactor."
- **Concern:** "Organic" appears in name; entry's structured-field backing for the claim is unverified via this audit pass (grep surfaced the name match but didn't inspect structured fields for `organicAvailable` + `sustainabilityCerts`). If structured backing is absent, falls into Refinement 3 violation per the B4.8.1 Flaxseed Oil precedent.
- **Disposition:** Future per-pair audit OR Step 0.5b verification — read entry's full field set; if no structured backing, route via §II.9a Refinement 3 rename pattern (drop "Organic" from name OR add structured field backing if substantiated).

---

## Refinement 4 — Positioning-in-naming check

**Pattern:** When consolidation would erase positioning encoded in naming (brand-name placement, form-specificity, source-attribution), supplier-COA verification is required before routing.

**Q-Audit-1 worked example:** B4.3.3 MSM (lines 93 + 297) — line 93 names OptiMSM brand explicitly; line 297 uses USP-only framing. Both list Bergstrom Nutrition as supplier. Routed to PA queue per Refinement 4 push-back (see `docs/pa-verification/2026-05-20-msm-optimsm-vs-usp-disambiguation.md`).

**Mechanically detectable?** No. Refinement 4 requires per-pair comparison of naming + supplier evidence; brand-name placement is judgment-call per pair. This refinement is a **discipline pattern at the per-pair routing layer**, not a mechanical audit target.

**Disposition for future sessions:** Apply Refinement 4 discipline during Step 0.5b execution (per-pair review) and during any future Q-Audit-style structured routing session. No new mechanical findings from this audit pass.

---

## Refinement 5 — Tier-attribution evidence-strength bar

### Hyphenated-form claim (grep on `Pharmaceutical-Grade | Pharma-Grade | Pharmaceutical Grade`)

**Display-name occurrences with tier attribution:** 1
- Line 47 `Zinc Gluconate (USP, Pharmaceutical-Grade Sourcing)` — suppliers Jungbunzlauer + Gadot Biochemical + Dr. Paul Lohmann (recognized pharma-grade specialists; uniformly-pharma supplier set per the line 48 lock pattern)

**Refinement 5 evaluation:** Per §II.9a Refinement 5, single-entry tier-attribution lock requires uniformly-pharma supplier evidence. Line 47 supplier set is Jungbunzlauer (mineral/citrate specialist; pharmaceutical-grade producer) + Gadot Biochemical (pharmaceutical/food-grade chemical manufacturer) + Dr. Paul Lohmann (cited 30+ times in catalog as pharma-tier reference supplier). **Passes Refinement 5 bar.** No action required.

### Hidden non-hyphenated claim (surfaced via secondary grep pattern `Pharma Grade`)

- Line 54 `L-Lysine HCl (Pharma Grade, 78%)` — tier-attribution claim in non-hyphenated form
- Suppliers: Ajinomoto + CJ CheilJedang + ADM + Evonik

**Status:** Already in Q-Audit-1 Pattern 1 6A routing scope (B4.1.6); renames to `L-Lysine HCl (USP, Tier-A)` PENDING TIER VERIFICATION during Step 0.5b. The hidden tier-attribution claim is captured in the Pattern 1 queue file as an additional verification dimension on the B4.1.6 pair.

**Audit-methodology finding:** The hyphenated-form grep alone misses non-hyphenated variants. Future Refinement 5 audit passes should use both `Pharmaceutical-Grade` AND `Pharma Grade` (without hyphen) AND `Pharmaceutical Grade` (without hyphen). Captured here as audit-method refinement for the future structured-audit playbook.

---

## Material findings summary

**13 findings warranting future review:**

1. **12 standalone `(USP)` entries** (Refinement 1) — Calcium Lactate (line 159), Calcium Gluconate (160), Potassium Citrate (169), Zinc Citrate (174), Ferrous Sulfate (176), Ferrous Fumarate (177), Ferrous Gluconate (178), L-Leucine (195), L-Isoleucine (196), L-Valine (197), L-Tyrosine (202), Glycine (209). Informational at standalone; per-pair candidates if Step 0.5b adds Wave 2 sibling entries.

2. **1 Organic-overload candidate** (Refinement 3) — Line 189 `Silica (Horsetail Extract, Organic)`. Needs structured-field verification (`organicAvailable` + `sustainabilityCerts`) before classifying as violation or legitimate.

**No new findings on Refinements 2, 4 beyond Q-Audit-1 routing. Refinement 5 findings (1 hyphenated + 1 non-hyphenated) both already covered in existing routing scope.**

---

## Disposition

This audit is **read-only reference material**, not a routing artifact. Findings inform future Step 0.5b execution + per-pair audit routing sessions. No commits to catalog data result from this audit pass; no PA queue files are authored from these findings (Refinement 1 standalone findings + Refinement 3 candidate don't yet warrant PA-verification queue entries — they warrant operator-level per-pair routing during Step 0.5b execution, or sibling-entry-creation analysis during Wave 2 expansion planning).

**Operator review at next structured session:** confirm whether the 12 standalone-`(USP)` entries are intentional Wave-1-only entries with no expected Wave 2 expansion, OR whether Wave 2 expansion will surface tier-pairs that require per-pair routing.

**Audit methodology refinement captured:** future Refinement 5 audit passes should grep both hyphenated AND non-hyphenated tier-attribution patterns (`Pharmaceutical-Grade`, `Pharma-Grade`, `Pharmaceutical Grade`, `Pharma Grade`) to avoid missing hidden tier-attribution claims like line 54.

---

## Cross-references

- `docs/audits/q-audit-1-final-routing.md` — Q-Audit-1 per-pair routing scope (covers majority of Refinement 1 + Refinement 2 + Refinement 3 issues)
- `docs/architecture/catalog-authoring-rulebook.md` §II.9a — five qualifier-discipline refinements (committed 2026-05-20 at `159de40`)
- `docs/architecture/cost-and-vendor-architecture.md` §3 — manufacturer/vendor distinction (affects how standalone-USP findings restructure post-Step-1)
- `docs/audits/duplicate-sku-sweep.md` — Audit #1 evidence base (broader catalog-content audit)
- `docs/pa-verification/2026-05-20-bucket-3-tier-pair-verifications.md` — Bucket 3 tier-pair verification queue (covers 5 of the already-routed Refinement 1 pairs)
- `docs/pa-verification/2026-05-20-pattern-1-tier-pair-verifications.md` — Pattern 1 tier-pair verification queue (covers 11 of the already-routed Refinement 1 pairs including B4.1.6 hidden tier-attribution)

— Catalog Drift Audit (§II.9a Refinements) — read-only audit pass authored 2026-05-22; findings inform future Step 0.5b execution + per-pair audit routing.
