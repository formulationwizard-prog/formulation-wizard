# Master Specs — Data Model & Architecture

**Date:** 2026-05-27 · revised post-red-line review pass
**Status:** Model refined per reviewer red-lines #1-#5 (distribution/bound · Packet Q1 dep · discriminated ComputedStats · overage interface · Phase 1 scope gating) · 4 of 8 open questions locked · 2 unresolved architectural deps surfaced
**Companion doctrine:** [[living-spec-learning-doctrine]] · [[controlled-document-doctrine]] · [[upstream-from-pds-doctrine]]
**Companion architecture:** [packaging-data-sheet-architecture-2026-05-27.md](packaging-data-sheet-architecture-2026-05-27.md)

---

> ## ⚠️ 2026-06-16 reconciliation (#17 spine lock) — read first
> This doc's original `MasterSpecEntry` **conflated two entities.** Per the locked 13-entity spine, they are split:
> - **TargetSpec** = the **design/regulatory contract** — per Formulation Version, frozen on status-advance, signed by brand owner + RA; anchors CM agreements, label-claim defenses, retailer contracts. Modeled below as the new **`TargetSpecEntry`**.
> - **MasterSpec** = **verified-from-production evidence** — the observation-log + tier engine. **Not a contract.**
> - The design-seed fields (`validated_value` / `validated_tolerance` / `target_at_label_claim_pct` / `authorized_*`) **move to `TargetSpecEntry`**; `MasterSpecEntry` keeps only the production-verified role, anchored at **Formulation level** (not product/version).
> - They **converge** at tier promotion (see the new convergence section).
>
> The **Entity model** (TargetSpecEntry, MasterSpecEntry, ObservationLogEntry) below is reconciled to the split. **Deeper sections (statistical math examples, phases, storage keys) still reference the pre-split field locations** — where `recomputeStats` reads `validated_value`/`validated_tolerance`, those now come from the **linked `TargetSpecEntry`**, not from `MasterSpecEntry`. Those sections are flagged but not exhaustively re-swept here (a follow pass at schema-laying time). Companions: [wave-17 packet](wave-17-session-inputs-packet-2026-06-13.md), [inventory-event-model-2026-06-16.md](inventory-event-model-2026-06-16.md).

## Purpose

This document locks the data model for the **MasterSpec** + **TargetSpec** pair (the "Master Specs" tab is the UI surface). Together they:

1. **TargetSpec** holds the **signed design/regulatory contract** per Formulation Version (the spec the formula is *designed and authorized* to hit)
2. **MasterSpec** logs actual lab measurements per batch (observation log) and computes **living statistics** (mean, σ, confidence tier — promotes as n accumulates) — the *verified-from-production* evidence
3. Span multiple brands + products in one operator's portfolio
4. Generate shareable quality-history packages for co-packer customers
5. Serve as the QA Manager's **single source of truth** — TargetSpec for "what we committed to," MasterSpec for "what production proves"

Master Specs is connected to nearly every other tab — wrong data model has expensive ripples. This doc locks the model before any UI code.

---

## Core principles (world-class baseline)

1. **Metrics are first-class entities** — operator-defined custom metrics share the same model as predefined library entries
2. **Observation log is the source of truth** — every spec value derives from time-series observations; nothing is silently mutated
3. **Audit immutability** — every state change creates an append-only audit log entry; deletes are logged, not destructive
4. **Statistical rigor with safe defaults** — conventional 2σ ± range for ~95% coverage, n≥5 → VERIFIED, n≥30 → WELL-CHARACTERIZED, configurable in Phase 2+
5. **Permission-first naming** — "Authorized: QA Manager" labels everywhere, even without RBAC enforcement; when auth lands, no UX migration
6. **Single source of truth, multiple views** — controlled-doc doctrine; PDS / Batch / Filing / Spec Analysis all READ from Master Specs, never duplicate

---

## Entity model

### 1. `SpecMetric` — the metric catalog (what CAN be tracked)

```typescript
interface SpecMetric {
  id: string;                            // UUID
  name: string;                          // "pH" · "L* (CIELAB)" · "Vanilla aroma intensity"
  unit: string;                          // "pH" · "L*" · "VRI" · "%" · "CFU/g" · "ppm"
  data_type: 'numeric' | 'categorical' | 'boolean';
  range_min?: number;                    // Sanity-check bounds — e.g., pH 0-14, L* 0-100
  range_max?: number;
  method_default?: string;               // "AOAC 981.12" · "Hunter L*a*b* via spectrometer"
  regulatory_relevance?: RegulatoryRelevance[];   // What regulatory contexts care
  applicable_product_classes?: ProductClass[];    // ['beverage', 'sauce', 'capsule', 'all']
  source: 'predefined' | 'custom';
  created_by?: string;                   // user_id for custom metrics
  created_at?: string;                   // ISO timestamp for custom
  icon?: string;                         // Optional emoji or icon hint
  description?: string;                  // Help text shown in wizard
  promotion_thresholds?: {               // Per-metric n thresholds (optional override)
    verified_at: number;                 // Default: 5; heavy metals + microbial use 10
    well_characterized_at: number;       // Default: 30
  };

  // Statistical model parameters (red-line #1 — distribution + bound direction)
  // Per-metric defaults locked in seed library; defines correct range
  // computation for the metric type.
  distribution_type: 'normal' | 'log-normal' | 'poisson' | 'binomial';
  bound_direction: 'two-sided' | 'upper-only' | 'lower-only';
  // Optional per-metric safety factor override (default 2.0 → ~95% coverage;
  // heavy metals + microbial typically use 3.0+ given asymmetric consequences)
  safety_factor_default?: number;
}

type RegulatoryRelevance =
  | 'prop-65'
  | 'falcpa-allergen'
  | 'usp-232'                            // Heavy metals
  | 'usp-233'                            // Heavy metals method
  | 'usp-905'                            // Uniformity of dosage units
  | 'aoac-microbial'
  | 'fda-handbook-133'                   // Net contents verification
  | 'cfr-114-acidified'                  // Acidified foods pH
  | 'cfr-113-lacf'                       // LACF aw
  | 'dshea-supplement'
  | 'customer-requirement'               // Co-pack customer spec
  | 'custom';
```

**Catalog tiers (three layers stored in same SpecMetric table):**

| Tier | Source | Examples | Count target |
|---|---|---|---|
| Regulatory-prescribed (built-in) | Platform-curated | Heavy metals, FALCPA allergens, USP <905> | ~15 |
| Industry-common (built-in) | Platform-curated | pH, aw, moisture, Brix, viscosity, color L*a*b*, microbial counts | ~15 |
| Operator-custom | QA Manager defines | Anything unique to operator's portfolio | Unbounded |

**Phase 1 seed library: 30 predefined metrics** — *composition locked by co-founder's 20-year formulation expertise (see open question #4).*

**Per-metric distribution defaults (locked):**

| Metric category | distribution_type | bound_direction | safety_factor |
|---|---|---|---|
| Heavy metals (Pb · As · Cd · Hg) | log-normal | upper-only | 3.0 |
| Microbial (TPC · Y&M · coliforms · pathogens) | poisson | upper-only | 3.0 |
| pH (acidified foods · CFR 114.80) | normal | lower-only (≤4.6) | 2.0 |
| aw (LACF · CFR 113) | normal | upper-only (≤0.85) | 2.0 |
| pH (general products) | normal | two-sided | 2.0 |
| Physical specs (Brix · moisture · density · viscosity · color L*a*b*) | normal | two-sided | 2.0 |
| Potency (HPLC actives) | normal | lower-only (≥ label claim × overage) | 2.0 |

Phase 1 ComputedStats implements `normal + two-sided / upper-only / lower-only` (covers ~25 of 30 seed metrics). `log-normal` and `poisson` exact distributions deferred to Phase 2 — Phase 1 uses normal approximation with a per-metric caveat note ("Confidence interval uses normal approximation; exact distribution Phase 2").

---

### `TargetSpecEntry` — the design/regulatory contract *(NEW — split 2026-06-16)*

The signed contract a Formulation Version is *designed and authorized* to hit. **Version-level.** Frozen on status-advance; authored by brand owner + RA; the anchor for CM agreements, label-claim defenses, and retailer contracts. These fields **moved here out of the old `MasterSpecEntry`.**

```typescript
interface TargetSpecEntry {
  id: string;                            // UUID
  formulation_id: string;                // FK → Formulation
  formulation_version_id: string;        // FK → FormulationVersion — Version-level (frozen per version)
  metric_id: string;                     // FK → SpecMetric.id

  // The design target (operator/RA-set — the contract)
  target_value: number | string | boolean;        // Matches metric.data_type  (was validated_value)
  tolerance: number | null;                        // ± tolerance; null for categorical/boolean  (was validated_tolerance)
  method: string;                                  // Test method the target is defined against

  // Overage / label-claim interface (was red-line #4 — belongs to the contract, not the evidence):
  // target_value is the actual concentration at time-zero (e.g., Vit C at 110% of label claim);
  // label_value = target_value / (target_at_label_claim_pct / 100). Default 100 = no overage.
  target_at_label_claim_pct: number;

  // Authorization — the signature on the contract
  authorized_signer: string;             // user_id or free-text name (pre-RBAC)
  authorized_role: 'qa-manager' | 'lab-manager' | 'rd-manager' | 'operator';
  authorized_at: string;                 // ISO date  (was authorized_date)
  effective_date: string;                // when this target takes effect
  status: 'draft' | 'authorized' | 'superseded';

  // Lifecycle
  created_at: string;
  created_by: string;
  updated_at: string;
}
```

**Cadence:** per-version revision — a new Formulation Version gets a new TargetSpecEntry per metric, frozen on status-advance. A TargetSpec can be **promoted from** a MasterSpec's verified range (see *Tier-promotion convergence* below).

---

### 2. `MasterSpecEntry` — the verified-from-production record *(reconciled 2026-06-16)*

The production **evidence** for one metric on one formulation. **Formulation-level** — one continuous history; observations version-tagged; per-metric carry-forward at the revision boundary. **Not a contract** (the design target lives on `TargetSpecEntry`).

```typescript
interface MasterSpecEntry {
  id: string;                            // UUID
  formulation_id: string;                // FK → Formulation — Formulation-level (NOT version-level)
  metric_id: string;                     // FK → SpecMetric.id

  // Cross-revision carry-forward (the locked coupling, 2026-06-16).
  // Decision lives at the REVISION BOUNDARY, per metric — NOT on individual
  // (immutable) observations. Stats for (formulation, Rev_N, metric):
  //   true  → include only observations where revision_id = Rev_N
  //   false → include Rev_N + all prior back to the most recent invalidation point
  metric_invalidated_by_revision: boolean;

  // Observation log — append-only, the source of truth. Each observation carries
  // `scale` ('bench'|'pilot'|'production'|'coa') + `revision_id`.
  observation_log: ObservationLogEntry[];

  // Computed statistics (derived from observation_log; recomputed on insert).
  // Where stats need a design baseline (n < verified threshold), they read
  // target_value / tolerance from the LINKED TargetSpecEntry (same
  // formulation_version + metric) — NOT from this entry.
  computed: ComputedStats;

  // Override history (manual range overrides with audit trail)
  override_history: OverrideEntry[];

  // Lifecycle
  created_at: string;
  created_by: string;
  updated_at: string;
  archived: boolean;                     // Soft-delete; preserves audit trail
  archived_at?: string;
  archived_by?: string;
  archived_reason?: string;
}
```

**Why Formulation-level (not product × revision):** production-learning compounds across minor revisions (don't reset a verified range on a non-affecting tweak); a material reformulation severs the history per-metric via `metric_invalidated_by_revision`. Observations stay immutable; the carry decision is owned by the revision boundary.

**⚠️ Anchoring shift (surface for the schema session):** this supersedes the original `product_id × revision × metric_id` keying. Both TargetSpec (formulation_version) and MasterSpec (formulation) now anchor on **Formulation**, not a standalone `product_id`. This **subordinates the Packet-Q1 Product-entity question** (Brand → Product Line → Product → Version) to Formulation anchoring — confirm at schema-laying whether Product remains a hierarchy *above* Formulation or collapses into it.

---

### 3. `ObservationLogEntry` — per-batch lab measurement

```typescript
interface ObservationLogEntry {
  id: string;                            // UUID — for drill-through linking
  batch_id: string;                      // Lot code (e.g., "20260427-NJ-L01-S1") — links to Batch Sheet
  observation_date: string;              // ISO date of test
  value: number | string | boolean;      // Matches metric.data_type
  scale: 'bench' | 'pilot' | 'production' | 'coa';  // NEW (2026-06-16) — source/scale of this reading,
                                         //   tagged at ingest (BenchTopRun / Batch / COA). Predicted-vs-
                                         //   measured = filter by scale; ONE tier engine serves all scales.
  revision_id: string;                   // NEW — Formulation Version this reading belongs to (carry-forward keying)
  lab_name?: string;                     // Where tested ("In-house QC lab" · "Eurofins" · "...")
  method_used: string;                   // Method actually applied (may differ from spec.method)
  signer: string;                        // Lab tech who ran the test
  signer_role: 'lab-tech' | 'qa-tech' | 'qa-manager' | 'external-lab';
  notes?: string;                        // Optional context
  reference?: string;                    // External report ID / COA reference

  // Lifecycle
  created_at: string;
  created_by: string;                    // user_id (lab tech logging)
  superseded_by?: string;                // If retest invalidates this; preserve original
  superseded_reason?: string;
}
```

**Key constraint:** observation entries are append-only. Retests don't delete original; they reference it via `superseded_by` for audit clarity.

---

## Tier-promotion convergence — TargetSpec ⇄ MasterSpec *(NEW — 2026-06-16)*

The two entities are **not redundant.** TargetSpec is the **signed contract**; MasterSpec is the **evidence basis** that informs it. They meet at tier promotion:

- A formula ships with a **TargetSpec** (the authorized design target per Version) and a low-n **MasterSpec** (`estimated` / `validated`).
- Production accumulates observations → MasterSpec promotes (`verified` → `well-characterized`).
- When MasterSpec's computed verified range earns **formal sign-off**, the operator can **promote it into the next-version TargetSpec** — an explicit, authorized action, **never silent**. The new Version's TargetSpec is now grounded in production reality.

This is the data-moat loop: **design target → production evidence → re-authorized target.** The critical property: the TargetSpec a CM agreement references **never moves on its own** — it changes only by a signed revision; MasterSpec moves continuously, TargetSpec moves only on authorization. (This is precisely *why* they're separate entities, not a column-set on one.)

---

### 4. `ComputedStats` — derived block (recomputed on observation insert)

```typescript
// Discriminated union by metric.data_type (red-line #3).
// Numeric metrics get mean / std_dev / current_range; categorical metrics
// get counts per category + dominant category; boolean metrics get pass_pct.
// Tier promotion logic is shared (n-based) across all variants.
type ComputedStats = ComputedStatsNumeric | ComputedStatsCategorical | ComputedStatsBoolean;

interface ComputedStatsBase {
  n: number;                             // Count of non-superseded observations
  tier: ConfidenceTier;
  last_observation_at: string | null;    // Most recent observation date
  computed_at: string;                   // When stats were last recomputed
}

interface ComputedStatsNumeric extends ComputedStatsBase {
  data_type: 'numeric';
  mean: number | null;                   // Arithmetic mean of valid observations
  std_dev: number | null;                // Sample standard deviation (n-1 denominator)
  min: number | null;
  max: number | null;
  current_best: number | null;           // Best estimate displayed (= mean if n≥1, else validated_value)
  current_range_low: number | null;      // Lower bound of displayed range (null if bound_direction='upper-only')
  current_range_high: number | null;     // Upper bound of displayed range (null if bound_direction='lower-only')
  safety_factor: number;                 // Default 2.0; per-metric override possible
}

interface ComputedStatsCategorical extends ComputedStatsBase {
  data_type: 'categorical';
  counts: Record<string, number>;        // Per-category observation counts
  dominant: string | null;               // Most-observed category
  dominant_pct: number | null;           // % of observations matching dominant
}

interface ComputedStatsBoolean extends ComputedStatsBase {
  data_type: 'boolean';
  true_count: number;                    // Pass count
  false_count: number;                   // Fail count
  pass_pct: number | null;               // true_count / n
}

type ConfidenceTier =
  | 'estimated'                          // n=0 — platform calculation only
  | 'validated'                          // n=1-4 — initial lab-set, small sample (or n<verified_at threshold)
  | 'verified'                           // n=5-29 — statistically meaningful (or n<well_characterized_at)
  | 'well-characterized';                // n=30+ — statistically robust
```

**Phase 1 scope on ComputedStats variants:**
- **Numeric** — implemented in full (covers ~28 of 30 seed metrics)
- **Categorical** — scaffolded (counts + dominant + tier) with tier promotion logic; UI integration Phase 2
- **Boolean** — scaffolded (true/false count + pass_pct + tier); UI integration Phase 2

**Range computation now branches on bound_direction + distribution_type:**

```typescript
function computeRange(
  stats: ComputedStatsNumeric,
  metric: SpecMetric,
  validated_value: number,
  validated_tolerance: number,
): { low: number | null; high: number | null } {
  // When n < verified threshold, use operator-set validated_tolerance
  if (stats.n < metric.promotion_thresholds!.verified_at) {
    if (metric.bound_direction === 'upper-only') return { low: null, high: validated_value + validated_tolerance };
    if (metric.bound_direction === 'lower-only') return { low: validated_value - validated_tolerance, high: null };
    return { low: validated_value - validated_tolerance, high: validated_value + validated_tolerance };
  }
  // When n is meaningful, use statistical range (normal approx for Phase 1)
  const k = stats.safety_factor;
  const halfWidth = k * stats.std_dev!;
  if (metric.bound_direction === 'upper-only') return { low: null, high: stats.mean! + halfWidth };
  if (metric.bound_direction === 'lower-only') return { low: stats.mean! - halfWidth, high: null };
  return { low: stats.mean! - halfWidth, high: stats.mean! + halfWidth };
}
```

**Tier promotion logic (centralized in helper; shared across data_type variants):**

```typescript
function computeTier(n: number, metric: SpecMetric): ConfidenceTier {
  const thresholds = metric.promotion_thresholds ?? { verified_at: 5, well_characterized_at: 30 };
  if (n === 0) return 'estimated';
  if (n < thresholds.verified_at) return 'validated';
  if (n < thresholds.well_characterized_at) return 'verified';
  return 'well-characterized';
}
```

**Per-metric threshold locks (per reviewer pick #2):**
- Heavy metals (Pb, As, Cd, Hg): `verified_at: 10` (Poisson-like detection-limit behavior)
- Microbial counts (TPC, Y&M, coliforms, pathogens): `verified_at: 10` (Poisson distribution; small-n unstable)
- All other metrics: default `verified_at: 5`, `well_characterized_at: 30`

---

### 5. `OverrideEntry` — manual range override (audit trail)

```typescript
interface OverrideEntry {
  id: string;
  override_type: 'tolerance' | 'safety-factor' | 'method' | 'archive';
  applied_value: unknown;                // What it was overridden TO
  previous_value: unknown;               // What it was overridden FROM
  reason: string;                        // Required: why this override
  applied_by: string;                    // user_id
  applied_role: 'qa-manager' | 'lab-manager' | 'plant-manager';
  applied_at: string;
  effective_until?: string;              // Optional expiration date
}
```

Overrides supersede computed values for display until they expire or are reverted. Common scenarios:
- "Customer requires ±0.10 even though our σ-based range is ±0.04" → tolerance override
- "Method changed mid-revision from AOAC 981.12 to ISO 7888" → method override
- "Bad lab calibration period; archive observations 47-52" → archive override

---

### 6. `AuditLogEntry` — system-wide audit trail (append-only)

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: string;                     // ISO timestamp (server time when LB#4 ships)
  actor_id: string;                      // user_id
  actor_role: 'qa-manager' | 'lab-tech' | 'lab-manager' | 'plant-manager' | 'operator' | 'admin' | 'system' | 'unknown';
  action: AuditAction;
  target_type: 'master-spec' | 'observation' | 'metric-catalog' | 'override' | 'export' | 'share-link';
  target_id: string;
  changes?: { field: string; from: unknown; to: unknown }[];
  reason?: string;
  meta?: Record<string, unknown>;        // Action-specific context
}

type AuditAction =
  | 'spec.create'
  | 'spec.update'
  | 'spec.archive'
  | 'observation.add'
  | 'observation.supersede'
  | 'metric.create'
  | 'metric.update'
  | 'override.apply'
  | 'override.expire'
  | 'export.generate'
  | 'share-link.create'
  | 'share-link.access'                  // When customer opens shared link
  | 'share-link.expire';
```

**Append-only collection.** Even if operator "deletes" a spec, the audit log records `spec.archive` action with reason; no actual destruction.

---

### 7. `MetricSuggestion` — Phase 6 cross-product learning (data model placeholder)

```typescript
interface MetricSuggestion {
  source_product_id: string;             // Similar product the suggestion came from
  source_metric_id: string;
  suggested_value: number;
  suggested_tolerance: number;
  confidence_basis: 'cross-product-portfolio' | 'industry-library' | 'regulatory-prescribed';
  rationale: string;                     // Why this suggestion makes sense
}
```

Not built in Phase 1 — but the data model supports it via cross-product queries.

---

### 8. `ExportToken` — expiring share links for co-pack customers

```typescript
interface ExportToken {
  id: string;                            // UUID — used in share URL
  product_id: string;                    // What product's history is shared
  metric_ids: string[];                  // Which metrics included (or [] for all)
  date_range_from: string;
  date_range_to: string;
  generated_by: string;                  // user_id (operator)
  generated_at: string;
  expires_at: string;                    // Default: 30 days
  recipient_label?: string;              // "Acme Beverages — Q2 Quality Review"
  access_count: number;                  // How many times opened
  last_accessed_at?: string;
  revoked: boolean;
  revoked_at?: string;
}
```

Customer accesses via `/share/[token-id]` — read-only view, audit log records every access.

---

## Relationships diagram

```
SpecMetric (catalog) ←──fk── MasterSpecEntry
                                │
                                ├── ObservationLogEntry[] (append-only)
                                │       │
                                │       └── batch_id ──→ Batch Sheet
                                │
                                ├── ComputedStats (derived; recomputed on observation insert)
                                │
                                ├── OverrideEntry[] (audit trail for manual overrides)
                                │
                                └── product_id ──→ Build Base Sheet / PDS

MasterSpecEntry × N  ──read──→ PDS Validated Specs section (controlled-doc inherit)
                     ──read──→ Batch Sheet target spec table
                     ──read──→ Spec Analysis card (Build Base Sheet)
                     ──read──→ Filing Readiness widget
                     ──read──→ Determination Engine (regulatory data)

AuditLogEntry (system-wide, append-only) — every change to any entity above logs here

ExportToken — co-pack share links → generates PDF + CSV bundle from MasterSpecEntry data
```

---

## Statistical math (centralized helper module)

All statistical computation lives in one module (`lib/masterSpecsStats.ts`). Per red-line #3, branches on `metric.data_type`; per red-line #1, range computation branches on `metric.bound_direction` and `metric.distribution_type` (Phase 1 uses normal approximation for log-normal/poisson with caveat note).

```typescript
export function recomputeStats(
  observations: ObservationLogEntry[],
  entry: Pick<MasterSpecEntry, 'validated_value' | 'validated_tolerance' | 'target_at_label_claim_pct'>,
  metric: SpecMetric,
): ComputedStats {
  const valid = observations.filter(o => !o.superseded_by);
  const n = valid.length;
  const tier = computeTier(n, metric);
  const last_observation_at = n > 0 ? valid[n - 1].observation_date : null;
  const computed_at = new Date().toISOString();

  // Branch by data_type
  if (metric.data_type === 'numeric') {
    const values = valid.map(o => o.value as number);
    const safety_factor = metric.safety_factor_default ?? 2.0;
    if (n === 0) {
      const range = computeRangeFromTolerance(metric, entry.validated_value as number, entry.validated_tolerance ?? 0);
      return {
        data_type: 'numeric',
        n: 0, tier, mean: null, std_dev: null, min: null, max: null,
        current_best: entry.validated_value as number,
        current_range_low: range.low, current_range_high: range.high,
        safety_factor, last_observation_at, computed_at,
      };
    }
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const std_dev = n >= 2 ? Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1)) : null;
    const stats: ComputedStatsNumeric = {
      data_type: 'numeric',
      n, tier, mean, std_dev,
      min: Math.min(...values), max: Math.max(...values),
      current_best: mean,
      current_range_low: null, current_range_high: null,
      safety_factor, last_observation_at, computed_at,
    };
    const range = computeRange(stats, metric, entry.validated_value as number, entry.validated_tolerance ?? 0);
    return { ...stats, current_range_low: range.low, current_range_high: range.high };
  }

  if (metric.data_type === 'categorical') {
    const counts: Record<string, number> = {};
    for (const o of valid) counts[o.value as string] = (counts[o.value as string] ?? 0) + 1;
    let dominant: string | null = null;
    let dominantCount = 0;
    for (const [k, v] of Object.entries(counts)) if (v > dominantCount) { dominant = k; dominantCount = v; }
    return {
      data_type: 'categorical', n, tier, counts, dominant,
      dominant_pct: n > 0 ? dominantCount / n : null,
      last_observation_at, computed_at,
    };
  }

  // boolean
  const true_count = valid.filter(o => o.value === true).length;
  const false_count = n - true_count;
  return {
    data_type: 'boolean', n, tier, true_count, false_count,
    pass_pct: n > 0 ? true_count / n : null,
    last_observation_at, computed_at,
  };
}
```

**Unit-testable.** Phase 1 deliverable includes `__tests__/masterSpecsStats.test.ts` covering:
- Numeric edge cases (n=0, n=1, n=2, n=5, n=30, n=100; outliers; superseded observations)
- bound_direction variants (two-sided / upper-only / lower-only) → correct range
- Categorical metrics (counts, dominant, dominant_pct)
- Boolean metrics (pass_pct calculation)
- Tier promotion thresholds (default + heavy-metals/microbial overrides)
- Overage interpretation (target_at_label_claim_pct ≠ 100)

---

## Permissions model (forward-design; enforced when RBAC ships)

| Action | Role required |
|---|---|
| Create / update SpecMetric (custom) | qa-manager · lab-manager |
| Create / update MasterSpecEntry (validated value) | qa-manager · lab-manager |
| Add ObservationLogEntry | lab-tech · qa-tech · qa-manager |
| Apply OverrideEntry | qa-manager · plant-manager |
| Archive MasterSpecEntry | qa-manager (with reason) |
| View any MasterSpecEntry | any authenticated user in workspace |
| Generate ExportToken | qa-manager · plant-manager |
| Access shared link | anyone with token (logged) |

Phase 1: all actions assume operator has full access (no enforcement). Labels show "Authorized: QA Manager" so the UX prepares for future enforcement.

---

## Document architecture — Fortune 500 quality bar (red-line addendum 2026-05-27)

Reviewer recalibration: the Fortune 500 quality bar on the printed Master Spec Sheet is **architectural**, not design-domain. The architectural commitment is:

1. **Section ontology** — defined sections that scale from 1-page (small DTC) to 16-page (enterprise spec sheet). Sections are structured entities, not free-form prose.
2. **Template depth flex** — section visibility gated by `depth_tier: 'minimal' | 'standard' | 'comprehensive'`. Minimal = identity + key specs only; comprehensive = full audit ontology (validation history, method genealogy, statistical visualizations, customer ack signatures, etc.).
3. **Version control** — every section under explicit revision tracking (which Rev introduced/modified each section). Audit-resistant: never silently mutated.
4. **Audit linkage** — every section traceable back to AuditLogEntry entries (who authored what, when, with what authorization).

**Section ontology (Phase 1 scaffold; Phase 2-4 populate):**

```typescript
interface SpecSheetSection {
  id: string;                            // UUID
  ordinal: number;                       // Display order (1 = identity, 2 = validated specs, etc.)
  section_type: SpecSheetSectionType;
  title: string;                         // Operator-overridable
  depth_tier: 'minimal' | 'standard' | 'comprehensive';
  visibility: 'always' | 'when-data-present' | 'optional';
  audit_anchor_id?: string;              // Link to AuditLogEntry that authored this section
  revision_introduced: string;           // Which PDS Rev first included this section
  revision_last_modified: string;
  content_renderer: SpecSheetRenderer;   // Component reference for how to print this section
}

type SpecSheetSectionType =
  | 'identity'                           // Cover page — brand / product / FG # / Rev — minimal+
  | 'validated-specs'                    // Validated spec table — minimal+
  | 'observation-history'                // Per-metric observation log — standard+
  | 'statistical-summary'                // Mean / σ / tier / n per metric — standard+
  | 'method-genealogy'                   // Test methods + validation evidence — comprehensive
  | 'override-audit-trail'               // Override history table — standard+
  | 'production-statistics'              // Cross-batch trend tables — comprehensive
  | 'customer-acknowledgment'            // Customer sign-off block — comprehensive
  | 'approval-signatures'                // QA / Ops / Plant Mgr sign-offs — minimal+
  | 'revision-history'                   // Full revision log — comprehensive
  | 'regulatory-references'              // FDA / USP / AOAC method citations — standard+
  | 'cross-doc-references';              // Links to HACCP / SSOP / Allergen Control Plan — comprehensive
```

Phase 1 deliverable includes the SpecSheetSection scaffold + `depth_tier: 'standard'` PDF output for the 30 seed metrics. Comprehensive depth (method genealogy, customer acknowledgment, cross-doc references) builds out in Phase 2-4. **Critical:** the data model has the section ontology in Phase 1 so future depth flex doesn't require migration.

---

## Phase 1 vs Phase 2+ scope split (revised per red-line #5)

### Phase 1 — INTERNAL DEVELOPMENT SCAFFOLD (operator-facing launch gated on LB#4)

**Phase 1 ships internally only.** Per red-line #5: localStorage as "QA Manager's single validation source of truth" is a compliance non-starter (cleared on browser data clear, no portability, no audit resistance). PDS Validated Specs inheritance does NOT ship to operators until LB#4 lands.

Phase 1 internal scope:
- Data model implemented (all interfaces above, in `types/masterSpecs.ts`)
- 30-metric predefined seed library (`lib/data/masterSpecsLibrary.ts`) — composition pending co-founder review (open question #4)
- `lib/masterSpecsStats.ts` helper module with unit tests (≥12 cases covering numeric / categorical / boolean / bound_direction / overage / tier promotion)
- "Master Specs" tab added to workspace nav — hidden behind feature flag for operator-facing visibility
- Portfolio view (lists all products with summary)
- Per-product detail view (validated specs table + observation log)
- Master Spec Wizard (Quick add + Custom add flows)
- localStorage persistence (internal dev only — explicitly NOT shipped as compliance backbone)
- SpecSheetSection scaffold (section ontology + depth_tier + audit linkage placeholders)
- PDS Validated Specs section reads from Master Specs **but disabled behind same feature flag**
- "Print Master Spec Sheet" PDF export — `depth_tier: 'standard'` (designed-looking, customer-shareable)
- Audit log captured (display surface deferred)

### Phase 1.5 — OPERATOR-FACING LAUNCH (gated on LB#4 second-half landing)
- Postgres migration (localStorage → server via the LB#4 Supabase persistence layer)
- Feature flag flipped on; Master Specs tab visible to operators
- PDS Validated Specs inheritance live (controlled-doc inherit working end-to-end with durable persistence)
- Phase 1 ↔ Phase 1.5 cutover via JSON export/import (operators with localStorage Phase 1 internal data migrate cleanly)

### Phase 2 (after LB#4 save backend lands)
- Postgres migration (localStorage → server)
- Per-batch lab data entry surface on Batch Sheet (flows to observation_log)
- Audit log viewer UI
- Configurable safety_factor per metric

### Phase 3 (Filing tab integration)
- pH validated → Process Authority filing
- aw validated → LACF determination
- Heavy metals → DSHEA compliance

### Phase 4 (visualizations)
- Histograms per metric
- Control charts (SPC-style)
- Trend lines + drift detection

### Phase 5 (intelligence)
- SPC violation alerts ("L* drifted out of control at batch 89")
- Method validation tracking
- Auto-tightening tolerance proposals

### Phase 6 (network effect)
- Cross-product learning (suggest validated ranges from similar products)
- Industry-shared library (operator-defined popular metrics published to library)
- API access for LIMS / customer QMS integration

---

## Storage strategy

**Phase 1:** localStorage. Keys:
- `fw_masterSpecs_metricCatalog` — `SpecMetric[]`
- `fw_masterSpecs_entries` — `MasterSpecEntry[]`
- `fw_masterSpecs_audit` — `AuditLogEntry[]`

**Phase 2 (LB#4):** Postgres tables matching the TypeScript interfaces. ComputedStats stored as JSONB column (no separate table needed). Audit table partitioned by month for performance.

**Migration:** localStorage → Postgres via JSON export/import. Phase 1 ships with export button so operators can backup before migration.

---

## Open questions for reviewer — status post-review pass

### LOCKED (reviewer pick 2026-05-27)

1. ✅ **Tab name: "Master Specs"** — cGMP register naming is the moat. "Living Specs" is branding-adjacent; "Master Specs" is industry-native.
2. ✅ **Promotion thresholds** — heavy metals + microbial use `verified_at: 10` (Poisson + detection-limit behavior). All others default `verified_at: 5`, `well_characterized_at: 30`. Per-metric override via `promotion_thresholds` field, populated in seed library.
3. ✅ **Safety factor default** — 2.0 (95% coverage); heavy metals + microbial override to 3.0+ (per-metric `safety_factor_default` field, populated in seed library).
5. ✅ **Cross-revision carry-forward** — Yes by default; per-metric `metric_invalidated_by_revision` flag (on MasterSpecEntry) operator sets when reformulation materially affects the metric. Default false (observations carry).

### REMAINING OPEN

4. **Predefined seed library composition** — 30 metrics chosen for Phase 1. **Co-founder review required** — 20-year formulation expertise needed to validate the list matches target operator profile. CC can propose a candidate list; co-founder locks. Blocks Phase 1 metric catalog seeding but NOT data model build.
6. **External lab integration** — Phase 1 logs `lab_name` as free-text. Recommended: structure as FK to lab vendor table in Phase 2 (after Sourcing tab vendor architecture lands).
7. **Customer share link permissions** — Phase 1 ships expiring-link only. Email-gated access defers to Phase 2.
8. **Master Spec Wizard depth** — Phase 1 ships Quick add + Custom add. Bulk add (spreadsheet paste) defers to Phase 2.

### NEW UNRESOLVED ARCHITECTURAL DEPENDENCIES (surfaced by review)

A. **Packet Q1 — Product entity hierarchy** — Master Specs `product_id` is a UUID, but the Product entity (Brand → Product Line → Product → Version) needs to be resolved in the broader Packet Q1 architectural session. Phase 1 build proceeds with Product entity as a forward-declared interface; full FK wiring lands when Packet Q1 routes. **Routing: operator + Opus + co-founder.**

B. **Convention A vs B ↔ Master Specs interface** — Under Convention B (recipe as proportions, dose derived in PDS), what gets stored in Master Specs `validated_value`? The proportion, the derived dose, or both? Affects supplements operators using Master Specs. F&B (Convention A) unaffected — Jimmy's BBQ Sauce can use Master Specs immediately. **Routing: needs resolution before supplements operators use Master Specs;** does NOT block F&B Phase 1.

C. **Fortune 500 quality bar — depth flex commitment** — Section ontology + depth_tier + version control + audit linkage scaffolded in Phase 1 via `SpecSheetSection` interface. Comprehensive depth (method genealogy, customer acknowledgment, cross-doc references) populates in Phase 2-4. **Locked architectural commitment per reviewer recalibration 2026-05-27.**

---

## Acceptance criteria

### Phase 1 INTERNAL DEV scaffold (ships internally only)

- [ ] All interfaces in `types/masterSpecs.ts` match this doc (SpecMetric / MasterSpecEntry / ObservationLogEntry / ComputedStats discriminated union / OverrideEntry / AuditLogEntry / SpecSheetSection / MetricSuggestion / ExportToken)
- [ ] `lib/masterSpecsStats.ts` has ≥12 unit test cases covering numeric (n=0/1/2/5/30/100) + categorical + boolean + bound_direction variants + overage interpretation + per-metric promotion thresholds
- [ ] 30-metric predefined library seeded in `lib/data/masterSpecsLibrary.ts` with locked distribution_type + bound_direction + safety_factor_default per metric (pending co-founder composition review)
- [ ] Master Specs tab built; **hidden behind feature flag for operator-facing visibility** (internal dev only)
- [ ] Portfolio view lists all saved formulations with spec counts
- [ ] Per-product detail view shows validated specs + observation log
- [ ] Master Spec Wizard works for both Quick add + Custom add
- [ ] SpecSheetSection scaffold present (section ontology + depth_tier defined)
- [ ] PDS Validated Specs section reads from Master Specs (inheritance verified) **but disabled behind same feature flag**
- [ ] "Print Master Spec Sheet" exports designed PDF at `depth_tier: 'standard'`
- [ ] Audit log captures every state change (display deferred to Phase 2)
- [ ] localStorage persistence works across page reloads (internal dev only — explicit dev banner)
- [ ] Typecheck PASS, no regressions to existing tabs

### Phase 1.5 OPERATOR-FACING launch (gates flag-flip)

- [ ] LB#4 Supabase persistence landed
- [ ] localStorage → Postgres migration tested
- [ ] PDS Validated Specs inheritance enabled
- [ ] Feature flag removed; Master Specs tab visible to operators
- [ ] Audit log durably persisted to server

---

## Reviewer red-line review pass — complete 2026-05-27

This doc has been revised through one full red-line review pass. **Five load-bearing red-lines** were surfaced and incorporated into the model:

| # | Red-line | Resolution in model |
|---|---|---|
| 1 | Statistical model assumed normality + symmetric two-sided tolerance (wrong for heavy metals, microbial, one-sided regulatory limits) | Added `distribution_type` + `bound_direction` to `SpecMetric`; range computation branches on bound_direction; per-metric defaults locked in seed library |
| 2 | `product_id` + `revision` were unresolved Packet Q1 dependencies | `product_id` is now a UUID; FG Part # + brand + product line FKs live on Product entity (resolved in Packet Q1); Master Specs joins via UUID with no rework needed |
| 3 | Categorical / boolean metrics broke ComputedStats (assumed numeric throughout) | `ComputedStats` is now a discriminated union by `data_type`; categorical gets counts + dominant; boolean gets pass_pct; tier promotion shared across all variants |
| 4 | Overage / label-claim interface undefined (critical for supplements — Vit C overage means validated_value ≠ label_value) | Added `target_at_label_claim_pct` to `MasterSpecEntry`; label_value = validated_value / (pct/100); default 100 = no overage |
| 5 | Phase 1 localStorage as "QA Manager's single validation source of truth" is a compliance non-starter | Phase 1 scope split: internal dev scaffold only (feature flag); operator-facing launch (Phase 1.5) gated on LB#4 Supabase persistence; PDS Validated Specs inheritance gated on same flag |

**Plus reviewer recalibration:** Fortune 500 quality bar on printed Master Spec Sheet is **architectural commitment** (not design-domain). Added `SpecSheetSection` entity with section ontology + depth_tier + version control + audit linkage. Design-adjacent pieces (visual hierarchy / typography / layout density) remain D's domain.

**4 of 8 open questions locked** by reviewer pick (#1 tab name, #2 promotion thresholds, #3 safety factor, #5 cross-revision carry-forward). 4 remain open (#4 seed library composition needs co-founder review; #6/#7/#8 deferred to Phase 2).

**3 new architectural dependencies surfaced** (Packet Q1 Product entity, Convention A vs B ↔ Master Specs interface, Fortune 500 depth-flex commitment).

**Build status:** model is locked enough to proceed with Phase 1 internal dev scaffold. Co-founder review of seed library composition (#4) blocks Phase 1 metric catalog seeding but NOT the data model build. Convention A vs B (B) does NOT block F&B Phase 1.
