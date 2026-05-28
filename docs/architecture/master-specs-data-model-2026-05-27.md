# Master Specs — Data Model & Architecture

**Date:** 2026-05-27
**Status:** Locked TypeScript model proposal · pending review by operator + Opus + co-founder · gates Phase 1 build
**Companion doctrine:** [[living-spec-learning-doctrine]] · [[controlled-document-doctrine]] · [[upstream-from-pds-doctrine]]
**Companion architecture:** [packaging-data-sheet-architecture-2026-05-27.md](packaging-data-sheet-architecture-2026-05-27.md)

---

## Purpose

This document locks the data model for the new **Master Specs** tab (working name) — the workspace's central spec hub that:

1. Stores authoritative validated specs per product (one record per SKU × revision × metric)
2. Logs actual lab measurements per batch (observation log feeds the spec record)
3. Computes living statistics (mean, σ, confidence tier — promotes as n accumulates)
4. Spans multiple brands + products in one operator's portfolio
5. Generates shareable quality history packages for co-packer customers
6. Serves as the QA Manager's **single validation source of truth**

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
    verified_at: number;                 // Default: 5
    well_characterized_at: number;       // Default: 30
  };
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

**Phase 1 seed library: 30 predefined metrics.**

---

### 2. `MasterSpecEntry` — the spec record (Product × Metric junction)

```typescript
interface MasterSpecEntry {
  id: string;                            // UUID
  product_id: string;                    // FG Part # (e.g., "2106") — the formulation identifier
  revision: string;                      // PDS revision (e.g., "Rev01") — spec accumulates per revision
  metric_id: string;                     // FK → SpecMetric.id

  // Operator-set initial validation (one-time per spec creation)
  validated_value: number | string | boolean;     // Matches metric.data_type
  validated_tolerance: number | null;             // ± tolerance; null for categorical/boolean
  method: string;                                  // Test method actually used (may differ from metric.method_default)
  authorized_signer: string;                       // User ID or free-text name (pre-RBAC)
  authorized_role: 'qa-manager' | 'lab-manager' | 'rd-manager' | 'operator';
  authorized_date: string;                         // ISO date

  // Observation log — append-only, source of truth
  observation_log: ObservationLogEntry[];

  // Computed statistics (derived from observation_log; recomputed on insert)
  computed: ComputedStats;

  // Override history (manual range overrides with audit trail)
  override_history: OverrideEntry[];

  // Lifecycle
  created_at: string;                    // ISO timestamp
  created_by: string;                    // user_id
  updated_at: string;                    // ISO timestamp of most recent change
  archived: boolean;                     // Soft-delete; preserves audit trail
  archived_at?: string;
  archived_by?: string;
  archived_reason?: string;
}
```

**Why one entry per (product_id × revision × metric_id):**

- Allows spec evolution across PDS revisions (Rev01 vs Rev02 may have different validated values)
- Allows different metrics per product (Cola tracks color; capsule doesn't)
- Allows independent observation accumulation per metric

---

### 3. `ObservationLogEntry` — per-batch lab measurement

```typescript
interface ObservationLogEntry {
  id: string;                            // UUID — for drill-through linking
  batch_id: string;                      // Lot code (e.g., "20260427-NJ-L01-S1") — links to Batch Sheet
  observation_date: string;              // ISO date of test
  value: number | string | boolean;      // Matches metric.data_type
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

### 4. `ComputedStats` — derived block (recomputed on observation insert)

```typescript
interface ComputedStats {
  mean: number | null;                   // Arithmetic mean of valid observations
  std_dev: number | null;                // Sample standard deviation (n-1 denominator)
  n: number;                             // Count of non-superseded observations
  min: number | null;
  max: number | null;
  tier: ConfidenceTier;
  current_best: number | null;           // Best estimate displayed (= mean if n≥1, else validated_value)
  current_range: number | null;          // ± range displayed (= safety_factor × std_dev if n≥5, else validated_tolerance)
  safety_factor: number;                 // Default 2.0 (95% coverage); configurable in Phase 2+
  last_observation_at: string | null;    // Most recent observation date
  computed_at: string;                   // When stats were last recomputed
}

type ConfidenceTier =
  | 'estimated'                          // n=0 — platform calculation only
  | 'validated'                          // n=1-4 — initial lab-set, small sample
  | 'verified'                           // n=5-29 — statistically meaningful
  | 'well-characterized';                // n=30+ — statistically robust
```

**Tier promotion logic (centralized in helper):**

```typescript
function computeTier(n: number, metric: SpecMetric): ConfidenceTier {
  const thresholds = metric.promotion_thresholds ?? { verified_at: 5, well_characterized_at: 30 };
  if (n === 0) return 'estimated';
  if (n < thresholds.verified_at) return 'validated';
  if (n < thresholds.well_characterized_at) return 'verified';
  return 'well-characterized';
}
```

**Range computation:**

```typescript
function computeCurrentRange(stats: ComputedStats, validated_tolerance: number): number {
  // When n is small, use operator-set validated_tolerance
  if (stats.n < 5) return validated_tolerance;
  // When n is meaningful, use statistical range: ± k × σ where k = safety_factor (default 2.0 for ~95% coverage)
  return stats.safety_factor * stats.std_dev!;
}
```

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

All statistical computation lives in one module (e.g., `lib/masterSpecsStats.ts`):

```typescript
export function recomputeStats(
  observations: ObservationLogEntry[],
  validated_value: number,
  validated_tolerance: number,
  metric: SpecMetric,
  safety_factor: number = 2.0,
): ComputedStats {
  const valid = observations.filter(o => !o.superseded_by);
  const values = valid.map(o => o.value as number);
  const n = values.length;

  if (n === 0) {
    return {
      mean: null, std_dev: null, n: 0, min: null, max: null,
      tier: 'estimated',
      current_best: validated_value,
      current_range: validated_tolerance,
      safety_factor,
      last_observation_at: null,
      computed_at: new Date().toISOString(),
    };
  }

  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std_dev = n >= 2
    ? Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1))
    : null;

  const tier = computeTier(n, metric);
  const current_best = mean;
  const current_range = (std_dev !== null && n >= 5) ? safety_factor * std_dev : validated_tolerance;

  return {
    mean, std_dev, n,
    min: Math.min(...values),
    max: Math.max(...values),
    tier, current_best, current_range, safety_factor,
    last_observation_at: valid[valid.length - 1].observation_date,
    computed_at: new Date().toISOString(),
  };
}
```

**Unit-testable.** Phase 1 deliverable includes a `__tests__/masterSpecsStats.test.ts` covering edge cases (n=0, n=1, n=2, n=5, n=30, n=100; outliers; superseded observations; categorical metrics).

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

## Phase 1 vs Phase 2+ scope split

### Phase 1 (next session — locks the model + foundational UI)
- Data model implemented (all interfaces above, in `types/masterSpecs.ts`)
- 30-metric predefined seed library (`lib/data/masterSpecsLibrary.ts`)
- `lib/masterSpecsStats.ts` helper module with unit tests
- "Master Specs" tab (or whatever name lands) added to workspace nav
- Portfolio view (lists all products with summary)
- Per-product detail view (validated specs table + observation log)
- Master Spec Wizard (Quick add + Custom add flows)
- localStorage persistence (until LB#4 save backend lands)
- PDS Validated Specs section inherits-displays Master Specs data (controlled-doc inherit)
- "Print Master Spec Sheet" PDF export (designed-looking, customer-shareable)
- Audit log captured (display surface deferred)

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

## Open questions for reviewer (operator + Opus + co-founder)

1. **Final tab name** — Master Specs · Living Specs · Spec Library · Quality Library · other?
2. **Promotion thresholds** — n≥5 (VERIFIED) and n≥30 (WELL-CHARACTERIZED) are statistical conventions; should heavy metals or microbial use higher thresholds in Phase 1 (e.g., n≥10 for VERIFIED) given their Poisson distribution / detection limit behavior?
3. **Safety factor default** — 2.0 (95% coverage) vs 3.0 (99.7% coverage)? Industry uses both; 2.0 matches Six Sigma defaults.
4. **Predefined seed library size** — 30 metrics chosen for Phase 1. Want a specific list reviewed before locking?
5. **Cross-revision spec carry-forward** — When PDS revision changes (Rev01 → Rev02), do observations from Rev01 carry forward into Rev02's spec record? Recommended: yes (revision is metadata; data accumulates) — confirm.
6. **External lab integration** — Phase 1 logs observations as free-text fields. Should we structure `lab_name` as a FK to a lab vendor table for future integration? Recommended: yes, but keep as string in Phase 1 with a TODO for vendor-table refactor.
7. **Customer share link permissions** — Phase 1 ships expiring-link only. Should we also support email-gated (recipient must enter email to access)?
8. **Master Spec Wizard depth** — Phase 1 ships Quick add (predefined) + Custom add (full 5-step). Should Bulk add (paste from spreadsheet) be Phase 2, or deferred further?

---

## Acceptance criteria (Phase 1 ships when)

- [ ] All interfaces in `types/masterSpecs.ts` match this doc
- [ ] `lib/masterSpecsStats.ts` has ≥10 unit test cases covering edge cases
- [ ] 30-metric predefined library seeded in `lib/data/masterSpecsLibrary.ts`
- [ ] Master Specs tab visible in workspace nav (mode-aware: both modes)
- [ ] Portfolio view lists all saved formulations with spec counts
- [ ] Per-product detail view shows validated specs + observation log
- [ ] Master Spec Wizard works for both Quick add + Custom add
- [ ] PDS Validated Specs section reads from Master Specs (inheritance verified)
- [ ] "Print Master Spec Sheet" exports designed PDF
- [ ] Audit log captures every state change (display deferred to Phase 2)
- [ ] localStorage persistence works across page reloads
- [ ] Typecheck PASS, no regressions to existing tabs

---

## Reviewer red-line invitation

This doc is **the bet** that everything in Master Specs Phase 1-6 builds on. World-class teams treat the model as its own deliverable. Please red-line:

- **Architecture** — does the entity model match how cGMP shops actually think?
- **Statistical conventions** — are the promotion thresholds + safety factor defaults right for our target users?
- **Permissions model** — is the role taxonomy complete? Missing roles?
- **Phase scope** — anything in Phase 2+ that should be Phase 1, or vice versa?
- **Open questions** — pick a side on each, or propose alternatives

Once approved, I build against this locked model with confidence that the foundation is right.
