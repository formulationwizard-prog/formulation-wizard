'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type {
  ComputedStatsBoolean,
  ComputedStatsCategorical,
  ComputedStatsNumeric,
  MasterSpecEntry,
  SpecMetric,
} from '@/types/masterSpecs';

/**
 * Master Spec Test Report — Phase 1b.
 *
 * The standalone document a QA Manager pulls by test type and sends to a
 * Process Authority or third-party inspector. Per operator directive
 * 2026-05-27 ("pull the pH testing and send it to the PA / third-party
 * inspector"). Scoped to a single metric OR a category bundle.
 *
 * Renders via portal to document.body so the print stylesheet can isolate
 * it (.ms-report-portal) from the rest of the workspace — see app/globals.css
 * @media print rule.
 */

interface ReportProduct {
  productName: string;
  productId: string;
  revision: string;
  brand?: string;
  manufacturer?: string;
}

interface MasterSpecTestReportProps {
  title: string; // "pH Test Report" or "Physical Tests Report"
  product: ReportProduct;
  entries: MasterSpecEntry[]; // The specs included in this report (already filtered)
  catalog: SpecMetric[];
  onClose: () => void;
}

export function MasterSpecTestReport({ title, product, entries, catalog, onClose }: MasterSpecTestReportProps) {
  // Toggle a body class while open so the print stylesheet can isolate the report.
  useEffect(() => {
    document.body.classList.add('printing-master-spec-report');
    return () => document.body.classList.remove('printing-master-spec-report');
  }, []);

  const metricMap = new Map(catalog.map((c) => [c.id, c]));
  const generated = new Date().toLocaleString();

  const body = (
    <div className="ms-report-portal fixed inset-0 z-[60] bg-black/50 overflow-auto print:bg-white print:static print:overflow-visible">
      <div className="max-w-3xl mx-auto my-8 bg-white rounded-xl shadow-2xl print:shadow-none print:rounded-none print:my-0 print:max-w-none">
        {/* Toolbar — hidden in print */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl print:hidden">
          <span className="text-sm font-semibold text-gray-700">{title}</span>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
            >
              📄 Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-white"
            >
              Close
            </button>
          </div>
        </div>

        {/* Report body */}
        <div className="p-8 print:p-0">
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <div><span className="text-gray-500">Product</span> <span className="font-semibold ml-1">{product.productName}</span></div>
              <div><span className="text-gray-500">FG Part #</span> <span className="font-mono font-semibold ml-1">{product.productId || '—'}</span></div>
              {product.brand && <div><span className="text-gray-500">Brand</span> <span className="font-semibold ml-1">{product.brand}</span></div>}
              {product.manufacturer && <div><span className="text-gray-500">Manufacturer</span> <span className="font-semibold ml-1">{product.manufacturer}</span></div>}
              <div><span className="text-gray-500">Revision</span> <span className="font-semibold ml-1">{product.revision}</span></div>
              <div><span className="text-gray-500">Generated</span> <span className="ml-1">{generated}</span></div>
            </div>
          </div>

          {entries.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No specs in this report.</p>
          ) : (
            entries.map((entry) => {
              const metric = metricMap.get(entry.metric_id);
              if (!metric) return null;
              return <SpecReportBlock key={entry.id} entry={entry} metric={metric} />;
            })
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-[10px] text-gray-500 leading-relaxed">
            This report is generated from the manufacturer&apos;s Master Specs validation records. Confidence tier reflects the number of verified production observations (n). VALIDATED = QA-attested initial value; VERIFIED = statistically meaningful sample; WELL-CHARACTERIZED = robust sample. Statistical ranges use the metric&apos;s configured distribution + safety factor. For regulatory determinations, confirm with a qualified Process Authority.
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(body, document.body);
}

function SpecReportBlock({ entry, metric }: { entry: MasterSpecEntry; metric: SpecMetric }) {
  const c = entry.computed;
  const validObs = entry.observation_log.filter((o) => !o.superseded_by);

  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2 uppercase tracking-wide">
        {metric.icon} {metric.name}
      </h2>

      {/* Validated specification */}
      <div className="text-sm mb-3">
        <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Validated Specification</div>
        <div className="font-mono font-bold text-lg text-gray-900">{formatSpec(entry, metric)}</div>
        <div className="text-xs text-gray-600 mt-1">
          Method: {entry.method || metric.method_default || '—'} · Authorized: {entry.authorized_signer} · {new Date(entry.authorized_date).toLocaleDateString()} · Tier: {tierLabel(c.tier)}{c.n > 0 ? ` (n=${c.n})` : ''}
        </div>
      </div>

      {/* Observation history */}
      <div className="text-sm mb-3">
        <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Observation History ({validObs.length})</div>
        {validObs.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No batch observations recorded yet. Validated value is the QA-attested initial specification.</p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-700 text-left">
                <th className="py-1 pr-2">Lot</th>
                <th className="py-1 pr-2">Date</th>
                <th className="py-1 pr-2 text-right">Value</th>
                <th className="py-1 pr-2">Lab</th>
                <th className="py-1 pr-2">Method</th>
                <th className="py-1">Signer</th>
              </tr>
            </thead>
            <tbody>
              {validObs.map((o) => (
                <tr key={o.id} className="border-b border-gray-100">
                  <td className="py-1 pr-2 font-mono">{o.batch_id}</td>
                  <td className="py-1 pr-2">{new Date(o.observation_date).toLocaleDateString()}</td>
                  <td className="py-1 pr-2 text-right font-mono">{String(o.value)} {metric.unit}</td>
                  <td className="py-1 pr-2">{o.lab_name || '—'}</td>
                  <td className="py-1 pr-2">{o.method_used}</td>
                  <td className="py-1">{o.signer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Statistical summary (numeric only) */}
      {c.data_type === 'numeric' && c.n > 0 && (
        <div className="text-sm">
          <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Statistical Summary</div>
          <div className="text-xs text-gray-700 font-mono">
            Mean {fmtNum((c as ComputedStatsNumeric).mean)} · σ {fmtNum((c as ComputedStatsNumeric).std_dev)} · n={c.n} · range {formatRange(c as ComputedStatsNumeric, metric.unit)} ({(c as ComputedStatsNumeric).safety_factor}σ)
          </div>
        </div>
      )}

      {/* Regulatory reference */}
      {metric.regulatory_relevance && metric.regulatory_relevance.length > 0 && (
        <div className="text-[10px] text-gray-500 mt-2">
          Regulatory: {metric.regulatory_relevance.join(' · ')}
        </div>
      )}
    </section>
  );
}

// ─── Formatting helpers ─────────────────────────────────────────────

function tierLabel(tier: string): string {
  const labels: Record<string, string> = {
    estimated: 'ESTIMATED',
    validated: 'VALIDATED',
    verified: 'VERIFIED',
    'well-characterized': 'WELL-CHARACTERIZED',
  };
  return labels[tier] ?? tier.toUpperCase();
}

function fmtNum(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return n.toFixed(3).replace(/\.?0+$/, '');
}

function formatSpec(entry: MasterSpecEntry, metric: SpecMetric): string {
  if (metric.data_type === 'numeric') {
    const v = entry.validated_value as number;
    const tol = entry.validated_tolerance;
    if (metric.bound_direction === 'upper-only') return `≤ ${v + (tol ?? 0)} ${metric.unit}`;
    if (metric.bound_direction === 'lower-only') return `≥ ${v - (tol ?? 0)} ${metric.unit}`;
    if (tol === null || tol === 0) return `${v} ${metric.unit}`;
    return `${v} ± ${tol} ${metric.unit}`;
  }
  return `${String(entry.validated_value)}`;
}

function formatRange(c: ComputedStatsNumeric, unit: string): string {
  const lo = c.current_range_low;
  const hi = c.current_range_high;
  if (lo === null && hi === null) return '—';
  if (lo === null && hi !== null) return `≤ ${fmtNum(hi)} ${unit}`;
  if (lo !== null && hi === null) return `≥ ${fmtNum(lo)} ${unit}`;
  return `${fmtNum(lo)}–${fmtNum(hi)} ${unit}`;
}
