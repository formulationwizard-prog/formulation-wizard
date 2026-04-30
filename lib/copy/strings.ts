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
  // ─── Determination Engine — classification titles (hedged) ───
  // Form numbers per current FDA.gov guidance: 2541e (acidified), 2541d/f/g (LACF
  // method-dependent), 2541 (FCE registration). Forms 2541a and 2541c are obsolete.
  'determination.cardLabel':              { pro: 'Determination Engine',                                                                      novice: '' },
  'determination.acid.title':             { pro: 'Likely Acid Food (assessment based on available data) — 21 CFR 114.3(b)(1)',                novice: '' },
  'determination.acidified.title':        { pro: 'Likely Acidified Food (assessment based on available data) — 21 CFR 114',                   novice: '' },
  'determination.acidifiedInProcess.title': { pro: 'Likely Acidified Food — In Process (assessment based on available data; pH not yet ≤ 4.6)', novice: '' },
  'determination.lacf.title':             { pro: 'Likely Low-Acid Canned Food (assessment based on available data) — 21 CFR 113',             novice: '' },
  'determination.shelfStableDry.title':   { pro: 'Likely Shelf-Stable by Low Water Activity (assessment based on available data) — a_w ≤ 0.85', novice: '' },
  'determination.undetermined.title':     { pro: 'Add pH / a_w / composition to classify',                                                    novice: '' },
  'determination.insufficientData.title': { pro: 'Insufficient Verified Data to Classify',                                                    novice: '' },
  'determination.dietarySupplement.title':{ pro: 'DSHEA-Regulated Dietary Supplement (21 CFR 111)',                                           novice: '' },

  // ─── Determination Engine — reason text (plain-English, hedged) ───
  'determination.acid.reason':            { pro: 'Naturally pH ≤ 4.6 with < 5% low-acid components. No FDA scheduled-process filing appears to apply based on available data — confirm with Process Authority. Acid foods (per 21 CFR 114.3(b)(1)) are not subject to 21 CFR 113 or 114 process filing requirements. Follow 21 CFR 117 Preventive Controls.', novice: '' },
  'determination.acidified.reason':       { pro: 'pH ≤ 4.6 with ≥ 5% low-acid components flips this from Acid to Acidified per 21 CFR 114.3(b). Form FDA 2541e likely required (Process Filing for Acidified Method) — confirm with Process Authority before commercial production. Facility must also be registered using Form FDA 2541 (Food Canning Establishment Registration).', novice: '' },
  'determination.acidifiedInProcess.reason': { pro: 'Acidulant present and ≥ 10% low-acid base, but finished pH is still > 4.6. Add more acid until equilibrium pH ≤ 4.6 (target ≤ 4.2 for safety margin), then file as Acidified. Form FDA 2541e likely required (Process Filing for Acidified Method) — confirm with Process Authority. Facility must also be registered using Form FDA 2541 (Food Canning Establishment Registration).', novice: '' },
  'determination.lacf.reason':            { pro: 'pH > 4.6 and a_w > 0.85 with no acidification intent — the highest-risk FDA process category. Typically requires retort to commercial sterility (12D Clostridium botulinum inactivation). LACF process filing likely required — Form FDA 2541d (retort), 2541f (water activity/formulation), or 2541g (aseptic) depending on processing method. Confirm appropriate form with Process Authority. Facility must also be registered using Form FDA 2541 (Food Canning Establishment Registration).', novice: '' },
  'determination.shelfStableDry.reason':  { pro: 'Water activity ≤ 0.85 — moisture is too low to support microbial growth. No FDA scheduled-process filing appears to apply based on available data — confirm with Process Authority. Foods with water activity at or below 0.85 are excluded from 21 CFR 113 and 114 (per the regulations\' scope). Follow 21 CFR 117 Preventive Controls + low-moisture-foods Salmonella program.', novice: '' },
  'determination.undetermined.reason':    { pro: 'Insufficient spec data. Add ingredients with known pH and water-activity values, or run lab measurements, to determine the regulatory pathway.', novice: '' },
  'determination.insufficientData.reason': { pro: 'Insufficient verified data to compute regulatory classification. Add lab-verified or supplier-COA values for the unverified ingredients to receive a classification. Until then, this formulation cannot be classified per 21 CFR 113/114.', novice: '' },
  'determination.dietarySupplement.reason': { pro: 'Manufacture under 21 CFR 111 cGMP for dietary supplements. Acidified-foods and LACF logic do not apply; the relevant analyses are dosage safety (UL), stability/overage, NDI, and label claims.', novice: '' },

  // ─── Determination Engine — filing line (hedged, FDA-current form numbers) ───
  'determination.filing.acidified':       { pro: 'FDA Form 2541e likely required — confirm with Process Authority',                           novice: '' },
  'determination.filing.acidifiedInProcess': { pro: 'FDA Form 2541e likely required — confirm with Process Authority (after pH is brought ≤ 4.6)', novice: '' },
  'determination.filing.lacf':            { pro: 'FDA Form 2541d, 2541f, or 2541g likely required (method-dependent) — confirm with Process Authority', novice: '' },
  'determination.filing.acid':            { pro: 'No FDA scheduled-process filing appears to apply based on available data — confirm with Process Authority', novice: '' },
  'determination.filing.shelfStableDry':  { pro: 'No FDA scheduled-process filing appears to apply based on available data — confirm with Process Authority', novice: '' },
  'determination.filing.undetermined':    { pro: 'Pending classification',                                                                    novice: '' },
  'determination.filing.insufficientData': { pro: 'Pending verified data — confirm with Process Authority',                                   novice: '' },
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
