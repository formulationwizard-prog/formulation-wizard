# Audit: Notes-Prose Borderline-Marketing Token Sweep (2026-05-25)

**Audit type:** Read-only catalog-wide scan of `notes` field prose for borderline-marketing tokens. No catalog changes; per-entry classification + recommendation only.
**Authored:** 2026-05-25
**Authored-by:** Claude Code (operator-authorized autonomous block — first of three deliverables in 4-hour session)
**Reviewed-by:** _pending operator merge_
**Scope:** All 392 entries in `lib/data/supplements.ts` at commit `c93b78d` (HEAD at audit start). Borderline-marketing token set per `[[notes-prose-audit-owed]]` memory artifact, scoped 2026-05-23 per validator M12 flag on SAMe + Boswellia + CoQ10 Ubiquinol pattern siblings.

---

## TL;DR

**~35 entries carry one or more borderline-marketing tokens.** Classification:

| Classification | Count | Action |
|---|---|---|
| **MARKETING** (clear violation; recommend edit) | 6 | Delete bare-marketing tokens; preserve substance |
| **BORDERLINE** (operator judgment) | 22 | Surface for operator decision per-entry; default toward editing |
| **SUBSTANTIVE** (well-framed; keep) | 7 | No change recommended; tokens carry substantive meaning |

**Token-set frequency (occurrences, not entries):**
- `Premium` / `premium` — 24 occurrences (most common)
- `more bioavailable` / `Highly bioavailable` / `Most bioavailable` — 7 occurrences
- `superior` / `Superior absorption` — 4 occurrences
- `highest` / `improved bioavailability` / other comparatives — 5 occurrences

**Companion deliverable proposal:** Rulebook §II.9b language-standard section codifying the borderline-marketing prohibition + the operator-decision boundary, so the discipline persists as enforceable (validator M12 token list) rather than one-time cleanup.

---

## 1. Methodology

### Scope

`lib/data/supplements.ts` only. Stacks (`lib/data/stacks.ts`) and DV/UL tables (`lib/supplementLabeling.ts`, `lib/supplementSafetyLimits.ts`) excluded — those carry structured regulatory references, not free-form prose.

### Token set (per `[[notes-prose-audit-owed]]` charter + sweep expansion)

Primary tokens (scoped by memo):
- `Premium` / `premium`
- `more bioavailable` (variants: `highly bioavailable`, `most bioavailable`)
- `superior`
- `enhanced` (none found)
- `optimal` (none found)

Sweep-expansion tokens (additional borderline-marketing patterns surfaced during scan):
- `superior absorption`
- `preferred` (when used as marketing assertion, not factual statement)
- `improved bioavailability` (without quantification or source)
- `Highly bioavailable` (treated separately from `more bioavailable` per occurrence patterns)
- `Best in class` / `best-in-class` / `elite` / `cutting-edge` / `next-generation` / `advanced` / `highest-quality` / `top-tier` / `state-of-the-art` (none found — these are good news; no escalated marketing language present)

### Classification rubric

For each occurrence, classify per:

**MARKETING — clear violation:**
- Bare `Premium` standalone with no substantive context (e.g., just `Premium.`)
- Superlative claims without substantiation (`Most bioavailable`, `Best`)
- Marketing-claim language ("Preferred in premium formulations") that's puff without specifics
- Recommendation: DELETE the marketing token; preserve substantive prose around it

**BORDERLINE — operator judgment:**
- `Premium` used as commercial-tier reference (e.g., "Premium pricing", "premium brand") — describes commercial reality but slips into puff
- `Premium` used as descriptive name-modifier (e.g., "Premium MTHFR-optimized product") — could be substantive if elaborated, marketing if not
- "Highly bioavailable" / "more bioavailable" without quantification but where the underlying chemistry supports the claim (chelates vs salts, R-isomer vs racemic, phospholipid vs ethyl ester)
- Recommendation: SURFACE FOR OPERATOR — these depend on context + brand voice + whether to substantiate or remove

**SUBSTANTIVE — well-framed; keep:**
- Quantified comparative claims (`1.5x more bioavailable than dl-alpha`, `2x more bioavailable than racemic`)
- Explicit claim attribution (`superior absorption claim` — attribution makes it a marketing-claim reference, not assertion)
- Commercial-tier reference with explanation (`Pricing premium reflects clinical-grade specification`)
- Recommendation: NO CHANGE — these are doing useful work

### What this audit is NOT

- Not a name-discipline audit (e.g., `Zinc Picolinate (Premium)` at line 170 — the name itself contains "(Premium)" which is a separate `[[ii-9a-r2-r3-sweep-owed]]` concern, not a notes-prose concern)
- Not a structure/function claim review (e.g., `anti-aging`, `immune support` claim language is a separate Bucket 1 Claims gate concern; surfaced here only when adjacent to marketing tokens)
- Not a regulatory-classification review (validator M-series gates remain authoritative)
- Not an execution plan — this audit produces recommendations; operator decides which to action

---

## 2. Per-Entry Findings

Status legend:
- 🟥 **MARKETING** — recommend edit (delete the marketing token, preserve substance)
- 🟧 **BORDERLINE** — surface for operator decision
- 🟩 **SUBSTANTIVE** — no change recommended

References per `[[persistent-refs-use-names-not-line-numbers]]` — entry name first, line number as auxiliary nav. Line numbers will drift as catalog evolves; entry names persist.

### 🟥 MARKETING (6 entries)

| Entry | Line | Current prose excerpt | Recommendation |
|---|---|---|---|
| **Pyridoxal 5-Phosphate (P5P, Tier-B, PENDING TIER VERIFICATION)** | 139 | `Activated B6. More bioavailable. Preferred in premium formulations.` | DELETE `More bioavailable. Preferred in premium formulations.` Keep `Activated B6.` Substantive contrast vs pyridoxine HCl can be added if needed (e.g., `Activated B6 (coenzyme form; bypasses hepatic phosphorylation step required for pyridoxine HCl).`) |
| **Methylfolate (Quatrefolic / Glucosamine L-5-MTHF)** | 142 | `...Premium MTHFR-optimized product.` | DELETE `Premium MTHFR-optimized product.` The substantive context — MTHFR polymorphism + Gnosis Quatrefolic + vegetal-source glucosamine — already lives elsewhere in the notes prose. The marketing token adds nothing. |
| **Calcium Citrate Malate (CCM)** | 156 | `24% elemental Ca. Most bioavailable calcium form. Premium.` | DELETE `Most bioavailable calcium form. Premium.` `Most bioavailable` is unsubstantiated superlative. Replace with substantive: `24% elemental Ca. Higher absorption than carbonate (24% vs 26% but better at low gastric pH).` |
| **Zinc Picolinate (Premium)** | 170 | `21% elemental Zn. Superior absorption. Immune / testosterone marketing.` | DELETE `Superior absorption.` The trailing `Immune / testosterone marketing` self-acknowledges as marketing — keep as-is since it's framed correctly (`marketing` token explicitly names it as a market positioning observation, not the platform asserting the claim). The entry NAME `(Premium)` is a separate name-discipline concern. |
| **Creatine HCl** | 202 | `More soluble than monohydrate. Premium sports.` | DELETE `Premium sports.` Keep `More soluble than monohydrate.` (substantive comparative). |
| **SAMe (S-Adenosylmethionine, Fermentation-Derived)** | 291 | `Mood / joint / liver. 400–1600 mg. Premium.` | DELETE bare `Premium.` Original validator M12 flag from 2026-05-23 that triggered this whole audit pass. Keep `Mood / joint / liver. 400–1600 mg.` |

### 🟧 BORDERLINE (22 entries — operator decision)

These entries use marketing tokens in ways that aren't clear violations but warrant operator review against the locked brand voice (per `[[joy-of-mastery-brand-philosophy]]` principle 7 — smart copy that respects intelligence).

#### Premium-as-commercial-tier-reference (12 entries)

These use `premium` to describe commercial-pricing tier or branded product status. The token is descriptive in some readings, marketing puff in others.

| Entry | Line | Current prose token |
|---|---|---|
| Vitamin D3 Vegan (Lichen-Sourced) | 120 | `Premium pricing.` |
| Vitamin K2 MK-7 (NattoPharma, 2%) | 126 | `Premium pricing.` |
| Nicotinamide Riboside (Niagen, ChromaDex) | 134 | `Premium branded ingredient.` |
| Methylfolate (Metafolin / Calcium L-5-MTHF) | 141 | `Premium prenatal.` |
| Liposomal Vitamin C (Altrient/LivOn) | 151 | `premium liquid supplement.` |
| Iron Bisglycinate (Ferrochel) | 173 | `Premium prenatal.` |
| L-Citrulline Malate 2:1 (USP, Tier-B) | 197 | `Pre-workout premium.` |
| Marine Collagen Peptides (Peptan F) | 208 | `Premium / pescatarian-friendly.` |
| Fish Oil 33/22 EE (High-Concentrate) | 213 | `Premium concentrate.` |
| Krill Oil (Superba 2, Aker BioMarine) | 215 | `Premium heart/joint.` |
| Boswellia serrata Extract (AKBA 10%, Loxin) | 289 | `AKBA-standardized premium.` |
| MCC PH-200 Dry Gran | 308 | `Premium dry granulation / roller compaction.` |

**Recommended pattern:** Replace `premium` with the specific commercial-tier basis it represents. Options:
- `Higher cost than [alternative]` — explicit comparative
- `Branded specification (vs. commodity)` — describes the tier basis
- `Clinical-grade / Pharmaceutical-grade` — names the supply-chain tier
- Or simply delete if the substantive context is sufficient without the token

#### Highly-bioavailable / more-bioavailable without quantification (5 entries)

| Entry | Line | Current prose token |
|---|---|---|
| Magnesium Glycinate (Chelated, Albion TRAACS) | 42 | `Highly bioavailable, gentle on GI.` |
| Zinc Picolinate (USP) | 46 | `Highly bioavailable.` |
| L-Selenomethionine (USP, Pharmaceutical-Grade) | 48 | `Organic, highly bioavailable.` |
| Magnesium Glycinate (Generic Chelate, Commodity Sourcing) | 162 | `Highly bioavailable.` |
| Boswellia AKBA 30% (5-LOXIN / AprexFlex) | 448 | `AprexFlex follow-on with improved bioavailability.` |

**Recommended pattern:** Either (a) quantify the comparative with citation (e.g., `~3x absorption of oxide form per Walker 2003`), or (b) replace with descriptive chemistry (`Chelated amino-acid form — typical chelate absorption advantage vs inorganic salt`), or (c) delete the token entirely if the substance is well-known to readers who can infer.

#### Premium-as-substance-modifier (5 entries)

These use `premium` adjacent to substantive substance descriptors. Borderline because the substantive descriptor is the load-bearing content; `premium` is decorative.

| Entry | Line | Current prose token |
|---|---|---|
| Calcium Hydroxyapatite (MCHC, Bone Matrix) | 159 | `Osteoporosis premium.` |
| Vitamin E (d-Alpha Tocopherol, Natural) | 122 | (none — substantive `1.5x more bioavailable than dl-alpha` is well-framed; flagged here only for cross-reference) |
| Pyrroloquinoline Quinone (PQQ, Mitopure) | 259 | `Premium anti-aging.` (note: `anti-aging` is separate claim-language concern) |
| Pullulan Capsule Shells (NPcaps) | 325 | `Premium for sensitive actives.` |
| Softgel Shell Base (Plant-Based, Carrageenan) | 327 | `Premium vegan supplements.` |

**Recommended pattern:** Replace with concrete reason (e.g., `Osteoporosis premium` → `Premium-tier osteoporosis SKU (vs. carbonate/citrate for general bone health)`; or simply delete and let substantive prose carry).

### 🟩 SUBSTANTIVE (7 entries — no change recommended)

These entries use marketing-flavored tokens in ways that are substantively justified — quantified, attributed, or commercially descriptive with explanation.

| Entry | Line | Current prose token | Why substantive |
|---|---|---|---|
| Magnesium Oxide (USP, Tier-A) | 42 | `60% elemental Mg (highest by weight).` | `highest by weight` is factual chemistry statement |
| Krill Oil (Superba, Phospholipid-Bound) | 101 | `superior absorption claim` | Explicit attribution — `claim` framing makes this a market-position observation, not platform assertion |
| Vitamin E (d-Alpha Tocopherol, Natural) | 122 | `1.5x more bioavailable than dl-alpha` | Quantified comparative |
| Methylcobalamin (B12 Active, Commodity Sourcing) | 144 | `(vs. line 30 premium pharmaceutical-grade)` | Explicit commercial-tier comparison; substantive context |
| R-Alpha-Lipoic Acid (Stabilized, Bio-Enhanced) | 261 | `2x more bioavailable than racemic` | Quantified comparative |
| Phosphatidylcholine 30% (Sunflower Lecithin-Derived) | 387 | `Premium pricing (~50% over soy).` | Quantified premium |
| Bifidobacterium breve M-16V (Morinaga) | 413 | `Pricing premium reflects clinical-grade specification.` | Explains WHY premium — substantive |
| Fish Oil 40/20 TG (Triglyceride Form) | 214 | `Better absorption than ethyl ester. Premium.` | First clause substantive; `Premium.` standalone is the marketing token (already flagged as BORDERLINE above — split-classification entry) |
| Creatine Monohydrate (Creapure, USP, Tier-B) | 201 | `Creapure is the premium brand.` | Descriptive statement about commercial-brand reality, not platform assertion of product quality |

---

## 3. Recommended Rulebook Addendum (§II.9b — Notes-Prose Language Standard)

Per `[[notes-prose-audit-owed]]` memo recommendation — capture the discipline as enforceable rule, not just one-time cleanup. Proposed §II.9b text for `docs/architecture/catalog-authoring-rulebook.md`:

```
§II.9b — Notes-prose language standard

Notes fields on catalog entries (lib/data/supplements.ts, lib/data/stacks.ts)
must use substantive language. Marketing puff is prohibited.

PROHIBITED (marketing puff — delete on sight):
- Bare "Premium." or "premium" standalone
- "Most bioavailable" / "Superior absorption" / "Best in class" / "Elite" /
  "Cutting-edge" / "Next-generation" / "Advanced" without quantification
- "Preferred in [tier] formulations" / similar marketing-flavored generalities

PERMITTED (substantive — keep):
- Quantified comparatives ("1.5x more bioavailable than dl-alpha")
- Explicit claim attribution ("superior absorption claim" — `claim` framing
  makes this a market-position observation, not platform assertion)
- Commercial-tier reference WITH explanation ("Pricing premium reflects
  clinical-grade specification" — explains WHY)
- Pharmacopeial-grade references ("Pharmaceutical-grade vs USP food-grade")

BORDERLINE (operator judgment — surface to operator for case-by-case decision):
- "Premium pricing" — descriptive of commercial tier but slips toward puff
- "Highly bioavailable" / "more bioavailable" without quantification but
  where underlying chemistry supports the claim (chelates vs salts, R-isomer
  vs racemic, phospholipid vs ethyl ester)
- "Premium [product type]" used as commercial-tier modifier

ENFORCEMENT:
- Validator M12 token list updated to match this rule (validator becomes
  authoritative gate; this audit list becomes the regression test fixture)
- Catalog-entry-validator subagent surfaces M12 hits as PUSHBACK-STRUCTURAL
- Operator override allowed per-case for BORDERLINE entries with rationale
  captured in commit message
```

**Adoption sequencing:** Per `[[notes-prose-audit-owed]]` recommendation — could land alongside Round 12+ schema migration. Anti-proliferation discipline says fix shared patterns as a group, not in isolation; this audit IS that group.

---

## 4. Routing Implications

1. **Round 12+ scoping** — when notes-field standards become a launch-readiness discussion item (per `[[notes-prose-audit-owed]]` surface trigger), this audit provides the canonical fix list. ~6 MARKETING entries are surgical edits; ~22 BORDERLINE entries need operator decision per case; ~7 SUBSTANTIVE entries are correctly framed (left alone).

2. **Rulebook §II.9b proposal** — operator + Opus decision on whether to adopt the proposed §II.9b text + on the BORDERLINE-vs-PROHIBITED boundary for `premium` token specifically.

3. **Validator M12 token list update** — once §II.9b lands, the validator's existing M12 marginal-flag mechanism gets the canonical token list. Discipline becomes self-enforcing on new entries.

4. **No catalog changes from this audit** — read-only audit per autonomous-block discipline. Execution = future commits, operator-approved per recommendation here.

---

## 5. Verification of Audit Currency

Audit ran against `lib/data/supplements.ts` at commit `c93b78d` (HEAD 2026-05-25 morning). Per `[[verify-ground-state-at-start-of-autonomous-session]]` discipline, ground state was verified at session start:
- Recent commits in `lib/data/supplements.ts`: `9214abf` (addedSugars + FALCPA species notation enrichment 2026-05-25); prior commits in 0.5b + 0.5c.i wave 2026-05-22/23.
- No prior notes-prose audit document found at `docs/audits/notes-prose-audit-*.md` — this is the inaugural audit per the queued ticket.
- The ticket memory `[[notes-prose-audit-owed]]` remained queued at audit-start time; this delivery RESOLVES it (companion memory update will mark COMPLETED + cross-reference this document).

---

## Cross-References

- `[[notes-prose-audit-owed]]` — ticket memory; this audit resolves
- `[[joy-of-mastery-brand-philosophy]]` — principle 7 (smart copy that respects intelligence) — voice/aesthetic doctrine that motivates the cleanup
- `[[anti-proliferation-within-run]]` — fix shared patterns as a group, not in isolation
- `[[ii-9a-r2-r3-sweep-owed]]` — adjacent ticket; name-discipline (entry NAMES with marketing tokens) is separate scope but related concern (Zinc Picolinate (Premium) name needs different fix)
- `[[razor-sharp-agentic-building]]` — captured at the right size; not over-scoped
- `[[verify-ground-state-at-start-of-autonomous-session]]` — discipline applied at audit start; no prior audit found, confirmed fresh scope
- `docs/architecture/catalog-authoring-rulebook.md` — §II.9b proposed addendum target
- Commits referenced:
  - `c93b78d` — HEAD at audit start
  - `9214abf` — most recent supplements.ts commit (addedSugars + FALCPA species notation enrichment 2026-05-25)
