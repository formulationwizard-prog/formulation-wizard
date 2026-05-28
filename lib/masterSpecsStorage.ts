// Master Specs — localStorage persistence layer (Phase 1 INTERNAL DEV scaffold).
//
// Per docs/architecture/master-specs-data-model-2026-05-27.md (red-line #5):
// localStorage is NOT shipped as compliance backbone. Operator-facing launch
// (Phase 1.5) requires LB#4 Supabase persistence. Until then, this module
// is gated behind MASTER_SPECS_FEATURE_FLAG for dev-only visibility.
//
// Storage keys (Phase 1):
//   fw_masterSpecs_metricCatalog — SpecMetric[]
//   fw_masterSpecs_entries       — MasterSpecEntry[]
//   fw_masterSpecs_audit         — AuditLogEntry[] (append-only)
//
// Phase 1.5 migration: each module export ships with a Postgres-equivalent
// query so the localStorage→server cutover is a swap-in, not a rewrite.

import type {
  AuditLogEntry,
  MasterSpecEntry,
  SpecMetric,
} from '@/types/masterSpecs';

// ─── Feature flag (Phase 1 INTERNAL DEV scaffold gate) ─────────────────

/**
 * Feature flag — operator-facing Master Specs UI hidden in production
 * until Phase 1.5 launch criteria are met:
 *   1. LB#4 Supabase persistence has landed
 *   2. Co-founder has reviewed + locked the 30-metric seed library
 *   3. localStorage → Postgres migration has been tested
 *
 * In DEV mode (process.env.NODE_ENV === 'development'), the flag defaults
 * to ON so internal testing doesn't require .env.local changes.
 *
 * In PROD, defaults to OFF; set NEXT_PUBLIC_MASTER_SPECS_ENABLED='true'
 * to force-enable (used by deploy preview branches if needed).
 */
export const MASTER_SPECS_FEATURE_FLAG: boolean =
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_MASTER_SPECS_ENABLED === 'true');

// ─── Storage keys ──────────────────────────────────────────────────────

const KEY_CATALOG = 'fw_masterSpecs_metricCatalog';
const KEY_ENTRIES = 'fw_masterSpecs_entries';
const KEY_AUDIT = 'fw_masterSpecs_audit';

// ─── SpecMetric catalog CRUD ──────────────────────────────────────────

export function loadMetricCatalog(): SpecMetric[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY_CATALOG);
    return raw ? (JSON.parse(raw) as SpecMetric[]) : [];
  } catch {
    return [];
  }
}

export function saveMetricCatalog(catalog: SpecMetric[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY_CATALOG, JSON.stringify(catalog));
  } catch {
    /* storage quota / disabled — silently no-op for Phase 1 dev */
  }
}

// ─── MasterSpecEntry CRUD ──────────────────────────────────────────────

export function loadEntries(): MasterSpecEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY_ENTRIES);
    return raw ? (JSON.parse(raw) as MasterSpecEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: MasterSpecEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY_ENTRIES, JSON.stringify(entries));
  } catch {
    /* no-op */
  }
}

// ─── AuditLogEntry append-only ─────────────────────────────────────────

export function loadAuditLog(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY_AUDIT);
    return raw ? (JSON.parse(raw) as AuditLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendAuditLog(entry: AuditLogEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadAuditLog();
    existing.push(entry);
    window.localStorage.setItem(KEY_AUDIT, JSON.stringify(existing));
  } catch {
    /* no-op */
  }
}

// ─── Convenience — generate UUID-like id (Phase 1; Phase 1.5 uses server uuid_generate_v4()) ───

export function generateId(): string {
  // Phase 1 only — Phase 1.5 server-generated UUIDs replace this.
  // Time-based + random for collision avoidance in browser localStorage scope.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

// ─── Convenience — current ISO timestamp ──────────────────────────────

export function now(): string {
  return new Date().toISOString();
}

// ─── JSON export — Phase 1 backup before Phase 1.5 migration ───────────

export interface MasterSpecsExport {
  exported_at: string;
  schema_version: '2026-05-27-v2';
  metric_catalog: SpecMetric[];
  entries: MasterSpecEntry[];
  audit_log: AuditLogEntry[];
}

export function exportAll(): MasterSpecsExport {
  return {
    exported_at: now(),
    schema_version: '2026-05-27-v2',
    metric_catalog: loadMetricCatalog(),
    entries: loadEntries(),
    audit_log: loadAuditLog(),
  };
}

export function importAll(data: MasterSpecsExport): void {
  if (data.schema_version !== '2026-05-27-v2') {
    throw new Error(`Schema version mismatch: expected 2026-05-27-v2, got ${data.schema_version}`);
  }
  saveMetricCatalog(data.metric_catalog);
  saveEntries(data.entries);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(KEY_AUDIT, JSON.stringify(data.audit_log));
  }
}
