'use client';

// ============================================================
// FilingReadinessWidget — Round 9 (2026-05-09)
// ------------------------------------------------------------
// Pathway-aware Filing Readiness widget for the sticky status bar.
// Replaces the prior Phase-1 boolean-checks heuristic with a metric
// that scores against the documentation set the customer's Process
// Authority needs to file under the formulation's specific
// regulatory pathway.
//
// Renders four surfaces per the Round 9 directive:
//   • Surface 1 — inline status-bar widget (label + percentage + bar
//                 + confidence pill + click affordance + pathway sub-line)
//   • Surface 2 — escalation banner directly below the widget when the
//                 pathway has changed since last render (dismissable)
//   • Surface 3 — popover with floored-by blocker diagnostic + footer
//                 listing total deferred requirements with critical/
//                 supplementary breakdown
//   • Surface 4 — popover with pathway-not-specified placeholder copy
//                 (per-pathway message)
//
// Color/pill vocabulary follows Round 8 (CALCULATED stone, ESTIMATED
// amber, INFERRED amber, UNKNOWN gray). MEASURED items don't appear
// as flooredBy entries.
//
// See docs/rounds/round-9-directive.md for the locked spec and
// docs/design/filing-readiness.md for the system specification.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, X as XIcon } from 'lucide-react';
import { ConfidencePill } from './ConfidencePill';
import { getCopy, type CopyKey, type Tier } from '@/lib/copy';
import { useTier } from '@/lib/hooks/useTier';
import type { Confidence } from '@/types';
import type {
  FilingReadinessResult,
  FilingReadinessPathway,
  RequirementResult,
} from '@/lib/filingReadiness';

// ----- Confidence-driven color theme ------------------------------------
// Literal class strings (not interpolated) so Tailwind's content scanner
// picks them up at build time.
const BAR_BG: Record<Confidence, string> = {
  measured:   'bg-stone-500',
  calculated: 'bg-stone-500',
  estimated:  'bg-amber-500',
  inferred:   'bg-amber-500',
  unknown:    'bg-gray-400',
};
const PCT_TEXT: Record<Confidence, string> = {
  measured:   'text-stone-800',
  calculated: 'text-stone-800',
  estimated:  'text-amber-700',
  inferred:   'text-amber-700',
  unknown:    'text-gray-600',
};

// ----- Internal state types --------------------------------------------
interface PreviousPathwayState {
  pathway: FilingReadinessPathway;
  label: string;
}

interface EscalationState {
  fromLabel: string;
  toLabel: string;
  toIsUnspecified: boolean;
}

// ----- Surface 4 placeholder copy key per pathway ---------------------
function unavailableCopyKey(pathway: FilingReadinessPathway): CopyKey {
  switch (pathway) {
    case 'lacf':               return 'filingReadiness.unavailable.lacf';
    case 'acid-food':          return 'filingReadiness.unavailable.acidFood';
    case 'shelf-stable-dry':   return 'filingReadiness.unavailable.shelfStableDry';
    case 'dietary-supplement': return 'filingReadiness.unavailable.dietarySupplement';
    case 'fsis-meat':          return 'filingReadiness.unavailable.fsisMeat';
    case 'pending':            return 'filingReadiness.unavailable.pending';
    case 'unclassified':       return 'filingReadiness.unavailable.unclassified';
    case 'acidified-foods':    return 'filingReadiness.unavailable.unclassified'; // unreachable; defensive
  }
}

// ----- Surface 3 blocker copy resolution per requirement ---------------
function formatBlocker(req: RequirementResult, tier: Tier): string {
  if (req.status.kind === 'deferred') {
    return getCopy('filingReadiness.blocker.deferred', tier).replace('{label}', req.label);
  }
  // Wired requirement — choose template by HACCP-special-case OR confidence tier
  const isHaccp = req.id === 'af.haccp';
  if (isHaccp) {
    if (req.effectiveConfidence === 'inferred') {
      return getCopy('filingReadiness.blocker.haccp.inferred', tier).replace('{label}', req.label);
    }
    if (req.effectiveConfidence === 'unknown') {
      return getCopy('filingReadiness.blocker.haccp.unknown', tier).replace('{label}', req.label);
    }
  }
  const keyByConf: Partial<Record<Confidence, CopyKey>> = {
    unknown:   'filingReadiness.blocker.wired.unknown',
    inferred:  'filingReadiness.blocker.wired.inferred',
    estimated: 'filingReadiness.blocker.wired.estimated',
  };
  const key = keyByConf[req.effectiveConfidence];
  // measured / calculated shouldn't appear in flooredBy; defensive fallback returns the bare label
  return key ? getCopy(key, tier).replace('{label}', req.label) : req.label;
}

// ============================================================
// Component
// ============================================================
export function FilingReadinessWidget({ result }: { result: FilingReadinessResult }) {
  const tier = useTier();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [escalation, setEscalation] = useState<EscalationState | null>(null);
  const previousRef = useRef<PreviousPathwayState | null>(null);

  // Escalation detection — when the pathway machine ID changes between
  // renders, capture from/to labels for the annotation. The annotation
  // persists until the user dismisses (or replaces it with a fresh one
  // when the pathway changes again).
  //
  // v1 simplification: revert-detection (A→B→A treated as no-escalation)
  // is deferred per directive defer-permission. v1 treats every pathway
  // change as a fresh escalation event.
  useEffect(() => {
    const previous = previousRef.current;
    if (previous !== null && previous.pathway !== result.pathway) {
      setEscalation({
        fromLabel: previous.label,
        toLabel: result.pathwayLabel,
        toIsUnspecified: !result.isPathwaySpecified,
      });
    }
    previousRef.current = { pathway: result.pathway, label: result.pathwayLabel };
  }, [result.pathway, result.pathwayLabel, result.isPathwaySpecified]);

  const widgetLabel = getCopy('filingReadiness.widgetLabel', tier);
  const tooltipText = getCopy('filingReadiness.tooltip', tier);
  const pathwayPrefix = getCopy('filingReadiness.pathwayPrefix', tier);

  const conf: Confidence = result.confidence ?? 'unknown';
  const barBg = BAR_BG[conf];
  const pctText = PCT_TEXT[conf];

  // Surface 1 — main inline widget
  const renderSurface1 = () => (
    <button
      type="button"
      onClick={() => setPopoverOpen(o => !o)}
      className="inline-flex flex-col items-start gap-0 text-left hover:opacity-80 transition-opacity"
      title={tooltipText}
      aria-label={`${widgetLabel} ${pathwayPrefix} ${result.pathwayLabel}: ${result.percentage !== null ? result.percentage + '%' : 'unavailable'}`}
    >
      <div className="inline-flex items-center gap-2 text-[11px]">
        <span className="text-gray-500">{widgetLabel}</span>
        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          {result.percentage !== null && (
            <div
              className={`h-full ${barBg} transition-[width] duration-300`}
              style={{ width: `${result.percentage}%` }}
            />
          )}
        </div>
        <span className={`font-mono font-semibold ${pctText}`}>
          {result.percentage !== null ? `${result.percentage}%` : '—'}
        </span>
        {result.confidence && <ConfidencePill conf={result.confidence} size="xs" />}
        {/* Context-driven affordance (Round 9 discoverability finding) — speaks
            to the user's internal state. Floored → "Why is this low?";
            unavailable pathway → "Why is this unavailable?"; healthy → "View detail";
            popover open → "Close". */}
        <span className="text-[10px] text-gray-500 hover:text-gray-700 inline-flex items-center gap-0.5 transition-colors">
          {popoverOpen
            ? getCopy('filingReadiness.affordance.close', tier)
            : !result.isPathwaySpecified
              ? getCopy('filingReadiness.affordance.whyUnavailable', tier)
              : result.isFloored
                ? getCopy('filingReadiness.affordance.whyLow', tier)
                : getCopy('filingReadiness.affordance.viewDetail', tier)
          }
          <ChevronDown
            className={`h-2.5 w-2.5 transition-transform ${popoverOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </div>
      <span className="text-[10px] text-gray-500 leading-tight">
        {pathwayPrefix} {result.pathwayLabel}
      </span>
    </button>
  );

  // Surface 2 — escalation annotation banner
  const renderSurface2 = () => {
    if (!escalation) return null;
    const copyKey: CopyKey = escalation.toIsUnspecified
      ? 'filingReadiness.escalation.toUnspecified'
      : 'filingReadiness.escalation.standard';
    const dismissLabel = getCopy('filingReadiness.escalation.dismissLabel', tier);
    const template = getCopy(copyKey, tier);
    const message = template
      .split('{oldPathway}').join(escalation.fromLabel)
      .split('{newPathway}').join(escalation.toLabel);
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[11px] px-3 py-1.5 rounded inline-flex items-start gap-2 max-w-[520px]">
        <span className="flex-1 leading-snug">{message}</span>
        <button
          type="button"
          onClick={() => setEscalation(null)}
          className="opacity-60 hover:opacity-100 shrink-0"
          aria-label={dismissLabel}
        >
          <XIcon className="h-3 w-3" />
        </button>
      </div>
    );
  };

  // Surface 3 — floored-by diagnostic popover (only when isFloored)
  const renderSurface3Popover = () => {
    const headerText = getCopy('filingReadiness.blockerHeader', tier);
    const allDeferred = result.requirements.filter(r => r.status.kind === 'deferred');
    const criticalDeferred = allDeferred.filter(r => r.tier === 'critical');
    const supplementaryDeferred = allDeferred.filter(r => r.tier === 'supplementary');
    const footerTemplate = getCopy('filingReadiness.blockerFooter.deferredCount', tier);
    const footer = footerTemplate
      .replace('{nTotal}', String(allDeferred.length))
      .replace('{nCritical}', String(criticalDeferred.length))
      .replace('{nSupplementary}', String(supplementaryDeferred.length));
    return (
      <div className="absolute top-full mt-2 left-0 z-40 w-[460px] bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-[12px]">
        <p className="font-semibold text-gray-800 mb-2">{headerText}</p>
        <ul className="space-y-1.5">
          {result.flooredBy.map(req => (
            <li key={req.id} className="text-gray-700 leading-snug flex items-start gap-2">
              <span className="text-gray-400 mt-0.5 shrink-0">·</span>
              <span>{formatBlocker(req, tier)}</span>
            </li>
          ))}
        </ul>
        {allDeferred.length > 0 && (
          <p className="mt-3 pt-2 border-t border-gray-100 text-[11px] text-gray-500 italic">
            {footer}
          </p>
        )}
      </div>
    );
  };

  // Surface 4 — pathway-not-specified placeholder popover
  const renderSurface4Popover = () => {
    const text = getCopy(unavailableCopyKey(result.pathway), tier);
    return (
      <div className="absolute top-full mt-2 left-0 z-40 w-[460px] bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-[12px] text-gray-700 leading-relaxed">
        {text}
      </div>
    );
  };

  // Healthy-pathway popover (AF specified, not floored — score is honest weighted average)
  const renderHealthyPopover = () => (
    <div className="absolute top-full mt-2 left-0 z-40 w-[460px] bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-[12px] text-gray-700">
      <p className="font-semibold text-gray-800 mb-1">All critical-ingredient requirements at CALCULATED or higher</p>
      <p className="leading-relaxed">Filing Readiness is not floored. Score reflects the weighted average across all 16 documentation requirements for Acidified Foods.</p>
    </div>
  );

  // Popover dispatch
  const renderPopover = () => {
    if (!popoverOpen) return null;
    if (!result.isPathwaySpecified) return renderSurface4Popover();
    if (result.isFloored) return renderSurface3Popover();
    return renderHealthyPopover();
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="relative">
        {renderSurface1()}
        {renderPopover()}
      </div>
      {renderSurface2()}
    </div>
  );
}

export default FilingReadinessWidget;
