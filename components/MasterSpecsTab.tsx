'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import type {
  ComputedStatsBoolean,
  ComputedStatsCategorical,
  ComputedStatsNumeric,
  MasterSpecEntry,
  SpecMetric,
} from '@/types/masterSpecs';
import {
  appendAuditLog,
  generateId,
  loadAuditLog,
  loadEntries,
  loadMetricCatalog,
  now,
  saveEntries,
  saveMetricCatalog,
} from '@/lib/masterSpecsStorage';
import { PREDEFINED_METRICS } from '@/lib/data/masterSpecsLibrary';
import { recomputeStats } from '@/lib/masterSpecsStats';
import { MasterSpecWizard } from './MasterSpecWizard';

/**
 * Master Specs tab — Phase 1 internal dev scaffold.
 *
 * Portfolio view (default) → click product → per-product detail view.
 * "+ Add spec" opens Master Spec Wizard.
 *
 * Per docs/architecture/master-specs-data-model-2026-05-27.md.
 * Feature-flagged via MASTER_SPECS_FEATURE_FLAG; gating happens in page.tsx
 * at the tab nav level (this component renders only when flag-enabled).
 */

interface SavedFormulationSummary {
  partNumber: string;
  formulationName: string;
  productClass: string;
}

interface MasterSpecsTabProps {
  /** Saved formulations from the workspace — used for portfolio view rows. */
  savedFormulations: SavedFormulationSummary[];
  /** Current active product (from Build Base Sheet) — used as default for new specs. */
  currentProductId: string;
  currentProductName: string;
  currentProductRevision: string;
}

type ViewMode = 'portfolio' | 'detail';

export function MasterSpecsTab({
  savedFormulations,
  currentProductId,
  currentProductName,
  currentProductRevision,
}: MasterSpecsTabProps) {
  // ─── State (hydrated from localStorage) ────────────────────────────
  const [catalog, setCatalog] = useState<SpecMetric[]>([]);
  const [entries, setEntries] = useState<MasterSpecEntry[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('portfolio');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  // ─── Hydrate on mount ───────────────────────────────────────────────
  useEffect(() => {
    const existingCatalog = loadMetricCatalog();
    // Seed the predefined library if storage is empty.
    if (existingCatalog.length === 0) {
      saveMetricCatalog(PREDEFINED_METRICS);
      setCatalog(PREDEFINED_METRICS);
    } else {
      setCatalog(existingCatalog);
    }
    setEntries(loadEntries());
  }, []);

  // ─── Derived — entries grouped by product ──────────────────────────
  const entriesByProduct = useMemo(() => {
    const map = new Map<string, MasterSpecEntry[]>();
    for (const entry of entries) {
      if (entry.archived) continue;
      const list = map.get(entry.product_id) ?? [];
      list.push(entry);
      map.set(entry.product_id, list);
    }
    return map;
  }, [entries]);

  // Portfolio rows — include products with existing specs PLUS the active product.
  const portfolioRows = useMemo(() => {
    const rows: Array<{
      product_id: string;
      product_name: string;
      product_class: string;
      spec_count: number;
      last_modified: string | null;
    }> = [];
    const seen = new Set<string>();

    // Active product first
    if (currentProductId) {
      const productEntries = entriesByProduct.get(currentProductId) ?? [];
      rows.push({
        product_id: currentProductId,
        product_name: currentProductName || 'Untitled',
        product_class: '',
        spec_count: productEntries.length,
        last_modified:
          productEntries.length > 0
            ? productEntries.map((e) => e.updated_at).sort().reverse()[0]
            : null,
      });
      seen.add(currentProductId);
    }

    // Saved formulations
    for (const sf of savedFormulations) {
      if (!sf.partNumber || seen.has(sf.partNumber)) continue;
      const productEntries = entriesByProduct.get(sf.partNumber) ?? [];
      rows.push({
        product_id: sf.partNumber,
        product_name: sf.formulationName || 'Untitled',
        product_class: sf.productClass || '',
        spec_count: productEntries.length,
        last_modified:
          productEntries.length > 0
            ? productEntries.map((e) => e.updated_at).sort().reverse()[0]
            : null,
      });
      seen.add(sf.partNumber);
    }
    return rows;
  }, [entriesByProduct, savedFormulations, currentProductId, currentProductName]);

  const selectedEntries = selectedProductId
    ? entriesByProduct.get(selectedProductId) ?? []
    : [];
  const selectedRow = portfolioRows.find((r) => r.product_id === selectedProductId);

  // ─── Handlers ───────────────────────────────────────────────────────
  function handleOpenProduct(productId: string) {
    setSelectedProductId(productId);
    setViewMode('detail');
  }

  function handleBackToPortfolio() {
    setViewMode('portfolio');
    setSelectedProductId(null);
  }

  function handleSaveNewSpec(newEntry: MasterSpecEntry, newMetricIfCustom?: SpecMetric) {
    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    saveEntries(updatedEntries);

    if (newMetricIfCustom) {
      const updatedCatalog = [...catalog, newMetricIfCustom];
      setCatalog(updatedCatalog);
      saveMetricCatalog(updatedCatalog);
      appendAuditLog({
        id: generateId(),
        timestamp: now(),
        actor_id: 'operator',
        actor_role: 'operator',
        action: 'metric.create',
        target_type: 'metric-catalog',
        target_id: newMetricIfCustom.id,
        reason: 'Created via Master Spec Wizard (custom metric)',
      });
    }

    appendAuditLog({
      id: generateId(),
      timestamp: now(),
      actor_id: 'operator',
      actor_role: 'operator',
      action: 'spec.create',
      target_type: 'master-spec',
      target_id: newEntry.id,
      reason: 'Created via Master Spec Wizard',
    });

    setWizardOpen(false);
  }

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6 bg-white border border-emerald-200 rounded-xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🧪</span>
              <h1 className="text-2xl font-bold text-gray-900">Master Specs</h1>
              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase tracking-wide">
                Phase 1 · Internal Dev
              </span>
            </div>
            <p className="text-xs text-gray-500">
              QA Manager&apos;s validated specs across the portfolio &middot; living confidence tiers (ESTIMATED → VALIDATED → VERIFIED → WELL-CHARACTERIZED)
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <div>
              <span className="text-gray-400 uppercase tracking-wide">Catalog</span>{' '}
              <span className="font-mono font-semibold text-gray-700">{catalog.length} metrics</span>
            </div>
            <div className="mt-1">
              <span className="text-gray-400 uppercase tracking-wide">Tracked specs</span>{' '}
              <span className="font-mono font-semibold text-gray-700">{entries.filter((e) => !e.archived).length}</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-amber-700 italic mt-3 leading-snug">
          Internal dev scaffold &middot; localStorage persistence only (clears with browser data; not portable across devices). Operator-facing launch (Phase 1.5) gated on LB#4 Supabase save backend + co-founder seed-library lock. Authorized: QA Manager (RBAC enforcement post-auth-feature).
        </p>
      </div>

      {viewMode === 'portfolio' ? (
        <PortfolioView rows={portfolioRows} onOpen={handleOpenProduct} />
      ) : (
        <DetailView
          row={selectedRow}
          entries={selectedEntries}
          catalog={catalog}
          onBack={handleBackToPortfolio}
          onAddSpec={() => setWizardOpen(true)}
        />
      )}

      {wizardOpen && (
        <MasterSpecWizard
          catalog={catalog}
          productId={selectedProductId || currentProductId}
          revision={currentProductRevision}
          onCancel={() => setWizardOpen(false)}
          onSave={handleSaveNewSpec}
        />
      )}
    </div>
  );
}

// ─── Portfolio View ──────────────────────────────────────────────────

interface PortfolioRow {
  product_id: string;
  product_name: string;
  product_class: string;
  spec_count: number;
  last_modified: string | null;
}

function PortfolioView({ rows, onOpen }: { rows: PortfolioRow[]; onOpen: (id: string) => void }) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
        <div className="text-4xl mb-3">📋</div>
        <h2 className="text-base font-semibold text-gray-700 mb-2">No products in portfolio yet</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Build a formulation on the Build Base Sheet tab to start tracking validated specs here. Each saved formulation appears as a product card you can drill into.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Portfolio &middot; {rows.length} {rows.length === 1 ? 'product' : 'products'}</h2>
      {rows.map((row) => (
        <button
          key={row.product_id}
          onClick={() => onOpen(row.product_id)}
          className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-emerald-400 hover:shadow-sm transition group"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-800 group-hover:text-emerald-700">{row.product_name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                <span className="font-mono">{row.product_id || '(no FG Part #)'}</span>
                {row.product_class && <span> &middot; {row.product_class}</span>}
              </p>
            </div>
            <div className="text-right text-xs">
              <div className="font-semibold text-gray-700">
                {row.spec_count} {row.spec_count === 1 ? 'spec' : 'specs'} tracked
              </div>
              {row.last_modified && (
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Last updated {new Date(row.last_modified).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Detail View ─────────────────────────────────────────────────────

function DetailView({
  row,
  entries,
  catalog,
  onBack,
  onAddSpec,
}: {
  row: PortfolioRow | undefined;
  entries: MasterSpecEntry[];
  catalog: SpecMetric[];
  onBack: () => void;
  onAddSpec: () => void;
}) {
  if (!row) {
    return (
      <div className="text-center text-sm text-gray-500 p-6">
        Product not found. <button onClick={onBack} className="text-emerald-700 hover:underline">← Back to portfolio</button>
      </div>
    );
  }

  const metricMap = useMemo(() => {
    const m = new Map<string, SpecMetric>();
    for (const c of catalog) m.set(c.id, c);
    return m;
  }, [catalog]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <button onClick={onBack} className="text-xs text-emerald-700 hover:underline mb-1">← Portfolio</button>
          <h2 className="text-lg font-semibold text-gray-800">{row.product_name}</h2>
          <p className="text-xs text-gray-500">
            <span className="font-mono">{row.product_id || '(no FG Part #)'}</span>
            {row.product_class && <span> &middot; {row.product_class}</span>}
          </p>
        </div>
        <button
          onClick={onAddSpec}
          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
        >
          + Add spec
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
          <div className="text-3xl mb-2">🧪</div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">No validated specs yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-3">
            Click &ldquo;+ Add spec&rdquo; to launch the Master Spec Wizard. Pick from {catalog.length} predefined metrics or define your own.
          </p>
          <button
            onClick={onAddSpec}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
          >
            + Add first spec
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Metric</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Validated value</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Current best</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Observations</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const metric = metricMap.get(entry.metric_id);
                return (
                  <SpecRow key={entry.id} entry={entry} metric={metric} />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SpecRow({ entry, metric }: { entry: MasterSpecEntry; metric: SpecMetric | undefined }) {
  if (!metric) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-2 text-xs text-gray-400 italic">
          (Metric {entry.metric_id} not found in catalog)
        </td>
      </tr>
    );
  }

  const validated = formatValue(entry.validated_value, metric.unit, entry.validated_tolerance, metric.bound_direction);
  const best = formatBest(entry.computed, metric.unit);
  const tier = entry.computed.tier;
  const n = entry.computed.n;

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-2.5">
        <div className="font-medium text-gray-800">{metric.icon} {metric.name}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{metric.method_default}</div>
      </td>
      <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{validated}</td>
      <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{best}</td>
      <td className="px-4 py-2.5">
        <TierBadge tier={tier} n={n} />
      </td>
      <td className="px-4 py-2.5 text-xs text-gray-600">
        {n} {n === 1 ? 'observation' : 'observations'}
      </td>
    </tr>
  );
}

function formatValue(value: unknown, unit: string, tolerance: number | null, bound: string): string {
  if (typeof value === 'number') {
    if (tolerance === null || tolerance === 0) return `${value} ${unit}`;
    if (bound === 'upper-only') return `≤ ${value + tolerance} ${unit}`;
    if (bound === 'lower-only') return `≥ ${value - tolerance} ${unit}`;
    return `${value} ± ${tolerance} ${unit}`;
  }
  return `${String(value)}`;
}

function formatBest(computed: MasterSpecEntry['computed'], unit: string): string {
  if (computed.data_type === 'numeric') {
    const num = computed as ComputedStatsNumeric;
    if (num.current_best === null) return '—';
    const best = num.current_best;
    const low = num.current_range_low;
    const high = num.current_range_high;
    const bestStr = Number.isFinite(best) ? best.toFixed(3).replace(/\.?0+$/, '') : '—';
    if (low === null && high === null) return `${bestStr} ${unit}`;
    if (low === null && high !== null) return `≤ ${high.toFixed(3).replace(/\.?0+$/, '')} ${unit}`;
    if (low !== null && high === null) return `≥ ${low.toFixed(3).replace(/\.?0+$/, '')} ${unit}`;
    const halfWidth = (high! - low!) / 2;
    return `${bestStr} ± ${halfWidth.toFixed(3).replace(/\.?0+$/, '')} ${unit}`;
  }
  if (computed.data_type === 'categorical') {
    const cat = computed as ComputedStatsCategorical;
    if (cat.dominant === null) return '—';
    return `${cat.dominant} (${Math.round((cat.dominant_pct ?? 0) * 100)}%)`;
  }
  if (computed.data_type === 'boolean') {
    const b = computed as ComputedStatsBoolean;
    if (b.pass_pct === null) return '—';
    return `${b.true_count}/${b.n} pass (${Math.round(b.pass_pct * 100)}%)`;
  }
  return '—';
}

function TierBadge({ tier, n }: { tier: string; n: number }) {
  const styles: Record<string, string> = {
    estimated: 'bg-gray-50 text-gray-600 border-gray-200',
    validated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    verified: 'bg-sky-50 text-sky-700 border-sky-200',
    'well-characterized': 'bg-violet-50 text-violet-700 border-violet-200',
  };
  const labels: Record<string, string> = {
    estimated: 'ESTIMATED',
    validated: 'VALIDATED',
    verified: 'VERIFIED',
    'well-characterized': 'WELL-CHARACTERIZED',
  };
  const className = styles[tier] ?? styles.estimated;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${className}`}>
      <span>{labels[tier] ?? tier}</span>
      {n > 0 && <span className="font-mono opacity-70">n={n}</span>}
    </span>
  );
}
