'use client';

import { useMemo, useState } from 'react';
import type {
  BoundDirection,
  DataType,
  DistributionType,
  MasterSpecEntry,
  SpecCategory,
  SpecMetric,
} from '@/types/masterSpecs';
import { SPEC_CATEGORY_LABELS, SPEC_CATEGORY_ORDER } from '@/types/masterSpecs';
import { generateId, now } from '@/lib/masterSpecsStorage';
import { recomputeStats } from '@/lib/masterSpecsStats';

/**
 * Master Spec Wizard — Phase 1 (Quick add + Custom add flows).
 *
 * Quick add: search predefined library → set validated value → save (3 steps)
 * Custom add: define metric (name, unit, type, distribution, bound) → set
 *   validated value → save (5 steps)
 *
 * Per docs/architecture/master-specs-data-model-2026-05-27.md.
 */

interface MasterSpecWizardProps {
  catalog: SpecMetric[];
  productId: string;
  revision: string;
  /** Metric ids already tracked for this product × revision — used to warn about duplicates. */
  existingMetricIds?: Set<string>;
  onCancel: () => void;
  onSave: (entry: MasterSpecEntry, newMetricIfCustom?: SpecMetric) => void;
}

type WizardMode = 'select' | 'custom';
type StepId =
  | 'select'
  | 'define-custom'
  | 'method-range'
  | 'validated-value'
  | 'confirm';

export function MasterSpecWizard({ catalog, productId, revision, existingMetricIds, onCancel, onSave }: MasterSpecWizardProps) {
  const [mode, setMode] = useState<WizardMode>('select');
  const [step, setStep] = useState<StepId>('select');
  const [search, setSearch] = useState('');
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);

  // Custom-metric draft state
  const [customName, setCustomName] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customDataType, setCustomDataType] = useState<DataType>('numeric');
  const [customDistribution, setCustomDistribution] = useState<DistributionType>('normal');
  const [customBound, setCustomBound] = useState<BoundDirection>('two-sided');
  const [customCategory, setCustomCategory] = useState<SpecCategory>('other');
  const [customMethodDefault, setCustomMethodDefault] = useState('');
  const [customRangeMin, setCustomRangeMin] = useState<string>('');
  const [customRangeMax, setCustomRangeMax] = useState<string>('');
  const [customDescription, setCustomDescription] = useState('');

  // Spec entry draft state
  const [validatedValue, setValidatedValue] = useState<string>('');
  const [validatedTolerance, setValidatedTolerance] = useState<string>('');
  const [methodUsed, setMethodUsed] = useState<string>('');
  const [authorizedSigner, setAuthorizedSigner] = useState<string>('');
  const [targetOveragePct, setTargetOveragePct] = useState<string>('100');

  // ─── Filtered predefined metrics by search ───────────────────────
  const filteredMetrics = useMemo(() => {
    if (!search.trim()) return catalog;
    const q = search.toLowerCase();
    return catalog.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q) ||
        (m.description ?? '').toLowerCase().includes(q),
    );
  }, [catalog, search]);

  const activeMetric = useMemo(() => {
    if (mode === 'custom') {
      return {
        id: 'pending-custom',
        name: customName,
        unit: customUnit,
        data_type: customDataType,
        method_default: customMethodDefault,
        distribution_type: customDistribution,
        bound_direction: customBound,
        category: customCategory,
        range_min: customRangeMin ? Number(customRangeMin) : undefined,
        range_max: customRangeMax ? Number(customRangeMax) : undefined,
        description: customDescription,
        source: 'custom' as const,
      } as SpecMetric;
    }
    return catalog.find((c) => c.id === selectedMetricId) ?? null;
  }, [mode, customName, customUnit, customDataType, customMethodDefault, customDistribution, customBound, customCategory, customRangeMin, customRangeMax, customDescription, catalog, selectedMetricId]);

  // ─── Step navigation ───────────────────────────────────────────────
  function pickPredefined(id: string) {
    setSelectedMetricId(id);
    const m = catalog.find((c) => c.id === id);
    if (m?.method_default) setMethodUsed(m.method_default);
    setMode('select');
    setStep('validated-value');
  }

  function startCustom() {
    setMode('custom');
    setStep('define-custom');
  }

  function nextFromDefineCustom() {
    if (!customName.trim() || !customUnit.trim()) return;
    setStep('method-range');
  }

  function nextFromMethodRange() {
    setMethodUsed(customMethodDefault);
    setStep('validated-value');
  }

  function nextFromValidatedValue() {
    if (!validatedValue.trim() || !authorizedSigner.trim()) return;
    setStep('confirm');
  }

  function finalize() {
    if (!activeMetric) return;

    let metricForSave = activeMetric;
    let newMetric: SpecMetric | undefined;
    if (mode === 'custom') {
      // Mint a real id for the custom metric
      newMetric = { ...activeMetric, id: generateId(), source: 'custom', created_at: now() };
      metricForSave = newMetric;
    }

    const parsedValue = metricForSave.data_type === 'numeric' ? Number(validatedValue) : validatedValue;
    const parsedTolerance = validatedTolerance.trim() ? Number(validatedTolerance) : null;
    const parsedOverage = Number(targetOveragePct) || 100;

    const entry: MasterSpecEntry = {
      id: generateId(),
      product_id: productId,
      revision,
      metric_id: metricForSave.id,
      validated_value: parsedValue,
      validated_tolerance: parsedTolerance,
      method: methodUsed || metricForSave.method_default || '',
      authorized_signer: authorizedSigner,
      authorized_role: 'qa-manager',
      authorized_date: now(),
      target_at_label_claim_pct: parsedOverage,
      metric_invalidated_by_revision: false,
      observation_log: [],
      computed: recomputeStats(
        [],
        {
          validated_value: parsedValue,
          validated_tolerance: parsedTolerance,
          target_at_label_claim_pct: parsedOverage,
        },
        metricForSave,
      ),
      override_history: [],
      created_at: now(),
      created_by: 'operator',
      updated_at: now(),
      archived: false,
    };

    onSave(entry, newMetric);
  }

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-50 to-sky-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>🧪</span>
                <span>Master Spec Wizard</span>
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">{getStepLabel(step, mode)}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-xs text-gray-500 hover:text-gray-800 hover:bg-white/60 rounded-lg px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 'select' && (
            <StepSelect
              search={search}
              setSearch={setSearch}
              metrics={filteredMetrics}
              existingMetricIds={existingMetricIds}
              onPick={pickPredefined}
              onStartCustom={startCustom}
            />
          )}
          {step === 'define-custom' && (
            <StepDefineCustom
              name={customName} setName={setCustomName}
              unit={customUnit} setUnit={setCustomUnit}
              dataType={customDataType} setDataType={setCustomDataType}
              distribution={customDistribution} setDistribution={setCustomDistribution}
              bound={customBound} setBound={setCustomBound}
              category={customCategory} setCategory={setCustomCategory}
              description={customDescription} setDescription={setCustomDescription}
            />
          )}
          {step === 'method-range' && (
            <StepMethodRange
              method={customMethodDefault} setMethod={setCustomMethodDefault}
              rangeMin={customRangeMin} setRangeMin={setCustomRangeMin}
              rangeMax={customRangeMax} setRangeMax={setCustomRangeMax}
            />
          )}
          {step === 'validated-value' && activeMetric && (
            <StepValidatedValue
              metric={activeMetric}
              validatedValue={validatedValue} setValidatedValue={setValidatedValue}
              validatedTolerance={validatedTolerance} setValidatedTolerance={setValidatedTolerance}
              methodUsed={methodUsed} setMethodUsed={setMethodUsed}
              authorizedSigner={authorizedSigner} setAuthorizedSigner={setAuthorizedSigner}
              targetOveragePct={targetOveragePct} setTargetOveragePct={setTargetOveragePct}
            />
          )}
          {step === 'confirm' && activeMetric && (
            <StepConfirm
              metric={activeMetric}
              validatedValue={validatedValue}
              validatedTolerance={validatedTolerance}
              methodUsed={methodUsed}
              authorizedSigner={authorizedSigner}
              targetOveragePct={targetOveragePct}
              productId={productId}
              revision={revision}
              isCustom={mode === 'custom'}
            />
          )}
        </div>

        {/* Footer nav */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex items-center justify-between">
          <div>
            {step !== 'select' && (
              <button
                onClick={() => setStep(prevStep(step, mode))}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-white"
            >
              Cancel
            </button>
            {step === 'define-custom' && (
              <button
                onClick={nextFromDefineCustom}
                disabled={!customName.trim() || !customUnit.trim()}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            )}
            {step === 'method-range' && (
              <button
                onClick={nextFromMethodRange}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
              >
                Next →
              </button>
            )}
            {step === 'validated-value' && (
              <button
                onClick={nextFromValidatedValue}
                disabled={!validatedValue.trim() || !authorizedSigner.trim()}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            )}
            {step === 'confirm' && (
              <button
                onClick={finalize}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
              >
                Save spec ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step navigation helpers ─────────────────────────────────────────

function getStepLabel(step: StepId, mode: WizardMode): string {
  const total = mode === 'custom' ? 5 : 3;
  const stepNum: Record<StepId, number> = {
    select: 1,
    'define-custom': 2,
    'method-range': 3,
    'validated-value': mode === 'custom' ? 4 : 2,
    confirm: mode === 'custom' ? 5 : 3,
  };
  const labels: Record<StepId, string> = {
    select: 'What do you want to track?',
    'define-custom': 'Define the custom metric',
    'method-range': 'Test method & sanity range',
    'validated-value': 'Set validated value',
    confirm: 'Apply & confirm',
  };
  return `Step ${stepNum[step]} of ${total} — ${labels[step]}`;
}

function prevStep(current: StepId, mode: WizardMode): StepId {
  if (current === 'define-custom') return 'select';
  if (current === 'method-range') return 'define-custom';
  if (current === 'validated-value') return mode === 'custom' ? 'method-range' : 'select';
  if (current === 'confirm') return 'validated-value';
  return current;
}

// ─── Step components ─────────────────────────────────────────────────

function StepSelect({
  search, setSearch, metrics, existingMetricIds, onPick, onStartCustom,
}: {
  search: string;
  setSearch: (v: string) => void;
  metrics: SpecMetric[];
  existingMetricIds?: Set<string>;
  onPick: (id: string) => void;
  onStartCustom: () => void;
}) {
  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search the library… (pH, color, microbial, lead, …)"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-emerald-500"
      />
      <div className="max-h-96 overflow-y-auto pr-1">
        <div className="space-y-1.5">
          {metrics.map((m) => {
            const alreadyTracked = existingMetricIds?.has(m.id) ?? false;
            return (
              <button
                key={m.id}
                onClick={() => { if (!alreadyTracked) onPick(m.id); }}
                disabled={alreadyTracked}
                title={alreadyTracked ? 'Already tracked for this product — one spec per metric per revision' : undefined}
                className={`w-full text-left border rounded-lg p-3 transition ${
                  alreadyTracked
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    : 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-medium text-gray-800 text-sm">
                    <span className="mr-1.5">{m.icon}</span>
                    {m.name}
                    {alreadyTracked && (
                      <span className="ml-2 text-[9px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Already tracked
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono whitespace-nowrap">{m.unit}</div>
                </div>
                {m.description && <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">{m.description}</div>}
              </button>
            );
          })}
        </div>
        {metrics.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-6">No predefined metrics matched. Define a custom metric below.</div>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onStartCustom}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-sm text-gray-600 hover:border-emerald-400 hover:bg-emerald-50/30 transition"
        >
          ➕ Can&apos;t find what you need? Define a custom metric →
        </button>
      </div>
    </div>
  );
}

function StepDefineCustom({
  name, setName, unit, setUnit, dataType, setDataType,
  distribution, setDistribution, bound, setBound, category, setCategory,
  description, setDescription,
}: {
  name: string; setName: (v: string) => void;
  unit: string; setUnit: (v: string) => void;
  dataType: DataType; setDataType: (v: DataType) => void;
  distribution: DistributionType; setDistribution: (v: DistributionType) => void;
  bound: BoundDirection; setBound: (v: BoundDirection) => void;
  category: SpecCategory; setCategory: (v: SpecCategory) => void;
  description: string; setDescription: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vanilla aroma intensity"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Test category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as SpecCategory)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500"
          >
            {SPEC_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>{SPEC_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Unit *</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. VRI, mg/L, %, CFU/g"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Data type *</label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value as DataType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="numeric">Numeric</option>
            <option value="categorical">Categorical (e.g. pass / minor-defect / major-defect)</option>
            <option value="boolean">Boolean (pass / fail)</option>
          </select>
        </div>
      </div>
      {dataType === 'numeric' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Distribution</label>
            <select
              value={distribution}
              onChange={(e) => setDistribution(e.target.value as DistributionType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="normal">Normal (most physical specs)</option>
              <option value="log-normal">Log-normal (heavy metals)</option>
              <option value="poisson">Poisson (microbial counts)</option>
              <option value="binomial">Binomial (pass-rate)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Bound direction</label>
            <select
              value={bound}
              onChange={(e) => setBound(e.target.value as BoundDirection)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="two-sided">Two-sided (± range)</option>
              <option value="upper-only">Upper-only (≤ limit)</option>
              <option value="lower-only">Lower-only (≥ limit)</option>
            </select>
          </div>
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-600 mb-1">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What this measures + how to interpret it"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
}

function StepMethodRange({
  method, setMethod, rangeMin, setRangeMin, rangeMax, setRangeMax,
}: {
  method: string; setMethod: (v: string) => void;
  rangeMin: string; setRangeMin: (v: string) => void;
  rangeMax: string; setRangeMax: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-600 mb-1">Test method (default)</label>
        <input
          type="text"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          placeholder="e.g. GC-MS · Headspace SPME extraction"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
        />
        <p className="text-[10px] text-gray-500 mt-1">Required for cGMP audit trail. Operators can override per-batch.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Sanity range min</label>
          <input
            type="number"
            value={rangeMin}
            onChange={(e) => setRangeMin(e.target.value)}
            placeholder="(optional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Sanity range max</label>
          <input
            type="number"
            value={rangeMax}
            onChange={(e) => setRangeMax(e.target.value)}
            placeholder="(optional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}

function StepValidatedValue({
  metric, validatedValue, setValidatedValue, validatedTolerance, setValidatedTolerance,
  methodUsed, setMethodUsed, authorizedSigner, setAuthorizedSigner,
  targetOveragePct, setTargetOveragePct,
}: {
  metric: SpecMetric;
  validatedValue: string; setValidatedValue: (v: string) => void;
  validatedTolerance: string; setValidatedTolerance: (v: string) => void;
  methodUsed: string; setMethodUsed: (v: string) => void;
  authorizedSigner: string; setAuthorizedSigner: (v: string) => void;
  targetOveragePct: string; setTargetOveragePct: (v: string) => void;
}) {
  const showTolerance = metric.data_type === 'numeric';
  const showOverage = metric.data_type === 'numeric';
  return (
    <div className="space-y-4">
      <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50/30">
        <div className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold mb-1">Tracking</div>
        <div className="font-semibold text-gray-800">{metric.icon} {metric.name}</div>
        <div className="text-[11px] text-gray-600 mt-0.5">Unit: {metric.unit} · Distribution: {metric.distribution_type} · Bound: {metric.bound_direction}</div>
      </div>
      <div className={showTolerance ? 'grid grid-cols-3 gap-3' : ''}>
        <div className={showTolerance ? 'col-span-1' : ''}>
          <label className="block text-xs text-gray-600 mb-1">Validated value *</label>
          <input
            type={metric.data_type === 'numeric' ? 'number' : 'text'}
            step="any"
            value={validatedValue}
            onChange={(e) => setValidatedValue(e.target.value)}
            placeholder={metric.data_type === 'boolean' ? 'true / false' : 'value'}
            className="w-full border border-emerald-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-emerald-500"
          />
        </div>
        {showTolerance && (
          <div className="col-span-1">
            <label className="block text-xs text-gray-600 mb-1">Tolerance (±)</label>
            <input
              type="number"
              step="any"
              value={validatedTolerance}
              onChange={(e) => setValidatedTolerance(e.target.value)}
              placeholder="optional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
        {showTolerance && (
          <div className="col-span-1 text-[10px] text-gray-500 self-end pb-2">
            Bound: <span className="font-mono">{metric.bound_direction}</span>
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Method used *</label>
        <input
          type="text"
          value={methodUsed}
          onChange={(e) => setMethodUsed(e.target.value)}
          placeholder={metric.method_default || 'Test method'}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Authorized signer *</label>
        <input
          type="text"
          value={authorizedSigner}
          onChange={(e) => setAuthorizedSigner(e.target.value)}
          placeholder="QA Manager name"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
        />
        <p className="text-[10px] text-gray-500 mt-1">Authorized: QA Manager (RBAC enforcement post-auth-feature).</p>
      </div>
      {showOverage && (
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Target % of label claim (supplements overage)
          </label>
          <input
            type="number"
            value={targetOveragePct}
            onChange={(e) => setTargetOveragePct(e.target.value)}
            placeholder="100"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
          />
          <p className="text-[10px] text-gray-500 mt-1">
            100% = no overage. 110% = validated_value is 110% of label claim (e.g., Vit C 6-mo stability allowance).
          </p>
        </div>
      )}
    </div>
  );
}

function StepConfirm({
  metric, validatedValue, validatedTolerance, methodUsed, authorizedSigner, targetOveragePct,
  productId, revision, isCustom,
}: {
  metric: SpecMetric;
  validatedValue: string;
  validatedTolerance: string;
  methodUsed: string;
  authorizedSigner: string;
  targetOveragePct: string;
  productId: string;
  revision: string;
  isCustom: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50/30">
        <div className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold mb-2">Ready to save</div>
        <div className="text-base font-bold text-gray-900 mb-2">
          {metric.icon} {metric.name}
          {isCustom && <span className="text-[10px] font-normal text-emerald-700 ml-2 normal-case">(custom — added to library)</span>}
        </div>
        <div className="text-sm text-gray-700 font-mono">
          {validatedValue}{validatedTolerance ? ` ± ${validatedTolerance}` : ''} {metric.unit}
        </div>
        <div className="text-[11px] text-gray-600 mt-2 space-y-0.5">
          <div>Method: {methodUsed}</div>
          <div>Signer: {authorizedSigner} · {new Date().toLocaleDateString()}</div>
          <div>Product: <span className="font-mono">{productId}</span> · {revision}</div>
          {Number(targetOveragePct) !== 100 && <div>Overage: {targetOveragePct}% of label claim</div>}
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
        <div className="font-semibold text-gray-700 mb-1">Will appear on:</div>
        <ul className="space-y-0.5 ml-3 list-none">
          <li>✓ Master Specs (this product)</li>
          <li>✓ PDS Validated Specs section <span className="text-gray-400">(read-only inherit; feature-gated until Phase 1.5)</span></li>
          <li>✓ Batch Sheet target spec table <span className="text-gray-400">(when Phase 2 wires)</span></li>
          <li>✓ Quality History exports for co-pack customers</li>
        </ul>
        <p className="text-[10px] text-gray-500 mt-2 italic">
          Each batch&apos;s lab measurements feed observation log → tier promotes ESTIMATED → VALIDATED → VERIFIED (n≥5) → WELL-CHARACTERIZED (n≥30) as data accumulates.
        </p>
      </div>
    </div>
  );
}
