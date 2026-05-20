# Catalog Entry Validator v1 — Rulebook Extraction

**Status:** Step 1 deliverable for Catalog Entry Validator v1 build. Pause for Opus review before Step 2 (subagent definition).
**Source:** `docs/architecture/catalog-authoring-rulebook.md` (v1, 1190 lines).
**Date:** 2026-05-19.
**Scope:** Decompose every rulebook rule into one of four buckets — mechanical, judgment-call, hybrid, or coverage-gap. The v1 agent enforces mechanical bucket directly, surfaces hybrid bucket as mixed-mode pushback, and routes judgment + coverage-gap buckets via the routing-question mode.

**Diff-input clarification (operator-locked):** the agent reads the diff to identify *which entries are touched*, then runs all checks against the **post-diff state of those entries in the post-diff full catalog**. Not "check the changed lines"; "check the changed entries in their full context." Backfills, schema upgrades, and net-new entries all run through the same logic.

**Step-1.5 refinement pass (2026-05-19, post-Opus-review):** Five refinements integrated after the initial extraction. Grep-verified inputs:

1. M2 reframed with explicit informational-vs-blocking semantics (prevents false-negative blocks and prevents the monitoring report from being ignored).
2. H3 heuristic-classification routing extended with explicit "no-match" + "multi-match" fallback (Sunflower Lecithin (Liquid) case: source AND form qualifiers both match → routing-question with low confidence).
3. Gap 2 bioavailability-differential calibration footnote added (slope cutoff: active-form-vs-precursor OR ≥ peer-reviewed bioequivalence-study AUC differential at typical-use dose; prevents over-firing on routine multi-form mineral entries).
4. H8 references the canonical PA-queue template at [docs/pa-verification/README.md](docs/pa-verification/README.md); routes among three adjacent queues (regulatory PA / supplier-spec / strain-licensing) per the README's distinction.
5. Gap 5 default revised to remove the invented `stackFitNote` schema reference (confirmed absent in `lib/`+`types/` per grep). Per [[feedback_refactors_wait_for_stable_data_layer]], the existing `notes` field on `IndustrialIngredient` carries any partial-fit reason; no new schema field invented for v1.

**Existing helpers referenced throughout:**

| Helper | Location | Purpose |
|---|---|---|
| `normalizeIngredientName` | [lib/parseFormula.ts:332](lib/parseFormula.ts#L332) | Lowercase / strip parentheticals / dashes→spaces / punctuation→strip / whitespace-collapse. Definitive normalization for synonym collision checks. |
| `findBySynonym` | [lib/parseFormula.ts:348](lib/parseFormula.ts#L348) | Tier 1 synonym match against `IndustrialIngredient.synonyms[]`. |
| `findHarmCriticalSiblings` | [lib/parseFormula.ts:405](lib/parseFormula.ts#L405) (module-private) | Returns sibling entries in same family that differ on harm-critical predicates. |
| `harmCriticalDifferenceExists` | [lib/supplementHarmCritical.ts:116](lib/supplementHarmCritical.ts#L116) | Composed predicate: allergen ∨ identity-test ∨ regulatory-status differential. |
| `allergenProfileDiffers` | [lib/supplementHarmCritical.ts:48](lib/supplementHarmCritical.ts#L48) | Set-comparison sub-predicate. |
| `regulatoryStatusDiffers` | [lib/supplementHarmCritical.ts:92](lib/supplementHarmCritical.ts#L92) | Two-state explicit-only sub-predicate. |
| `identityTestRequirementDiffers` | [lib/supplementHarmCritical.ts:74](lib/supplementHarmCritical.ts#L74) | Forward-compat stub; returns false until Wave 2+ data lands. |
| `findDVEntry` | [lib/supplementLabeling.ts:173](lib/supplementLabeling.ts#L173) | DV-table lookup by `dvKeyword`. |
| `parsePastedFormula` | [lib/parseFormula.ts:717](lib/parseFormula.ts#L717) | End-to-end bulk-paste resolution. Used by test-shape verification (§VI.30). |

---

## Inventory 1 — Mechanical Rules

Pure mechanical checks: presence/absence of a field, enum membership, string-match against a forbidden/required list, cross-field consistency within an entry, cross-entry consistency against the catalog, test-file presence in `lib/__tests__/`. The agent runs these directly with no human judgment required.

| # | Rule | What it checks | Mechanical check | Evidence agent needs | Existing helper |
|---|---|---|---|---|---|
| M1 | §I.2 citation format | Every load-bearing field traceable to `citation: { authority, source, tier }` | Presence + shape check on `citation` field | Entry's `citation` field | — |
| M2 | §I.2 90% Tier-1–4 rule | ≥90% of catalog entries cite Tier 1–4 | Aggregate count across post-diff catalog | All entries' `citation.tier` | — *(catalog-level INFORMATIONAL ONLY; see §M2-framing below)* |
| M3 | §I.4 confidenceLevel enum | Every entry has `confidenceLevel` from the 5-enum (Verified-Lab / Verified-Supplier-COA / Estimated / Inferred / Undocumented) | Enum membership | `confidenceLevel` field | — |
| M4 | §I.5 harm-critical floor → UNDOCUMENTED default | When `allergens` / `drugInteractions` / `regulatoryStatus.US` / `ndiStatus` are empty, entry is explicitly Undocumented (not silently empty) | Cross-field: empty harm-critical fields ⇒ `confidenceLevel === 'Undocumented'` OR explicit `allergensInvestigated: true, allergensFound: []` flag for allergens | Entry's harm-critical fields + confidenceLevel | — |
| M5 | §II.8 per-category required fields | Vitamins: dv/unit/dvKeyword. Minerals: elementalFactor/dv/unit/dvKeyword/ul/formNotes. Probiotics: strainId/cfuPerGram/viableThroughExpiry/licensingTier/requiresColdChain. (etc., full table in §II.8.) | Per-category presence check via category-specific field list | Entry's `category` + the required-field set for that category | — |
| M6 | §II.8a synonyms ≥ 2 | Every entry from Wave 1.5+ carries `synonyms?: string[]` with ≥ 2 names | `entry.synonyms.length >= 2` | Entry's `synonyms` array | — |
| M7 | §II.8a synonyms lowercase | All synonyms stored lowercase | `s === s.toLowerCase()` for every synonym | Entry's `synonyms` array | — |
| M8 | §II.8a no capitalization-variant bloat | No synonyms differ only in case (e.g., `['Folate', 'FOLATE', 'folate']` forbidden) | Lowercase-dedupe; `Set(synonyms.map(toLowerCase)).size === synonyms.length` | Entry's `synonyms` array | — |
| M9 | §II.8a no within-entry duplicate synonyms | No repeated synonym strings within an entry | `new Set(synonyms).size === synonyms.length` | Entry's `synonyms` array | — |
| M10 | §II.8a no cross-catalog normalized collisions | No two entries share a normalized synonym | For each new/changed synonym, `normalizeIngredientName(s)` against every other entry's normalized synonyms | All entries' synonyms (post-diff catalog) | `normalizeIngredientName` |
| M11 | §II.9 forbidden Class-3 claims in display name | Display name MUST NOT contain "vegan", "non-gmo", "allergen-free", "gluten-free", "soy-free", "kosher", "halal" (these are Class-3 buyer requirements; belong in structured fields) | Substring match against forbidden-word list (case-insensitive) | Entry's `name` field | — |
| M12 | §II.9 + AP-09 no marketing copy | Display name + `hazard`/`mitigation`/`evidenceNote` MUST NOT contain "premium", "super", "best", "amazing", "powerful", "synergistic", "ultra", "advanced", "pure" | Substring match against marketing-word list (case-insensitive) | Entry's `name`, `hazard`, `mitigation`, `evidenceNote` fields | — |
| M13 | §II.13 nutrition/bioactives consistency | Same-compound value matches across `nutrition` and `bioactives` fields | For each compound present in both, `nutrition[c] === bioactives[c]` | Entry's `nutrition` + `bioactives` objects | — |
| M14 | §II.14 regulatoryStatus schema | `regulatoryStatus` is a record keyed by jurisdiction; `US` key required | Schema-shape check; `regulatoryStatus.US` defined | Entry's `regulatoryStatus` object | — |
| M15 | §III.15 category enum | `category` ∈ {14 named categories ∪ legacy "Specialty"/"Specialty Compounds" synonym pair} | Enum membership | Entry's `category` field | — |
| M16 | §V.25 PENDING-suffix when supplier-spec unverified | Entries with supplier-spec confidence below Verified-Supplier-COA carry " PENDING" in display name | If any structured field's confidence is below Verified-Supplier-COA AND no PENDING suffix → fail | Entry's `name` + per-field confidence metadata | — |
| M17 | §V.28 lastReviewedDate + reviewedBy presence | Every entry carries both fields | Presence check | Entry's `lastReviewedDate` + `reviewedBy` | — |
| M18 | §VI.29 three tests in `__tests__/` | At least one bulk-paste test + SFP-render test + safety-engine test per entry, in `lib/__tests__/supplement-catalog-{category}.test.ts` | Test-file existence + grep for entry name across the three test types | Entry name + test files | — *(could add a one-time `assertEntryHasThreeTests` helper as a v1.5 follow-up)* |
| M19 | §VIII.38a multi-keyword grep | Before authoring, grep `lib/data/supplements.ts` with (a) primary consumer name, (b) formal-SKU pattern, (c) active-form/branded variants, (d) class designator | Agent runs Grep itself with the 4-class keyword pattern; reports matches | Proposed entry's name + family-pattern keywords | — *(agent's own Grep tool)* |
| M20 | §VIII.38a Cat 1 vs Cat 2 decision | If §38a grep returns matches → Cat 1 (matchability fix); if none → Cat 2 (new entry) | Pure mechanical from grep result | Grep result count | — |
| M21 | §IX.40 17-item pre-commit checklist (composite) | Each item green-or-explicitly-justified; items map to M1–M20 + H4–H7 | Aggregate over per-item rules | Composite | — |
| M22 | Appendix A functional-tag evidenceNote presence | Every functional tag has an accompanying `evidenceNote` referencing threshold + Tier-1/2 authority OR PubMed-indexed trial | Per-tag presence check on `evidenceNote` | Entry's `functionalTags` + `evidenceNote` | — |
| M23 | Appendix B Tier-3 strain lookup (known strains) | For Probiotics entries, if strain name matches an Appendix B Tier-3 entry, entry must be PENDING-suffix until licensing confirmed | Direct lookup against Appendix B table | Entry's `strainId` + Appendix B | — |
| M24 | AP-02 empty harm-critical not rendered "no concerns" | If `allergens` empty AND `confidenceLevel` claims Verified-* → fail | Cross-field consistency (special case of M4) | Same as M4 | — |

**Catalog-level vs per-entry gates:** M2 is a catalog aggregate, not an entry gate. The agent reports it on every run but does not block a single entry on it. All others are per-entry.

**§M2-framing (explicit informational-vs-blocking semantics):** the agent MUST report M2 on every run as informational output in a clearly-labeled section (e.g., "Catalog-wide Tier-1–4 citation rate: 87% post-diff, threshold 90% — proposed entry contributes Tier-<N> citation; net effect: -0.3% / +0.5%"). The agent MUST NOT block individual entry green-lighting on M2 status. The framing prevents two failure modes: (a) authors taking M2 status as a false-negative block on an otherwise-passing entry, and (b) authors ignoring M2 output entirely because it appears in the same channel as blocking checks. Step 2's subagent definition will codify this as a separate output section labeled "Catalog Health (informational)" distinct from "Entry Verdict (blocking)."

**Note on M22:** the agent confirms the *presence* of `evidenceNote` with the right shape. Whether the cited evidence actually substantiates the tag at typical-use dose is hybrid (see H6).

---

## Inventory 2 — Judgment-Call Rules

Rules where the *substance* of the call requires human reading, weighing, or proposing. The agent's value here is precise routing-question framing — naming the rule, the conflict, and the candidate options. Generic "I'm not sure" is the anti-pattern.

### J1 — §I.7 conflict-resolution priority calls
**Why judgment:** when a directive (operator or memory) conflicts with the rulebook, the rule says push back. The agent can detect the conflict (mechanical) but proposing alternatives that respect the conflict hierarchy is authoring judgment.
**Routing-question framing:**
> "Directive '<verbatim>' conflicts with §<rule-id>: <rule-text>. Per §I.7 conflict-resolution ladder, harm-critical (§I.5) > authority (§I.2) > operator-blocking severity (§IV.20) > trend (§IV.19) > preference. Candidate alternatives: (a) <compliant-option-1>, (b) <compliant-option-2>. Which to apply, or escalate to operator?"

**Evidence agent surfaces:** the verbatim conflicting text + the cited rule excerpt + 2–3 compliant alternatives derived from the rule's stated remediations.

### J2 — §III.17 splitting categories
**Why judgment:** meta-decision about taxonomy. §III.17 names the trigger (≥ 4 entries don't share defining property) but the call to actually split is operator-level.
**Routing-question framing:**
> "Category <X> currently holds <N> entries (post-diff). <M> of them appear to not share the category's defining property: <list>. Per §III.17, a split MAY be warranted (≥ 4 mis-filed entries threshold). Per [[feedback_refactors_wait_for_stable_data_layer]], category splits typically defer until Wave 5 lands. Defer (default), propose split now, or flag as ticket?"

**Evidence agent surfaces:** the mis-filed candidate list with the structured-field criteria the agent matched against.

### J3 — §III.18 primary-mechanism category assignment for multi-mechanism entries
**Why judgment:** §III.18 names "primary functional mechanism wins" but identifying THE primary mechanism for an entry with two valid mechanisms (enzyme-AND-antioxidant; mineral-AND-cognitive-specialty) is reading-level judgment.
**Routing-question framing:**
> "Entry <X> has plausible primary mechanism in category <A> (mechanism: <M1>, evidence: <cite>) OR category <B> (mechanism: <M2>, evidence: <cite>). Per §III.18, primary functional mechanism wins; secondary becomes a tag. At typical-use dose <D>, which mechanism is primary?"

**Evidence agent surfaces:** the two candidate categories + each's mechanism cite + the entry's typical-use dose for context.

### J4 — §IV.20 severity-tier assignment for novel ingredients
**Why judgment:** S1 requires top-100-paste position (which the agent can verify from competitor sweep data IF current). S2 requires §VII.34 stack membership (mechanical lookup). S3/S4 default for everything else, but the call between them is judgment.
**Routing-question framing:**
> "Entry <X>: not in current top-100 §IV.21 paste-list (no S1). Not in mustHave/commonCompanion of any §VII.34 stack (no S2 by stacks-derived check). Trending evidence: <trend signals from sweep>. Per §IV.20, defaults to S3 (PA queue first) unless operator surfaces specific blocking customer request (S1-override). Confirm S3 or escalate?"

**Evidence agent surfaces:** competitor-paste lookup result + stack-membership lookup + any trend signals from the most recent §IV.19 sweep.

### J5 — §IV.23 saturation test (when to STOP adding SKU variants)
**Why judgment:** §IV.23 lists valid vs invalid differentiation reasons but the call ("is this 4th variant warranted?") requires comparing the proposed variant's differentiation against the existing 3.
**Routing-question framing:**
> "Catalog has <N> existing variants of <nutrient>: <variant list with differentiation>. Proposed <N+1>th variant differentiates on: <differentiation>. Per §IV.23, valid differentiation reasons: form / supplier-tier / certification / standardization / carrier. Invalid: supplier rebrand / country-of-origin / buyer-requirement variation. The proposed differentiation appears to be <agent's read>. Confirm valid, or propose deprecation of weakest existing variant per §IV.23?"

**Evidence agent surfaces:** the existing variants with their differentiation axis + the proposed variant's differentiation + agent's preliminary read.

### J6 — §VII.36 stack evolution (add/modify/deprecate)
**Why judgment:** stack evolution is meta-decision; not an entry-level rule.
**Routing-question framing:**
> "Proposing <stack action> on STACK.<X>: <description>. Per §VII.36, add requires ≥ 3 operator paste support; modify tracks via versionHistory; deprecate is rare. Operator-paste evidence: <agent's read of any operator-side data>. Defer to round planning, or proceed now?"

**Evidence agent surfaces:** the proposed change + any operator-paste data the agent has access to.

### J7 — §VIII.38a in-commit vs defer-to-later-wave (Miss-mode B resolution)
**Why judgment:** when §38a grep surfaces a pre-existing entry that lacks current-schema fields, the call between in-commit upgrade vs defer is scope + verification-coherence judgment.
**Routing-question framing:**
> "§38a grep surfaced existing entry <E> lacking fields: <missing list>. Verification-coherence with current commit's scope: <agent's read — same entry that surfaced the grep-gap? same family? unrelated?>. Upgrade size: <field count> field(s). Per §38a §1.5d decision rule, in-commit appropriate when (a) verification-coherent AND (b) small (one entry, well-understood fields); defer when incidental OR large. Agent reads: <in-commit / defer>. Confirm?"

**Evidence agent surfaces:** the surfaced entry + its missing fields + verification-coherence assessment + upgrade size.

### J8 — §IX.41 AP-10 PA-skip pressure
**Why judgment:** the rule says don't skip PA; the agent detects when business-pressure framing surfaces in a directive. The call to push back is mechanical (rule conflict detected) but the framing of the alternatives is judgment.
**Routing-question framing:** routes through J1 (conflict-resolution) — same shape.

### J9 — §44 brand-voice phrasing
**Why judgment:** clinical-precise vs marketing-copy is partially mechanical (M12 catches obvious offenders) but stylistic calls remain. "This compound supports cognitive function at clinical dose" — clinical or anthropomorphizing?
**Routing-question framing:**
> "Field <F> contains phrase '<verbatim>'. Per §44 voice rules, this <reads as marketing / anthropomorphizes / is borderline>. Propose alternatives: <agent-rewritten options>. Pick, or override (with justification)?"

**Evidence agent surfaces:** the offending phrase + 2 clinical-precise rewrites + the §44 rule it bumps against.

---

## Inventory 3 — Hybrid Rules

Rules with mechanical detection + judgment-call resolution. Boundary: the agent runs the mechanical sub-check itself, surfaces evidence, and escalates the judgment sub-check via routing-question. The escalation trigger is where the boundary lives.

### H1 — §I.5 harm-critical floor: presence vs CONTENT
**Mechanical part (covered as M4):** empty harm-critical field → must be Undocumented.
**Judgment part:** when allergens are populated as `['Soy']`, has the author verified this against current supplier COA? The agent cannot read supplier COAs.
**Boundary trigger:** any populated harm-critical field with `confidenceLevel: Verified-Supplier-COA` or higher.
**Routing-question framing:**
> "Entry <X> declares <allergens / drugInteractions / regulatoryStatus> = <values> at confidence <C>. Agent cannot verify against supplier COA. Per §I.5 + §V.25, confirm against current supplier COA on file OR demote confidence and add to §V.25 verification queue."

### H2 — §I.6 USP DSC parity
**Mechanical part:** count entries with USP citation; count entries missing one.
**Judgment part:** for entries WITH a USP citation, does the entry's identitySpec / potencyFactor / elementalFactor actually match the cited monograph?
**Boundary trigger:** any new entry citing USP.
**Routing-question framing:**
> "Entry <X> cites USP DSC monograph <ref>. Agent cannot verify identitySpec / potencyFactor / elementalFactor parity against the monograph itself. Per §I.6, target ≥ 95% parity (allowed deviation: SKU-specific potencyFactor). Confirm the cited fields match the monograph OR flag as deferred-PA review."

### H3 — §II.8a Wave 1.5e qualified-vs-bare synonym discipline
**Mechanical part:** detect siblings via §38a grep + run `harmCriticalDifferenceExists` on each pair.
**Judgment part:** for each proposed synonym, classify as "bare technical name" vs "qualified" (concentration / source / brand). The rulebook gives examples but identification of THE bare name for a novel substance family requires reading.
**Boundary trigger:** any new synonym proposed on an entry in a family where `harmCriticalDifferenceExists` fires for ≥ 1 sibling pair.
**Routing-question framing:**
> "Entry <X> is in family <F> with sibling <Y> differing on: <which harm-critical axis>. Proposed synonyms: <list>. Agent's heuristic classification: <bare / concentration-qualified / source-qualified / brand-qualified> for each. Per §II.8a Wave 1.5e, bare technical names MUST NOT be claimed when siblings differ. Confirm the heuristic classification, or reclassify."

**Heuristic agent applies (mechanical first pass):**
- contains `%` or numeric concentration token → concentration-qualified
- contains a known source-descriptor (soy / sunflower / lichen / marine / etc.) → source-qualified
- contains a known brand or trade name (Cognizin / KSM-66 / Quatrefolic / Metafolin / Ferrochel / etc.) → brand-qualified
- otherwise → bare *(escalates to routing-question)*

**Heuristic-failure fallback (refinement 2):** the heuristic produces a CONFIDENCE band, not just a classification. Two failure modes route to question regardless of the "bare" path:

- **Multi-match (low confidence):** ≥ 2 patterns fire for the same synonym (e.g., "Sunflower Lecithin (Liquid)" — source-descriptor "Sunflower" present AND form parenthetical "(Liquid)" reads as form-qualifier). The heuristic cannot adjudicate which qualifier is primary. Route to question with framing: *"Synonym '<s>' matches multiple qualifier patterns: <list>. Heuristic cannot adjudicate primary qualifier. Confirm intended classification, or restructure synonym to disambiguate."*
- **No-match (low confidence):** none of the three qualified patterns fire AND the agent is uncertain whether the string is genuinely bare (e.g., novel substance family with no precedent — agent has no reference for what "qualified" looks like). Route to question with framing: *"Synonym '<s>' did not match any of the three qualified-name patterns (concentration / source / brand). Confidence that this is genuinely bare-technical-name: <low / medium>. Agent's reference catalog for this substance family: <closest-precedent list>. Confirm bare-name classification (→ §II.8a Wave 1.5e forbidden if siblings differ), OR add a qualifier the heuristic doesn't yet recognize."*

Same epistemic shape as the platform's safe-default-when-unsure discipline — the agent refuses to silently commit to a classification when its own heuristic is uncertain.

### H4 — §II.9 naming convention `Common Name (Form, Supplier, Standardization)`
**Mechanical part:** forbidden-word scan (M11 + M12); parenthetical-presence check.
**Judgment part:** verify each parenthetical clause actually encodes a verifiable structured-field value. "Calcium Citrate (USP, Pharmaceutical-Grade)" — does `certification` field actually carry USP-verified? The agent can cross-check IF the structured field is present; can't verify the field's accuracy against the actual supplier paperwork.
**Boundary trigger:** any new or changed display name.
**Routing-question framing:**
> "Display name <name> parses to clauses: [<Common>, <Form>, <Supplier>, <Standardization>]. Structured-field cross-check: <Form>→<formNotes/deliveryForm field value>, <Supplier>→<supplierName field value>, <Standardization>→<standardizationMarker field value>. <Match / mismatch> on field N. Per §II.9, name must match field data. Confirm OR correct."

### H5 — §II.10/§II.11 potencyFactor + elementalFactor PRESENCE vs VALUE
**Mechanical part:** form-name detection (substring match for "Bisglycinate" / "Citrate" / "Oxide" / "Glycinate" / "Sulfate" / "Picolinate" / "Triturate" / "Beadlet" / "Spray-Dried" / "Microencapsulated" / "% on Mannitol") → require field present.
**Judgment part:** for forms listed in §II.10 table, the constant is given (mechanical lookup against the table). For forms NOT in the table (mixed salts like Calcium Citrate-Malate, novel chelates, branded carriers), the value requires supplier-COA reading + chemistry-derivation judgment.
**Boundary trigger:** form pattern detected but form not in §II.10 table.
**Routing-question framing:**
> "Entry <X> appears to be a <carrier-loaded / salt / chelate> form (detected token: '<token>'). §II.10 table value: <constant if known / NOT IN TABLE>. Proposed value: <V>. <If in table: confirm against constant. If not in table: source the value (supplier COA reference + chemistry derivation if applicable). §II.10: 'use these constants; do not estimate.'>"

### H6 — §II.12 functional-role tag substantiation
**Mechanical part:** presence of `evidenceNote` with threshold + citation (M22). Cross-check entry's `typicalDose` against Appendix A threshold.
**Judgment part:** whether the cited evidence actually substantiates the tag at THIS entry's typical-use dose / form / standardization.
**Boundary trigger:** any functional tag where Appendix A threshold ≥ entry's typical-use dose midpoint OR entry has no Appendix A entry for the tag.
**Routing-question framing:**
> "Entry <X> tags <tag>. Appendix A threshold for <tag>: ≥ <T> <unit>. Entry's typical-use dose: <D-range>. <If D-min < T: routing required>. Per §II.12, tag must be defensible at typical use — extract-grade equivalents don't count. Defend at <D-min>, OR remove tag, OR widen typical-use to ≥ T."

### H7 — §IV.22 wave-sizing companion check
**Mechanical part:** lookup the entry in `lib/data/stacks.ts` (mustHave / commonCompanion / optional). Report which stacks it belongs to. Cross-check those stacks' members against the catalog.
**Judgment part:** which of the surfaced companion candidates count as "top-3 most predictable" and must be authored in same commit. §IV.22 names "top-3 most predictable" without an objective ranking method.
**Boundary trigger:** any new entry where ≥ 1 stack-member companion is missing from catalog.
**Routing-question framing:**
> "Entry <X> appears in: <stack:role list>. Companions cross-checked against catalog. Missing: <missing list with stack:role for each>. Per §IV.22, top-3 most predictable should be added in same commit. Agent's predictability ranking (mustHave > commonCompanion > optional; tie-break by frequency-in-other-stacks): <ranked list>. Confirm top-3 OR override."

### H8 — §V.24 PA-verification queue routing triggers
**Mechanical part:** trigger detection — `regulatoryStatus.US` undefined, post-1994 ingredient flag without confirmed NDI, Tier-3 strain not in Appendix B.
**Judgment part:** borderline cases — functional-role tag evidence at low-end of typical use; new compound with limited drug-interaction data.
**Boundary trigger:** trigger detected mechanically OR confidenceLevel = Inferred on a harm-critical field.

**Three-queue routing (refinement 4):** [docs/pa-verification/README.md](docs/pa-verification/README.md) names three adjacent verification queues with different authorities — the agent must route to the right one:

- **PA verification (regulatory)** — `docs/pa-verification/<YYYY-MM-DD>-<context>-<substance>.md`. For citations / caps / scope / subtype-routing decisions requiring Process Authority. Filename convention per README.md "File structure per pending item." Body follows the 4-section canonical template: header (Queued / Round / Status) + "What's Needed from PA" + "Where This Lands Once Verified" + "Open Questions for PA." Existing exemplars: `2026-05-18-melatonin-ndi-status.md`, `2026-05-18-st-johns-wort-ndi-status.md`, `2026-05-18-choline-family-ndi-specificity.md`.
- **Supplier-spec verification** — tracked in operator memory at [[project_phase_2_verification_queue]]. For supplier COA / lab measurements of ingredient properties (Iron Bisglycinate Fe%, L. acidophilus NCFM CFU). Agent surfaces via PENDING-suffix discipline (M16); no queue file authored.
- **Strain/SKU licensing verification** — tracked in operator memory at [[project_licensing_verification_queue]]. For B2B commercial licensing for proprietary strains. Agent surfaces via H9 routing-question; no queue file authored.

**Routing-question framing (revised):**
> "Entry <X> triggers verification-queue routing per §V.24: <triggers detected>. Triggers map to queue(s): <regulatory PA / supplier-spec / strain-licensing — pick all that apply>. For PA-regulatory: proposed queue file at `docs/pa-verification/<YYYY-MM-DD>-<context>-<substance>.md` following the 4-section canonical template (per [docs/pa-verification/README.md](docs/pa-verification/README.md)). For supplier-spec: apply PENDING-suffix per M16; track via [[project_phase_2_verification_queue]]. For strain-licensing: route through H9 framing. Confirm queue routing, OR add to in-commit catalog with confidenceLevel demoted?"

The discipline note from README.md applies — "PA fills the blanks." The agent does NOT pull values from training data and tag them as authoritative; the queue file lists fields PA must verify, no placeholder values.

### H9 — §V.26 Tier-3 strain detection for strains NOT in Appendix B
**Mechanical part:** Appendix B lookup (M23).
**Judgment part:** if strain isn't in Appendix B, licensing status unknown; can't be ruled-out as Tier-3.
**Boundary trigger:** Probiotics entry where strain ≠ any Appendix B row.
**Routing-question framing:**
> "Strain <X> not in Appendix B. Per §V.26 + [[reference_probiotic_supplier_licensing_tiers]], default to PENDING-suffix entry pending B2B licensing verification. Agent cannot verify licensing from public sources. Confirm PENDING-suffix, OR provide licensing reference (publication / agreement reference / supplier statement)."

### H10 — §V.27 bidirectional verification on directives
**Mechanical part:** rule-conflict detection — the directive contradicts ≥ 1 cited rule.
**Judgment part:** propose specific compliant alternatives.
**Boundary trigger:** any directive received that mentions a structured-field value the agent's check disagrees with.
**Routing-question framing:** routes through J1 (same shape).

### H11 — §IX.40 commit-message + memory items (#15, #17)
**Mechanical part:** #15 trend source + severity tier present in commit message body; #17 memory note authored if entry surfaces a pattern.
**Judgment part:** writing the text. The agent can detect missing/present, not draft.
**Boundary trigger:** commit message missing #15 fields; entry surfaces something the agent recognizes as a pattern.
**Routing-question framing:**
> "Commit message missing §IX.40 item #15 fields: <trend source / severity tier>. Suggested values from agent's read: <trend source / severity from H7 + J4>. Confirm OR rewrite."

### H12 — Appendix D regulatory status decision tree
**Mechanical part:** tree-traversal once each branch's answer is known (pre-1994 marketing? NDI notified? GRAS?).
**Judgment part:** providing the answer to each branch — requires archive research, NDI database lookup, GRAS dossier reading.
**Boundary trigger:** entry being authored with a non-grandfathered regulatoryStatus or a status not yet justified by cited evidence.
**Routing-question framing:**
> "Entry <X> proposes `regulatoryStatus.US: '<status>'`. Per Appendix D decision tree, this requires: <list of evidence per branch>. Current citations cover: <covered>. Missing: <missing>. Provide missing evidence OR route to PA queue (§V.24)."

---

## Inventory 4 — Coverage Gap Analysis

Cases the rulebook doesn't currently address but the agent will encounter in practice. Sources: Wave 1.5 stress-tests named by operator (Alpha-GPC normalization-symmetry, Lecithin Miss-mode B, Methylfolate disambiguation) + adjacent gaps surfaced during this extraction pass. Each gap proposes either a **Round 12 rulebook addition** OR an **agent-routing-question default** for the interim.

### Gap 1 — Synonym normalization-equivalence not enforced WITHIN an entry
**Case:** Alpha-GPC stress-test. Author writes `synonyms: ['alpha-gpc', 'alpha gpc']`. Both normalize to `'alpha gpc'`. §II.8a's no-collision rule (M10) targets CROSS-entry collisions. M8 (no capitalization-variant bloat) catches case-only diffs. WITHIN-entry normalization-equivalent duplicates (different punctuation, same normalized form) aren't explicitly forbidden.
**Why rulebook doesn't address:** §II.8a frames normalization as the parser's responsibility ("the parser handles the explosion of operator-typed variants. Do NOT enumerate every capitalization variant.") but doesn't extend the principle to "do not enumerate any normalization-equivalent variant."
**Disposition: AGENT-ROUTING-QUESTION DEFAULT.**
**Routing framing:**
> "Synonyms <A> and <B> on entry <X> normalize to the same string ('<normalized>'). Per §II.8a deterministic-matching principle, only one variant adds value — keep <A> (longer / more natural form), drop <B>? OR justify (intentional preservation reason)."

**Round 12 candidate rule (proposed):** §II.8a addition — "Within an entry, synonyms must normalize to distinct strings via `normalizeIngredientName`. Authors apply normalize-then-compare during synonym construction. Two synonyms with the same normalized form are duplicates regardless of source-string differences."

### Gap 2 — Substance-family disambiguation beyond harm-critical differential
**Case:** Methylfolate / Cobalamin stress-test. §II.8a Wave 1.5e covers ALLERGEN / IDENTITY-TEST / REGULATORY-STATUS differential. It does NOT cover BIOAVAILABILITY differential (folic acid vs methylfolate; cyanocobalamin vs methylcobalamin). Operator paste of bare `"folate"` resolves silently to one form. Operators with MTHFR-pathway concerns intend methylfolate; operators with cost concerns intend folic acid. Different downstream behavior but harm-critical floor (allergen / identity-test / regulatory) doesn't fire.
**Why rulebook doesn't address:** the harm-critical-sibling definition in [lib/supplementHarmCritical.ts](lib/supplementHarmCritical.ts) is narrowly scoped to the three predicates that drive recall-class regulatory exposure. Bioavailability is therapeutic-class, not regulatory.
**Disposition: ROUND 12 RULEBOOK ADDITION proposed.**
**Proposed rule:** §II.8a Wave-1.5e extension — extend the qualified-synonym discipline to include `bioavailabilityProfile` field on entries. When sibling variants differ on bioavailability profile (active form vs precursor; methylated vs cyanocobalamin; chelated vs salt with materially different absorption), the bare technical name is similarly forbidden as a synonym. Implementation: add `bioavailabilityDiffers` predicate to `harmCriticalDifferenceExists` composition.

**Calibration footnote (refinement 3):** the bioavailability-differential framing has a slippery slope — nearly every form-pair has SOME bioavailability difference (Calcium Citrate vs Calcium Carbonate; Magnesium Glycinate vs Magnesium Oxide; Vitamin D2 vs D3). Without a discrimination test, Gap 2's proposed rule would route every multi-form mineral entry to question. The proposed cutoff (to be locked when Round 12 rulebook addition is drafted):

> *Bioavailability profile is "materially different" when EITHER (a) one form is a precursor and another is the active metabolite (folic acid → folate vs methylfolate; cyanocobalamin → cobalamin vs methylcobalamin; tryptophan → 5-HTP; beta-carotene → retinol) OR (b) peer-reviewed bioequivalence studies show ≥ 40% AUC differential at typical-use dose. Routine multi-form mineral entries (Ca/Mg/Zn salts and chelates with absorption differences in the 10-30% range) do NOT trigger qualified-synonym discipline; they remain in the catalog's existing form-disambiguation layer (`formNotes` field + per-entry distinct display name).*

The 40% AUC threshold and the precursor/metabolite criterion are proposed values pending Round 12 PA-research review (likely involves Examine.com evidence-grade cross-reference). For step 2 v1 agent, the interim routing-question framing below explicitly cites the proposed cutoff so operators reading the routing question know whether their case clears the threshold.

**Interim agent-routing-question:**
> "Entry <X> is in substance family <F>. Sibling <Y> differs on bioavailability ([sibling profile vs entry profile]). Calibration test: is the differential (a) precursor-vs-active-metabolite OR (b) ≥ 40% AUC differential at typical-use dose? <Agent's read>. Per §II.8a Wave 1.5e principles (currently allergen / identity-test / regulatory only), no harm-critical sibling fires for bioavailability. If calibration test PASSES → adopt qualified-synonym discipline now (interim, pending Round 12 rulebook addition). If calibration test FAILS → bare-name synonym permitted; form-disambiguation handled by `formNotes` + display name. Confirm."

### Gap 3 — Tier-3 strain detection for strains NOT in Appendix B (default)
**Case:** Probiotic stress-test. Appendix B lists ~9 known Tier-3 strains. New strain entries will encounter strains not on the list.
**Why rulebook doesn't address:** Appendix B is a static reference; §V.26 doesn't specify a default when strain isn't found.
**Disposition: AGENT-ROUTING-QUESTION DEFAULT** (matches H9 routing-question framing).
**Default behavior:** the agent applies a default of PENDING-suffix + B2B-licensing-verification queue, surfaces the routing question, awaits confirmation.

### Gap 4 — Tier-6 supplier-COA-only field list not exhaustive
**Case:** Wave 1.5 stress-tests (potencyFactor / standardization on novel carriers). §I.2 says Tier-6 alone acceptable for "supplier-spec fields that have no public-authority equivalent" with `potencyFactor` and `standardization` as examples. But the list isn't exhaustive — `costPerKg`, `density`, supplier-specific oxidation profile, branded-blend ratios, branded-extract markers all could qualify.
**Why rulebook doesn't address:** §I.2 gives examples, not an exhaustive enumeration.
**Disposition: ROUND 12 RULEBOOK ADDITION proposed.**
**Proposed rule:** §I.2 addition — explicit enumeration of Tier-6-alone permitted fields, organized by field-class (commercial: costPerKg / priceHistory; physical: density / particle-size / dissolution-profile; supplier-spec: potencyFactor / standardization / branded-extract markers). All other fields require Tier 1–5 backing.
**Interim agent-routing-question:**
> "Entry <X> field <F> cited Tier-6-only. §I.2 expressly permits Tier-6-alone for `potencyFactor`, `standardization`. For <F>, propose: (a) demote `confidenceLevel` to Inferred until Tier-1–5 citation available, (b) confirm operator-judgment that no public-authority equivalent exists for <F>, (c) defer to next rulebook revision (Round 12 enumeration pending)."

### Gap 5 — Stack-membership assignment for novel substance families
**Case:** §IX.40 checklist item #14 requires every entry to be assigned to ≥ 1 §VII.34 named stack. Novel-family entries (synthetic-biology peptides; longevity compounds beyond NMN/Resveratrol/TMG/Spermidine; single-cell-protein-derived nutrients) may not fit any of the 20 existing stacks. §VII.36 says "add a stack when ≥ 3 operators paste similar formulations" — chicken-and-egg for entries that haven't been operator-tested yet.
**Why rulebook doesn't address:** §VII.36 frames stack addition as operator-paste-evidence-driven; novel entries lack that evidence.
**Disposition: AGENT-ROUTING-QUESTION DEFAULT** (no agent-defaulted answer — novel-family stack assignment is a meta-decision).
**Routing framing (refinement 5 — `stackFitNote` removed; field confirmed absent in `lib/`+`types/` per step-1.5 grep):**
> "Entry <X> doesn't fit any of the 20 §VII.34 named stacks (closest fits: <list with similarity scores from agent's mustHave/commonCompanion overlap analysis>). §IX.40 checklist item #14 requires ≥ 1 stack assignment. Options: (a) defer stack assignment with explicit per-entry override (creates documented checklist violation; tracks toward §VII.36 paste-evidence threshold for new-stack proposal), (b) propose new stack per §VII.36 (requires ≥ 3 operator-paste evidence — verify current state before proposing), (c) assign to closest-fit stack AND document the partial-fit reason in the entry's existing `notes` field (no schema change required). No agent-defaulted answer — operator picks."

**Schema-additions discipline (per [[feedback_refactors_wait_for_stable_data_layer]]):** the agent does NOT propose a new `stackFitNote` schema field for v1. The existing `notes` field on `IndustrialIngredient` carries any partial-fit reason in plain prose. If a structured field becomes warranted (≥ 5 entries with partial-fit, schema-driven downstream consumer), it becomes a Wave-5+ refactor ticket — not a v1 agent change.

### Gap 6 — Multi-category entries (mineral-specialty / vitamin-specialty crossovers)
**Case:** §38 Wave 1.5 spec explicitly notes "L-Threonate / Magtein (Magnesium L-Threonate) — also a Mg salt." Mineral category by chemistry; Specialty Compounds category by branded-cognitive positioning. §III.18 names enzymes as the multi-category case (SOD / Glutathione examples) but doesn't extend to mineral-specialty / vitamin-specialty crossovers.
**Why rulebook doesn't address:** §III.18 was authored for the enzyme-vs-antioxidant case.
**Disposition: ROUND 12 RULEBOOK ADDITION proposed.**
**Proposed rule:** §III.18 extension — multi-category disambiguation expanded to mineral-specialty / vitamin-specialty crossovers. Decision criterion: at the entry's typical-use dose, which mechanism is dose-substantiated? For brand-positioned specialty entries where the branded dose substantiates the specialty mechanism, primary = Specialty Compounds + secondary tag = mineral chelate.
**Interim agent-routing-question (matches J3 framing).**

### Gap 7 — Functional-role tag thresholds vs dose-range straddling
**Case:** Appendix A lists tag-eligibility thresholds. Some entries carry dose-RANGES that straddle the threshold (L-Theanine 100-400 mg, threshold 200 mg for nootropic; Phosphatidylserine 100-300 mg, threshold 100 mg for cognitive-support).
**Why rulebook doesn't address:** Appendix A is a static threshold table; threshold-vs-range comparison logic isn't specified.
**Disposition: AGENT-ROUTING-QUESTION DEFAULT** (matches H6 routing framing). The interim convention: tag is permitted when typical-use dose `min` ≥ threshold; otherwise routes to H6 routing question.

### Gap 8 — Miss-mode B "current-schema" field set not canonically defined
**Case:** Lecithin Miss-mode B stress-test. §38a defines Miss-mode B as a surfaced entry lacking "current-schema fields (synonyms, regulatoryStatus, functionalRole, coaTemplateType, bioactives, pharmacopeialReference)." That's an example list, not a canonical specification. As schema evolves through Wave 4 schema-lock and beyond, what counts as "current-schema" will drift. Two authors could disagree on whether a surfaced entry is Miss-mode B.
**Why rulebook doesn't address:** §38a gives examples; doesn't fix the schema reference per catalog version.
**Disposition: ROUND 12 RULEBOOK ADDITION proposed.**
**Proposed rule:** §VIII.38a addition — define "current-schema field set" as a versioned snapshot referenced via the `catalog.v.YYYY.QQ.NN` identifier (Appendix E). Each schema-version change updates this set; Miss-mode B detection uses the schema set current at the time of the grep. Snapshot stored in `docs/catalog/schema-versions/<version>.md`.
**Interim agent-routing-question:**
> "Surfaced entry <E> is missing fields <list>; current-schema-version definition is example-based (§38a). Confirm which missing fields rise to Miss-mode B (in-commit upgrade required) vs defer (catalog-data finding for later wave)?"

---

## Summary

| Bucket | Count | Examples |
|---|---|---|
| Mechanical (Inventory 1) | 24 | M1 citation format, M6 synonyms ≥ 2, M10 cross-catalog collisions, M19 §38a grep |
| Judgment-Call (Inventory 2) | 9 | J1 conflict-resolution, J3 multi-mechanism category, J5 saturation, J7 in-commit vs defer |
| Hybrid (Inventory 3) | 12 | H3 qualified-vs-bare synonyms, H5 elementalFactor value, H6 tag substantiation, H7 wave-sizing |
| Coverage Gap (Inventory 4) | 8 | Synonym normalization symmetry (1), substance-family bioavailability (2), Tier-6 field list (4), multi-category crossovers (6) |

**Round 12 rulebook addition candidates** (4): Gap 1 normalization-equivalence within entry, Gap 2 bioavailability-differential extension, Gap 4 Tier-6 field enumeration, Gap 6 mineral-specialty crossover extension, Gap 8 schema-version snapshot.

**Agent-routing-question default-set required for v1 launch** (5): Gap 1 (interim), Gap 3 strain not in Appendix B, Gap 5 stack-membership for novel families, Gap 7 dose-range straddling, Gap 8 (interim).

**Pressure-test reminders for Opus review:**
1. The four flagged smuggling-watchouts (wave-sizing companion selection / novel-family routing / stack-membership decisions / label-claim framing decisions): placed in H7, Gap 5, H7+J4, H5 respectively. None left in Inventory 1.
2. The mechanical bucket bottoms out at 24 rules — small enough to translate to subagent system-prompt rule-by-rule without bloat.
3. Coverage gaps are grounded in named stress-tests (Wave 1.5 Alpha-GPC, Lecithin, Methylfolate) + extension-from-stress-test reasoning (mineral-specialty crossover follows from Magtein in §38 Wave 1.5 spec).
4. Routing-question framings cite the specific rule + name candidate options + invite override. No generic "I'm not sure."

**Pause here for Opus review.** Step 2 (subagent definition at `.claude/agents/catalog-entry-validator.md`) waits for refinements (if any) to land back in this document.
