# Filing Readiness — pathway-aware distance to filing-ready state

**Owner:** Round 9 (2026-05-09)
**Code:** `lib/filingReadiness.ts` — `computeFilingReadiness()`; `components/FilingReadinessWidget.tsx`
**Directive:** `docs/rounds/round-9-directive.md`

## Why this metric exists

The prior Filing Readiness percentage was a Phase-1 boolean-checks heuristic:
six binary checks (formula has name, ≥1 ingredient, classification resolved,
no critical findings, spec coverage ≥ 70%, packaging chosen) divided by six
× 100. The score conflated three meanings — spec coverage completeness,
filing distance, and classification confidence — and produced 67–83% across
formulations with very different regulatory profiles. A customer-zero formulator
working on an Acid Food and a customer-zero formulator working on an LACF
saw the same number for the same six-check state, even though the LACF
formulation actually needs a substantially larger documentation set.

This is the failure mode Round 9 fixes. The metric now means one thing:
**how close is your formulation to having the documentation set your
Process Authority needs to file under your specific regulatory pathway.**

Spec coverage stays in the regulatory-classification info card on the Build
tab. Classification confidence is implicit in the Determination Engine outputs.
Filing Readiness becomes pathway-aware distance.

## The metric (definition)

For a formulation with a determined regulatory pathway P, Filing Readiness is
the weighted-average completion of P's documentation requirement set, with
floor multipliers applied when harm-critical requirements are at low
confidence:

- For each requirement *r* in P's requirement set, the system tracks the current
  state via the existing confidence taxonomy (`measured`, `calculated`,
  `estimated`, `inferred`, `unknown`).
- Each state contributes a numeric weight (`measured: 1.00`, `calculated: 0.80`,
  `estimated: 0.50`, `inferred: 0.40`, `unknown: 0.00`).
- Score is computed as `(sum of weights / count of requirements) × 100`,
  with a floor multiplier applied based on harm-critical state.

## Acidified Foods (21 CFR 114) requirement set

**v1 specifies the AF pathway only.** Other pathways render as Surface 4
placeholders (see [Pathway scope](#pathway-scope) below).

The AF requirement set is 16 documentation requirements — 8 harm-critical
floor-contributors and 8 supplementary weighted items.

### Harm-critical requirements (floor-contributors)

| # | Requirement | Wired in v1 | Source / deferred-to |
|---|---|---|---|
| 1 | Equilibrium pH | ✅ | `specs.confidence.pH` |
| 2 | Water activity | ✅ | `specs.confidence.aw` |
| 3 | Scheduled process establishment (PA-reviewed) | ❌ | Deferred — PA-review state machinery not yet built |
| 4 | Container integrity testing | ❌ | Deferred — no surface in workspace today |
| 5 | HACCP plan (acidified foods) | ✅ INFERRED only | `lib/haccp.ts` template-derived; verified PA upload not yet supported |
| 6 | FCE registration (Form FDA 2541) | ❌ | Deferred — no surface in workspace today |
| 7 | SID submission (Form FDA 2541e) | ❌ | Deferred — no surface in workspace today |
| 8 | Process Authority sign-off documentation | ❌ | Deferred — PA-review state machinery not yet built |

### Supplementary requirements (weighted, do not floor)

| # | Requirement | Wired in v1 | Source / deferred-to |
|---|---|---|---|
| 9 | Training records | ❌ | Deferred — no surface in workspace today |
| 10 | Pre-operational sanitation logs | ❌ | Deferred |
| 11 | Production batch records template | ❌ | Deferred |
| 12 | Deviation handling procedure | ❌ | Deferred |
| 13 | Recall plan | ❌ | Deferred |
| 14 | Supplier verification (harm-critical ingredients) | ❌ | Deferred |
| 15 | Equipment calibration records (pH/a_w/thermometer) | ❌ | Deferred |
| 16 | Container supplier specifications | ❌ | Deferred |

**v1 wired total: 3 of 16 requirements.** Remaining 13 surface as UNKNOWN
with "not yet capturable in this tool" attribution in the Surface 3 blocker
diagnostic.

## Floor logic

Per the Round 9 directive's computation spec:

- **Hard floor (multiplier 0.30):** if any harm-critical requirement is
  UNKNOWN, the entire score is `(weighted sum / 16) × 0.30`. Visible
  percentage reflects "you have substantial gaps and cannot file until
  they're addressed."
- **Soft floor (multiplier 0.70):** if all harm-critical requirements are
  at least INFERRED but any is below CALCULATED, the score is
  `(weighted sum / 16) × 0.70`. Substantial but not file-ready.
- **No floor:** if all harm-critical requirements are at MEASURED or
  CALCULATED, the score is the simple weighted average.

The intent: a formulation with critical gaps should never show >30%
Filing Readiness regardless of how complete the supplementary items are.

### v1 consequence

Since v1 has 5 forever-UNKNOWN harm-critical requirements (deferred
infrastructure), nearly every formulation hits the hard floor and shows
≤30% Filing Readiness. This is by design under the Path Y v1 scope decision —
the score is honest about what infrastructure exists, not about formulation
maturity in isolation.

## UI surfaces

### Surface 1 — inline status-bar widget

Renders in the sticky status bar at the top of the workspace (Build / Cost /
Sourcing / Batch sheet tabs — hidden on Home / Authorities / Services / Database).
Shows: widget label, percentage with confidence-driven color, fill bar,
ConfidencePill, click-to-expand chevron, and pathway sub-line (`for {pathway}`).

When the pathway is unspecified (Surface 4 case), the percentage area shows
em-dash (`—`) instead of a number.

### Surface 2 — pathway escalation banner

Renders directly below Surface 1 when the pathway machine ID has changed
since the previous render. Two copy variants:

- **Standard** — fires when transitioning between two specified pathways
  (no v1 case, future-proofing for Round 10).
- **To-unspecified** — fires when transitioning into a pathway whose
  requirement set isn't specified yet (the v1-actually-firing case).

Persists until user dismisses (X button) or until pathway changes again.
v1 simplification: revert-detection (A→B→A) is deferred — every pathway
change triggers a fresh escalation event.

### Surface 3 — blocker-surfacing diagnostic popover

Opens on widget click when score is floored. Lists the harm-critical
requirements that contributed to the floor, with copy that names the current
state and the upgrade path:

- Deferred requirements: `(UNKNOWN — not yet capturable in this tool)`
- Wired UNKNOWN: `(UNKNOWN — value not yet available)`
- Wired INFERRED (generic): `(INFERRED — derived from category defaults; verify ingredient values to upgrade)`
- Wired ESTIMATED: `(ESTIMATED — verify ingredient values to upgrade)`
- HACCP INFERRED (special): `(INFERRED — template-derived; verified PA-approved upload not yet supported)`
- HACCP UNKNOWN (special): `(UNKNOWN — no HACCP category matched for this formulation)`

Footer counts deferred requirements with critical/supplementary breakdown:
*"13 requirements pending workflow support (5 critical, 8 supplementary)"*.

### Surface 4 — pathway-not-specified popover

Opens on widget click when the pathway has no requirement set in v1. Shows
pathway-specific copy explaining the gap and pointing to Spec coverage on
the Build tab as a fallback information surface.

## Pathway scope

| Pathway | Machine ID | v1 status |
|---|---|---|
| Acidified Foods (21 CFR 114) | `acidified-foods` | ✅ specified — 16-requirement set |
| Low-Acid Canned Foods (21 CFR 113) | `lacf` | Deferred — Surface 4 placeholder |
| Acid Food (21 CFR 114.3(b)(1)) | `acid-food` | Deferred — Surface 4; "no filing required" copy |
| Shelf-Stable by Low Water Activity | `shelf-stable-dry` | Deferred — Surface 4; "no filing required" copy |
| Dietary Supplement (21 CFR 111) | `dietary-supplement` | Deferred — Surface 4 placeholder |
| FSIS Meat (9 CFR) | `fsis-meat` | Deferred — Surface 4 placeholder |
| Pending classification | `pending` | Deferred — Surface 4; "add ingredients" copy |
| Unclassified | `unclassified` | Deferred — Surface 4; "awaiting classification" copy |

The acidified-in-process classification folds into `acidified-foods` —
intent is acidified, requirements are the same, only the Determination
Engine reason text differs.

## Confidence-driven color theme

Per Round 8 vocabulary, the bar fill and percentage text color are driven
by the score's aggregate confidence (the floor across harm-critical inputs,
capped at CALCULATED since the score is a derivation):

- `measured` / `calculated` → stone (bar `bg-stone-500`, text `text-stone-800`)
- `estimated` / `inferred` → amber (`bg-amber-500`, `text-amber-700`)
- `unknown` → gray (`bg-gray-400`, `text-gray-600`)

The ConfidencePill alongside the percentage carries the textual confidence
label. MEASURED-aggregate scores wouldn't render a pill (per Round 8 vocabulary
"absence = trust the number"); v1 scores never reach MEASURED-aggregate
because the score is a derivation capped at CALCULATED.

## Cross-reference labels

Surface 4 placeholder copy and Surface 2 to-unspecified copy reference
"Spec coverage on the Build tab" as the fallback information surface. This
matches the actual user-visible label at
[`app/workspace/page.tsx:5702`](../../app/workspace/page.tsx#L5702):
*"Spec coverage:"* in the regulatory-classification info card.

**Round 10 candidate finding:** the regulatory-classification info card has
no user-visible panel header. Code comments call it "Spec Analysis panel"
internally, but no panel-level label is rendered. If a future round needs
to cross-reference the panel by name, add a header.

## Open questions deferred

- **Conventional Acid Food reduced-requirement set.** Per the Round 9
  directive, Acid Foods (21 CFR 114.3(b)(1)) "can fold into AF pathway as
  exemption-confirmed state with reduced requirement set." v1 surfaces
  Acid Food as Surface 4 with "no filing required" copy. Round 10 candidate:
  define the reduced-requirement set or commit to the placeholder framing.
- **LACF (21 CFR 113) requirement set.** Round 10 candidate. Substantially
  larger and more rigorous than AF — retort process establishment, container
  closure evaluation, incubation testing, F₀ validation, much more.
- **Dietary Supplement (21 CFR 111) requirement set.** Round 11 candidate.
  Master Manufacturing Record, Batch Production Records, identity testing,
  stability data, finished product testing, Supplement Facts panel — entirely
  different documentation set from food side.
- **PA-review state machinery.** The 5 deferred AF harm-critical items
  (scheduled process, container integrity, FCE, SID, PA sign-off) all need
  upload + verify + expiration UI surfaces. Coherent feature, not a per-item
  fix. Round 10 candidate.
- **8 supplementary documentation surfaces.** Training, sanitation, batch
  records, deviation, recall, supplier verification, calibration, container
  supplier specs. Round 11+ candidate. Lower priority than the harm-critical
  items.
- **Pathway-revert escalation suppression.** v1 treats every pathway change
  as a fresh escalation event. A→B→A shows two escalations (A→B, then B→A).
  Round 10 candidate: detect revert and suppress redundant annotation.
- **Multiplier tuning.** Hard floor 0.30 and soft floor 0.70 are locked at
  v1. If customer-zero feedback shows the metric reads "too pessimistic" or
  "too optimistic," tune in a follow-up round and document rationale.
