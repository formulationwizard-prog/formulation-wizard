# Strategic Session Orientation — 2026-05-25

**Purpose:** Top-of-session 1-pager. Read at the start; saves ~20 min of orienting.
**Read time:** ~3 min.
**Use:** Open before the session. Refer back when scope drift creeps in.

---

## Where we are

Architectural ground state is the strongest it's been in this project's history. Today (2026-05-25) closed a major doctrine + scoping chapter: 30 commits shipped, 11 memory artifacts saved, 4 substantive scoping memos landed. The "what to build" question is largely answered across catalog, Packet (per-product workspace), and design system surfaces. The "in what order" question needs this session.

Two peer tracks run concurrently for the next 6–8 weeks to August Nutraceuticals launch:
- **CC implementation track** — save backend → design system parallel → Packet UI → Base/Batch → world-class allergen → mode toggle
- **Founder-side parallel track** — PA pilot operator recruitment (4–6 week cycle, must start now) + pricing decision (gates pilot NDA signing) + marketing site narrative work + commercial/legal artifacts

Neither track subordinates the other. Both must progress.

---

## Input pack (read before session)

| Artifact | Purpose | Key questions |
|---|---|---|
| **[Packet architecture memo](product-packet-architecture-2026-05-25.md)** (~894 lines) | Per-product workspace holding platform-generated + operator-input artifacts; OperatorProfile + Packet two-tier schema with inheritance | **Q1–Q9** |
| **[Catalog architecture investigation](catalog-architecture-investigation-2026-05-25.md)** (~826 lines) | 10-layer (+candidate Layer 11) catalog inventory; implementation state + redundancy + gap classification; load-bearing finding is Layer 9 (search/discovery) as the absent surface | **11 routing questions** (7 Opus + 4 CC) |
| **[Design system memo](design-system-2026-05-25.md)** (~296 lines) | 5-category content encoding (INPUTS/DERIVED VALUES/DERIVED RENDERS/DETERMINATIONS/DIAGNOSTICS) + 7-commit refactor sequence | **Q-DS-1 + Q-DS-2** |
| **[Joy-of-mastery brand philosophy](../../C:/Users/chefc/.claude/projects/c--Users-chefc-formulation-wizard-live/memory/feedback_joy_of_mastery_brand_philosophy.md)** (CC memory) | 8 principles + concrete moves + avoid list; voice for every UI/UX/copy/export decision; pinned elevations on beautiful outputs (brand surface) + dignity moat | Voice/aesthetic anchor — not a routing question itself |
| **[External developer trial findings](../../C:/Users/chefc/.claude/projects/c--Users-chefc-formulation-wizard-live/memory/project_external_developer_trial_2026_05_25.md)** (CC memory) | First non-operator user feedback; 5 signals (overload + wizard pattern + bottom-line value gap + UX standards + Caesar/anchovy catalog gap); validated launch-blocker #4 by lost-saves experience | Motivating evidence behind several questions |
| **[Scope of work memo](../../C:/Users/chefc/.claude/projects/c--Users-chefc-formulation-wizard-live/memory/project_scope_of_work_2026_05_25.md)** (CC memory) | Phased 6–8 week timeline + two peer tracks + sequencing dependencies; refresh post-session | Timeline context |

---

## Consolidated routing decisions (prioritized)

**Highest leverage — unblocks the most downstream work.** Decisions here cascade into 4-6 weeks of implementation sequencing.

### Tier 1 — Foundational (must lock before any implementation starts)

1. **Schema topology (Packet Q1)** — Extend `SavedFormulation` further OR introduce top-level `Packet` with `OperatorProfile` parent? Locks save backend implementation shape.
2. **Save backend implementation timing (Packet Q5 + Catalog Q1)** — Launch-blocker #4; everything downstream depends. Inferred from external trial lost-saves experience to be confirmed pre-launch-critical.
3. **Catalog ↔ Packet integration seam (Catalog Q4 + Q6 + Q10)** — How does catalog Layer 4 (platform-side suppliers) connect to Packet Layer 4 (operator-side vendor relationships)? What are operator-override semantics? Who owns catalog entry edits — operator vs platform change request?
4. **What does "August MVP" specifically mean + how do we verify it?** — Per new memory #24 (capability description + test plan artifact pair). Two artifacts feed this. Either drafted as session input (CC can spawn an agent for the capability description, similar to today's catalog investigation) OR drafted as session output once routing clears.

### Tier 2 — Sequencing + scope (locks implementation order)

5. **F3 Tier 1 spec-sheet ingestion sequencing (Catalog Q1)** — When does it land relative to save backend? Catalog enrichment + provenance UX both depend.
6. **Mode toggle / Novice tier work + IA pattern (Packet Q9 + Design system Q-DS-2)** — Reshaped from "wizard/tabbed/hybrid" to broader "how does workspace progressively reveal complexity?" Picks up existing Pro/Novice tier infrastructure (`lib/copy/` + `lib/hooks/useTier.ts`). Needs Nate persona-validation gating.
7. **Synonym strategy (Catalog Q2)** — Source: co-founder domain knowledge + operator paste-pattern data, NOT LLM defaults per memory #21. What's the discipline for adding/reviewing?
8. **Browse/search/filter surface (Catalog Q5 + Q8)** — Does Layer 9 (search & discovery — currently absent) ship with August Nutraceuticals or Q4? Every required field already exists on `IndustrialIngredient`; what's missing is the UI surface.

### Tier 3 — Brand voice + visual hierarchy (gates polish quality of everything else)

9. **Design system 5-category encoding (Design system Q-DS-1)** — Confirm INPUTS/DERIVED VALUES/DERIVED RENDERS/DETERMINATIONS/DIAGNOSTICS as canonical. Component-primitive aesthetic stances per joy-of-mastery doctrine.
10. **Hierarchy + naming for Packet (Packet Q2 + Q3)** — Flat/branded/tag-based at MVP? "Packet" vs "Dossier" vs "Product Folder"? Brand voice consideration.

### Tier 4 — Permissions + lifecycle (post-MVP-foundation routing)

11. **Permission model scope at MVP (Packet Q7)** — Operator role only at MVP, PA role V1.1, retailer post-launch?
12. **Expiration / renewal handling depth (Packet Q8)** — Which expiration types must-warn at MVP? Insurance, GMP cert, organic cert are obvious; lab results + PA letters are weighty but lower-frequency.
13. **Per-operator vs per-product placement (Packet Q6)** — Does the operator-level/product-level split land at MVP or post-launch? Adds schema complexity early adopters may not benefit from.

### Tier 5 — Export + curation (post-routing implementation work)

14. **Export bundle definitions (Packet Q4)** — Single audit PDF + zip-of-separates at MVP. Which curated bundles (PA Packet / Retailer Packet / Co-Packer Brief) ship?
15. **Catalog versioning UX (Catalog Q3)** — When catalog v3 becomes v4, does operator's pinned Base Sheet get a "v4 available, here's the diff" upgrade surface?

---

## What gets unblocked by each tier

- **Tier 1 unblocked → save backend implementation can start.** ~1 week CC work. Without Tier 1, everything downstream waits.
- **Tier 2 unblocked → implementation sequencing locks.** F3 Tier 1 + design system + Packet UI + Base/Batch + mode toggle ordering all become deterministic.
- **Tier 3 unblocked → polish quality locks.** Without it, future UI commits ship with mismatched aesthetic stance (the morning's design-system commit #1 risk we discussed).
- **Tier 4 unblocked → permission + lifecycle scope clarifies.** Operator role MVP shape clarifies; PA + retailer roles defer cleanly.
- **Tier 5 unblocked → export + versioning ship at MVP or defer.**

---

## Founder-side parallel track (not session output — surface for awareness)

These run concurrently with implementation. Cannot dormant for 6 weeks.

| Track | Status | Owner | Cycle |
|---|---|---|---|
| PA pilot operator recruitment (2–4 domain experts: outreach → qualification → NDA → onboarding) | NOT STARTED | Operator + co-founder network | 4–6 weeks |
| Pricing decision (gates pilot NDA signing) | NOT STARTED | Operator + co-founder | Strategic-session candidate |
| Marketing site narrative ("why this is different from a spreadsheet") | NOT STARTED | Operator + co-founder + brand workstream | Multi-week design + copy |
| Operator-recruitment outreach beyond pilot (early-adopter cohort) | NOT STARTED | Operator network | Post-pilot soft launch |
| Commercial / legal artifacts (co-mfg agreements, quality agreements, continuing guaranties, trademark) | NOT STARTED | Operator-supplied | Ongoing |

---

## Session output expectations

After 90–120 min with co-founder, the session should produce:
- **Tier 1 routing decisions locked** (4 decisions; gates save backend start)
- **Tier 2 sequencing locked** (4 decisions; gates implementation order)
- **Tier 3 design system encoding confirmed** (2 decisions; gates polish quality)
- **Founder-side track started** — pricing decision + PA pilot operator outreach kickoff dates committed
- **Either an MVP capability description draft commitment** (CC spawns the agent post-session) **OR a working draft completed during session**

Decisions NOT made at this session (Tiers 4 + 5 + remainder) defer cleanly to V1.x.

---

## What to avoid in this session

Per joy-of-mastery doctrine + razor-sharp building doctrine + today's learnings:

- **Avoid** scope-expanding into per-feature implementation discussion. The session is for routing — implementation flows from routing.
- **Avoid** trying to lock the capability description + test plan content in-session. Those are downstream artifacts. The session locks the QUESTION (item 5 in agenda).
- **Avoid** confusing brand voice routing (Tier 3) with implementation decisions — brand voice is INPUT to implementation, not OUTPUT.
- **Avoid** re-litigating the Caesar/anchovy fix (resolved this morning; surgical commits shipped). The structural lessons (synonym source-of-truth) are in Tier 2.
- **Avoid** over-tier-ing. If session runs short, lock Tier 1 + 2 only; Tier 3 + 4 + 5 can be a follow-up routing call.

---

## After the session — first 24 hours

- CC updates [scope-of-work memo](../../C:/Users/chefc/.claude/projects/c--Users-chefc-formulation-wizard-live/memory/project_scope_of_work_2026_05_25.md) with routing decisions + revised timeline
- CC spawns agent for capability description draft (if not produced in session) — similar shape to today's catalog architecture investigation; ~2-3 hr autonomous
- Operator schedules first founder-side track action (pricing call OR pilot outreach kickoff)
- CC starts save backend implementation (Tier 1 unblocks this)
