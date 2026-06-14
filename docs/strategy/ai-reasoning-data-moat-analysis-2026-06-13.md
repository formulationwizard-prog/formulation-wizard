# AI Reasoning + Data-Moat Analysis — FW-native reading of the strategist meta-prompt

**Created 2026-06-13.** Post-vacation "step forward by stepping back" pass. The bedrock shipped (engine cutover live, 10 compliance surfaces anchored, RLS-verified trust floor, 1423 harness assertions). This doc applies the AI-reasoning + data-moat lens with a **2026–2030 horizon** so the architecture decisions ahead (#17 first) don't preclude that horizon — *without* unwinding the bedrock.

**Inputs:** the verbatim meta-prompt (`ai-data-moat-meta-prompt-source.md`); the world-class build spec (`docs/spec/world-class-build-spec-2026-06-07.md`); the floor/ceiling trust model + data-flow audit (`docs/architecture/data-flow-exposure-audit-2026-06-08.md`); the Platform/Infrastructure fork (`docs/strategy/platform-vs-infrastructure-fork-2026-06-07.md`); the CogniLens competitor note; the #17 RLS findings.

**The load-bearing distinction (stated once, governs everything below):** the rules engine + provenance-anchored lookups + RLS-verified isolation + the harness gate ARE the moat foundation. **AI reasoning layers ON TOP for specific operator-facing capabilities. It never replaces the engine for compliance correctness.** "We don't train on your formulas because we don't need to" holds because the engine is deterministic and architecturally cannot read stored formulas back (verified in the data-flow audit, §A). Every proposal in this doc is bound by that.

> **Routing note.** Where a proposal touches regulatory interpretation, an architectural decision, or harm-critical reframing, it is **flagged 🧭 ROUTE** and framed as a question for the #17 / Opus session — not decided here. Per `feedback_routing_discipline_proportionate_to_stakes`, the reviewer surfaces the concern; it doesn't dictate the remedy.

---

## §1. Reality check — the framework against FW's nature

The meta-prompt is written for a **generic vertical SaaS** whose product is mostly workflow + a database + LLM text generation, and whose differentiation must therefore come from *bolted-on* AI. **FW is not that product.** FW's differentiation is **correctness by construction** — the honest engine that renders a value with its confidence and provenance, blocks a non-compliant claim with a primary-source citation, and refuses to fabricate. Read uncritically, the meta-prompt's best instinct (proprietary process data → moat) is exactly right and *already half-built*; its worst instincts for FW (AI-everywhere, natural-language-everything, viral loops) would degrade a regulated, liability-bearing product into "LLM-autocomplete-with-vibes" — wrong answers as misbranding and safety risk.

Walking the directives, sorted into **APPLY / REFRAME / REJECT**:

| Meta-prompt directive | Verdict | FW reading |
|---|---|---|
| "Go far beyond workflow + basic LLM text gen" | **APPLY (already done, opposite direction)** | FW's "beyond" is *more rigor*, not more generation: a deterministic, citation-anchored engine + harness. The bedrock IS the "far beyond." The risk is reading "beyond" as "more AI" — for FW it means *more correctness*. |
| "AI reasoning that cuts entire processes / time-to-outcome (not just steps)" | **APPLY, with the split** | Real, but only on the **ideation / iteration** axis (reformulation, horizon scanning, packet narrative) — never on the **determination** axis. The thing that cuts time-to-outcome on correctness is already the engine. |
| "Aggressively identify proprietary data collected during workflows → primary moat" | **APPLY — this is the strongest directive** | Exactly the fork doc's "refusal exhaust" insight (every block/flag/low-confidence mark is a labeled datapoint on where the regulatory boundary bites). But the moat data is the **boundary exhaust + predicted/measured pairs + catalog provenance — NOT operator formulas.** See §3. |
| "Continuously learn, reason, predict, optimize → compounding value" | **REFRAME** | Learning improves **screening/suggestion** layers and **prediction accuracy** (honest-uncertainty-as-moat: accuracy compounds over time). It must **never mutate the deterministic correctness floor**, which stays version-controlled and CI-gated. "Continuous learning" ≠ a drifting compliance engine. |
| "World-class UX, high retention, clear ROI" | **APPLY** | Joy-of-mastery brand + continuous-compliance retention + the operator's own accumulating formula history as switching cost. Straightforwardly aligned. |
| "Viral / niche network effects" | **REJECT as written → REFRAME** | FW is a **single-operator trust tool in a trade-secret-sensitive domain**. Operators do not want to share formulas; formula-sharing virality is *anti-thetical* to the trust floor. FW-native network effects are (a) the **data flywheel** (anonymized aggregation → better catalog/predictions for everyone) and (b) the **channel effect** from the fork doc (an insurer/CM pushes operators onto the platform). Neither is "viral/social." |
| "Natural language everything" | **REJECT as written → REFRAME** | A Supplement Facts Panel is a regulated artifact with exact formatting and rounding. NL is the wrong primary interface for structured regulated data. NL belongs as an **entry point** (paste a recipe, ask a question) and an **explanation layer** ("why was this claim blocked?") **over** a structured deterministic core — not as the core. |
| "Agents, predictive insights, smart recommendations, generative + reasoning" | **REFRAME (use with discipline)** | Agents for **bounded research/enrichment/horizon-scanning** (verifiable, cited), yes. Agents making **compliance determinations**, no. Predictions render with confidence + range. Recommendations route back through the gate before display. |
| "Human-in-the-loop where needed" | **APPLY — it's already doctrine** | This *is* the honest-engine + PA-verification + Dr. Carter routing model. FW's HITL isn't a fallback; it's the architecture: determinations route to the Process Authority. |
| "Fine-tuning / few-shot on proprietary data" | **REFRAME (hard constraint)** | Fine-tuning on **operator formulas violates the no-training floor — never.** Few-shot / tuning on **public catalog + anonymized opt-in boundary exhaust + an operator's own in-workspace history** is acceptable. Data source must be explicit and consent-legible per proposal. |
| "Knowledge graph schema" | **APPLY (genuinely valuable)** | An ingredient ↔ interaction ↔ NDI-status ↔ monograph ↔ UL graph is real FW value, not vapor — it powers interaction checks and horizon-scan impact mapping. Worth speccing. |
| "Vector DB / AI orchestration / observability tech stack" | **APPLY, but secondary** | Fine as infrastructure for the AI *layer*. Must not lead — the engine leads; the stack serves the layer on top. |
| "Step 1 MANDATORY: AI + data-moat *before* standard features" | **REJECT the ordering for FW** | This is the deepest misfit. FW's correct sequence is **correctness floor FIRST** (the bedrock — already shipped), **then** AI on top. The engine and gates are not "standard features" to rush past; they are the thing that makes any AI layer trustworthy. Leading with AI in a liability domain is how you ship confident wrong answers. |

**One-paragraph synthesis.** The meta-prompt's gift to FW is its *data-moat* obsession — and FW already discovered the same asset independently (the fork doc's refusal exhaust, the pH-predictor's predicted/measured flywheel). Adopt that, hard. Its trap for FW is its *AI-first, AI-everywhere, frictionless-NL, viral-growth* posture, which is correct for a generic SaaS and corrosive for a regulated trust product. FW-native translation: **correctness floor first; AI as a gated layer on top; the moat is the boundary/prediction data, not the operator's formula; growth is the data flywheel and the channel, not virality.**

---

## §2. AI reasoning surface map

For each delivered artifact in build-spec §2: where the **rules engine + provenance is correct** (the default — most surfaces), and where **AI reasoning genuinely cuts process / time / cognitive load**. The routing rule is constant: **deterministic engine first → AI reasoning second; every AI output that touches a compliance surface routes back through the gate set before it is shown.**

### Engine-correct — NO AI for the determination
| # | Artifact | Why engine-only |
|---|---|---|
| 1 | Supplement Facts Panel | Deterministic formatting/rounding (101.36). AI here = fabrication risk. |
| 2 | Ingredient statement | Deterministic descending-mass ordering (101.4). |
| 3 | Allergen statement | Deterministic FALCPA/FASTER mapping incl. refined-oil exemption — a *rule*, not a guess. |
| 5 | Dosage / UL safety | Deterministic against IOM ULs via ODS. The limit is a citation, never a model output. |
| 6 | NDI compliance | Rule-based status lookup (DSHEA §8 / 190.6). |
| 15 | **Determination engine (classification)** | 111 vs 101.9 classification is **exactly the "AI internal to the platform for compliance = NO" case.** Rules + primary-source citations. This is the line CogniLens crosses ("the platform *is* the expert, returns fixed docs") and FW deliberately does not. |
| 13 | Packaging data sheet | Reference data. |
| 14 | Master specs | Deterministic from formula. |
| 17 | Save / version state | No AI. |

### AI candidates — each with input / output / data consumed / guardrail / routing / harness
Each candidate is **engine-gated**: the AI proposes or narrates; the engine validates or supplies every value.

1. **Reformulation suggestions** *(the headline candidate — generation-as-retrieval)*
   - **Input:** current formula + the binding constraint that fired (UL flag, cost ceiling, allergen conflict, blend-floor, claim block).
   - **Output:** ranked *alternative* ingredients/doses/forms that resolve the constraint.
   - **Data consumed:** catalog + interaction/NDI knowledge graph + (operator's own in-workspace history, never cross-operator). **No operator-formula training.**
   - **Guardrail:** the model proposes only the **skeleton**; the engine supplies and gates every value. **Every suggestion runs the full gate set before display; any suggestion that fails any gate is never surfaced.** This is the generation-as-retrieval pattern the fork doc locks (Locked item 2).
   - **Routing:** engine validates → AI proposes → engine re-validates each proposal. 🧭 ROUTE: *does reformulation ship August or Phase 2?* (recommendation: Phase 2 — see §4).
   - **Harness:** golden assertion — *no surfaced suggestion ever fails a gate*; rejected-suggestion set is asserted non-empty on a deliberately over-constrained formula (proves the gate is actually filtering).

2. **Claim-substantiation walkthrough** *(low-risk, August-viable)*
   - **Input:** a claim the validator (#4) blocked.
   - **Output:** plain-language explanation of *why* it blocked (which rule, which citation) + *what evidence would substantiate* a compliant version.
   - **Data consumed:** the rule registry + 101.93 / DSHEA structure-function rules. Public only.
   - **Guardrail:** the **block/allow verdict stays the engine's** (#4). AI narrates the *already-decided* verdict; it never overturns or softens it. Self-explaining gate, per build-spec §1 (Marcus: "every gate self-explains").
   - **Routing:** engine decides → AI explains.
   - **Harness:** assert the walkthrough's cited rule == the rule the engine actually fired; assert it never renders an "allow" narrative for a blocked claim.

3. **Regulatory horizon scanning** *(realizes the build-spec §4 "Ongoing monitoring" column)*
   - **Input:** public regulatory feeds (FDA warning letters, NDI rulings, monograph changes).
   - **Output:** an **alert** on a stored formula when an incoming change maps to a rule that formula depends on (Dr. Carter: "warning-letter pattern shifts re-flag signed formulas").
   - **Data consumed:** public regulatory corpus + the rule registry + the knowledge graph (ingredient → affected rules). The *matching* reads formula metadata within the workspace only.
   - **Guardrail:** the match **raises a human-review flag, never an automatic re-determination.** AI classifies/maps; PA/operator interprets. 🧭 ROUTE: reg-interpretation — the *mapping rules* (which change affects which surface) are authority-anchored, not model-invented.
   - **Routing:** AI classifies incoming text → maps to rules → engine/registry confirms the dependency → flag.
   - **Harness:** assert an alert fires when a rule/limit a stored formula depends on changes (build-spec §4 already names this assertion); assert no alert silently re-determines compliance.

4. **Predictive stability / cost / manufacturability projections** *(honest-uncertainty-as-moat)*
   - **Input:** formula + ingredient properties; for cost, formula when no operator quote exists.
   - **Output:** a **screening estimate with confidence + range**, explicitly labeled non-determinative — exactly the pH-predictor pattern generalized (CLAUDE.md: cost/shelf-life/bioavailability can reference the same framing).
   - **Data consumed:** catalog + USP <1150> stability references + the **predicted/measured flywheel dataset** (§3) as it accumulates.
   - **Guardrail:** **never rendered as the compliance value** (#7 stability/overage stays the deterministic math). Confidence taxonomy applies from the start (`feedback_confidence_taxonomy_foundational`). Blank-until-real: no fabricated point estimate posing as data.
   - **Routing:** engine renders the deterministic surface → AI offers the labeled screening projection alongside.
   - **Harness:** assert every projection carries a confidence + range; assert it never overwrites or is mistaken for the #7 value.

5. **Ingredient-resolver enrichment** *(#16 — bounded, with the no-substitution net)*
   - **Input:** an operator's unmatched/ambiguous ingredient query.
   - **Output:** ranked candidate matches + synonym suggestions, each with provenance.
   - **Data consumed:** catalog + synonym graph + public sources (DSLD/ODS, Tier-2 enrichment per `reference_nih_supplement_databases`).
   - **Guardrail:** **unmatched → flag, never fuzzy-cross to a different nutrient** (`project_substring_keyword_matching_bug_class`: B6→B2 class). AI proposes; operator confirms; provenance attaches. The no-silent-substitution doctrine is the hard floor here.
   - **Routing:** engine exact-match first → AI proposes candidates for the residue → operator/engine confirms.
   - **Harness:** assert a confirmed match never silently maps to a chemically different nutrient; assert unmatched stays flagged, not auto-resolved.

6. **RA-packet narrative generation** *(#18 — HITL, August-adjacent)*
   - **Input:** the assembled cited verdicts + values from #1–#10.
   - **Output:** reviewer-readable narrative prose assembling those into the sign-off bundle Dr. Carter reads.
   - **Data consumed:** only the engine's own cited outputs. The LLM writes *prose*, supplies *zero values or citations*.
   - **Guardrail:** every number and citation in the narrative is pulled from the engine, not generated. Dr. Carter still signs. 🧭 ROUTE: scope of August #18 narrative vs. structured-only packet.
   - **Routing:** engine produces verdicts → AI narrates → human signs.
   - **Harness:** assert every value/citation in the narrative round-trips to an engine output (no LLM-introduced numbers); diff narrative claims against the structured packet.

7. **Doc-gen narrative sections (Base/Batch #11/12, handoff #19, cGMP #10 SOP drafts)** *(Phase 2, HITL)*
   - **Output:** rationale / special-instruction / SOP-draft prose; the structured fields stay deterministic.
   - **Guardrail:** narrative only; operator edits; structured doc-gen is engine-deterministic.
   - **Harness:** structured fields asserted engine-derived; narrative flagged operator-editable, never a compliance source.

**Map summary:** of 19 artifacts, ~12 are engine-only for correctness. The genuine AI value concentrates in **iteration (reformulation), explanation (claim walkthrough, packet narrative), monitoring (horizon scan), prediction (stability/cost screening), and resolution (resolver enrichment)** — all operator-facing, all engine-gated, none determinative. **AI internal to the platform for compliance determination (#15) is explicitly out of scope** — that's the CogniLens line FW won't cross.

---

## §3. Data moat / flywheel map

Per operator workflow step: what data is generated, its classification, and the flywheel it enables. **Classification governs everything:** operator-private (floor — never leaves the workspace, never trains the system); aggregable/anonymizable (ceiling — a *separate named opt-in stream*, never silent harvest); public-input (feeds the catalog with provenance). The trust model is the session's floor/ceiling: floor = isolation + no-training (universal, RLS-verified); ceiling = consent-gated contribution streams.

| Workflow step | Data generated | Operator-private (floor) | Aggregable / opt-in (ceiling) | Public-input → catalog | Flywheel (compounding value) |
|---|---|---|---|---|---|
| **Formulation** | the formula (ingredients/doses/ratios), resolver queries, reformulation accept/reject | **the formula** (trade secret — never leaves, never trains) | anonymized ingredient **co-occurrence** patterns; **reformulation acceptance rates** (which gated suggestions operators take) | operator-confirmed synonym → enriches resolver with provenance | better reformulation suggestions + richer synonym graph |
| **Compliance review** | every gate verdict, every block/flag/low-confidence mark | which formula triggered it | **the boundary exhaust** — anonymized "how often does combo X approach UL," claim-block frequency, which CFR bites where | — | the **most defensible asset** (fork doc): screening improves; valuable to insurers/RA/regulators → the Infrastructure-tilt data |
| **Batch authoring** | batch records, overages used, yield | all of it (manufacturing trade secret) | anonymized **overage practice** distributions | — | better, evidence-based overage/stability guidance |
| **Manufacturer handoff** | which manufacturers, package structure | the relationship | manufacturer **capability/availability** signals | **vendor spec sheets → catalog provenance** (the workbook-vendors-as-platform-resource doctrine) | launch-day **vendor directory** + COA library compounding |
| **Post-launch monitoring** | **predicted-vs-measured pairs** (stability, cost, pH); reg-change↔formula matches | the formula | the **predicted/measured validation dataset** (opt-in) | — | **honest-uncertainty-as-moat**: prediction accuracy compounds; disclaimers protect the boundary while accuracy improves — *both compound* (CLAUDE.md pH-predictor principle) |

**The three flywheels worth naming explicitly (2026–2030):**

1. **Boundary-exhaust flywheel** — every refusal/flag is a labeled point on where the regulatory line actually bites. Accumulates into the single most defensible asset, and (per the fork doc) the one whose value concentrates **Infrastructure-side** (insurers/RA firms/regulators want it; the refused operator doesn't). 🧭 ROUTE: this is direct input to the **Platform/Infrastructure fork** — the data moat's value distribution is itself fork evidence; surface it into that decision.

2. **Prediction-validation flywheel** — predicted/measured pairs (pH today; stability, cost, bioavailability later) turn a screening tool into a proprietary validated dataset over time. Honest-uncertainty is the *mechanism*, not a limitation.

3. **Catalog-provenance flywheel** — every confirmed resolver match, every ingested vendor spec sheet deepens the provenance-anchored catalog (already the real scrapeable IP per the data-flow audit; catalog-tiering protects it). This is the asset competitors can copy the *result* of but not the *discipline* behind.

**Trust / consent discipline (non-negotiable, the floor commitment made legible):**
- **Floor, universal, no opt-out needed:** the formula never leaves the workspace, never trains the system, RLS-verified isolated. "We don't train on your formulas because the engine architecturally cannot read them back."
- **Ceiling, opt-in, separately named:** aggregable streams (boundary exhaust, predicted/measured pairs, overage distributions) are a **distinct, named, consent-gated contribution** — never derived silently from the private formula. The position paper's commitment — *"opt-in contributions are a separate named stream"* — is the architectural requirement, not just copy.
- **Anonymization is structural, not promised:** aggregable data must be designed so re-identification is infeasible (no formula reconstruction from co-occurrence stats). 🧭 ROUTE: the anonymization architecture (k-anonymity thresholds, what aggregate granularity is safe) is an architectural decision for the #17/backend session.

---

## §4. Strategic addendum to the world-class build spec

Proposed additions that bake AI-reasoning + data-moat strategy into the August foundation **and** the post-August roadmap, **without compromising the bedrock**. These are *proposals for the spec update we do together after review* — not unilateral edits to the living doc.

### 4.1 New doctrines (proposed additions to build-spec §9)
- **AI never bypasses the engine for compliance correctness.** The engine determines; AI proposes, explains, predicts. Routing is always engine-first → AI-second, and every AI output touching a compliance surface routes back through the gate set before display. *(extends "one pipeline, no bypasses")*
- **The moat data is the boundary exhaust + predicted/measured pairs + catalog provenance — never operator formulas.** Aggregable data is a separate named opt-in stream; the formula is floor-protected and never trains the system. *(extends the floor/ceiling trust model)*
- **AI predictions render with confidence + range, never as fact (honest-uncertainty-as-moat).** Continuous learning improves screening/suggestion/prediction layers; it never mutates the deterministic correctness floor, which stays version-controlled and CI-gated. *(extends the confidence taxonomy + blank-until-real)*
- **Natural language is an entry/explanation layer over a structured deterministic core — never the interface for regulated structured data.** *(new — guards against the meta-prompt's "NL everything")*
- **New AI surfaces extend the harness, they don't escape it.** Every AI surface ships golden cases asserting (a) no gate-failing output ever surfaces, (b) predictions carry confidence+range, (c) opt-in data never flows without its named consent flag. *(extends §5 harness)*

### 4.2 New artifact entries (proposed additions to build-spec §2)
| # | Artifact | Type | Notes |
|---|---|---|---|
| 20 | Reformulation engine | AI surface (gated) | generation-as-retrieval; engine re-validates every proposal |
| 21 | Regulatory horizon scanner | AI surface (gated) | realizes the §4 "Ongoing monitoring" column; flags, never re-determines |
| 22 | Reformulation decision ledger | **data artifact** | accept/reject = flywheel input (opt-in aggregable); operator-private until contributed |
| 23 | Prediction-vs-actual ledger | **data artifact** | stability/cost/pH validation dataset; honest-uncertainty flywheel |
| 24 | Boundary-exhaust dataset | **data artifact** | refusal/flag aggregation; the fork-doc asset; Infrastructure-tilt data |

(The data artifacts #22–24 are a new *category* in the spec — surfaces that exist to *capture proprietary process data*, not to render to the operator. They get harness coverage on the consent gate, not on rendering.)

### 4.3 New persona × moment cells (proposed additions to build-spec §4)
- **Maya × Design:** iterates with **engine-gated reformulation suggestions** — when a UL/cost/allergen constraint fires, compliant alternatives surface, accelerating multi-source convergence. *(Phase 2)*
- **Dr. Carter × Ongoing monitoring:** the **horizon scanner** flags his *signed* formulas when warning-letter patterns / NDI rulings shift; the **RA-packet narrative** (#18) is AI-drafted from engine verdicts for his review. *(scanner Phase 3; packet narrative August-adjacent)*
- **Marcus × Compliance:** the **claim-substantiation walkthrough** turns a blocked claim into a self-explaining gate ("here's why, here's what would substantiate it") — directly serves build-spec §1's "every gate self-explains." *(August-viable)*

### 4.4 Phase mapping for AI capabilities
| Phase | AI capabilities | Discipline posture |
|---|---|---|
| **August MVP** | **Minimal, explanation-only.** Claim-substantiation walkthrough (#4 narration); RA-packet narrative draft (#18, HITL). Begin **capturing** boundary exhaust + reformulation ledger (data only, no surfaced AI yet). | Keep August AI to *explanation of engine decisions*, not *generation of new ones*. Lowest liability surface. |
| **Phase 2** | Reformulation engine (#20, generation-as-retrieval, gated); resolver AI-enrichment (#16); cost-estimate screening (#9, confidence+range); doc-gen narrative sections. | Each ships with its golden gate-filter assertions. |
| **Phase 3** | Regulatory horizon scanner (#21); predictive stability (#7-adjacent screening); the opt-in flywheels (#22–24) begin compounding into accuracy gains. | Reg-mapping rules authority-anchored; predictions confidence-ranged. |
| **2028–2030 horizon** | Boundary-exhaust dataset (#24) matures → the **insurer/channel value** (fork doc); knowledge graph deepens (interaction/NDI/monograph); prediction accuracy compounds into a proprietary validated dataset competitors can't shortcut. | This is where the data moat becomes *the* asset — and where its value distribution feeds the **Platform/Infrastructure fork** decision. |

### 4.5 Cross-references to live strategic decisions (so this doesn't float)
- **Platform/Infrastructure fork:** §3's boundary-exhaust flywheel is direct fork evidence — the most defensible data asset concentrates Infrastructure-side. This analysis *sharpens* the fork inputs; it doesn't decide them (Wizard's call). 🧭 ROUTE into the fork.
- **#17 architecture session:** the opt-in contribution streams (#22–24) and the anonymization architecture are backend-schema decisions that belong in the same session as auth-reconciliation + schema-versioning. The `subscription_tier` ceiling mechanism already in the schema is the consent/tier hook. 🧭 ROUTE into #17.
- **CogniLens:** confirms the doctrine bet — they encode the expert and "return fixed docs" (#15-style AI-as-authority); FW surfaces confidence + routes to PA. When their model is wrong on a borderline call, "we fixed it" is liability; "here's our confidence and who must verify" is the dignity+defensibility moat. The AI layer proposed here *preserves* that bet (AI proposes/explains/predicts; never determines).

---

## Resolution — routed 2026-06-13 (operator + Opus session, relayed back to CC)
The three 🧭 ROUTE decisions came back with clean answers. Banked here so they survive the session boundary.

**Decision 1 — Reformulation: August or Phase 2? → PHASE 2 (confirmed).** Three reasons: (a) it's a *new harness category* ("good reformulation" must be defined + asserted across personas) and August's stack (#17 + #18 + #16 + sweep) has no room for a new gated category without compressing quality; (b) trust shape — a suggestion can read as authoritative; the "verify this" framing needs UX iteration that shouldn't be compressed; (c) competitive — "compliance verifier with explanation" lands cleaner than "AI suggestions gated by 47 caveats" (CogniLens is building exactly the suggestion play; ship it *strong* in Phase 2, not hedged in August).

**→ NEW DOCTRINE (banked now, per Opus — the line is thin and implementation pressure will push on it):** **Explanation ≠ suggestion, and the boundary is harnessed.** *Explanation* = stating what the engine determined and why (e.g. "Vit A is at 350% UL"). *Suggestion* = proactively proposing alternatives (e.g. "reduce Vit A from X to Y"). The slide from one to the other is one conversational step ("Why did this fail?" → "Could I reduce it?"). August ships explanation-only; the harness must assert the explanation layer never crosses into proactive alternatives. *(Proposed into build-spec §9 + §4.1 of this doc as RATIFIED.)*

**Decision 2 — Opt-in contribution streams + anonymization fold into #17 (confirmed).** The #17 session must cover: (a) schema for **granular** opt-in flags (per-formula, per-data-type, per-aggregation-purpose — *not* blanket opt-in); (b) anonymization pipeline architecture (where anonymization happens in the flow; stored vs derived); (c) trust commitment enforced *architecturally*, not just contractually; (d) harness coverage for "opted-out data never leaves operator scope" (RLS-style isolation extended to the contribution stream). **Defense-in-depth flag:** consider **physical** separation (separate schema or separate Postgres role) so an RLS bug in the main schema can't leak into the aggregation stream — threat-model the two as distinct. **Foundation, not feature:** the #17 schema *supports* the opt-in flags + anonymization architecture even though **no contribution stream is populated for August** — this preserves Infrastructure-tier optionality without adding August scope.

**Decision 3 — Boundary-exhaust and the fork: SHARPENS, doesn't tilt.** The asset *connects* the two plays into a sequence rather than choosing between them: boundary-exhaust is most valuable to the Infrastructure-tier customer (insurer/CM/RA), but you can't generate it without brand operators using the Platform — **Infrastructure-as-end-state requires Platform-as-bootstrap.** Refined moat thesis: *the engine is the entry ticket; operator workflow data is the input to the Infrastructure-tier value layer.* Trust nuance: monetizing boundary-exhaust at the ceiling needs the position paper to anticipate it — floor ("your formula stays yours," universal/free) + ceiling ("opt in to contribute anonymized patterns in exchange for discount / revenue-share / insights-back"); the opt-in must be granular and the value-exchange tangible, or the contribution stream develops selection bias. 🧭 *The fork-doc update ("Platform and Infrastructure aren't a choice — they're a sequence; boundary-exhaust is evidence FOR the sequenced strategy, not against either side") remains **Wizard's call to finalize** — the fork doc is explicitly a Wizard decision doc, so it is NOT edited unilaterally here.*

**Posture set by the operator: WORKFLOW FIRST.** Everything until August launch is in service of the workflow being the thing that *earns the right* to the Infrastructure layer later. August scope holds unchanged: **#17 save + #18 RA-packet + #16 sector-scoping + the §8 sweep.** August AI = explanation-only. Data-flywheel architecture goes in as *foundation* (schema support), not as feature. Founder-side (PA pilot, pricing/WTP, spoke pages, pre-seed) continues in parallel. **Next anchor: the #17 architecture session** (auth reconciliation — the silent-save bug — is still the actual August unblock).

---

## Bottom line
The bedrock the session shipped IS the moat foundation. The meta-prompt's data-moat instinct is right and FW already discovered the same asset (boundary exhaust, prediction flywheel); its AI-first/NL-everything/viral posture is a generic-SaaS reflex that would unwind the trust floor if applied literally. **FW-native translation: correctness floor first; AI as a gated layer on top; the moat is the boundary/prediction/provenance data, never the operator's formula; growth is the data flywheel and the channel, not virality.** The capabilities proposed here each have a concrete input/output/guardrail/routing/harness spec and each respects the floor. The architectural and reg-interpretation decisions are flagged 🧭 ROUTE for the #17/Opus session and the Platform/Infrastructure fork — not decided here.

*Reviewable by Opus + operator. Bridges "August MVP" → "2026–2030 category leader," anchored in the bedrock, not unwinding it.*
