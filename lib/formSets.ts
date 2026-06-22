// ============================================================================
// Tier-3 force-pick disambiguation registry — C1 form-set session (2026-06-22).
//
// A declared ambiguous BARE term ("Selenium", "DHA", "Iodine", …) escalates to
// a FORCE-PICK form chooser — no default — so the operator selects the specific
// form. The resolver (lib/parseFormula.ts findBestMatchWithTier) checks this
// registry on an EXACT normalized-name match BEFORE form-specific resolution:
//   "Selenium"            → force-pick (this registry)
//   "L-Selenomethionine"  → resolves directly to the form (Tier-1, no friction)
// Exact-match on the normalized key, never substring, so "Selenium-enriched
// yeast" ("selenium enriched yeast") does NOT force-pick.
//
// Safe-by-construction (doctrine #12): the force-pick itself is the safety; each
// marker ships a GENERIC honest string now. Co-founder/PA-ratified PRECISION
// strings (exact mollusk wording, fish species sub-set, kelp triple-marker) and
// elemental-factor values ratchet into the `precision` field later WITHOUT
// re-touching the engine — a precision-pending item never blocks the ship.
//
// Provenance: docs/catalog/curation-regroup-agenda-2026-06-18.md §C1 (RATIFIED).
// Scope:      docs/architecture/tier3-disambiguation-engine-scope-2026-06-22.md.
// ============================================================================

export type FormMarkerKind =
  | 'allergen'                // FALCPA / dual-jurisdiction allergen
  | 'elementalFactorPending'  // B1/PA — %DV renders PENDING until form factor lands
  | 'coaRequired'             // supplier-variable; requires COA
  | 'therapeuticWindow'       // doctrine #11 — narrow RDA→UL, over-dose risk
  | 'licensing'               // proprietary form, B2B-licensing-gated
  | 'infoFlag';               // non-harm operator-visible note (vegan/corn/yeast/nitrate)

export interface FormMarker {
  kind: FormMarkerKind;
  /** Generic honest string — ships with ZERO sign-off (safe-by-construction). */
  generic: string;
  /** Co-founder/PA-ratified precise string; falls back to `generic` until set. */
  precision?: string;
}

/** A sub-selection forced by a form (e.g. fish-oil → species, FALCPA-required). */
export interface FormSubPick {
  label: string;
  options: string[];
  /** "Other (specify)" → COA-attested escape hatch for uncommon entries. */
  otherAllowed: boolean;
}

export interface FormOption {
  id: string;
  label: string;
  markers: FormMarker[];
  subPick?: FormSubPick;
  /** Proprietary form routed through the licensing queue, never catalog-verified. */
  licensingGated?: boolean;
}

export interface FormSet {
  /** Primary normalized bare term. */
  term: string;
  /** Other normalized keys that resolve to this set. */
  aliases?: string[];
  /** C1 ratified ALL as force-pick → always null (no silent default). */
  default: null;
  forms: FormOption[];
  /** Multi-Strain: route to structured per-strain capture, NOT a form chooser. */
  structuredCapture?: boolean;
  structuredCaptureReason?: string;
}

const m = (kind: FormMarkerKind, generic: string): FormMarker => ({ kind, generic });
const PENDING_DV = m('elementalFactorPending', '%DV pending — form-specific factor required (not computed)');
const COA_POTENCY = m('coaRequired', 'active content per gram is supplier-variable — requires COA');

// ── the 7 ratified C1 form-sets ─────────────────────────────────────────────
const FORM_SETS: FormSet[] = [
  {
    term: 'selenium', default: null,
    forms: [
      { id: 'se-selenomethionine', label: 'L-Selenomethionine', markers: [PENDING_DV] },
      { id: 'se-yeast', label: 'Selenized yeast (Se-enriched)', markers: [m('coaRequired', 'supplier-variable Se% — requires COA; no fixed factor'), m('infoFlag', 'yeast-derived')] },
      { id: 'se-selenite', label: 'Sodium selenite', markers: [PENDING_DV] },
      { id: 'se-selenocysteine', label: 'Selenocysteine', markers: [PENDING_DV] },
      { id: 'se-selenate', label: 'Sodium selenate', markers: [PENDING_DV] },
    ],
  },
  {
    term: 'iodine', default: null,
    forms: [
      { id: 'i-ki', label: 'Potassium iodide (KI)', markers: [PENDING_DV] },
      { id: 'i-kio3', label: 'Potassium iodate (KIO₃)', markers: [PENDING_DV] },
      { id: 'i-nai', label: 'Sodium iodide (NaI)', markers: [PENDING_DV] },
      { id: 'i-kelp', label: 'Kelp (iodine source)', markers: [
        m('coaRequired', 'supplier-variable iodine — requires COA; can span an order of magnitude per gram'),
        m('infoFlag', 'arsenic (As) vector — kelp/seaweed; see heavy-metals'),
        m('therapeuticWindow', 'narrow window (RDA 150 vs UL 1100 mcg) — over-dose is the live risk; verify dose'),
      ] },
    ],
    // Molecular iodine (I₂) DEFERRED post-launch (agenda §C1) — not offered here.
  },
  {
    term: 'dha', aliases: ['epa', 'omega 3', 'omega3', 'epa dha', 'epadha', 'fish oil omega 3'], default: null,
    forms: [
      { id: 'o3-algal', label: 'Algal (Schizochytrium / Crypthecodinium)', markers: [m('infoFlag', 'allergen-free, vegan'), COA_POTENCY] },
      { id: 'o3-fish', label: 'Fish oil', markers: [m('allergen', 'Fish (FALCPA) — species declaration required'), COA_POTENCY],
        subPick: { label: 'Fish species (FALCPA requires the species, not "Fish")', options: ['Anchovy', 'Sardine', 'Mackerel', 'Herring', 'Salmon', 'Tuna'], otherAllowed: true } },
      { id: 'o3-krill', label: 'Krill oil', markers: [m('allergen', 'Crustacean shellfish (FALCPA)'), COA_POTENCY] },
      { id: 'o3-calamari', label: 'Calamari (squid) oil', markers: [m('allergen', 'Mollusk — verify jurisdiction (US non-major-9; EU/Codex allergen)'), COA_POTENCY] },
    ],
  },
  {
    term: 'multi strain', aliases: ['probiotic blend', 'probiotic', 'multistrain', 'probiotic multi strain'], default: null,
    forms: [],
    structuredCapture: true,
    structuredCaptureReason: 'a probiotic blend needs per-strain capture (genus · species · strain-ID · CFU · CFU-basis · storage · media-allergen) — not a single catalog entry',
  },
  {
    term: 'vitamin d', aliases: ['vit d'], default: null,
    forms: [
      { id: 'd-d2', label: 'D2 (ergocalciferol)', markers: [m('infoFlag', 'vegan, lanolin-free')] },
      { id: 'd-d3', label: 'D3 (cholecalciferol)', markers: [m('infoFlag', 'typically lanolin/wool-derived — vegan-flag, not FALCPA')] },
      { id: 'd-d3-lichen', label: 'D3 (lichen-derived)', markers: [m('infoFlag', 'vegan D3')] },
    ],
  },
  {
    term: 'vitamin c', aliases: ['vit c', 'ascorbate'], default: null,
    forms: [
      { id: 'c-ascorbic', label: 'Ascorbic acid', markers: [m('infoFlag', 'typically corn-derived — info-flag, not FALCPA')] },
      { id: 'c-sodium', label: 'Sodium ascorbate', markers: [m('infoFlag', 'sodium content — affects low-sodium claims + NFP sodium'), PENDING_DV] },
      { id: 'c-calcium', label: 'Calcium ascorbate', markers: [m('infoFlag', 'calcium content — interacts with Ca %DV + UL'), PENDING_DV] },
      { id: 'c-ester', label: 'Ester-C', markers: [m('licensing', 'proprietary — routed through licensing queue')], licensingGated: true },
      { id: 'c-mixed', label: 'Mixed mineral ascorbates', markers: [PENDING_DV] },
    ],
  },
  {
    term: 'vitamin e', aliases: ['vit e', 'tocopherol'], default: null,
    forms: [
      { id: 'e-dl-alpha', label: 'dl-alpha tocopherol (synthetic)', markers: [m('elementalFactorPending', 'synthetic, ~50% bioactive; IU→mg conversion pending (1 IU ≈ 0.9 mg)')] },
      { id: 'e-d-alpha', label: 'd-alpha tocopherol (natural)', markers: [m('elementalFactorPending', 'natural, 100% bioactive; IU→mg conversion pending (1 IU ≈ 0.67 mg)')] },
      { id: 'e-mixed', label: 'Mixed tocopherols', markers: [PENDING_DV] },
      { id: 'e-tocotrienols', label: 'Tocotrienols', markers: [PENDING_DV] },
      { id: 'e-esters', label: 'Tocopheryl acetate / succinate', markers: [PENDING_DV] },
    ],
  },
  {
    term: 'vitamin b6', aliases: ['vit b6', 'b6'], default: null,
    forms: [
      { id: 'b6-pyridoxine', label: 'Pyridoxine HCl', markers: [m('elementalFactorPending', 'elemental B6 conversion pending')] },
      { id: 'b6-p5p', label: 'P5P (pyridoxal-5-phosphate)', markers: [m('infoFlag', 'active form'), m('elementalFactorPending', 'conversion pending')] },
    ],
  },
  {
    term: 'ashwagandha', default: null,
    forms: [
      { id: 'ash-ksm66', label: 'KSM-66', markers: [m('licensing', 'proprietary — routed through licensing queue')], licensingGated: true },
      { id: 'ash-sensoril', label: 'Sensoril', markers: [m('licensing', 'proprietary — routed through licensing queue')], licensingGated: true },
      { id: 'ash-root-extract', label: 'Root extract (generic)', markers: [m('coaRequired', 'withanolide % supplier-variable — requires COA')] },
      { id: 'ash-root-powder', label: 'Root powder (generic)', markers: [m('coaRequired', 'withanolide % supplier-variable — requires COA')] },
      { id: 'ash-leaf-root', label: 'Leaf + root', markers: [m('coaRequired', 'withanolide % supplier-variable — requires COA'), m('infoFlag', 'leaf inclusion — verify market acceptance')] },
    ],
  },
];

const BY_TERM = new Map<string, FormSet>();
for (const fs of FORM_SETS) {
  BY_TERM.set(fs.term, fs);
  for (const a of fs.aliases ?? []) BY_TERM.set(a, fs);
}

/**
 * Look up a force-pick form-set by an ALREADY-NORMALIZED bare term. The caller
 * (findBestMatchWithTier) passes `normalizeIngredientName(name)` — exact match
 * only, so "selenium" force-picks and "l selenomethionine" does not. Returns
 * null for non-ambiguous terms (resolver continues to normal tier matching).
 */
export function lookupFormSet(normalizedName: string): FormSet | null {
  if (!normalizedName) return null;
  return BY_TERM.get(normalizedName) ?? null;
}

/** The honest string for a marker — precision if ratified, else the safe generic. */
export function markerText(mk: FormMarker): string {
  return mk.precision ?? mk.generic;
}

/** Tier-3 reason text surfaced in the workspace amber "⚠ Confirm match" dialog. */
export function forcePickReason(fs: FormSet): string {
  if (fs.structuredCapture) return fs.structuredCaptureReason ?? `${fs.term}: capture each component`;
  return `multiple forms with different profiles — select one: ${fs.forms.map(f => f.label).join(' / ')}`;
}
