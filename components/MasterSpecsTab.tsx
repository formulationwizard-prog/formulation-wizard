'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import type {
  ComputedStatsBoolean,
  ComputedStatsCategorical,
  ComputedStatsNumeric,
  MasterSpecEntry,
  ObservationLogEntry,
  SpecCategory,
  SpecMetric,
  SupplementCompositionSpec,
} from '@/types/masterSpecs';
import { loadCompositionSpecs } from '@/lib/supplementCompositionStorage';
import { SPEC_CATEGORY_LABELS, SPEC_CATEGORY_ORDER } from '@/types/masterSpecs';
import { MasterSpecTestReport } from './MasterSpecTestReport';
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
  /** Workspace identity for the export report header. */
  currentBrand?: string;
  currentManufacturer?: string;
}

type ViewMode = 'portfolio' | 'detail';

export function MasterSpecsTab({
  savedFormulations,
  currentProductId,
  currentProductName,
  currentProductRevision,
  currentBrand,
  currentManufacturer,
}: MasterSpecsTabProps) {
  // ─── State (hydrated from localStorage) ────────────────────────────
  const [catalog, setCatalog] = useState<SpecMetric[]>([]);
  const [entries, setEntries] = useState<MasterSpecEntry[]>([]);
  // Wizard-generated supplement composition specs, keyed by FG Part #. These are
  // derived (not observation-logged) — written on save by the workspace.
  const [compositionSpecs, setCompositionSpecs] = useState<Record<string, SupplementCompositionSpec>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('portfolio');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  // Export report state — title + the (filtered) entries to include.
  const [report, setReport] = useState<{ title: string; entries: MasterSpecEntry[] } | null>(null);

  // ─── Hydrate on mount ───────────────────────────────────────────────
  useEffect(() => {
    // Always refresh predefined metrics from the library so schema additions
    // (e.g. tracked_spec_key, category) propagate to dev localStorage seeded
    // earlier. Operator-defined custom metrics are preserved. Phase 1.5
    // (Postgres) replaces this with a proper migration.
    const stored = loadMetricCatalog();
    const customMetrics = stored.filter((m) => m.source === 'custom');
    const merged = [...PREDEFINED_METRICS, ...customMetrics];
    saveMetricCatalog(merged);
    setCatalog(merged);
    // Recompute stats on load — migration that fixes stale computed.tier on
    // entries created before the isAuthored tier fix (ESTIMATED → VALIDATED).
    const metricById = new Map(merged.map((m) => [m.id, m]));
    const loaded = loadEntries().map((e) => {
      const metric = metricById.get(e.metric_id);
      return metric ? { ...e, computed: recomputeStats(e.observation_log, e, metric) } : e;
    });
    setEntries(loaded);
    saveEntries(loaded);
    setCompositionSpecs(loadCompositionSpecs());
  }, []);

  // ─── Append a test result (observation) to a test-type entry ─────────
  const handleAddResult = (
    entryId: string,
    obs: { date: string; value: number | string | boolean; lot: string; lab?: string; signer: string },
  ) => {
    const metricById = new Map(catalog.map((m) => [m.id, m]));
    const updated = entries.map((e) => {
      if (e.id !== entryId) return e;
      const metric = metricById.get(e.metric_id);
      if (!metric) return e;
      const newObs: ObservationLogEntry = {
        id: generateId(),
        batch_id: obs.lot,
        observation_date: obs.date,
        value: obs.value,
        method_used: e.method || metric.method_default || '',
        signer: obs.signer,
        signer_role: 'lab-tech',
        lab_name: obs.lab,
        created_at: now(),
        created_by: 'operator',
      };
      const newLog = [...e.observation_log, newObs];
      return { ...e, observation_log: newLog, computed: recomputeStats(newLog, e, metric), updated_at: now() };
    });
    setEntries(updated);
    saveEntries(updated);
    appendAuditLog({
      id: generateId(), timestamp: now(), actor_id: 'operator', actor_role: 'lab-tech',
      action: 'observation.add', target_type: 'observation', target_id: entryId,
      reason: `Result logged: ${obs.value} (lot ${obs.lot})`,
    });
  };

  // ─── Archive (soft-delete) a test-type entry ─────────────────────────
  const handleArchiveSpec = (entryId: string) => {
    const updated = entries.map((e) =>
      e.id === entryId
        ? { ...e, archived: true, archived_at: now(), archived_by: 'operator', archived_reason: 'Removed via Master Specs UI' }
        : e,
    );
    setEntries(updated);
    saveEntries(updated);
    appendAuditLog({
      id: generateId(), timestamp: now(), actor_id: 'operator', actor_role: 'qa-manager',
      action: 'spec.archive', target_type: 'master-spec', target_id: entryId,
      reason: 'Archived via Master Specs UI',
    });
  };

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
      has_composition: boolean;
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
        has_composition: !!compositionSpecs[currentProductId],
        last_modified:
          productEntries.length > 0
            ? productEntries.map((e) => e.updated_at).sort().reverse()[0]
            : compositionSpecs[currentProductId]?.generated_at ?? null,
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
        has_composition: !!compositionSpecs[sf.partNumber],
        last_modified:
          productEntries.length > 0
            ? productEntries.map((e) => e.updated_at).sort().reverse()[0]
            : compositionSpecs[sf.partNumber]?.generated_at ?? null,
      });
      seen.add(sf.partNumber);
    }
    return rows;
  }, [entriesByProduct, savedFormulations, currentProductId, currentProductName, compositionSpecs]);

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
          compositionSpec={selectedProductId ? compositionSpecs[selectedProductId] ?? null : null}
          onBack={handleBackToPortfolio}
          onAddSpec={() => setWizardOpen(true)}
          onExportMetric={(entry, metricName) => setReport({ title: `${metricName} Test Report`, entries: [entry] })}
          onExportCategory={(category, categoryEntries) => setReport({ title: `${SPEC_CATEGORY_LABELS[category]} Report`, entries: categoryEntries })}
          onAddResult={handleAddResult}
          onArchive={handleArchiveSpec}
        />
      )}

      {wizardOpen && (
        <MasterSpecWizard
          catalog={catalog}
          productId={selectedProductId || currentProductId}
          revision={currentProductRevision}
          existingMetricIds={new Set(selectedEntries.map((e) => e.metric_id))}
          onCancel={() => setWizardOpen(false)}
          onSave={handleSaveNewSpec}
        />
      )}

      {report && selectedRow && (
        <MasterSpecTestReport
          title={report.title}
          product={{
            productName: selectedRow.product_name,
            productId: selectedRow.product_id,
            revision: currentProductRevision,
            brand: currentBrand,
            manufacturer: currentManufacturer,
          }}
          entries={report.entries}
          catalog={catalog}
          onClose={() => setReport(null)}
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
  has_composition: boolean;
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
              {row.has_composition && (
                <span className="inline-block text-[9px] font-bold uppercase tracking-wide text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded mb-1">
                  🧬 Composition spec
                </span>
              )}
              <div className="font-semibold text-gray-700">
                {row.spec_count} {row.spec_count === 1 ? 'test type' : 'test types'} tracked
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
  compositionSpec,
  onBack,
  onAddSpec,
  onExportMetric,
  onExportCategory,
  onAddResult,
  onArchive,
}: {
  row: PortfolioRow | undefined;
  entries: MasterSpecEntry[];
  catalog: SpecMetric[];
  compositionSpec: SupplementCompositionSpec | null;
  onBack: () => void;
  onAddSpec: () => void;
  onExportMetric: (entry: MasterSpecEntry, metricName: string) => void;
  onExportCategory: (category: SpecCategory, entries: MasterSpecEntry[]) => void;
  onAddResult: (entryId: string, obs: { date: string; value: number | string | boolean; lot: string; lab?: string; signer: string }) => void;
  onArchive: (entryId: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (!row) {
    return (
      <div className="text-center text-sm text-gray-500 p-6">
        Product not found. <button onClick={onBack} className="text-emerald-700 hover:underline">← Back to portfolio</button>
      </div>
    );
  }

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const metricMap = new Map<string, SpecMetric>();
  for (const c of catalog) metricMap.set(c.id, c);

  // Group entries by their metric's category (test type stays together by type).
  const byCategory = new Map<SpecCategory, MasterSpecEntry[]>();
  for (const entry of entries) {
    const metric = metricMap.get(entry.metric_id);
    const category: SpecCategory = metric?.category ?? 'other';
    const list = byCategory.get(category) ?? [];
    list.push(entry);
    byCategory.set(category, list);
  }

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
          + Add test type
        </button>
      </div>

      {/* Wizard-generated composition spec (supplements). Read-only — derived
          from the formula on save, never operator-logged. Sits above the
          measured-test tracker; both can coexist (composition = targets,
          logged tests = validation). */}
      {compositionSpec && <CompositionSpecSection spec={compositionSpec} />}

      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
          <div className="text-3xl mb-2">🧪</div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">No test types tracked yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-3">
            Add a test type (pH, Brix, microbial, heavy metals…) — then log results from each production run. Tests stay grouped by type and the block grows as you add results.
          </p>
          <button
            onClick={onAddSpec}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
          >
            + Add first test type
          </button>
        </div>
      ) : (
        // Itemized by test type — category sections wrap expandable per-metric
        // blocks. Each block accumulates results (date · value · lot#) and
        // expands as results are logged. Per operator mockup 2026-05-27.
        <div className="space-y-5">
          {SPEC_CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((cat) => {
            const catEntries = byCategory.get(cat)!;
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {SPEC_CATEGORY_LABELS[cat]} <span className="text-gray-400 font-normal">· {catEntries.length}</span>
                  </h3>
                  <button
                    onClick={() => onExportCategory(cat, catEntries)}
                    className="text-[10px] font-medium text-sky-700 bg-sky-50 border border-sky-200 px-2 py-1 rounded hover:bg-sky-100"
                    title={`Export all ${SPEC_CATEGORY_LABELS[cat]} for PA / inspector`}
                  >
                    📄 Export {SPEC_CATEGORY_LABELS[cat]}
                  </button>
                </div>
                <div className="space-y-2">
                  {catEntries.map((entry) => {
                    const metric = metricMap.get(entry.metric_id);
                    if (!metric) {
                      return (
                        <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-3 text-xs text-gray-400 italic">
                          (Metric {entry.metric_id} not found in catalog)
                        </div>
                      );
                    }
                    return (
                      <MetricBlock
                        key={entry.id}
                        entry={entry}
                        metric={metric}
                        isExpanded={expanded.has(entry.id)}
                        onToggle={() => toggle(entry.id)}
                        onAddResult={(obs) => onAddResult(entry.id, obs)}
                        onArchive={() => onArchive(entry.id)}
                        onExport={() => onExportMetric(entry, metric.name)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Composition Spec (supplements) — wizard-generated, read-only ──────

function fmtNum(v: number, maxFrac = 2): string {
  const rounded = Math.round(v * 10 ** maxFrac) / 10 ** maxFrac;
  return rounded.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

function unitWord(deliveryForm: string): string {
  const map: Record<string, string> = {
    capsule: 'capsule', softgel: 'softgel', tablet: 'tablet', caplet: 'caplet',
    gummy: 'gummy', lozenge: 'lozenge', chewable: 'chewable', powder: 'scoop', liquid: 'serving',
  };
  return map[deliveryForm] || 'unit';
}

function CompositionSpecSection({ spec }: { spec: SupplementCompositionSpec }) {
  const unit = unitWord(spec.serving.deliveryForm);
  const isSingleUnit = spec.serving.unitsPerServing === 1;
  const totalPct = spec.rows.reduce((s, r) => s + r.pct, 0);

  return (
    <div className="mb-6 bg-white rounded-xl border border-violet-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-violet-50/60 border-b border-violet-100 flex items-start justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">🧬</span>
            <h3 className="text-sm font-bold text-gray-800">Composition Spec</h3>
            <span className="text-[9px] font-bold uppercase tracking-wide text-violet-700 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded">
              Wizard-generated
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wide text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
              Convention B
            </span>
            <TierBadge tier={spec.confidence} n={0} />
          </div>
          <p className="text-[11px] text-gray-600 mt-1">
            Exact mg of each compound per {unit} and per serving — derived from the formula, not logged.
          </p>
        </div>
        <div className="text-right text-[10px] text-gray-400 shrink-0">
          generated {new Date(spec.generated_at).toLocaleDateString()}
        </div>
      </div>

      {/* Serving definition — the dial that drives every mg below */}
      <div className="px-4 py-2 text-xs text-gray-600 border-b border-gray-100 bg-gray-50/40">
        <span className="font-semibold text-gray-700">Serving:</span>{' '}
        {isSingleUnit ? (
          <>1 {unit} = <span className="font-semibold">{fmtNum(spec.serving.servingMassMg)} mg</span></>
        ) : (
          <>
            {spec.serving.unitsPerServing} {unit}s × {fmtNum(spec.serving.perUnitFillMg)} mg fill ={' '}
            <span className="font-semibold">{fmtNum(spec.serving.servingMassMg)} mg</span>
          </>
        )}
      </div>

      {/* Composition table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-200">
              <th className="px-4 py-1.5 font-semibold uppercase tracking-wide text-[9px]">Ingredient</th>
              <th className="px-2 py-1.5 font-semibold uppercase tracking-wide text-[9px] text-right">% of fill</th>
              <th className="px-2 py-1.5 font-semibold uppercase tracking-wide text-[9px] text-right">mg / {unit}</th>
              <th className="px-2 py-1.5 font-semibold uppercase tracking-wide text-[9px] text-right">mg / serving</th>
              <th className="px-4 py-1.5 font-semibold uppercase tracking-wide text-[9px] text-right">Active / serving</th>
            </tr>
          </thead>
          <tbody>
            {spec.rows.map((r) => (
              <tr key={r.name} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-1.5 text-gray-800">{r.name}</td>
                <td className="px-2 py-1.5 font-mono text-gray-600 text-right">{fmtNum(r.pct)}%</td>
                <td className="px-2 py-1.5 font-mono text-gray-700 text-right">{fmtNum(r.mgPerUnit)}</td>
                <td className="px-2 py-1.5 font-mono text-gray-900 font-medium text-right">{fmtNum(r.mgPerServing)}</td>
                <td className="px-4 py-1.5 font-mono text-right">
                  {r.hasElementalDistinction ? (
                    <span className="text-gray-800" title={`elemental/active factor ×${r.elementalFactor}`}>
                      {fmtNum(r.activeMgPerServing)} <span className="text-gray-400">(×{r.elementalFactor})</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">full mass</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 font-semibold text-gray-700 bg-gray-50/40">
              <td className="px-4 py-1.5">Total</td>
              <td className="px-2 py-1.5 font-mono text-right">{fmtNum(totalPct)}%</td>
              <td className="px-2 py-1.5 font-mono text-right">{fmtNum(spec.serving.perUnitFillMg)}</td>
              <td className="px-2 py-1.5 font-mono text-right">{fmtNum(spec.totalMgPerServing)}</td>
              <td className="px-4 py-1.5" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Provenance footnote */}
      <p className="px-4 py-2 text-[10px] text-gray-400 italic border-t border-gray-100 leading-snug">
        Wizard-generated from the formula (% of fill × fill weight × {unit}s per serving). Elemental/active
        factors are typical values (ESTIMATED) — attach a supplier COA to upgrade to VERIFIED. Regenerates on
        each save.
      </p>
    </div>
  );
}

// ─── Metric block — one test type; expands to its results log ──────────

function MetricBlock({
  entry, metric, isExpanded, onToggle, onAddResult, onArchive, onExport,
}: {
  entry: MasterSpecEntry;
  metric: SpecMetric;
  isExpanded: boolean;
  onToggle: () => void;
  onAddResult: (obs: { date: string; value: number | string | boolean; lot: string; lab?: string; signer: string }) => void;
  onArchive: () => void;
  onExport: () => void;
}) {
  const best = formatBest(entry.computed, metric.unit);
  const tier = entry.computed.tier;
  const n = entry.computed.n;
  const validObs = entry.observation_log.filter((o) => !o.superseded_by);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header — collapsed summary */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <button onClick={onToggle} className="flex items-center gap-2 text-left flex-1 min-w-0">
          <span className="text-gray-400 text-xs w-4 shrink-0">{isExpanded ? '▾' : '▸'}</span>
          <span className="font-medium text-gray-800 truncate">{metric.icon} {metric.name}</span>
          <span className="font-mono text-xs text-gray-600 shrink-0">{best}</span>
          <TierBadge tier={tier} n={n} />
        </button>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <button onClick={onExport} className="text-[10px] font-medium text-sky-700 hover:underline" title={`Export ${metric.name} for PA / inspector`}>
            📄 Export
          </button>
          <button onClick={onArchive} className="text-[10px] text-gray-400 hover:text-rose-600" title="Archive this test type">
            ✕
          </button>
        </div>
      </div>

      {/* Body — fixed input line at top, results history flows down (newest first).
          Per operator 2026-05-27: the input stays in one clear place; the
          newest result appears directly under it and history moves down. */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
          <div className="text-[10px] text-gray-500 mb-2">
            Method: {entry.method || metric.method_default || '—'} · Target: {formatValue(entry.validated_value, metric.unit, entry.validated_tolerance, metric.bound_direction)}
          </div>
          {/* Always-visible input line — the clear place to put data */}
          <AddResultForm metric={metric} onSubmit={onAddResult} />
          {/* Results history — newest first, directly under the input line */}
          {validObs.length === 0 ? (
            <p className="text-xs text-gray-400 italic mt-2">No results logged yet — enter the first production-run result above.</p>
          ) : (
            <table className="w-full text-xs mt-2">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-200">
                  <th className="py-1 pr-3 font-semibold uppercase tracking-wide text-[9px]">Date</th>
                  <th className="py-1 pr-3 font-semibold uppercase tracking-wide text-[9px]">Result</th>
                  <th className="py-1 font-semibold uppercase tracking-wide text-[9px]">Lot #</th>
                </tr>
              </thead>
              <tbody>
                {[...validObs].reverse().map((o) => (
                  <tr key={o.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-1 pr-3 text-gray-700">{new Date(o.observation_date).toLocaleDateString()}</td>
                    <td className="py-1 pr-3 font-mono text-gray-800">{String(o.value)} {metric.unit}</td>
                    <td className="py-1 font-mono text-gray-600">{o.batch_id || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inline add-result form ────────────────────────────────────────────

function AddResultForm({
  metric, onSubmit,
}: {
  metric: SpecMetric;
  onSubmit: (obs: { date: string; value: number | string | boolean; lot: string; lab?: string; signer: string }) => void;
}) {
  // Always-visible input line — the fixed clear place to put data. After Add,
  // clears value + lot and keeps focus here so the operator can log the next
  // production run immediately; the newest result appears in the history below.
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [value, setValue] = useState('');
  const [lot, setLot] = useState('');
  const [signer, setSigner] = useState('');

  const submit = () => {
    if (!value.trim()) return;
    let parsed: number | string | boolean = value;
    if (metric.data_type === 'numeric') parsed = Number(value);
    else if (metric.data_type === 'boolean') parsed = value.trim().toLowerCase() === 'true' || value.trim().toLowerCase() === 'pass';
    onSubmit({ date, value: parsed, lot: lot.trim(), lab: undefined, signer: signer.trim() || 'Unsigned' });
    setValue('');
    setLot('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="flex flex-wrap items-end gap-2 p-2 border border-emerald-200 rounded-lg bg-emerald-50/40">
      <div>
        <label className="block text-[9px] uppercase tracking-wide text-gray-500 mb-0.5">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500" />
      </div>
      <div>
        <label className="block text-[9px] uppercase tracking-wide text-gray-500 mb-0.5">Result ({metric.unit})</label>
        <input
          type={metric.data_type === 'numeric' ? 'number' : 'text'}
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={metric.data_type === 'boolean' ? 'pass / fail' : 'value'}
          className="w-24 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-[9px] uppercase tracking-wide text-gray-500 mb-0.5">Lot #</label>
        <input type="text" value={lot} onChange={(e) => setLot(e.target.value)} onKeyDown={onKeyDown} placeholder="lot code" className="w-36 border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-emerald-500" />
      </div>
      <div>
        <label className="block text-[9px] uppercase tracking-wide text-gray-500 mb-0.5">Signer</label>
        <input type="text" value={signer} onChange={(e) => setSigner(e.target.value)} onKeyDown={onKeyDown} placeholder="initials" className="w-20 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500" />
      </div>
      <button onClick={submit} disabled={!value.trim()} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">+ Add result</button>
    </div>
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
    // Suppress "± 0" — when tolerance is zero there's no meaningful range to show
    if (halfWidth === 0) return `${bestStr} ${unit}`;
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
