# Agent Roster + Deployment Guide

**Audience:** Future Claude agent picking up this project for the first time, or any session needing a clear read on who-does-what + what can be automated.

This project operates with a three-role human/AI relay model plus one project-deployed validation subagent. Built-in Claude Code subagents (Plan, Explore, general-purpose) are also available for specific shapes of work. Several automation surfaces are available but most are intentionally not yet deployed — current stage favors manual invocation discipline over premature automation.

---

## 1. The relay model (3 roles)

Most decisions and most work travel through this triangle. Understanding which role is doing what at any given moment is the most important context for a new agent.

### Operator

**Who:** `formulationwizard@gmail.com` — domain expert, business owner, decision authority.

**Function:**
- Final call on scope, sequencing, routing decisions
- Cross-session relay between Opus and CC (since they cannot talk to each other directly)
- Holder of business context, customer relationships, regulatory affairs decisions
- Owns the workspace surface that CC and Opus build for

**Constraint:** Operator's time is the most expensive resource. Optimize for their attention. Surface findings, propose routing, recommend — don't demand.

### Opus (you, in claude.ai)

**Who:** Claude Opus in a claude.ai conversation, accessed separately from Claude Code. Not the same agent as the harness-attached CC session.

**Function:**
- Architecture, sequencing decisions, scope routing
- Brand-voice review, strategic framing
- Bidirectional verification on directives — flagging coupling issues, missing context, scope drift
- Authoring of routing artifacts (e.g., Q-Audit decisions, verification passes)

**Constraint:** Opus never executes code or commits. Opus produces routing artifacts; CC executes. Opus's output is durable when captured in `docs/` or CC memory, not when it lives only in a chat thread that can be archived or paused.

### CC (Claude Code, harness-attached)

**Who:** Claude session running in the Claude Code CLI/IDE harness. Has access to the filesystem, git, bash, the catalog files, and the validator subagent.

**Function:**
- Implementation (file edits, code changes, commits)
- Test-suite execution + validator invocation
- Pre-flight verification (unscoped grep, ground-state checks)
- Memory writes to the harness memory directory
- Pause-and-surface on routing ambiguity rather than guessing

**Constraint:** CC operates within the operator's session and the operator's permissions. CC should not commit without authorization; should not expand scope beyond what was directed; should verify ground state during execution before writing.

### Bidirectional verification doctrine

Pushback from any role is the verification standard working, not friction. CC pushes back on Opus directives when ground state contradicts. Opus pushes back on operator routing when scope expansion is implied. Operator pushes back on CC recommendations when business context overrides technical defaults. None of these are conflicts; they're the system catching errors before they compound.

---

## 2. Project-deployed subagent

### catalog-entry-validator

**Location:** `.claude/agents/catalog-entry-validator.md`
**Invocation:** `Agent(subagent_type="catalog-entry-validator", description="...", prompt="...")`

**Purpose:** Mechanical validation of catalog entries (additions, modifications, backfills) in `lib/data/supplements.ts` and `lib/data/stacks.ts` before commit. Runs 24 mechanical rules / 12 hybrid rules / 9 judgment-call rules / 8 coverage-gap rules from the Catalog Authoring Rulebook.

**When to invoke:** Before every catalog commit during Waves 1.5 through 6 (the validator's active phase per its README). At Step 1 schema migration and post-Step-1 Wave 4+ work, the rule set expands; the validator is built for that growth.

**What it returns:** A structured verdict — PASS / PUSHBACK-ENTRY / PUSHBACK-STRUCTURAL / ROUTING-REQUIRED — with specific rule citations.

- **PASS** — commit proceeds
- **PUSHBACK-ENTRY** — entry-specific authoring error; fix before commit
- **PUSHBACK-STRUCTURAL** — catalog-wide structural gap (e.g., pre-migration baseline); commit proceeds with logged context
- **ROUTING-REQUIRED** — human judgment needed; operator + Opus route before commit

**How to brief it:** Pass the entry's post-diff state in full context. The validator reads the actual files; you describe the scope of changes + the rationale + any pre-flight discoveries that affect interpretation. Example:

```
"Validate the Step 0.5c.i Specialty Compounds migration changes to
lib/data/supplements.ts. Scope: 6 entries recategorized + SAMe
renamed per §II.9a Refinement 3. MSM excluded per Phase 2 queue.
§38a pre-flight grep confirmed no stranded duplicates. Run standard
mechanical/hybrid/judgment checks."
```

**Why it exists:** Catalog authoring discipline is too detailed for manual checking on every commit. The validator catches structural gaps, naming-convention deviations, harm-critical-floor violations, and rule-set coverage gaps that humans miss when working in flow. It is the first line of compliance defense for the catalog itself.

**Limit:** The validator validates against the rulebook. It does not validate domain accuracy — that's still SME work. A formally valid entry can still be substantively wrong on dosage, supplier, or regulatory status.

---

## 3. Built-in Claude Code subagents

These come with the Claude Code harness; no project setup required. Each has a specific shape it handles well.

### Plan

**Invocation:** `Agent(subagent_type="Plan", ...)`

**Use for:** Software architect agent for designing implementation plans. When a task needs step-by-step plan, identification of critical files, and consideration of architectural trade-offs before execution.

**This project's use cases:** Step 1 schema migration planning, Wave 4 schema-locked entry plan, Round 12+ refactor sequencing.

### Explore

**Invocation:** `Agent(subagent_type="Explore", ...)`

**Use for:** Fast read-only search across the codebase. Finding files by pattern, grepping symbols/keywords, answering "where is X defined / which files reference Y."

**This project's use cases:** Cross-file dependency tracing, finding all references to a substance across the catalog, locating implementations of disciplines mentioned in docs/.

**Specify breadth:** `quick` (single lookup), `medium` (moderate), `very thorough` (multiple locations + naming conventions).

### general-purpose

**Invocation:** `Agent(subagent_type="general-purpose", ...)` or omit subagent_type entirely.

**Use for:** Multi-step research questions, searching for code with uncertain location, executing multi-step tasks that need fresh context not yet loaded into the main session.

**This project's use cases:** Heavy investigation work that would crowd main session context, parallel research across multiple files, pre-flight verification for major work units.

---

## 4. Automation options — tiered by current relevance

The project favors manual invocation discipline over premature automation at current stage. The disciplines are still being shaped; locking them into hooks before they stabilize creates lock-in that's expensive to undo.

That said, several automation surfaces ARE available and some make sense to deploy now.

### Tier 1 — Deploy now (high-value, low-risk)

**Pre-commit validator hook**

- **What:** Settings.json hook that runs `catalog-entry-validator` automatically before any commit touching `lib/data/supplements.ts` or `lib/data/stacks.ts`.
- **Why now:** Removes "did I remember to invoke the validator?" mental load. The discipline already requires this per Rulebook §VI.29; making it mechanical removes the failure mode where a commit lands without validation.
- **Risk:** Low. Validator is read-only; cannot modify code. Worst case: false negative (validator misses something), which is the same state as forgetting to invoke manually.
- **Deploy via:** `/update-config` skill — adds a hook to `.claude/settings.json` for the `PreToolUse` or `PreCommit` event matching catalog file patterns.

**Pre-commit test-suite hook**

- **What:** Settings.json hook that runs `npm test` automatically before any commit touching catalog or library code.
- **Why now:** Already required by §VI.29 pre-commit test gate discipline. Currently CC runs manually each time; automation removes the gap.
- **Risk:** Low. Test failures correctly block commit. The transient cold-cache failure mode observed in Step 0.5c.i (first run failed, retry passed) is a non-issue for hooks — operator can investigate and retry.
- **Deploy via:** `/update-config` or hand-edit `.claude/settings.json`.

### Tier 2 — Consider for next major round (medium value, conditional)

**Background unattended migration sessions**

- **What:** Run 0.5c.ii through 0.5c.vii in background once Opus routing decisions land. CC executes each cluster unattended; operator reviews at session boundaries.
- **Why later:** Three of the five remaining sub-tasks are blocked on Opus routing decisions that haven't landed (Q-Audit-2, Q-Audit-4, PS routing). When routing artifacts exist, background execution becomes viable.
- **Risk:** Medium. AUP false positives in long unattended sessions documented (see `feedback_aup_verify_dont_retry.md`). Verify-after-write discipline mitigates but doesn't eliminate.
- **Deploy via:** `run_in_background: true` on Agent calls or Bash tasks. Operator monitors via Monitor tool.

**/loop for recurring drift checks**

- **What:** Periodic catalog-wide unscoped grep for duplicate SKUs, mis-categorizations, structural-gap regressions between waves.
- **Why later:** Useful when catalog reaches ~500+ entries; premature at 392 entries. Drift surfaces faster than the audit cycle catches it at small scale.
- **Risk:** Low. Read-only audit; surfaces findings, doesn't act on them.
- **Deploy via:** `/loop` skill with appropriate interval (likely 24-48h).

### Tier 3 — Defer until launch run-up (low current value)

**Scheduled remote agents (`/schedule`)**

- **What:** Cron-style scheduled agents for routine maintenance — e.g., daily catalog health checks, weekly PA queue status reports, pre-launch readiness audits.
- **Why later:** Premature until ~2 months before August 2026 launch. Current discipline catches issues in flow; scheduled checks add value when the cadence of human review drops.
- **Deploy via:** `/schedule` skill when timing is right.

**`/loop` for Phase 2 verification queue status**

- **What:** Recurring check whether any new supplier-spec verifications landed in `docs/pa-verification/` or memory.
- **Why later:** Phase 2 queue items resolve on supplier timelines, not predictable cadence. Operator-driven check works fine at current item count.

**Status line setup for ambient context**

- **What:** Status line showing current branch, last commit, active sub-task, etc.
- **Why later:** Useful when multi-session work becomes frequent. Current state can be checked via `git status` + recent commit log.
- **Deploy via:** `statusline-setup` subagent.

---

## 5. What's NOT recommended for automation

- **Catalog entry authoring itself** — Stays human (operator + CC + Opus relay). Automated entry generation would bypass the discipline that makes the catalog credible.
- **Regulatory determinations** — Always route to Process Authority verification. Automation here would violate the customer-owned PA model that's the platform's moat.
- **Brand voice / marketing copy** — Capability-then-copy sequencing discipline says copy waits for engine state. Premature automation would generate copy ahead of capability.
- **SME-validated test verdicts** — `[SME]`-tagged tests in the QA plan need qualified human review. Automation here would generate false-greens that erode trust.

---

## 6. Recommended next-step automation

**Single-highest-value deployment now:** Pre-commit validator + test hooks per Tier 1 above. Both are required by Rulebook §VI.29 already; automation removes the human-remembrance failure mode without changing the discipline.

**Effort:** ~10 minutes via `/update-config` skill or hand-edited `.claude/settings.json`. CC can author the hook configuration; operator reviews and applies.

**Everything else stays manual until current discipline shows it's stable enough to lock in.**

---

## 7. For future sessions reading this doc

If you're picking up this project cold:

1. Read `AGENTS.md` (project root) + `CLAUDE.md` (references AGENTS.md) — top-level context
2. Read `docs/architecture/catalog-authoring-rulebook.md` — constitution governing catalog work
3. Read `docs/handoff/opus-session-handoff-2026-05-23.md` (or most recent handoff) — Round 12 state
4. Read `docs/qa/nutraceuticals-workspace-test-plan.md` — testing surface
5. Check CC memory `MEMORY.md` index — disciplines, decisions, project state
6. This doc — agent roster + automation options

For routine catalog work, use the validator subagent before commit. For architecture questions, route to Opus via operator relay. For domain accuracy questions, route to SME via operator.

### Canonical reference documents

These are landed reference material — read on-demand when scoping the listed surface area, NOT part of the cold-start reading sequence above:

- **[`docs/agents/product-packet-architecture-2026-05-25.md`](product-packet-architecture-2026-05-25.md)** — Canonical reference for any architectural conversation touching the Packet (per-product workspace + folder), `SavedFormulation`, `FormulationVersion`, `BatchSheet`, Saved tab, PA-review machinery, OperatorProfile (operator-level inheritance), or operator-input artifacts (PA letters / certifications / vendor relationships / facility SOPs). 9 routing questions (Q1–Q9) parked for next Opus + co-founder strategic session; don't let them drift. Implementation is downstream of launch-blocker #4 (Supabase save backend); reference doc itself ships no code.
- **[`docs/agents/design-system-2026-05-25.md`](design-system-2026-05-25.md)** — Canonical reference for any UI/UX/copy/styling work. Encodes the workspace's 5-category content model (INPUTS / DERIVED VALUES / DERIVED RENDERS / DETERMINATIONS / DIAGNOSTICS) as visual primitives, each with default visual treatment + default copy stance + default behavior baked in per [[joy-of-mastery-brand-philosophy]] (CC memory). Component vocabulary (buttons / pills / alerts / spacing / typography) derives from the categorical encoding. Audit findings + 7-commit refactor sequence ~15-22 hr CC work. Cross-references the external developer trial signal (overload diagnosis) + world-class allergen roadmap (provenance pill primitive) + Packet memo Q9 (mode toggle work is downstream of design-system landing).
- **[`docs/agents/f3-tier-1-supplier-spec-scraping-engineering-brief-2026-05-23.md`](f3-tier-1-supplier-spec-scraping-engineering-brief-2026-05-23.md)** — F3 Tier 1 agentic supplier-spec ingestion engineering brief. Feeds the catalog enrichment side that Packet references.
- **[`docs/agents/supplement-allergen-wire-up-assessment-2026-05-23.md`](supplement-allergen-wire-up-assessment-2026-05-23.md)** — FALCPA species-naming wire-up assessment + sequencing. Wire-up has shipped (commits b654f49 + 8c7d140 + Format B 23aa693); doc preserved as the scoping origin.
- **[`docs/agents/nutrition-facts-math-diagnosis-2026-05-23.md`](nutrition-facts-math-diagnosis-2026-05-23.md)** — NFP math correctness investigation. Diagnosis + fixes have shipped (commit b0919ec); doc preserved as the rationale trail.

When a prompt touches a surface covered by one of these references, **cite the doc back in your response** so the operator can verify you're working from current architectural ground state.

---

The disciplines compound. The relay model works. The automation surfaces are there when you need them.
