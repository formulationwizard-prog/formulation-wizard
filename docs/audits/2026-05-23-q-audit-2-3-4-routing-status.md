# Q-Audit-2 / Q-Audit-3 / Q-Audit-4 — Routing Status Snapshot (2026-05-23)

**Surfaced:** 2026-05-23 (CC pre-flight grep during Step 0.5c.i session)
**Source:** [`docs/audits/duplicate-sku-sweep.md`](duplicate-sku-sweep.md) §5 (Open routing questions for operator + Opus)
**Trigger:** 0.5c.v Mushroom triple-entry consolidation directive referenced "Q-Audit-2 routing"; CC memory only indexed Q-Audit-1 artifacts. Grep surfaced Q-Audit-2/3/4 as routing questions, not standalone files.

---

## Discovery

Q-Audit-2, Q-Audit-3, and Q-Audit-4 are **logical routing questions defined within `duplicate-sku-sweep.md` §5**, not standalone audit documents. Each carries unresolved (a)/(b)/(c) treatment options. They gate specific Step 0.5c sub-tasks per Q-Audit-1 §13 routing.

---

## Q-Audit-2 — Wave 3 Phase 3a shape-current replacements — UNRESOLVED

**Scope:** Mushroom family + Curcumin family + Saw Palmetto. Wave 3 Phase 3a authored shape-current entries with full Wave 1.5+ field shape (regulatoryStatus + functionalRole + bioactives). Older Wave 1 + Wave 2 entries appear obsolete.

**Treatment options (from [`duplicate-sku-sweep.md:422`](duplicate-sku-sweep.md#L422)):**
- (a) deprecate older entries immediately as part of consolidation step
- (b) keep older entries pending Round 12 Step 1 migration completion (so cross-section can be verified)
- (c) other

**Gates:** Step 0.5c.v (Mushroom triple-entry consolidation, 6 deprecations + 3 survivor supplier-set unions per Q-Audit-1 §13).

**Status:** UNRESOLVED. Opus/operator routing required before 0.5c.v can execute unattended.

---

## Q-Audit-3 — Specialty Compounds vs Specialty category synonyms — IMPLICITLY RESOLVED (Option a)

**Scope:** Per rulebook §III.15, both `Specialty Compounds` and `Specialty` are "currently both present (legacy)." Cross-category duplicates (Glucosamine Sulfate Potassium, Chondroitin, MSM) span this seam.

**Treatment options (from [`duplicate-sku-sweep.md:424`](duplicate-sku-sweep.md#L424)):**
- (a) collapse `Specialty` into `Specialty Compounds` as part of Round 12 Step 0 work
- (b) keep both names but consolidate the cross-category duplicates per primary entry
- (c) other

**Resolution status:** **IMPLICITLY RESOLVED — Option (a)** per evidence on the ground:
- Value-tier section at [`lib/data/supplements.ts`](../../lib/data/supplements.ts) lines 87-96 already uses `Specialty Compounds` as the joint-family category (Glucosamine Sulfate 2KCl line 89, Chondroitin line 90, MSM OptiMSM line 91, HA Sodium line 96)
- Step 0.5c.i Cluster (commit `fcde45e`, 2026-05-23) migrated 6 premium-tier entries from `Specialty` → `Specialty Compounds` per the same Option (a) pattern
- Step 0.5c.ii (Digestive enzymes Specialty → Enzymes) follows the same shape — drains remaining `Specialty` category toward empty
- Step 0.5c.vi will drop the `Specialty` enum value once category is empty

**Recommended action:** No new routing decision needed; ratify Option (a) as the locked resolution in a future Q-Audit-1 / duplicate-sku-sweep follow-up commit so the audit doc reflects the actual catalog state.

---

## Q-Audit-4 — Omega-3s vs Fatty Acids category boundary — UNRESOLVED

**Scope:** Per rulebook §III.15, both `Omega-3s` and `Fatty Acids` are in the taxonomy. The Wave 1 + Wave 2 split positions Omega-3 EPA/DHA in both.

**Treatment options (from [`duplicate-sku-sweep.md:426`](duplicate-sku-sweep.md#L426)):**
- (a) consolidate to Omega-3s (per consumer-facing primary-mechanism framing)
- (b) consolidate to Fatty Acids (per chemistry-honest framing)
- (c) keep both with explicit role differentiation
- (d) defer until Round 12 §III.17 split-review

**Gates:** Step 0.5c.vii (Omega-3 category enforcement, 6 mis-categorized Fatty Acids → Omega-3s entries per Q-Audit-1 §13).

**Status:** UNRESOLVED. Opus/operator routing required before 0.5c.vii can execute unattended. (The Q-Audit-1 routing assumption is that Option (a) wins, but it isn't durable-locked.)

---

## Cross-cutting implications

**For the remaining Step 0.5c sub-tasks:**

| Sub-task | Gating Q-Audit | Unattended-ready? |
|----------|----------------|--------------------|
| 0.5c.i Specialty Compounds (joint family) | Q-Audit-3 (implicit Option a) | DONE — commit `fcde45e` |
| 0.5c.ii Digestive enzymes → Enzymes | Q-Audit-3 (same Option a logic applies — Enzymes category is on-enum) | Likely ready; needs Opus verification pass |
| 0.5c.iii Bromelain | per `q-audit-1-final-routing.md:366` "folded into B2.4 in 0.5a" | Provisional finding strong; directive queued |
| 0.5c.iv Choline family + PS | Q-Audit-3 + PS routing artifact | UNRESOLVED — needs durable PS routing artifact |
| 0.5c.v Mushroom triple-entry | **Q-Audit-2** | UNRESOLVED — gates this sub-task |
| 0.5c.vi §III.15 enum drop + validator M15 | Specialty must be empty | GATED on 0.5c.i (DONE) + 0.5c.ii + 0.5c.v + MSM Phase 2 |
| 0.5c.vii Omega-3 enforcement | **Q-Audit-4** | UNRESOLVED — gates this sub-task |

**Next-session priorities:**
1. Opus authors Q-Audit-2 routing decision (Option a/b/c) → unblocks 0.5c.v
2. Opus authors Q-Audit-4 routing decision (Option a/b/c/d) → unblocks 0.5c.vii
3. Opus authors 0.5c.iv Phosphatidylserine routing artifact → unblocks 0.5c.iv
4. CC runs queued Bromelain directive → closes 0.5c.iii
5. Opus authors 0.5c.ii verification pass → unblocks 0.5c.ii unattended execution

---

## Cross-references

- [`docs/audits/duplicate-sku-sweep.md`](duplicate-sku-sweep.md) §5 — Q-Audit-N source definitions
- [`docs/audits/q-audit-1-final-routing.md`](q-audit-1-final-routing.md) §12 — Step 0.5 sub-task breakdown referencing Q-Audit-2/3/4
- [`docs/audits/0-5c-iii-bromelain-grep-verification-directive-2026-05-23.md`](0-5c-iii-bromelain-grep-verification-directive-2026-05-23.md) — companion queued directive
- CC memory `feedback_session_boundary_context_handoff.md` — session-boundary discipline (relayed during pre-flight)
