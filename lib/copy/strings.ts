// ============================================================
// Central bilingual copy catalog
// ------------------------------------------------------------
// Flat object keyed by string id. Every user-facing string in
// the new Phase 1 components comes from here.
//
// During rollout: 'pro' is filled; 'novice' is empty. Phase 5
// will populate the 'novice' column. getCopy() falls back to
// 'pro' when 'novice' is empty.
// ============================================================

import type { CopyCatalog } from './types';

export const STRINGS: CopyCatalog = {
  // ─── Determination Engine — classification titles ───
  'determination.cardLabel':              { pro: 'Determination Engine',                                                                      novice: '' },
  'determination.acid.title':             { pro: 'Acid Food (21 CFR 114.3(b)(1))',                                                            novice: '' },
  'determination.acidified.title':        { pro: 'Acidified Food (21 CFR 114)',                                                               novice: '' },
  'determination.acidifiedInProcess.title': { pro: 'Acidified — In Process (pH not yet ≤ 4.6)',                                              novice: '' },
  'determination.lacf.title':             { pro: 'Low-Acid Canned Food (21 CFR 113)',                                                         novice: '' },
  'determination.shelfStableDry.title':   { pro: 'Shelf-Stable (Dry, a_w ≤ 0.85)',                                                            novice: '' },
  'determination.undetermined.title':     { pro: 'Add pH / a_w / composition to classify',                                                    novice: '' },
  'determination.dietarySupplement.title':{ pro: 'DSHEA-Regulated Dietary Supplement (21 CFR 111)',                                           novice: '' },

  // ─── Determination Engine — reason text (plain-English) ───
  'determination.acid.reason':            { pro: 'Naturally pH ≤ 4.6 with < 5% low-acid components. No FDA Scheduled Process filing required — follow 21 CFR 117 Preventive Controls.',                                                novice: '' },
  'determination.acidified.reason':       { pro: 'pH ≤ 4.6 with ≥ 5% low-acid components flips this from Acid to Acidified per 21 CFR 114.3(b). Scheduled Process filing required before commercial production.',                       novice: '' },
  'determination.acidifiedInProcess.reason': { pro: 'Acidulant present and ≥ 10% low-acid base, but finished pH is still > 4.6. Add more acid until equilibrium pH ≤ 4.6 (target ≤ 4.2 for safety margin), then file as Acidified.',  novice: '' },
  'determination.lacf.reason':            { pro: 'pH > 4.6 and a_w > 0.85 with no acidification intent — the highest-risk FDA process category. Retort to commercial sterility (12D Clostridium botulinum inactivation) and file Scheduled Process.', novice: '' },
  'determination.shelfStableDry.reason':  { pro: 'Water activity ≤ 0.85 — moisture is too low to support microbial growth. No FDA Scheduled Process filing; follow 21 CFR 117 Preventive Controls + low-moisture-foods Salmonella program.',           novice: '' },
  'determination.undetermined.reason':    { pro: 'Insufficient spec data. Add ingredients with known pH and water-activity values, or run lab measurements, to determine the regulatory pathway.',                                       novice: '' },
  'determination.dietarySupplement.reason': { pro: 'Manufacture under 21 CFR 111 cGMP for dietary supplements. Acidified-foods and LACF logic do not apply; the relevant analyses are dosage safety (UL), stability/overage, NDI, and label claims.',  novice: '' },

  // ─── Determination Engine — filing line ───
  'determination.filing.acidified':       { pro: 'FDA Form 2541a + Process Authority sign-off',                                               novice: '' },
  'determination.filing.acidifiedInProcess': { pro: 'FDA Form 2541a + Process Authority sign-off (after pH is brought ≤ 4.6)',               novice: '' },
  'determination.filing.lacf':            { pro: 'FDA Form 2541a + Process Authority sign-off (LACF / Retort)',                               novice: '' },
  'determination.filing.acid':            { pro: 'None — GRAS / GMP only',                                                                    novice: '' },
  'determination.filing.shelfStableDry':  { pro: 'None — GRAS / GMP only',                                                                    novice: '' },
  'determination.filing.undetermined':    { pro: 'Pending classification',                                                                    novice: '' },
  'determination.filing.dietarySupplement': { pro: 'No Scheduled Process filing — 21 CFR 111 cGMP required',                                  novice: '' },

  // ─── Determination Engine — labels ───
  'determination.label.metrics':          { pro: 'Driving metrics',                                                                           novice: '' },
  'determination.label.filingRequired':   { pro: 'Filing required',                                                                           novice: '' },
  'determination.label.why':              { pro: 'Why',                                                                                       novice: '' },

  // ─── Advisory notice ───
  'advisory.processAuthority':            { pro: 'Advisory determination — requires Process Authority sign-off before commercial use.',      novice: '' },
  'advisory.processAuthority.linkLabel':  { pro: 'Find a Process Authority →',                                                                novice: '' },

  // ─── Finding popover (shared shell) ───
  'findings.label.suggestedFix':          { pro: 'Suggested fix',                                                                             novice: '' },
  'findings.label.citation':              { pro: 'Citation',                                                                                  novice: '' },
  'findings.empty':                       { pro: 'No findings on this ingredient.',                                                           novice: '' },

  // ─── Sticky status bar ───
  'statusBar.untitled':                   { pro: 'Untitled',                                                                                  novice: '' },
  'statusBar.filingReadiness':            { pro: 'Filing readiness',                                                                          novice: '' },
  'statusBar.issuesLabel':                { pro: 'Issues',                                                                                    novice: '' },
  'statusBar.criticalShort':              { pro: 'critical',                                                                                  novice: '' },
  'statusBar.warningsShort':              { pro: 'warnings',                                                                                  novice: '' },
  'statusBar.unknownShort':               { pro: 'unknown',                                                                                   novice: '' },
  'statusBar.noIssues':                   { pro: 'No active issues',                                                                          novice: '' },
};

export type CopyKey = keyof typeof STRINGS;
