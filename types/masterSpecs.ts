// Master Specs — Data model (TypeScript interfaces).
//
// Lock matches docs/architecture/master-specs-data-model-2026-05-27.md.
// Five red-lines from reviewer 2026-05-27 incorporated:
//   #1 distribution_type + bound_direction on SpecMetric
//   #2 product_id is UUID (forward-decl Product entity for Packet Q1)
//   #3 ComputedStats is discriminated union by data_type
//   #4 target_at_label_claim_pct on MasterSpecEntry (overage interface)
//   #5 Phase 1 = internal dev scaffold; operator launch gated on LB#4
//
// Plus Fortune 500 quality bar as architectural commitment:
//   SpecSheetSection entity (section ontology + depth_tier + audit linkage).

// ─── Shared scalar types ─────────────────────────────────────────────────

export type ProductClass = string; // Aligns with existing workspace mode taxonomy

export type RegulatoryRelevance =
  | 'prop-65'
  | 'falcpa-allergen'
  | 'usp-232' // Heavy metals
  | 'usp-233' // Heavy metals method
  | 'usp-905' // Uniformity of dosage units
  | 'aoac-microbial'
  | 'fda-handbook-133' // Net contents verification
  | 'cfr-114-acidified' // Acidified foods pH
  | 'cfr-113-lacf' // LACF aw
  | 'dshea-supplement'
  | 'customer-requirement' // Co-pack customer spec
  | 'custom';

export type ConfidenceTier =
  | 'estimated' // n=0 — platform calculation only
  | 'validated' // n=1..<verified_at — initial lab-set, small sample
  | 'verified' // n=verified_at..<well_characterized_at — statistically meaningful
  | 'well-characterized'; // n>=well_characterized_at — statistically robust

export type DataType = 'numeric' | 'categorical' | 'boolean';

export type DistributionType = 'normal' | 'log-normal' | 'poisson' | 'binomial';

export type BoundDirection = 'two-sided' | 'upper-only' | 'lower-only';

// ─── Entity 1: SpecMetric (the catalog — what CAN be tracked) ───────────

export interface SpecMetric {
  id: string;
  name: string;
  unit: string;
  data_type: DataType;
  range_min?: number;
  range_max?: number;
  method_default?: string;
  regulatory_relevance?: RegulatoryRelevance[];
  applicable_product_classes?: ProductClass[];
  source: 'predefined' | 'custom';
  created_by?: string;
  created_at?: string;
  icon?: string;
  description?: string;
  promotion_thresholds?: {
    verified_at: number; // Default 5; heavy metals + microbial use 10
    well_characterized_at: number; // Default 30
  };
  // Red-line #1 — statistical model parameters
  distribution_type: DistributionType;
  bound_direction: BoundDirection;
  safety_factor_default?: number; // Default 2.0; heavy metals + microbial override 3.0+
}

// ─── Entity 2: MasterSpecEntry (Product × Metric junction) ──────────────

export interface MasterSpecEntry {
  id: string;
  product_id: string; // UUID — Product entity owns FG Part # + brand + product line FKs (Packet Q1)
  revision: string;
  metric_id: string;

  // Operator-set initial validation
  validated_value: number | string | boolean;
  validated_tolerance: number | null;
  method: string;
  authorized_signer: string;
  authorized_role: 'qa-manager' | 'lab-manager' | 'rd-manager' | 'operator';
  authorized_date: string;

  // Red-line #4 — overage / label-claim interface
  // validated_value is actual concentration at time-zero (e.g., Vit C at 110% of label claim)
  // label_value = validated_value / (target_at_label_claim_pct / 100). Default 100 = no overage.
  target_at_label_claim_pct: number;

  // Per-metric cross-revision behavior (per reviewer pick #5)
  metric_invalidated_by_revision: boolean;

  observation_log: ObservationLogEntry[];
  computed: ComputedStats;
  override_history: OverrideEntry[];

  // Lifecycle
  created_at: string;
  created_by: string;
  updated_at: string;
  archived: boolean;
  archived_at?: string;
  archived_by?: string;
  archived_reason?: string;
}

// ─── Entity 3: ObservationLogEntry (per-batch lab measurement) ──────────

export interface ObservationLogEntry {
  id: string;
  batch_id: string; // Lot code; links to Batch Sheet
  observation_date: string;
  value: number | string | boolean;
  lab_name?: string;
  method_used: string;
  signer: string;
  signer_role: 'lab-tech' | 'qa-tech' | 'qa-manager' | 'external-lab';
  notes?: string;
  reference?: string;

  // Lifecycle
  created_at: string;
  created_by: string;
  superseded_by?: string; // If retest invalidates this; preserve original
  superseded_reason?: string;
}

// ─── Entity 4: ComputedStats (discriminated union by data_type) ─────────

export interface ComputedStatsBase {
  n: number;
  tier: ConfidenceTier;
  last_observation_at: string | null;
  computed_at: string;
}

export interface ComputedStatsNumeric extends ComputedStatsBase {
  data_type: 'numeric';
  mean: number | null;
  std_dev: number | null;
  min: number | null;
  max: number | null;
  current_best: number | null;
  current_range_low: number | null; // null if bound_direction='upper-only'
  current_range_high: number | null; // null if bound_direction='lower-only'
  safety_factor: number;
}

export interface ComputedStatsCategorical extends ComputedStatsBase {
  data_type: 'categorical';
  counts: Record<string, number>;
  dominant: string | null;
  dominant_pct: number | null;
}

export interface ComputedStatsBoolean extends ComputedStatsBase {
  data_type: 'boolean';
  true_count: number;
  false_count: number;
  pass_pct: number | null;
}

export type ComputedStats = ComputedStatsNumeric | ComputedStatsCategorical | ComputedStatsBoolean;

// ─── Entity 5: OverrideEntry (manual range override + audit trail) ─────

export interface OverrideEntry {
  id: string;
  override_type: 'tolerance' | 'safety-factor' | 'method' | 'archive';
  applied_value: unknown;
  previous_value: unknown;
  reason: string;
  applied_by: string;
  applied_role: 'qa-manager' | 'lab-manager' | 'plant-manager';
  applied_at: string;
  effective_until?: string;
}

// ─── Entity 6: AuditLogEntry (system-wide append-only) ──────────────────

export type AuditAction =
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
  | 'share-link.access' // When customer opens shared link
  | 'share-link.expire';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO timestamp (server time when LB#4 ships)
  actor_id: string;
  actor_role:
    | 'qa-manager'
    | 'lab-tech'
    | 'lab-manager'
    | 'plant-manager'
    | 'operator'
    | 'admin'
    | 'system'
    | 'unknown';
  action: AuditAction;
  target_type: 'master-spec' | 'observation' | 'metric-catalog' | 'override' | 'export' | 'share-link';
  target_id: string;
  changes?: { field: string; from: unknown; to: unknown }[];
  reason?: string;
  meta?: Record<string, unknown>;
}

// ─── Entity 7: MetricSuggestion (Phase 6 cross-product learning) ────────

export interface MetricSuggestion {
  source_product_id: string;
  source_metric_id: string;
  suggested_value: number;
  suggested_tolerance: number;
  confidence_basis: 'cross-product-portfolio' | 'industry-library' | 'regulatory-prescribed';
  rationale: string;
}

// ─── Entity 8: ExportToken (expiring co-pack share links) ──────────────

export interface ExportToken {
  id: string;
  product_id: string;
  metric_ids: string[]; // [] = all metrics
  date_range_from: string;
  date_range_to: string;
  generated_by: string;
  generated_at: string;
  expires_at: string;
  recipient_label?: string;
  access_count: number;
  last_accessed_at?: string;
  revoked: boolean;
  revoked_at?: string;
}

// ─── Entity 9: SpecSheetSection (Fortune 500 depth-flex architecture) ───

export type SpecSheetSectionType =
  | 'identity' // Cover page — minimal+
  | 'validated-specs' // Validated spec table — minimal+
  | 'observation-history' // Per-metric observation log — standard+
  | 'statistical-summary' // Mean / σ / tier / n — standard+
  | 'method-genealogy' // Test methods + validation — comprehensive
  | 'override-audit-trail' // Override history — standard+
  | 'production-statistics' // Cross-batch trends — comprehensive
  | 'customer-acknowledgment' // Customer sign-off — comprehensive
  | 'approval-signatures' // QA / Ops / Plant Mgr — minimal+
  | 'revision-history' // Full revision log — comprehensive
  | 'regulatory-references' // FDA / USP / AOAC citations — standard+
  | 'cross-doc-references'; // Links to HACCP / SSOP / Allergen Control Plan — comprehensive

export type DepthTier = 'minimal' | 'standard' | 'comprehensive';

export interface SpecSheetSection {
  id: string;
  ordinal: number;
  section_type: SpecSheetSectionType;
  title: string;
  depth_tier: DepthTier;
  visibility: 'always' | 'when-data-present' | 'optional';
  audit_anchor_id?: string;
  revision_introduced: string;
  revision_last_modified: string;
  // content_renderer is a component reference; deferred to UI integration
  // and not part of the storable model (separate registry maps section_type
  // → React component on the render side).
}
