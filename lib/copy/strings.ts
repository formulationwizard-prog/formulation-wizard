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
  // F&B-mode advisory copy (legacy default — applies to F&B mode and any
  // caller that does not pass `mode='supplements'`).
  'advisory.processAuthority':            { pro: 'Advisory determination — requires Process Authority sign-off before commercial use.',      novice: '' },
  'advisory.processAuthority.linkLabel':  { pro: 'Find a Process Authority →',                                                                novice: '' },
  // Supplement-mode advisory copy (Round 11 Phase 3 Workstream A.5 [2/N],
  // #25f closure). Same advisory firing pattern; mode-aware framing —
  // "qualified regulatory reviewer" instead of "Process Authority" since
  // supplements operate under DSHEA / 21 CFR 111 cGMP rather than F&B
  // Process Authority semantics (21 CFR 113.83 / 114.83).
  'advisory.processAuthority.supplements':            { pro: 'Advisory determination — requires qualified regulatory reviewer sign-off before commercial production.', novice: '' },
  'advisory.processAuthority.linkLabel.supplements':  { pro: 'Find a qualified reviewer →',                                                                              novice: '' },

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

  // ─── Filing Readiness (Round 9, 2026-05-09) ───
  // Pathway-aware distance to filing-ready state. Replaces the prior Phase-1
  // boolean heuristic. v1 wires up Acidified Foods (21 CFR 114) only; other
  // pathways render as Surface 4 placeholders. See docs/rounds/round-9-directive.md
  // and docs/design/filing-readiness.md for the full spec.
  'filingReadiness.widgetLabel':                  { pro: 'Filing Readiness',                                                                          novice: '' },
  'filingReadiness.pathwayPrefix':                { pro: 'for',                                                                                       novice: '' },
  'filingReadiness.tooltip':                      { pro: 'Pathway-aware distance to filing-ready state — measures how close your formulation is to having the documentation set your Process Authority needs to file under your specific regulatory pathway.', novice: '' },

  // Surface 2 — pathway escalation event annotation
  'filingReadiness.escalation.standard':          { pro: 'Pathway changed from {oldPathway} to {newPathway} — additional documentation required. Filing Readiness score recalculated against the new pathway requirements.', novice: '' },
  'filingReadiness.escalation.toUnspecified':     { pro: 'Pathway changed from {oldPathway} to {newPathway}. Filing Readiness for {newPathway} is not yet available — see Spec coverage on the Build tab for data completeness.', novice: '' },
  'filingReadiness.escalation.dismissLabel':      { pro: 'Dismiss',                                                                                   novice: '' },

  // Surface 3 — blocker-surfacing diagnostic
  'filingReadiness.blockerHeader':                { pro: 'Filing Readiness floored by',                                                              novice: '' },
  'filingReadiness.blocker.deferred':             { pro: '{label} (UNKNOWN — not yet capturable in this tool)',                                     novice: '' },
  'filingReadiness.blocker.wired.unknown':        { pro: '{label} (UNKNOWN — value not yet available)',                                             novice: '' },
  'filingReadiness.blocker.wired.inferred':       { pro: '{label} (INFERRED — derived from category defaults; verify ingredient values to upgrade)', novice: '' },
  'filingReadiness.blocker.wired.estimated':      { pro: '{label} (ESTIMATED — verify ingredient values to upgrade)',                               novice: '' },
  'filingReadiness.blocker.haccp.inferred':       { pro: '{label} (INFERRED — template-derived; verified PA-approved upload not yet supported)',    novice: '' },
  'filingReadiness.blocker.haccp.unknown':        { pro: '{label} (UNKNOWN — no HACCP category matched for this formulation)',                      novice: '' },
  'filingReadiness.blockerFooter.deferredCount':  { pro: '{nTotal} requirements pending workflow support ({nCritical} critical, {nSupplementary} supplementary)', novice: '' },

  // Surface 4 — pathway-not-specified placeholder copy (per pathway)
  'filingReadiness.unavailable.lacf':             { pro: 'Filing Readiness for Low-Acid Canned Foods is not yet available. Pathway-specific requirements specification (21 CFR 113) is queued for a future release. Use Spec coverage on the Build tab as a proxy for data completeness while pathway requirements are being defined.', novice: '' },
  'filingReadiness.unavailable.acidFood':         { pro: 'No scheduled-process filing required for Acid Foods under 21 CFR 114.3(b)(1). Pathway-specific requirements specification (reduced exemption set) is queued for a future release. Use Spec coverage on the Build tab for data completeness.', novice: '' },
  'filingReadiness.unavailable.shelfStableDry':   { pro: 'No scheduled-process filing required for shelf-stable foods (a_w ≤ 0.85). Pathway-specific requirements specification is queued for a future release. Use Spec coverage on the Build tab for data completeness.', novice: '' },
  'filingReadiness.unavailable.dietarySupplement': { pro: 'Filing Readiness for Dietary Supplement is not yet available. Pathway-specific requirements specification (21 CFR 111) is queued for a future release. Use Spec coverage on the Build tab as a proxy for data completeness while pathway requirements are being defined.', novice: '' },
  'filingReadiness.unavailable.fsisMeat':         { pro: 'Filing Readiness for FSIS Meat (9 CFR) is not yet available. Pathway-specific requirements specification is queued for a future release. Use Spec coverage on the Build tab for data completeness.', novice: '' },
  'filingReadiness.unavailable.pending':          { pro: 'Awaiting classification — add ingredients with verified specs to enable Filing Readiness.', novice: '' },
  'filingReadiness.unavailable.unclassified':     { pro: 'Awaiting classification — Filing Readiness appears once the Determination Engine resolves a pathway.', novice: '' },

  // Surface 1 — context-driven popover affordance text. Speaks to the user's
  // internal state ("why is this 2%?" / "why does it say —?") rather than
  // generic "click for details" framing. See Round 9 discoverability finding.
  'filingReadiness.affordance.whyLow':            { pro: 'Why is this low?',                                                                          novice: '' },
  'filingReadiness.affordance.whyUnavailable':    { pro: 'Why is this unavailable?',                                                                  novice: '' },
  'filingReadiness.affordance.viewDetail':        { pro: 'View detail',                                                                               novice: '' },
  'filingReadiness.affordance.close':             { pro: 'Close',                                                                                     novice: '' },
};

export type CopyKey = keyof typeof STRINGS;
