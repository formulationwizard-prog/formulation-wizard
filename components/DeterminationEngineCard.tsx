'use client';

/**
 * DeterminationEngineCard — the live regulatory classification of the
 * current formulation. Always rendered on the Build tab below the
 * Current Formulation table.
 *
 * Reads existing reactive state — does not introduce new global state.
 * The card updates via useMemo derived from the specs/filing inputs
 * passed in as props.
 */

import { useMemo, type ReactNode } from 'react';
import {
  Ban,
  OctagonX,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { formatRangedValue, type FormulationSpecs } from '../lib/foodScience';
import type { FilingRequirement } from '../lib/scheduledProcess';
import { getCopy, type CopyKey } from '../lib/copy';
import { useTier } from '../lib/hooks/useTier';
import { AdvisoryNotice } from './AdvisoryNotice';
import { ConfidencePill } from './ConfidencePill';

type Severity = 'banned' | 'critical' | 'warning' | 'caution' | 'ok' | 'info';

interface ClassificationCopy {
  titleKey: CopyKey;
  reasonKey: CopyKey;
  filingKey: CopyKey;
  severity: Severity;
}

interface DeterminationEngineCardProps {
  /**
   * Active formulation mode. Supplements bypass acidified-foods logic
   * and surface as DSHEA-regulated dietary supplements instead.
   */
  modeId: string;
  /** Output of estimateSpecs() — drives the classification mapping. */
  specs: FormulationSpecs;
  /** Output of determineFilingRequirement() — drives the filing line. */
  filing: FilingRequirement;
  /** Whether at least one ingredient has been added. */
  hasIngredients: boolean;
  /** Click handler for the "Find a Process Authority" link. */
  onOpenProcessAuthorities?: () => void;
}

const SEVERITY_VISUAL: Record<Severity, { border: string; bg: string; iconColor: string; Icon: typeof Ban }> = {
  banned:   { border: 'border-rose-300',   bg: 'bg-rose-50',    iconColor: 'text-rose-700',   Icon: Ban },
  critical: { border: 'border-rose-300',   bg: 'bg-rose-50',    iconColor: 'text-rose-600',   Icon: OctagonX },
  warning:  { border: 'border-amber-300',  bg: 'bg-amber-50',   iconColor: 'text-amber-600',  Icon: AlertTriangle },
  caution:  { border: 'border-amber-200',  bg: 'bg-amber-50',   iconColor: 'text-amber-500',  Icon: AlertCircle },
  ok:       { border: 'border-emerald-200',bg: 'bg-emerald-50', iconColor: 'text-emerald-600',Icon: CheckCircle2 },
  info:     { border: 'border-gray-200',   bg: 'bg-white',      iconColor: 'text-gray-500',   Icon: AlertCircle },
};

function classifyForCard(
  modeId: string,
  specs: FormulationSpecs,
  hasIngredients: boolean
): ClassificationCopy {
  // Dietary supplements: DSHEA / 21 CFR 111 framework — bypass acidified logic
  if (modeId === 'supplements') {
    return {
      titleKey: 'determination.dietarySupplement.title',
      reasonKey: 'determination.dietarySupplement.reason',
      filingKey: 'determination.filing.dietarySupplement',
      severity: 'info',
    };
  }

  // Empty / insufficient data
  if (!hasIngredients || specs.productClassification === '—') {
    return {
      titleKey: 'determination.undetermined.title',
      reasonKey: 'determination.undetermined.reason',
      filingKey: 'determination.filing.undetermined',
      severity: 'info',
    };
  }

  switch (specs.productClassification) {
    case 'lacf':
      return {
        titleKey: 'determination.lacf.title',
        reasonKey: 'determination.lacf.reason',
        filingKey: 'determination.filing.lacf',
        severity: 'critical',
      };
    case 'acidified':
      return {
        titleKey: 'determination.acidified.title',
        reasonKey: 'determination.acidified.reason',
        filingKey: 'determination.filing.acidified',
        severity: 'caution',
      };
    case 'acidified-in-process':
      return {
        titleKey: 'determination.acidifiedInProcess.title',
        reasonKey: 'determination.acidifiedInProcess.reason',
        filingKey: 'determination.filing.acidifiedInProcess',
        severity: 'warning',
      };
    case 'acid':
      return {
        titleKey: 'determination.acid.title',
        reasonKey: 'determination.acid.reason',
        filingKey: 'determination.filing.acid',
        severity: 'ok',
      };
    case 'shelf-stable-dry':
      return {
        titleKey: 'determination.shelfStableDry.title',
        reasonKey: 'determination.shelfStableDry.reason',
        filingKey: 'determination.filing.shelfStableDry',
        severity: 'ok',
      };
    default:
      return {
        titleKey: 'determination.undetermined.title',
        reasonKey: 'determination.undetermined.reason',
        filingKey: 'determination.filing.undetermined',
        severity: 'info',
      };
  }
}

/**
 * Build the "driving metrics" sub-line. Different modes care about different signals.
 *
 * Round 1 directive 2026-05-07: pH, a_w, and LAC% render with Class 1a confidence
 * treatment (range + ConfidencePill matching Spec Analysis panel). Spec coverage
 * stays plain — it's a meta-spec about input completeness, not a chemistry estimate.
 */
function metricsLine(modeId: string, specs: FormulationSpecs): ReactNode {
  if (modeId === 'supplements') {
    return (
      <span className="text-xs text-gray-600">
        Supplements mode — see Safety / Stability / NDI panels below.
      </span>
    );
  }
  if (specs.totalWeightG <= 0) {
    return <span className="text-xs text-gray-500 italic">No ingredients yet.</span>;
  }
  const items: ReactNode[] = [];
  if (specs.pH > 0) {
    items.push(
      <span key="ph" className="inline-flex items-center gap-1">
        <span>Equilibrium pH {formatRangedValue('pH', specs.pH, specs.confidence.pH, 2).text}</span>
        <ConfidencePill conf={specs.confidence.pH} size="xs" />
      </span>
    );
  }
  if (specs.aw > 0) {
    items.push(
      <span key="aw" className="inline-flex items-center gap-1">
        <span>a_w {formatRangedValue('aw', specs.aw, specs.confidence.aw, 3).text}</span>
        <ConfidencePill conf={specs.confidence.aw} size="xs" />
      </span>
    );
  }
  if (specs.lowAcidComponentPct > 0) {
    // LAC% derived from per-ingredient pH classifications — inherits pH confidence.
    items.push(
      <span key="lac" className="inline-flex items-center gap-1">
        <span>Low-acid components {specs.lowAcidComponentPct.toFixed(1)}%</span>
        <ConfidencePill conf={specs.confidence.pH} size="xs" />
      </span>
    );
  }
  if (specs.coverage > 0) {
    // Plain — meta-spec about input completeness, not a chemistry estimate.
    items.push(<span key="cov">Spec coverage {(specs.coverage * 100).toFixed(0)}%</span>);
  }
  if (items.length === 0) return <span className="text-xs text-gray-500 italic">Awaiting spec data.</span>;
  return (
    <span className="text-xs text-gray-700 font-mono inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          {it}
          {i < items.length - 1 && <span className="text-gray-400">·</span>}
        </span>
      ))}
    </span>
  );
}

export function DeterminationEngineCard({
  modeId,
  specs,
  filing,
  hasIngredients,
  onOpenProcessAuthorities,
}: DeterminationEngineCardProps) {
  const tier = useTier();

  const classification = useMemo(
    () => classifyForCard(modeId, specs, hasIngredients),
    [modeId, specs, hasIngredients]
  );

  const visual = SEVERITY_VISUAL[classification.severity];
  const { Icon } = visual;

  const title = getCopy(classification.titleKey, tier);
  const reason = getCopy(classification.reasonKey, tier);
  // Prefer the engine-supplied filing copy when one is available (it includes
  // form numbers + Process Authority language tailored to the formula); fall
  // back to the catalog default for the simpler classifications.
  const filingFromEngine = filing.formName;
  const filingFromCatalog = getCopy(classification.filingKey, tier);
  const filingText = filing.required ? filingFromEngine : filingFromCatalog;
  const cardLabel = getCopy('determination.cardLabel', tier);
  const metricsLabel = getCopy('determination.label.metrics', tier);
  const filingLabel = getCopy('determination.label.filingRequired', tier);
  const whyLabel = getCopy('determination.label.why', tier);

  const showAdvisory = filing.processAuthorityRequired
    || classification.severity === 'critical'
    || classification.severity === 'warning'
    || classification.severity === 'caution';

  return (
    <div className={`rounded-lg border ${visual.border} ${visual.bg} p-4`}>
      {/* Card label — small, all-caps, lets the user know this is the engine */}
      <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-2">
        {cardLabel}
      </div>

      {/* Header — classification name + severity icon */}
      <div className="flex items-start gap-2 mb-3">
        <Icon className={`h-5 w-5 ${visual.iconColor} shrink-0 mt-0.5`} aria-hidden="true" />
        <h3 className="text-base font-bold text-gray-800 leading-snug">{title}</h3>
      </div>

      {/* Driving metrics */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">{metricsLabel}</div>
        <div className="mt-0.5">{metricsLine(modeId, specs)}</div>
      </div>

      {/* Filing required */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">{filingLabel}</div>
        <div className="text-xs text-gray-800 font-medium mt-0.5">{filingText}</div>
      </div>

      {/* Why */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">{whyLabel}</div>
        <p className="text-xs text-gray-700 leading-relaxed mt-0.5">{reason}</p>
      </div>

      {/* Citations from the filing engine — pure metadata, kept terse */}
      {filing.citations && filing.citations.length > 0 && (
        <p className="text-[10px] text-gray-500 mb-3">
          <span className="font-semibold uppercase tracking-wide">Citations:</span>{' '}
          {filing.citations.join(' · ')}
        </p>
      )}

      {/* Advisory notice — only when an authoritative human review is needed */}
      {showAdvisory && (
        <div className="pt-2 border-t border-gray-200">
          <AdvisoryNotice onLinkClick={onOpenProcessAuthorities} />
        </div>
      )}
    </div>
  );
}

export default DeterminationEngineCard;
