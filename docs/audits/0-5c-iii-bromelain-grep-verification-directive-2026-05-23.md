# 0.5c.iii Bromelain — Grep-verification Directive

**Author:** Opus track, 2026-05-23
**Status:** Queued for CC execution (next session or end of current session if 0.5c.i closes with capacity)
**Type:** Read-only verification; no catalog edits, no commits

**Provisional finding (pre-flight 2026-05-23, before directive executed):** [`docs/audits/q-audit-1-final-routing.md`](q-audit-1-final-routing.md) line 366 explicitly records "Bromelain consolidation (Enzymes survivor) | folded into B2.4 in 0.5a" + line 376 "0.5a + 0.5c.iii (Bromelain) ship together — consolidation work". Strong prior that Finding A (fully restructured in B2.4) is the expected outcome when this directive runs. Execution still useful for ground-truth verification (intent ≠ execution outcome).

---

## Question

Was Bromelain restructured to current convention (form-first canonical name, Enzymes category, tier attribution if applicable) during Step 0.5a Bucket 2 B2.4 work?

---

## Procedure

1. **Identify B2.4 commit(s).** Source: 0.5a closure artifact in `docs/audits/` if one exists, or `git log --all --grep="B2.4"`. If B2.4 doesn't map to a specific commit, fall back to scanning all 0.5a commits.
2. **Grep B2.4 commit diff(s)** for `[Bb]romelain`. Note what changed (name / category / fields) and what didn't.
3. **Read current Bromelain entry/entries** in `lib/data/supplements.ts`. Capture: display name structure (form-first canonical?), category (Enzymes vs. Antioxidants vs. Specialty), tier attribution if applicable, supplier reference.
4. **Reconcile.**

---

## Decision tree (surface findings; do not act on them)

| Finding | Surface as | Routing |
|---------|------------|---------|
| **A — fully restructured in B2.4** | "Bromelain verified restructured in B2.4 [commit SHA]. 0.5c.iii closes with no action." | Operator decides closure marking. |
| **B — not restructured, still pre-canonical** | "Bromelain not restructured. Current state: [name / category / fields]. Restructure scope needed." | Route to Opus for scope authorship. |
| **C — partial / ambiguous** | Surface specifics. | Route to Opus for routing decision. |

---

## Hard scope guardrails

- No edits to `lib/data/supplements.ts` regardless of finding
- No category changes
- No commits
- Surface findings only

---

## §IV.22 wave-sizing note

If Finding B surfaces and restructure becomes a real execution task, §IV.22 applies — top-3 predictability companions in `stacks.ts` get evaluated and any missing added in the same commit. Flagging now so a later-session CC doesn't scope Bromelain in isolation. Opus will author full restructure scope if/when needed.

---

## Findings (append when executed)

_(empty — directive not yet run)_
