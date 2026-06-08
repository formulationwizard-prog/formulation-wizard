// ============================================================
// RA-REVIEW PACKET (#18) — reviewer sign-off bundle (Dr. Carter persona).
// ------------------------------------------------------------
// Aggregates the verified compliance surfaces (#1–#10) into ONE reviewer-ready
// packet: each surface → a section with verdict + citation + sign-off flag. Pure
// composition of PRE-COMPUTED verdicts — the caller computes each surface (the same
// functions the workspace already runs), this assembles them. The engine assembles;
// the qualified reviewer signs. Honest-engine: every section carries its authority,
// and the packet ends with the educational-not-legal-advice disclaimer.
//
// August MVP (Decision 1). Authority-anchor §8 / spec artifact #18 (aggregation of #1–#10).
// ============================================================
import type { SafetyFinding } from './supplementSafetyLimits';
import { summarizeFindings } from './supplementSafetyLimits';
import type { NDISummary } from './supplementNDI';
import type { AllergenMatch, AllergenGateResult } from './supplementAllergen';
import { generateContainsStatement } from './supplementAllergen';
import type { DiseaseClaimGateResult } from './supplementClaims';
import type { OverageSummary } from './supplementStability';
import type { ProducibilityAssessment } from './servingModel';
import type { FilingRequirement } from './scheduledProcess';

/** Section verdict — ordered by severity. */
export type RAVerdict = 'cleared' | 'advisory' | 'attention' | 'hard-stop';

export interface RAReviewSection {
  id: string;
  title: string;
  /** Governing authority / citation family for the section. */
  authority: string;
  verdict: RAVerdict;
  /** Plain-English one-liner for the reviewer. */
  summary: string;
  /** Specific citations gathered from the underlying findings. */
  citations: string[];
  /** True when a qualified reviewer must actively sign off (attention/hard-stop), */
  needsReviewerSignoff: boolean;
}

export interface RAReviewPacket {
  formulaName: string;
  productClass: string;
  sections: RAReviewSection[];
  /** 'has-hard-stops' if any section is hard-stop; else 'ready-for-review'. */
  overallState: 'ready-for-review' | 'has-hard-stops';
  hardStopCount: number;
  attentionCount: number;
  disclaimer: string;
}

export interface RAReviewPacketInput {
  formulaName: string;
  productClass: string;
  safetyFindings: SafetyFinding[];
  ndiSummary: NDISummary;
  allergenMatches: readonly AllergenMatch[];
  allergenGate: AllergenGateResult;
  diseaseClaimGate: DiseaseClaimGateResult;
  overageSummary: OverageSummary;
  producibility: ProducibilityAssessment;
  determination: FilingRequirement;
}

const RA_DISCLAIMER =
  'This packet aggregates the platform analysis for qualified-reviewer sign-off. It is for general ' +
  'educational purposes and is not legal or definitive regulatory advice. A qualified regulatory reviewer ' +
  '(DSHEA-qualified consultant or 21 CFR 111-trained quality unit) must verify and sign off before commercial production.';

const dedupe = (xs: (string | undefined | null)[]): string[] => [...new Set(xs.filter((x): x is string => !!x))];

function safetySection(findings: SafetyFinding[]): RAReviewSection {
  const s = summarizeFindings(findings);
  let verdict: RAVerdict = 'cleared';
  let summary = 'All doses within safe ranges; no banned ingredients.';
  if (s.banned > 0 || s.critical > 0) { verdict = 'hard-stop'; summary = `${s.banned} banned + ${s.critical} critical (>150% UL) finding(s) — must resolve.`; }
  else if (s.warning > 0) { verdict = 'attention'; summary = `${s.warning} ingredient(s) over 100% UL — reduce dose or document justification.`; }
  else if (s.caution > 0) { verdict = 'advisory'; summary = `${s.caution} ingredient(s) approaching UL or carrying a per-nutrient caution (e.g. B6 neuropathy).`; }
  return { id: 'safety', title: 'Dosage / UL Safety', authority: 'IOM ULs (NIH ODS) / FDA / DSHEA', verdict, summary, citations: dedupe(findings.map(f => f.citation)), needsReviewerSignoff: verdict !== 'cleared' };
}

function ndiSection(n: NDISummary): RAReviewSection {
  let verdict: RAVerdict = 'cleared';
  let summary = `${n.grandfathered} grandfathered, ${n.notified} notified, ${n.grasFood} GRAS — no NDI filing flagged.`;
  if (n.required > 0) { verdict = 'attention'; summary = `${n.required} ingredient(s) flagged POST-1994 with no known accepted NDI — 75-day notification may be required (highest industry compliance risk).`; }
  else if (n.unknown > 0) { verdict = 'advisory'; summary = `${n.unknown} ingredient(s) not in the NDI reference table — verify status independently.`; }
  return { id: 'ndi', title: 'NDI Compliance', authority: 'DSHEA §8 / 21 U.S.C. 350b / 21 CFR 190.6', verdict, summary, citations: ['21 U.S.C. 350b', '21 CFR 190.6'], needsReviewerSignoff: verdict !== 'cleared' };
}

function allergenSection(matches: readonly AllergenMatch[], gate: AllergenGateResult): RAReviewSection {
  if (gate.hardStop) {
    return { id: 'allergen', title: 'Allergen Disclosure (FALCPA/FASTER)', authority: '21 U.S.C. 321(qq) / 21 CFR 101.36(b)(1)(i)(B)', verdict: 'hard-stop', summary: gate.reason, citations: dedupe(gate.evidence.map(e => e.citation)), needsReviewerSignoff: true };
  }
  const contains = generateContainsStatement(matches);
  const summary = contains ? `${contains} Auto-detected; supplier COA must confirm or deny cross-contact.` : 'No major allergens auto-detected; supplier COA must confirm cross-contact status.';
  return { id: 'allergen', title: 'Allergen Disclosure (FALCPA/FASTER)', authority: '21 U.S.C. 321(qq) / 21 CFR 101.36(b)(1)(i)(B)', verdict: 'advisory', summary, citations: ['21 U.S.C. 321(qq)(1)', '21 CFR 101.36(b)(1)(i)(B)'], needsReviewerSignoff: false };
}

function claimsSection(gate: DiseaseClaimGateResult): RAReviewSection {
  if (gate.hardStop) {
    return { id: 'claims', title: 'Claims (DSHEA structure/function)', authority: '21 CFR 101.93 / FDCA §201(g)(1)(C)', verdict: 'hard-stop', summary: gate.reason, citations: dedupe(gate.evidence.map(e => e.citation)), needsReviewerSignoff: true };
  }
  return { id: 'claims', title: 'Claims (DSHEA structure/function)', authority: '21 CFR 101.93 / 101.54', verdict: 'cleared', summary: 'No disease/drug-claim language detected. DSHEA disclaimer required on any structure/function claim (101.93(c)).', citations: ['21 CFR 101.93(c)', '21 CFR 101.93(g)'], needsReviewerSignoff: false };
}

function stabilitySection(o: OverageSummary): RAReviewSection {
  if (!o.bottleneck) {
    return { id: 'stability', title: 'Stability / Overage', authority: '21 CFR 101.36(f) → 101.9(g) / USP <1150>', verdict: 'cleared', summary: 'No degradation-sensitive actives requiring overage.', citations: ['21 CFR 101.36(f)', '21 CFR 101.9(g)'], needsReviewerSignoff: false };
  }
  return { id: 'stability', title: 'Stability / Overage', authority: '21 CFR 101.36(f) → 101.9(g) / USP <1150>', verdict: 'advisory', summary: `Bottleneck: ${o.bottleneck.ingredientName} (~${o.worstLossPct.toFixed(0)}% loss) — formulate-at ${o.bottleneck.requiredFormulateAtMg.toFixed(0)} mg to hold the label claim through expiry. Estimate; confirm with a real stability study.`, citations: ['21 CFR 101.36(f)', '21 CFR 101.9(g)', 'USP <1150>'], needsReviewerSignoff: false };
}

function producibilitySection(p: ProducibilityAssessment): RAReviewSection {
  const verdict: RAVerdict = p.state === 'over-fill' ? 'attention' : p.state === 'producible' ? 'cleared' : 'advisory';
  return { id: 'producibility', title: 'Producibility (capsule fit)', authority: 'USP <905> / <2040> (manufacturability)', verdict, summary: p.reason, citations: ['USP <905>'], needsReviewerSignoff: verdict === 'attention' };
}

function determinationSection(d: FilingRequirement): RAReviewSection {
  return { id: 'determination', title: 'Determination / cGMP', authority: '21 CFR 111 (Dietary Supplement cGMP)', verdict: 'advisory', summary: `${d.formName}. ${d.required ? 'Filing required.' : 'No Scheduled Process filing — 21 CFR 111 cGMP framework.'} Qualified-reviewer sign-off recommended before production.`, citations: d.citations, needsReviewerSignoff: true };
}

/**
 * Compose the RA-review packet from pre-computed surface verdicts. Pure function.
 */
export function buildRAReviewPacket(input: RAReviewPacketInput): RAReviewPacket {
  const sections: RAReviewSection[] = [
    safetySection(input.safetyFindings),
    ndiSection(input.ndiSummary),
    allergenSection(input.allergenMatches, input.allergenGate),
    claimsSection(input.diseaseClaimGate),
    stabilitySection(input.overageSummary),
    producibilitySection(input.producibility),
    determinationSection(input.determination),
  ];
  const hardStopCount = sections.filter(s => s.verdict === 'hard-stop').length;
  const attentionCount = sections.filter(s => s.verdict === 'attention').length;
  return {
    formulaName: input.formulaName,
    productClass: input.productClass,
    sections,
    overallState: hardStopCount > 0 ? 'has-hard-stops' : 'ready-for-review',
    hardStopCount,
    attentionCount,
    disclaimer: RA_DISCLAIMER,
  };
}
