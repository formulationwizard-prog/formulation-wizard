# Novice-Readiness Quad — Architectural Proposal Memo

**Author:** CC, 2026-05-25 (end-of-day proposal closing today's strategic-input arc)
**Purpose:** Propose the four-pillar architectural framework that makes the August Nutraceuticals launch ADOPTABLE by first-time CPG founders — not just shippable to operators who already know what FALCPA / NDI / cGMP mean. Reframes Packet Q9 from "Phase 5 parked" to "launch-critical." Adds Regulatory Rigor Metering as a new architectural pillar.
**Audience:** Strategic-session input pack item — alongside Packet architecture memo, Design system memo, Catalog architecture investigation, Capability inventory, and Orientation 1-pager. Session decides Q1–Q4 routing; this memo proposes the framework.
**Status:** Proposal for strategic session — concrete options + routing questions per pillar; not directive.

---

## TL;DR

The current workspace serves expert operators well. It fails first-time CPG founders by surfacing **all** regulatory engines (DSHEA + NDI + cGMP + Filing Readiness + Determination Engine + Process Authorities) to **all** operators regardless of whether those engines apply to their product type, scale, or stage. This is **regulatory density applied to wrong-stage operators** — not UI density.

External developer trial 2026-05-25 ("Tridiv") exposed this. The fix is **four pillars shipping together** for August:

1. **Compose / Analyze IA restructure** — lean authoring + opt-in depth (structural)
2. **Novice tier rendering** — plain language + guided onboarding + progressive disclosure (persona)
3. **Refusal-bearing gate consumption** — Filing Readiness % climbing maps to real cleared gates (honesty)
4. **Regulatory rigor metering** — operator profile → applicable surfaces (rigor-fit) **[NEW]**

**Critical foundation-vs-population distinction:** build the metering infrastructure as cross-vertical foundation for August; populate only August-relevant rules at launch (stage metering within DSHEA + NDI applicability + cGMP-by-manufacturing-model). F&B class-specific rules populate Q4. Pet food later.

**Reason Q9 reclassifies to launch-critical:** Tridiv's experience IS the August launch experience for every paying customer who isn't already an expert. Without the quad, churn on first session is the predictable outcome.

**Implementation tractability:** Pillar 2's Novice/Pro tier infrastructure already exists (`lib/copy/`, `lib/hooks/useTier.ts`, bilingual strings). Pillar 3's four refusal-bearing gates already exist tested + exported. Pillar 1 is genuinely new structural work. Pillar 4 is new architectural infrastructure but populated with a small ruleset at launch. Aggregate scope: weeks not months.

---

## §0 — Motivating evidence

Two concrete observations drive the proposal.

### 0.1 The external developer trial

Tridiv tested the workspace 2026-05-25 — first non-operator user since the catalog enrichment + compliance work began. Five signals surfaced ([[external-developer-trial-2026-05-25]]):

1. "I lost my saves!" — persistence gap (LB#4; first half shipped today)
2. "Information overload" — the right-column-cockpit problem
3. "Bottom-line value gap" — cost/margin/demand framing
4. "UX standards inconsistency" — alert hierarchy + visual primitive drift
5. "Caesar without anchovies" — catalog completeness (closed)

Signal #2 is the load-bearing finding for THIS proposal. Tridiv's exact words: *"I'd worry if I'd ever use it"* — a sophisticated software developer overwhelmed by the current workspace. The August launch experience for non-expert paying customers is structurally similar to Tridiv's.

### 0.2 The three concrete novice personas

The platform's "first-time CPG founder" persona isn't monolithic. Three concrete examples surfaced during 2026-05-25 strategy discussion:

**Persona A — Grandma's raspberry jelly at farmers markets.** Small batch; direct-to-consumer; cottage food eligible in most states; needs FDA-compliant labels + Nutrition Facts if commercial-scale; doesn't need PA, HACCP plan, scheduled-process filing, NDI, DSHEA framework, or cGMP.

**Persona B — Chef's signature BBQ sauce productized for retail.** Small-batch retail; acidified food per 21 CFR 114 (most sauces); PA review **required**; standard FDA labeling; FALCPA allergens (soy/wheat/dairy common); not applicable: DSHEA, NDI, supplement cGMP.

**Persona C — First-time dietary supplement brand.** August Nutraceuticals primary persona; DSHEA framework per 21 CFR 111; SFP per 21 CFR 101.36; NDI compliance check (if novel ingredient); cGMP per 21 CFR 111 (full burden if self-manufacturer; reduced if co-packer); not typically: PA, HACCP plan, acidified-food classification.

**Three operators. Three different regulatory paths. One dense workspace today.**

For Persona A, the workspace's current Determination Engine + NDI Check + Filing Readiness + Process Authorities surfaces are NO-OP. For Persona C, they're all relevant. The platform should know which is which.

---

## §1 — Pillar 1: Compose / Analyze IA restructure

### What's broken today

Build tab's right column has 10+ panels: Determination Engine + NDI Compliance Check + FDA Nutrition Facts Label + Supplement Facts Panel + Nutrition Claim Validator + INGREDIENTS rendering + Allergen Statement + Formulation Spec Analysis + Stability & Overage + Suggested cGMP Program. Plus the left column's 8+ authoring panels. **One scroll. ~18+ surfaces.** This is the right-column-cockpit problem.

Even with consistent visual hierarchy (design system memo §2), the cognitive load of "compose ingredients while watching NFP recompute while watching allergen statement update while watching Determination Engine reclassify while watching Filing Readiness % climb" is high. Expert operators may accept this. Novices won't.

### Proposed shape

**Compose tab.** INPUTS only.
- Formulation Name, Product Type, Product Class
- Add Ingredient + Current Formulation list
- Serving & Package Size
- Delivery Form & Dosage
- Save formulation
- Intelligence bar persistent (Filing Readiness %, allergen chip, save state)

**Analyze tab.** DERIVED RENDERS + DETERMINATIONS.
- NFP / SFP / Allergen statement / Ingredient statement (DERIVED RENDERS per design system §2.3)
- Determination Engine / NDI Check / Filing Readiness breakdown / cGMP Program (DETERMINATIONS per design system §2.4)
- Spec Analysis / Stability & Overage / Cost-per-serving
- Operator opts in to depth; not forced during composition

**Intelligence bar.** Always-visible thin top strip across both tabs.
- Filing Readiness %
- Allergen chip (count + Big-9 surfaced)
- Harm-critical floor chip (red if UNDOCUMENTED on any high-risk field)
- Save state ("saved 2 min ago" / "unsaved changes")
- Mode chip (Novice / Pro)

### Why the split matters specifically for Novice users

Compose is a calm authoring surface. The operator focuses on what they're making. Analyze is opt-in depth — they look at it when they want to see what the platform has determined.

For Pro: Compose + Analyze peek both visible (today's dense view). All tabs in nav. No plain-language translation; CFR citations inline.

For Novice: Compose with guidance + plain-language labels + suggested starting points. Analyze peek hidden by default; operator expands when ready. Full Analyze a click away, not in their face.

### Mapped to existing code

- `app/workspace/page.tsx` Build tab block (line 3361) splits into two tab blocks
- Right-column panels (lines ~5800–10000) migrate to Analyze tab
- Intelligence bar likely lives in formula-status-bar area (currently around line 2154)
- `lib/modes.ts` workspace-mode routing unchanged
- Design system §2 categorical encoding directly informs which panel lives in which tab (INPUTS → Compose; DERIVED RENDERS + DETERMINATIONS → Analyze; DIAGNOSTICS → Intelligence bar; DERIVED VALUES → wherever the source INPUT lives)

### Routing questions for the session

**Q-IA-1: Does Compose/Analyze split ship at August MVP?**
Options:
- (a) Ship at MVP — full restructure across both modes (Novice + Pro)
- (b) Ship Novice-only at MVP; Pro stays single-Build-tab; restructure Pro post-launch
- (c) Defer entirely; ship dense Build for August; restructure V1.1

CC perspective: (a) — both modes benefit; restructure is structural not cosmetic; revisiting post-launch is more painful than once-now.

**Q-IA-2: What lives in the Intelligence bar?**
Filing Readiness % + allergen chip + harm-critical chip + save state are uncontroversial. Open question: cost chip? Mode chip? Quick-action shortcut (Cmd+K trigger)?

---

## §2 — Pillar 2: Novice tier rendering

### What's already in code

Per current capability inventory + Q9 routing-question framing 2026-05-25:
- `lib/copy/` — bilingual Pro/Novice strings infrastructure
- `lib/hooks/useTier.ts` — tier-aware rendering hook
- Phase 5 work parked but **scaffold exists**

Implementation is wire-up + copy refinement, not from-scratch.

### Novice mode design principles (per [[joy-of-mastery-brand-philosophy]] + persona profile)

1. **Hide advanced settings by default; operator opts into complexity when ready.** Cost Tool tab, Sourcing tab, Process Authorities tab — Novice doesn't see these until they have a reason to.
2. **Plain language.** Regulatory jargon translated inline. "FALCPA" surfaces as "Big-9 allergen disclosure law" with expandable detail.
3. **Show only most-common workflows.** Compose → Save → Print. Other surfaces hidden behind "Show more" link.
4. **Inline help.** Tooltips on hover, expandable explanations, "What is this?" links. Sensible decision-tree answers ("Do I need a Process Authority?" → drives off product type + acidified status).
5. **Stronger defaults.** Operator doesn't decide unless they want to. NDI defaults to "not novel" (covers >95% of common ingredients); cGMP defaults to manufacturer-required (covers most operators); allergen defaults to UNDOCUMENTED (harm-critical floor).
6. **Guided sequence for the very first product.** Question 1: What kind of product? Question 2: Who's eating it? Question 3: How will you sell it? Question 4: Start adding ingredients. Tabbed view after first product.
7. **Promote to Pro mode** after milestones (e.g., "you've shipped 3 products — try Pro") OR via explicit toggle. Per-tab promotion not supported (mental-model complexity).
8. **Smart copy that respects intelligence.** Errors explain themselves with suggested fixes inline. "Looks like the pH might be too high for this preservation system, here's what's typically tried" not "VALIDATION ERROR: PH_THRESHOLD_EXCEEDED."

### The narrative arc (per joy-of-mastery doctrine + persona profile)

The novice's journey is narrated, not gamified:
- Filing Readiness % climbs as operator makes progress
- Small wins acknowledged visibly: ✓ Product type selected → ✓ First ingredient added → ✓ Allergens identified
- Re-opening: "Welcome back — picking up where you left off."
- Saved Formulations: portfolio that grows over time
- Beautiful outputs: NFP/SFP/label PDF looks PROFESSIONAL — pride moment converts skepticism to belief

### Routing questions for the session

**Q-Novice-1: Default mode for new accounts?**
Options:
- (a) Default Novice — every new operator starts here; explicit promote-to-Pro
- (b) Ask at first-product setup — "Are you new to formulation? Or experienced?" — sets tier accordingly
- (c) Default Pro — Novice opt-in only

CC perspective: (a) — Tridiv-shape default. Pro-promote is one click; Novice-demote is recoverable. Default-Pro ships the dense view to first-time founders who churn.

**Q-Novice-2: Promotion mechanic?**
Options:
- (a) Explicit toggle only — operator decides when ready
- (b) Auto-promote after milestones — "you've shipped 3 products — try Pro"
- (c) Both — soft auto-suggestion + explicit toggle always available

CC perspective: (c) — explicit always works; soft auto-suggestion provides discovery without forcing.

**Q-Novice-3: Per-tab vs global tier?**
Options:
- (a) Global — operator is Novice everywhere or Pro everywhere
- (b) Per-tab — operator might be Novice in Filing (never filed) but Pro in Build (mastered formulation)

CC perspective: (a) — per-tab adds mental-model complexity for marginal benefit; mode toggle is cognitive context to enter/exit, not per-surface fiddling.

**Q-Novice-4: Plain-language copy scope at MVP?**
Options:
- (a) Full copy refresh across Novice mode — every regulatory term has plain-language equivalent + expandable explainer
- (b) Tier-1 surfaces only at MVP — onboarding flow + Determination Engine + Filing Readiness — defer everything else
- (c) Tooltip-only at MVP — keep existing copy; add hover-explainers; defer full copy refresh

CC perspective: (b) — focus on the surfaces that gate adoption decisions; complete refresh in V1.1.

---

## §3 — Pillar 3: Refusal-bearing gate consumption

### What's broken today

Per inventory finding #2: four refusal-bearing gates exist tested + exported + **UNCONSUMED** by the UI:
- `ReviewStateGate` — refuses export when ReviewState is not approved/version_locked (`lib/reviewState.ts`)
- `IdentityTestGate` — refuses export when identity testing required but not attested (`lib/identityTesting.ts`)
- `DiseaseClaimGate` — refuses export when disease claim detected without substantiation
- `SupplementBucket1Gate` — composes per-allergen + per-claim + per-NDI gates (`lib/supplementBucket1Gate.ts`)

Only `evaluateAllergenGate` is wired to the workspace. The detector siblings (`analyzeDraftClaim`, `detectStructureFunctionClaims`, `analyzeNDI`, `checkSupplementSafety`) ARE wired but produce **advisory output, not refusal.**

### Why this matters specifically for Pillar 2 (Novice tier)

The "Filing Readiness % climbing as the narrative arc" design (per joy-of-mastery principle 5) only feels **honest** (not gamified) if each milestone tick maps to a real cleared gate. If Filing Readiness % is heuristic and doesn't map to enforced refusal, the climbing-narrative becomes manipulative — the platform pretending progress without backing it with compliance teeth.

Wiring the refusal-bearing gates makes the narrative real. The gates ALREADY EXIST + are ALREADY TESTED. The wire-up is exposure work, not new feature work.

### Proposed wire-up sequence

1. **ReviewStateGate first** — smallest scope; refuses export when ReviewState is not approved/version_locked. ~2-3 hr CC work. Provides immediate teeth.
2. **IdentityTestGate next** — refuses export when Bucket 1 ingredient present without identity test attestation. ~2-3 hr.
3. **DiseaseClaimGate** — refuses export when disease claim detected without substantiation. ~3-4 hr (claim detection is wired; refusal-pathway and operator-override flow are new).
4. **SupplementBucket1Gate** — composes the others; cap-stone gate. ~2-3 hr after others land.

Each gate wires into the appropriate UI surface (export buttons, save action, print/PDF generation). Each surfaces with operator-overridable confirmation dialog explaining what's failing + how to fix.

### Mapped to existing code

- `lib/reviewState.ts` — `evaluateReviewStateGate` (358 lines of tested helpers; line 332+)
- `lib/identityTesting.ts` — `evaluateIdentityTestGate` (per inventory finding)
- `lib/disease-claim/` — `evaluateDiseaseClaimGate` (sibling of `analyzeDraftClaim`)
- `lib/supplementBucket1Gate.ts` — `evaluateSupplementBucket1Gate` (composition root)
- `app/workspace/page.tsx` — export/save/print handlers (lines ~1292 printLabel + ~1503 saveFormulation + ~5778 Save-as-PDF) get gate-check pre-hooks

### Routing questions for the session

**Q-Gate-1: Wire-up sequence + scope for MVP?**
Options:
- (a) All four gates wired at MVP — comprehensive compliance posture
- (b) ReviewStateGate + IdentityTestGate at MVP — most-common refusal pathways
- (c) ReviewStateGate only at MVP — minimum compliance teeth

CC perspective: (b) — wires 80% of refusal-pathway value at ~50% of the scope cost.

**Q-Gate-2: Override behavior?**
Options:
- (a) Hard refusal — operator must clear the gate to proceed
- (b) Soft refusal — operator can override with rationale captured in audit trail
- (c) Mode-dependent — Novice hard refusal (protect); Pro soft override (trust expert judgment)

CC perspective: (c) — dignity-moat applied per `[[joy-of-mastery-brand-philosophy]]` Principle 4. Novice gets protection; Pro gets override-with-rationale.

---

## §4 — Pillar 4: Regulatory rigor metering [NEW]

### The architectural insight

Operator profile → applicable regulatory surfaces. Workspace renders only applicable surfaces. Filing Readiness % computes against applicable subset only.

This is what makes the platform appropriate for grandma's raspberry jelly AND a co-packer running 50 supplement SKUs. Today's workspace treats them identically. Metering treats them differently.

### Profile shape

Captured during Novice onboarding (or settings panel for Pro):

| Profile dimension | Values | Drives |
|---|---|---|
| Product type | Nutraceuticals / F&B / Pet Food | Workspace-mode routing (already exists in `lib/modes.ts`) |
| Product class within type | (Q4 F&B: jelly / sauce / baked good / beverage) | Standardized food identity + acidified classification rules |
| Operator stage | Cottage / Small-Commercial / Scale-Commercial | Cottage food eligibility surfacing (when applicable) |
| Distribution | DTC / Wholesale / Retail | FDA labeling requirements + retailer-onboarding packet needs |
| Revenue scale | <$500k / $500k-$5M / $5M+ | FDA exemption threshold per 21 CFR 101.9(j)(1) |
| Manufacturing model | Self-manufacturer / Contract / Co-pack | cGMP burden + audit-readiness depth |
| Novel ingredient status | None / Has novel ingredients | NDI applicability |

### Rules engine — August Nutraceuticals scope

Stage metering within DSHEA + NDI applicability + cGMP-by-manufacturing-model:

| Profile attribute | August Nutraceuticals rule |
|---|---|
| Self-manufacturer | Full cGMP visible (21 CFR 111); Audit-readiness surfaces; cGMP Program rendering ON |
| Contract / Co-pack | Reduced cGMP burden visible; co-mfg agreement surfacing; cGMP Program rendering MUTED |
| Has novel ingredients | NDI Compliance Check visible + active; 75-day notification timeline surfacing |
| No novel ingredients | NDI Compliance Check HIDDEN (or muted) — operator never sees it |
| Bucket 1 ingredients present | Identity testing requirement surfacing; IdentityTestGate active |
| No Bucket 1 ingredients | Identity testing surfacing HIDDEN |
| Revenue >$500k OR >100k packs/year | Standard FDA Nutrition Facts requirements; exemption NOT applicable |
| Revenue ≤$500k AND ≤100k packs/year | NFP exemption surfacing; "you may not be required to include NFP" guidance |

### Rules engine — Q4 F&B scope (NOT August)

| Profile attribute | Q4 F&B rule |
|---|---|
| Product class = jelly/jam | 21 CFR 150 standardized food identity surfacing |
| Product class = sauce + pH > 4.6 | 21 CFR 114 acidified foods classification + PA review required |
| Product class = juice | 21 CFR 120 juice HACCP requirement |
| Product class = seafood-bearing | 21 CFR 123 seafood HACCP requirement |
| Operator stage = cottage + distribution = DTC | Cottage food eligibility surfacing + "check your state ag dept" + FDA cottage food landing page link |

### Foundation-vs-population — the critical sequencing decision

**Build the metering INFRASTRUCTURE as cross-vertical foundation for August.**
**Populate ONLY August-relevant RULES at launch.**

Why foundation NOW (not Q4):
- Retrofitting metering infrastructure later is painful
- If August ships hardcoded "always show all DSHEA engines," Q4 F&B metering work has to reverse-engineer where toggles belong
- If August ships routing capability + small ruleset, Q4 just adds more rules

### What's already in code that supports metering

- **`lib/modes.ts`** — workspace-mode routing already exists. Extend with profile sub-routing.
- **Determination Engine card** — already classifies (DSHEA / Acidified / LACF / Juice HACCP / Seafood HACCP / Preventive Controls). Currently SURFACES classification; doesn't HIDE inapplicable engines based on profile. Extend to use profile for visibility decisions.
- **Filing Readiness %** — computes against current engines; extend to compute against profile-applicable subset.

### What's missing for metering MVP

- Pre-product **stage/distribution/scale/manufacturing-model capture flow** (Novice onboarding question 2-5; Pro settings panel)
- **Inline regulatory plain-language explainers** with sensible decision-tree answer based on profile
- **Profile-aware visibility decisions** for Determination Engine + NDI Check + cGMP Program surfaces
- **Profile-aware Filing Readiness %** computation

### Honest framing — what's NOT in scope

- **State-by-state cottage food rules** (50 states × varying rules) — not at all. Honest framing: "check your state ag dept" + link to FDA cottage food landing page. Generic surfacing only.
- **HACCP plan generation** — Q4 or later. Current static text per product type remains for now.
- **Pet food metering** — later still. AAFCO frameworks aren't in scope for August.

### Routing questions for the session

**Q-Meter-1: Does August Nutraceuticals ship with metering infrastructure?**
Options:
- (a) Yes — full infrastructure + August-scope ruleset
- (b) Yes infrastructure; no rules — every operator sees current dense view; rules populate post-MVP
- (c) No metering at MVP — defer to V1.1 + Q4 F&B work; current dense view ships for August

CC perspective: (a) — infrastructure-only-no-rules is the worst of both worlds. Rules ARE the value.

**Q-Meter-2: Profile capture mechanic?**
Options:
- (a) Explicit setup flow during Novice onboarding (4 questions max)
- (b) Progressive disclosure — ask only when needed ("you're saving — is this for retail?")
- (c) Settings panel — operator configures once; can update anytime

CC perspective: (a) for Novice (onboarding); (c) for Pro (settings access). (b) is theoretically friendlier but creates state-fragmentation in the operator's mental model.

**Q-Meter-3: Foundation-vs-population sequencing locked?**
Options:
- (a) Confirmed — foundation cross-vertical for August + August-ruleset populated; Q4 F&B rules add post-routing
- (b) Reframe — populate F&B rules pre-August as cross-vertical foundation work; Q4 just polishes
- (c) Reframe — defer infrastructure to F&B Q4; August Nutraceuticals stays hardcoded

CC perspective: (a) — best balance of foundation-now + scope-discipline.

**Q-Meter-4: How does metering interact with Pro mode?**
Options:
- (a) Metering applies equally — Pro operators ALSO get profile-aware surfaces; they just see more depth
- (b) Pro bypasses metering — Pro operators see all surfaces; metering is Novice-only protection
- (c) Pro can disable metering per-session — "show me everything regardless of profile"

CC perspective: (a) — metering is product-fit, not training-wheels. A Pro operator running a supplement-only catalog doesn't need to see acidified-food UI either.

---

## §5 — Cross-pillar coordination

The four pillars aren't independent; they coordinate:

| Pillar | Depends on | Enables |
|---|---|---|
| 1. Compose / Analyze IA | Design system §2 categorical encoding | Pillar 2's progressive disclosure; Pillar 4's profile-aware visibility |
| 2. Novice tier rendering | `lib/copy/` + `useTier.ts` infrastructure | Pillar 4's profile capture (Novice onboarding is the capture surface) |
| 3. Gate consumption | `lib/reviewState.ts` etc. (already shipped) | Pillar 2's narrative arc (Filing Readiness % climbing maps to real gates) |
| 4. Regulatory rigor metering | `lib/modes.ts` + Determination Engine | Pillar 1's Analyze tab visibility decisions + Pillar 2's plain-language explainer routing |

**Why all four ship together (not in sequence):**
- Pillar 1 without Pillar 2 = same dense surfaces in two tabs (no reduction in cognitive load for Novice)
- Pillar 2 without Pillar 4 = Novice sees all the wrong surfaces in plain language (still overwhelming, just nicer)
- Pillar 3 without Pillar 2 = refusal pathways exist but no narrative arc connecting them (operator doesn't know why gates are firing)
- Pillar 4 without Pillar 1 = profile-aware visibility hides surfaces but doesn't restructure the dense ones that remain

**Recommended implementation parallelism:**

Phase A (week 1-2): Pillar 4 infrastructure (profile capture + rules engine + visibility decisions) + Pillar 3 gate wire-up (ReviewStateGate + IdentityTestGate)

Phase B (week 3-4): Pillar 1 IA restructure (Compose / Analyze split) + Pillar 2 Novice tier rendering wire-up

Phase C (week 5-6): Cross-pillar integration testing + copy refinement + operator-feedback loop with PA pilot operator(s) per Track B founder-side work

---

## §6 — What's NOT in scope (explicit)

Per [[razor-sharp-agentic-building]] + scope discipline:

- **Per-tab tier toggle** — global Novice/Pro only at MVP (Q-Novice-3)
- **F&B class-specific metering rules** — Q4 (jelly / sauce / baked good / beverage)
- **Pet food metering** — later still
- **State-by-state cottage food rules** — honest framing only ("check your state ag dept")
- **HACCP plan generation** — current static text per product type remains; Q4 or later
- **Full copy refresh across all surfaces** — Tier-1 surfaces only at MVP (Q-Novice-4)
- **Soft auto-suggestion mechanics for Pro promote** — discovery via explicit toggle works at MVP
- **Per-tab Pro/Novice fragmentation** — single global toggle

---

## §7 — Strategic session agenda implications

The quad doesn't replace existing strategic-session routing questions; it **CONSOLIDATES SEVERAL**:

| Existing routing question | Quad pillar that addresses it |
|---|---|
| Packet Q9 (mode toggle pattern) | Pillar 2 + Pillar 4 (mode toggle IS the Novice/Pro framework; metering is the new dimension) |
| Design system Q-DS-2 (provenance pill primitive) | Pillar 1 (Analyze tab is where DERIVED VALUE primitives live) |
| Catalog Q5 + Q8 (browse/search/filter timing — August vs Q4) | Pillar 4 (profile-aware visibility supersedes generic search/filter for Novice) |
| Strategic Q1 (does August Nutraceuticals ship with metering?) | Pillar 4 entirely (NEW routing cluster) |

**Recommended orientation-doc update:** add quad as **Tier 1 routing item** (currently split across Q9 + Q-DS-2; consolidate). Specifically:

> Tier 1 — Foundational (must lock before any implementation starts):
> 5. **Novice-Readiness Quad** (per `docs/agents/novice-readiness-quad-proposal-2026-05-25.md`) — Compose/Analyze IA + Novice tier rendering + Refusal-bearing gate consumption + Regulatory rigor metering. Consolidates Packet Q9 + design system Q-DS-2 + adds Q-Meter-1/2/3/4. Without the quad, August launch experience for non-expert paying customers is structurally similar to Tridiv's overwhelmed-on-first-touch trial.

---

## Cross-references

- `[[novice-readiness-quad-2026-05-25]]` — companion memory artifact capturing the framework durably across sessions
- `[[external-developer-trial-2026-05-25]]` — Tridiv's experience; motivating evidence
- `[[joy-of-mastery-brand-philosophy]]` — design principles 1 (friction is enemy of joy) + 4 (dignity through software) + 5 (Filing Readiness as narrative arc) + 7 (smart copy that respects intelligence)
- `[[catalog-must-be-coa-spec-sheet-anchored]]` — Pillar 4 metering doesn't conflict (visibility decisions are operator-context, not catalog values)
- `[[platform-scope-vs-facility-food-safety-plan]]` — Pillar 4 boundary discipline; metering surfaces RIGHT-FOR-OPERATOR scope without expanding into facility-side work
- `[[scope-of-work-2026-05-25]]` — Track A scope; quad becomes the August Nutraceuticals MVP work
- `[[world-class-allergen-rendering-roadmap]]` — Pillar 3 intersects with #4 (version-locked allergen snapshot) and #5 (UNDOCUMENTED warning gate)
- `docs/agents/product-packet-architecture-2026-05-25.md` — Q9 reclassification cross-reference
- `docs/agents/design-system-2026-05-25.md` — Pillar 1 maps directly to 5-category encoding (INPUTS → Compose; DERIVED RENDERS + DETERMINATIONS → Analyze; DIAGNOSTICS → Intelligence bar)
- `docs/agents/current-capability-inventory-2026-05-25.md` — Pillar 3 traces to inventory finding #2 (4 unconsumed gates)
- `docs/agents/catalog-architecture-investigation-2026-05-25.md` — candidate Layer 11 (Mode + Product-Class routing) intersects with Pillar 4 profile capture
- `docs/agents/strategic-session-orientation-2026-05-25.md` — update with consolidated Tier 1 quad framing

Commits referenced:
- `a20028c` — Provenance schema landed (Pillar 4 supporting infrastructure)
- `b00c23d` — BatchSheet schema landed (relevant for cGMP-by-manufacturing-model surfacing)
- `e75410a` — LB#4 first half (savedFormulations localStorage hydrate/persist) — relevant for Pillar 2's "welcome back" narrative arc
- `c58c02a` — Matcher head-token length-diff guard — relevant for Pillar 4 bulk-paste behavior under product-class restriction
