# Runtime-Reframe-as-Hybrid Architecture Decision

**Status:** Architectural decision capturing the hybrid (pre-populated frequently-queried core + runtime long-tail authoring) shape as the structural direction for the catalog-authoring agent stack.
**Established:** 2026-05-21 (operator + Opus + CC pressure-test session, post-Q-Audit-1 closure).
**Surfacing events:** Session-end reframe 2026-05-20 surfaced the runtime-vs-build-time architectural question; 2026-05-21 pressure-test produced the verdict; grounded cost economics produced via web-searched Anthropic API pricing.
**Audience:** Claude (catalog-authoring agent + runtime authoring agents) primary; human operator (Wizard) secondary; downstream readers (collaborators, advisors, investors, future-Claude sessions) tertiary.
**Cross-references:** [docs/audits/q-audit-1-final-routing.md](../audits/q-audit-1-final-routing.md) (Round 12 sequencing locks); [docs/architecture/cost-and-vendor-architecture.md](cost-and-vendor-architecture.md) (four-layer architecture); [docs/architecture/catalog-authoring-rulebook.md](catalog-authoring-rulebook.md) §II.9a (qualifier-discipline refinements that gate runtime authoring).

---

## 1. Architectural decision and direction

The **hybrid architecture** — pre-populated frequently-queried catalog core combined with runtime long-tail authoring — is the structurally sound shape for the catalog-authoring agent stack. Pure runtime-only architecture is structurally weaker (sacrifices seven distinct architectural benefits — see §3). Pure build-time architecture misses the Phase-4 collapse benefit that runtime authoring enables: long-tail reference-substance gap-filling becomes a non-issue when authoring happens at point-of-use rather than via pre-launch enumeration.

Decision confirmed via operator + Opus + CC pressure-test session 2026-05-21. An eight-question pressure-test framework evaluated architectural coherence, validator integration, PENDING-suffix discipline at runtime, manufacturer/vendor handling at runtime, validator M-rules dependency chain, cost economics, sacrifices-vs-pure-runtime inventory, and hybrid feasibility. Verdict: hybrid is the load-bearing direction.

This document captures the decision space and the load-bearing analysis behind it. Specific commitments (pricing tier, partial-vs-full launch timing, Step 1 sub-wave scope reduction, agent model assignments) are deferred — see §9 for what's decided vs. deferred.

---

## 2. The runtime-agent reframe

The architectural question that triggered the analysis: should the catalog-authoring agent stack operate at **build-time** (pre-launch catalog enumeration) or at **runtime** (when operators query the platform with ingredients)?

**Operator framing (verbatim):**

> *"What if we make Claude agents work for the tool and the user when they input their ingredients?"*

The runtime path:

1. Operator pastes a formulation, or types an ingredient name
2. Runtime Ingredient Resolution Agent identifies what was pasted
3. Cache hit → return existing catalog entry
4. Cache miss → Runtime Catalog Authoring Agent activates: reads operator-uploaded manufacturer documentation; authors an entry against §II.9a + Q-Sh shapes + manufacturer/vendor distinction + harm-critical floor; validator gates the runtime entry
5. Entry persists with PENDING-suffix where PA verification is needed; operator sees verified ingredient with proper sourcing in their formulation

The catalog becomes a **growing organism**: comprehensive coverage through use, not through pre-launch enumeration. This aligns with the platform's existing epistemic posture (honest-uncertainty-as-moat; operator-verified sourcing; harm-critical floor): operators bring manufacturer documentation to the platform; agents structure it into catalog-ready entries; no training-data assertions; data has provenance because operators provide source documentation.

The reframe doesn't replace the build-time architecture; it complements it. The hybrid (§1) is what falls out when the reframe is pressure-tested against the locked Round 12 architecture.

---

## 3. Why the hybrid, not pure runtime

Pure runtime-only architecture sacrifices seven specific architectural benefits that the hybrid preserves. The hybrid keeps build-time discipline for the pre-populated frequently-queried core (~600 existing catalog entries cover most operator queries); runtime applies only to long-tail substances where the trade-offs are acceptable.

**The seven sacrifices of pure-runtime architecture:**

1. **Search/browse before queries fire** — sparse runtime catalog has no browseable depth. Pre-populated catalog supports discovery-mode operators (operators who don't already know what they're looking for).
2. **Demo-day completeness signaling** — "50 ingredient entries, grows through use" is harder to sell to investors and prospects than "500 ingredient entries day-one." The honest-uncertainty-as-moat brand voice supports the runtime framing, but commercial reality with investors and prospects pushes the other direction.
3. **Competitive parity day-one** — better-stocked competitor platforms may win deals on the basis of breadth. Counterargument: better-stocked competitors are typically less honest about uncertainty.
4. **Catalog-as-discoverable-resource** — "find me ingredients with property X" is hard if the catalog hasn't been queried for X. Build-time catalog supports this immediately.
5. **Cross-stack predictability** — the §IV.22 wave-sizing companion-check discipline (validator H7) has no natural place in per-query authoring; stack-data structure weakens over time for long-tail substances queried in isolation.
6. **Worked-example evidence base for the rulebook** — the Q-Audit-1 pattern (5 §II.9a refinements emerged through per-pair routing work; see `q-audit-1-final-routing.md` §11 Pattern D) requires session structure for bidirectional verification + framework articulation. Runtime authoring has no equivalent "session" surface — rulebook discipline maturation slows.
7. **Phase 2 verification queue routing pattern** — the structured batched-review process (23 items routed to 2 queue files via Q-Audit-1) is replaced at runtime by per-entry PENDING-suffix discipline. The PENDING-suffix works, but the batched-review queue-process structure disappears.

The hybrid preserves all seven for the pre-populated core. Long-tail substances (typically operator-niche substances unique to a particular product line) sacrifice items 1, 4, and 5 only — trade-offs the architecture accepts as long-tail-appropriate.

---

## 4. Dependency chain and gating

Runtime authoring depends on validator enforcement of the §II.9a five qualifier-discipline refinements (committed at hash `159de40`) and the structured `manufacturer` field replacing the legacy `suppliers: string[]` array (per `cost-and-vendor-architecture.md` §3).

**Two architectural gates determine when runtime authoring becomes viable:**

- **Step 0.5c.vi (5-8 sessions; per `q-audit-1-final-routing.md` §12)** — validator §II.9a M-rule enforcement comes online. **Partial runtime authoring viable** against pre-Step-1 schema: naming-discipline, qualifier-discipline, and tier-attribution evidence bar all enforceable; structured `manufacturer` field not yet enforced. Runtime entries can author with the legacy `suppliers: string[]` shape at partial quality.

- **Step 1 (12-25 sessions; per `q-audit-1-final-routing.md` §13)** — structured `manufacturer` field enforcement; manufacturer/vendor distinction validator-enforceable. **Full runtime authoring at production quality.**

**The deferred sequencing decision:** does runtime authoring launch at partial quality after Step 0.5c.vi (sooner, but with legacy `suppliers: string[]` shape and incomplete validator enforcement), or wait for full quality after Step 1 (later, but with full architectural discipline)?

This sequencing decision depends on:
- Pricing-tier commitment (see §6) — partial-quality runtime is harder to charge for at premium tiers
- Customer-segment clarity — are early customers willing to accept partial-quality runtime for early access, or do they need full-quality runtime to evaluate the platform?
- Phase 2 (concurrent re-author) scope decisions — what fills the 10-16 sessions of Step 1 if partial-quality runtime is the bridge?

The reframe does NOT shorten the critical path. Either gate must complete before runtime authoring begins; the choice is between partial-now and full-later, not between runtime-now and waiting.

---

## 5. Cost economics

Grounded against canonical Anthropic API pricing as of 2026-05-21 (verified via `platform.claude.com/docs/en/about-claude/pricing`). The three-agent runtime stack:

### Per-component model assignments (recommendation; not committed)

- **Ingredient Resolution Agent** — Haiku 4.5 ($1 / $5 per MTok input/output) — task is pattern-matching catalog-grep results to operator input; doesn't require Opus reasoning
- **Catalog Authoring Agent** — Opus 4.7 ($5 / $25 per MTok) — complex reasoning required: rulebook compliance, §II.9a discipline, manufacturer/vendor structure synthesis, harm-critical floor enforcement
- **Validator Agent** — Sonnet 4.6 ($3 / $15 per MTok) — mechanical rule checks + grep-based verification + routing-question framing

Model assignments may be revised during Step 0 multi-agent infrastructure build based on smoke-test results. Sensitivity note: Haiku 4.5 vs Sonnet 4.6 for Ingredient Resolution is a ~3× cost difference on that component, warranting empirical validation rather than recommendation-locked commitment.

### Per-query cost (cache-warm; rulebook + arch docs + system prompts cached)

- **Cache-hit query (existing catalog entry):** ~$0.005
- **Cache-miss query (new-entry runtime authoring):** ~$0.47

(Cold-cache cost: ~$0.77 cache-miss. Cached-rulebook portion ~50K tokens at 1-hour cache write 2× input premium pays back after 2 reads per Anthropic prompt-caching documentation.)

### Per-operator-per-month cost (industrial-formulator scenario, 100 queries/month)

| Catalog maturity scenario | Cache-miss rate | Monthly API cost |
|---|---|---|
| **A — Early (operator #1-50; sparse catalog)** | 60% | **~$28.40** |
| **B — Mid (operator #100-500; growing catalog)** | 30% | **~$14.45** |
| **C — Mature (operator #1000+; dense catalog)** | 10% | **~$5.15** |

**Hybrid-architecture finding:** the hybrid starts at **Scenario B economics from day one**, not Scenario A. The ~600 pre-populated catalog entries cover most operator queries; only long-tail substances cache-miss. This is a material economic advantage of hybrid over pure-runtime.

(Caveat: Opus 4.7 uses a new tokenizer that may use up to 35% more tokens for the same input text vs. Opus 4.1 and earlier. Per-query estimates above bake this in.)

---

## 6. Pricing-tier feasibility analysis

Assumption: target gross margin 70-80%; allocate ~15% of subscription revenue to API/compute costs.

| Tier | API budget (15% of revenue) | Scenario A ($28.40) | Scenario B ($14.45) | Scenario C ($5.15) |
|---|---|---|---|---|
| **$99 (single-formulator)** | $14.85 | ❌ unprofitable | ⚠️ compressed | ✅ viable |
| **$299 (small business)** | $44.85 | ✅ viable | ✅ comfortable | ✅ comfortable |
| **$499 (growing business)** | $74.85 | ✅ comfortable | ✅ comfortable | ✅ comfortable |
| **$999 (enterprise)** | $149.85 | ✅ comfortable | ✅ comfortable | ✅ comfortable |

**Pricing-tier findings (analysis captured; commitment deferred):**

- **$99 tier is structurally incompatible** with runtime architecture in early/mid platform stages. Only becomes viable once catalog reaches Scenario C maturity (1000+ operators).
- **$299/month is the minimum viable runtime-architecture entry tier** from day one. Comfortable margins across all maturity scenarios at 100 queries/month.
- **$499/month gives margin headroom** for funding-path optionality. Recommended pricing-tier framing if the runtime architecture story is load-bearing for the platform's value proposition.
- **Heavy-volume operators (300+ queries/month)** need $499+ tier even at Scenario C maturity.

**Volume sensitivity:** at 300 queries/month, Scenario A becomes ~$85, Scenario B becomes ~$43, Scenario C becomes ~$15. $99 tier breaks at moderate volume in early stages; $299 tier stays viable through 300 queries/month at all maturity scenarios.

**Pricing-tier commitment deferred.** Analysis is captured to inform a future operator + Opus session that resolves the pricing decision when customer-segment clarity, funding-path constraints, and partial-vs-full launch timing (see §4) are jointly considered.

---

## 7. Engineering requirements

Two engineering requirements surfaced from grounded cost analysis; both belong in Step 0 multi-agent infrastructure work:

**(1) Spec-sheet preprocessing.** Full-PDF spec-sheet uploads bloat authoring agent input cost (~$0.13 per 25K additional tokens at Opus 4.7 input rate). Implementation: extract-relevant-sections preprocessing or `max_content_tokens` limits before the authoring agent runs. This is not a blocker; it is a load-bearing implementation Step that determines whether the cost economics in §5 hold under realistic operator inputs.

**(2) Cache warming strategy.** 1-hour cache writes (2× input rate; pays back after 2 cache reads per Anthropic prompt-caching documentation) make sense for runtime authoring sessions. The ~50K-token cached portion (rulebook + arch docs + types/index.ts schema + validator system prompt) should be warmed at session start and kept hot across the operator's multi-hour formulation session. Implementation discipline: `cache_control` placed on the right portions of the system prompt; cache refresh on operator activity.

Both requirements need to be specified during Step 0 architecture work, with smoke-tests validating that the cost economics hold under realistic operator query patterns and spec-sheet upload sizes.

---

## 8. Round 12 sequencing implications

The hybrid architecture maintains the locked Step 0 / 0.5 / 1 / Steps 2-8 sequencing per `docs/audits/q-audit-1-final-routing.md` §13. The hybrid is not a re-plan; it is a refinement that determines what gets built when and how.

**Changes from the original Round 12 plan:**

- **Step 0 (multi-agent infrastructure)** expands to include runtime authoring agents (Resolution, Authoring, Validator-runtime-invocation patterns). The original Step 0 scope assumed build-time agents; runtime agents need the same definitional discipline plus the engineering requirements from §7.
- **Step 0.5c.vi** becomes a partial-runtime-authoring gate (see §4) in addition to its existing catalog-hygiene + validator-update scope.
- **Phase 4 (reference-substance gap-filling)** — from the parallel-Opus framing — **collapses into runtime authoring**. Long-tail substances author at point-of-use rather than via pre-launch enumeration. This is the reframe's primary contribution to schedule efficiency.
- **Phase 2 (concurrent re-author)** scope may reduce — frequently-queried core only; long-tail authors at runtime. Scope-reduction decision deferred pending pricing-tier and partial-vs-full launch timing decisions.
- **Step 5+ (UI / launch)** gains runtime authoring UX layer scope: operator-facing ROUTING-REQUIRED interaction surface, PENDING-suffix disclosure UX, manufacturer-selection vs commodity-default decision UX.

**Planning vocabulary:** Steps (per Q-Audit-1 final routing §13) — not Phases (which were parallel-Opus reasoning-session vocabulary). All sequencing decisions evaluate against the locked Step ordering.

**August 2026 MVP framing** operates as a forcing function for sequencing efficiency, not as a milestone to negotiate against. Decisions that fit August efficiency proceed; decisions that don't get flagged once as structurally incompatible.

---

## 9. What's decided vs deferred

**Decided (architectural direction):**

- Hybrid architecture (pre-populated frequently-queried core + runtime long-tail authoring) as the structural direction
- Grounded cost economics per Anthropic API pricing as of 2026-05-21
- Pricing-tier feasibility analysis captured (§6) as input to future commitment
- Phase 4 (reference-substance gap-filling) collapse into runtime authoring
- Round 12 Step ordering unchanged from Q-Audit-1 final routing §13
- Planning vocabulary: Steps (not Phases)
- August 2026 MVP framing as forcing function (not negotiable milestone)

**Deferred (pending future decisions):**

- Pricing-tier commitment ($99 / $299 / $499 / $999) — depends on customer-segment clarity + funding-path constraints
- Partial-vs-full launch timing (Step 0.5c.vi gate vs Step 1 gate) — depends on pricing-tier + customer-segment + Phase 2 scope decisions
- Step 1 sub-wave scope reduction (specifically, whether Phase 2 concurrent re-author scope shrinks because long-tail moves to runtime)
- Agent model assignments (Haiku 4.5 / Opus 4.7 / Sonnet 4.6 are recommendations pending Step 0 smoke-test validation)
- Spec-sheet preprocessing implementation strategy (Step 0)
- Cache warming `cache_control` placement strategy (Step 0)

---

## 10. Cross-references

**Committed artifacts (this repo):**

- [`docs/audits/q-audit-1-final-routing.md`](../audits/q-audit-1-final-routing.md) — Round 12 sequencing locks; Step 0.5 sub-task breakdown (§12); Step ordering (§13)
- [`docs/architecture/cost-and-vendor-architecture.md`](cost-and-vendor-architecture.md) — four-layer architecture; manufacturer/vendor distinction; cost-as-indicative reframe
- [`docs/architecture/catalog-authoring-rulebook.md`](catalog-authoring-rulebook.md) §II.9a — five qualifier-discipline refinements that gate runtime authoring
- [`docs/audits/rulebook-vs-types-drift.md`](../audits/rulebook-vs-types-drift.md) §6 — Q-Sh1/Sh2/Sh3/Q1 reconciliations
- [`.claude/agents/catalog-entry-validator.md`](../../.claude/agents/catalog-entry-validator.md) — validator definition; gates runtime entries via the same discipline that gates build-time entries
- [`docs/roadmap/acidified-foods-ph-predictor.md`](../roadmap/acidified-foods-ph-predictor.md) — cross-domain transfer of honest-uncertainty-as-moat discipline (F&B Recipe Validator Q4 2026+)

**Session context (CC harness memory):**

- `~/.claude/projects/c--Users-chefc-formulation-wizard-live/memory/project_runtime_reframe_hybrid_architecture.md` — full 10-section session capture; pressure-test verdict; decision status snapshot

External readers of this document do not need access to the CC harness memory to understand the architectural decision; the memory captures additional session-process context (eight-question pressure-test framework verdicts, operator-Opus-CC three-action sequencing) that supplements but doesn't gate this document's load-bearing content.

---

## Closing note

The runtime-reframe-as-hybrid architectural decision is the structural answer to a specific class of catalog-completeness vs. catalog-quality trade-offs surfaced during Round 12 planning. The hybrid preserves what build-time architecture does well (catalog discipline, search-browse coverage, rulebook-maturation surfaces) while capturing the runtime architecture's contribution (Phase 4 collapse, point-of-use authoring, catalog-as-growing-organism framing).

The decision space is captured at the magnitude its load-bearing role deserves. Specific commitments (pricing tier, partial-vs-full launch timing, model assignments) are deferred to future operator + Opus sessions when the input-readiness (customer-segment clarity, funding-path constraints, Step 0 smoke-test results) supports them.

— Runtime-Reframe-as-Hybrid Architecture Decision established 2026-05-21 (operator + Opus + CC pressure-test session); document authored 2026-05-22.
