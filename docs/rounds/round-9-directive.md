# Round 9 — Filing Readiness Audit + Pathway-Aware Distance Computation

The Filing Readiness percentage in the sticky status bar shows 67–83% across formulations with very different regulatory profiles. The score doesn't differentiate Acid Foods (no scheduled-process filing required) from Acidified Foods (PA-reviewed scheduled process required) from LACF (21 CFR 113 retort process, FCE+SID, much more rigorous documentation set). Customer-zero formulators anchor on the wrong number, which compounds correctness risk over time.

This round redefines Filing Readiness from spec coverage (current de facto behavior) to pathway-aware distance to filing-ready state. The metric becomes "how close is your formulation to having what your Process Authority needs to file under your specific regulatory pathway."

## Defer-permission discipline

If any item surfaces architectural questions mid-work that can't be cleanly resolved within Round 9 scope, defer it explicitly. Surface as a Round 10+ ticket with the architectural question stated. Do not punt silently. Do not ship a half-fix. Consistent with the "refactors wait for stable data layer" pattern from prior rounds.

The 16-requirement framework specified below is the design target. If a requirement lacks a clean architectural home in the existing codebase (e.g., FCE registration has no UI surface today), defer that requirement to a future round and surface the gap. Do NOT invent UI surfaces or state machinery to satisfy the framework.

## Definitional anchor (locked before this directive)

**Filing Readiness measures pathway-aware distance to filing-ready state.** The percentage reflects how close the formulation is to having the documentation set that the customer's Process Authority needs to file under the specific regulatory pathway the Determination Engine has classified the formulation under.

This replaces the prior Phase-1 heuristic (`passed boolean checks / total checks × 100`) which conflated three distinct meanings: spec coverage completeness, filing distance, and classification confidence. The new metric carries Meaning 2 only. Spec coverage stays in the Spec Analysis panel; classification confidence is implicit in the Determination Engine outputs.

## Out of scope

- LACF documentation requirement specs (Round 10 candidate)
- Supplement (21 CFR 111) documentation requirement specs (Round 11 candidate)
- Conventional Acid Food (21 CFR 114.3(b)(1)) requirements — minimal, can fold into AF pathway as "exemption-confirmed" state with reduced requirement set
- Filing Readiness logic for any pathway not yet specified — handled by explicit unavailability per the placeholder behavior below

## Out-of-scope items handled cleanly

For pathways where the requirement set is not yet specified (LACF, Supplement, anything else), render Filing Readiness widget with explicit unavailability:

> "Pathway-specific requirements not yet specified — Filing Readiness score unavailable for this regulatory pathway. Use Spec Coverage in the Spec Analysis panel as a proxy for data completeness."

Do NOT fall back to spec coverage under the Filing Readiness label. Do NOT hide the widget. Honest unavailability with explicit reason and pointer to the alternative information surface.

## Acidified Foods (21 CFR 114) documentation requirement specification

For Round 9, the AF pathway is the only fully-specified pathway. The requirement set is defined explicitly with harm-critical / supplementary classification.

### Harm-critical floor-contributing requirements (any one being UNKNOWN floors the entire score)

1. Equilibrium pH measurement or calculation with adequate confidence
2. Water activity measurement or calculation with adequate confidence
3. Scheduled process establishment (PA-reviewed)
4. Container integrity testing
5. HACCP plan addressing acidified foods hazards
6. FCE registration confirmation (Food Canning Establishment number)
7. SID submission status (Scheduled Process / Form FDA 2541e)
8. Process Authority sign-off documentation

### Supplementary weighted requirements (contribute fractional credit, do not floor)

1. Training records (operator and supervisor competency documentation)
2. Pre-operational sanitation logs
3. Production batch records template
4. Deviation handling procedure
5. Recall plan
6. Supplier verification documentation for harm-critical ingredients
7. Equipment calibration records (pH meter, a_w meter, thermometer)
8. Container supplier specifications

**Total: 16 documentation requirements, 8 harm-critical floor-contributors + 8 supplementary weighted items.**

## v1 implementation scope (Path Y decision, 2026-05-09)

Per the architectural-home audit performed during read-and-map, the v1 implementation wires up only the requirements that have a clean architectural home in the existing codebase. The remaining requirements are deferred with traceability to Round 10+ when their UI infrastructure lands.

### Wired up in v1

| # | Requirement | Tier | Source of state |
|---|---|---|---|
| 1 | Equilibrium pH | Critical | `specs.pH` + `specs.confidence.pH` from `lib/foodScience.ts` |
| 2 | Water activity | Critical | `specs.aw` + `specs.confidence.aw` from `lib/foodScience.ts` |
| 5 | HACCP plan | Critical | `lib/haccp.ts` template-derived guidance — surfaces as INFERRED until a verified-HACCP-upload state exists |
| (meta) | Classification resolved | Gating | `specs.productClassification !== '—' && !== 'insufficient-data'` — required for the metric to compute at all |

### Deferred to Round 10+ (each surfaces as UNKNOWN in v1)

| # | Requirement | Tier | Architectural gap | Round candidate |
|---|---|---|---|---|
| 3 | Scheduled process establishment (PA-reviewed) | Critical | No PA-review state machinery in codebase | Round 10 |
| 4 | Container integrity testing | Critical | No surface | Round 10 |
| 6 | FCE registration | Critical | No surface | Round 10 |
| 7 | SID submission status | Critical | No surface | Round 10 |
| 8 | PA sign-off documentation | Critical | No surface | Round 10 |
| 9–16 | All 8 supplementary items | Supp | No surfaces (training, sanitation, batch records, deviation, recall, supplier verif, calibration, container supplier) | Round 11+ |

### Consequence

Most v1 formulations will floor to the multi-UNKNOWN tier (any harm-critical UNKNOWN → score floors per multiplier logic). Score will visibly reflect "you have substantial gaps" — which is honest. The blocker-surfacing UI (Surface 3) names the deferred requirements with their Round-10-or-later attribution so customer-zero formulators understand the score is bounded by deferred-infrastructure scope, not by their formulation alone.

This is consistent with the directive's defer-permission discipline: invent nothing, surface gaps explicitly, score what we have honestly.

## Computation specification

For each wired-up requirement, the system tracks state per the existing confidence taxonomy in `types/index.ts`:

- **measured** — customer has uploaded verified, current documentation. Full weight contribution.
- **calculated** — system has generated a value via sound math from MEASURED inputs. Substantial but not full weight.
- **estimated** — system has approximation method or industry-typical placeholder. Partial weight.
- **inferred** — state is implied by adjacent data or category-default fallback. Partial weight, less than ESTIMATED.
- **unknown** — no data, no inference, no template. Zero weight, floor-trigger if requirement is harm-critical.

### Weight values per confidence tier (locked, tunable in commit message rationale)

| Confidence | Weight |
|---|---|
| measured   | 1.00 |
| calculated | 0.80 |
| estimated  | 0.50 |
| inferred   | 0.40 |
| unknown    | 0.00 |

### Floor-based logic for harm-critical items

- If **any** harm-critical item is UNKNOWN, the score is `(weighted sum of all 16 items) / 16 × 0.30`. Visible percentage reflects "you have substantial gaps and cannot file until they're addressed."
- If **all** harm-critical items are at least INFERRED but **any** is below CALCULATED, the score is `(weighted sum of all 16 items) / 16 × 0.70`. Substantial but not file-ready.
- If **all** harm-critical items are at MEASURED or CALCULATED, the score is the simple weighted average: `(weighted sum of all 16 items) / 16`.

Multipliers (0.30, 0.70) are tunable but locked at implementation. The intent: a formulation with critical gaps should never show >30% Filing Readiness regardless of how complete the supplementary items are.

### v1 multiplier note

Since v1 has 5–6 forever-UNKNOWN harm-critical requirements (deferred infrastructure), nearly every formulation will hit the ≤30% floor. This is by design under Path Y — the score is honest about what infrastructure exists, not about formulation maturity in isolation.

## Required UI surfaces

### Surface 1 — The Filing Readiness widget itself

Renders the percentage with appropriate confidence treatment. Color and pill follow Round 8 vocabulary (CALCULATED stone, ESTIMATED amber, etc.). The widget shows the percentage AND the regulatory pathway it's measuring against:

> "Filing Readiness for Acidified Foods (21 CFR 114): 14%"

Replaces the current sticky-status-bar inline progress bar at `app/workspace/page.tsx:1582-1592`.

### Surface 2 — Pathway escalation event annotation

When the Determination Engine reclassifies a formulation into a different pathway (e.g., AF → LACF when pH crosses 4.6), the Filing Readiness widget surfaces an inline annotation:

> "Pathway changed from Acidified Foods to Low-Acid Canned Foods — additional documentation required. Filing Readiness score recalculated against the new pathway requirements."

This annotation persists until the customer dismisses it OR until the formulation reverts to the prior pathway. Without this annotation, the score drop reads as a bug.

If the new pathway has no specified requirement set yet (LACF), the annotation includes:

> "Filing Readiness for Low-Acid Canned Foods is not yet available — see Spec Coverage in Spec Analysis panel for data completeness."

### Surface 3 — Blocker-surfacing diagnostic

When Filing Readiness is floored (any harm-critical item UNKNOWN or below MEASURED), the widget shows a diagnostic surface naming the specific gap(s):

> "Filing Readiness floored by:
> - Scheduled process (UNKNOWN — Round 10 scope)
> - Container integrity testing (UNKNOWN — Round 10 scope)
> - HACCP plan (INFERRED — verified-upload UI not yet wired up)"

Each blocker entry names: the requirement, the current confidence state, and either a workflow link (if a surface exists where the gap can be addressed) or an attribution note ("Round 10 scope") for deferred infrastructure.

This surface is critical for the metric's core use case — a founder deciding when to engage Process Authority needs to know what to bring to that meeting, not just a number.

### Surface 4 — Pathway-not-specified state

For non-AF pathways during the Round 10/11 interim, the widget renders:

> "Filing Readiness for [Pathway Name] — not yet available.
> Pathway-specific requirements specification is queued for a future release. Use Spec Coverage in the Spec Analysis panel as a proxy for data completeness while pathway requirements are being defined."

Do NOT mix this with spec coverage under the Filing Readiness label. The two metrics measure different things and conflating them under one label is the failure mode this round is fixing.

## Verification on Vercel after push (operator runs these)

- **Test 1 — Acidified Foods baseline.** Build a formulation that classifies as Acidified Foods (e.g., the Round 7 bread-and-butter pickle). Verify Filing Readiness shows pathway-specific score against AF requirements with Surface 1 label `"Acidified Foods (21 CFR 114)"`. Verify Surface 3 names the deferred-requirements blockers.
- **Test 2 — LACF escalation event.** Build a formulation that crosses pH 4.6 with low-acid components > 5% (e.g., 99% Onion Powder stress test from prior session). Verify the pathway escalation annotation (Surface 2) appears. Verify Filing Readiness shows "not yet available" (Surface 4) for LACF with the placeholder copy. Verify the prior AF score drops/disappears appropriately.
- **Test 3 — Floored score with blocker diagnostic.** Most v1 formulations will hit this since UI infrastructure for many requirements is deferred. Verify the score is floored per the multiplier logic (≤30% when any harm-critical UNKNOWN). Verify Surface 3 names the specific blockers with Round-10-or-later attribution.
- **Test 4 — Conventional Acid Food.** Build a naturally-acidic formulation that qualifies for 21 CFR 114.3(b)(1) exemption (e.g., Citric Acid + Water from Round 6 verification). Verify the system correctly identifies the exempt classification and either (a) folds into AF pathway as exemption-confirmed state, or (b) surfaces the exemption explicitly with reduced requirement set. **Defer-finding eligible** — if implementation surfaces the exemption-state needs design discussion, surface as Round 9.5+ rather than picking silently.
- **Test 5 — Non-AF pathway interim handling.** Build a formulation that classifies as Dietary Supplement (switch to Nutraceuticals workspace). Verify Filing Readiness shows "not yet available" with placeholder copy and Spec Coverage pointer.

**Hold push pending operator spot-check after Vercel rebuild.**

## Documentation requirements

- This directive saved at `docs/rounds/round-9-directive.md`.
- Filing Readiness specification at `docs/design/filing-readiness.md` covering: definition (Meaning 2), pathway-specific requirement sets (AF only for now), v1 wired/deferred split, computation logic, multipliers, UI surfaces. Supersedes any prior implicit Filing Readiness behavior.
- Commit message lists what was built, what was deferred (with Round-10-or-later attribution), what tuning happened, and any findings on requirement-architectural-home gaps surfaced during implementation.
