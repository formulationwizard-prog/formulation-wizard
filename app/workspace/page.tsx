'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  Ban,
  OctagonX,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X as XIcon,
} from 'lucide-react';
import type {
  Ingredient,
  Nutrition,
  SavedFormulation,
  FoodResult,
  IndustrialIngredient,
  IngredientSourceData,
  PackagingItem,
} from '@/types';
import {
  UNIT_TO_GRAMS,
  emptyNutrition,
  isIndustrial,
  fdaRoundCalories,
  fdaRoundFat,
  fdaRoundCholesterol,
  fdaRoundSodium,
  fdaRoundGrams,
  fdaRoundVitaminD,
  fdaRoundIron,
  fdaRoundPotassium,
  fdaRoundCalcium,
  fdaRoundPercentDVMacros,
  fdaRoundPercentDVMicros,
} from '@/lib/utils';
import { extractNeckCode, isClosureCompatible, needsExternalClosure } from '@/lib/data/packaging';
import { parsePastedFormula, lookupDensity, VOLUME_UNITS, VOLUME_TO_ML, rankIngredientMatch, type ParsedRow } from '@/lib/parseFormula';
import { estimateSpecs, getSpec, mapSpecToConfidence, rangedSpec, costRangedSpec, mapCostToConfidence, formatRangedValue, rollupCostConfidence, worstConfidence, type SpecMetric } from '@/lib/foodScience';
import { getTrackedSpecDefaults, TRACKED_SPEC_LABELS, TRACKED_SPEC_ORDER, type TrackedSpec } from '@/lib/trackedSpecs';
import { ConfidencePill } from '@/components/ConfidencePill';
import { getSustainabilityProfile, computeFormulationSustainability, computeOrganicCompliance, convertIngredientToOrganic, upgradeToOrganicTier, convertIngredientToConventional, revertAllToConventional, type OrganicClaimTier } from '@/lib/sustainability';
import { validateClaim, suggestAvailableClaims } from '@/lib/nutritionClaims';
import { buildIngredientStatement } from '@/lib/ingredientStatement';
import { getPackagingSustainability } from '@/lib/packagingSustainability';
import { CERT_LABELS, getSupplierInfo } from '@/lib/data/suppliers';
import type { Confidence, SustainabilityCert, LeadTimeBucket, SupplierQualification, SupplierDocType, ProductClass } from '@/types';
import { PRODUCT_CLASS_LABEL } from '@/types';
import { DOC_TYPE_LABELS, DOC_TYPE_ICONS, getQualificationStatus, loadQualifications, saveQualifications, summarizeQualifications } from '@/lib/supplierQualifications';
import { generatePartNumber } from '@/lib/partNumber';
import { detectAllergensDetailed, evaluateAllergenGate, type AllergenMatch } from '@/lib/supplementAllergen';

/**
 * Adapter — extracts species-or-category strings from rich AllergenMatch[]
 * for backward compat with the workspace's legacy string[] storage shape
 * on Ingredient.allergens. Prefer species (e.g., "Coconut") over category
 * (e.g., "Tree Nuts") when both available — per FALCPA §403(w)(1)(B)
 * species-naming requirement. Dedupes via Set.
 *
 * Per [[catalog-must-be-coa-spec-sheet-anchored]] doctrine 2026-05-25 +
 * launch-blocker 1B wire-up — when this adapter detects "Coconut" (Tree
 * Nuts species), the workspace now renders "Contains: Coconut" instead
 * of the legacy "Contains: Tree Nuts" (FALCPA species-naming compliance).
 *
 * FALCPA §203(b)(2) highly-refined-oil exemption logic is separate
 * (launch-blocker #5) — applied at the catalog-data layer (falcpaExemptionStatus
 * field per [[falcpa-highly-refined-oil-exemption]]) before this adapter runs.
 * This adapter trusts whatever matches detectAllergensDetailed produces from
 * the input text.
 */
const detectAllergenStrings = (text: string): string[] => {
  const matches: AllergenMatch[] = detectAllergensDetailed(text);
  const entries = matches.map(m => m.species ?? m.category);
  return [...new Set(entries)];
};
import { getIngredientPartNumber, getPackagingPartNumber, getCustomPackagingPartNumber } from '@/lib/skuCodes';
import { NautilusMark } from '@/components/NautilusMark';
import { DeterminationEngineCard } from '@/components/DeterminationEngineCard';
import { FindingPopover, type InlineFinding, type FindingTier } from '@/components/FindingPopover';
import { getCopy } from '@/lib/copy';
import { useTier } from '@/lib/hooks/useTier';
import { PROCESS_AUTHORITIES, PA_TYPE_LABELS, getPAStates, type ProcessAuthorityType } from '@/lib/data/processAuthorities';
import { DEFAULT_TEMPLATE } from '@/lib/processTemplates';
import { MODES, MODE_ORDER, productClassesForMode, type ModeId } from '@/lib/modes';
import { checkCompliance, formatAmount, type ComplianceFinding } from '@/lib/regulatoryLimits';
import { evaluateBucketA } from '@/lib/bucketAGate';
import { isHardStop } from '@/lib/hardStop';
import { suggestHaccpCategory, detectSpecTagMismatch } from '@/lib/haccp';
import { determineFilingRequirement, defaultQaTestsForCategory, PROCESS_METHODS, type QaTest } from '@/lib/scheduledProcess';
import { computeFilingReadiness } from '@/lib/filingReadiness';
import { FilingReadinessWidget } from '@/components/FilingReadinessWidget';
import { buildSupplementFacts, formatSupplementAmount, formatSupplementDV } from '@/lib/supplementLabeling';
import { checkSupplementSafety, summarizeFindings, type Audience as SupplementAudience } from '@/lib/supplementSafetyLimits';
import { computePerServingScale } from '@/lib/supplementMath';
import { validateServingSizeInput } from '@/lib/servingSize';
import { formatMassDisplay } from '@/lib/formatMass';
import { computeOverages, formatDose, CATEGORY_LABEL, type StorageCondition } from '@/lib/supplementStability';
import { detectNutrientContentClaims, detectStructureFunctionClaims, analyzeDraftClaim, buildDisclaimers } from '@/lib/supplementClaims';
import { selectSupplementDisclaimer } from '@/lib/supplementDisclaimer';
import {
  type SupplementDeliveryForm,
  type CapsuleSize,
  type LastEditedCountField,
  categorizeDeliveryForm,
  perUnitWeightSemantics,
  capsuleCapacityMg,
  utilizationBand,
  deriveTotalUnits,
  reconcileCountInputs,
  allowedServingUnits,
  allowedPackageUnits,
  assessProducibility,
  type ProducibilityState,
} from '@/lib/servingModel';
import { checkCompatibility, summarizeCompatibility } from '@/lib/supplementCompatibility';
import { analyzeNDI } from '@/lib/supplementNDI';
import { analyzeRetailFit } from '@/lib/supplementRetailFit';
import {
  SUPP_TOS_WELCOME_SUBTITLE,
  SUPP_TOS_WARNING_HEADING,
  SUPP_TOS_WARNING_BODY,
  SUPP_TOS_V1_SECTIONS,
  SUPP_TOS_ACKNOWLEDGMENT_BUTTON,
} from '@/lib/supplementTos';
import {
  type WorkspaceEntryState,
  hydrateWorkspaceEntryState,
  persistMode,
  persistTosAcceptance,
  revokeTosAcceptance,
  determineEntryScreen,
  checkModeChange,
  isWorkspaceMode,
} from '@/lib/workspaceMode';

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function FormulationWizard() {
  // Copy tier (Phase 1: hardcoded 'pro'; Phase 5 will wire to user prefs).
  const tier = useTier();

  // ----- Mode (vertical) --------------------------------------------------
  const [mode, setMode] = useState<ModeId>('fb');
  const mc = MODES[mode]; // Active mode configuration
  // Local aliases so the rest of the component can keep using familiar names;
  // these re-compute automatically when the user switches mode.
  const INDUSTRIAL_DB = mc.ingredientDB;
  const PACKAGING_DB = mc.packagingDB;
  const PRODUCT_TYPES = mc.productTypes;
  // Narrowed dropdown list (Round 2 — F&B v1 buckets); falls back to the full
  // productTypes list for modes that don't override (e.g., supplements). Doesn't
  // depend on the productType state, so safe to derive at the top of the component.
  const DROPDOWN_PRODUCT_TYPES = mc.dropdownProductTypes ?? mc.productTypes;
  const CATEGORIES = mc.categories;

  const [ingredientsRaw, setIngredientsRaw] = useState<Ingredient[]>([]);

  // Always re-resolve industrial-DB-backed ingredients against the CURRENT DB.
  // Otherwise, fields added to the DB after an ingredient was saved (like the
  // new `potencyFactor` for carrier-loaded vitamins) wouldn't propagate into
  // existing formulas — the user would have to re-add every ingredient. By
  // merging fresh DB data on every render, DB improvements reach live formulas
  // immediately. Falls back to the stored snapshot when no match is found.
  const ingredients: Ingredient[] = ingredientsRaw.map(ing => {
    if (ing.foodData?.type !== 'industrial') return ing;
    const fresh = INDUSTRIAL_DB.find(r => r.name === ing.name);
    if (!fresh) return ing;
    return { ...ing, foodData: { ...ing.foodData, data: fresh } };
  });
  // Preserve the existing setIngredients call sites — they mutate the raw list.
  const setIngredients = setIngredientsRaw;
  const [newIngredient, setNewIngredient] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('g');
  const [nutrition, setNutrition] = useState<Nutrition>(emptyNutrition());
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<(IndustrialIngredient | FoodResult)[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [ingredientStatement, setIngredientStatement] = useState('');
  /**
   * Aggregated allergen matches across the current formulation's ingredients.
   * Per launch-blocker #2 Phase 2 (Strategy B rich-shape migration 2026-05-25):
   * stores AllergenMatch[] (rich shape with category + species + requiresSpeciesNaming +
   * regulatoryTier) instead of legacy string[]. Enables regulatory-tier surfacing,
   * inline gate-refusal triggers, and species-aware downstream consumption.
   *
   * Render sites consume via `m.species ?? m.category` for the display string
   * per FALCPA §403(w)(1)(B) bare-species format (operator Option A locked 2026-05-25).
   */
  const [allergenStatement, setAllergenStatement] = useState<AllergenMatch[]>([]);
  // Round 11 Phase 3 (2026-05-17): defaults changed from 30g serving /
  // 300g package to 0. Pre-A.5-followup behavior anchored fresh
  // formulations to F&B-default sauce-sized values that aren't
  // meaningful for supplements (where 60+ capsule containers at 2g/cap
  // ≈ 120g are typical) or for fresh F&B work (where the operator
  // hasn't yet decided batch size). 0 is the honest empty-state default;
  // operator enters real values. The mode-switch reconciliation
  // useEffect below preserves back-compat for existing saved state
  // (still detects 30/300 F&B legacy → 2/60 supplement legacy
  // transitions for users with pre-0-default saved formulations).
  const [servingSize, setServingSize] = useState(0);
  const [servingUnit, setServingUnit] = useState('g');
  const [packageSize, setPackageSize] = useState(0);
  const [packageUnit, setPackageUnit] = useState('g');

  // ----- Mode-switch unit reconciliation --------------------------------------
  // When the user switches modes, the current unit selections may no longer be
  // in the new mode's allowed list (e.g., "tsp" in F&B → not available in
  // Supplements). Reset each stale unit to the mode's natural default.
  //
  // Per operator UX feedback 2026-05-25 — DO NOT auto-swap serving/package size
  // numeric values on mode change. Prior logic swapped F&B↔Supplement defaults
  // (30/300 ↔ 2/60) automatically, which caused state-leak bugs where stale
  // values from one mode persisted into the other unexpectedly. New behavior:
  // operator types fresh values per mode; empty fields (0) render as empty per
  // the empty-default UX principle. Mid-formula mode changes preserve whatever
  // values the operator already entered (no destructive reset).
  useEffect(() => {
    const modeUnits = mc.units;
    const defaultUnit = mode === 'supplements' ? 'mg' : modeUnits[0];
    if (!modeUnits.includes(servingUnit)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mode-switch reconciliation
      setServingUnit(mode === 'supplements' ? 'g' : defaultUnit);
    }
    if (!modeUnits.includes(packageUnit)) {
      setPackageUnit(mode === 'supplements' ? 'g' : defaultUnit);
    }
    if (!modeUnits.includes(newUnit)) {
      setNewUnit(defaultUnit);
    }
  }, [mode, mc.units, servingUnit, packageUnit, newUnit]);


  // ----- Supplement-specific dosage model (visible only when mode === 'supplements') --
  // Delivery form controls the noun shown on the Supplement Facts label ("2 Capsules"
  // vs. "1 Softgel" vs. "1 Scoop"), and drives the input model for the
  // Serving & Package Size card. Round 11 Phase 3 Workstream A.5 #25l
  // structural fix: count-based forms (capsule/tablet/softgel/gummy/lozenge/
  // chewable) consume count-based inputs and derive mass; mass-based (powder)
  // and volume-based (liquid) forms use constrained unit dropdowns.
  // Types + categorization helpers in lib/servingModel.ts.
  const [suppDeliveryForm, setSuppDeliveryForm] = useState<SupplementDeliveryForm>('capsule');
  const [suppUnitsPerServing, setSuppUnitsPerServing] = useState<number>(2);
  const [suppCapsuleSize, setSuppCapsuleSize] = useState<CapsuleSize>('0');
  // #25l structural fix state additions (Round 11 Phase 3 Workstream A.5 [5b]):
  //
  //   lastEditedCountField  — discriminator for SP6 last-edited-wins
  //                            reconciliation. When servings changes →
  //                            'servings'; when totalUnits changes →
  //                            'totalUnits'. Drives which is canonical when
  //                            unitsPerServing changes.
  //   totalUnitsOverride    — operator-supplied totalUnits when editing
  //                            count-first ("60 capsules in this bottle").
  //                            Otherwise derived from servings × unitsPerServing.
  //   suppPerUnitWeightMg   — operator-supplied target per-unit weight in mg
  //                            for tablet/gummy/lozenge/chewable forms
  //                            (perUnitWeightSemantics === 'operator-input').
  //                            Defaults to capsule-size capacity for those
  //                            forms (500 mg sensible starting point).
  const [lastEditedCountField, setLastEditedCountField] = useState<LastEditedCountField>(null);
  const [totalUnitsOverride, setTotalUnitsOverride] = useState<number | null>(null);
  const [suppPerUnitWeightMg, setSuppPerUnitWeightMg] = useState<number>(500);
  /** Intended audience for the supplement — tightens UL thresholds (pregnancy retinol, pediatric iron, etc.). */
  const [suppAudience, setSuppAudience] = useState<SupplementAudience>('general');
  // ----- Supplement stability / overage conditions ---------------------------
  const [suppShelfLifeMonths, setSuppShelfLifeMonths] = useState<number>(24);
  const [suppStorage, setSuppStorage] = useState<StorageCondition>('ambient');
  const [suppAmberPkg, setSuppAmberPkg] = useState<boolean>(false);
  const [suppDesiccant, setSuppDesiccant] = useState<boolean>(true);
  const [suppNitrogen, setSuppNitrogen] = useState<boolean>(false);
  const [suppTocopherol, setSuppTocopherol] = useState<boolean>(false);
  /** User's draft label-copy / claim text — analyzed for disease-claim language in the Claims Validator card. */
  const [suppDraftClaim, setSuppDraftClaim] = useState<string>('');
  /**
   * Tracks which supplement analysis cards the user has manually toggled.
   * Default collapsed/expanded is derived from findings (cards with issues
   * expand; clean cards collapse) — but once the user clicks, their choice
   * wins. Keyed by card id ('safety', 'stability', 'compat', 'ndi',
   * 'claims', 'retail').
   */
  const [suppCardsManuallyToggled, setSuppCardsManuallyToggled] = useState<Record<string, boolean>>({});
  const toggleSuppCard = (id: string, currentlyExpanded: boolean) => {
    setSuppCardsManuallyToggled(prev => ({ ...prev, [id]: !currentlyExpanded }));
  };
  /** Max fill weight per standard hard-shell capsule (mg) — empirical industry values. */
  // Capsule capacity table now lives in lib/servingModel.ts (single
  // source of truth, dropdown values + helper agree). Use the helper
  // capsuleCapacityMg(size) at call sites. Round 11 Phase 3 Workstream
  // A.5 [5c/N] dedup.
  /** Label noun for delivery forms — used on the Supplement Facts Serving Size row. */
  const SUPP_FORM_NOUN: Record<SupplementDeliveryForm, { singular: string; plural: string }> = {
    capsule:   { singular: 'Capsule',   plural: 'Capsules'   },
    tablet:    { singular: 'Tablet',    plural: 'Tablets'    },
    softgel:   { singular: 'Softgel',   plural: 'Softgels'   },
    gummy:     { singular: 'Gummy',     plural: 'Gummies'    },
    powder:    { singular: 'Scoop',     plural: 'Scoops'     },
    liquid:    { singular: 'Dropper',   plural: 'Droppers'   },
    lozenge:   { singular: 'Lozenge',   plural: 'Lozenges'   },
    chewable:  { singular: 'Chewable',  plural: 'Chewables'  },
  };

  const [formulationName, setFormulationName] = useState('');
  const [productType, setProductType] = useState<string>('');
  // Round 10 Path A-2 (2026-05-15): productClass drives per-context regulatory
  // routing in checkCompliance. Empty string represents the "unset" state —
  // required-at-creation enforcement blocks saveFormulation() until set; UI
  // selector surfaces a "Required to save" hint when empty. Type is widened
  // to `ProductClass | ''` so the unset state coexists with the enum at
  // runtime; consumers narrow via `productClass || undefined` when passing
  // to checkCompliance.
  const [productClass, setProductClassState] = useState<ProductClass | ''>('');
  // Whether the currently-stored productType references a legacy entry no longer
  // surfaced in the dropdown (Round 2 narrowing). Used to display a fallback option
  // + migration CTA. Note: declared AFTER productType useState because it depends on
  // the state value; declared BEFORE the JSX so it's in scope where used.
  const isLegacyProductType = !!productType && !DROPDOWN_PRODUCT_TYPES.some(pt => pt.name === productType);
  // Tracked specs — null means "use product-type defaults"; an array means user has
  // explicitly customized the selection. Persists across product-type changes (deliberate
  // user choice shouldn't be silently reset by a productType retag); user can hit
  // "Reset to defaults" to re-derive from current productType.
  const [trackedSpecsOverride, setTrackedSpecsOverride] = useState<TrackedSpec[] | null>(null);
  const [savedFormulations, setSavedFormulations] = useState<SavedFormulation[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'build' | 'saved' | 'database' | 'batch' | 'filing' | 'cost' | 'sourcing' | 'authorities' | 'services'>('home');
  // ----- Workspace entry state: mode preference + per-mode TOS ----------
  // Round 11 Phase 3 Workstream A: segmented per-mode TOS replaces the
  // prior single-boolean tosAccepted model. State machinery lives in
  // lib/workspaceMode.ts; see docs/architecture/harm-critical-floor.md
  // and the Round 11 Phase 3 directive for rationale.
  //
  // entryState is null pre-hydration (SSR); becomes WorkspaceEntryState
  // post-hydration. Caller renders the pre-TOS mode-selection screen,
  // segment-aware TOS modal, or workspace based on determineEntryScreen.
  const [entryState, setEntryState] = useState<WorkspaceEntryState | null>(null);
  useEffect(() => {
    // One-shot hydration from localStorage on mount — idiomatic pattern;
    // the react-hooks/purity rule flags it but setState in useEffect is the
    // correct way to seed React state from browser storage post-SSR.
    if (typeof window === 'undefined') return;
    const hydrated = hydrateWorkspaceEntryState(window.localStorage);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration on mount
    setEntryState(hydrated);
    // Sync workspace mode state if user already has a mode preference
    if (hydrated.mode !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- workspace mode sync from persisted preference
      setMode(hydrated.mode);
    }
  }, []);
  // Pre-TOS mode-selection screen handler — user picks mode at first
  // visit (or returning post-migration from pre-Round-11 fw-tos-v1-only).
  const selectInitialMode = (chosen: 'supplements' | 'fb') => {
    if (typeof window !== 'undefined') persistMode(window.localStorage, chosen);
    setMode(chosen);
    setEntryState(prev => prev === null ? null : { ...prev, mode: chosen });
  };
  // Accept the TOS for the currently-active mode. Wraps localStorage
  // persistence and entryState mutation in a single handler.
  const acceptTosForCurrentMode = () => {
    if (entryState === null || entryState.mode === undefined) return;
    if (typeof window !== 'undefined') {
      persistTosAcceptance(window.localStorage, entryState.mode);
    }
    setEntryState(prev => prev === null ? null : {
      ...prev,
      tosAccepted: { ...prev.tosAccepted, [prev.mode!]: true },
    });
  };
  // Revoke TOS acceptance for the currently-active mode and re-prompt.
  // Used by the command palette "Review Terms of Use" and footer
  // "Review Terms" affordances.
  const revokeTosForCurrentMode = () => {
    if (entryState === null || entryState.mode === undefined) return;
    if (typeof window !== 'undefined') {
      revokeTosAcceptance(window.localStorage, entryState.mode);
    }
    setEntryState(prev => prev === null ? null : {
      ...prev,
      tosAccepted: { ...prev.tosAccepted, [prev.mode!]: false },
    });
  };
  // Derived entry-screen decision. Computed inline at render sites.
  const entryScreen = entryState === null ? null : determineEntryScreen(entryState);
  // ----- Process Authority directory filter state -----------------------
  const [paStateFilter, setPaStateFilter] = useState<string>('All');
  const [paTypeFilter, setPaTypeFilter] = useState<ProcessAuthorityType | 'All'>('All');
  const [paSearch, setPaSearch] = useState('');
  // ----- Feature flags --------------------------------------------------
  const SHOW_COPACKER_SERVICE = false; // Hidden until we can promise the service
  // ----- Services / lead capture state ----------------------------------
  const [serviceRequestType, setServiceRequestType] = useState<'' | 'bench' | 'reform' | 'scaleup' | 'copacker'>('');
  const [serviceClientName, setServiceClientName] = useState('');
  const [serviceClientEmail, setServiceClientEmail] = useState('');
  const [serviceClientCompany, setServiceClientCompany] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  // ----- Sourcing tab filter state --------------------------------------
  const [sourcingFilterOrganic, setSourcingFilterOrganic] = useState(false);
  const [sourcingFilterNonGmo, setSourcingFilterNonGmo] = useState(false);
  const [sourcingFilterKosher, setSourcingFilterKosher] = useState(false);
  const [sourcingFilterHalal, setSourcingFilterHalal] = useState(false);
  const [sourcingFilterRspo, setSourcingFilterRspo] = useState(false);
  const [sourcingFilterMsc, setSourcingFilterMsc] = useState(false);
  const [sourcingFilterFairTrade, setSourcingFilterFairTrade] = useState(false);
  const [sourcingFilterCgmp, setSourcingFilterCgmp] = useState(false);
  const [sourcingFilterMaxLeadTime, setSourcingFilterMaxLeadTime] = useState<'any' | '1-3-days' | '1-2-weeks' | '2-4-weeks' | '4-8-weeks'>('any');
  // ----- Cost Tool state --------------------------------------------------
  const [freightModel, setFreightModel] = useState<'fob' | 'delivered'>('delivered');
  /** Freight adder (USD / kg of ingredient) when FOB. */
  const [freightPerKg, setFreightPerKg] = useState(0);
  /** Direct labor allocated per retail unit (USD). */
  const [laborPerUnit, setLaborPerUnit] = useState(0);
  /** Plant overhead as a % of (ingredients + packaging + labor). */
  const [overheadPct, setOverheadPct] = useState(8);
  /** Target retail (SRP) for margin math. */
  const [targetSRP, setTargetSRP] = useState(4.99);
  /** Target gross margin % (wholesale basis). */
  const [targetMarginPct, setTargetMarginPct] = useState(35);
  /** Retailer markup factor: wholesale = SRP × factor. 0.50 ≈ 50% off SRP (standard grocery). */
  const [wholesaleFactor, setWholesaleFactor] = useState(0.5);
  /** Sensitivity: commodity spike % applied globally to ingredient costs. */
  const [commoditySpikePct, setCommoditySpikePct] = useState(0);
  // ----- Versioning / comparison state ---------------------------------
  /** Which formulation is expanded in Saved tab (null = none). */
  const [historyExpandedId, setHistoryExpandedId] = useState<string | null>(null);
  /** Formulations selected for comparison (max 3). */
  const [compareSelectionIds, setCompareSelectionIds] = useState<string[]>([]);
  /** Whether comparison view is currently showing. */
  const [showComparison, setShowComparison] = useState(false);
  /** Which two versions of a single formula to diff (by version string). */
  const [diffSelection, setDiffSelection] = useState<{ formulaId: string; v1: string; v2: string } | null>(null);
  /** User-selected visual appearance. Persisted to localStorage, applied to <html>. */
  const [appearance, setAppearance] = useState<'light' | 'dim' | 'dark'>('light');
  /** Claim being tested against FDA 21 CFR 101.54/.56 in the claim-validator panel. */
  const [claimInput, setClaimInput] = useState('');
  /** Which ingredient's raw-material spec sheet is currently open in the modal (null = closed). */
  const [specSheetIngredientIndex, setSpecSheetIngredientIndex] = useState<number | null>(null);
  // ----- Command Palette state ------------------------------------------
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [cmdPaletteQuery, setCmdPaletteQuery] = useState('');
  const [cmdPaletteSelectedIndex, setCmdPaletteSelectedIndex] = useState(0);
  const cmdInputRef = useRef<HTMLInputElement>(null);
  // Cross-platform ⌘K / Ctrl+K to open, Esc to close. Arrows to navigate, Enter to select.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape' && cmdPaletteOpen) {
        setCmdPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cmdPaletteOpen]);
  // Reset query + selection when opening/closing
  useEffect(() => {
    if (cmdPaletteOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- side-effect in response to toggle
      setCmdPaletteSelectedIndex(0);
      setTimeout(() => cmdInputRef.current?.focus(), 50);
    } else {
      setCmdPaletteQuery('');
    }
  }, [cmdPaletteOpen]);
  // ----- Formula Status state --------------------------------------------
  /** Lifecycle status for the current in-progress formula. Persisted when saved. */
  const [formulaStatus, setFormulaStatus] = useState<'draft' | 'in-pilot' | 'launched' | 'on-hold'>('draft');
  /** Part number for the in-progress formula — auto-assigned on first save, user-editable thereafter. */
  const [partNumber, setPartNumber] = useState<string>('');
  /**
   * Operator-authored Batch Sheet Template (Execution Canvas) for the
   * in-progress Base Sheet. Plain text — operator's own conventions for
   * fill-in slots (underscores), hierarchy, section headers. Inherited
   * by every Batch Sheet spawned from this Base Sheet version.
   *
   * Persisted to localStorage per Opus pressure-test 2026-05-25 — bridges
   * the no-save-backend gap so operator doesn't lose 30 min of procedure
   * authoring to a page reload. Survives reload; lost on cache clear.
   * Replaced by Supabase persistence when launch-blocker #4 lands.
   */
  const [batchSheetTemplate, setBatchSheetTemplate] = useState<string>('');
  // Load batchSheetTemplate from localStorage on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration on mount
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('fw_batchSheetTemplate_draft') : null;
      if (stored) setBatchSheetTemplate(stored);
    } catch { /* localStorage unavailable (private mode, etc.) — silent fallback to empty */ }
  }, []);
  // Persist whenever it changes.
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem('fw_batchSheetTemplate_draft', batchSheetTemplate);
    } catch { /* localStorage unavailable — silent */ }
  }, [batchSheetTemplate]);
  // ----- Supplier Qualification Tracker state ---------------------------
  const [supplierQuals, setSupplierQuals] = useState<SupplierQualification[]>([]);
  /** Sourcing tab sub-view toggle. */
  const [sourcingSubView, setSourcingSubView] = useState<'suppliers' | 'qualifications'>('suppliers');
  /** Which qualification is being edited in the modal (null = closed, 'new' = creating). */
  const [editingQualId, setEditingQualId] = useState<string | 'new' | null>(null);
  const [qualForm, setQualForm] = useState<Partial<SupplierQualification>>({
    supplierName: '', docType: 'locg', issuedDate: '', expirationDate: '', certifier: '', notes: '',
  });
  // Load on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration on mount
    setSupplierQuals(loadQualifications());
  }, []);
  // Persist whenever state changes
  useEffect(() => {
    saveQualifications(supplierQuals);
  }, [supplierQuals]);
  // Reactive "now" timestamp — refreshes every minute so dashboard relative
  // times stay accurate without calling Date.now() during render (which the
  // react-hooks/purity lint rule prohibits).
  const [dashboardNow, setDashboardNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setDashboardNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    // Restore on mount
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('fw-appearance');
    if (saved === 'light' || saved === 'dim' || saved === 'dark') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration on mount
      setAppearance(saved);
    }
  }, []);
  useEffect(() => {
    // Apply + persist whenever appearance changes
    if (typeof window === 'undefined') return;
    document.documentElement.setAttribute('data-appearance', appearance);
    window.localStorage.setItem('fw-appearance', appearance);
  }, [appearance]);
  // Filing (Scheduled Process) form state
  const [filing, setFiling] = useState({
    establishmentName: '',
    fceNumber: '',
    establishmentAddress: '',
    contactName: '',
    contactEmail: '',
    processAuthorityName: '',
    processAuthorityOrg: '',
    processAuthorityDate: '',
    containerHeadspace: '',
    containerVacuum: '',
    fillInitialTemp: '',
    fillTargetTemp: '',
    holdTime: '',
    retortProcessTemp: '',
    retortProcessTime: '',
    coolWaterChlorine: '1.0',
    processMethod: 'hot-fill',
    equilibriumPhDay: '10',
    targetPh: '',
    acidulantType: '',
    saltPercent: '',
    notes: '',
  });
  const [customQaTests, setCustomQaTests] = useState<QaTest[]>([]);
  const [batchSize, setBatchSize] = useState(10);
  const [batchSizeUnit, setBatchSizeUnit] = useState('kg');
  const [batchNumber, setBatchNumber] = useState('');
  const [productionDate, setProductionDate] = useState(new Date().toISOString().slice(0, 10));
  const [operator, setOperator] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [dbCategory, setDbCategory] = useState('All');
  const [dbSearch, setDbSearch] = useState('');
  // selectedFood can hold either an industrial SKU, a USDA result, or be null
  const [selectedFood, setSelectedFood] = useState<IngredientSourceData | null>(null);
  const [selectedPackaging, setSelectedPackaging] = useState<PackagingItem | null>(null);
  const [selectedClosure, setSelectedClosure] = useState<PackagingItem | null>(null);
  // ----- Custom packaging -----------------------------------------------------
  // When nothing in the DB matches what the user actually uses (unusual bottle,
  // boutique pouch, bulk tote, "half carafe," etc.), they can define a custom
  // entry. It appears at the top of the dropdown and behaves exactly like a DB
  // item for cost rollup, label display, batch sheet, and package calculations.
  const [customContainer, setCustomContainer] = useState<PackagingItem | null>(null);
  const [customClosure, setCustomClosure] = useState<PackagingItem | null>(null);
  /** Monotonic counter used to build FWP-CUS-XXXX part numbers for user-defined packaging. */
  const [customPackagingSeq, setCustomPackagingSeq] = useState<number>(1);
  const [showContainerForm, setShowContainerForm] = useState<boolean>(false);
  const [showClosureForm, setShowClosureForm] = useState<boolean>(false);
  /** When true, the on-demand Packaging Data Sheet modal is rendered. */
  const [showPackagingSheet, setShowPackagingSheet] = useState<boolean>(false);
  // Draft fields for the custom form — kept separate from the committed
  // customContainer / customClosure so the user can abandon without losing state.
  const [draftCustom, setDraftCustom] = useState<{
    name: string; material: string; capacityVal: number; capacityUnit: string;
    neckFinish: string; costPerUnit: number; kind: 'container' | 'closure';
    unitsPerCase: number; casesPerLayer: number; layersPerPallet: number;
    palletType: string;
  }>({ name: '', material: '', capacityVal: 0, capacityUnit: 'ml', neckFinish: '', costPerUnit: 0, kind: 'container',
       unitsPerCase: 0, casesPerLayer: 0, layersPerPallet: 0, palletType: '48x40 GMA' });
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  /** If true, applying a bulk paste REPLACES the current formulation instead of appending. */
  const [replaceOnPaste, setReplaceOnPaste] = useState(true);
  const [showFullHaccp, setShowFullHaccp] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Container categories are now mode-scoped so the dropdown doesn't drown the
  // user in packaging that isn't remotely appropriate for their vertical.
  // The custom container + closure entries (below) give the user a fallback
  // for anything not in the DB.
  const containerCategories = mc.packagingContainerCategories;
  const closureCategories = ['Closures', 'Pumps & Dispensers'];
  // Split PACKAGING_DB into selector pools, scoped to mode-relevant categories.
  const containerItems = PACKAGING_DB.filter(p =>
    containerCategories.includes(p.category)
    && p.category !== 'Closures'
    && p.category !== 'Pumps & Dispensers'
  );
  const closureItems = PACKAGING_DB.filter(p => p.category === 'Closures' || p.category === 'Pumps & Dispensers');

  // Current product-type definition (or null if none chosen / unknown name).
  const currentProductType = productType ? PRODUCT_TYPES.find(pt => pt.name === productType) || null : null;
  // Containers recommended for the current product type (keep DB order within the recommendations
  // array itself, since product-type authors ordered them by typicality).
  const recommendedContainers = currentProductType
    ? currentProductType.typicalContainers
        .map(name => PACKAGING_DB.find(p => p.name === name))
        .filter((p): p is NonNullable<typeof p> => !!p)
    : [];
  const recommendedClosures = currentProductType
    ? currentProductType.typicalClosures
        .map(name => PACKAGING_DB.find(p => p.name === name))
        .filter((p): p is NonNullable<typeof p> => !!p)
    : [];
  const recommendedContainerNames = new Set(recommendedContainers.map(p => p.name));
  const recommendedClosureNames = new Set(recommendedClosures.map(p => p.name));

  const servingSizeInGrams = servingSize * (UNIT_TO_GRAMS[servingUnit] || 1);
  const packageSizeInGrams = packageSize * (UNIT_TO_GRAMS[packageUnit] || 1);
  /**
   * Servings/Container derived from packageSize ÷ servingSize. Per operator UX
   * feedback 2026-05-25 — always auto-computed; no operator override (override
   * was a footgun + override stale-state caused mislabeled servings counts).
   * Operator changes Serving Size or Package Size to adjust; the count follows.
   *
   * 0 when either input is empty (renders as blank in UI; NFP header omits the
   * line entirely until both inputs are entered).
   */
  const autoServingsPerContainer = packageSizeInGrams && servingSizeInGrams
    ? Math.round((packageSizeInGrams / servingSizeInGrams) * 10) / 10 : 0;
  /** Override state preserved as backwards-compat scaffold — F&B-mode UI no
   *  longer exposes editing per operator UX feedback 2026-05-25 (footgun pattern);
   *  supplement-mode count-back logic (capsule/tablet/softgel forms) still uses
   *  the setter for its own count-based-derivation flow. Future cleanup commit
   *  can audit which supplement-mode callsites legitimately need override
   *  semantics vs which are vestigial. */
  const [servingsPerContainerOverride, setServingsPerContainerOverride] = useState<number | null>(null);
  /** Effective servings count. Always equals autoServingsPerContainer at this
   *  commit (override is always null). The `?? autoServingsPerContainer`
   *  fallback preserves the existing aggregation pattern for callsites. */
  const servingsPerContainer = servingsPerContainerOverride ?? autoServingsPerContainer;

  /**
   * FDA-formatted "X servings per container" display per 21 CFR 101.9(b)(8).
   * Rules:
   *   • 0 (either input empty) → empty string (NFP header omits the line)
   *   • < 1.5 servings → "1 serving per container" (single-serving rule)
   *   • Integer value → "X servings per container" (exact)
   *   • Fractional ≥ 1.5 → "about X servings per container" (rounded to nearest whole)
   */
  const formattedServingsPerContainer = (() => {
    if (!servingsPerContainer || servingsPerContainer <= 0) return '';
    if (servingsPerContainer < 1.5) return '1 serving per container';
    if (Number.isInteger(servingsPerContainer)) return `${servingsPerContainer} servings per container`;
    return `about ${Math.round(servingsPerContainer)} servings per container`;
  })();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const searchIngredients = (query: string) => {
    setNewIngredient(query);
    setSelectedFood(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) { setShowDropdown(false); return; }
    const q = query.toLowerCase();
    const queryHasOrganic = /\borganic\b/.test(q);
    const score = (i: IndustrialIngredient): number => {
      const nameScore = rankIngredientMatch(i.name, q);
      const base = nameScore < 99
        ? nameScore
        : (i.category.toLowerCase().includes(q) ? 5 : 99); // category fallback
      if (base >= 99) return 99;
      // Within-tier deprioritization: organic variants sink below conventional
      // siblings unless the user explicitly typed "organic" in the query.
      if (!queryHasOrganic && /\borganic\b/i.test(i.name)) return base + 0.5;
      return base;
    };
    // DB array order is curated canonical-first (e.g., Granulated Sugar before
    // Coconut Sugar), so it's the right tiebreaker — name length pushed exotic
    // short variants ahead of the standard form.
    const industrialMatches = INDUSTRIAL_DB
      .map((i, idx) => ({ item: i, s: score(i), idx }))
      .filter(x => x.s < 99)
      .sort((a, b) => a.s - b.s || a.idx - b.idx)
      .slice(0, 5)
      .map(x => x.item);
    if (industrialMatches.length > 0) { setSearchResults(industrialMatches); setShowDropdown(true); }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(query)}&pageSize=4&dataType=Branded,SR%20Legacy,Foundation`);
        const data = await response.json();
        if (data.foods?.length > 0) { setSearchResults([...industrialMatches, ...data.foods.slice(0, 4)]); setShowDropdown(true); }
      } catch { } finally { setSearching(false); }
    }, 400);
  };

  const selectIngredient = (item: IndustrialIngredient | FoodResult) => {
    if (isIndustrial(item)) {
      setNewIngredient(item.name);
      setSelectedFood({ type: 'industrial', data: item, subIngredients: item.subIngredients, allergens: item.allergens, costPerKg: item.costPerKg, supplier: item.suppliers[0], nutrition: item.nutrition });
    } else {
      const food = item as FoodResult;
      const subs = food.ingredients ? food.ingredients.split(/,(?![^(]*\))/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 60).slice(0, 8) : [];
      setNewIngredient(food.brandName ? `${food.description} (${food.brandName})` : food.description);
      setSelectedFood({ type: 'usda', data: food, subIngredients: subs, allergens: detectAllergenStrings((food.description || '') + ' ' + (food.ingredients || '')), costPerKg: 0, supplier: 'USDA Database', nutrition: {} });
    }
    setShowDropdown(false);
    setSearchResults([]);
  };

  const recalculate = (currentIngredients: Ingredient[]) => {
    const n = emptyNutrition();
    // Per launch-blocker 1B FALCPA species-naming wire-up 2026-05-25 — aggregate
    // allergens as rich AllergenMatch[] then dedupe by category so detector species
    // wins over catalog generic. Without this dedupe, an ingredient like Coconut Oil
    // (catalog: 'Tree Nuts', detector: 'Coconut') would render "Contains: Tree Nuts,
    // Coconut" — duplicate categorically wrong. After dedupe: just "Coconut".
    const collectedMatches: AllergenMatch[] = [];
    currentIngredients.forEach((item) => {
      // FALCPA §203(b)(2) highly-refined-oil exemption check per
      // [[falcpa-highly-refined-oil-exemption]] doctrine 2026-05-25. When the
      // catalog entry has falcpaExemptionStatus: 'exempt' (e.g., Soybean Oil RBD —
      // decades of clinical data confirm <1 ppm residual protein), skip ALL
      // allergen aggregation for this ingredient (both catalog declarations + name/
      // subIngredient detection). The label correctly omits the source allergen.
      //
      // Operator-decision status (e.g., Coconut Oil RBD) and not-exempt status
      // (cold-pressed / virgin) and undefined (refining grade not yet flagged)
      // all default to "conservative declare" — allergens flow through normally.
      const industrialData = item.foodData?.type === 'industrial' ? item.foodData.data : null;
      const falcpaExempt = industrialData?.falcpaExemptionStatus === 'exempt';

      if (!falcpaExempt) {
        // Detector pass — extracts species from ingredient name PLUS sub-ingredients
        // text. Sub-ingredients commonly carry species names that the ingredient
        // name itself doesn't (e.g., 'Glucosamine HCl' name + ['Glucosamine HCl',
        // 'Shrimp Shells', 'Crab Shells'] subIngredients → detector finds Shrimp +
        // Crab species). Per [[regulatory-classification-vs-supplier-data]] catalog
        // enrichment doctrine 2026-05-25 — species notation is regulatory-classification
        // (taxonomic), so the platform can populate it via sub-ingredients
        // detection without waiting for COA-anchored supplier data.
        const detectionText = [item.name, ...(item.subIngredients || [])].join(' ');
        const detected = detectAllergensDetailed(detectionText);
        collectedMatches.push(...detected);
        // Catalog allergens — string[] legacy shape. Synthesize as AllergenMatch
        // for the aggregation pipeline, BUT skip categories where the detector
        // already found species (species wins per FALCPA §403(w)(1)(B)).
        const detectorCategories = new Set(detected.map(m => m.category));
        item.allergens?.forEach(a => {
          if (detectorCategories.has(a as AllergenMatch['category'])) return;
          collectedMatches.push({
            category: a as AllergenMatch['category'],
            species: undefined,
            matchedKeyword: a,
            requiresSpeciesNaming: ['Tree Nuts', 'Fish', 'Shellfish'].includes(a),
            regulatoryTier: 'falcpa-faster-big-9',
          });
        });
      }
      const qtyInGrams = item.qty * (UNIT_TO_GRAMS[item.unit] || 1);
      const factor = qtyInGrams / 100;
      if (item.foodData?.type === 'industrial' && item.foodData?.nutrition) {
        const nut = item.foodData.nutrition as Record<string, number | undefined>;
        Object.keys(nut).forEach(key => {
          const nObj = n as unknown as Record<string, number>;
          nObj[key] = (nObj[key] || 0) + ((nut[key] || 0) * factor);
        });
      } else if (item.foodData?.type === 'usda' && item.foodData.data && 'foodNutrients' in item.foodData.data && item.foodData.data.foodNutrients) {
        const nutrients = item.foodData.data.foodNutrients as Array<{ nutrientName?: string; value?: number }>;
        const get = (kw: string) => (nutrients.find(x => x.nutrientName?.toLowerCase().includes(kw))?.value || 0) * factor;
        n.calories += get('energy'); n.totalFat += get('total lipid'); n.saturatedFat += get('fatty acids, total saturated');
        n.cholesterol += get('cholesterol'); n.sodium += get('sodium'); n.totalCarbs += get('carbohydrate');
        n.dietaryFiber += get('fiber'); n.totalSugars += get('sugars'); n.protein += get('protein');
        n.calcium += get('calcium'); n.iron += get('iron'); n.potassium += get('potassium');
      }
    });
    setNutrition(n);
    // Final dedupe pass — for each category where ANY ingredient produced a
    // species match, drop the generic category entries (species naming wins
    // across the whole formula, not just per-ingredient). Also dedupe identical
    // (category, species) pairs across ingredients (e.g., two coconut-derived
    // ingredients shouldn't produce "Coconut, Coconut" in the statement).
    //
    // Per launch-blocker #2 Phase 2 Strategy B rich-shape migration 2026-05-25 —
    // state stores AllergenMatch[] directly; 6 render sites extract display
    // via `.map(m => m.species ?? m.category).join(', ')` (bare species per
    // operator Option A locked 2026-05-25).
    const speciesCategories = new Set(
      collectedMatches.filter(m => m.species).map(m => m.category)
    );
    const cleaned = collectedMatches.filter(m => m.species || !speciesCategories.has(m.category));
    const seenPairs = new Set<string>();
    const deduped = cleaned.filter(m => {
      const key = `${m.category}|${m.species ?? ''}`;
      if (seenPairs.has(key)) return false;
      seenPairs.add(key);
      return true;
    });
    setAllergenStatement(deduped);
    const sorted = [...currentIngredients].sort((a, b) => (b.qty * (UNIT_TO_GRAMS[b.unit] || 1)) - (a.qty * (UNIT_TO_GRAMS[a.unit] || 1)));
    // Round 4 fix (2026-05-07): centralized assembly via buildIngredientStatement.
    // Old inline logic produced "Honey (Industrial Grade) (Honey)" double-parens
    // bug — slapped sub-ingredients in parens regardless of whether the sub list
    // was just the simple name. New helper applies match-based simple/compound
    // discrimination. See lib/ingredientStatement.ts.
    setIngredientStatement(buildIngredientStatement(sorted));
  };

  const totalCost = ingredients.reduce((sum, ing) => sum + ((ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1)) / 1000) * (ing.costPerKg || 0), 0);
  const totalWeightKg = ingredients.reduce((sum, ing) => sum + (ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1)) / 1000, 0);
  const totalBatchGrams = totalWeightKg * 1000;

  // ----- #25l count-based form sync (Round 11 Phase 3 Workstream A.5 [5b/N]) ---
  // For count-based supplement delivery forms (capsule/tablet/softgel/gummy/
  // lozenge/chewable), the operator inputs count-based values via the new
  // Serving & Package Size card UI. This effect bridges those count inputs
  // into the legacy servingSize / servingUnit / packageSize / packageUnit
  // state so downstream consumers (Supplement Facts panel, cost per serving,
  // perServing scaling, etc.) continue to work without per-call-site
  // refactoring.
  //
  // Per-unit weight semantics split (SP3):
  //   • capacity-derived (capsule/softgel) → per-unit mg = totalBatchGrams /
  //     totalUnits, bounded by capsule shell capacity
  //   • operator-input (tablet/gummy/lozenge/chewable) → per-unit mg =
  //     suppPerUnitWeightMg (operator-supplied target weight)
  //
  // Effect skips when newly-derived values are zero (empty formulation or
  // pre-ingredient state) so the legacy default display (2g / 60g) remains
  // visible until the operator adds ingredients. Effect does NOT depend on
  // legacy servingSize/Unit/packageSize/Unit to avoid re-running on its own
  // writes; React's identity check on setState prevents re-render storms.
  useEffect(() => {
    if (mode !== 'supplements') return;
    if (categorizeDeliveryForm(suppDeliveryForm) !== 'count') return;

    // Round 11 Phase 3 (2026-05-17) fix: skip sync entirely when no
    // operator count input has been entered. Pre-fix behavior seeded
    // with servings=30 fallback, which propagated a fake
    // "30 servings / 60 capsules / N mg per cap" display after bulk
    // paste — violating the "defaults are 0" direction the operator
    // set. Sync now only fires when the operator has actually entered
    // count-based inputs (Servings/Container, Total Units, or made an
    // edit tracked by lastEditedCountField).
    const hasOperatorInput =
      servingsPerContainerOverride !== null ||
      totalUnitsOverride !== null ||
      lastEditedCountField !== null;
    if (!hasOperatorInput) return;

    const semantics = perUnitWeightSemantics(suppDeliveryForm);
    const seedServings = servingsPerContainerOverride ?? 0;
    const seedTotalUnits = totalUnitsOverride ?? deriveTotalUnits(seedServings, suppUnitsPerServing);

    const reconciled = reconcileCountInputs({
      servings: seedServings,
      totalUnits: seedTotalUnits,
      unitsPerServing: suppUnitsPerServing,
      lastEdited: lastEditedCountField,
    });
    const totalUnits = reconciled.totalUnits;

    // Per-serving entry semantics (locked-in supplements contract — see
    // supplementMath.test.ts T1A/T1C). Each ingredient row IS a per-
    // serving dose, so `totalBatchGrams` (sum of row masses) is the
    // per-serving total. Round 11 Phase 3 post-A.5 follow-up (2026-05-
    // 17): prior implementation derived per-unit fill as totalBatchGrams
    // / totalUnits — treating the formulation sum as a full-batch total
    // and under-stating per-cap fill by a factor of servings. Operator-
    // side Formula 1-4 testing surfaced the resulting "Low fill 2%"
    // advisories on realistic supplement formulations.
    const perServingMg = totalBatchGrams * 1000;

    // SP3 split — capacity-derived for capsule/softgel (per-unit fill =
    // formulation actives / units-per-serving), operator-input for
    // tablet/gummy/lozenge/chewable (die-set / mold target; any gap
    // between actives and target is implicit filler).
    const perUnitMg = semantics === 'capacity-derived'
      ? (suppUnitsPerServing > 0 ? perServingMg / suppUnitsPerServing : 0)
      : suppPerUnitWeightMg;

    const newServingMg = semantics === 'capacity-derived'
      ? perServingMg
      : suppPerUnitWeightMg * suppUnitsPerServing;
    const newPackageG = (perUnitMg * totalUnits) / 1000;

    // Skip sync when derived values are non-meaningful (empty formulation
    // for capacity-derived forms; bad operator input for input-driven forms).
    if (newServingMg <= 0 || newPackageG <= 0) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- count-input → mass-state sync
    setServingSize(newServingMg);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setServingUnit('mg');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPackageSize(newPackageG);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPackageUnit('g');
  }, [
    mode,
    suppDeliveryForm,
    suppUnitsPerServing,
    suppPerUnitWeightMg,
    servingsPerContainerOverride,
    totalUnitsOverride,
    lastEditedCountField,
    totalBatchGrams,
  ]);
  const costPerServing = totalWeightKg > 0 ? (totalCost / totalWeightKg) * (servingSizeInGrams / 1000) : 0;

  // Packaging cost per retail unit (container + closure/dispenser).
  const packagingCostPerUnit = (selectedPackaging?.costPerUnit || 0) + (selectedClosure?.costPerUnit || 0);
  // Share of ingredient cost allocated to one retail package (by weight ratio).
  const ingredientCostPerPackage = totalBatchGrams > 0 ? totalCost * (packageSizeInGrams / totalBatchGrams) : 0;
  // Total delivered cost per retail unit = ingredients in that package + packaging hardware.
  const costPerPackage = ingredientCostPerPackage + packagingCostPerUnit;

  // Food-science spec estimates from the current formulation (pH, Brix, moisture, a_w,
  // viscosity, acetic acid, regulatory class). Lightweight — recomputed each render.
  const specs = estimateSpecs(ingredients.map(ing => ({
    name: ing.name,
    qty: ing.qty,
    unit: ing.unit,
    category: ing.foodData?.type === 'industrial' ? ing.foodData?.data?.category : undefined,
  })));

  // Resolve effective tracked specs — user override if set, else product-type defaults.
  // Drives filtering on Spec Analysis panel and Batch Sheet Target Specs.
  const effectiveTrackedSpecs = trackedSpecsOverride ?? getTrackedSpecDefaults(productType).tracked;
  const trackedSet = new Set<TrackedSpec>(effectiveTrackedSpecs);
  // Auto-derived metrics: A/M ratio shows when both inputs tracked; LAC% shows when pH tracked.
  // Round 11 Finding #25 sub-issue 25b: mode-gate F&B-only spec tiles.
  // A/M ratio and Low-Acid Components are 21 CFR 113/114 / acidified-foods
  // concepts; they have no regulatory meaning for dietary supplements
  // (governed by DSHEA / 21 CFR 111). Gating at the controlling flag
  // suppresses these tiles in BOTH the Spec Analysis Panel render
  // (line ~5686, ~5705) and the Batch Sheet Target Specs render
  // (line ~8493, ~8496) without touching either render site.
  const showAceticMoistureRatio = mode !== 'supplements' && trackedSet.has('aceticAcid') && trackedSet.has('moisture');
  const showLowAcidComponentPct = mode !== 'supplements' && trackedSet.has('pH');
  const processTemplate = (productType && mc.processTemplates[productType]) || DEFAULT_TEMPLATE;

  // Regulatory compliance findings — one per regulated ingredient present.
  // NOTE: the master compliance checker covers FDA food preservatives + USDA-FSIS
  // cure rules (nitrite/nitrate ppm, ascorbic acid as cure accelerator, BHA/BHT,
  // sorbates, benzoates, sulfites, phosphates). These rules do NOT apply to
  // dietary supplements — a supplement with 200 mg Vitamin C is not a cured meat.
  // Supplements have their own dedicated UL / NDI / compatibility / retail-fit
  // safety stack, so we skip this checker entirely in that mode to prevent
  // false positives (e.g., "Vitamin C exceeds USDA cure accelerator ppm").
  // Round 10 Path A-2 (2026-05-15): productClass routed from formulation state.
  // Empty-string unset state coerces to undefined (preserves pre-Path-A semantics
  // for formulations created before Path A or freshly cleared). Once productClass
  // is set, checkCompliance applies per-context routing, prohibitions, contextual
  // overrides, and denominator basis per Section 3b.2's data tags.
  const complianceFindings: ComplianceFinding[] = mode === 'supplements' ? [] : checkCompliance(
    ingredients.map(ing => ({ name: ing.name, qty: ing.qty, unit: ing.unit })),
    productClass || undefined,
  );
  const complianceViolations = complianceFindings.filter(f => f.violated);
  // Round 10 Section 3d (2026-05-15): Bucket A enforcement gate. Partitions
  // violations into hard-stop (MEASURED/CALCULATED + violated → refuse-to-
  // export) vs PA-reviewable (ESTIMATED/INFERRED + violated → PA judgment).
  // v1 surfaces the gate's classification in the UI banner below; Round 11
  // composes the gate with the PA-review state machinery for actual export
  // blocking. See lib/bucketAGate.ts for the gate semantics and stewardship.
  const bucketAGate = evaluateBucketA(complianceFindings);
  const bucketAHardStop = isHardStop(bucketAGate);
  const bucketAPaReviewableCount = bucketAGate.paReviewableFindings.length;

  // Round 10 Path A-2 (2026-05-15): productClass change-event handler with
  // confirm-dialog discipline. Per directive: when the formulation has active
  // findings AND productClass is changing from one set value to another, the
  // user must confirm because some findings will be invalidated and new
  // findings may appear under the new context. When no active findings exist,
  // or when transitioning from unset → set (initial selection), the change
  // applies silently. Cancel reverts to the prior value (we return without
  // calling setProductClassState).
  const handleProductClassChange = (newValue: ProductClass | '') => {
    if (newValue === productClass) return;
    // Initial selection (unset → set) applies silently — no findings to
    // invalidate because productClass-scoped enforcement hadn't fired yet.
    if (productClass === '') {
      setProductClassState(newValue);
      return;
    }
    // Active-findings case: confirm before changing. Lists up to 5 findings
    // by ingredient + rule for the user to recognize what will re-evaluate.
    if (complianceFindings.length > 0) {
      const sample = complianceFindings.slice(0, 5).map(f =>
        `• ${f.ingredientName} — ${f.limit.shortName}${f.violated ? ' (violated)' : ''}`
      ).join('\n');
      const more = complianceFindings.length > 5
        ? `\n…and ${complianceFindings.length - 5} more`
        : '';
      const fromLabel = PRODUCT_CLASS_LABEL[productClass];
      const toLabel = newValue ? PRODUCT_CLASS_LABEL[newValue] : '(unset)';
      const message =
        `Change productClass from "${fromLabel}" to "${toLabel}"?\n\n` +
        `This will re-evaluate the following compliance findings under the new context:\n\n` +
        sample + more +
        `\n\nSome findings may be invalidated and new findings may appear under the new productClass. Cancel to keep "${fromLabel}".`;
      if (!window.confirm(message)) return;
    }
    setProductClassState(newValue);
  };

  // ─── Per-ingredient findings aggregator ─────────────────────────────────────
  // Folds the highest-severity finding from every rule set (regulatory, safety,
  // compatibility, NDI) into a single map keyed by ingredient name. Used by the
  // inline severity icon on each ingredient row and by the sticky status bar's
  // Issues pill aggregate count. Severity ranking: banned > critical > warning
  // > caution > unknown > ok.
  const perIngredientFindings = (() => {
    const result: Record<string, InlineFinding> = {};
    const RANK: Record<FindingTier, number> = {
      banned: 5, critical: 4, warning: 3, caution: 2, unknown: 1, ok: 0,
    };
    const upgrade = (name: string, candidate: InlineFinding) => {
      if (!name) return;
      const existing = result[name];
      if (!existing || RANK[candidate.tier] > RANK[existing.tier]) {
        result[name] = candidate;
      }
    };

    // Regulatory compliance — non-supplements only
    for (const f of complianceFindings) {
      if (f.violated) {
        upgrade(f.ingredientName, {
          tier: 'banned',
          text: `${f.limit.shortName} over legal limit (${formatAmount(f.currentPercent, f.currentPpm)} vs ${f.limit.maxPercent !== undefined ? f.limit.maxPercent + '%' : f.limit.maxPpm + ' ppm'} max).`,
          citation: `${f.limit.authority} ${f.limit.citation}`,
          suggestedFix: 'Reduce or remove the flagged ingredient — non-compliant products are misbranded under federal law.',
        });
      }
    }

    // Supplement-mode rule sets
    if (mode === 'supplements' && ingredients.length > 0) {
      const scaleSupp = computePerServingScale({ mode, servingSizeInGrams, totalBatchGrams });
      const pmByName = new Map<string, number>();
      for (const ing of ingredients) {
        const g = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
        const pot = (ing.foodData?.type === 'industrial' && ing.foodData.data?.potencyFactor) ? ing.foodData.data.potencyFactor : 1;
        pmByName.set(ing.name, g * scaleSupp * 1000 * pot);
      }

      // Safety (UL / banned / interaction)
      const safetyFindings = checkSupplementSafety(ingredients, pmByName, suppAudience);
      for (const f of safetyFindings) {
        const tier: FindingTier = f.tier === 'interaction' ? 'caution' : (f.tier as FindingTier);
        if (tier === 'ok') continue;
        upgrade(f.ingredientName, {
          tier,
          text: `${f.limitName} — ${f.hazard}`,
          citation: `${f.authority} ${f.citation}`,
          suggestedFix: f.mitigation,
        });
      }

      // Compatibility (pairwise interactions, capsule-shell, packaging)
      const compatFindings = checkCompatibility(ingredients, {
        deliveryForm: suppDeliveryForm,
        capsuleShell: suppDeliveryForm === 'softgel' || suppDeliveryForm === 'capsule' ? 'gelatin' : 'none',
        hasDesiccant: suppDesiccant,
        hasNitrogenFlush: suppNitrogen,
        hasAmberPackaging: suppAmberPkg,
        storage: suppStorage,
      });
      for (const f of compatFindings) {
        // Compatibility 'info' tier doesn't map cleanly onto the ladder; surface as 'caution'.
        const tier: FindingTier = f.tier === 'info' ? 'caution' : (f.tier as FindingTier);
        for (const ingName of f.ingredients) {
          upgrade(ingName, {
            tier,
            text: `${f.title} — ${f.issue}`,
            citation: f.citation,
            suggestedFix: f.remedy,
          });
        }
      }

      // NDI compliance
      const ndi = analyzeNDI(ingredients.map(i => i.name));
      for (const f of ndi.findings) {
        if (f.status === 'required') {
          upgrade(f.ingredientName, {
            tier: 'critical',
            text: f.advisory,
            citation: 'DSHEA §8 · 21 CFR 190.6',
            suggestedFix: 'File a 75-day NDI notification with FDA before marketing, or substitute a notified / pre-1994 form of the ingredient.',
          });
        } else if (f.status === 'unknown') {
          upgrade(f.ingredientName, {
            tier: 'unknown',
            text: f.advisory,
            citation: 'DSHEA §8 · 21 CFR 190.6',
          });
        }
      }
    }

    return result;
  })();

  // HACCP suggested category — derived from active vertical + product type tags + live specs +
  // spec-estimator product classification (the authoritative food-pathway signal).
  const currentProductTypeDef = productType ? PRODUCT_TYPES.find(p => p.name === productType) : undefined;
  const suggestedHaccp = suggestHaccpCategory(
    currentProductTypeDef?.tags,
    { pH: specs.pH, aw: specs.aw, productClassification: specs.productClassification },
    mode
  );
  /** Safety-critical mismatch between product-type tags and actual computed specs. */
  const haccpMismatch = detectSpecTagMismatch(
    currentProductTypeDef?.tags,
    { pH: specs.pH, aw: specs.aw },
  );
  // Scheduled-process filing determination + default QA tests.
  // Round 11 Phase 3 Workstream A.5 [2/N] (#25g closure): mode threaded
  // through so supplement-mode returns 21 CFR 111 / DSHEA citations
  // rather than F&B 21 CFR 113 / 114 fallback. Mode narrowed from the
  // broader ModeId union to the filing engine's 'fb' | 'supplements'
  // union (other ModeId verticals pass through as F&B for now).
  const filingReq = determineFilingRequirement(
    suggestedHaccp?.id || null,
    {
      pH: specs.pH,
      aw: specs.aw,
      lowAcidComponentPct: specs.lowAcidComponentPct,
      productClassification: specs.productClassification,
    },
    mode === 'supplements' ? 'supplements' : 'fb',
  );
  const defaultQaTests = defaultQaTestsForCategory(suggestedHaccp?.id || null);
  const mergedQaTests: QaTest[] = [...defaultQaTests, ...customQaTests];

  // Nutrition values in `nutrition` are summed totals for the entire batch
  // (each ingredient contributes its per-100g × (qty/100)).
  // To render per-serving on the FDA label, scale by servingSize / batchWeight.
  const scale = computePerServingScale({ mode, servingSizeInGrams, totalBatchGrams });
  /** Raw per-serving amount for a nutrient (no rounding — use fdaRound* for display). */
  const perServing = (val: number) => val * scale;
  /** Raw %DV (0-100+) for a nutrient with a valid DV. Returns 0 when DV is 0. */
  const rawPct = (val: number, dv: number) => dv > 0 ? (val * scale / dv) * 100 : 0;

  const addIngredient = () => {
    if (!newIngredient || !newQty) { alert('Please enter both ingredient name and quantity'); return; }
    const newItem: Ingredient = { name: newIngredient.trim(), qty: parseFloat(newQty) || 0, unit: newUnit, foodData: selectedFood || null, subIngredients: selectedFood?.subIngredients || [], allergens: selectedFood?.allergens || detectAllergenStrings(newIngredient), costPerKg: selectedFood?.costPerKg || 0, supplier: selectedFood?.supplier || '' };
    const updated = [...ingredients, newItem];
    setIngredients(updated); recalculate(updated);
    setNewIngredient(''); setNewQty(''); setSelectedFood(null);
  };

  const updateQuantity = (i: number, val: string) => { const u = [...ingredients]; if (u[i]) { u[i].qty = parseFloat(val) || 0; setIngredients(u); recalculate(u); } };
  const updateName = (i: number, val: string) => { const u = [...ingredients]; if (u[i]) { u[i].name = val; setIngredients(u); recalculate(u); } };
  // Round 11 Phase 3 (2026-05-17) — Bug 2 closure: Current Formulation row
  // unit dropdown. Changing the unit auto-converts the qty value to
  // preserve operator-intended mass (e.g., 500 mg → switch to g → 0.5 g).
  // Canonical grams stays the same; only the display unit + numeric value
  // adapt. Operator can then edit qty afterward if they want to redefine.
  const updateUnit = (i: number, newUnit: string) => {
    const u = [...ingredients];
    if (!u[i]) return;
    const oldUnit = u[i].unit;
    const grams = u[i].qty * (UNIT_TO_GRAMS[oldUnit] || 1);
    const newQty = grams / (UNIT_TO_GRAMS[newUnit] || 1);
    u[i] = { ...u[i], qty: newQty, unit: newUnit };
    setIngredients(u);
    recalculate(u);
  };
  const updateCost = (i: number, val: string) => { const u = [...ingredients]; if (u[i]) { u[i].costPerKg = parseFloat(val) || 0; setIngredients(u); recalculate(u); } };
  /** Change the supplier name on an ingredient (propagates to subsequent Cost Tool + Sourcing lookups). */
  const updateSupplier = (i: number, supplier: string) => {
    const u = [...ingredients];
    if (u[i]) { u[i].supplier = supplier; setIngredients(u); recalculate(u); }
  };
  /**
   * Apply a supplier's registry price modifier to an ingredient's cost.
   * Uses the current ingredient's DB baseline cost as the reference —
   * so the modifier compounds from the canonical baseline, not whatever the user last typed.
   */
  const applySupplierFromRegistry = (i: number, supplierName: string) => {
    const u = [...ingredients];
    if (!u[i]) return;
    const info = getSupplierInfo(supplierName);
    // Reference cost = the DB's original cost for this ingredient
    const dbCost = u[i].foodData?.type === 'industrial'
      ? ((u[i].foodData.data as IndustrialIngredient).costPerKg || u[i].costPerKg)
      : u[i].costPerKg;
    u[i].supplier = supplierName;
    u[i].costPerKg = Math.round(dbCost * info.priceModifier * 100) / 100;
    setIngredients(u);
    recalculate(u);
  };
  const updateSubIngredients = (i: number, val: string) => { const u = [...ingredients]; if (u[i]) { u[i].subIngredients = val.split(',').map(s => s.trim()).filter(Boolean); setIngredients(u); recalculate(u); } };
  /** Reset an ingredient's sub-ingredient statement to the database default for that SKU. */
  const resetSubIngredients = (i: number) => {
    const u = [...ingredients];
    const ing = u[i];
    if (!ing) return;
    const dbDefault: string[] = ing.foodData?.type === 'industrial'
      ? (ing.foodData?.data?.subIngredients || [])
      : [];
    ing.subIngredients = [...dbDefault];
    setIngredients(u);
    recalculate(u);
  };
  const removeIngredient = (i: number) => { const u = ingredients.filter((_, idx) => idx !== i); setIngredients(u); recalculate(u); };

  /**
   * Convert every ingredient currently in a volume unit (cup, tsp, tbsp, fl oz,
   * ml, L, pt, qt, gal) into grams using its density lookup. Non-destructive
   * for ingredients already in weight units.
   */
  const convertVolumesToGrams = () => {
    let converted = 0;
    const updated = ingredients.map(ing => {
      if (VOLUME_UNITS.has(ing.unit)) {
        const ml = ing.qty * VOLUME_TO_ML[ing.unit];
        const density = lookupDensity(ing.name);
        const grams = Math.round(ml * density * 100) / 100;
        converted++;
        return { ...ing, qty: grams, unit: 'g' };
      }
      return ing;
    });
    if (converted > 0) {
      setIngredients(updated);
      recalculate(updated);
      setSaveMessage(`✓ Converted ${converted} volume measurement${converted > 1 ? 's' : ''} to grams using ingredient density.`);
      setTimeout(() => setSaveMessage(''), 4000);
    } else {
      setSaveMessage('No volume measurements in this formulation — everything is already in weight units.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  /**
   * Print just the Label card (Nutrition Facts + Ingredient Statement + Allergen Statement).
   * Toggles a body class that the print stylesheet uses to hide everything else,
   * then triggers window.print(). Most browsers offer "Save as PDF" as a print destination.
   *
   * Per launch-blocker #2 Phase 3 2026-05-25 — FALCPA species-naming hard-stop
   * gate fires BEFORE export when species-required categories (Tree Nuts, Fish,
   * Crustacean Shellfish) are detected via generic terms without naming species
   * per 21 CFR 101.36(b)(1)(i)(B). Operator override is offered (allergen
   * declaration is operator's regulatory responsibility; platform flags + refuses
   * default but does not block override). Override = label-compliance risk on
   * operator, documented in the confirm-dialog text + via [[harm-critical-floor]]
   * doctrine. Production future maturation: replace window.confirm with custom
   * modal + capture override rationale in audit trail.
   */
  const printLabel = () => {
    // FALCPA species-naming hard-stop gate per 21 CFR 101.36(b)(1)(i)(B).
    const gate = evaluateAllergenGate({ allergenMatches: allergenStatement });
    if (isHardStop(gate)) {
      const violationLines = gate.evidence
        .map((e, i) => `${i + 1}. ${e.subject} — ${e.detail}`)
        .join('\n');
      const overrideConfirmed = window.confirm(
        `⚠ FALCPA SPECIES-NAMING GATE FIRED — REFUSE TO EXPORT (default)\n\n` +
        `${gate.reason}\n\n` +
        `${violationLines}\n\n` +
        `Citation: ${B1_ALLERGEN_CITATION_LOCAL}\n\n` +
        `Override (proceed with print anyway) = label-compliance risk on operator. ` +
        `Recommended: cancel + return to Build Base Sheet + correct catalog ingredient ` +
        `data so species name appears (e.g., 'Coconut' not 'Tree Nuts').\n\n` +
        `Press OK to OVERRIDE and print anyway. Press Cancel to refuse the print (recommended).`
      );
      if (!overrideConfirmed) return;
    }
    document.body.classList.add('print-label-only');
    const cleanup = () => {
      document.body.classList.remove('print-label-only');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    // Safety: some browsers don't fire afterprint reliably if dialog is cancelled fast
    setTimeout(cleanup, 3000);
  };

  // Local citation constant inlined to avoid cross-module re-export for a single
  // user-facing string; mirrors B1_ALLERGEN_CITATION from lib/supplementAllergen.ts.
  // If this string drifts, the lib-module constant is the source of truth.
  const B1_ALLERGEN_CITATION_LOCAL = '21 CFR 101.36(b)(1)(i)(B); FALCPA + FASTER Act';

  /**
   * Reset the formulation to an empty state. Does NOT clear product type,
   * packaging choices, or formulation name — those are user-selected context
   * that survives across ingredient edits.
   */
  const clearFormulation = () => {
    setIngredients([]);
    setNutrition(emptyNutrition());
    setIngredientStatement('');
    setAllergenStatement([]);
    setSelectedFood(null);
    setSaveMessage('');
  };

  const applyParsedRows = () => {
    const toAdd = parsedRows.filter(r => r.accepted && r.matchedItem);
    if (toAdd.length === 0) return;
    const newIngs: Ingredient[] = toAdd.map(r => ({
      name: r.matchedItem!.name,
      qty: r.parsedQty,
      unit: r.parsedUnit,
      foodData: {
        type: 'industrial',
        data: r.matchedItem,
        subIngredients: r.matchedItem!.subIngredients,
        allergens: r.matchedItem!.allergens,
        costPerKg: r.matchedItem!.costPerKg,
        supplier: r.matchedItem!.suppliers[0],
        nutrition: r.matchedItem!.nutrition,
      },
      subIngredients: r.matchedItem!.subIngredients,
      allergens: r.matchedItem!.allergens,
      costPerKg: r.matchedItem!.costPerKg,
      supplier: r.matchedItem!.suppliers[0],
    }));
    // If replace is on AND there's an existing formulation, start fresh.
    const base = (replaceOnPaste && ingredients.length > 0) ? [] : ingredients;
    const updated = [...base, ...newIngs];
    setIngredients(updated);
    recalculate(updated);
    setShowPaste(false);
    setPasteText('');
    setParsedRows([]);
  };

  /**
   * Increment a semantic version. `level` determines how:
   *  - 'patch' → 1.0.0 → 1.0.1 (small tweak)
   *  - 'minor' → 1.0.0 → 1.1.0 (meaningful change — added/removed ingredient, spec shift)
   *  - 'major' → 1.0.0 → 2.0.0 (fundamental change — allergen added, category change)
   */
  const bumpVersion = (current: string, level: 'patch' | 'minor' | 'major'): string => {
    const parts = current.split('.').map(n => parseInt(n, 10));
    const [maj, min, pat] = parts.length === 3 ? parts : [1, 0, 0];
    if (level === 'major') return `${maj + 1}.0.0`;
    if (level === 'minor') return `${maj}.${min + 1}.0`;
    return `${maj}.${min}.${pat + 1}`;
  };

  /**
   * Compare two ingredient arrays and infer the smallest version level
   * required. Used when a user saves a new version without manually
   * specifying the level.
   */
  const inferVersionLevel = (
    oldIngs: Ingredient[],
    newIngs: Ingredient[],
  ): 'patch' | 'minor' | 'major' => {
    const oldNames = new Set(oldIngs.map(i => i.name));
    const newNames = new Set(newIngs.map(i => i.name));
    const added = [...newNames].filter(n => !oldNames.has(n));
    const removed = [...oldNames].filter(n => !newNames.has(n));
    // Major: allergen was added/removed (changes label)
    const oldAllergens = new Set(oldIngs.flatMap(i => i.allergens));
    const newAllergens = new Set(newIngs.flatMap(i => i.allergens));
    if ([...oldAllergens].some(a => !newAllergens.has(a)) ||
        [...newAllergens].some(a => !oldAllergens.has(a))) return 'major';
    // Minor: ingredient added or removed (changes ingredient statement)
    if (added.length > 0 || removed.length > 0) return 'minor';
    // Patch: same ingredients, just qty tweaks
    return 'patch';
  };

  const saveFormulation = () => {
    if (!formulationName.trim()) { alert('Please enter a name'); return; }
    if (ingredients.length === 0) { alert('Add at least one ingredient'); return; }
    // Round 10 Path A-2 (2026-05-15): required-at-creation enforcement. A
    // formulation cannot exist without a productClass — saveFormulation()
    // refuses to persist unset state. This is the load-bearing UX gate:
    // even if the user never interacts with the productClass selector, the
    // first save attempt forces an explicit selection. Mirrors the directive's
    // "no silent-wrong-gate" discipline at the persistence layer.
    if (!productClass) {
      alert('Please select a Product Class before saving. Required for chemical-safety compliance routing.');
      return;
    }

    // Check if an existing formula with this name exists → version it
    const existing = savedFormulations.find(f => f.name === formulationName.trim());
    const now = new Date().toISOString();
    const nowHuman = new Date().toLocaleDateString();

    if (existing) {
      // Create a new version — preserve any existing status, user may update via UI
      const lastVersion = existing.currentVersion || '1.0.0';
      const previousIngredients = existing.versions?.[existing.versions.length - 1]?.ingredients || existing.ingredients;
      const level = inferVersionLevel(previousIngredients, ingredients);
      const newVersion = bumpVersion(lastVersion, level);

      const reason = window.prompt(
        `Saving new version (${lastVersion} → ${newVersion}).\n\nReason for change (optional, but strongly recommended for audit trail):`,
        '',
      ) || 'No reason provided';

      const snapshot = {
        version: newVersion,
        timestamp: now,
        author: 'Formulator', // TODO: pull from auth when user accounts exist
        reasonForChange: reason,
        ingredients: [...ingredients],
        servingSize, servingUnit, packageSize, packageUnit,
        packagingName: selectedPackaging?.name || null,
        closureName: selectedClosure?.name || null,
        productType: productType || null,
        // Round 10 Path A-2: productClass captured in each version snapshot for
        // audit-trail integrity. Existing formulations migrated forward retain
        // their per-version productClass once set; pre-Path-A versions show
        // productClass undefined.
        productClass,
        // Base Sheet schema lock (2026-05-25): every version snapshot pins its
        // catalog state. Pre-versioning-infra default is legacy-pre-schema-lock;
        // graduates to 'version-pin' when catalog versioning lands.
        catalogSnapshot: { kind: 'legacy-pre-schema-lock' as const },
      };

      const updated: SavedFormulation = {
        ...existing,
        ingredients: [...ingredients],
        servingSize, servingUnit, packageSize, packageUnit,
        packagingName: selectedPackaging?.name || null,
        closureName: selectedClosure?.name || null,
        productType: productType || null,
        productClass,
        lastModified: now,
        currentVersion: newVersion,
        versions: [...(existing.versions || []), snapshot],
        status: formulaStatus,
        // Preserve the original part number across versions (version string conveys revisions).
        // Allow user-visible override if the editor has entered a different one.
        partNumber: partNumber.trim() || existing.partNumber,
      };
      setSavedFormulations(savedFormulations.map(f => f.id === existing.id ? updated : f));
      setSaveMessage(`✅ "${formulationName}" updated to v${newVersion} (${level})`);
      setTimeout(() => setSaveMessage(''), 4000);
      return;
    }

    // Brand-new formulation at v1.0.0. Per Base Sheet schema lock
    // (2026-05-25), every save carries a catalogSnapshot reference;
    // until catalog versioning infrastructure lands the variant is
    // 'legacy-pre-schema-lock' — see types/index.ts CatalogSnapshotRef.
    const legacyCatalogSnapshot = { kind: 'legacy-pre-schema-lock' as const };
    const firstSnapshot = {
      version: '1.0.0',
      timestamp: now,
      author: 'Formulator',
      reasonForChange: 'Initial creation',
      ingredients: [...ingredients],
      servingSize, servingUnit, packageSize, packageUnit,
      packagingName: selectedPackaging?.name || null,
      closureName: selectedClosure?.name || null,
      productType: productType || null,
      productClass,
      catalogSnapshot: legacyCatalogSnapshot,
    };
    // Auto-generate a part number if the user hasn't supplied one.
    const assignedPartNumber = partNumber.trim() || generatePartNumber(mode, savedFormulations);
    const newSave: SavedFormulation = {
      // eslint-disable-next-line react-hooks/purity -- saveFormulation is an event handler, not called during render
      id: Date.now().toString(),
      name: formulationName.trim(),
      mode,
      productType: productType || null,
      productClass,
      ingredients: [...ingredients],
      servingSize, servingUnit, packageSize, packageUnit,
      packagingName: selectedPackaging?.name || null,
      closureName: selectedClosure?.name || null,
      createdAt: nowHuman,
      lastModified: now,
      currentVersion: '1.0.0',
      versions: [firstSnapshot],
      status: formulaStatus,
      partNumber: assignedPartNumber,
      catalogSnapshot: legacyCatalogSnapshot,
    };
    setSavedFormulations([...savedFormulations, newSave]);
    setPartNumber(assignedPartNumber);
    setSaveMessage(`✅ "${formulationName}" saved as ${assignedPartNumber} (v1.0.0)`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const loadFormulation = (f: SavedFormulation) => {
    // Switch vertical first so all downstream derived data (product types,
    // ingredient/packaging DBs) matches what was saved.
    if (f.mode && f.mode !== mode) setMode(f.mode);
    setIngredients(f.ingredients); setServingSize(f.servingSize); setServingUnit(f.servingUnit);
    setPackageSize(f.packageSize); setPackageUnit(f.packageUnit); setFormulationName(f.name);
    setProductType(f.productType || '');
    // Round 10 Path A-2: restore productClass from saved record. Pre-Path-A
    // saves have no productClass field — set to '' (unset) so the user is
    // prompted to select before next save. Bypass the change-event confirm
    // dialog since load is not a user-initiated context shift.
    setProductClassState(f.productClass || '');
    setSelectedPackaging(f.packagingName ? PACKAGING_DB.find(p => p.name === f.packagingName) || null : null);
    setSelectedClosure(f.closureName ? PACKAGING_DB.find(p => p.name === f.closureName) || null : null);
    setFormulaStatus(f.status || 'draft');
    setPartNumber(f.partNumber || '');
    recalculate(f.ingredients); setActiveTab('build');
  };

  const filteredDB = INDUSTRIAL_DB.filter(i => {
    const matchCat = dbCategory === 'All' || i.category === dbCategory;
    const matchSearch = dbSearch === '' || i.name.toLowerCase().includes(dbSearch.toLowerCase()) || i.notes.toLowerCase().includes(dbSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ══════════════════════════════════════════════════════════════════
          MODE SELECTION SCREEN (pre-TOS, first visit or post-migration)
          Round 11 Phase 3 Workstream A. User selects vertical
          (Dietary Supplement / Food & Beverage) before any TOS modal.
          F&B is non-selectable for Round 11 (Nutraceuticals-first launch
          per Round 11 directive launch profile); Q4 2026 enables F&B.
          ══════════════════════════════════════════════════════════════════ */}
      {entryScreen?.screen === 'mode-selection' && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <NautilusMark size={52} />
              <div>
                <h2 className="text-2xl font-semibold text-emerald-700">
                  formulation<span className="text-gray-500 font-light tracking-[0.3em] ml-2 text-base uppercase">wizard</span>
                </h2>
                <p className="text-xs text-gray-500 italic">Choose your workspace.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-5 leading-relaxed">
              Formulation Wizard supports two product verticals with distinct regulatory frameworks. Select the workspace that matches your product class.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dietary Supplement — selectable */}
              <button
                onClick={() => selectInitialMode('supplements')}
                className="text-left p-5 rounded-lg border-2 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">💊</span>
                  <span className="font-semibold text-gray-900">Dietary Supplement</span>
                </div>
                <p className="text-xs text-gray-600 leading-snug">
                  Capsules, tablets, softgels, gummies, powders, liquids. DSHEA / 21 CFR 111 cGMP / FALCPA framework.
                </p>
              </button>
              {/* F&B — non-selectable in Round 11; Coming Q4 2026 */}
              <button
                disabled
                aria-disabled="true"
                className="text-left p-5 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">🏭</span>
                  <span className="font-semibold text-gray-500">Food and Beverage</span>
                </div>
                <p className="text-xs text-gray-500 leading-snug">
                  Sauces, condiments, beverages, snacks. 21 CFR 113 LACF / 114 Acidified / 117 PCQI framework.
                </p>
                <p className="mt-2 text-[11px] font-semibold text-amber-700">Coming Q4 2026</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          F&B-MODE TERMS OF USE + LIABILITY ACKNOWLEDGMENT
          Round 11 Phase 3 Workstream A: original F&B-shaped inline content
          preserved verbatim per directive (no F&B content changes for
          Round 11; substantive rewrite + migration to lib/foodTos.ts
          sibling module deferred to Q4 F&B re-entry along with key
          rename fw-tos-v1 → fw-tos-fnb-v1).
          ══════════════════════════════════════════════════════════════════ */}
      {entryScreen?.screen === 'tos-modal' && entryScreen.mode === 'fb' && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <NautilusMark size={52} />
              <div>
                <h2 className="text-2xl font-semibold text-emerald-700">
                  formulation<span className="text-gray-500 font-light tracking-[0.3em] ml-2 text-base uppercase">wizard</span>
                </h2>
                <p className="text-xs text-gray-500 italic">Welcome — please review before using the tool.</p>
              </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-bold text-amber-900 mb-2 inline-flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>This is a decision-support tool, not a substitute for qualified professional review.</span>
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                Formulation Wizard computes regulatory classifications (Acid, Acidified, LACF, Shelf-Stable Dry), suggests HACCP categories, generates filing-requirement indicators, and validates nutrition claims based on published FDA regulations. These outputs are <strong>advisory and educational only</strong>.
              </p>
            </div>

            <div className="text-xs text-gray-700 space-y-2 mb-4 max-h-64 overflow-auto">
              <p><strong>1. No Legal or Regulatory Advice.</strong> Nothing in this tool constitutes legal, regulatory, scientific, medical, or engineering advice. Outputs are algorithmic estimates based on user-entered data and published FDA / USDA regulations. Compliance with 21 CFR 113 (LACF), 21 CFR 114 (Acidified Foods), 21 CFR 117 (Preventive Controls), and all other applicable regulations is the sole responsibility of the user.</p>

              <p><strong>2. Process Authority Review Required.</strong> Any product requiring FDA Scheduled Process filing (21 CFR 113, 114) <strong>MUST</strong> be reviewed by a qualified Process Authority (defined in 21 CFR 113.83 / 114.83) before commercial production. The tool&apos;s classification and filing-requirement outputs are starting points for that review, not substitutes for it. A directory of Process Authorities is available under the ⚖️ Process Authorities tab.</p>

              <p><strong>3. User Responsibility.</strong> You are responsible for: (a) the accuracy of formula data you input, (b) verifying all pH, a<sub>w</sub>, moisture, and microbiological values in an accredited laboratory before production, (c) engaging a Process Authority and qualified regulatory/food-safety professionals (PCQI, HACCP-certified supervisor, etc.), (d) confirming all label claims against current FDA regulations, (e) verifying supplier certifications with the actual supplier before contracting.</p>

              <p><strong>4. No Warranty.</strong> This tool is provided &ldquo;as is&rdquo; without warranty of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. The authors and operators make no representation that outputs are error-free, complete, or current.</p>

              <p><strong>5. Limitation of Liability.</strong> To the maximum extent permitted by law, the tool&apos;s authors, operators, and affiliates shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of this tool, including but not limited to regulatory non-compliance, product recalls, consumer injury, economic loss, or enforcement actions.</p>

              <p><strong>6. Third-Party Information.</strong> Supplier names, certifications, cost estimates, and Process Authority contact information are compiled from public sources and may be outdated or inaccurate. Verify directly with the supplier or authority before relying on this information.</p>

              <p><strong>7. Intended Audience.</strong> This tool is designed for qualified food scientists, product developers, R&amp;D teams, and regulatory professionals. It is not intended for home cooks, amateur fermenters, or consumers preparing food for themselves or others outside of a properly regulated commercial setting.</p>

              <p><strong>8. Acknowledgment.</strong> By clicking &ldquo;I Understand,&rdquo; you acknowledge you have read and understand these terms and will engage appropriate qualified professionals for all regulatory filings and production decisions.</p>
            </div>

            <button
              onClick={acceptTosForCurrentMode}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              ✓ I Understand — This Tool is Advisory Only
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SUPPLEMENT-MODE TERMS OF USE (fw-tos-supp-v1)
          Round 11 Phase 3 Workstream A. Renders the locked text from
          lib/supplementTos.ts. Frozen-snapshot test at
          lib/__tests__/supplement-tos.test.ts is the change-control
          gate — modifications to text fail the test until snapshot is
          deliberately updated per the documented process.
          ══════════════════════════════════════════════════════════════════ */}
      {entryScreen?.screen === 'tos-modal' && entryScreen.mode === 'supplements' && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <NautilusMark size={52} />
              <div>
                <h2 className="text-2xl font-semibold text-emerald-700">
                  formulation<span className="text-gray-500 font-light tracking-[0.3em] ml-2 text-base uppercase">wizard</span>
                </h2>
                <p className="text-xs text-gray-500 italic">{SUPP_TOS_WELCOME_SUBTITLE}</p>
              </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-bold text-amber-900 mb-2 inline-flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>{SUPP_TOS_WARNING_HEADING}</span>
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                {SUPP_TOS_WARNING_BODY}
              </p>
            </div>

            <div className="text-xs text-gray-700 space-y-2 mb-4 max-h-64 overflow-auto">
              {SUPP_TOS_V1_SECTIONS.map(section => (
                <p key={section.id}>
                  <strong>{section.heading}</strong> {section.body}
                </p>
              ))}
            </div>

            <button
              onClick={acceptTosForCurrentMode}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
            >
              {SUPP_TOS_ACKNOWLEDGMENT_BUTTON}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          COMMAND PALETTE (⌘K / Ctrl+K)
          Global search + quick actions overlay. Searches formulas,
          ingredients, suppliers, Process Authorities, and tab nav.
          ══════════════════════════════════════════════════════════════════ */}
      {cmdPaletteOpen && (() => {
        const q = cmdPaletteQuery.toLowerCase().trim();
        // Build search indices for each result type
        type CmdResult = {
          type: 'tab' | 'action' | 'formula' | 'ingredient' | 'supplier' | 'authority';
          icon: ReactNode;
          label: string;
          sublabel?: string;
          onSelect: () => void;
        };

        const results: CmdResult[] = [];

        // ─── Static tab nav + quick actions ───
        const tabs: { id: typeof activeTab; label: string; icon: string }[] = [
          { id: 'build', label: 'Build Base Sheet', icon: '🔬' },
          { id: 'cost', label: 'Cost Tool', icon: '💰' },
          { id: 'sourcing', label: 'Sourcing', icon: '🌐' },
          { id: 'batch', label: 'Batch Sheet', icon: '🏭' },
          { id: 'filing', label: 'Filing', icon: '📋' },
          { id: 'services', label: 'Services', icon: '🤝' },
          { id: 'authorities', label: 'Process Authorities', icon: '⚖️' },
          { id: 'saved', label: 'Saved Formulas', icon: '💾' },
          { id: 'database', label: 'Ingredient Library', icon: '📦' },
        ];
        tabs.forEach(t => {
          if (!q || t.label.toLowerCase().includes(q)) {
            results.push({
              type: 'tab',
              icon: t.icon,
              label: `Go to ${t.label}`,
              sublabel: 'Navigation',
              onSelect: () => { setActiveTab(t.id); setCmdPaletteOpen(false); },
            });
          }
        });

        // Quick actions
        const actions: { label: string; icon: ReactNode; run: () => void }[] = [
          { label: 'New formula (clear current)', icon: '✨', run: () => { setIngredients([]); setFormulationName(''); setProductClassState(''); setFormulaStatus('draft'); setActiveTab('build'); } },
          { label: 'Open bulk paste', icon: '📋', run: () => { setShowPaste(true); setActiveTab('build'); } },
          { label: 'Save current formula', icon: '💾', run: () => { saveFormulation(); } },
          { label: 'Compare saved formulas', icon: '🔀', run: () => { setActiveTab('saved'); } },
          { label: 'Toggle appearance mode', icon: '🌓', run: () => { setAppearance(appearance === 'light' ? 'dim' : appearance === 'dim' ? 'dark' : 'light'); } },
          { label: 'Review Terms of Use', icon: <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />, run: () => { revokeTosForCurrentMode(); } },
        ];
        actions.forEach(a => {
          if (!q || a.label.toLowerCase().includes(q)) {
            results.push({
              type: 'action',
              icon: a.icon,
              label: a.label,
              sublabel: 'Quick Action',
              onSelect: () => { a.run(); setCmdPaletteOpen(false); },
            });
          }
        });

        // ─── Saved formulas ───
        savedFormulations.forEach(f => {
          if (!q || f.name.toLowerCase().includes(q)) {
            results.push({
              type: 'formula',
              icon: '💾',
              label: f.name,
              sublabel: `v${f.currentVersion || '1.0.0'} • ${MODES[f.mode || 'fb']?.name || f.mode || ''} • ${f.ingredients.length} ingredients`,
              onSelect: () => { loadFormulation(f); setCmdPaletteOpen(false); },
            });
          }
        });

        // ─── Ingredients (current mode's DB, limit to 15 matches) ───
        if (q) {
          const matchedIngredients = INDUSTRIAL_DB
            .filter(i => i.name.toLowerCase().includes(q))
            .slice(0, 15);
          matchedIngredients.forEach(ing => {
            results.push({
              type: 'ingredient',
              icon: '🧪',
              label: ing.name,
              sublabel: `${ing.category} • $${ing.costPerKg.toFixed(2)}/kg • ${ing.suppliers[0] || '—'}`,
              onSelect: () => {
                setActiveTab('build');
                setNewIngredient(ing.name);
                setSelectedFood({ type: 'industrial', data: ing, subIngredients: ing.subIngredients, allergens: ing.allergens, costPerKg: ing.costPerKg, supplier: ing.suppliers[0], nutrition: ing.nutrition });
                setCmdPaletteOpen(false);
              },
            });
          });
        }

        // ─── Suppliers (unique names from registry) ───
        if (q) {
          const supplierNames = new Set<string>();
          INDUSTRIAL_DB.forEach(i => i.suppliers?.forEach(s => supplierNames.add(s)));
          Array.from(supplierNames)
            .filter(s => s.toLowerCase().includes(q))
            .slice(0, 10)
            .forEach(s => {
              const info = getSupplierInfo(s);
              results.push({
                type: 'supplier',
                icon: '🏭',
                label: s,
                sublabel: `${info.country} • ${info.tier} • ${info.certs.length} certs`,
                onSelect: () => { setActiveTab('sourcing'); setCmdPaletteOpen(false); },
              });
            });
        }

        // ─── Process Authorities ───
        if (q) {
          PROCESS_AUTHORITIES
            .filter(pa => pa.name.toLowerCase().includes(q) || (pa.city || '').toLowerCase().includes(q) || pa.specialty.some(sp => sp.toLowerCase().includes(q)))
            .slice(0, 10)
            .forEach(pa => {
              results.push({
                type: 'authority',
                icon: '⚖️',
                label: pa.name,
                sublabel: `${pa.city ? pa.city + ', ' : ''}${pa.state} • ${PA_TYPE_LABELS[pa.type]}`,
                onSelect: () => {
                  setActiveTab('authorities');
                  setPaSearch(pa.name);
                  setCmdPaletteOpen(false);
                },
              });
            });
        }

        // Clamp selected index
        const maxIdx = Math.max(0, results.length - 1);
        const safeIdx = Math.min(cmdPaletteSelectedIndex, maxIdx);

        const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setCmdPaletteSelectedIndex(prev => Math.min(prev + 1, maxIdx));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCmdPaletteSelectedIndex(prev => Math.max(prev - 1, 0));
          } else if (e.key === 'Enter' && results[safeIdx]) {
            e.preventDefault();
            results[safeIdx].onSelect();
          }
        };

        return (
          <div className="fixed inset-0 bg-black/50 z-[90] flex items-start justify-center pt-24 p-4" onClick={() => setCmdPaletteOpen(false)}>
            <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" />
                </svg>
                <input
                  ref={cmdInputRef}
                  type="text"
                  value={cmdPaletteQuery}
                  onChange={e => { setCmdPaletteQuery(e.target.value); setCmdPaletteSelectedIndex(0); }}
                  onKeyDown={handleKey}
                  placeholder="Search formulas, ingredients, suppliers, Process Authorities, or type a command…"
                  className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400"
                />
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono text-gray-500 shrink-0">Esc</kbd>
              </div>

              {/* Results list */}
              <div className="max-h-96 overflow-auto">
                {results.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    {q ? `No matches for "${q}"` : 'Type to search'}
                  </div>
                ) : (
                  <div className="py-1">
                    {(() => {
                      // Group by type with headers
                      const groups: Record<string, CmdResult[]> = {};
                      results.forEach(r => {
                        const key = r.sublabel?.split('•')[0].trim() || r.type;
                        const groupLabel =
                          r.type === 'tab' ? 'Navigation' :
                          r.type === 'action' ? 'Quick Actions' :
                          r.type === 'formula' ? 'Saved Formulas' :
                          r.type === 'ingredient' ? 'Ingredients' :
                          r.type === 'supplier' ? 'Suppliers' :
                          r.type === 'authority' ? 'Process Authorities' : key;
                        if (!groups[groupLabel]) groups[groupLabel] = [];
                        groups[groupLabel].push(r);
                      });

                      let flatIdx = 0;
                      return Object.entries(groups).map(([groupLabel, items]) => (
                        <div key={groupLabel} className="mb-1">
                          <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-gray-400 font-semibold bg-gray-50 border-b border-gray-100">{groupLabel}</div>
                          {items.map((r, localIdx) => {
                            const idx = flatIdx++;
                            const isSelected = idx === safeIdx;
                            return (
                              <button
                                key={`${groupLabel}-${localIdx}`}
                                onClick={() => r.onSelect()}
                                onMouseEnter={() => setCmdPaletteSelectedIndex(idx)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${
                                  isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <span className="text-base w-5 h-5 inline-flex items-center justify-center shrink-0">{r.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm truncate ${isSelected ? 'text-emerald-800 font-semibold' : 'text-gray-800'}`}>{r.label}</div>
                                  {r.sublabel && <div className="text-[10px] text-gray-500 truncate">{r.sublabel}</div>}
                                </div>
                                {isSelected && (
                                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono text-gray-500 shrink-0">↵</kbd>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* Footer hints */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50 text-[10px] text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><kbd className="px-1 bg-white border border-gray-300 rounded font-mono">↑↓</kbd> navigate</span>
                  <span className="flex items-center gap-1"><kbd className="px-1 bg-white border border-gray-300 rounded font-mono">↵</kbd> select</span>
                  <span className="flex items-center gap-1"><kbd className="px-1 bg-white border border-gray-300 rounded font-mono">Esc</kbd> close</span>
                </div>
                <div className="text-gray-400">{results.length} result{results.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Header — tinted surface, generous breathing room, big wordmark */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-6 print:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex flex-col items-center text-center md:flex-row md:text-left gap-5">
              <NautilusMark size={72} />
              <div>
                <h1 className="text-4xl font-semibold text-emerald-700 tracking-tight leading-none">
                  formulation<span className="text-gray-600 font-light tracking-[0.32em] ml-2 text-2xl uppercase">wizard</span>
                </h1>
                <p className="text-gray-500 text-xs mt-2 italic max-w-xl">Formulation, labeling, and Process Authority documentation — for food and nutraceutical product developers.</p>
                <p className="text-gray-600 text-sm mt-1 font-medium">
                  {mc.icon} {mc.name}
                  <span className="text-gray-400 font-normal"> — {mc.tagline}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* ⌘K command palette hint / launcher */}
              <button
                onClick={() => setCmdPaletteOpen(true)}
                title="Open command palette (⌘K / Ctrl+K)"
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 bg-white rounded-lg text-xs text-gray-500 hover:border-emerald-400 hover:text-gray-700 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" />
                </svg>
                <span className="hidden md:inline">Search everything</span>
                <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono text-gray-600">⌘K</kbd>
              </button>

              {/* Appearance toggle — light / dim / dark */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                {(['light', 'dim', 'dark'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setAppearance(mode)}
                    title={`${mode[0].toUpperCase() + mode.slice(1)} appearance`}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 ${
                      appearance === mode
                        ? 'bg-white text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <span>{mode === 'light' ? '☀️' : mode === 'dim' ? '🌤' : '🌙'}</span>
                    <span className="capitalize hidden sm:inline">{mode}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['home', 'build', 'cost', 'sourcing', 'batch', 'filing', 'services', 'authorities', 'saved', 'database'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition text-sm ${activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {tab === 'home' ? '🏠 Home'
                    : tab === 'saved' ? `💾 Saved (${savedFormulations.length})`
                    : tab === 'database' ? '📦 Ingredient DB'
                    : tab === 'batch' ? '🏭 Batch Sheet'
                    : tab === 'filing' ? '📋 Filing'
                    : tab === 'cost' ? '💰 Cost Tool'
                    : tab === 'sourcing' ? '🌐 Sourcing'
                    : tab === 'authorities' ? '⚖️ Process Authorities'
                    : tab === 'services' ? '🤝 Services'
                    : '🔬 Build Base Sheet'}
                </button>
              ))}
            </div>
          </div>
          {/* Mode (vertical) switcher */}
          <div className="grid grid-cols-2 gap-6">
            {MODE_ORDER.map(id => {
              const m = MODES[id];
              const isActive = mode === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    if (id === mode) return;
                    // Round 11 Phase 3 Workstream A: per-mode TOS check
                    // before any mode change. lib/modes.ts ModeId is
                    // broader than the TOS-bearing WorkspaceMode union;
                    // narrow via isWorkspaceMode. MODE_ORDER currently
                    // contains only 'fb'/'supplements' so the narrow
                    // branch is reachable in practice — the else path
                    // is forward-compat for future verticals added to
                    // MODE_ORDER before their TOS lands.
                    if (entryState !== null && isWorkspaceMode(id)) {
                      const change = checkModeChange(entryState, id);
                      if (!change.proceed) {
                        // Defer formulation reset until target TOS accepted.
                        // Persist mode preference + sync workspace mode +
                        // update entryState so the TOS modal fires.
                        if (typeof window !== 'undefined') {
                          persistMode(window.localStorage, id);
                        }
                        setMode(id);
                        setEntryState(prev => prev === null ? null : { ...prev, mode: id });
                        return;
                      }
                    }
                    if (ingredients.length > 0) {
                      const confirmed = window.confirm(
                        `Switching to ${m.name} will clear the current formulation (different ingredient database). Continue?`
                      );
                      if (!confirmed) return;
                    }
                    if (typeof window !== 'undefined' && isWorkspaceMode(id)) {
                      persistMode(window.localStorage, id);
                    }
                    setMode(id);
                    if (isWorkspaceMode(id)) {
                      setEntryState(prev => prev === null ? null : { ...prev, mode: id });
                    }
                    setIngredients([]);
                    setSelectedPackaging(null);
                    setSelectedClosure(null);
                    setProductType('');
                    setProductClassState('');
                    setFormulationName('');
                    setNutrition(emptyNutrition());
                    setIngredientStatement('');
                    setAllergenStatement([]);
                  }}
                  className={`text-left p-3 rounded-lg border-2 transition ${
                    isActive ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{m.icon}</span>
                    <span className={`font-semibold text-sm ${isActive ? 'text-emerald-800' : 'text-gray-800'}`}>{m.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">{m.tagline}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          FORMULA STATUS BAR (sticky sub-header)
          Sticky just below the main tab nav. Phase 1 contents:
            • formula name (inline editable) + version + lifecycle status
            • mode chip + cost/unit + allergen + pH chips
            • Filing-readiness % bar  (Phase 1 heuristic; Phase 4 → real checklist)
            • Issues pill (aggregate finding counts; Phase 2 → drawer)
            • Save button + Unsaved-changes indicator
          ══════════════════════════════════════════════════════════════════ */}
      {(ingredients.length > 0 || formulationName) && activeTab !== 'home' && activeTab !== 'authorities' && activeTab !== 'services' && activeTab !== 'database' && (() => {
        const existing = savedFormulations.find(f => f.name === formulationName.trim());
        const currentVersion = existing?.currentVersion;
        const lastModified = existing?.lastModified;
        const lastModifiedStr = lastModified
          ? (() => {
              const then = new Date(lastModified).getTime();
              const now = Date.now();
              const mins = Math.floor((now - then) / 60000);
              if (mins < 1) return 'Saved just now';
              if (mins < 60) return `Saved ${mins}m ago`;
              const hrs = Math.floor(mins / 60);
              if (hrs < 24) return `Saved ${hrs}h ago`;
              return `Saved ${new Date(lastModified).toLocaleDateString()}`;
            })()
          : 'Not saved yet';

        // Unsaved changes: if there's an existing save, compare to its latest version
        const hasUnsavedChanges = existing
          ? JSON.stringify(existing.ingredients) !== JSON.stringify(ingredients)
              || existing.servingSize !== servingSize
              || existing.packageSize !== packageSize
              || (existing.status || 'draft') !== formulaStatus
          : ingredients.length > 0;

        // Per-unit cost for the chip
        const packageSizeInG = packageSize * (UNIT_TO_GRAMS[packageUnit] || 1);
        const perUnitCost = totalBatchGrams > 0
          ? totalCost * (packageSizeInG / totalBatchGrams) + (selectedPackaging?.costPerUnit || 0) + (selectedClosure?.costPerUnit || 0)
          : 0;

        // Filing Readiness — pathway-aware metric (Round 9, 2026-05-09).
        // Replaces the prior Phase-1 boolean-checks heuristic that conflated spec
        // coverage with filing-distance. v1 wires Acidified Foods (21 CFR 114) only;
        // other pathways render as Surface 4 placeholders. See lib/filingReadiness.ts
        // and docs/rounds/round-9-directive.md.
        const findingTiers = Object.values(perIngredientFindings).map(f => f.tier);
        const filingReadiness = computeFilingReadiness({
          modeId: mode,
          specs,
          filing: filingReq,
          haccpInferred: suggestedHaccp !== null,
        });

        // ── Issues pill aggregate counts ──
        const issueCounts = findingTiers.reduce(
          (acc, t) => {
            if (t === 'banned' || t === 'critical') acc.critical++;
            else if (t === 'warning') acc.warnings++;
            else if (t === 'unknown') acc.unknown++;
            return acc;
          },
          { critical: 0, warnings: 0, unknown: 0 }
        );
        const totalIssues = issueCounts.critical + issueCounts.warnings + issueCounts.unknown;

        // Phase 1 click handler: scroll to the first row whose ingredient name
        // has a critical-or-banned finding. Phase 2 will replace this with the
        // Issues Tray drawer.
        const onIssuesClick = () => {
          if (totalIssues === 0) return;
          setActiveTab('build');
          // Find the first ingredient row with a critical-or-banned finding.
          const firstCriticalIdx = ingredients.findIndex(ing => {
            const f = perIngredientFindings[ing.name];
            return f && (f.tier === 'banned' || f.tier === 'critical');
          });
          // Fallback: first row with any finding.
          const fallbackIdx = ingredients.findIndex(ing => !!perIngredientFindings[ing.name]);
          const targetIdx = firstCriticalIdx >= 0 ? firstCriticalIdx : fallbackIdx;
          if (targetIdx < 0) return;
          setTimeout(() => {
            const el = document.getElementById(`ingredient-row-${targetIdx}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
        };

        const statusConfig = {
          'draft':     { label: 'Draft',     color: 'gray',    icon: '📝' },
          'in-pilot':  { label: 'In Pilot',  color: 'amber',   icon: '🧪' },
          'launched':  { label: 'Launched',  color: 'emerald', icon: '🚀' },
          'on-hold':   { label: 'On Hold',   color: 'rose',    icon: '⏸️' },
        } as const;
        const curStatus = statusConfig[formulaStatus];

        const untitledLabel = getCopy('statusBar.untitled', tier);
        const issuesLabel = getCopy('statusBar.issuesLabel', tier);
        const noIssuesLabel = getCopy('statusBar.noIssues', tier);
        const criticalShort = getCopy('statusBar.criticalShort', tier);
        const warningsShort = getCopy('statusBar.warningsShort', tier);
        const unknownShort = getCopy('statusBar.unknownShort', tier);

        return (
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-2 print:hidden">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
              {/* Left cluster — name, version, status, mode */}
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                <input
                  type="text"
                  value={formulationName}
                  onChange={e => setFormulationName(e.target.value)}
                  placeholder={untitledLabel}
                  className="font-semibold text-gray-800 text-base bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-emerald-500 focus:outline-none px-1 py-0.5 min-w-[180px] max-w-md truncate"
                />
                {currentVersion && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[11px] font-mono font-bold rounded">
                    v{currentVersion}
                  </span>
                )}
                {/* Lifecycle status pill (dropdown on click) */}
                <div className="relative">
                  <select
                    value={formulaStatus}
                    onChange={e => setFormulaStatus(e.target.value as typeof formulaStatus)}
                    className={`appearance-none pl-7 pr-6 py-1 rounded-full text-[11px] font-semibold border-2 cursor-pointer focus:outline-none transition bg-${curStatus.color}-50 border-${curStatus.color}-300 text-${curStatus.color}-700 hover:bg-${curStatus.color}-100`}
                  >
                    <option value="draft">Draft</option>
                    <option value="in-pilot">In Pilot</option>
                    <option value="launched">Launched</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none">{curStatus.icon}</span>
                  <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" />
                  </svg>
                </div>
                {mc.name && (
                  <span className="text-[11px] text-gray-500 border-l border-gray-200 pl-2 ml-1 inline-flex items-center gap-1">
                    {mc.icon} <span className="font-medium">{mc.name}</span>
                  </span>
                )}
              </div>

              {/* Right cluster — readiness, issues, metrics, save */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Filing Readiness — pathway-aware widget (Round 9). Replaces the
                    Phase-1 heuristic. Component handles its own copy, color (Round 8
                    confidence vocabulary), escalation tracking, and blocker popover. */}
                <FilingReadinessWidget result={filingReadiness} />

                {/* Status pill — Design Y state machine (per Round 1 directive 2026-05-07):
                    consumes findings PRIMARILY; the only Determination-Engine state it picks up
                    is "Pending classification" when the engine returns insufficient-data /
                    undetermined / '—'. Filing-readiness bar to the left handles the regulated-
                    pathway-completeness question separately (acidified-foods stays "No active
                    issues" if findings are clean). */}
                {(() => {
                  type StatusTone = 'emerald' | 'amber' | 'rose';
                  type Status = { label: string; tone: StatusTone; icon: typeof CheckCircle2 };
                  const status: Status = (() => {
                    if (ingredients.length === 0) {
                      return { label: noIssuesLabel, tone: 'emerald', icon: CheckCircle2 };
                    }
                    if (issueCounts.critical > 0) {
                      return { label: 'Blocked', tone: 'rose', icon: OctagonX };
                    }
                    const cls = specs.productClassification;
                    if (cls === '—' || cls === 'insufficient-data') {
                      return { label: 'Pending classification', tone: 'amber', icon: AlertCircle };
                    }
                    if (issueCounts.warnings > 0 || issueCounts.unknown > 0) {
                      return { label: 'Action required', tone: 'amber', icon: AlertTriangle };
                    }
                    return { label: noIssuesLabel, tone: 'emerald', icon: CheckCircle2 };
                  })();
                  const StatusIcon = status.icon;
                  const toneClasses = status.tone === 'rose'
                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                    : status.tone === 'amber'
                      ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700';
                  const iconColor = status.tone === 'rose'
                    ? 'text-rose-600'
                    : status.tone === 'amber'
                      ? 'text-amber-600'
                      : 'text-emerald-600';
                  // Click handler still scrolls to first critical/banned finding when there are
                  // findings; for "Pending classification" with no findings, no-op (the Determination
                  // Engine card on the Build tab is where the user sees why it can't classify).
                  const clickable = totalIssues > 0;
                  return (
                    <button
                      type="button"
                      onClick={onIssuesClick}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-semibold transition ${toneClasses}`}
                      aria-label={totalIssues > 0 ? `${issuesLabel}: ${totalIssues}` : status.label}
                      disabled={!clickable}
                    >
                      <StatusIcon className={`h-3 w-3 ${iconColor}`} aria-hidden="true" />
                      <span>{status.label}</span>
                      {issueCounts.critical > 0 && (
                        <span className="inline-flex items-center gap-0.5 ml-1 text-rose-700">
                          {issueCounts.critical} {criticalShort}
                        </span>
                      )}
                      {issueCounts.warnings > 0 && (
                        <span className="inline-flex items-center gap-0.5 ml-1 text-amber-700">
                          {issueCounts.warnings} {warningsShort}
                        </span>
                      )}
                      {issueCounts.unknown > 0 && (
                        <span className="inline-flex items-center gap-0.5 ml-1 text-amber-600">
                          {issueCounts.unknown} {unknownShort}
                        </span>
                      )}
                    </button>
                  );
                })()}

                {/* Compact metric chips — pH gets Class 1a confidence + range treatment. */}
                {specs.pH > 0 && (
                  <span className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-700 font-mono inline-flex items-center gap-1.5">
                    <span>pH {formatRangedValue('pH', specs.pH, specs.confidence.pH, 2).text}</span>
                    <ConfidencePill conf={specs.confidence.pH} size="xs" />
                  </span>
                )}
                {allergenStatement.length > 0 && (
                  <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-700 font-semibold inline-flex items-center gap-1" title={`Contains: ${allergenStatement.map(m => m.species ?? m.category).join(', ')}`}>
                    <AlertTriangle className="h-3 w-3 text-amber-600" aria-hidden="true" />
                    <span>{allergenStatement.length} allergen{allergenStatement.length !== 1 ? 's' : ''}</span>
                  </span>
                )}
                {perUnitCost > 0 && (() => {
                  // Same cost rollup confidence the Unit Economics block uses (>=5% mass threshold
                  // floor across per-ingredient costSource confidences).
                  const costContribs = ingredients.map(i => {
                    const iDb = i.foodData?.type === 'industrial' ? (i.foodData.data as IndustrialIngredient) : null;
                    return { massG: i.qty * (UNIT_TO_GRAMS[i.unit] || 1), confidence: mapCostToConfidence(iDb) };
                  });
                  const headerCostConfidence = rollupCostConfidence(costContribs);
                  const perUnitDelta = costRangedSpec(perUnitCost, headerCostConfidence).range.high - perUnitCost;
                  const dec = perUnitCost < 0.10 ? 4 : 2;
                  return (
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-700 font-mono font-semibold inline-flex items-center gap-1.5">
                      <span>${perUnitCost.toFixed(dec)} ± ${perUnitDelta.toFixed(dec)}/unit</span>
                      <ConfidencePill conf={headerCostConfidence} size="xs" />
                    </span>
                  );
                })()}
                {/* Last saved indicator */}
                <span className={`text-[11px] ${hasUnsavedChanges ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                  {hasUnsavedChanges ? '● Unsaved changes' : lastModifiedStr}
                </span>
                {/* Save button */}
                <button
                  onClick={saveFormulation}
                  disabled={!hasUnsavedChanges || !formulationName.trim() || ingredients.length === 0}
                  className={`px-3 py-1 rounded text-xs font-semibold transition ${
                    hasUnsavedChanges && formulationName.trim() && ingredients.length > 0
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  💾 Save
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════
          HOME / DASHBOARD TAB
          Portfolio-level view. Shows: KPIs, lifecycle status breakdown,
          recent activity, items needing attention, top ingredients used
          across the portfolio, quick actions, and commercial pipeline
          placeholder (for future service-request tracking).
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'home' && (() => {
        // ─── Portfolio stats ───
        const totalFormulas = savedFormulations.length;
        const byStatus: Record<string, number> = { draft: 0, 'in-pilot': 0, launched: 0, 'on-hold': 0 };
        savedFormulations.forEach(f => { byStatus[f.status || 'draft']++; });
        const totalVersions = savedFormulations.reduce((s, f) => s + (f.versions?.length || 0), 0);
        const totalIngredientsInUse = new Set(savedFormulations.flatMap(f => f.ingredients.map(i => i.name))).size;

        // ─── Recent activity (last 5 modified) ───
        const recentFormulas = [...savedFormulations]
          .sort((a, b) => {
            const tA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
            const tB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
            return tB - tA;
          })
          .slice(0, 5);

        // Use dashboardNow (reactive state — updates every minute) instead of
        // calling Date.now() directly in render, which the react-hooks/purity
        // rule flags as impure behavior during rendering.
        const now = dashboardNow;
        // ─── Items needing attention ───
        const attention: { icon: ReactNode; title: string; subtitle: string; action?: () => void }[] = [];

        // Supplier qualification expirations
        const qualSummary = summarizeQualifications(supplierQuals, now);
        qualSummary.expiredList.forEach(q => {
          attention.push({
            icon: <Ban className="h-4 w-4 text-rose-700" aria-hidden="true" />,
            title: `${q.supplierName} — ${DOC_TYPE_LABELS[q.docType]} EXPIRED`,
            subtitle: `Expired ${new Date(q.expirationDate).toLocaleDateString()}. Request renewal before next shipment.`,
            action: () => { setActiveTab('sourcing'); setSourcingSubView('qualifications'); },
          });
        });
        qualSummary.expiringList.slice(0, 5).forEach(q => {
          const st = getQualificationStatus(q, now);
          attention.push({
            icon: <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />,
            title: `${q.supplierName} — ${DOC_TYPE_LABELS[q.docType]} expiring`,
            subtitle: `${st.label}. Start renewal workflow now to avoid gap in coverage.`,
            action: () => { setActiveTab('sourcing'); setSourcingSubView('qualifications'); },
          });
        });
        // In-pilot for more than 30 days
        savedFormulations.forEach(f => {
          if (f.status === 'in-pilot' && f.lastModified) {
            const days = Math.floor((now - new Date(f.lastModified).getTime()) / 86400000);
            if (days > 30) {
              attention.push({
                icon: '🧪',
                title: `${f.name} — in pilot ${days} days`,
                subtitle: 'Consider promoting to Launched or moving to On Hold.',
                action: () => loadFormulation(f),
              });
            }
          }
        });
        // Drafts older than 60 days
        savedFormulations.forEach(f => {
          if (f.status === 'draft' && f.lastModified) {
            const days = Math.floor((now - new Date(f.lastModified).getTime()) / 86400000);
            if (days > 60) {
              attention.push({
                icon: '📝',
                title: `${f.name} — draft unchanged ${days} days`,
                subtitle: 'Abandoned draft? Delete, archive, or advance to pilot.',
                action: () => loadFormulation(f),
              });
            }
          }
        });

        // ─── Top ingredients across portfolio (by count of formulas using) ───
        const ingCount: Record<string, number> = {};
        savedFormulations.forEach(f => {
          const seen = new Set<string>();
          f.ingredients.forEach(i => {
            if (seen.has(i.name)) return;
            seen.add(i.name);
            ingCount[i.name] = (ingCount[i.name] || 0) + 1;
          });
        });
        const topIngredients = Object.entries(ingCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);

        // ─── Portfolio sustainability average ───
        let avgSustainability = 0;
        if (totalFormulas > 0) {
          const scores = savedFormulations.map(f => {
            const rows = f.ingredients.map(i => ({
              name: i.name,
              category: i.foodData?.type === 'industrial' ? (i.foodData.data as IndustrialIngredient).category : '',
              massG: i.qty * (UNIT_TO_GRAMS[i.unit] || 1),
            }));
            return computeFormulationSustainability(rows).score;
          });
          avgSustainability = Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
        }

        const statusColor: Record<string, string> = {
          'draft': 'gray', 'in-pilot': 'amber', 'launched': 'emerald', 'on-hold': 'rose',
        };
        const statusIcon: Record<string, string> = {
          'draft': '📝', 'in-pilot': '🧪', 'launched': '🚀', 'on-hold': '⏸️',
        };

        return (
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Welcome banner */}
            <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border border-emerald-200 rounded-xl p-8 mb-6">
              <div className="flex items-center gap-5 flex-wrap">
                <NautilusMark size={80} />
                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl font-semibold text-gray-800 tracking-tight">
                    Welcome back.
                  </h2>
                  <p className="text-sm text-gray-600 mt-1 max-w-xl">
                    {totalFormulas === 0
                      ? 'Your formulation portfolio lives here. Start a new formula on the 🔬 Build tab, or jump anywhere with ⌘K.'
                      : `${totalFormulas} formulation${totalFormulas !== 1 ? 's' : ''} in your portfolio across ${Object.keys(byStatus).filter(k => byStatus[k] > 0).length} lifecycle stage${Object.keys(byStatus).filter(k => byStatus[k] > 0).length !== 1 ? 's' : ''}.`}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { setIngredients([]); setFormulationName(''); setProductClassState(''); setFormulaStatus('draft'); setActiveTab('build'); }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-semibold"
                  >
                    ✨ New Formula
                  </button>
                  <button
                    onClick={() => setCmdPaletteOpen(true)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-emerald-400 transition text-sm"
                  >
                    🔍 Search <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">⌘K</kbd>
                  </button>
                </div>
              </div>
            </div>

            {/* Portfolio KPI tiles */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Total Formulas</div>
                <div className="text-3xl font-bold text-gray-800 mt-1">{totalFormulas}</div>
                <div className="text-[10px] text-gray-400 mt-1">{totalVersions} version{totalVersions !== 1 ? 's' : ''} tracked</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">🚀 Launched</div>
                <div className="text-3xl font-bold text-emerald-700 mt-1">{byStatus.launched}</div>
                <div className="text-[10px] text-gray-400 mt-1">in commercial production</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">🧪 In Pilot</div>
                <div className="text-3xl font-bold text-amber-700 mt-1">{byStatus['in-pilot']}</div>
                <div className="text-[10px] text-gray-400 mt-1">in pilot testing</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">📝 Drafts</div>
                <div className="text-3xl font-bold text-gray-700 mt-1">{byStatus.draft}</div>
                <div className="text-[10px] text-gray-400 mt-1">early development</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">🌱 Avg Sustainability</div>
                <div className={`text-3xl font-bold mt-1 ${
                  avgSustainability >= 75 ? 'text-emerald-700' : avgSustainability >= 55 ? 'text-amber-700' : 'text-rose-700'
                }`}>{avgSustainability}</div>
                <div className="text-[10px] text-gray-400 mt-1">/100 across portfolio</div>
              </div>
            </div>

            {/* Qualification health strip */}
            {qualSummary.total > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <button onClick={() => { setActiveTab('sourcing'); setSourcingSubView('qualifications'); }}
                  className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-emerald-400 transition">
                  <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">📋 Supplier Quals Tracked</div>
                  <div className="text-2xl font-bold text-gray-800 mt-1">{qualSummary.total}</div>
                  <div className="text-[10px] text-gray-400 mt-1">documents on file</div>
                </button>
                <button onClick={() => { setActiveTab('sourcing'); setSourcingSubView('qualifications'); }}
                  className="bg-white rounded-xl border border-emerald-200 p-4 text-left hover:border-emerald-400 transition">
                  <div className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                    <span>Current</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">{qualSummary.current}</div>
                  <div className="text-[10px] text-gray-400 mt-1">valid beyond 60 days</div>
                </button>
                <button onClick={() => { setActiveTab('sourcing'); setSourcingSubView('qualifications'); }}
                  className={`bg-white rounded-xl border p-4 text-left transition ${qualSummary.expiring > 0 ? 'border-amber-300 hover:border-amber-500 ring-1 ring-amber-100' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-[10px] uppercase tracking-wide text-amber-700 font-semibold inline-flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-600" aria-hidden="true" />
                    <span>Expiring ≤ 60d</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-700 mt-1">{qualSummary.expiring}</div>
                  <div className="text-[10px] text-gray-400 mt-1">needs renewal</div>
                </button>
                <button onClick={() => { setActiveTab('sourcing'); setSourcingSubView('qualifications'); }}
                  className={`bg-white rounded-xl border p-4 text-left transition ${qualSummary.expired > 0 ? 'border-rose-300 hover:border-rose-500 ring-1 ring-rose-100' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-[10px] uppercase tracking-wide text-rose-700 font-semibold inline-flex items-center gap-1">
                    <Ban className="h-3 w-3 text-rose-700" aria-hidden="true" />
                    <span>Expired</span>
                  </div>
                  <div className="text-2xl font-bold text-rose-700 mt-1">{qualSummary.expired}</div>
                  <div className="text-[10px] text-gray-400 mt-1">immediate action</div>
                </button>
              </div>
            )}

            {/* Two-column layout: Recent Activity + Needs Attention */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Recent activity */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">🕐 Recent Activity</h3>
                  <button onClick={() => setActiveTab('saved')} className="text-xs text-emerald-700 hover:underline">View all →</button>
                </div>
                {recentFormulas.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-400 italic">
                    No formulas yet. Build your first one on the 🔬 Build tab.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentFormulas.map(f => {
                      const lmDate = f.lastModified ? new Date(f.lastModified) : null;
                      const mins = lmDate ? Math.floor((now - lmDate.getTime()) / 60000) : 0;
                      const ago =
                        mins < 1 ? 'just now' :
                        mins < 60 ? `${mins}m ago` :
                        mins < 1440 ? `${Math.floor(mins / 60)}h ago` :
                        lmDate ? lmDate.toLocaleDateString() : '—';
                      const color = statusColor[f.status || 'draft'];
                      return (
                        <button
                          key={f.id}
                          onClick={() => loadFormulation(f)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-gray-50 transition text-left"
                        >
                          <span className="text-xl">{statusIcon[f.status || 'draft']}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="font-semibold text-gray-800 text-sm truncate">{f.name}</span>
                              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">v{f.currentVersion || '1.0.0'}</span>
                              <span className={`text-[10px] font-semibold text-${color}-700`}>{f.status || 'draft'}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {f.ingredients.length} ingredients • {MODES[f.mode || 'fb']?.name || f.mode} • {ago}
                            </div>
                          </div>
                          <span className="text-gray-300">→</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Needs attention */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                    <span>Needs Attention</span>
                  </h3>
                  <span className="text-xs text-gray-500">{attention.length} item{attention.length !== 1 ? 's' : ''}</span>
                </div>
                {attention.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-400 italic">
                    ✨ All clear. No drafts or pilot runs need review.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attention.map((a, i) => (
                      <button
                        key={i}
                        onClick={a.action}
                        className="w-full flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition text-left"
                      >
                        <span className="shrink-0 w-6 h-6 inline-flex items-center justify-center mt-0.5">
                          {typeof a.icon === 'string' ? <span className="text-xl">{a.icon}</span> : a.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-amber-900 text-sm">{a.title}</div>
                          <div className="text-[11px] text-amber-800 mt-0.5">{a.subtitle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom row: Top ingredients + Commercial pipeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Top ingredients */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">📊 Top Ingredients in Portfolio</h3>
                  <span className="text-xs text-gray-500">{totalIngredientsInUse} unique SKUs tracked</span>
                </div>
                {topIngredients.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-400 italic">
                    Ingredient frequency chart appears as you save formulas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topIngredients.map(([name, count]) => {
                      const maxCount = topIngredients[0][1];
                      const pct = Math.max(5, (count / maxCount) * 100);
                      return (
                        <div key={name} className="text-xs">
                          <div className="flex justify-between mb-0.5">
                            <span className="font-medium text-gray-700 truncate flex-1 mr-2">{name}</span>
                            <span className="font-mono text-gray-500">{count} formula{count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Commercial pipeline placeholder */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">🤝 Commercial Pipeline</h3>
                  <button onClick={() => setActiveTab('services')} className="text-xs text-emerald-700 hover:underline">Open Services →</button>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🧪</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-sm">Bench-Top Sample Requests</div>
                        <div className="text-[11px] text-gray-500">Client intake via Services tab → your inbox</div>
                      </div>
                      <button onClick={() => { setActiveTab('services'); setServiceRequestType('bench'); }} className="text-xs text-emerald-700 hover:underline whitespace-nowrap">Request →</button>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📈</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-sm">Scale-Up Consulting</div>
                        <div className="text-[11px] text-gray-500">Formulas flagged as 21 CFR 113/114 (acidified / LACF) needing Process Authority liaison</div>
                      </div>
                      <button onClick={() => { setActiveTab('services'); setServiceRequestType('scaleup'); }} className="text-xs text-emerald-700 hover:underline whitespace-nowrap">Request →</button>
                    </div>
                  </div>
                  {SHOW_COPACKER_SERVICE && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🏭</span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 text-sm">Co-Packer Placement</div>
                          <div className="text-[11px] text-gray-500">Exclusive food and beverage network. Matched to volume + certifications.</div>
                        </div>
                        <button onClick={() => { setActiveTab('services'); setServiceRequestType('copacker'); }} className="text-xs text-emerald-700 hover:underline whitespace-nowrap">Request →</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick actions row */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">⚡ Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => { setIngredients([]); setFormulationName(''); setProductClassState(''); setFormulaStatus('draft'); setActiveTab('build'); }}
                  className="p-4 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition text-left"
                >
                  <div className="text-2xl mb-1">✨</div>
                  <div className="font-semibold text-gray-800 text-sm">New Formula</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Clear and start fresh</div>
                </button>
                <button
                  onClick={() => { setActiveTab('build'); setShowPaste(true); }}
                  className="p-4 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition text-left"
                >
                  <div className="text-2xl mb-1">📋</div>
                  <div className="font-semibold text-gray-800 text-sm">Bulk Paste</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Import from markdown/CSV</div>
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className="p-4 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition text-left"
                >
                  <div className="text-2xl mb-1">🔀</div>
                  <div className="font-semibold text-gray-800 text-sm">Compare Formulas</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Side-by-side analysis</div>
                </button>
                <button
                  onClick={() => setActiveTab('sourcing')}
                  className="p-4 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition text-left"
                >
                  <div className="text-2xl mb-1">🌐</div>
                  <div className="font-semibold text-gray-800 text-sm">Sourcing</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Filter by cert requirements</div>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DATABASE TAB */}
      {activeTab === 'database' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Industrial Ingredient Library</h2>
            <p className="text-gray-500 text-sm mt-1">Curated industrial-grade ingredients with verified suppliers, specs, and sustainability profiles{dbSearch || dbCategory !== 'All' ? ` — ${filteredDB.length} match current filters` : ''}.</p>
          </div>
          <div className="flex flex-wrap gap-3 mb-6">
            <input type="text" placeholder="Search ingredients..." value={dbSearch}
              onChange={(e) => setDbSearch(e.target.value)}
              className="flex-1 min-w-48 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500" />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setDbCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition ${dbCategory === cat ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            {filteredDB.map((ing, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{ing.name}</h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">{ing.category}</span>
                      {ing.allergens.map(a => <span key={a} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-600" aria-hidden="true" /><span>{a}</span></span>)}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{ing.notes}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                      <span>💰 ~${ing.costPerKg.toFixed(2)}/kg</span>
                      {ing.nutrition.calories !== undefined && <span>🔥 {ing.nutrition.calories} kcal/100g</span>}
                      {ing.nutrition.protein !== undefined && ing.nutrition.protein > 0 && <span>💪 {ing.nutrition.protein}g protein</span>}
                      <span>🏭 {ing.suppliers.slice(0, 3).join(' • ')}</span>
                    </div>
                    {ing.subIngredients.length > 0 && <p className="text-xs text-gray-400 mt-1">Contains: {ing.subIngredients.join(', ')}</p>}
                  </div>
                  <button onClick={() => { setActiveTab('build'); setNewIngredient(ing.name); setSelectedFood({ type: 'industrial', data: ing, subIngredients: ing.subIngredients, allergens: ing.allergens, costPerKg: ing.costPerKg, supplier: ing.suppliers[0], nutrition: ing.nutrition }); }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition whitespace-nowrap flex-shrink-0">
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SAVED TAB */}
      {activeTab === 'saved' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Saved Formulations</h2>
            {compareSelectionIds.length >= 2 && (
              <div className="flex gap-2 items-center bg-emerald-50 border border-emerald-300 rounded-lg px-3 py-2">
                <span className="text-sm text-emerald-800 font-semibold">
                  {compareSelectionIds.length} selected for comparison
                </span>
                <button
                  onClick={() => setShowComparison(true)}
                  className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 transition"
                >
                  🔀 Compare
                </button>
                <button
                  onClick={() => setCompareSelectionIds([])}
                  className="px-3 py-1 bg-white text-gray-600 rounded text-sm hover:bg-gray-100 transition"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {savedFormulations.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-lg">
              No saved formulations yet. Build one on the 🔬 Build tab and hit 💾 Save.
            </div>
          ) : (
            <div className="grid gap-4">
              {savedFormulations.map(f => {
                const isSelected = compareSelectionIds.includes(f.id);
                const isExpanded = historyExpandedId === f.id;
                const numVersions = f.versions?.length || 0;
                const currentVer = f.currentVersion || 'v1.0.0';
                const lastModDate = f.lastModified
                  ? new Date(f.lastModified).toLocaleDateString()
                  : f.createdAt;

                // Derive headline metrics from current snapshot
                const totalMassG = f.ingredients.reduce((s, i) => s + i.qty * (UNIT_TO_GRAMS[i.unit] || 1), 0);
                const totalKg = totalMassG / 1000;
                const totalC = f.ingredients.reduce((s, i) => s + ((i.qty * (UNIT_TO_GRAMS[i.unit] || 1)) / 1000) * (i.costPerKg || 0), 0);
                const allergens = Array.from(new Set(f.ingredients.flatMap(i => i.allergens))).filter(Boolean);

                return (
                  <div key={f.id} className={`bg-white rounded-xl border ${isSelected ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-gray-200'} overflow-hidden`}>
                    {/* Header */}
                    <div className="p-6 flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h3 className="text-xl font-semibold text-gray-800">{f.name}</h3>
                          <span className="text-xs font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">v{currentVer}</span>
                          {numVersions > 1 && (
                            <span className="text-[10px] text-gray-500">({numVersions} versions)</span>
                          )}
                          {f.mode && (
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide">• {MODES[f.mode]?.name}</span>
                          )}
                        </div>
                        {f.productType && <p className="text-emerald-700 text-xs mt-0.5 font-medium">🏷️ {f.productType}</p>}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-xs">
                          <div>
                            <div className="text-[10px] uppercase text-gray-400">Ingredients</div>
                            <div className="font-semibold text-gray-700">{f.ingredients.length}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase text-gray-400">Batch</div>
                            <div className="font-semibold text-gray-700">{totalKg.toFixed(2)} kg</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase text-gray-400">Cost</div>
                            <div className="font-semibold text-emerald-700">${totalC.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase text-gray-400">Package</div>
                            <div className="font-semibold text-gray-700">{f.packageSize}{f.packageUnit}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase text-gray-400">Last modified</div>
                            <div className="font-semibold text-gray-700">{lastModDate}</div>
                          </div>
                        </div>
                        {allergens.length > 0 && (
                          <div className="mt-2 text-xs">
                            <span className="text-gray-400">Allergens: </span>
                            <span className="font-semibold text-rose-600">{allergens.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            if (isSelected) {
                              setCompareSelectionIds(compareSelectionIds.filter(id => id !== f.id));
                            } else {
                              if (compareSelectionIds.length >= 3) {
                                alert('Maximum 3 formulas can be compared at once.');
                                return;
                              }
                              setCompareSelectionIds([...compareSelectionIds, f.id]);
                            }
                          }}
                          className={`px-3 py-2 rounded-lg text-sm transition ${isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          {isSelected ? '✓ Selected' : '🔀 Compare'}
                        </button>
                        {numVersions > 1 && (
                          <button
                            onClick={() => setHistoryExpandedId(isExpanded ? null : f.id)}
                            className="px-3 py-2 bg-sky-50 text-sky-700 rounded-lg text-sm hover:bg-sky-100 transition"
                          >
                            {isExpanded ? '▲ Hide history' : `📜 History (${numVersions})`}
                          </button>
                        )}
                        <button
                          onClick={() => loadFormulation(f)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${f.name}" and all ${numVersions} version${numVersions > 1 ? 's' : ''}?`)) {
                              setSavedFormulations(savedFormulations.filter(x => x.id !== f.id));
                            }
                          }}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
                        >
                          🗑
                        </button>
                      </div>
                    </div>

                    {/* Version History Panel */}
                    {isExpanded && f.versions && f.versions.length > 0 && (
                      <div className="border-t border-gray-200 bg-gray-50 p-6">
                        <div className="flex items-baseline justify-between mb-3">
                          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Version History</h4>
                          <span className="text-[10px] text-gray-500">oldest → newest</span>
                        </div>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-300 text-left text-[10px] uppercase tracking-wide text-gray-500">
                              <th className="py-2">Version</th>
                              <th className="py-2">Date</th>
                              <th className="py-2">Author</th>
                              <th className="py-2">Reason for change</th>
                              <th className="py-2 text-right">Ingredients</th>
                              <th className="py-2">Diff against</th>
                            </tr>
                          </thead>
                          <tbody>
                            {f.versions.map((v, idx) => {
                              const prevVersion = idx > 0 ? f.versions![idx - 1].version : null;
                              const dateStr = new Date(v.timestamp).toLocaleString();
                              return (
                                <tr key={v.version} className="border-b border-gray-200">
                                  <td className="py-2">
                                    <span className="font-mono font-semibold text-emerald-700">v{v.version}</span>
                                    {v.version === f.currentVersion && (
                                      <span className="ml-2 text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wide">current</span>
                                    )}
                                  </td>
                                  <td className="py-2 text-gray-600">{dateStr}</td>
                                  <td className="py-2 text-gray-600">{v.author}</td>
                                  <td className="py-2 text-gray-700 italic">{v.reasonForChange}</td>
                                  <td className="py-2 text-right font-mono">{v.ingredients.length}</td>
                                  <td className="py-2">
                                    {prevVersion && (
                                      <button
                                        onClick={() => setDiffSelection({ formulaId: f.id, v1: prevVersion, v2: v.version })}
                                        className="text-sky-600 hover:underline text-[10px]"
                                      >
                                        diff vs v{prevVersion}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── DIFF MODAL (v1 vs v2 of same formula) ─── */}
          {diffSelection && (() => {
            const formula = savedFormulations.find(f => f.id === diffSelection.formulaId);
            if (!formula?.versions) return null;
            const va = formula.versions.find(v => v.version === diffSelection.v1);
            const vb = formula.versions.find(v => v.version === diffSelection.v2);
            if (!va || !vb) return null;

            // Build ingredient diff
            const ingA = new Map(va.ingredients.map(i => [i.name, i]));
            const ingB = new Map(vb.ingredients.map(i => [i.name, i]));
            const allNames = Array.from(new Set([...ingA.keys(), ...ingB.keys()]));
            type DiffRow = { name: string; aQty: number | null; bQty: number | null; unit: string; status: 'added' | 'removed' | 'changed' | 'unchanged'; deltaG: number };
            const diffRows: DiffRow[] = allNames.map(name => {
              const a = ingA.get(name);
              const b = ingB.get(name);
              const aQty = a ? a.qty : null;
              const bQty = b ? b.qty : null;
              const aG = a ? a.qty * (UNIT_TO_GRAMS[a.unit] || 1) : 0;
              const bG = b ? b.qty * (UNIT_TO_GRAMS[b.unit] || 1) : 0;
              let status: DiffRow['status'];
              if (aQty === null && bQty !== null) status = 'added';
              else if (aQty !== null && bQty === null) status = 'removed';
              else if (Math.abs((aQty || 0) - (bQty || 0)) > 0.0001) status = 'changed';
              else status = 'unchanged';
              return { name, aQty, bQty, unit: (a || b)!.unit, status, deltaG: bG - aG };
            });

            const costA = va.ingredients.reduce((s, i) => s + ((i.qty * (UNIT_TO_GRAMS[i.unit] || 1)) / 1000) * (i.costPerKg || 0), 0);
            const costB = vb.ingredients.reduce((s, i) => s + ((i.qty * (UNIT_TO_GRAMS[i.unit] || 1)) / 1000) * (i.costPerKg || 0), 0);
            const totalAG = va.ingredients.reduce((s, i) => s + i.qty * (UNIT_TO_GRAMS[i.unit] || 1), 0);
            const totalBG = vb.ingredients.reduce((s, i) => s + i.qty * (UNIT_TO_GRAMS[i.unit] || 1), 0);
            void totalAG; void totalBG;
            const specsA = estimateSpecs(va.ingredients);
            const specsB = estimateSpecs(vb.ingredients);
            const allergensA = new Set(va.ingredients.flatMap(i => i.allergens));
            const allergensB = new Set(vb.ingredients.flatMap(i => i.allergens));
            const addedAllergens = [...allergensB].filter(a => !allergensA.has(a));
            const removedAllergens = [...allergensA].filter(a => !allergensB.has(a));

            return (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-auto" onClick={() => setDiffSelection(null)}>
                <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">🔀 Version Diff — {formula.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="font-mono text-rose-600">v{va.version}</span>
                        <span className="mx-2">→</span>
                        <span className="font-mono text-emerald-700">v{vb.version}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setDiffSelection(null)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </div>

                  {/* Change reason */}
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-4 text-xs">
                    <div className="text-[10px] uppercase tracking-wide text-sky-800 font-bold mb-1">Reason for change</div>
                    <div className="text-sky-900 italic">{vb.reasonForChange || '(none provided)'}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Saved {new Date(vb.timestamp).toLocaleString()} by {vb.author}</div>
                  </div>

                  {/* Summary tiles */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-[10px] uppercase tracking-wide text-gray-500">Batch Δ</div>
                      <div className="font-mono font-bold text-gray-800">{((totalBG - totalAG) / 1000).toFixed(3)} kg</div>
                      <div className="text-[10px] text-gray-400">{(totalAG / 1000).toFixed(3)} → {(totalBG / 1000).toFixed(3)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-[10px] uppercase tracking-wide text-gray-500">Cost Δ (batch)</div>
                      <div className={`font-mono font-bold ${costB - costA > 0 ? 'text-rose-700' : costB - costA < 0 ? 'text-emerald-700' : 'text-gray-800'}`}>
                        {costB - costA > 0 ? '+' : ''}${(costB - costA).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-400">${costA.toFixed(2)} → ${costB.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-[10px] uppercase tracking-wide text-gray-500">pH Δ</div>
                      <div className="font-mono font-bold text-gray-800">
                        {specsB.pH && specsA.pH
                          ? `${specsB.pH > specsA.pH ? '+' : ''}${(specsB.pH - specsA.pH).toFixed(2)}`
                          : '—'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {specsA.pH?.toFixed(2) || '—'} → {specsB.pH?.toFixed(2) || '—'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-[10px] uppercase tracking-wide text-gray-500">aw Δ</div>
                      <div className="font-mono font-bold text-gray-800">
                        {specsB.aw && specsA.aw
                          ? `${specsB.aw > specsA.aw ? '+' : ''}${(specsB.aw - specsA.aw).toFixed(3)}`
                          : '—'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {specsA.aw?.toFixed(3) || '—'} → {specsB.aw?.toFixed(3) || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Allergen delta */}
                  {(addedAllergens.length > 0 || removedAllergens.length > 0) && (
                    <div className="bg-rose-50 border border-rose-300 rounded-lg p-3 mb-4">
                      <div className="text-[10px] uppercase tracking-wide text-rose-800 font-bold mb-1 inline-flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3 text-amber-600" aria-hidden="true" />
                        <span>Allergen Changes (label must be updated!)</span>
                      </div>
                      {addedAllergens.length > 0 && (
                        <div className="text-xs text-rose-800">
                          <span className="font-bold">Added:</span> {addedAllergens.join(', ')}
                        </div>
                      )}
                      {removedAllergens.length > 0 && (
                        <div className="text-xs text-rose-700">
                          <span className="font-bold">Removed:</span> {removedAllergens.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ingredient diff table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b-2 border-gray-400 text-left text-[10px] uppercase tracking-wide text-gray-500">
                          <th className="py-2">Status</th>
                          <th className="py-2">Ingredient</th>
                          <th className="py-2 text-right">v{va.version}</th>
                          <th className="py-2 text-right">v{vb.version}</th>
                          <th className="py-2 text-right">Δ (g)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {diffRows
                          .sort((a, b) => {
                            const order = { changed: 0, added: 1, removed: 2, unchanged: 3 };
                            return order[a.status] - order[b.status] || a.name.localeCompare(b.name);
                          })
                          .map((r, i) => {
                            const rowBg = r.status === 'added' ? 'bg-emerald-50' :
                                          r.status === 'removed' ? 'bg-rose-50' :
                                          r.status === 'changed' ? 'bg-amber-50' : '';
                            const statusChip = r.status === 'added' ? '➕ added' :
                                              r.status === 'removed' ? '➖ removed' :
                                              r.status === 'changed' ? '↕ changed' : '—';
                            const statusColor = r.status === 'added' ? 'text-emerald-700' :
                                              r.status === 'removed' ? 'text-rose-700' :
                                              r.status === 'changed' ? 'text-amber-700' : 'text-gray-400';
                            return (
                              <tr key={i} className={`border-b border-gray-200 ${rowBg}`}>
                                <td className={`py-1.5 text-[10px] font-semibold ${statusColor}`}>{statusChip}</td>
                                <td className="py-1.5">{r.name}</td>
                                <td className="py-1.5 text-right font-mono">{r.aQty !== null ? `${r.aQty}${r.unit}` : '—'}</td>
                                <td className="py-1.5 text-right font-mono">{r.bQty !== null ? `${r.bQty}${r.unit}` : '—'}</td>
                                <td className={`py-1.5 text-right font-mono ${r.deltaG > 0 ? 'text-emerald-700' : r.deltaG < 0 ? 'text-rose-700' : 'text-gray-400'}`}>
                                  {r.deltaG > 0 ? '+' : ''}{r.deltaG.toFixed(1)}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ─── COMPARISON MODAL (2-3 different formulas side-by-side) ─── */}
          {showComparison && compareSelectionIds.length >= 2 && (() => {
            const formulas = compareSelectionIds.map(id => savedFormulations.find(f => f.id === id)!).filter(Boolean);
            if (formulas.length < 2) return null;

            // Merge all ingredient names across all formulas
            const allIngNames = Array.from(new Set(formulas.flatMap(f => f.ingredients.map(i => i.name))));

            return (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-auto" onClick={() => setShowComparison(false)}>
                <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">🔀 Formula Comparison — {formulas.length} formulas</h3>
                    <button
                      onClick={() => setShowComparison(false)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </div>

                  {/* Headers row */}
                  <div className={`grid gap-4 mb-4`} style={{ gridTemplateColumns: `180px repeat(${formulas.length}, 1fr)` }}>
                    <div className="font-semibold text-[10px] uppercase tracking-wide text-gray-500">Metric</div>
                    {formulas.map(f => (
                      <div key={f.id} className="bg-emerald-50 border border-emerald-300 rounded p-2">
                        <div className="font-bold text-gray-800 text-sm">{f.name}</div>
                        <div className="text-[10px] font-mono text-emerald-700">v{f.currentVersion}</div>
                        <div className="text-[10px] text-gray-500">{f.mode && MODES[f.mode]?.name}</div>
                      </div>
                    ))}
                  </div>

                  {/* Summary rows */}
                  {(() => {
                    const summaries = formulas.map(f => {
                      const totalG = f.ingredients.reduce((s, i) => s + i.qty * (UNIT_TO_GRAMS[i.unit] || 1), 0);
                      const totalC = f.ingredients.reduce((s, i) => s + ((i.qty * (UNIT_TO_GRAMS[i.unit] || 1)) / 1000) * (i.costPerKg || 0), 0);
                      const specs = estimateSpecs(f.ingredients);
                      const allergens = Array.from(new Set(f.ingredients.flatMap(i => i.allergens))).filter(Boolean);
                      const rows = f.ingredients.map(i => ({ name: i.name, category: i.foodData?.type === 'industrial' ? (i.foodData.data as IndustrialIngredient).category : '', massG: i.qty * (UNIT_TO_GRAMS[i.unit] || 1) }));
                      const sust = computeFormulationSustainability(rows);
                      return { totalG, totalC, specs, allergens, sust };
                    });

                    const renderRow = (label: string, cells: React.ReactNode[]) => (
                      <div className="grid gap-4 py-2 border-b border-gray-200" style={{ gridTemplateColumns: `180px repeat(${formulas.length}, 1fr)` }}>
                        <div className="text-xs font-semibold text-gray-600">{label}</div>
                        {cells.map((c, i) => <div key={i} className="text-sm text-gray-800">{c}</div>)}
                      </div>
                    );

                    return (
                      <div className="mb-6">
                        {renderRow('Ingredients', summaries.map((s, i) => <span key={i}>{formulas[i].ingredients.length} items</span>))}
                        {renderRow('Batch size', summaries.map((s, i) => <span key={i} className="font-mono">{(s.totalG / 1000).toFixed(2)} kg</span>))}
                        {renderRow('Total cost', summaries.map((s, i) => <span key={i} className="font-mono font-semibold text-emerald-700">${s.totalC.toFixed(2)}</span>))}
                        {renderRow('Cost / kg', summaries.map((s, i) => <span key={i} className="font-mono">${s.totalG > 0 ? (s.totalC / (s.totalG / 1000)).toFixed(2) : '—'}</span>))}
                        {renderRow('pH', summaries.map((s, i) => <span key={i} className="font-mono">{s.specs.pH?.toFixed(2) || '—'}</span>))}
                        {renderRow('Water activity', summaries.map((s, i) => <span key={i} className="font-mono">{s.specs.aw?.toFixed(3) || '—'}</span>))}
                        {renderRow('Classification', summaries.map((s, i) => <span key={i} className="text-xs">{s.specs.productClassification || '—'}</span>))}
                        {renderRow('Allergens', summaries.map((s, i) => <span key={i} className="text-xs text-rose-700 font-semibold">{s.allergens.length > 0 ? s.allergens.join(', ') : '—'}</span>))}
                        {renderRow('Sustainability score', summaries.map((s, i) => (
                          <span key={i} className={`font-mono font-bold ${s.sust.score >= 75 ? 'text-emerald-700' : s.sust.score >= 55 ? 'text-amber-700' : 'text-rose-700'}`}>{s.sust.score}/100</span>
                        )))}
                        {renderRow('Organic-available %', summaries.map((s, i) => <span key={i} className="font-mono">{s.sust.organicCoveragePct.toFixed(0)}%</span>))}
                        {renderRow('Carbon /kg CO₂e', summaries.map((s, i) => <span key={i} className="font-mono">{s.sust.avgCarbonKgCo2ePerUnit.toFixed(1)}</span>))}
                      </div>
                    );
                  })()}

                  {/* Per-ingredient table */}
                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Ingredients</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b-2 border-gray-400 text-left text-[10px] uppercase tracking-wide text-gray-500">
                            <th className="py-2 w-[300px]">Ingredient</th>
                            {formulas.map(f => <th key={f.id} className="py-2 text-right">{f.name}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {allIngNames.map(name => {
                            const qtys = formulas.map(f => {
                              const ing = f.ingredients.find(i => i.name === name);
                              return ing ? `${ing.qty}${ing.unit}` : '—';
                            });
                            // Highlight rows where formulas differ
                            const uniqueQtys = new Set(qtys.filter(q => q !== '—'));
                            const hasDifference = uniqueQtys.size > 1 || qtys.includes('—');
                            return (
                              <tr key={name} className={`border-b border-gray-200 ${hasDifference ? 'bg-amber-50' : ''}`}>
                                <td className="py-1.5">{name}</td>
                                {qtys.map((q, i) => (
                                  <td key={i} className={`py-1.5 text-right font-mono ${q === '—' ? 'text-gray-400' : 'text-gray-700'}`}>{q}</td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* BUILD TAB */}
      {activeTab === 'build' && (
        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* ═══════════════════════════════════════════════════════════════
              SUPPLEMENT STATUS STRIP — compact at-a-glance health bar for
              the six analysis engines. Each pill is clickable: scrolls to
              its card AND forces it expanded. Cards default-collapse when
              their state is green; default-expand when there are findings.
              ═══════════════════════════════════════════════════════════════ */}
          {mode === 'supplements' && ingredients.length > 0 && (() => {
            const scale = computePerServingScale({ mode, servingSizeInGrams, totalBatchGrams });
            const pmByName = new Map<string, number>();
            for (const ing of ingredients) {
              const g = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
              const pot = (ing.foodData?.type === 'industrial' && ing.foodData.data?.potencyFactor) ? ing.foodData.data.potencyFactor : 1;
              pmByName.set(ing.name, g * scale * 1000 * pot);
            }
            const safetySum = summarizeFindings(checkSupplementSafety(ingredients, pmByName, suppAudience));
            const over = computeOverages(ingredients, pmByName, { shelfLifeMonths: suppShelfLifeMonths, storage: suppStorage, amberPackaging: suppAmberPkg, desiccant: suppDesiccant, nitrogenFlush: suppNitrogen, tocopherolAntioxidant: suppTocopherol });
            const compatSum = summarizeCompatibility(checkCompatibility(ingredients, {
              deliveryForm: suppDeliveryForm,
              capsuleShell: suppDeliveryForm === 'softgel' || suppDeliveryForm === 'capsule' ? 'gelatin' : 'none',
              hasDesiccant: suppDesiccant, hasNitrogenFlush: suppNitrogen, hasAmberPackaging: suppAmberPkg, storage: suppStorage,
            }));
            const ndi = analyzeNDI(ingredients.map(i => i.name));
            const draftFlagCount = analyzeDraftClaim(suppDraftClaim).length;
            const retailReports = analyzeRetailFit(ingredients.map(i => i.name));
            const blockedRetailers = retailReports.filter(r => r.status === 'blocked').length;
            const cautionRetailers = retailReports.filter(r => r.status === 'caution').length;

            // Pill state = {tier, label, id, scrollTo}
            type PillTier = 'ok' | 'caution' | 'warn' | 'critical';
            const pill = (id: string, name: string, tier: PillTier, detail: string) => ({ id, name, tier, detail });
            const pills = [
              pill('safety', 'Safety',
                   safetySum.banned + safetySum.critical > 0 ? 'critical'
                   : safetySum.warning > 0 ? 'warn'
                   : safetySum.caution > 0 ? 'caution' : 'ok',
                   safetySum.banned > 0 ? `${safetySum.banned} banned` : safetySum.critical > 0 ? `${safetySum.critical} critical` : safetySum.warning > 0 ? `${safetySum.warning} over UL` : safetySum.caution > 0 ? `${safetySum.caution} caution` : 'All doses safe'),
              pill('stability', 'Stability',
                   over.worstLossPct > 50 ? 'critical' : over.worstLossPct > 30 ? 'warn' : over.worstLossPct > 15 ? 'caution' : 'ok',
                   over.bottleneck ? `${over.worstLossPct.toFixed(0)}% loss — ${over.bottleneck.ingredientName}` : 'No bottleneck'),
              pill('compat', 'Compatibility',
                   compatSum.critical > 0 ? 'critical' : compatSum.warning > 0 ? 'warn' : compatSum.caution > 0 ? 'caution' : 'ok',
                   compatSum.critical + compatSum.warning + compatSum.caution === 0 ? 'No conflicts' : `${compatSum.critical + compatSum.warning + compatSum.caution} issue${compatSum.critical + compatSum.warning + compatSum.caution !== 1 ? 's' : ''}`),
              pill('ndi', 'NDI',
                   ndi.required > 0 ? 'critical' : ndi.unknown > 0 ? 'caution' : 'ok',
                   ndi.required > 0 ? `${ndi.required} NDI required` : ndi.unknown > 0 ? `${ndi.unknown} unknown` : 'All classified'),
              pill('claims', 'Claims',
                   draftFlagCount > 0 ? 'warn' : 'ok',
                   draftFlagCount > 0 ? `${draftFlagCount} issue${draftFlagCount !== 1 ? 's' : ''} in draft` : 'Ready'),
              pill('retail', 'Retail Fit',
                   blockedRetailers > 0 ? 'warn' : cautionRetailers > 0 ? 'caution' : 'ok',
                   blockedRetailers > 0 ? `${blockedRetailers} blocked` : cautionRetailers > 0 ? `${cautionRetailers} caution` : 'All channels ready'),
              // Round 11 Phase 3 Workstream A.5 [5d/N] — Producibility status card
              // (#25l SP11 closure: Wizard chose Option b — 7th distinct card —
              // over Option a — adjust existing 6 cards. Reasoning: over-fill is
              // a manufacturing concern, not a Safety concern; semantic clarity
              // matters more than visual-surface minimization. Also closes the
              // "all 6 green on 0g formulation" Quality C visual issue — this
              // card surfaces 'caution' (Pending) when formulation is not yet
              // evaluable, so the row no longer reads all-green pre-ingredient.
              (() => {
                // Reconcile count inputs for totalUnits (matches Serving &
                // Package Size card derivation in 5b sync useEffect).
                const seedServings = servingsPerContainerOverride ?? 30;
                const seedTotalUnits = totalUnitsOverride ?? deriveTotalUnits(seedServings, suppUnitsPerServing);
                const reconciled = reconcileCountInputs({
                  servings: seedServings,
                  totalUnits: seedTotalUnits,
                  unitsPerServing: suppUnitsPerServing,
                  lastEdited: lastEditedCountField,
                });
                // Round 11 Phase 3 post-A.5 follow-up (2026-05-17) — Bug #9.
                // Pass `unitsPerServing` instead of `reconciled.totalUnits`
                // so per-unit fill weight computes correctly under the
                // locked-in per-serving entry model (rulebook §II.11
                // label-claim vs ingredient-mass doctrine). Operator-side
                // Test 2b surfaced this: card showed 74% green "On target"
                // while the status pill rendered "Low fill" (~1%) because
                // assessProducibility was dividing per-serving total by
                // batch-total-unit-count instead of per-serving-unit-count.
                const prod = assessProducibility({
                  form: suppDeliveryForm,
                  totalMassG: totalBatchGrams,
                  totalUnits: suppUnitsPerServing,
                  capacityMg: capsuleCapacityMg(suppCapsuleSize),
                });
                // Map ProducibilityState → PillTier:
                //   over-fill   → critical (red; impossible as specified)
                //   approaching → warn     (orange; 90-100% utilization)
                //   low-fill    → caution  (amber; cost-optimization advisory)
                //   unknown     → caution  (amber; pending evaluation)
                //   producible  → ok       (green; normal range)
                const stateToTier: Record<ProducibilityState, PillTier> = {
                  'over-fill':   'critical',
                  'approaching': 'warn',
                  'low-fill':    'caution',
                  'unknown':     'caution',
                  'producible':  'ok',
                };
                const stateToDetail: Record<ProducibilityState, string> = {
                  'over-fill':   'Over-fill — impossible as specified',
                  'approaching': 'Approaching over-fill',
                  'low-fill':    'Low fill — consider smaller capsule',
                  'unknown':     'Pending — add ingredients',
                  'producible':  'Producible',
                };
                return pill('producibility', 'Producibility', stateToTier[prod.state], stateToDetail[prod.state]);
              })(),
            ];

            const pillClass = (tier: PillTier) =>
              tier === 'critical' ? 'bg-red-50 border-red-400 text-red-900 hover:bg-red-100'
              : tier === 'warn' ? 'bg-orange-50 border-orange-300 text-orange-900 hover:bg-orange-100'
              : tier === 'caution' ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100';
            const pillIcon = (tier: PillTier): ReactNode =>
              tier === 'critical' ? <OctagonX className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
              : tier === 'warn' ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
              : tier === 'caution' ? <AlertCircle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
              : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />;

            return (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Formula Status</h2>
                  <button
                    onClick={() => {
                      // Expand all by setting all IDs to true
                      setSuppCardsManuallyToggled({ safety: true, stability: true, compat: true, ndi: true, claims: true, retail: true });
                    }}
                    className="text-[10px] uppercase tracking-wide text-gray-500 hover:text-gray-800 font-medium"
                  >
                    Expand all
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {pills.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        // Force expand the corresponding card + scroll into view
                        setSuppCardsManuallyToggled(prev => ({ ...prev, [p.id]: true }));
                        setTimeout(() => {
                          const el = document.getElementById(`supp-card-${p.id}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                      }}
                      className={`rounded-lg border-2 px-3 py-2 text-left transition ${pillClass(p.tier)}`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {pillIcon(p.tier)}
                        <span>{p.name}</span>
                      </div>
                      <div className="text-[10px] mt-0.5 leading-tight opacity-80">{p.detail}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Name & Save */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Formulation Name & Product Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Formulation Name</label>
                    <input type="text" placeholder={mc.examplePlaceholder}
                      value={formulationName} onChange={(e) => setFormulationName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Product Type <span className="text-gray-400">(drives packaging suggestions)</span></label>
                    <select
                      value={productType}
                      onChange={(e) => {
                        const next = e.target.value;
                        // Round 2 directive: when transitioning from a legacy productType
                        // to a v1 bucket, capture the current effective tracked_specs as
                        // an explicit override so the user's selection isn't silently
                        // replaced by the new bucket's defaults. User can hit "Reset to
                        // defaults" to take the new bucket's defaults afterward.
                        const oldIsLegacy = isLegacyProductType;
                        const newIsBucket = DROPDOWN_PRODUCT_TYPES.some(pt => pt.name === next);
                        if (oldIsLegacy && newIsBucket && trackedSpecsOverride === null) {
                          const currentEffective = getTrackedSpecDefaults(productType).tracked;
                          setTrackedSpecsOverride([...currentEffective]);
                        }
                        setProductType(next);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">— Select a product type —</option>
                      {DROPDOWN_PRODUCT_TYPES.map(pt => (
                        <option key={pt.name} value={pt.name}>{pt.name}</option>
                      ))}
                      {/* Legacy fallback — preserves the stored productType as the current
                          selection even though it's no longer in the v1 dropdown. The CTA
                          below the dropdown prompts the user to migrate to a v1 bucket. */}
                      {isLegacyProductType && (
                        <option key={productType} value={productType}>{productType} (legacy)</option>
                      )}
                    </select>
                  </div>
                </div>
                {currentProductType && (
                  <p className="text-xs text-gray-500 mb-3 italic">{currentProductType.description}</p>
                )}
                {/* Round 10 Path A-2 (2026-05-15): Product Class selector. Required
                    at formulation creation per directive's "no default-uncategorized
                    state" discipline. Drives per-context regulatory routing in
                    checkCompliance (denominator basis, prohibitions, contextual
                    overrides). Change triggers confirm-dialog when active
                    compliance findings exist (handleProductClassChange handler).
                    The save-block in saveFormulation() refuses to persist unset
                    state — making this the load-bearing UX gate that enforces
                    explicit productClass on every saved formulation. */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Product Class <span className="text-red-500">*</span>{' '}
                    <span className="text-gray-400">
                      {mode === 'supplements'
                        ? '(Dietary Supplement classification — DSHEA / UL safety framework applies; required to save)'
                        : '(drives chemical-safety compliance routing — required to save)'}
                    </span>
                  </label>
                  <select
                    value={productClass}
                    onChange={(e) => handleProductClassChange(e.target.value as ProductClass | '')}
                    className={`w-full border rounded-lg px-4 py-2.5 bg-white focus:outline-none focus:border-emerald-500 ${
                      productClass === '' ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">— Select a product class (required) —</option>
                    {/* Finding #18 (2026-05-15): mode-aware filter via
                        productClassesForMode. Supplements mode shows only the
                        Dietary Supplement option (compliance routing is via the
                        DSHEA/UL stack, not Path A's F&B chemical-safety paths);
                        F&B-style modes show all 7 non-supplement options. */}
                    {productClassesForMode(mode).map(pc => (
                      <option key={pc} value={pc}>{PRODUCT_CLASS_LABEL[pc]}</option>
                    ))}
                  </select>
                  {productClass === '' && (
                    <p className="text-xs text-red-600 mt-1">
                      Product Class is required {mode === 'supplements'
                        ? 'for the Dietary Supplement DSHEA / UL safety framework. Save will be blocked until selected.'
                        : 'for chemical-safety compliance routing. Save will be blocked until selected.'}
                    </p>
                  )}
                </div>
                {/* Legacy CTA — prompts the user to migrate from a hidden product type
                    to one of the v1 buckets. Migration preserves their tracked_specs
                    customization (see onChange handler above). */}
                {isLegacyProductType && (
                  <div className="mb-3 px-4 py-3 border-l-4 border-amber-400 bg-amber-50 rounded-r text-xs text-gray-700 leading-relaxed">
                    <strong className="text-gray-900">Legacy product type:</strong>{' '}
                    <span className="font-mono">{productType}</span> is no longer in the v1 dropdown but the formulation continues to work correctly. Pick a v1 bucket above to migrate — your current Specs to Track selection will be preserved as a customization.
                  </div>
                )}

                {/* Specs to Track — formulator-chosen list of QC release specs. Selection
                    drives what renders on the Spec Analysis panel and Batch Sheet Target
                    Specs; unselected specs don't render at all. Defaults derive from the
                    product type; user edits persist across product-type changes. */}
                {(() => {
                  const defaults = getTrackedSpecDefaults(productType);
                  const effective = trackedSpecsOverride ?? defaults.tracked;
                  const effectiveSet = new Set(effective);
                  const isOverridden = trackedSpecsOverride !== null;
                  const suggestedSet = new Set(defaults.suggested);
                  const toggle = (s: TrackedSpec) => {
                    const next = effectiveSet.has(s)
                      ? effective.filter(x => x !== s)
                      : [...effective, s];
                    setTrackedSpecsOverride(next);
                  };
                  const resetToDefaults = () => {
                    if (window.confirm(`Reset spec tracking to ${productType ? `"${productType}"` : 'system'} defaults? Your current selection will be replaced.`)) {
                      setTrackedSpecsOverride(null);
                    }
                  };
                  return (
                    <div className="mb-3 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Specs to Track</h3>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                            Selected specs render on the Spec Analysis panel + Batch Sheet Target Specs. Defaults from {productType ? <><span className="font-medium">{productType}</span></> : 'system fallback'}.
                          </p>
                        </div>
                        {isOverridden && (
                          <button
                            onClick={resetToDefaults}
                            className="text-[10px] uppercase tracking-wide text-emerald-700 hover:text-emerald-900 font-semibold whitespace-nowrap"
                          >
                            ↺ Reset to defaults
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {TRACKED_SPEC_ORDER.map(s => {
                          const checked = effectiveSet.has(s);
                          const isSuggested = suggestedSet.has(s);
                          return (
                            <label key={s} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(s)}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className={checked ? 'text-gray-800' : 'text-gray-500'}>{TRACKED_SPEC_LABELS[s]}</span>
                              {isSuggested && !checked && (
                                <span className="px-1 py-0 text-[8px] rounded font-sans uppercase tracking-wide border bg-sky-50 text-sky-700 border-sky-200 font-semibold">
                                  suggested
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Part Number — auto-assigned on first save; manually editable for custom numbering schemes. */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-500">
                      Part Number
                      <span className="text-gray-400 ml-2 font-normal">(finished-good SKU)</span>
                    </label>
                    {!partNumber && (
                      <button
                        onClick={() => setPartNumber(generatePartNumber(mode, savedFormulations))}
                        className="text-[10px] uppercase tracking-wide text-emerald-700 hover:text-emerald-900 font-medium"
                      >
                        ⚡ Auto-generate
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    placeholder={`Auto-assigns on save (e.g. ${mc.id === 'supplements' ? 'SUP' : mc.id === 'sausage' ? 'SAU' : mc.id === 'baking' ? 'BAK' : mc.id === 'feeds' ? 'FDS' : 'FB'}-${String(new Date().getFullYear()).slice(-2)}-0001)`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                    Stays stable across versions — the semantic version (1.0.0 → 1.0.1) conveys revisions. Override with your own ERP / internal SKU if needed.
                  </p>
                </div>
                <button onClick={saveFormulation} className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium">💾 Save formulation</button>
                {saveMessage && <p className="mt-3 text-emerald-600 font-medium">{saveMessage}</p>}
              </div>

              {/* Bulk Paste Panel */}
              {showPaste && (
                <div className="bg-white rounded-xl border-2 border-emerald-300 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-800">📋 Bulk Paste Formula</h2>
                    <button
                      onClick={() => { setShowPaste(false); setPasteText(''); setParsedRows([]); }}
                      className="text-gray-400 hover:text-red-500 text-sm"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Paste a formula from Excel, a spec sheet, a markdown table, or plain text. One ingredient per line. Supports <code className="bg-gray-100 px-1 rounded">|</code> pipe, tab, or comma separators — or just &ldquo;Soybean Oil 700g&rdquo; style.
                  </p>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={"Paste your formula here. Example:\n\n| Ingredient | Qty |\n|---|---|\n| Soybean Oil (RBD) | 700 g |\n| Water | 95 g |\n| Distilled White Vinegar | 80 g |\n| Dijon Mustard | 60 g |\n| Egg Yolk Powder | 20 g |\n| Lemon Juice Concentrate | 15 g |\n| Sugar | 15 g |\n| Salt | 10 g |\n| Natural Flavors | 5 g |"}
                    className="w-full h-40 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setParsedRows(parsePastedFormula(pasteText, INDUSTRIAL_DB))}
                      disabled={!pasteText.trim()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 transition"
                    >
                      🔍 Preview matches
                    </button>
                    <button
                      onClick={() => { setPasteText(''); setParsedRows([]); }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                    >
                      Clear
                    </button>
                  </div>

                  {parsedRows.length > 0 && (() => {
                    // Round 5 (2026-05-07): tier-based rendering. Tier 1/2 = silent
                    // import; Tier 3 = require confirmation (head-token mismatch or
                    // suffix-only similarity — the Celery Seed → Chia Seeds case);
                    // Tier 4 = no match found.
                    const counts = parsedRows.reduce(
                      (a, r) => {
                        if (r.matchTier === 1 || r.matchTier === 2) a.confident++;
                        else if (r.matchTier === 3) a.partial++;
                        else a.unmatched++;
                        return a;
                      },
                      { confident: 0, partial: 0, unmatched: 0 },
                    );
                    const importableCount = parsedRows.filter(r => r.accepted && r.matchedItem).length;
                    const skipRow = (idx: number) => setParsedRows(parsedRows.filter((_, i) => i !== idx));
                    return (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <p className="text-sm font-medium text-gray-700">
                          Parsed {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''}
                          {' '}<span className="text-emerald-600">({counts.confident} matched)</span>
                          {counts.partial > 0 && <span className="text-amber-700"> • {counts.partial} need confirmation</span>}
                          {counts.unmatched > 0 && <span className="text-red-500"> • {counts.unmatched} unmatched</span>}
                        </p>
                        <button
                          onClick={applyParsedRows}
                          disabled={importableCount === 0}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 transition font-medium"
                        >
                          {replaceOnPaste && ingredients.length > 0 ? '⟳ Replace with' : '+ Add'} {importableCount} ingredient{importableCount !== 1 ? 's' : ''}
                        </button>
                      </div>
                      {counts.partial > 0 && (
                        <div className="text-[11px] bg-amber-50 border border-amber-200 rounded p-2 mb-2 text-amber-900 leading-relaxed">
                          <span className="font-semibold">⚠ {counts.partial} partial match{counts.partial !== 1 ? 'es' : ''} need confirmation.</span>{' '}
                          Pasted ingredients with low-confidence matches (head-token mismatch or suffix similarity only). Confirm each below before importing — they will not be added until checked.
                        </div>
                      )}
                      {ingredients.length > 0 && (
                        <label className="flex items-start gap-2 text-xs text-gray-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={replaceOnPaste}
                            onChange={e => setReplaceOnPaste(e.target.checked)}
                            className="mt-0.5"
                          />
                          <span>
                            <span className="font-semibold">Replace the current formulation</span> ({ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}).
                            Uncheck to append instead.
                            <span className="block text-gray-500 mt-0.5">
                              Note: Product Type, Packaging, and Formulation Name stay unchanged — update them separately if switching to a different product.
                            </span>
                          </span>
                        </label>
                      )}
                      <div className="space-y-1 max-h-72 overflow-y-auto">
                        {parsedRows.map((r, idx) => {
                          const tier = r.matchTier;
                          // Row treatment by tier:
                          //   Tier 1/2 (matched + accepted): emerald
                          //   Tier 3 (partial — confirm):    amber
                          //   Tier 4 (no match):             red
                          const rowClass = tier === 1 || tier === 2
                            ? 'bg-emerald-50 border border-emerald-100'
                            : tier === 3
                              ? 'bg-amber-50 border border-amber-200'
                              : 'bg-red-50 border border-red-100';
                          return (
                          <div key={idx} className={`flex items-start gap-2 p-2 rounded text-xs ${rowClass}`}>
                            <input
                              type="checkbox"
                              checked={r.accepted}
                              disabled={!r.matchedItem}
                              onChange={(e) => {
                                const next = [...parsedRows];
                                next[idx] = { ...next[idx], accepted: e.target.checked };
                                setParsedRows(next);
                              }}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              {(tier === 1 || tier === 2) && r.matchedItem && (
                                <>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded font-medium">✓ Matched</span>
                                    <span className="font-semibold text-gray-800">{r.matchedItem.name}</span>
                                    <span className="text-gray-600">→ {r.parsedQty} {r.parsedUnit}</span>
                                    <span className="text-gray-400">• {r.matchedItem.category}</span>
                                  </div>
                                  <p className="text-gray-500 mt-0.5">
                                    Pasted: &ldquo;{r.parsedName}&rdquo; • Supplier: {r.matchedItem.suppliers[0]}
                                  </p>
                                  {r.volumeNote && (
                                    <p className="text-amber-700 mt-0.5">⚖️ {r.volumeNote}</p>
                                  )}
                                </>
                              )}
                              {tier === 3 && r.matchedItem && (
                                <>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded font-medium">⚠ Confirm match</span>
                                    <span className="font-semibold text-gray-800">{r.matchedItem.name}</span>
                                    <span className="text-gray-600">→ {r.parsedQty} {r.parsedUnit}</span>
                                    <span className="text-gray-400">• {r.matchedItem.category}</span>
                                  </div>
                                  <p className="text-gray-700 mt-0.5">
                                    Did you mean <span className="font-semibold">{r.matchedItem.name}</span>? You pasted &ldquo;<span className="font-mono">{r.parsedName}</span>&rdquo; — {r.matchReason || 'low-confidence match'}.
                                  </p>
                                  <div className="flex gap-2 mt-1.5">
                                    <button
                                      onClick={() => {
                                        const next = [...parsedRows];
                                        next[idx] = { ...next[idx], accepted: true };
                                        setParsedRows(next);
                                      }}
                                      disabled={r.accepted}
                                      className="px-2 py-0.5 text-[11px] bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                    >
                                      Confirm match
                                    </button>
                                    <button
                                      onClick={() => skipRow(idx)}
                                      className="px-2 py-0.5 text-[11px] bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition"
                                    >
                                      Skip this line
                                    </button>
                                    <span className="text-[11px] text-gray-500 self-center italic">or search below to pick a different ingredient manually</span>
                                  </div>
                                  {r.volumeNote && (
                                    <p className="text-amber-700 mt-0.5">⚖️ {r.volumeNote}</p>
                                  )}
                                </>
                              )}
                              {tier === 4 && (
                                <>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-red-200 text-red-900 rounded font-medium">✗ No match</span>
                                    <span className="font-semibold text-gray-800">{r.parsedName}</span>
                                    <span className="text-gray-600">→ {r.parsedQty} {r.parsedUnit}</span>
                                  </div>
                                  {r.volumeNote && (
                                    <p className="text-amber-700 mt-0.5">⚖️ {r.volumeNote}</p>
                                  )}
                                  <div className="flex gap-2 mt-1">
                                    <button
                                      onClick={() => skipRow(idx)}
                                      className="px-2 py-0.5 text-[11px] bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 transition"
                                    >
                                      Skip this line
                                    </button>
                                    <span className="text-[11px] text-gray-500 self-center italic">add manually via the search below — &ldquo;{r.parsedName}&rdquo; may be in USDA, or out of catalog scope</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                    );
                  })()}
                </div>
              )}

              {/* Add Ingredient */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">➕ Add Ingredient</h2>
                  {!showPaste && (
                    <button
                      onClick={() => setShowPaste(true)}
                      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                      title="Paste a full formula at once"
                    >
                      📋 Bulk Paste
                    </button>
                  )}
                </div>
                {selectedFood && (
                  <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm flex items-center gap-3">
                    <span className="font-medium text-emerald-700">✅ {selectedFood.type === 'industrial' ? '📦 Industrial DB' : '🌐 USDA'}</span>
                    {selectedFood.costPerKg > 0 && <span className="text-gray-500">~${selectedFood.costPerKg}/kg</span>}
                    {selectedFood.supplier && <span className="text-gray-500">• {selectedFood.supplier}</span>}
                  </div>
                )}
                <div className="flex gap-2" ref={dropdownRef}>
                  <div className="flex-1 relative">
                    <input type="text" placeholder="Search ingredients by name, supplier, or function..."
                      value={newIngredient} onChange={(e) => searchIngredients(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-emerald-500" />
                    {searching && <div className="absolute right-10 top-3 text-gray-400 text-sm">Searching...</div>}
                    {(newIngredient || newQty || selectedFood) && !searching && (
                      <button
                        type="button"
                        onClick={() => { setNewIngredient(''); setNewQty(''); setSelectedFood(null); setShowDropdown(false); setSearchResults([]); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 transition"
                        title="Clear search"
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    )}
                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-72 overflow-y-auto">
                        {searchResults.map((item, idx) => {
                          const isInd = isIndustrial(item);
                          return (
                            <button key={idx} onClick={() => selectIngredient(item)}
                              className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-gray-100 last:border-0 transition">
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: isInd ? '#d1fae5' : '#e0f2fe', color: isInd ? '#065f46' : '#0369a1' }}>
                                  {isInd ? '📦 Industrial' : '🌐 USDA'}
                                </span>
                                <span className="font-medium text-gray-800 text-sm">{isInd ? (item as IndustrialIngredient).name : (item as FoodResult).description}</span>
                              </div>
                              {isInd && <div className="text-xs text-gray-500 mt-0.5">~${(item as IndustrialIngredient).costPerKg}/kg • {(item as IndustrialIngredient).suppliers[0]}</div>}
                              {!isInd && (item as FoodResult).brandName && <div className="text-xs text-gray-500 mt-0.5">{(item as FoodResult).brandName}</div>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <input type="number" placeholder="Qty" value={newQty} onChange={(e) => setNewQty(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addIngredient()} className="w-20 text-center border border-gray-300 rounded-lg px-2 py-3 focus:outline-none focus:border-emerald-500" />
                  <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-3 text-sm bg-white focus:outline-none">{mc.units.map(u => <option key={u}>{u}</option>)}</select>
                  <button onClick={addIngredient} className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium whitespace-nowrap">Add</button>
                </div>
                <p className="text-xs text-gray-400 mt-2">💡 Industrial DB first, then USDA fallback. Or browse the 📦 Ingredient DB tab.</p>
              </div>

              {/* Ingredient List */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h2 className="text-lg font-semibold text-gray-800">Current Formulation</h2>
                  <div className="flex items-center gap-2">
                    {ingredients.some(i => VOLUME_UNITS.has(i.unit)) && (
                      <button
                        onClick={convertVolumesToGrams}
                        className="text-xs px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition font-medium"
                        title="Convert volume measurements (cups, tsp, tbsp, gal, etc.) to grams using each ingredient's density"
                      >
                        🔄 Normalize volumes → grams
                      </button>
                    )}
                    {ingredients.length > 0 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Clear all ${ingredients.length} ingredient${ingredients.length !== 1 ? 's' : ''}? This preserves the Product Type, Packaging, and Formulation Name.`)) {
                            clearFormulation();
                          }
                        }}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-medium"
                        title="Clear all ingredients from this formulation"
                      >
                        🗑️ Clear
                      </button>
                    )}
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">{ingredients.length} ingredients</span>
                  </div>
                </div>
                {ingredients.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">Add ingredients above to get started</div>
                ) : (
                  <div className="space-y-3">
                    {ingredients.map((ing, index) => {
                      const grams = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
                      const weightPct = totalBatchGrams > 0 ? (grams / totalBatchGrams) * 100 : 0;
                      const isVolume = VOLUME_UNITS.has(ing.unit);
                      const finding = complianceFindings.find(f => f.ingredientName === ing.name);
                      // Compare current sub-ingredients to DB default to show "modified" indicator
                      const dbDefaultSubs: string[] = ing.foodData?.type === 'industrial'
                        ? (ing.foodData?.data?.subIngredients || [])
                        : [];
                      const currentSubs = ing.subIngredients || [];
                      const subsModified =
                        dbDefaultSubs.length !== currentSubs.length ||
                        dbDefaultSubs.some((s, i) => s !== currentSubs[i]);
                      const hasDbDefault = ing.foodData?.type === 'industrial' && dbDefaultSubs.length > 0;
                      const rowBorder = finding?.violated
                        ? 'bg-red-50 border-red-300'
                        : finding
                          ? 'bg-amber-50 border-amber-200'
                          : isVolume
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-gray-50 border-gray-100';
                      const inlineFinding = perIngredientFindings[ing.name];
                      return (
                        <div key={index} id={`ingredient-row-${index}`} className={`border rounded-lg p-3 group ${rowBorder}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {inlineFinding && (
                              <FindingPopover finding={inlineFinding} />
                            )}
                            <input type="text" value={ing.name || ''} onChange={(e) => updateName(index, e.target.value)} className="flex-1 bg-transparent border-0 focus:outline-none font-medium text-gray-800 text-sm" />
                            <input type="number" min={0} step={0.01} value={ing.qty || ''} onChange={(e) => updateQuantity(index, e.target.value)} className="w-20 text-center bg-white border border-gray-300 rounded px-1 py-1 text-sm focus:outline-none" />
                            {/* Round 11 Phase 3 (2026-05-17) — Bug 2 closure:
                                editable unit dropdown. Pre-fix this was a static
                                <span>{ing.unit}</span>, so operators who pasted
                                or added an ingredient in mg couldn't switch to
                                g/kg/oz/lb without deleting + re-adding. The
                                dropdown auto-converts qty to preserve canonical
                                mass (500 mg → switch to g → 0.5 g). */}
                            <select
                              value={ing.unit}
                              onChange={(e) => updateUnit(index, e.target.value)}
                              className={`text-xs border border-gray-200 rounded px-1 py-1 bg-white focus:outline-none ${isVolume ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}
                              title="Change unit (auto-converts quantity to preserve mass)"
                            >
                              {mc.units.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                            <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono text-gray-600" title="Percent of total batch weight">
                              {weightPct.toFixed(1)}%
                            </span>
                            <button onClick={() => removeIngredient(index)} className="text-red-400 opacity-0 group-hover:opacity-100 transition text-sm hover:text-red-600">✕</button>
                          </div>
                          {isVolume && (
                            <p className="text-xs text-amber-700 mb-1.5">
                              ⚖️ Volume unit — click <span className="font-semibold">Normalize volumes → grams</span> above to convert to density-correct mass (currently computed as if water).
                            </p>
                          )}
                          {finding && (
                            <div className={`text-xs mb-1.5 px-2 py-1 rounded border ${finding.violated ? 'bg-red-100 border-red-300 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                              <span className="font-semibold inline-flex items-center gap-1">
                                {finding.violated
                                  ? <><Ban className="h-3 w-3 text-rose-700" aria-hidden="true" /><span>OVER LEGAL LIMIT</span></>
                                  : <><CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" /><span>within limit</span></>}
                              </span>
                              {' — '}
                              <span className="font-mono">{formatAmount(finding.currentPercent, finding.currentPpm)}</span>
                              {' / '}
                              <span className="font-mono">{finding.limit.maxPercent !== undefined ? `${finding.limit.maxPercent}%` : `${finding.limit.maxPpm} ppm`} max</span>
                              {' ('}{finding.utilization.toFixed(0)}% of cap{')'}
                              <div className="text-[10px] text-gray-600 mt-0.5 font-normal">
                                {finding.limit.authority} {finding.limit.citation} — {finding.limit.summary}
                              </div>
                              {finding.activeSpeciesPpm !== undefined && finding.limit.activeName && (
                                <div className={`text-[10px] mt-0.5 font-semibold ${finding.activeViolated ? 'text-red-800' : 'text-emerald-700'}`}>
                                  Active {finding.limit.activeName}: {finding.activeSpeciesPpm.toFixed(1)} ppm (max {finding.limit.activeMaxPpm} ppm)
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 flex-wrap">
                            <span>💰 $/kg:</span>
                            <input type="number" value={ing.costPerKg || ''} onChange={(e) => updateCost(index, e.target.value)} placeholder="0.00" className="w-20 bg-white border border-gray-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-emerald-400" />
                            {/* Cost confidence pill — reads from the underlying DB entry's costSource;
                                user-typed overrides display the same source's confidence (Session 4+
                                may add an explicit override flag to track user-edited values separately). */}
                            {(() => {
                              const ingDb = ing.foodData?.type === 'industrial' ? (ing.foodData.data as IndustrialIngredient) : null;
                              return <ConfidencePill conf={mapCostToConfidence(ingDb)} size="xs" />;
                            })()}
                            <span className="text-emerald-600 font-medium">${(grams / 1000 * (ing.costPerKg || 0)).toFixed(3)} total</span>
                            <span className="text-gray-400">• {grams.toFixed(1)} g</span>
                            {ing.supplier && <span className="text-gray-400">• {ing.supplier}</span>}
                            {/* ─── Raw Material Spec Sheet button ─── */}
                            <button
                              onClick={() => setSpecSheetIngredientIndex(index)}
                              title="Generate supplier-facing spec sheet for this ingredient"
                              className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[10px] font-semibold hover:bg-sky-100 transition"
                            >
                              📋 Spec Sheet
                            </button>
                            {/* ─── Make Organic / Revert to Conventional button ─── */}
                            {(() => {
                              if (/\borganic\b/i.test(ing.name)) {
                                const revertPreview = convertIngredientToConventional(ing, INDUSTRIAL_DB, '');
                                if (!revertPreview) {
                                  return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-semibold">🌱 Organic</span>;
                                }
                                const deltaStr = revertPreview.costDeltaPerKg <= 0
                                  ? `−$${Math.abs(revertPreview.costDeltaPerKg).toFixed(2)}/kg`
                                  : `+$${revertPreview.costDeltaPerKg.toFixed(2)}/kg`;
                                return (
                                  <div className="flex items-center gap-1">
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-semibold">🌱 Organic</span>
                                    <button
                                      onClick={() => {
                                        const confirmMsg = revertPreview.source === 'db-match'
                                          ? `Revert "${ing.name}"\n→ "${revertPreview.ingredient.name}"\n\nPrice ${deltaStr} (actual conventional SKU from DB).`
                                          : `Revert "${ing.name}" to conventional (${deltaStr}).\n\n${revertPreview.note}`;
                                        if (window.confirm(confirmMsg)) {
                                          const updated = [...ingredients];
                                          updated[index] = revertPreview.ingredient;
                                          setIngredients(updated);
                                          recalculate(updated);
                                        }
                                      }}
                                      title={`Revert to conventional • ${revertPreview.note}`}
                                      className="px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 rounded text-[10px] font-medium hover:bg-gray-200 transition"
                                    >
                                      ↩ Revert ({deltaStr})
                                    </button>
                                  </div>
                                );
                              }
                              const cat = ing.foodData?.type === 'industrial'
                                ? (ing.foodData.data as IndustrialIngredient).category
                                : '';
                              const profile = getSustainabilityProfile({ name: ing.name, category: cat });
                              if (!profile.organicAvailable) return null;
                              const preview = convertIngredientToOrganic(ing, INDUSTRIAL_DB, cat);
                              if (!preview) return null;
                              const deltaStr = preview.costDeltaPerKg >= 0
                                ? `+$${preview.costDeltaPerKg.toFixed(2)}/kg`
                                : `−$${Math.abs(preview.costDeltaPerKg).toFixed(2)}/kg`;
                              return (
                                <button
                                  onClick={() => {
                                    const confirmMsg = preview.source === 'db-match'
                                      ? `Swap "${ing.name}"\n→ "${preview.ingredient.name}"\n\nPrice ${deltaStr} (actual SKU match from DB).`
                                      : `Convert "${ing.name}" to its organic variant at +${Math.round((profile.organicPricePremium - 1) * 100)}% premium (${deltaStr}).\n\n${preview.note}`;
                                    if (window.confirm(confirmMsg)) {
                                      const updated = [...ingredients];
                                      updated[index] = preview.ingredient;
                                      setIngredients(updated);
                                      recalculate(updated);
                                    }
                                  }}
                                  title={`Convert to organic variant • ${preview.note}`}
                                  className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold hover:bg-emerald-100 transition"
                                >
                                  🌱 Make Organic ({deltaStr})
                                </button>
                              );
                            })()}
                          </div>
                          {ing.allergens?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">{ing.allergens.map(a => <span key={a} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-600" aria-hidden="true" /><span>{a}</span></span>)}</div>
                          )}
                          {/* Sub-ingredient statement — editable override for specific brands */}
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                              <label className="text-[10px] uppercase tracking-wide font-semibold text-gray-600">
                                Sub-Ingredient Statement
                                {subsModified && hasDbDefault && (
                                  <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-medium normal-case tracking-normal">modified from DB</span>
                                )}
                                {!hasDbDefault && ing.foodData && (
                                  <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-medium normal-case tracking-normal">USDA / custom</span>
                                )}
                              </label>
                              {subsModified && hasDbDefault && (
                                <button
                                  onClick={() => resetSubIngredients(index)}
                                  className="text-[10px] text-gray-500 hover:text-emerald-700 transition font-medium"
                                  title="Restore sub-ingredients to the database default for this SKU"
                                >
                                  ↺ Reset to DB default
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={ing.subIngredients?.join(', ') || ''}
                              onChange={(e) => updateSubIngredients(index, e.target.value)}
                              placeholder="Comma-separated sub-ingredients — e.g., 'Tomato Concentrate, Distilled Vinegar, HFCS, Salt'"
                              className="w-full text-xs bg-white border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                            />
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Drives the FDA ingredient statement. Override if your branded product&apos;s COA shows different sub-ingredients.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Serving & Package Size.
                  Round 11 Phase 3 Workstream A.5 [5b/N] #25l structural fix:
                  delivery-form-aware input model. Count-based forms (capsule/
                  tablet/softgel/gummy/lozenge/chewable) consume count inputs +
                  per-unit weight; mass shown read-only. Mass/volume forms keep
                  editable mass/volume inputs with constrained unit dropdowns
                  (closes the 60M-servings input vector — no mcg for serving
                  size). F&B mode unchanged. */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Serving & Package Size</h2>
                {mode === 'supplements' && categorizeDeliveryForm(suppDeliveryForm) === 'count' ? (
                  // ─── Count-based supplement form variant ─────────────────
                  (() => {
                    const noun = SUPP_FORM_NOUN[suppDeliveryForm];
                    const unitWord = suppUnitsPerServing === 1 ? noun.singular : noun.plural;
                    const semantics = perUnitWeightSemantics(suppDeliveryForm);
                    // Round 11 Phase 3 (2026-05-17) fix: display 0/0 when no
                    // operator count input has been entered. Pre-fix behavior
                    // seeded with autoServingsPerContainer (which falls back
                    // to 1 when mass is empty, OR to whatever value the sync
                    // useEffect previously wrote) — produced fake count values
                    // after bulk paste before operator had a chance to enter
                    // their real intent.
                    const hasOperatorInput =
                      servingsPerContainerOverride !== null ||
                      totalUnitsOverride !== null ||
                      lastEditedCountField !== null;
                    const reconciled = hasOperatorInput
                      ? reconcileCountInputs({
                          servings: servingsPerContainerOverride ?? 0,
                          totalUnits: totalUnitsOverride ?? 0,
                          unitsPerServing: suppUnitsPerServing,
                          lastEdited: lastEditedCountField,
                        })
                      : { servings: 0, totalUnits: 0 };
                    const displayServings = reconciled.servings;
                    const displayTotalUnits = reconciled.totalUnits;
                    // Per-unit weight + derived mass — Round 11 Phase 3 post-A.5
                    // follow-up (2026-05-17). Ingredient entries are per-serving
                    // doses (locked-in supplements contract), so totalBatchGrams
                    // is the per-serving total in grams.
                    //
                    // SP3 split:
                    //  • capacity-derived (capsule/softgel): per-unit fill =
                    //    per-serving actives ÷ units-per-serving. Total per
                    //    serving = formulation sum.
                    //  • operator-input (tablet/gummy/lozenge/chewable): per-unit
                    //    weight is operator's die-set / mold target. Per-serving
                    //    total = target × units-per-serving (any gap between
                    //    actives and target is implicit filler).
                    const perServingMgFromFormulation = totalBatchGrams * 1000;
                    const perUnitMg = semantics === 'capacity-derived'
                      ? (suppUnitsPerServing > 0 ? perServingMgFromFormulation / suppUnitsPerServing : 0)
                      : suppPerUnitWeightMg;
                    const derivedServingMassMg = semantics === 'capacity-derived'
                      ? perServingMgFromFormulation
                      : suppPerUnitWeightMg * suppUnitsPerServing;
                    const derivedPackageMassG = (perUnitMg * displayTotalUnits) / 1000;
                    return (
                      <>
                        <div className="grid grid-cols-3 gap-4">
                          {/* Servings/Container — operator editable */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-600">Servings/Container</label>
                              {(servingsPerContainerOverride !== null || lastEditedCountField !== null) && (
                                <button
                                  onClick={() => {
                                    setServingsPerContainerOverride(null);
                                    setTotalUnitsOverride(null);
                                    setLastEditedCountField(null);
                                  }}
                                  className="text-[10px] uppercase tracking-wide text-emerald-700 hover:text-emerald-900 font-medium"
                                  title="Reset to auto-derived values"
                                >
                                  ↻ auto
                                </button>
                              )}
                            </div>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={displayServings}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (isNaN(v) || v <= 0) {
                                  setServingsPerContainerOverride(null);
                                } else {
                                  setServingsPerContainerOverride(v);
                                  setLastEditedCountField('servings');
                                }
                              }}
                              className="w-full text-center border border-emerald-300 rounded-lg px-2 py-2 text-lg font-bold focus:outline-none focus:border-emerald-500"
                            />
                            <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                              How many servings per bottle / pouch / container.
                            </p>
                          </div>
                          {/* Total Units in Package — bidirectional with Servings */}
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                              Total {unitWord} / Container
                            </label>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={displayTotalUnits}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                if (isNaN(v) || v <= 0) {
                                  setTotalUnitsOverride(null);
                                } else {
                                  setTotalUnitsOverride(v);
                                  setLastEditedCountField('totalUnits');
                                }
                              }}
                              className="w-full text-center border border-emerald-300 rounded-lg px-2 py-2 text-lg font-bold focus:outline-none focus:border-emerald-500"
                            />
                            <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                              Auto-syncs with Servings × Units Per Serving ({suppUnitsPerServing}).
                            </p>
                          </div>
                          {/* Per-Unit Weight — derived for capsule/softgel; operator-input for tablet/gummy/lozenge/chewable */}
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                              Per-{noun.singular} Weight
                            </label>
                            {semantics === 'capacity-derived' ? (
                              <>
                                <div className="w-full text-center border border-gray-200 bg-gray-50 rounded-lg px-2 py-2 text-lg font-bold text-emerald-700">
                                  {formatMassDisplay(perUnitMg)}
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                                  Derived from formulation ÷ total {unitWord.toLowerCase()}.
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="flex gap-1">
                                  <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={suppPerUnitWeightMg}
                                    onChange={(e) => {
                                      const v = parseFloat(e.target.value);
                                      if (!isNaN(v) && v > 0) setSuppPerUnitWeightMg(v);
                                    }}
                                    className="w-full text-center border border-emerald-300 rounded-lg px-2 py-2 text-lg font-bold focus:outline-none focus:border-emerald-500"
                                  />
                                  <div className="border border-gray-200 bg-gray-50 rounded-lg px-2 py-2 text-sm text-gray-600">mg</div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                                  Target {noun.singular.toLowerCase()} weight (die-set / mold).
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        {/* Derived mass display — read-only */}
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-700 leading-relaxed">
                          <p>
                            <span className="font-semibold">Label will read:</span>{' '}
                            <span className="font-mono">&ldquo;{suppUnitsPerServing} {unitWord}&rdquo;</span>
                            {' '}per serving.
                          </p>
                          <p className="mt-0.5">
                            <span className="font-semibold">Serving Size (mass):</span>{' '}
                            <span className="font-mono">{formatMassDisplay(derivedServingMassMg)}</span>
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="font-semibold">Package Size (mass):</span>{' '}
                            <span className="font-mono">{derivedPackageMassG.toFixed(2)} g</span>
                          </p>
                          <p className="mt-0.5 text-[10px] text-gray-400 italic">
                            Computed from count inputs + per-unit weight. Serving Size mass is no longer directly editable for {suppDeliveryForm} forms.
                          </p>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  // ─── Mass-based / volume-based supplement variant + F&B variant ─────
                  // Round 11 Phase 3 (2026-05-17): min={0} + step={0.01} so
                  // operator can leave fields empty for fresh formulations and
                  // enter 0.01 g precision (typical supplement formulator needs
                  // decimal grams for trace ingredients).
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Serving Size <span className="text-[10px] font-normal text-emerald-700">✎ editable</span>
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="e.g., 30"
                          value={servingSize > 0 ? servingSize : ''}
                          onChange={(e) => setServingSize(validateServingSizeInput(e.target.value))}
                          className="w-full text-center border-2 border-emerald-300 bg-emerald-50/40 rounded-lg px-2 py-2 text-lg font-bold focus:outline-none focus:border-emerald-600 focus:bg-white placeholder:text-gray-400 placeholder:text-sm placeholder:font-normal"
                        />
                        <select value={servingUnit} onChange={(e) => setServingUnit(e.target.value)} className="border-2 border-emerald-300 bg-emerald-50/40 rounded-lg px-1 py-2 text-sm focus:outline-none focus:bg-white">
                          {(mode === 'supplements' ? allowedServingUnits(suppDeliveryForm) : mc.units).map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                      {mode === 'supplements' && (
                        <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                          {suppDeliveryForm === 'powder' ? (
                            <>Label will read <span className="font-mono">&ldquo;1 Scoop ({servingSize}{servingUnit})&rdquo;</span>.</>
                          ) : suppDeliveryForm === 'liquid' ? (
                            <>Label will read <span className="font-mono">&ldquo;1 Dropper ({servingSize}{servingUnit})&rdquo;</span>.</>
                          ) : null}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Package Size <span className="text-[10px] font-normal text-emerald-700">✎ editable</span>
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="e.g., 300"
                          value={packageSize > 0 ? packageSize : ''}
                          onChange={(e) => setPackageSize(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full text-center border-2 border-emerald-300 bg-emerald-50/40 rounded-lg px-2 py-2 text-lg font-bold focus:outline-none focus:border-emerald-600 focus:bg-white placeholder:text-gray-400 placeholder:text-sm placeholder:font-normal"
                        />
                        <select value={packageUnit} onChange={(e) => setPackageUnit(e.target.value)} className="border-2 border-emerald-300 bg-emerald-50/40 rounded-lg px-1 py-2 text-sm focus:outline-none focus:bg-white">
                          {(mode === 'supplements' ? allowedPackageUnits(suppDeliveryForm) : mc.units).map(u => <option key={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Servings/Container <span className="text-[10px] font-normal text-gray-400">auto-computed</span>
                      </label>
                      <div className="w-full text-center border-2 border-gray-200 bg-gray-50 rounded-lg px-2 py-2 text-lg font-bold text-gray-700">
                        {servingsPerContainer > 0 ? servingsPerContainer : '—'}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                        {formattedServingsPerContainer
                          ? `Label: "${formattedServingsPerContainer}" (FDA 21 CFR 101.9(b)(8))`
                          : 'Enter Serving Size + Package Size to compute.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  SUPPLEMENT DOSAGE & DELIVERY FORM (supplements mode only)
                  Lets formulators pick the delivery format (capsule / softgel /
                  gummy / powder / liquid / etc.), units per serving, and — for
                  hard-shell capsules — the capsule size, then computes the
                  required fill weight per unit and its capacity utilization.
                  This drives the "Serving Size: N Capsules" line on the
                  Supplement Facts label.
                  ═══════════════════════════════════════════════════════════ */}
              {mode === 'supplements' && (() => {
                // Fill weight per unit in milligrams (serving / unitsPerServing).
                // For count-based forms post-5b, servingSizeInGrams is itself
                // derived from count inputs via the sync useEffect, so this
                // computation is consistent with the count-based input model.
                const fillWeightMg = suppUnitsPerServing > 0
                  ? (servingSizeInGrams * 1000) / suppUnitsPerServing
                  : 0;
                const capsuleCap = capsuleCapacityMg(suppCapsuleSize);
                const capsuleUsagePct = capsuleCap > 0 ? (fillWeightMg / capsuleCap) * 100 : 0;
                const isCapsule = suppDeliveryForm === 'capsule' || suppDeliveryForm === 'softgel';
                // Round 11 Phase 3 Workstream A.5 [5c/N] — SP9 color band
                // classification via utilizationBand helper (single source
                // of truth at lib/servingModel.ts). Bands:
                //   • grey       — 0% (empty / not-yet-evaluable)
                //   • amber-low  — <50% (cost-optimization advisory)
                //   • green      — 50-90% (normal range)
                //   • amber-high — 90-100% (approaching over-fill)
                //   • red        — >100% (impossible as specified — SP10 over-fill)
                // Replaces the pre-A.5 hand-coded 40%/100%/1.5x-largest thresholds.
                const utilizationRatio = capsuleUsagePct / 100;
                const band = isCapsule && fillWeightMg > 0
                  ? utilizationBand(utilizationRatio)
                  : 'grey';
                let capAdvice = '';
                if (isCapsule && fillWeightMg > 0) {
                  switch (band) {
                    case 'red':
                      capAdvice = `Over-fill — fill weight ${Math.round(fillWeightMg).toLocaleString()} mg exceeds capsule capacity ${capsuleCap} mg (${capsuleUsagePct.toFixed(0)}% utilization). Reduce ingredient mass or select a larger capsule size.`;
                      break;
                    case 'amber-high':
                      capAdvice = `Approaching over-fill — ${capsuleUsagePct.toFixed(0)}% of capsule capacity. May not pack reliably; consider a larger capsule size.`;
                      break;
                    case 'green':
                      capAdvice = `On target — ${capsuleUsagePct.toFixed(0)}% fill density reduces breakage and powder settling.`;
                      break;
                    case 'amber-low':
                      capAdvice = `Low fill — ${capsuleUsagePct.toFixed(0)}% of capsule capacity. Consider a smaller capsule for cleaner presentation and lower cost.`;
                      break;
                    case 'grey':
                      // Empty formulation; no advice needed
                      break;
                  }
                }
                const statusColor = band === 'red' ? 'text-red-700 bg-red-50 border-red-300'
                                  : band === 'amber-high' ? 'text-amber-700 bg-amber-50 border-amber-300'
                                  : band === 'amber-low' ? 'text-amber-700 bg-amber-50 border-amber-200'
                                  : band === 'green' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                  : 'text-slate-600 bg-slate-50 border-slate-200';
                return (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">💊 Delivery Form & Dosage</h2>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">21 CFR 101.36</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Delivery Form</label>
                        <select
                          value={suppDeliveryForm}
                          onChange={(e) => setSuppDeliveryForm(e.target.value as SupplementDeliveryForm)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="capsule">Capsule (hard shell)</option>
                          <option value="softgel">Softgel (soft gel)</option>
                          <option value="tablet">Tablet</option>
                          <option value="chewable">Chewable Tablet</option>
                          <option value="gummy">Gummy</option>
                          <option value="lozenge">Lozenge</option>
                          <option value="powder">Powder (Scoop)</option>
                          <option value="liquid">Liquid (Dropper / Spray)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Units Per Serving</label>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={suppUnitsPerServing}
                          onChange={(e) => setSuppUnitsPerServing(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full text-center border border-gray-300 rounded-lg px-2 py-2 text-lg font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      {isCapsule && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Capsule Size</label>
                          <select
                            value={suppCapsuleSize}
                            onChange={(e) => setSuppCapsuleSize(e.target.value as CapsuleSize)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500"
                          >
                            <option value="000">#000 — 1370 mg (largest)</option>
                            <option value="00">#00 — 950 mg</option>
                            <option value="0">#0 — 680 mg (most common)</option>
                            <option value="1">#1 — 500 mg</option>
                            <option value="2">#2 — 355 mg</option>
                            <option value="3">#3 — 275 mg</option>
                            <option value="4">#4 — 205 mg</option>
                            <option value="5">#5 — 130 mg (smallest)</option>
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Intended Audience</label>
                        <select
                          value={suppAudience}
                          onChange={(e) => setSuppAudience(e.target.value as SupplementAudience)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="general">General Adult</option>
                          <option value="pregnancy">Prenatal / Pregnancy</option>
                          <option value="pediatric">Pediatric (under 9)</option>
                          <option value="athletic">Athletic / Sport (NSF Certified for Sport context)</option>
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                          Tightens dose limits for retinol, iron, caffeine, and melatonin.
                        </p>
                      </div>
                    </div>

                    {/* Fill weight + capacity utilization — only meaningful for capsules/softgels */}
                    {isCapsule && fillWeightMg > 0 && (
                      <div className={`mt-4 border rounded-lg p-4 ${statusColor}`}>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          <div>
                            <div className="text-[10px] uppercase tracking-wide opacity-70">Fill Weight / unit</div>
                            <div className="font-bold text-lg">{formatMassDisplay(fillWeightMg)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wide opacity-70">Capsule capacity</div>
                            <div className="font-bold text-lg">{capsuleCap} mg</div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wide opacity-70">Utilization</div>
                            <div className="font-bold text-lg">{capsuleUsagePct.toFixed(0)}%</div>
                          </div>
                          <div className="flex-1 min-w-[200px]">
                            <div className="text-[10px] uppercase tracking-wide opacity-70">Status</div>
                            <div className="text-xs font-medium leading-snug mt-0.5">{capAdvice}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {suppDeliveryForm === 'powder' && (
                      <p className="mt-3 text-xs text-gray-600 leading-snug">
                        Powder serving — the label will read <span className="font-mono bg-gray-50 px-1">1 Scoop ({servingSize}{servingUnit})</span>.
                        Use the Serving Size field below to set the gram weight of one scoop.
                      </p>
                    )}
                    {suppDeliveryForm === 'liquid' && (
                      <p className="mt-3 text-xs text-gray-600 leading-snug">
                        Liquid serving — label will read <span className="font-mono bg-gray-50 px-1">1 Dropper ({servingSize}{servingUnit})</span>.
                        Standard glass dropper delivers ≈1 ml per squeeze; tune the Serving Size below.
                      </p>
                    )}
                    {suppDeliveryForm === 'gummy' && (
                      <p className="mt-3 text-xs text-gray-600 leading-snug">
                        Gummy formulations are limited on actives density (~100-500 mg per gummy).
                        Set Serving Size to the gram weight of one gummy × units per serving.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Packaging & Closure — title adapts to the active mode */}
              <div className={`bg-white rounded-xl border p-6 ${mc.packagingRelevance === 'secondary' ? 'border-gray-200 opacity-90' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">{mc.packagingSectionTitle}</h2>
                  <button
                    onClick={() => setShowPackagingSheet(true)}
                    className="text-xs px-3 py-1.5 bg-sky-600 text-white rounded hover:bg-sky-700 transition font-medium"
                    title="Generate a printable Packaging Data Sheet"
                  >
                    📄 Data Sheet
                  </button>
                </div>
                {mc.packagingRelevance === 'secondary' && (
                  <p className="text-xs text-gray-500 mb-3 italic">
                    Optional for this mode — in {mc.name.toLowerCase()} you&apos;re usually making plated or buffet items, not packaged retail units.
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-600">Container</label>
                      <button
                        onClick={() => {
                          setDraftCustom({
                            name: customContainer?.name || '',
                            material: customContainer?.material || '',
                            capacityVal: customContainer?.capacity?.value ?? 0,
                            capacityUnit: customContainer?.capacity?.unit || 'ml',
                            neckFinish: customContainer?.neckFinish || '',
                            costPerUnit: customContainer?.costPerUnit || 0,
                            kind: 'container',
                            unitsPerCase: customContainer?.casePack?.unitsPerCase ?? 0,
                            casesPerLayer: customContainer?.casePack?.casesPerLayer ?? 0,
                            layersPerPallet: customContainer?.casePack?.layersPerPallet ?? 0,
                            palletType: customContainer?.casePack?.palletType || '48x40 GMA',
                          });
                          setShowContainerForm(v => !v);
                        }}
                        className="text-[10px] uppercase tracking-wide text-emerald-700 hover:text-emerald-900 font-medium"
                      >
                        {customContainer ? '✎ Edit Custom' : '+ Add Custom'}
                      </button>
                    </div>
                    <select
                      value={selectedPackaging?.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const next = val === (customContainer?.name ?? '\0') && customContainer
                          ? customContainer
                          : (PACKAGING_DB.find(p => p.name === val) || null);
                        setSelectedPackaging(next);
                        // If switching to a container with integrated closure OR an incompatible neck, clear the closure.
                        if (next && selectedClosure) {
                          if (!needsExternalClosure(next) || !isClosureCompatible(next, selectedClosure)) {
                            setSelectedClosure(null);
                          }
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">— Select a container —</option>
                      {customContainer && (
                        <optgroup label="✎ My Custom Container">
                          <option value={customContainer.name}>{customContainer.name} — ${customContainer.costPerUnit.toFixed(2)}</option>
                        </optgroup>
                      )}
                      {recommendedContainers.length > 0 && (
                        <optgroup label={`⭐ Recommended for ${productType}`}>
                          {recommendedContainers.map(p => (
                            <option key={p.name} value={p.name}>{p.name} — ${p.costPerUnit.toFixed(2)}</option>
                          ))}
                        </optgroup>
                      )}
                      {containerCategories.map(cat => {
                        const items = containerItems.filter(p => p.category === cat && !recommendedContainerNames.has(p.name));
                        if (items.length === 0) return null;
                        return (
                          <optgroup key={cat} label={cat}>
                            {items.map(p => (
                              <option key={p.name} value={p.name}>{p.name} — ${p.costPerUnit.toFixed(2)}</option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>

                    {/* Inline form for defining (or editing) a custom container */}
                    {showContainerForm && (
                      <div className="mt-2 p-3 border border-emerald-300 bg-emerald-50 rounded-lg space-y-2">
                        <div className="text-xs font-semibold text-emerald-900">Define custom container</div>
                        <input
                          type="text"
                          placeholder="Name (e.g. Half-Carafe, 4oz Boston Round, Custom Pouch)"
                          value={draftCustom.name}
                          onChange={e => setDraftCustom({ ...draftCustom, name: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Material (HDPE, glass, etc.)"
                            value={draftCustom.material}
                            onChange={e => setDraftCustom({ ...draftCustom, material: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                          />
                          <input
                            type="text"
                            placeholder="Neck / Finish (38-400 CRC, etc.)"
                            value={draftCustom.neckFinish}
                            onChange={e => setDraftCustom({ ...draftCustom, neckFinish: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            step={0.1}
                            min={0}
                            placeholder="Capacity"
                            value={draftCustom.capacityVal || ''}
                            onChange={e => setDraftCustom({ ...draftCustom, capacityVal: parseFloat(e.target.value) || 0 })}
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                          />
                          <select
                            value={draftCustom.capacityUnit}
                            onChange={e => setDraftCustom({ ...draftCustom, capacityUnit: e.target.value })}
                            className="border border-gray-300 rounded px-1 py-1 text-xs bg-white focus:outline-none"
                          >
                            {mc.units.map(u => <option key={u}>{u}</option>)}
                          </select>
                          <input
                            type="number"
                            step={0.001}
                            min={0}
                            placeholder="$/unit"
                            value={draftCustom.costPerUnit || ''}
                            onChange={e => setDraftCustom({ ...draftCustom, costPerUnit: parseFloat(e.target.value) || 0 })}
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        {/* Case pack & pallet config — optional but appears on the Packaging Data Sheet */}
                        <div className="pt-2 mt-1 border-t border-emerald-200">
                          <div className="text-[10px] uppercase tracking-wide text-emerald-900 font-semibold mb-1">Case Pack & Pallet (optional)</div>
                          <div className="grid grid-cols-4 gap-2">
                            <input
                              type="number"
                              min={0}
                              placeholder="Units / case"
                              value={draftCustom.unitsPerCase || ''}
                              onChange={e => setDraftCustom({ ...draftCustom, unitsPerCase: parseInt(e.target.value) || 0 })}
                              className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                            />
                            <input
                              type="number"
                              min={0}
                              placeholder="Cases / layer"
                              value={draftCustom.casesPerLayer || ''}
                              onChange={e => setDraftCustom({ ...draftCustom, casesPerLayer: parseInt(e.target.value) || 0 })}
                              className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                            />
                            <input
                              type="number"
                              min={0}
                              placeholder="Layers / pallet"
                              value={draftCustom.layersPerPallet || ''}
                              onChange={e => setDraftCustom({ ...draftCustom, layersPerPallet: parseInt(e.target.value) || 0 })}
                              className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                            />
                            <select
                              value={draftCustom.palletType}
                              onChange={e => setDraftCustom({ ...draftCustom, palletType: e.target.value })}
                              className="border border-gray-300 rounded px-1 py-1 text-xs bg-white focus:outline-none"
                            >
                              <option value="48x40 GMA">48×40 GMA</option>
                              <option value="42x48 Beverage">42×48 Beverage</option>
                              <option value="48x48 Square">48×48 Square</option>
                              <option value="Euro 48x32">Euro 48×32</option>
                              <option value="Custom">Custom</option>
                            </select>
                          </div>
                          {draftCustom.unitsPerCase > 0 && draftCustom.casesPerLayer > 0 && draftCustom.layersPerPallet > 0 && (
                            <p className="text-[10px] text-emerald-900 mt-1 leading-tight">
                              Ti-Hi: <span className="font-mono">{draftCustom.casesPerLayer}×{draftCustom.layersPerPallet}</span> ·
                              Cases/pallet: <span className="font-mono font-bold">{draftCustom.casesPerLayer * draftCustom.layersPerPallet}</span> ·
                              Units/pallet: <span className="font-mono font-bold">{(draftCustom.unitsPerCase * draftCustom.casesPerLayer * draftCustom.layersPerPallet).toLocaleString()}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              if (!draftCustom.name.trim()) return;
                              // Re-use the existing custom container's part number if editing,
                              // otherwise mint a fresh one from the monotonic counter.
                              const pnMatch = customContainer?.notes.match(/Part #: (FWP-CUS-\d+)/);
                              const pn = pnMatch?.[1] ?? getCustomPackagingPartNumber(customPackagingSeq);
                              if (!pnMatch) setCustomPackagingSeq(n => n + 1);
                              const hasCasePack = draftCustom.unitsPerCase > 0 || draftCustom.casesPerLayer > 0 || draftCustom.layersPerPallet > 0;
                              const newItem: PackagingItem = {
                                name: draftCustom.name.trim(),
                                category: 'Custom',
                                material: draftCustom.material || 'User-defined',
                                capacity: draftCustom.capacityVal > 0 ? { value: draftCustom.capacityVal, unit: draftCustom.capacityUnit } : undefined,
                                neckFinish: draftCustom.neckFinish || undefined,
                                suppliers: ['Custom / user-defined'],
                                costPerUnit: draftCustom.costPerUnit,
                                notes: `Part #: ${pn}. Custom container defined by user. Not from the packaging database.`,
                                casePack: hasCasePack ? {
                                  unitsPerCase: draftCustom.unitsPerCase,
                                  casesPerLayer: draftCustom.casesPerLayer || undefined,
                                  layersPerPallet: draftCustom.layersPerPallet || undefined,
                                  palletType: draftCustom.palletType,
                                  tiHi: draftCustom.casesPerLayer > 0 && draftCustom.layersPerPallet > 0
                                    ? `${draftCustom.casesPerLayer}×${draftCustom.layersPerPallet}` : undefined,
                                } : undefined,
                              };
                              setCustomContainer(newItem);
                              setSelectedPackaging(newItem);
                              setShowContainerForm(false);
                            }}
                            className="flex-1 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
                          >
                            Save custom container
                          </button>
                          {customContainer && (
                            <button
                              onClick={() => {
                                if (selectedPackaging === customContainer) setSelectedPackaging(null);
                                setCustomContainer(null);
                                setShowContainerForm(false);
                              }}
                              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50"
                            >
                              Delete
                            </button>
                          )}
                          <button
                            onClick={() => setShowContainerForm(false)}
                            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedPackaging && (
                      <div className="mt-2 p-2 bg-emerald-50 border border-emerald-100 rounded text-xs">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="font-semibold text-emerald-800">${selectedPackaging.costPerUnit.toFixed(3)}/unit</span>
                          <span className="text-gray-600">• {selectedPackaging.material}</span>
                          {selectedPackaging.capacity && selectedPackaging.capacity.value > 0 && <span className="text-gray-600">• {selectedPackaging.capacity.value}{selectedPackaging.capacity.unit}</span>}
                          {selectedPackaging.neckFinish && <span className="text-gray-600">• {selectedPackaging.neckFinish}</span>}
                        </div>
                        <p className="text-gray-500 mt-1">🏭 {selectedPackaging.suppliers.slice(0, 3).join(' • ')}</p>
                        {selectedPackaging.application && selectedPackaging.application.length > 0 && (
                          <p className="text-gray-500 mt-0.5">Fit: {selectedPackaging.application.join(', ')}</p>
                        )}
                        <p className="text-gray-400 mt-0.5 italic">{selectedPackaging.notes}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-600">Closure / Dispenser</label>
                      <button
                        onClick={() => {
                          setDraftCustom({
                            name: customClosure?.name || '',
                            material: customClosure?.material || '',
                            capacityVal: customClosure?.capacity?.value ?? 0,
                            capacityUnit: customClosure?.capacity?.unit || 'ml',
                            neckFinish: customClosure?.neckFinish || '',
                            costPerUnit: customClosure?.costPerUnit || 0,
                            kind: 'closure',
                            unitsPerCase: 0, casesPerLayer: 0, layersPerPallet: 0, palletType: '48x40 GMA',
                          });
                          setShowClosureForm(v => !v);
                        }}
                        className="text-[10px] uppercase tracking-wide text-emerald-700 hover:text-emerald-900 font-medium"
                      >
                        {customClosure ? '✎ Edit Custom' : '+ Add Custom'}
                      </button>
                    </div>
                    {selectedPackaging && !needsExternalClosure(selectedPackaging) ? (
                      <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500">
                        <span className="font-medium text-gray-700">✓ Integrated closure</span>
                        <p className="text-xs text-gray-500 mt-1">
                          This container ships with its own closure ({selectedPackaging.neckFinish || 'built-in'}). No separate cap needed.
                        </p>
                      </div>
                    ) : (
                      <>
                        <select
                          value={selectedClosure?.name || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const next = val === (customClosure?.name ?? '\0') && customClosure
                              ? customClosure
                              : (PACKAGING_DB.find(p => p.name === val) || null);
                            setSelectedClosure(next);
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">— Select a closure —</option>
                          {customClosure && (
                            <optgroup label="✎ My Custom Closure">
                              <option value={customClosure.name}>{customClosure.name} — ${customClosure.costPerUnit.toFixed(2)}</option>
                            </optgroup>
                          )}
                          {selectedPackaging ? (
                            <>
                              {/* Compatible closures (matching neck finish) first */}
                              {(() => {
                                const compatible = closureItems.filter(c => isClosureCompatible(selectedPackaging, c));
                                const incompatible = closureItems.filter(c => !isClosureCompatible(selectedPackaging, c));
                                const code = extractNeckCode(selectedPackaging.neckFinish);
                                return (
                                  <>
                                    {compatible.length > 0 ? (
                                      <optgroup label={`Compatible with ${code || selectedPackaging.neckFinish}`}>
                                        {compatible.map(p => (
                                          <option key={p.name} value={p.name}>{p.name} — ${p.costPerUnit.toFixed(2)}</option>
                                        ))}
                                      </optgroup>
                                    ) : (
                                      <optgroup label={`No matching closure in DB for ${code || selectedPackaging.neckFinish || 'this finish'}`}>
                                        <option value="" disabled>(Contact supplier for a closure that fits this neck)</option>
                                      </optgroup>
                                    )}
                                    {incompatible.length > 0 && (
                                      <optgroup label="Other closures (won't fit this container)">
                                        {incompatible.map(p => (
                                          <option key={p.name} value={p.name}>{p.name} — ${p.costPerUnit.toFixed(2)}</option>
                                        ))}
                                      </optgroup>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          ) : (
                            /* No container picked yet — show product-type recommendations (if any) first, then all grouped by category */
                            <>
                              {recommendedClosures.length > 0 && (
                                <optgroup label={`⭐ Recommended for ${productType}`}>
                                  {recommendedClosures.map(p => (
                                    <option key={p.name} value={p.name}>{p.name} — ${p.costPerUnit.toFixed(2)}</option>
                                  ))}
                                </optgroup>
                              )}
                              {closureCategories.map(cat => {
                                const items = closureItems.filter(p => p.category === cat && !recommendedClosureNames.has(p.name));
                                if (items.length === 0) return null;
                                return (
                                  <optgroup key={cat} label={cat}>
                                    {items.map(p => (
                                      <option key={p.name} value={p.name}>{p.name} — ${p.costPerUnit.toFixed(2)}</option>
                                    ))}
                                  </optgroup>
                                );
                              })}
                            </>
                          )}
                        </select>
                        {selectedClosure && (
                          <div className={`mt-2 p-2 border rounded text-xs ${
                            selectedPackaging && !isClosureCompatible(selectedPackaging, selectedClosure)
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-emerald-50 border-emerald-100'
                          }`}>
                            {selectedPackaging && !isClosureCompatible(selectedPackaging, selectedClosure) && (
                              <p className="text-amber-800 font-semibold mb-1 inline-flex items-start gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                                <span>Neck mismatch: container is {extractNeckCode(selectedPackaging.neckFinish) || selectedPackaging.neckFinish}, closure is {extractNeckCode(selectedClosure.neckFinish) || selectedClosure.neckFinish}. Won&apos;t physically fit.</span>
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="font-semibold text-emerald-800">${selectedClosure.costPerUnit.toFixed(3)}/unit</span>
                              <span className="text-gray-600">• {selectedClosure.material}</span>
                              {selectedClosure.neckFinish && <span className="text-gray-600">• {selectedClosure.neckFinish}</span>}
                            </div>
                            <p className="text-gray-500 mt-1">🏭 {selectedClosure.suppliers.slice(0, 3).join(' • ')}</p>
                            <p className="text-gray-400 mt-0.5 italic">{selectedClosure.notes}</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Inline form for defining (or editing) a custom closure */}
                    {showClosureForm && (
                      <div className="mt-2 p-3 border border-emerald-300 bg-emerald-50 rounded-lg space-y-2">
                        <div className="text-xs font-semibold text-emerald-900">Define custom closure / dispenser</div>
                        <input
                          type="text"
                          placeholder="Name (e.g. Custom CRC Cap, Bamboo Lid, Wax Seal)"
                          value={draftCustom.name}
                          onChange={e => setDraftCustom({ ...draftCustom, name: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Material (PP, aluminum, cork, etc.)"
                            value={draftCustom.material}
                            onChange={e => setDraftCustom({ ...draftCustom, material: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                          />
                          <input
                            type="text"
                            placeholder="Neck / Fits finish (38-400, etc.)"
                            value={draftCustom.neckFinish}
                            onChange={e => setDraftCustom({ ...draftCustom, neckFinish: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <input
                          type="number"
                          step={0.001}
                          min={0}
                          placeholder="$/unit"
                          value={draftCustom.costPerUnit || ''}
                          onChange={e => setDraftCustom({ ...draftCustom, costPerUnit: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500"
                        />
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              if (!draftCustom.name.trim()) return;
                              const pnMatch = customClosure?.notes.match(/Part #: (FWP-CUS-\d+)/);
                              const pn = pnMatch?.[1] ?? getCustomPackagingPartNumber(customPackagingSeq);
                              if (!pnMatch) setCustomPackagingSeq(n => n + 1);
                              const newItem: PackagingItem = {
                                name: draftCustom.name.trim(),
                                category: 'Custom',
                                material: draftCustom.material || 'User-defined',
                                neckFinish: draftCustom.neckFinish || undefined,
                                suppliers: ['Custom / user-defined'],
                                costPerUnit: draftCustom.costPerUnit,
                                notes: `Part #: ${pn}. Custom closure defined by user. Not from the packaging database.`,
                              };
                              setCustomClosure(newItem);
                              setSelectedClosure(newItem);
                              setShowClosureForm(false);
                            }}
                            className="flex-1 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
                          >
                            Save custom closure
                          </button>
                          {customClosure && (
                            <button
                              onClick={() => {
                                if (selectedClosure === customClosure) setSelectedClosure(null);
                                setCustomClosure(null);
                                setShowClosureForm(false);
                              }}
                              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50"
                            >
                              Delete
                            </button>
                          )}
                          <button
                            onClick={() => setShowClosureForm(false)}
                            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {(selectedPackaging || selectedClosure) && (
                  <div className="mt-3 p-3 bg-gray-50 rounded flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-500">Packaging cost:</span>{' '}
                      <span className="font-bold text-gray-800">${packagingCostPerUnit.toFixed(3)} per unit</span>
                      {selectedPackaging && selectedClosure && (
                        <span className="text-gray-400 text-xs ml-2">
                          (${selectedPackaging.costPerUnit.toFixed(3)} container + ${selectedClosure.costPerUnit.toFixed(3)} closure)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => { setSelectedPackaging(null); setSelectedClosure(null); }}
                      className="text-xs text-gray-400 hover:text-red-500 transition"
                      title="Clear packaging selection"
                    >
                      ✕ Clear
                    </button>
                  </div>
                )}

                {/* ══════════ PACKAGING SUSTAINABILITY PANEL ══════════ */}
                {selectedPackaging && (() => {
                  const containerProf = getPackagingSustainability(selectedPackaging);
                  const closureProf = selectedClosure ? getPackagingSustainability(selectedClosure) : null;
                  const combinedScore = closureProf
                    ? Math.round((containerProf.score * 0.75) + (closureProf.score * 0.25))
                    : containerProf.score;
                  const combinedRating =
                    combinedScore >= 75 ? 'Excellent' :
                    combinedScore >= 55 ? 'Good' :
                    combinedScore >= 35 ? 'Fair' :
                    'Poor';
                  const combinedCarbon = (containerProf.materialCarbonKgCo2e) + (closureProf?.materialCarbonKgCo2e || 0);
                  const scoreColor = combinedScore >= 75 ? 'emerald' : combinedScore >= 55 ? 'amber' : combinedScore >= 35 ? 'orange' : 'rose';

                  const recyclabilityBadge = (rec: string) => {
                    const map: Record<string, string> = {
                      'widely-recyclable': '♻️ Widely Recyclable',
                      'compostable': '🌱 Compostable',
                      'check-locally': '🔍 Check Locally',
                      'store-drop-off': '🛒 Store Drop-Off',
                      'industrial-only': '🏭 Industrial Only',
                      'not-recyclable': '🗑️ Landfill-Bound',
                    };
                    return map[rec] || rec;
                  };

                  return (
                    <div className={`mt-3 mb-2 rounded-lg border-2 p-3 bg-${scoreColor}-50 border-${scoreColor}-300`}>
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📦</span>
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-gray-600 font-bold">Packaging Sustainability</div>
                            <div className={`text-sm font-bold text-${scoreColor}-800`}>{combinedRating} — {combinedScore}/100</div>
                          </div>
                        </div>
                        <div className="text-right text-[10px] text-gray-600">
                          <div>🌿 {combinedCarbon.toFixed(3)} kg CO₂e/unit</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {/* Container card */}
                        <div className="bg-white/80 rounded p-2 border border-gray-200">
                          <div className="text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Container</div>
                          <div className="font-semibold text-gray-800 text-[11px] leading-tight">{selectedPackaging.name}</div>
                          <div className="flex flex-wrap gap-1 mt-1.5 text-[9px]">
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded">{containerProf.pcrContentPct}% PCR</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded">{recyclabilityBadge(containerProf.recyclability)}</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">{containerProf.materialCarbonKgCo2e.toFixed(2)} kg CO₂e</span>
                            {containerProf.fscCertified && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">🌲 FSC-avail.</span>}
                          </div>
                        </div>

                        {/* Closure card (if present) */}
                        {closureProf && selectedClosure && (
                          <div className="bg-white/80 rounded p-2 border border-gray-200">
                            <div className="text-[10px] uppercase tracking-wide text-gray-500 font-bold mb-1">Closure</div>
                            <div className="font-semibold text-gray-800 text-[11px] leading-tight">{selectedClosure.name}</div>
                            <div className="flex flex-wrap gap-1 mt-1.5 text-[9px]">
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded">{closureProf.pcrContentPct}% PCR</span>
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded">{recyclabilityBadge(closureProf.recyclability)}</span>
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">{closureProf.materialCarbonKgCo2e.toFixed(2)} kg CO₂e</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Biggest concern / recommendation */}
                      {(containerProf.notes.length > 0 || (closureProf && closureProf.notes.length > 0)) && (
                        <details className="mt-2 text-[10px]">
                          <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">📋 Recommendations ({containerProf.notes.length + (closureProf?.notes.length || 0)})</summary>
                          <ul className="mt-1 space-y-0.5 pl-3">
                            {containerProf.notes.map((n, i) => <li key={`c${i}`}>• {n}</li>)}
                            {closureProf?.notes.map((n, i) => <li key={`cl${i}`}>• {n}</li>)}
                          </ul>
                        </details>
                      )}
                    </div>
                  );
                })()}

                <p className="text-xs text-gray-400 mt-2">💡 Packaging cost rolls into &ldquo;Per Package&rdquo; in the Cost Summary above. Curated across {containerCategories.length + closureCategories.length} container &amp; closure categories.</p>
              </div>

              {/* Cost Summary — unit economics for the formulation (not production batch) */}
              {/* Identity → Formula → Determination → Packaging/Dosage/Serving → Sustainability → Cost.
                  Decisions flow downward; consequences appear in real-time. Cost is LAST so the user
                  sees the regulatory + dosing + sustainability story before the dollar story. */}
              {ingredients.length > 0 && (() => {
                // Roll up per-ingredient cost confidence to a formula-level floor (>=5% mass threshold).
                // Per-ingredient cost confidence comes from each ingredient's IndustrialIngredient
                // costSource via mapCostToConfidence; user-typed overrides retain the source's confidence.
                const costContribs = ingredients.map(i => {
                  const iDb = i.foodData?.type === 'industrial' ? (i.foodData.data as IndustrialIngredient) : null;
                  return { massG: i.qty * (UNIT_TO_GRAMS[i.unit] || 1), confidence: mapCostToConfidence(iDb) };
                });
                const formulaCostConfidence = rollupCostConfidence(costContribs);
                const costPill = <ConfidencePill conf={formulaCostConfidence} size="xs" />;
                // Range-half-width for each rolled cost (relative tolerance on the rolled-up number).
                const perKg = totalWeightKg > 0 ? totalCost / totalWeightKg : 0;
                const perKgDelta = perKg > 0 ? (costRangedSpec(perKg, formulaCostConfidence).range.high - perKg) : 0;
                const perServingDelta = costPerServing > 0 ? (costRangedSpec(costPerServing, formulaCostConfidence).range.high - costPerServing) : 0;
                const perPackageDelta = costPerPackage > 0 ? (costRangedSpec(costPerPackage, formulaCostConfidence).range.high - costPerPackage) : 0;
                const totalDelta = totalCost > 0 ? (costRangedSpec(totalCost, formulaCostConfidence).range.high - totalCost) : 0;
                return (
                <div className="bg-white rounded-xl border border-emerald-200 p-6">
                  <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">💰 Unit Economics{costPill}</h2>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">For production batch cost, see 🏭 Batch Sheet</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Per kg</p>
                      <p className="text-2xl font-bold text-emerald-700">${perKg.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{perKgDelta > 0 ? `± $${perKgDelta.toFixed(2)} • ` : ''}fundamental unit cost</p>
                    </div>
                    <div className={`rounded-lg p-3 ${servingSizeInGrams > totalBatchGrams && totalBatchGrams > 0 ? 'bg-rose-50 border-2 border-rose-400' : 'bg-emerald-50'}`}>
                      <p className="text-xs text-gray-500 mb-1">Per Serving</p>
                      <p className={`text-2xl font-bold ${servingSizeInGrams > totalBatchGrams && totalBatchGrams > 0 ? 'text-rose-700 inline-flex items-center justify-center w-full' : 'text-emerald-700'}`}>
                        {servingSizeInGrams > totalBatchGrams && totalBatchGrams > 0
                          ? <AlertTriangle className="h-6 w-6 text-amber-600" aria-label="Unit mismatch" />
                          : `$${costPerServing.toFixed(3)}`}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {servingSizeInGrams > totalBatchGrams && totalBatchGrams > 0
                          ? <span className="text-rose-600 font-semibold">Serving &gt; batch — check unit</span>
                          : `${perServingDelta > 0 ? `± $${perServingDelta.toFixed(3)} • ` : ''}${servingSize}${servingUnit} serving`}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 border-2 ${packageSizeInGrams > totalBatchGrams && totalBatchGrams > 0 ? 'bg-rose-50 border-rose-400' : 'bg-emerald-50 border-emerald-400'}`}>
                      <p className="text-xs text-gray-500 mb-1">Per Package</p>
                      <p className={`text-2xl font-bold ${packageSizeInGrams > totalBatchGrams && totalBatchGrams > 0 ? 'text-rose-700 inline-flex items-center justify-center w-full' : 'text-emerald-700'}`}>
                        {packageSizeInGrams > totalBatchGrams && totalBatchGrams > 0
                          ? <AlertTriangle className="h-6 w-6 text-amber-600" aria-label="Unit mismatch" />
                          : `$${costPerPackage.toFixed(3)}`}
                      </p>
                      {packageSizeInGrams > totalBatchGrams && totalBatchGrams > 0 ? (
                        <p className="text-[10px] text-rose-600 mt-0.5 font-semibold">Package &gt; batch — check unit</p>
                      ) : packagingCostPerUnit > 0 ? (
                        <p className="text-[10px] text-gray-400 mt-0.5">{perPackageDelta > 0 ? `± $${perPackageDelta.toFixed(3)} • ` : ''}incl. ${packagingCostPerUnit.toFixed(3)} pkg</p>
                      ) : (
                        perPackageDelta > 0 && <p className="text-[10px] text-gray-400 mt-0.5">± ${perPackageDelta.toFixed(3)}</p>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Formula Total</p>
                      <p className="text-2xl font-bold text-gray-700">${totalCost.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{totalDelta > 0 ? `± $${totalDelta.toFixed(2)} • ` : ''}for {totalWeightKg.toFixed(3)} kg as entered</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Per-tile confidence reflects the formula-level cost rollup (floor across ingredients ≥ 5% mass). Override per-ingredient costs below with supplier quotes to upgrade the rollup. Production-batch cost (scalable to any size) lives on the 🏭 Batch Sheet tab.
                  </p>
                </div>
                );
              })()}

              {/* ═══════════════════════════════════════════════════════════════════════
                  EXECUTION CANVAS (Batch Sheet Template) — operator-authored procedures
                  + QA + signoff conventions. Inherited by every Batch Sheet spawned from
                  this Base Sheet version. Plain-text textarea per operator-validated
                  "less is more" doctrine 2026-05-25 — operator's own conventions for
                  fill-in slots (underscores), hierarchy, section headers; platform
                  does not parse this content. Persisted to localStorage as bridge
                  before Supabase save backend (launch-blocker #4) lands.
                  ═══════════════════════════════════════════════════════════════════════ */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    📝 Execution Canvas
                    <span className="text-xs font-normal text-gray-500">(Batch Sheet Template)</span>
                  </h2>
                  <span className="text-[10px] uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Draft — localStorage only
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Author your procedures, QA capture format, and signoff slots here.
                  Inherited by every Batch Sheet spawned from this Base Sheet version
                  (operator edits per-batch for production capture). Plain text — use
                  your own conventions for fill-in slots (underscores), step ordering,
                  inline equipment IDs. Platform does not parse this content.
                </p>
                <textarea
                  value={batchSheetTemplate}
                  onChange={(e) => setBatchSheetTemplate(e.target.value)}
                  placeholder={`PROCEDURE
1. Add water to kettle and turn on steam.
2. While kettle is heating, add tomato paste and turn on agitation.
3. Add vinegar, peppers, spices and salt.
4. Heat kettle to 200°F and hold for 5 minutes.
   Start Time _________  End Time _________  Initials ______  QA Initials ______
5. Pump to Surge Tank ST03 through PD pump 001.

QA TESTS
- pH measured:  _________ (target ≤ 4.6)   Initials ______
- Brix measured: _________ (target 12 ± 2) Initials ______

FINAL APPROVAL
Batcher:        _____________________  Date / Time _________
QA:             _____________________  Date / Time _________
Production Mgr: _____________________  Date / Time _________`}
                  rows={20}
                  className="w-full font-mono text-xs border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-emerald-500"
                  spellCheck={false}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Saves to your browser as you type. Lost on cache clear. Persistent save (Supabase) lands with launch-blocker #4.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN - FDA Label */}
            <div className="space-y-6">
              {/* ═══════════════════════════════════════════════════════════
                  DETERMINATION ENGINE — live regulatory classification
                  Identity → Formula → Determination → Packaging/Dosage/Serving → Sustainability → Cost.
                  Decisions flow downward; consequences appear in real-time.
                  ═══════════════════════════════════════════════════════════ */}
              <DeterminationEngineCard
                modeId={mode}
                specs={specs}
                filing={filingReq}
                hasIngredients={ingredients.length > 0}
                onOpenProcessAuthorities={() => setActiveTab('authorities')}
              />

              {/* Round 10 Section 3d: Bucket A enforcement-gate banner. Visualizes
                  the gate's classification (hard-stop vs PA-reviewable vs cleared)
                  above the per-finding compliance panel. Hard-stop framing names
                  refuse-to-export semantics; PA-reviewable framing names the
                  honest-estimate fallback (over cap by ESTIMATED inputs — PA
                  judgment required). Actual export-blocking is Round 11+ scope. */}
              {complianceFindings.length > 0 && (bucketAHardStop || bucketAPaReviewableCount > 0) && (
                <div className={`rounded-xl border-2 p-4 mb-3 ${bucketAHardStop ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-400'}`}>
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">
                      {bucketAHardStop
                        ? <Ban className="h-5 w-5 text-rose-700" aria-hidden="true" />
                        : <span className="text-amber-700 text-lg leading-none">⚠</span>}
                    </span>
                    <div className="flex-1 text-xs">
                      <div className={`font-bold mb-1 ${bucketAHardStop ? 'text-red-800' : 'text-amber-800'}`}>
                        {bucketAHardStop
                          ? `Bucket A: Refuse-to-Export — ${isHardStop(bucketAGate) ? bucketAGate.evidence.length : 0} hard-stop finding${isHardStop(bucketAGate) && bucketAGate.evidence.length !== 1 ? 's' : ''} with MEASURED/CALCULATED inputs`
                          : `Bucket B: Process Authority Review — ${bucketAPaReviewableCount} finding${bucketAPaReviewableCount !== 1 ? 's' : ''} over cap by ESTIMATED/INFERRED inputs`}
                      </div>
                      {bucketAHardStop && isHardStop(bucketAGate) ? (
                        <>
                          <div className="text-red-700 mb-2">{bucketAGate.reason}</div>
                          <ul className="space-y-1 text-red-700 leading-relaxed">
                            {bucketAGate.evidence.slice(0, 5).map((e, i) => (
                              <li key={i}>
                                <span className="font-semibold">{e.subject}</span> — {e.detail}
                                {e.citation && <span className="text-red-500 ml-1">[{e.citation}]</span>}
                              </li>
                            ))}
                            {bucketAGate.evidence.length > 5 && (
                              <li className="italic text-red-600">…and {bucketAGate.evidence.length - 5} more</li>
                            )}
                          </ul>
                          {bucketAGate.paReviewableFindings.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-red-200 text-amber-700">
                              Plus {bucketAGate.paReviewableFindings.length} PA-reviewable finding{bucketAGate.paReviewableFindings.length !== 1 ? 's' : ''} (ESTIMATED/INFERRED inputs over cap).
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-amber-700 leading-relaxed">
                          Findings appear to exceed regulatory caps but their inputs (denominator basis, metadata) carry ESTIMATED/INFERRED confidence. Process Authority should verify against physical test or supplier COA before treating as a violation.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Regulatory Compliance */}
              {complianceFindings.length > 0 && (
                <div className={`rounded-xl border-2 p-6 ${complianceViolations.length > 0 ? 'bg-red-50 border-red-400' : 'bg-emerald-50 border-emerald-300'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className={`text-lg font-bold flex items-center gap-2 ${complianceViolations.length > 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                      {complianceViolations.length > 0 ? (
                        <>
                          <Ban className="h-4 w-4 text-rose-700" aria-hidden="true" />
                          <span>{complianceViolations.length} Regulatory Violation{complianceViolations.length !== 1 ? 's' : ''}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                          <span>{complianceFindings.length} Regulated Ingredient{complianceFindings.length !== 1 ? 's' : ''} — All Within Limits</span>
                        </>
                      )}
                    </h2>
                    <span className="text-[10px] uppercase tracking-wide text-gray-500">FDA / USDA-FSIS</span>
                  </div>
                  <div className="space-y-2">
                    {complianceFindings.map((f, i) => (
                      <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded ${f.violated ? 'bg-red-100 border border-red-300' : 'bg-white border border-emerald-200'}`}>
                        <span className="shrink-0 mt-0.5">
                          {f.violated
                            ? <XIcon className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                            : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />}
                        </span>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="font-semibold text-gray-800">{f.limit.shortName}</span>
                            <span className="text-gray-500">— currently</span>
                            <span className={`font-mono font-bold ${f.violated ? 'text-red-700' : 'text-emerald-700'}`}>
                              {formatAmount(f.currentPercent, f.currentPpm)}
                            </span>
                            <span className="text-gray-500">vs max</span>
                            <span className="font-mono font-bold text-gray-700">
                              {f.limit.maxPercent !== undefined ? `${f.limit.maxPercent}%` : `${f.limit.maxPpm} ppm`}
                            </span>
                            <span className="text-gray-500">({f.utilization.toFixed(0)}% of cap)</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {f.limit.authority} {f.limit.citation} — {f.limit.summary}
                          </p>
                          {f.activeSpeciesPpm !== undefined && f.limit.activeName && (
                            <p className={`text-[10px] mt-0.5 font-semibold inline-flex items-center gap-1 ${f.activeViolated ? 'text-red-700' : 'text-emerald-700'}`}>
                              <span>↳ Active {f.limit.activeName}: {f.activeSpeciesPpm.toFixed(1)} ppm (max {f.limit.activeMaxPpm} ppm)</span>
                              {f.activeViolated
                                ? <span>— OVER</span>
                                : <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" />}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {complianceViolations.length > 0 && (
                    <p className="text-xs text-red-800 mt-3 font-semibold inline-flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>This formulation exceeds one or more US regulatory limits. Reduce the flagged ingredient(s) before producing — non-compliant products are misbranded under federal law.</span>
                    </p>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  DOSAGE SAFETY CHECK (supplements mode only)
                  Tiered warnings — mirrors the regulatory compliance card
                  pattern used for cure-ppm / sodium benzoate / sorbate etc.
                  Scans every ingredient against the IOM Tolerable Upper
                  Intake Levels table and the FDA banned/restricted list,
                  plus high-risk interaction herbs.
                  ═══════════════════════════════════════════════════════════ */}
              {mode === 'supplements' && ingredients.length > 0 && (() => {
                // Compute per-serving mg for every ingredient so the checker can
                // compare against UL thresholds. Serving-scale the batch mass.
                const scale = computePerServingScale({ mode, servingSizeInGrams, totalBatchGrams });
                const perServingMgByName = new Map<string, number>();
                for (const ing of ingredients) {
                  const g = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
                  // Apply potencyFactor for carrier-loaded SKUs (e.g. Vit D3 100,000 IU/g on MCC
                  // is only 0.25% active by mass). Defaults to 1.0 — the ingredient mass IS the
                  // active mass. This prevents false UL hard-stops on triturated / beadlet forms.
                  const potency = (ing.foodData?.type === 'industrial' && ing.foodData.data?.potencyFactor)
                    ? ing.foodData.data.potencyFactor : 1;
                  perServingMgByName.set(ing.name, g * scale * 1000 * potency);
                }
                const findings = checkSupplementSafety(ingredients, perServingMgByName, suppAudience);
                const summary = summarizeFindings(findings);
                if (findings.length === 0) return null;

                // Overall card color reflects the worst tier present.
                const cardColor =
                  summary.banned > 0 || summary.critical > 0
                    ? 'bg-red-50 border-red-500'
                    : summary.warning > 0
                      ? 'bg-orange-50 border-orange-400'
                      : summary.caution > 0
                        ? 'bg-amber-50 border-amber-300'
                        : summary.interaction > 0
                          ? 'bg-sky-50 border-sky-300'
                          : 'bg-emerald-50 border-emerald-300';

                const headerIcon: ReactNode =
                  summary.banned > 0 ? <Ban className="h-4 w-4 text-rose-700" aria-hidden="true" />
                  : summary.critical > 0 ? <OctagonX className="h-4 w-4 text-rose-600" aria-hidden="true" />
                  : summary.warning > 0 ? <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  : summary.caution > 0 ? <AlertCircle className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  : <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />;

                const headerText =
                  summary.banned > 0
                    ? `${summary.banned} Banned / Restricted Ingredient${summary.banned !== 1 ? 's' : ''} — Do Not Ship`
                  : summary.critical > 0
                    ? `${summary.critical} Critical Dose${summary.critical !== 1 ? 's' : ''} — Hazardous`
                  : summary.warning > 0
                    ? `${summary.warning} Dose${summary.warning !== 1 ? 's' : ''} Over Upper Limit — Reformulate`
                  : summary.caution > 0
                    ? `${summary.caution} Dose${summary.caution !== 1 ? 's' : ''} Approaching Upper Limit`
                  : `${findings.length} Dosage Check${findings.length !== 1 ? 's' : ''} — All Within Safe Range`;

                const headerColor =
                  summary.banned > 0 || summary.critical > 0 ? 'text-red-800'
                  : summary.warning > 0 ? 'text-orange-800'
                  : summary.caution > 0 ? 'text-amber-800'
                  : 'text-emerald-800';

                // Collapsible logic: card expands by default when any findings are
                // non-OK. User click on the header overrides. Status-strip pills
                // force-expand the card they correspond to.
                const defaultExpanded = (summary.banned + summary.critical + summary.warning + summary.caution + summary.interaction) > 0;
                const manual = suppCardsManuallyToggled['safety'];
                const expanded = manual !== undefined ? manual : defaultExpanded;
                return (
                  <div id="supp-card-safety" className={`rounded-xl border-2 p-6 ${cardColor}`}>
                    <button
                      type="button"
                      onClick={() => toggleSuppCard('safety', expanded)}
                      className="w-full flex items-center justify-between mb-3 flex-wrap gap-2 text-left"
                    >
                      <h2 className={`text-lg font-bold ${headerColor} flex items-center gap-2`}>
                        <span className="text-xs opacity-60">{expanded ? '▼' : '▶'}</span>
                        {headerIcon}
                        <span>{headerText}</span>
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-gray-500">IOM / FDA / DSHEA</span>
                        {suppAudience !== 'general' && (
                          <span className="text-[10px] uppercase tracking-wide bg-gray-800 text-white px-2 py-0.5 rounded">
                            {suppAudience === 'pregnancy' ? 'Prenatal rules active' : suppAudience === 'pediatric' ? 'Pediatric rules active' : 'NCAA / Sport rules active'}
                          </span>
                        )}
                      </div>
                    </button>
                    {expanded && (<>
                    {/* Full-detail rows only for findings that need attention. "ok" findings
                        get a compact summary line at the bottom so the hazard/mitigation text
                        doesn't read as a warning when the ingredient is actually within safe range. */}
                    <div className="space-y-2">
                      {findings.filter(f => f.tier !== 'ok').map((f, i) => {
                        const rowColor =
                          f.tier === 'banned' || f.tier === 'critical' ? 'bg-red-100 border border-red-400'
                          : f.tier === 'warning' ? 'bg-orange-100 border border-orange-300'
                          : f.tier === 'caution' ? 'bg-amber-100 border border-amber-300'
                          : 'bg-sky-100 border border-sky-300';
                        const mark: ReactNode =
                          f.tier === 'banned' ? <Ban className="h-3.5 w-3.5 text-rose-700" aria-hidden="true" />
                          : f.tier === 'critical' ? <OctagonX className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                          : f.tier === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                          : f.tier === 'caution' ? <AlertCircle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                          : <span className="font-mono font-bold text-sky-700">⇄</span>;
                        const markColor =
                          f.tier === 'banned' || f.tier === 'critical' ? 'text-red-700'
                          : f.tier === 'warning' ? 'text-orange-700'
                          : f.tier === 'caution' ? 'text-amber-700'
                          : 'text-sky-700';
                        return (
                          <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded ${rowColor}`}>
                            <span className="shrink-0 mt-0.5">{mark}</span>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="font-semibold text-gray-800">{f.limitName}</span>
                                <span className="text-gray-500 text-[11px]">— ingredient:</span>
                                <span className="font-medium text-gray-700 text-[11px]">{f.ingredientName}</span>
                                {f.amountPerServing !== null && f.effectiveUL !== null && f.percentOfUL !== null && (
                                  <>
                                    <span className="text-gray-500">·</span>
                                    <span className={`font-mono font-bold ${markColor}`}>
                                      {f.amountPerServing.toFixed(f.amountPerServing >= 10 ? 0 : 1)}{f.unit}/serving
                                    </span>
                                    <span className="text-gray-500">vs UL</span>
                                    <span className="font-mono font-bold text-gray-700">
                                      {f.effectiveUL}{f.unit}
                                    </span>
                                    <span className="text-gray-500">({f.percentOfUL.toFixed(0)}% of UL)</span>
                                  </>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-600 mt-0.5 leading-snug">
                                <span className="font-semibold">{f.authority}</span> {f.citation} — {f.hazard}
                              </p>
                              {f.mitigation && (
                                <p className="text-[10px] text-gray-700 mt-0.5 leading-snug italic">
                                  → {f.mitigation}
                                </p>
                              )}
                              {f.populationNote && (
                                <p className="text-[10px] text-red-700 mt-0.5 leading-snug font-semibold">
                                  {f.populationNote}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Compact safe-range summary — shows which actives were checked and passed. */}
                    {findings.some(f => f.tier === 'ok') && (
                      <details className="mt-3 text-xs text-emerald-800">
                        <summary className="cursor-pointer font-medium inline-flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          <span>{findings.filter(f => f.tier === 'ok').length} active{findings.filter(f => f.tier === 'ok').length !== 1 ? 's' : ''} checked and within safe range (click to expand)</span>
                        </summary>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                          {findings.filter(f => f.tier === 'ok').map((f, i) => (
                            <div key={i} className="flex items-center gap-2 py-0.5">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" aria-hidden="true" />
                              <span className="font-medium text-gray-700">{f.limitName}</span>
                              {f.amountPerServing !== null && f.effectiveUL !== null && f.percentOfUL !== null && (
                                <span className="text-[11px] text-gray-500 font-mono">
                                  {f.amountPerServing.toFixed(f.amountPerServing >= 10 ? 0 : 1)}{f.unit} ({f.percentOfUL.toFixed(0)}% of UL)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Hard-stop language — mirrors the regulatory compliance card */}
                    {summary.hardStop && (
                      <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-900">
                        <p className="text-sm font-bold mb-1 inline-flex items-center gap-1.5">
                          <OctagonX className="h-4 w-4 text-rose-600" aria-hidden="true" />
                          <span>HARD STOP — Do Not Ship</span>
                        </p>
                        <p className="text-xs leading-snug text-rose-800">
                          This formulation {summary.banned > 0 ? 'contains an FDA-banned or import-restricted ingredient' : 'exceeds one or more Tolerable Upper Intake Levels'}.
                          Selling a product in this state is misbranding under DSHEA and creates unreasonable
                          risk of injury — the strict-liability standard under FDA enforcement.
                          Reduce the flagged ingredient(s) or remove them before any production batch is released.
                        </p>
                      </div>
                    )}
                    {!summary.hardStop && summary.caution > 0 && (
                      <p className="mt-3 text-xs text-amber-800 font-medium">
                        Caution level — one or more actives are within 20% of their UL. Not a violation, but worth scrutiny if your label targets chronic daily use.
                      </p>
                    )}
                    {!summary.hardStop && summary.caution === 0 && summary.interaction > 0 && (
                      <p className="mt-3 text-xs text-sky-800 font-medium">
                        No dosage violations — but one or more ingredients carry clinically significant drug-interaction risks. Label should include an interaction warning.
                      </p>
                    )}
                    </>)}
                  </div>
                );
              })()}

              {/* ═══════════════════════════════════════════════════════════
                  NDI (NEW DIETARY INGREDIENT) COMPLIANCE (supplements mode)
                  Classifies each ingredient as grandfathered / notified /
                  GRAS-food / NDI-required / unknown. Surfaces compliance
                  risk for post-1994 ingredients without accepted notification.
                  ═══════════════════════════════════════════════════════════ */}
              {mode === 'supplements' && ingredients.length > 0 && (() => {
                const ndi = analyzeNDI(ingredients.map(i => i.name));
                const statusColor = ndi.required > 0 ? 'bg-red-50 border-red-400'
                  : ndi.unknown > 0 ? 'bg-amber-50 border-amber-300'
                  : 'bg-emerald-50 border-emerald-300';
                const ndiDefaultExpanded = ndi.required > 0 || ndi.unknown > 0;
                const ndiManual = suppCardsManuallyToggled['ndi'];
                const ndiExpanded = ndiManual !== undefined ? ndiManual : ndiDefaultExpanded;
                return (
                  <div id="supp-card-ndi" className={`rounded-xl border-2 p-6 ${statusColor}`}>
                    <button
                      type="button"
                      onClick={() => toggleSuppCard('ndi', ndiExpanded)}
                      className="w-full flex items-center justify-between mb-3 flex-wrap gap-2 text-left"
                    >
                      <h2 className={`text-lg font-bold ${ndi.required > 0 ? 'text-red-800' : ndi.unknown > 0 ? 'text-amber-800' : 'text-emerald-800'} flex items-center gap-2`}>
                        <span className="text-xs opacity-60">{ndiExpanded ? '▼' : '▶'}</span>
                        {ndi.required > 0
                          ? <OctagonX className="h-4 w-4 text-rose-600" aria-hidden="true" />
                          : ndi.unknown > 0
                            ? <AlertCircle className="h-4 w-4 text-amber-500" aria-hidden="true" />
                            : <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
                        <span>NDI Compliance Check</span>
                      </h2>
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">DSHEA §8 · 21 CFR 190.6</span>
                    </button>
                    {ndiExpanded && (<>
                    {/* Summary row */}
                    <div className="flex flex-wrap gap-3 mb-3 text-xs">
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Pre-1994 ODI: <strong>{ndi.grandfathered}</strong></span>
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> NDI notified: <strong>{ndi.notified}</strong></span>
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> GRAS food: <strong>{ndi.grasFood}</strong></span>
                      {ndi.required > 0 && (
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600" /> NDI required: <strong>{ndi.required}</strong></span>
                      )}
                      {ndi.unknown > 0 && (
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Unknown: <strong>{ndi.unknown}</strong></span>
                      )}
                    </div>

                    {/* Only show problematic findings (required / unknown / notified-with-note) */}
                    {ndi.findings.filter(f => f.status === 'required' || f.status === 'unknown' || (f.status === 'notified' && f.match?.note)).length > 0 && (
                      <div className="space-y-2">
                        {ndi.findings
                          .filter(f => f.status === 'required' || f.status === 'unknown' || (f.status === 'notified' && f.match?.note))
                          .map((f, i) => {
                            const rowColor = f.status === 'required' ? 'bg-red-100 border border-red-400'
                              : f.status === 'unknown' ? 'bg-amber-100 border border-amber-300'
                              : 'bg-sky-100 border border-sky-300';
                            const mark: ReactNode = f.status === 'required'
                              ? <OctagonX className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                              : f.status === 'unknown'
                                ? <AlertCircle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                                : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />;
                            return (
                              <div key={i} className={`text-xs p-2 rounded ${rowColor}`}>
                                <div className="flex items-start gap-2">
                                  <span className="shrink-0 mt-0.5">{mark}</span>
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-800">{f.ingredientName}</div>
                                    <p className="text-[11px] text-gray-700 mt-1 leading-snug">{f.advisory}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                    {ndi.required > 0 && (
                      <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-900">
                        <p className="text-sm font-bold mb-1 inline-flex items-center gap-1.5">
                          <OctagonX className="h-4 w-4 text-rose-600" aria-hidden="true" />
                          <span>NDI Compliance Risk</span>
                        </p>
                        <p className="text-xs leading-snug text-rose-800">
                          This formulation contains one or more post-1994 ingredients without a known FDA-accepted NDI notification.
                          21 USC §350b requires a 75-day pre-market notification before marketing. Without it, the product is misbranded.
                          Consult FDA&apos;s NDI database and legal counsel before release.
                        </p>
                      </div>
                    )}
                    {ndi.required === 0 && ndi.unknown === 0 && (
                      <p className="text-xs text-emerald-700 mt-2 inline-flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                        <span>All ingredients classified. Verify your specific supplier forms match accepted NDI filings where applicable.</span>
                      </p>
                    )}
                    </>)}
                  </div>
                );
              })()}

              <div id="printable-label" className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2 print:hidden">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {mc.labelMode === 'aafco' ? 'AAFCO Guaranteed Analysis'
                      : mc.labelMode === 'supplement-facts' ? 'Supplement Facts Panel'
                      : mc.labelMode === 'bakers' ? 'FDA Nutrition Facts + Baker\'s %'
                      : 'FDA Nutrition Facts Label'}
                  </h2>
                  <button
                    onClick={printLabel}
                    disabled={ingredients.length === 0}
                    className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition font-medium"
                    title="Print the label panel or save it as a PDF"
                  >
                    📄 Save as PDF
                  </button>
                </div>
                {/* Print-only header with formulation context */}
                <div className="hidden print:block mb-4 pb-3 border-b-2 border-gray-800">
                  <h1 className="text-xl font-bold text-gray-900">{formulationName || 'Formulation Label'}</h1>
                  {productType && <p className="text-xs text-gray-600 mt-0.5">{productType}</p>}
                  <p className="text-[10px] text-gray-500 mt-0.5">Generated {new Date().toLocaleDateString()} • Formulation Wizard</p>
                </div>

                {/* AAFCO Guaranteed Analysis panel (feeds mode) */}
                {mc.labelMode === 'aafco' && (
                  <div className="border-2 border-gray-800 p-4 max-w-sm mx-auto font-sans text-black">
                    <div className="text-2xl font-bold text-center border-b-2 border-gray-800 pb-2 mb-2">Guaranteed Analysis</div>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-gray-400"><td className="py-1">Crude Protein (Min)</td><td className="py-1 text-right font-bold">{totalBatchGrams > 0 ? (nutrition.protein / totalBatchGrams * 100).toFixed(1) : '—'}%</td></tr>
                        <tr className="border-b border-gray-400"><td className="py-1">Crude Fat (Min)</td><td className="py-1 text-right font-bold">{totalBatchGrams > 0 ? (nutrition.totalFat / totalBatchGrams * 100).toFixed(1) : '—'}%</td></tr>
                        <tr className="border-b border-gray-400"><td className="py-1">Crude Fiber (Max)</td><td className="py-1 text-right font-bold">{totalBatchGrams > 0 ? (nutrition.dietaryFiber / totalBatchGrams * 100).toFixed(1) : '—'}%</td></tr>
                        <tr className="border-b border-gray-400"><td className="py-1">Moisture (Max)</td><td className="py-1 text-right font-bold">{specs.moisture > 0 ? specs.moisture.toFixed(1) : '—'}%</td></tr>
                        <tr className="border-b border-gray-400"><td className="py-1">Ash (Max)</td><td className="py-1 text-right font-bold text-gray-400">— (enter from lab)</td></tr>
                      </tbody>
                    </table>
                    <div className="mt-3 text-[10px] leading-tight">
                      <p><span className="font-semibold">Ingredients:</span> {ingredientStatement || '—'}</p>
                      <p className="mt-2"><span className="font-semibold">Feeding Directions:</span> Feed as sole diet per species/life-stage requirements. Provide clean fresh water at all times. Store in a cool, dry place.</p>
                      <p className="mt-2 italic">Manufactured by: [Establishment Name] · [City, State ZIP]</p>
                    </div>
                    <p className="text-[9px] mt-2 leading-tight text-gray-600 italic">
                      AAFCO-formatted label. Verify state Commercial Feed Act registration before distribution.
                    </p>
                  </div>
                )}

                {/* Supplement Facts panel — 21 CFR 101.36
                    Structured rendering via lib/supplementLabeling:
                    • Macros (only if present): Total Fat / Carb / Sugars / Protein / Sodium
                    • Vitamins & Minerals: with established DV, shown with %DV
                    • Other Actives (herbals, aminos, mushrooms, etc.): with "†"
                    • Other Ingredients: excipients only, in descending weight order

                    Round 11 Phase 3 Workstream A.5 [4/N] (§B4 SFP closure —
                    Phase 2 implementation-discovery finding #10): the DSHEA
                    disclaimer at the bottom of this panel now consumes
                    selectSupplementDisclaimer(claimCount) per 21 CFR
                    101.93(c)(1)/(c)(2). Pre-fix: hardcoded plural string
                    rendered unconditionally, including when claim count = 0.
                    Post-fix: SINGULAR form when exactly 1 structure/function
                    claim; PLURAL form when 2+; no disclaimer when 0.
                    Frozen-snapshot change-control discipline preserved via
                    lib/__tests__/supplement-disclaimer.test.ts. */}
                {mc.labelMode === 'supplement-facts' && (() => {
                  // Build a human-readable serving size for the label:
                  //  • Capsule / Tablet / Softgel / Gummy / Lozenge / Chewable → "N Capsules"
                  //  • Powder → "1 Scoop (30 g)"
                  //  • Liquid → "1 Dropper (1 ml)"
                  const noun = SUPP_FORM_NOUN[suppDeliveryForm];
                  const unitWord = suppUnitsPerServing === 1 ? noun.singular : noun.plural;
                  const countable = ['capsule', 'tablet', 'softgel', 'gummy', 'lozenge', 'chewable'].includes(suppDeliveryForm);
                  const servingSizeLabel = countable
                    ? `${suppUnitsPerServing} ${unitWord}`
                    : `${suppUnitsPerServing} ${unitWord} (${servingSize}${servingUnit})`;
                  // §B4 SFP renderer disclaimer routing: compute the active
                  // structure/function claim count so the DSHEA disclaimer
                  // at the bottom of the panel routes through the locked-
                  // constant selector. Matches the Claims Validator card's
                  // detection (page.tsx:5501) — same input, same logic.
                  const sfpClaimCount = detectStructureFunctionClaims(ingredients.map(i => i.name)).length;
                  const sfpDsheaDisclaimer = selectSupplementDisclaimer(sfpClaimCount);
                  const facts = buildSupplementFacts({
                    ingredients,
                    mode,
                    servingSizeInGrams,
                    totalBatchGrams,
                    servingsPerContainer,
                    servingSizeLabel,
                    caloriesPerServing: perServing(nutrition.calories),
                    macroPerServing: {
                      totalFat: perServing(nutrition.totalFat),
                      totalCarbs: perServing(nutrition.totalCarbs),
                      protein: perServing(nutrition.protein),
                      sodium: perServing(nutrition.sodium),
                      totalSugars: perServing(nutrition.totalSugars),
                    },
                  });
                  return (
                    <div className="border-4 border-black p-3 max-w-sm mx-auto font-sans text-black">
                      <div className="text-3xl font-extrabold leading-none border-b-4 border-black pb-1 mb-1">Supplement Facts</div>
                      <div className="text-xs border-b border-black pb-1 mb-1">Serving Size: {facts.servingSize}</div>
                      <div className="text-xs border-b-8 border-black pb-1 mb-1">Servings Per Container: {facts.servingsPerContainer}</div>
                      <div className="flex justify-between border-b-2 border-black py-0.5 text-[10px] font-bold uppercase">
                        <div>Amount Per Serving</div>
                        <div>% Daily Value</div>
                      </div>

                      {/* Calories (only if ≥5 per 21 CFR 101.36) */}
                      {facts.caloriesPerServing !== null && (
                        <div className="border-b border-black py-1 flex justify-between text-sm">
                          <div className="font-bold">Calories</div>
                          <div className="font-bold">{fdaRoundCalories(facts.caloriesPerServing)}</div>
                        </div>
                      )}

                      {/* Macronutrient rows (conditionally rendered when ≥ labeling threshold) */}
                      {facts.macroRows.map((row, i) => (
                        <div key={`macro-${i}`} className="border-b border-black py-1 flex justify-between text-sm">
                          <div>
                            <span className="font-bold">{row.displayName}</span>{' '}
                            {formatSupplementAmount(row.amount, row.unit)}{row.unit}
                          </div>
                          <div className="font-bold">{formatSupplementDV(row.percentDV)}</div>
                        </div>
                      ))}

                      {/* Vitamins & Minerals section */}
                      {facts.vitaminMineralRows.length > 0 && (
                        <>
                          {facts.vitaminMineralRows.map((row, i) => (
                            <div key={`vm-${i}`} className="border-b border-black py-1 flex justify-between text-[11px] leading-tight">
                              <div>
                                <span className="font-bold">{row.displayName}</span>{' '}
                                {formatSupplementAmount(row.amount, row.unit)} {row.unit}
                              </div>
                              <div className="font-bold">{formatSupplementDV(row.percentDV)}</div>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Other Actives section — herbals, aminos, mushrooms, specialty (shown with †) */}
                      {facts.otherActivesRows.length > 0 && (
                        <>
                          <div className="border-b-2 border-black mt-1" />
                          {facts.otherActivesRows.map((row, i) => (
                            <div key={`oa-${i}`} className="border-b border-black py-1 flex justify-between text-[11px] leading-tight">
                              <div>
                                <span className="font-bold">{row.displayName}</span>{' '}
                                {formatSupplementAmount(row.amount, row.unit)} {row.unit}
                              </div>
                              <div className="font-bold">{formatSupplementDV(row.percentDV)}</div>
                            </div>
                          ))}
                        </>
                      )}

                      <div className="border-b-8 border-black" />

                      {/* "Other Ingredients" — excipients only, in descending-weight order (ingredient statement) */}
                      <p className="text-[10px] mt-2 leading-tight">
                        <span className="font-bold">Other Ingredients:</span>{' '}
                        {facts.otherIngredientsStatement || '—'}
                      </p>

                      {allergenStatement.length > 0 && (
                        <p className="text-[10px] mt-2 leading-tight font-bold">Contains: {allergenStatement.map(m => m.species ?? m.category).join(', ')}</p>
                      )}

                      {facts.needsDaggerFootnote && (
                        <p className="text-[10px] mt-2 leading-tight italic border-t border-black pt-2">
                          † Daily Value (DV) not established.
                        </p>
                      )}

                      {/* §B4 SFP disclaimer — selector-driven (Round 11 Phase 3
                          Workstream A.5 [4/N] closure of Phase 2 finding #10).
                          Renders only when claim count > 0 per CFR 101.93(c);
                          asterisk-footnote prefix preserved as the SFP's
                          presentational convention; locked constants from
                          lib/supplementDisclaimer.ts (SINGULAR vs PLURAL form
                          routed by selectSupplementDisclaimer per claim count). */}
                      {sfpDsheaDisclaimer && (
                        <p className="text-[9px] mt-2 leading-tight border-t-2 border-black pt-2 italic">
                          * {sfpDsheaDisclaimer}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* FDA Nutrition Facts panel — all modes except AAFCO and Supplement Facts */}
                {mc.labelMode !== 'aafco' && mc.labelMode !== 'supplement-facts' && (
                <div className="border-4 border-black p-3 max-w-sm mx-auto font-sans">
                  <div className="text-5xl font-extrabold leading-none border-b-4 border-black pb-1 mb-1">Nutrition Facts</div>
                  <div className="text-sm border-b border-black pb-1 mb-1">{formattedServingsPerContainer || '— servings per container'}</div>
                  <div className="flex justify-between items-end border-b-8 border-black pb-1 mb-1">
                    <div className="text-sm font-bold">Serving size</div>
                    <div className="text-2xl font-extrabold">{servingSize}{servingUnit}</div>
                  </div>
                  <div className="flex justify-between border-b border-black py-1">
                    <div className="text-xs font-bold">Amount per serving</div>
                  </div>
                  <div className="flex justify-between items-end border-b-4 border-black pb-1">
                    <div className="text-4xl font-extrabold">Calories</div>
                    <div className="text-5xl font-extrabold">{fdaRoundCalories(perServing(nutrition.calories))}</div>
                  </div>
                  <div className="text-right text-xs border-b border-black py-1 font-bold">% Daily Value*</div>
                  {/* FDA 21 CFR 101.9 rounded nutrient lines. Macros use nearest-1% per 101.9(d)(7)(ii); vits/mins use 2/5/10 graduated rule. */}
                  {([
                    { label: 'Total Fat', val: nutrition.totalFat, unit: 'g', dv: 78, roundFn: fdaRoundFat, bold: true, indent: false },
                    { label: 'Saturated Fat', val: nutrition.saturatedFat, unit: 'g', dv: 20, roundFn: fdaRoundFat, bold: false, indent: true },
                    { label: 'Trans Fat', val: nutrition.transFat, unit: 'g', dv: 0, roundFn: fdaRoundFat, bold: false, indent: true },
                    { label: 'Cholesterol', val: nutrition.cholesterol, unit: 'mg', dv: 300, roundFn: fdaRoundCholesterol, bold: true, indent: false },
                    { label: 'Sodium', val: nutrition.sodium, unit: 'mg', dv: 2300, roundFn: fdaRoundSodium, bold: true, indent: false },
                    { label: 'Total Carbohydrate', val: nutrition.totalCarbs, unit: 'g', dv: 275, roundFn: fdaRoundGrams, bold: true, indent: false },
                    { label: 'Dietary Fiber', val: nutrition.dietaryFiber, unit: 'g', dv: 28, roundFn: fdaRoundGrams, bold: false, indent: true },
                    { label: 'Total Sugars', val: nutrition.totalSugars, unit: 'g', dv: 0, roundFn: fdaRoundGrams, bold: false, indent: true },
                    // Added Sugars — FDA-mandated sub-line per 21 CFR 101.9(c)(6)(iii) since
                    // the 2016 NFP overhaul. Format "Includes Xg Added Sugars" (FDA-specific
                    // labeling) per the labelPrefix render branch below. DV = 50g/day per
                    // 2016 final rule. Catalog data sourcing per [[catalog-must-be-coa-spec-
                    // sheet-anchored]] — depends on save backend + spec sheet ingestion;
                    // until then field is 0 across catalog and renders "Includes 0g Added
                    // Sugars" (FDA-compliant declaration of zero added sugars).
                    { label: 'Added Sugars', val: nutrition.addedSugars, unit: 'g', dv: 50, roundFn: fdaRoundGrams, bold: false, indent: true, labelPrefix: 'Includes ' },
                    { label: 'Protein', val: nutrition.protein, unit: 'g', dv: 0, roundFn: fdaRoundGrams, bold: true, indent: false },
                  ] as ReadonlyArray<{
                    label: string;
                    val: number;
                    unit: string;
                    dv: number;
                    roundFn: (n: number) => string;
                    bold: boolean;
                    indent: boolean;
                    labelPrefix?: string;
                  }>).map(({ label, val, unit, dv, roundFn, bold, indent, labelPrefix }) => {
                    const amt = perServing(val);
                    return (
                      <div key={label} className={`border-b border-black py-1 flex justify-between text-sm ${indent ? 'pl-4' : ''}`}>
                        <div>
                          {labelPrefix ? (
                            // FDA "Includes Xg Added Sugars" format per 21 CFR 101.9(c)(6)(iii) —
                            // prefix + value + unit + space + label (value appears mid-string,
                            // distinct from the standard "Label Xg" pattern other rows use).
                            <span className={bold ? 'font-bold' : ''}>{labelPrefix}{roundFn(amt)}{unit} {label}</span>
                          ) : (
                            <><span className={bold ? 'font-bold' : ''}>{label}</span> {roundFn(amt)}{unit}</>
                          )}
                        </div>
                        {dv > 0 && <div className="font-bold">{fdaRoundPercentDVMacros(rawPct(val, dv))}%</div>}
                      </div>
                    );
                  })}
                  <div className="border-b-8 border-black" />
                  {(() => {
                    const vitMinRows = [
                      { label: 'Vitamin D', val: nutrition.vitaminD, unit: 'mcg', dv: 20, roundFn: fdaRoundVitaminD },
                      { label: 'Calcium', val: nutrition.calcium, unit: 'mg', dv: 1300, roundFn: fdaRoundCalcium },
                      { label: 'Iron', val: nutrition.iron, unit: 'mg', dv: 18, roundFn: fdaRoundIron },
                      { label: 'Potassium', val: nutrition.potassium, unit: 'mg', dv: 4700, roundFn: fdaRoundPotassium },
                    ] as const;
                    // 21 CFR 101.9(c)(8)(iv): if <2% DV, may omit row + add "Not a significant source of" footnote.
                    const declared = vitMinRows.filter(r => rawPct(r.val, r.dv) >= 2);
                    const omitted = vitMinRows.filter(r => rawPct(r.val, r.dv) < 2);
                    return (
                      <>
                        {declared.map(({ label, val, unit, dv, roundFn }) => {
                          const amt = perServing(val);
                          return (
                            <div key={label} className="border-b border-black py-1 flex justify-between text-sm">
                              <div>{label} {roundFn(amt)}{unit}</div>
                              <div className="font-bold">{fdaRoundPercentDVMicros(rawPct(val, dv))}%</div>
                            </div>
                          );
                        })}
                        {omitted.length > 0 && (
                          <div className="text-[10px] italic mt-1 leading-tight">
                            Not a significant source of {omitted.map(r => r.label).join(', ')}.
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div className="text-xs mt-2 leading-tight">*The % Daily Value tells you how much a nutrient in a serving contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.</div>
                </div>
                )}

                {/* Baker's Percentage panel — additional view for baking mode */}
                {mc.labelMode === 'bakers' && (() => {
                  const isFlourIng = (i: typeof ingredients[number]) => {
                    const cat = i.foodData?.type === 'industrial' ? i.foodData?.data?.category : '';
                    return cat === 'Flours & Grains' || /\bflour\b/i.test(i.name) || /\bmeal\b/i.test(i.name);
                  };
                  const flourIngs = ingredients.filter(isFlourIng);
                  const totalFlourG = flourIngs.reduce((s, i) => s + i.qty * (UNIT_TO_GRAMS[i.unit] || 1), 0);
                  return (
                    <div className="mt-5 pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-bold text-gray-800 mb-1 uppercase tracking-wide">Baker&apos;s Percentages</h3>
                      <p className="text-[10px] text-gray-500 mb-2">
                        Flour total = 100% (baker&apos;s convention). All other ingredients expressed as % of total flour weight.
                        Hydration = (Total Water-Containing Liquids / Flour) × 100%.
                      </p>
                      {totalFlourG === 0 ? (
                        <p className="text-xs text-amber-700 italic bg-amber-50 border border-amber-200 p-2 rounded">
                          No flour detected. Add an ingredient from the &quot;Flours &amp; Grains&quot; category (or with &quot;flour&quot; / &quot;meal&quot; in the name) to compute Baker&apos;s %.
                        </p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-400 text-left">
                              <th className="py-1">Ingredient</th>
                              <th className="py-1 text-right">Mass</th>
                              <th className="py-1 text-right">Baker&apos;s %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ingredients.map((ing, i) => {
                              const massG = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
                              const bakersPct = (massG / totalFlourG) * 100;
                              const isFlour = isFlourIng(ing);
                              return (
                                <tr key={i} className={`border-b border-gray-200 ${isFlour ? 'bg-emerald-50 font-semibold' : ''}`}>
                                  <td className="py-1">{ing.name}{isFlour && <span className="ml-1 text-[9px] text-emerald-700">◉ flour</span>}</td>
                                  <td className="py-1 text-right font-mono">{massG.toFixed(1)}g</td>
                                  <td className="py-1 text-right font-mono">{bakersPct.toFixed(1)}%</td>
                                </tr>
                              );
                            })}
                            <tr className="border-t-2 border-gray-700 font-bold bg-gray-50">
                              <td className="py-1">Total Flour (reference)</td>
                              <td className="py-1 text-right font-mono">{totalFlourG.toFixed(1)}g</td>
                              <td className="py-1 text-right font-mono">100.0%</td>
                            </tr>
                          </tbody>
                        </table>
                      )}

                      {/* ══════════ HYDRATION TOOL ══════════ */}
                      {totalFlourG > 0 && (() => {
                        // Water-contribution factor by ingredient name/category.
                        // Bakers' hydration convention counts water-containing liquids
                        // as their water fraction, not as whole-weight.
                        const waterFactor = (ing: typeof ingredients[number]): number => {
                          const n = ing.name.toLowerCase();
                          const cat = ing.foodData?.type === 'industrial' ? ing.foodData?.data?.category : '';
                          // Exclude flours (they're the denominator, not the numerator)
                          if (isFlourIng(ing)) return 0;
                          // Pure water / ice (100%)
                          if (/^water(\s|\(|,|$)/i.test(ing.name) || /^ice(\s|\(|,|$)/i.test(ing.name)) return 1.0;
                          if (cat === 'Water & Ice') return 1.0;
                          // Milk / buttermilk / cream / yogurt
                          if (/buttermilk/.test(n)) return 0.90;
                          if (/yogurt|yoghurt/.test(n)) return 0.85;
                          if (/heavy cream|whipping cream/.test(n)) return 0.58;
                          if (/half.and.half|half & half/.test(n)) return 0.81;
                          if (/evaporated milk/.test(n)) return 0.74;
                          if (/sweetened condensed/.test(n)) return 0.27;
                          if (/skim milk|nonfat milk|2% milk|1% milk|low.?fat milk/.test(n)) return 0.89;
                          if (/oat milk|almond milk|soy milk|coconut milk|plant.?based milk|rice milk|cashew milk/.test(n)) return 0.88;
                          if (/\bmilk(\s|,|$)/.test(n) && !/milk powder|dry milk|dried milk/.test(n)) return 0.88;
                          // Eggs
                          if (/egg white/.test(n)) return 0.88;
                          if (/egg yolk/.test(n) && !/powder|dried/.test(n)) return 0.52;
                          if (/\begg/.test(n) && !/powder|dried|shell/.test(n)) return 0.75;
                          // Butter / cream cheese — most bakers count butter water at 16% as "free water"
                          if (/unsalted butter|salted butter|european.style butter|cultured butter/.test(n)) return 0.16;
                          if (/cream cheese/.test(n)) return 0.55;
                          if (/mascarpone/.test(n)) return 0.45;
                          if (/ricotta/.test(n)) return 0.72;
                          if (/cottage cheese/.test(n)) return 0.79;
                          // Juices — count as water for hydration purposes
                          if (cat === 'Juices' || /juice/.test(n)) return 0.88;
                          if (/rose water|orange blossom water/.test(n)) return 0.99;
                          // Sourdough starter / preferments / levain
                          if (/sourdough starter|levain|preferment|poolish|biga/.test(n)) return 0.50; // ~100% hydration starter → 50% water
                          // Fresh yeast
                          if (/fresh yeast|compressed yeast|cake yeast/.test(n)) return 0.70;
                          // Honey, molasses, syrups — bakers usually don't count their small water content
                          // Oils — not water
                          return 0;
                        };

                        type HydRow = { name: string; massG: number; factor: number; waterG: number };
                        const rows: HydRow[] = ingredients
                          .map(ing => {
                            const massG = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
                            const factor = waterFactor(ing);
                            return { name: ing.name, massG, factor, waterG: massG * factor };
                          })
                          .filter(r => r.waterG > 0);

                        const pureWaterG = rows
                          .filter(r => r.factor === 1.0)
                          .reduce((s, r) => s + r.waterG, 0);
                        const totalWaterG = rows.reduce((s, r) => s + r.waterG, 0);
                        const trueHydration = (totalWaterG / totalFlourG) * 100;
                        const waterOnlyHydration = (pureWaterG / totalFlourG) * 100;

                        // Classification bands
                        let band = '';
                        let bandColor = '';
                        if (trueHydration < 50) { band = 'Low hydration (bagel / firm dough)'; bandColor = 'text-amber-700 bg-amber-50 border-amber-200'; }
                        else if (trueHydration < 60) { band = 'Lean / stiff dough'; bandColor = 'text-sky-700 bg-sky-50 border-sky-200'; }
                        else if (trueHydration < 68) { band = 'Standard bread / sandwich loaf'; bandColor = 'text-emerald-700 bg-emerald-50 border-emerald-200'; }
                        else if (trueHydration < 75) { band = 'Moderate hydration (baguette / boule)'; bandColor = 'text-emerald-700 bg-emerald-50 border-emerald-200'; }
                        else if (trueHydration < 85) { band = 'High hydration (ciabatta / rustic)'; bandColor = 'text-blue-700 bg-blue-50 border-blue-200'; }
                        else if (trueHydration < 95) { band = 'Very high (focaccia / pan-de-cristal)'; bandColor = 'text-violet-700 bg-violet-50 border-violet-200'; }
                        else { band = 'Extreme hydration (slap-and-fold territory)'; bandColor = 'text-rose-700 bg-rose-50 border-rose-200'; }

                        return (
                          <div className="mt-5 pt-4 border-t border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 mb-1 uppercase tracking-wide">💧 Hydration Tool</h3>
                            <p className="text-[10px] text-gray-500 mb-2">
                              Hydration % = (total water in liquids) / flour × 100. Counts water at 100%, milk ~88%, eggs ~75%, buttermilk 90%, butter water 16%, sourdough starter 50% (assumed 100% hydration).
                            </p>

                            <div className={`flex items-baseline justify-between border rounded-lg px-3 py-2 mb-2 ${bandColor}`}>
                              <div>
                                <div className="text-[10px] uppercase tracking-wide opacity-75">True Hydration</div>
                                <div className="text-2xl font-bold font-mono">{trueHydration.toFixed(1)}%</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] uppercase tracking-wide opacity-75">Water-only</div>
                                <div className="text-lg font-semibold font-mono">{waterOnlyHydration.toFixed(1)}%</div>
                              </div>
                            </div>
                            <div className={`text-xs font-semibold px-3 py-1.5 rounded border ${bandColor} mb-3`}>
                              {band}
                            </div>

                            {rows.length > 0 ? (
                              <table className="w-full text-xs mb-2">
                                <thead>
                                  <tr className="border-b border-gray-400 text-left text-[10px] uppercase tracking-wide text-gray-500">
                                    <th className="py-1">Liquid</th>
                                    <th className="py-1 text-right">Mass</th>
                                    <th className="py-1 text-right">Water %</th>
                                    <th className="py-1 text-right">Water g</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((r, i) => (
                                    <tr key={i} className="border-b border-gray-200">
                                      <td className="py-1">{r.name}</td>
                                      <td className="py-1 text-right font-mono">{r.massG.toFixed(1)}g</td>
                                      <td className="py-1 text-right font-mono">{(r.factor * 100).toFixed(0)}%</td>
                                      <td className="py-1 text-right font-mono">{r.waterG.toFixed(1)}g</td>
                                    </tr>
                                  ))}
                                  <tr className="border-t-2 border-gray-700 font-bold bg-gray-50">
                                    <td className="py-1">Total water contribution</td>
                                    <td></td>
                                    <td></td>
                                    <td className="py-1 text-right font-mono">{totalWaterG.toFixed(1)}g</td>
                                  </tr>
                                  <tr className="font-bold bg-gray-50">
                                    <td className="py-1">÷ Total flour</td>
                                    <td></td>
                                    <td></td>
                                    <td className="py-1 text-right font-mono">{totalFlourG.toFixed(1)}g</td>
                                  </tr>
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-xs text-amber-700 italic bg-amber-50 border border-amber-200 p-2 rounded mb-2">
                                No water-containing liquids detected. Add water, milk, eggs, or starter to compute hydration.
                              </p>
                            )}

                            <div className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 rounded border border-gray-200 p-2">
                              <strong className="text-gray-700">Target ranges by product:</strong><br />
                              • Bagel / Pretzel dough: 50–58% &nbsp; • Brioche / Sandwich loaf: 55–65% (enriched)<br />
                              • Baguette / Boule / Pain de Campagne: 65–72% &nbsp; • Whole wheat bread: 70–80%<br />
                              • Ciabatta / Rustic Italian: 75–85% &nbsp; • Focaccia / Pan de Cristal: 85–95%+<br />
                              • Pizza (NY): 60–65% &nbsp; • Pizza (Neapolitan): 58–62% &nbsp; • Pizza (Al Taglio/RS): 75–85%
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                {/* ══════════ NUTRITION CLAIM VALIDATOR (21 CFR 101.54/101.56) ══════════ */}
                {mc.labelMode !== 'aafco' && mc.labelMode !== 'supplement-facts' && ingredients.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-gray-200 print:hidden">
                    <h3 className="text-sm font-bold text-gray-800 mb-1 uppercase tracking-wide">🏷️ Nutrition Claim Validator</h3>
                    <p className="text-[10px] text-gray-500 mb-3">FDA 21 CFR 101.54 / 101.56 — validate claims before they hit a label.</p>

                    {/* Claim input */}
                    <div className="mb-3">
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="text"
                          value={claimInput}
                          onChange={e => setClaimInput(e.target.value)}
                          placeholder='Type a claim: "Good Source of Protein", "Low Sodium", "Sugar Free"...'
                          className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                        />
                        {claimInput && (
                          <button onClick={() => setClaimInput('')} className="px-3 py-2 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">Clear</button>
                        )}
                      </div>
                      {claimInput && (() => {
                        // Round 3 fix (2026-05-07): validator contract changed from per-100g
                        // to per-serving. Convert workspace `nutrition` (batch totals) to
                        // per-serving via the existing `perServing` helper before calling.
                        // Previously the validator received batch totals interpreted as
                        // per-100g, producing 10x+ false positives on typical pilot batches.
                        const perServingNutrition = {
                          calories:     perServing(nutrition.calories),
                          totalFat:     perServing(nutrition.totalFat),
                          saturatedFat: perServing(nutrition.saturatedFat),
                          transFat:     perServing(nutrition.transFat),
                          cholesterol:  perServing(nutrition.cholesterol),
                          sodium:       perServing(nutrition.sodium),
                          totalCarbs:   perServing(nutrition.totalCarbs),
                          dietaryFiber: perServing(nutrition.dietaryFiber),
                          totalSugars:  perServing(nutrition.totalSugars),
                          protein:      perServing(nutrition.protein),
                          vitaminD:     perServing(nutrition.vitaminD),
                          calcium:      perServing(nutrition.calcium),
                          iron:         perServing(nutrition.iron),
                          potassium:    perServing(nutrition.potassium),
                        };
                        const result = validateClaim(claimInput, perServingNutrition, servingSizeInGrams);
                        const barColor = result.allowed ? 'emerald' : 'rose';
                        return (
                          <div className={`mt-2 p-3 rounded-lg border-2 bg-${barColor}-50 border-${barColor}-300 text-xs`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`font-bold inline-flex items-center gap-1 ${result.allowed ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {result.allowed
                                  ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /><span>Claim SUPPORTED</span></>
                                  : <><XIcon className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" /><span>Claim NOT SUPPORTED</span></>}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">{result.citation}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] mt-2">
                              <div className="bg-white/70 px-2 py-1 rounded">
                                <div className="text-gray-500 uppercase tracking-wide font-semibold">Threshold</div>
                                <div className="text-gray-800">{result.threshold}</div>
                              </div>
                              <div className="bg-white/70 px-2 py-1 rounded">
                                <div className="text-gray-500 uppercase tracking-wide font-semibold">Your formula</div>
                                <div className="text-gray-800 font-mono">{result.actual}</div>
                              </div>
                            </div>
                            {result.suggestion && (
                              <p className="text-[10px] mt-2 italic text-gray-700 leading-relaxed">💡 {result.suggestion}</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Available claims suggestions */}
                    {(() => {
                      // Round 3 fix: same per-serving conversion as validateClaim above.
                      const perServingNutrition = {
                        calories:     perServing(nutrition.calories),
                        totalFat:     perServing(nutrition.totalFat),
                        saturatedFat: perServing(nutrition.saturatedFat),
                        transFat:     perServing(nutrition.transFat),
                        cholesterol:  perServing(nutrition.cholesterol),
                        sodium:       perServing(nutrition.sodium),
                        totalCarbs:   perServing(nutrition.totalCarbs),
                        dietaryFiber: perServing(nutrition.dietaryFiber),
                        totalSugars:  perServing(nutrition.totalSugars),
                        protein:      perServing(nutrition.protein),
                        vitaminD:     perServing(nutrition.vitaminD),
                        calcium:      perServing(nutrition.calcium),
                        iron:         perServing(nutrition.iron),
                        potassium:    perServing(nutrition.potassium),
                      };
                      const available = suggestAvailableClaims(perServingNutrition, servingSizeInGrams);
                      if (available.length === 0) {
                        return (
                          <p className="text-[10px] text-gray-500 italic">No auto-qualifying nutrition claims detected for this formula yet.</p>
                        );
                      }
                      const strengthColor = (s: string) =>
                        s === 'high' ? 'emerald-100 text-emerald-800 border-emerald-300' :
                        s === 'good' ? 'sky-100 text-sky-800 border-sky-300' :
                        s === 'free' ? 'violet-100 text-violet-800 border-violet-300' :
                        'amber-100 text-amber-800 border-amber-300';
                      return (
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-1.5 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                            <span>Claims your formula currently supports ({available.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {available.map((c, i) => (
                              <button
                                key={i}
                                onClick={() => setClaimInput(c.claim)}
                                className={`px-2 py-1 rounded border text-[10px] font-semibold ${strengthColor(c.strength)} hover:shadow-sm transition`}
                                title={`Click to validate: ${c.citation}`}
                              >
                                {c.claim}
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] text-gray-400 mt-2 italic">Click any chip to inspect its FDA citation and thresholds. Keep records of your reference products for any &ldquo;reduced&rdquo; or &ldquo;light&rdquo; claim.</p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Ingredient Statement — directly beneath the nutrition panel */}
                <div className="mt-5 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-1 uppercase tracking-wide">Ingredients</h3>
                  <p className="text-[10px] text-gray-500 mb-2">FDA-compliant • Descending by weight • Sub-ingredients in parens</p>
                  {ingredientStatement ? (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-gray-800 text-xs leading-relaxed">{ingredientStatement}</div>
                  ) : (
                    <div className="text-center py-3 text-gray-400 text-xs italic">Ingredient statement appears here as you add ingredients.</div>
                  )}
                </div>

                {/* Allergen Statement — immediately after ingredient statement, per FDA convention */}
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-gray-800 mb-1 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                    <span>Allergen Statement</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 mb-2">FDA Top 9 allergens — auto-detected from ingredients</p>
                  {allergenStatement.length > 0 ? (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <p className="text-red-800 font-semibold text-sm">Contains: {allergenStatement.map(m => m.species ?? m.category).join(', ')}</p>
                      <p className="text-red-600 text-[10px] mt-1">Always verify allergens with supplier COA before labeling.</p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                      <p className="text-amber-900 font-semibold text-sm">Allergen Status: UNDOCUMENTED</p>
                      <p className="text-amber-700 text-[10px] mt-1">Verify with supplier COA before labeling. Absence of declared allergens does not confirm absence of allergen presence — harm-critical floor doctrine.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  CLAIMS VALIDATOR (supplements mode only)
                  Nutrient-content claims auto-detected from %DV rollup,
                  defensible structure/function claim library per ingredient,
                  disease-claim language detector on the draft copy box,
                  required disclaimers auto-generated.
                  ═══════════════════════════════════════════════════════════ */}
              {mode === 'supplements' && ingredients.length > 0 && (() => {
                // Build %DV table from Supplement Facts data for nutrient content claims
                const scale = computePerServingScale({ mode, servingSizeInGrams, totalBatchGrams });
                const perServingMgByName = new Map<string, number>();
                for (const ing of ingredients) {
                  const g = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
                  // Apply potencyFactor for carrier-loaded SKUs (e.g. Vit D3 100,000 IU/g on MCC
                  // is only 0.25% active by mass). Defaults to 1.0 — the ingredient mass IS the
                  // active mass. This prevents false UL hard-stops on triturated / beadlet forms.
                  const potency = (ing.foodData?.type === 'industrial' && ing.foodData.data?.potencyFactor)
                    ? ing.foodData.data.potencyFactor : 1;
                  perServingMgByName.set(ing.name, g * scale * 1000 * potency);
                }
                // Reuse the supplement-facts data for vitamin/mineral rows
                const facts = buildSupplementFacts({
                  ingredients,
                  mode,
                  servingSizeInGrams,
                  totalBatchGrams,
                  servingsPerContainer,
                  servingSizeLabel: `${servingSize}${servingUnit}`,
                  caloriesPerServing: perServing(nutrition.calories),
                  macroPerServing: {
                    totalFat: perServing(nutrition.totalFat),
                    totalCarbs: perServing(nutrition.totalCarbs),
                    protein: perServing(nutrition.protein),
                    sodium: perServing(nutrition.sodium),
                    totalSugars: perServing(nutrition.totalSugars),
                  },
                });
                const contentClaims = detectNutrientContentClaims(
                  facts.vitaminMineralRows
                    .filter(r => r.percentDV !== null)
                    .map(r => ({
                      nutrient: r.displayName.replace(/\s*\(as[^)]+\)/, '').trim(),
                      percentDV: r.percentDV ?? 0,
                    }))
                );
                const sfClaims = detectStructureFunctionClaims(ingredients.map(i => i.name));
                const draftFlags = analyzeDraftClaim(suppDraftClaim);
                const disclaimers = buildDisclaimers(sfClaims.length, ingredients.map(i => i.name));

                const claimsDefaultExpanded = draftFlags.length > 0 || suppDraftClaim.trim().length > 0;
                const claimsManual = suppCardsManuallyToggled['claims'];
                const claimsExpanded = claimsManual !== undefined ? claimsManual : claimsDefaultExpanded;
                return (
                  <div id="supp-card-claims" className="bg-white rounded-xl border border-gray-200 p-6">
                    <button
                      type="button"
                      onClick={() => toggleSuppCard('claims', claimsExpanded)}
                      className="w-full flex items-center justify-between mb-4 flex-wrap gap-2 text-left"
                    >
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-xs opacity-60">{claimsExpanded ? '▼' : '▶'}</span>
                        📝 Claims Validator
                      </h2>
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">21 CFR 101.54 · 101.93 (DSHEA)</span>
                    </button>
                    {claimsExpanded && (<>

                    {/* Nutrient content claims (auto) */}
                    {contentClaims.length > 0 && (
                      <div className="mb-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Available nutrient-content claims</h3>
                        <div className="space-y-1.5">
                          {contentClaims.map((c, i) => (
                            <div key={i} className="text-xs bg-emerald-50 border border-emerald-200 rounded p-2">
                              <div className="font-semibold text-emerald-800">{c.claimLabel} · {c.nutrient}</div>
                              <div className="text-gray-700 mt-0.5 italic">
                                {c.templates.slice(0, 2).map((t, k) => (
                                  <span key={k} className="inline-block mr-3">&ldquo;{t}&rdquo;</span>
                                ))}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">Qualifies at ≥ {c.minPercentDV}% DV per serving</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Structure/function claims (library) */}
                    {sfClaims.length > 0 && (
                      <div className="mb-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Defensible structure/function claims</h3>
                        <div className="space-y-2">
                          {sfClaims.map((c, i) => (
                            <details key={i} className="text-xs bg-sky-50 border border-sky-200 rounded p-2" open={i < 3}>
                              <summary className="cursor-pointer font-semibold text-sky-800">{c.ingredient}</summary>
                              <ul className="mt-1.5 ml-4 list-disc text-gray-700 space-y-0.5">
                                {c.claims.map((claim, k) => (
                                  <li key={k}>&ldquo;{claim}&rdquo;</li>
                                ))}
                              </ul>
                              <div className="text-[10px] text-gray-500 mt-1">
                                Min dose: <span className="font-mono">{c.minDose}</span> · {c.citation}
                              </div>
                              {c.note && <div className="text-[10px] text-amber-700 mt-0.5 italic">{c.note}</div>}
                            </details>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Draft-claim analyzer */}
                    <div className="mb-5">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Draft label copy — paste to check for disease-claim language</h3>
                      <textarea
                        rows={3}
                        value={suppDraftClaim}
                        onChange={(e) => setSuppDraftClaim(e.target.value)}
                        placeholder="Paste your proposed label language, product description, or marketing copy here to scan for FDA-flagged disease claims, drug claims, and puffery."
                        className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                      />
                      {draftFlags.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {draftFlags.map((f, i) => {
                            const rowColor = f.tier === 'disease' ? 'bg-red-100 border-red-400 text-red-800'
                              : f.tier === 'drug-claim' ? 'bg-orange-100 border-orange-300 text-orange-800'
                              : 'bg-amber-100 border-amber-300 text-amber-800';
                            return (
                              <div key={i} className={`text-xs p-2 rounded border ${rowColor}`}>
                                <div className="font-semibold">&ldquo;{f.match}&rdquo;</div>
                                <div className="mt-0.5">{f.explanation}</div>
                                {f.suggestion && <div className="italic mt-0.5">→ {f.suggestion}</div>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {suppDraftClaim.trim() && draftFlags.length === 0 && (
                        <p className="mt-2 text-xs text-emerald-700 inline-flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          <span>No disease-claim or drug-claim language detected. Still have legal counsel review before print.</span>
                        </p>
                      )}
                    </div>

                    {/* Required disclaimers */}
                    {(disclaimers.dsheaDisclaimer || disclaimers.additionalWarnings.length > 0) && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Required disclaimers for this formula</h3>
                        <div className="space-y-2">
                          {disclaimers.dsheaDisclaimer && (
                            <div className="text-xs bg-gray-50 border border-gray-200 rounded p-2 italic text-gray-700">
                              {disclaimers.dsheaDisclaimer}
                            </div>
                          )}
                          {disclaimers.additionalWarnings.map((w, i) => (
                            <div key={i} className="text-xs bg-amber-50 border border-amber-200 rounded p-2 text-amber-900 flex items-start gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    </>)}
                  </div>
                );
              })()}

              {/* Spec Analysis Panel — only the formulator's selected tracked specs render.
                  Toggle the checklist near Product Type to add/remove metrics.
                  Round 11 Phase 3 Workstream A.5 [3/N] (#25h): title is mode-aware.
                  Supplement mode drops the "Food Science" F&B branding for
                  "Formulation Spec Analysis" — the panel itself is supplement-
                  relevant (aw, moisture, etc. are tracked specs for supplements
                  too), just the framing was F&B-branded. */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">🔬 {mode === 'supplements' ? 'Formulation Spec Analysis' : 'Food Science Spec Analysis'}</h2>
                  <span className="text-xs text-gray-400">{effectiveTrackedSpecs.length === 0 ? 'No specs tracked — pick from checklist' : `${effectiveTrackedSpecs.length} tracked`}</span>
                </div>
                {ingredients.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm italic">Specs appear here as you add ingredients</div>
                ) : effectiveTrackedSpecs.length === 0 && !showAceticMoistureRatio && !showLowAcidComponentPct ? (
                  <div className="text-center py-6 text-gray-400 text-sm italic">No specs tracked — open the &ldquo;Specs to Track&rdquo; checklist near Product Type to select what should appear here.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {trackedSet.has('pH') && (
                        <SpecTile
                          label="pH"
                          value={specs.pH > 0 ? formatRangedValue('pH', specs.pH, specs.confidence.pH, 2).text : '—'}
                          confidence={specs.pH > 0 ? specs.confidence.pH : undefined}
                          hint={specs.pH > 0 ? (specs.pH <= 4.0 ? 'High-acid' : specs.pH <= 4.6 ? 'Acidified / Acid' : 'Low-acid') : '—'}
                          color={specs.pH <= 4.0 ? 'emerald' : specs.pH <= 4.6 ? 'amber' : 'red'}
                        />
                      )}
                      {trackedSet.has('aw') && (
                        <SpecTile
                          label="Water Activity (a_w)"
                          value={specs.aw > 0 ? formatRangedValue('aw', specs.aw, specs.confidence.aw, 3).text : '—'}
                          confidence={specs.aw > 0 ? specs.confidence.aw : undefined}
                          hint={specs.aw > 0 ? (specs.aw <= 0.85 ? 'Shelf-stable by a_w' : specs.aw <= 0.91 ? 'Intermediate moisture' : 'High moisture') : '—'}
                          color={specs.aw <= 0.85 ? 'emerald' : specs.aw <= 0.91 ? 'amber' : 'gray'}
                        />
                      )}
                      {trackedSet.has('brix') && (
                        <SpecTile
                          label="Brix (soluble solids)"
                          value={specs.brix > 0 ? formatRangedValue('brix', specs.brix, specs.confidence.brix, 1, '°').text : '—'}
                          confidence={specs.brix > 0 ? specs.confidence.brix : undefined}
                          hint={specs.brix > 0 ? (specs.brix >= 65 ? 'Jam/preserve range' : specs.brix >= 30 ? 'High sugar' : specs.brix >= 10 ? 'Moderate' : 'Low') : '—'}
                          color="emerald"
                        />
                      )}
                      {trackedSet.has('moisture') && (
                        <SpecTile
                          label="Moisture %"
                          value={specs.moisture > 0 ? formatRangedValue('moisture', specs.moisture, specs.confidence.moisture, 1, '%').text : '—'}
                          confidence={specs.moisture > 0 ? specs.confidence.moisture : undefined}
                          hint={`${specs.moisture > 70 ? 'High-moisture' : specs.moisture > 25 ? 'Intermediate' : 'Low-moisture'}`}
                          color="emerald"
                        />
                      )}
                      {/* Bostwick + Brookfield render unmarked — Session 4 viscosity work wires
                          their per-metric confidence treatment as an additive change. */}
                      {trackedSet.has('bostwick') && (
                        <SpecTile
                          label="Bostwick (cm/30s)"
                          value={`${specs.bostwickCmPer30s.toFixed(1)} cm`}
                          hint={specs.bostwickClass}
                          color="emerald"
                        />
                      )}
                      {trackedSet.has('brookfield') && (
                        <SpecTile
                          label="Brookfield (cP est.)"
                          value={specs.brookfieldCp < 1000 ? specs.brookfieldCp.toFixed(0) : `${(specs.brookfieldCp / 1000).toFixed(0)}k`}
                          hint={specs.brookfieldClass}
                          color="emerald"
                        />
                      )}
                      {trackedSet.has('aceticAcid') && (
                        <SpecTile
                          label="Acetic Acid %"
                          value={specs.aceticAcid > 0 ? formatRangedValue('aceticAcid', specs.aceticAcid, specs.confidence.aceticAcid, 2, '%').text : '—'}
                          confidence={specs.aceticAcid > 0 ? specs.confidence.aceticAcid : undefined}
                          hint={specs.aceticAcid > 0 ? 'From vinegars / acid' : '—'}
                          color="emerald"
                        />
                      )}
                      {/* Auto-derived: A/M ratio when both inputs tracked */}
                      {showAceticMoistureRatio && (
                        <SpecTile
                          label="Acetic / Moisture"
                          value={specs.aceticMoistureRatio > 0 ? `${specs.aceticMoistureRatio.toFixed(2)}%` : '—'}
                          confidence={specs.aceticMoistureRatio > 0
                            ? worstConfidence(specs.confidence.aceticAcid, specs.confidence.moisture)
                            : undefined}
                          hint={specs.aceticMoistureRatio >= 0.5
                            ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" /><span>≥ 0.5% (acidified target)</span></span>
                            : specs.aceticMoistureRatio > 0 ? 'Below 0.5% target' : '—'}
                          color={specs.aceticMoistureRatio >= 0.5 ? 'emerald' : specs.aceticMoistureRatio > 0 ? 'amber' : 'gray'}
                        />
                      )}
                      {/* Auto-derived: LAC% when pH tracked.
                          Round 8 Item 2: 2-decimal precision. The 5%/10% filing thresholds
                          (21 CFR 114) make sub-percent precision regulatorily meaningful —
                          54.4% vs 54.35% across surfaces was confusing. Standardize on 2dp
                          across Spec Analysis (here), Determination Engine threshold bar,
                          and the spec-snapshot footer. */}
                      {showLowAcidComponentPct && (
                        <SpecTile
                          label="Low-Acid Components"
                          value={`${specs.lowAcidComponentPct.toFixed(2)}%`}
                          confidence={specs.pH > 0 ? specs.confidence.pH : undefined}
                          hint={
                            specs.lowAcidComponentPct >= 10
                              ? '≥ 10% → filing required if pH ≤ 4.6'
                              : specs.lowAcidComponentPct >= 5
                                ? '5–10% → gray zone'
                                : '< 5% → naturally acid OK'
                          }
                          color={
                            specs.lowAcidComponentPct >= 10
                              ? 'red'
                              : specs.lowAcidComponentPct >= 5
                                ? 'amber'
                                : 'emerald'
                          }
                        />
                      )}
                    </div>

                    {/* ══════════ REAL-TIME 21 CFR CLASSIFICATION PANEL ══════════ */}
                    {/* Shows where the formula sits on the 4 regulatory pathways, with
                        live progress bars toward the critical thresholds. Crossing
                        5% LAC (acid → acidified) and 4.6 pH (acidified ↔ LACF) are
                        filing-requirement flips, so they must be viscerally obvious.
                        Round 11 Finding #25 sub-issue 25b: mode-gate. Supplements
                        (DSHEA / 21 CFR 111) do not classify under 21 CFR 113/114
                        acidified-foods pathways — even when a supplement formulation
                        incidentally satisfies the F&B 'shelf-stable-dry' heuristic,
                        the F&B classification panel must not surface. */}
                    {mode !== 'supplements' && specs.productClassification !== '—' && (() => {
                      const cls = specs.productClassification;
                      const lac = specs.lowAcidComponentPct;
                      const pH = specs.pH;
                      const aw = specs.aw;

                      // Headline color & icon by classification
                      // SCOPE NOTE: 'insufficient-data' and 'undetermined' entries added 2026-04-30
                      // alongside the verified-data gate in lib/foodScience.ts. Existing labels still
                      // use certainty language; hedging cleanup pending in follow-up PR.
                      const conf = {
                        'acid':                 { color: 'emerald', icon: '🍋', label: 'ACID FOOD',               filing: 'No FDA filing',                      cfr: '21 CFR 114.3(b)(1)' },
                        'acidified':            { color: 'amber',   icon: '🧪', label: 'ACIDIFIED FOOD',          filing: 'FDA Form 2541a REQUIRED',            cfr: '21 CFR 114' },
                        'acidified-in-process': { color: 'amber',   icon: '⚗️', label: 'ACIDIFIED (IN PROCESS)',   filing: 'Add more acid → then 2541a',         cfr: '21 CFR 114' },
                        'lacf':                 { color: 'rose',    icon: '🚨', label: 'LOW-ACID CANNED FOOD',     filing: 'FDA Form 2541a REQUIRED + Retort',   cfr: '21 CFR 113' },
                        'shelf-stable-dry':     { color: 'emerald', icon: '🌾', label: 'SHELF-STABLE (DRY)',       filing: 'No FDA filing',                      cfr: '21 CFR 117' },
                        'insufficient-data':    { color: 'amber',   icon: '⚠️', label: 'INSUFFICIENT DATA — Regulatory classification unavailable. Add lab-verified or supplier-COA values for the listed ingredients. Confirm with FDA-recognized Process Authority.', filing: 'Pending verified data', cfr: '21 CFR 113 / 114' },
                        'undetermined':         { color: 'amber',   icon: '⚠️', label: 'UNDETERMINED — classification could not be computed', filing: 'Pending classification', cfr: '—' },
                      }[cls];

                      // Distance-to-threshold math — shows how close to the next classification flip
                      // LAC threshold at 5% (acid → acidified) and 10% (lacf → acidified-in-process)
                      const lacToFivePct = 5 - lac;
                      const lacToTenPct = 10 - lac;
                      const phToAcidified = pH - 4.6;  // positive = room to acid, negative = over
                      const awToShelfStable = aw - 0.85;

                      return (
                        <div className={`mt-4 rounded-lg border-2 p-4 bg-${conf.color}-50 border-${conf.color}-300`}>
                          {/* Headline */}
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{conf.icon}</span>
                              <div>
                                <div className={`font-bold text-${conf.color}-800 text-sm tracking-wide`}>{conf.label}</div>
                                <div className="text-[10px] text-gray-600 font-mono">{conf.cfr}</div>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full bg-white border border-${conf.color}-300 text-xs font-bold text-${conf.color}-700`}>
                              {conf.filing}
                            </div>
                          </div>

                          {/* Threshold progress bars — pH (4.6), LAC (5% / 10%), aw (0.85) */}
                          <div className="space-y-2 text-xs">
                            {/* pH progress bar (0 → 7, marker at 4.6) */}
                            {pH > 0 && (
                              <div>
                                <div className="flex justify-between items-center mb-0.5">
                                  <span className="font-semibold text-gray-700">pH threshold 4.6</span>
                                  <span className={`font-mono font-bold ${pH <= 4.6 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                    {pH.toFixed(2)} {pH <= 4.6 ? `(${phToAcidified.toFixed(2)} below)` : `(+${(pH - 4.6).toFixed(2)} over)`}
                                  </span>
                                </div>
                                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="absolute inset-y-0 left-0 bg-emerald-400" style={{ width: `${(4.6 / 7) * 100}%` }} />
                                  <div className="absolute inset-y-0 left-[65.7%] w-0.5 bg-gray-800" title="pH 4.6 threshold" />
                                  <div
                                    className={`absolute inset-y-0 w-1 rounded-full ${pH <= 4.6 ? 'bg-emerald-700' : 'bg-rose-700'}`}
                                    style={{ left: `calc(${Math.min(100, (pH / 7) * 100)}% - 2px)` }}
                                    title={`Current pH: ${pH.toFixed(2)}`}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Low-Acid Component progress bar (0 → 15%, markers at 5% and 10%) */}
                            <div>
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="font-semibold text-gray-700">Low-acid components (5% filing threshold)</span>
                                <span className={`font-mono font-bold ${
                                  lac < 5 ? 'text-emerald-700'
                                  : lac < 10 ? 'text-amber-700'
                                  : 'text-rose-600'
                                }`}>
                                  {lac.toFixed(2)}% {lac < 5 ? `(${lacToFivePct.toFixed(2)}% margin)` : lac < 10 ? `(over 5%, ${lacToTenPct.toFixed(2)}% to 10%)` : '(over 10%)'}
                                </span>
                              </div>
                              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-emerald-400" style={{ width: '33.33%' }} />
                                <div className="absolute inset-y-0 bg-amber-400" style={{ left: '33.33%', width: '33.33%' }} />
                                <div className="absolute inset-y-0 bg-rose-400" style={{ left: '66.66%', width: '33.34%' }} />
                                <div className="absolute inset-y-0 left-[33.33%] w-0.5 bg-gray-800" title="5% threshold (acidified)" />
                                <div className="absolute inset-y-0 left-[66.66%] w-0.5 bg-gray-800" title="10% threshold (acidified-in-process)" />
                                <div
                                  className={`absolute inset-y-[-2px] w-1.5 rounded-full border-2 border-white ${
                                    lac < 5 ? 'bg-emerald-800' : lac < 10 ? 'bg-amber-800' : 'bg-rose-800'
                                  }`}
                                  style={{ left: `calc(${Math.min(100, (lac / 15) * 100)}% - 3px)` }}
                                  title={`Current LAC: ${lac.toFixed(2)}%`}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] text-gray-500 mt-0.5 px-1">
                                <span>0%</span>
                                <span className="font-bold text-gray-700">5% (acidified)</span>
                                <span className="font-bold text-gray-700">10%</span>
                                <span>15%</span>
                              </div>
                            </div>

                            {/* aw progress bar — only show if aw is a decision factor */}
                            {aw > 0 && pH > 4.6 && (
                              <div>
                                <div className="flex justify-between items-center mb-0.5">
                                  <span className="font-semibold text-gray-700">Water activity 0.85 threshold</span>
                                  <span className={`font-mono font-bold ${aw <= 0.85 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                    {aw.toFixed(3)} {aw <= 0.85 ? '(shelf-stable by aw)' : `(+${awToShelfStable.toFixed(3)} over, requires retort)`}
                                  </span>
                                </div>
                                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="absolute inset-y-0 left-0 bg-emerald-400" style={{ width: '85%' }} />
                                  <div className="absolute inset-y-0 left-[85%] w-0.5 bg-gray-800" title="0.85 threshold" />
                                  <div
                                    className={`absolute inset-y-0 w-1 rounded-full ${aw <= 0.85 ? 'bg-emerald-700' : 'bg-rose-700'}`}
                                    style={{ left: `calc(${Math.min(100, aw * 100)}% - 2px)` }}
                                    title={`Current aw: ${aw.toFixed(3)}`}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Explainer text specific to current classification */}
                          <p className="text-[10px] text-gray-700 mt-3 leading-relaxed italic">
                            {cls === 'acid' && `Naturally acid food. Low-acid components (${lac.toFixed(1)}%) under the 5% FDA threshold. Hot-fill + GMP only — no scheduled process filing.`}
                            {cls === 'acidified' && `Low-acid base (${lac.toFixed(1)}%) acidified to pH ${pH.toFixed(2)}. THIS IS A REGULATED PATHWAY. Scheduled Process + Process Authority review mandatory before first commercial batch (21 CFR 114).`}
                            {cls === 'acidified-in-process' && `Acidulant is present and ${lac.toFixed(1)}% low-acid base detected, but finished pH ${pH.toFixed(2)} is above 4.6. Add more acid until equilibrium pH ≤ 4.6 — target ≤ 4.2 for safety margin. Once acidified, 21 CFR 114 filing required.`}
                            {cls === 'lacf' && `Low-acid canned food. pH ${pH.toFixed(2)} > 4.6 AND aw ${aw.toFixed(3)} > 0.85. Requires retort to commercial sterility (F₀ typ. ≥ 6 min) and scheduled process filing under 21 CFR 113. This is the highest-risk FDA process category — C. botulinum control is non-negotiable.`}
                            {cls === 'shelf-stable-dry' && `Shelf-stable by water activity (aw ${aw.toFixed(3)} ≤ 0.85). No FDA scheduled process filing. Follow 21 CFR 117 Preventive Controls + low-moisture environmental Salmonella program.`}
                          </p>
                        </div>
                      );
                    })()}

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-gray-700">Regulatory classification:</span>
                        <span className="text-emerald-700 font-medium">{specs.regulatoryClass}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Spec coverage:</span>
                        <span>{(specs.coverage * 100).toFixed(0)}% of mass has spec data</span>
                      </div>
                      {specs.coverage < 0.7 && (
                        <p className="text-amber-600 mt-1 inline-flex items-start gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>Less than 70% of mass has spec data. Estimates may be less accurate — add more industrial-DB ingredients or verify in lab.</span>
                        </p>
                      )}
                    </div>
                    {/* Round 11 Phase 3 Workstream A.5 [3/N] (#25i): instrument
                        list is mode-aware. F&B retains pH meter / Brix refractometer
                        / a_w meter / Bostwick consistometer / Brookfield viscometer.
                        Supplements reference HPLC (label-claim potency assays),
                        ICP-MS (heavy metals), dissolution / disintegration testing
                        per USP <711>/<2040>, a_w meter, and Karl Fischer titrator
                        (moisture). Brix refractometer / Bostwick / Brookfield are
                        F&B-only instruments (sugar / sauce viscosity); not
                        applicable to typical supplement product classes. */}
                    <p className="text-xs text-gray-400 mt-3">
                      {mode === 'supplements'
                        ? 'Estimates based on ingredient composition. Use for formulation scoping; final product specs require lab verification (HPLC for label-claim potency assays, ICP-MS for heavy metals, dissolution / disintegration testing per USP <711>/<2040>, a_w meter, Karl Fischer titrator for moisture).'
                        : 'Estimates based on ingredient composition. Use for formulation scoping; final product specs require lab verification (pH meter, Brix refractometer, a_w meter, Bostwick consistometer, Brookfield viscometer).'}
                    </p>
                  </>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  STABILITY & OVERAGE (supplements mode only)
                  Per-ingredient degradation prediction over the target shelf
                  life, with storage + packaging modifiers. Output: required
                  formulate-at amounts so the Supplement Facts label claim
                  stays true through expiry — 21 CFR 101.36(b)(3)(iv).
                  ═══════════════════════════════════════════════════════════ */}
              {mode === 'supplements' && ingredients.length > 0 && (() => {
                // Per-serving scaling via shared helper. Round 11 Phase 3
                // post-A.5 follow-up (2026-05-17): site #5 of the Round 11
                // pre-flight audit's 5-replicated-locations cleanup. Prior
                // code applied raw F&B ratio in supplements mode — produced
                // wrong overage projections (under-stated by factor of
                // servings). All 5 sites now route through the helper.
                const scale = computePerServingScale({ mode, servingSizeInGrams, totalBatchGrams });
                const perServingMgByName = new Map<string, number>();
                for (const ing of ingredients) {
                  const g = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
                  // Apply potencyFactor for carrier-loaded SKUs (e.g. Vit D3 100,000 IU/g on MCC
                  // is only 0.25% active by mass). Defaults to 1.0 — the ingredient mass IS the
                  // active mass. This prevents false UL hard-stops on triturated / beadlet forms.
                  const potency = (ing.foodData?.type === 'industrial' && ing.foodData.data?.potencyFactor)
                    ? ing.foodData.data.potencyFactor : 1;
                  perServingMgByName.set(ing.name, g * scale * 1000 * potency);
                }
                const overage = computeOverages(ingredients, perServingMgByName, {
                  shelfLifeMonths: suppShelfLifeMonths,
                  storage: suppStorage,
                  amberPackaging: suppAmberPkg,
                  desiccant: suppDesiccant,
                  nitrogenFlush: suppNitrogen,
                  tocopherolAntioxidant: suppTocopherol,
                });
                if (overage.rows.length === 0) return null;

                // Overall worst loss drives the card color.
                const worst = overage.worstLossPct;
                const cardColor =
                  worst > 50 ? 'bg-red-50 border-red-400'
                  : worst > 30 ? 'bg-orange-50 border-orange-300'
                  : worst > 15 ? 'bg-amber-50 border-amber-300'
                  : 'bg-emerald-50 border-emerald-300';

                const stabDefaultExpanded = worst > 15;
                const stabManual = suppCardsManuallyToggled['stability'];
                const stabExpanded = stabManual !== undefined ? stabManual : stabDefaultExpanded;
                return (
                  <div id="supp-card-stability" className={`rounded-xl border-2 p-6 ${cardColor}`}>
                    <button
                      type="button"
                      onClick={() => toggleSuppCard('stability', stabExpanded)}
                      className="w-full flex items-center justify-between mb-4 flex-wrap gap-2 text-left"
                    >
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-xs opacity-60">{stabExpanded ? '▼' : '▶'}</span>
                        🧪 Stability & Overage — {suppShelfLifeMonths}mo shelf life
                      </h2>
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">21 CFR 101.36(b)(3)(iv) · USP &lt;1150&gt;</span>
                    </button>
                    {stabExpanded && (<>
                    {/* Condition controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Target Shelf Life</label>
                        <select
                          value={suppShelfLifeMonths}
                          onChange={(e) => setSuppShelfLifeMonths(parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none"
                        >
                          <option value={12}>12 months (1 yr)</option>
                          <option value={18}>18 months</option>
                          <option value={24}>24 months (2 yr — industry standard)</option>
                          <option value={36}>36 months (3 yr — premium)</option>
                          <option value={60}>60 months (5 yr — pharma)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Storage Condition</label>
                        <select
                          value={suppStorage}
                          onChange={(e) => setSuppStorage(e.target.value as StorageCondition)}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none"
                        >
                          <option value="ambient">Ambient (room temperature)</option>
                          <option value="refrigerated">Refrigerated (2-8°C)</option>
                          <option value="frozen">Frozen (-20°C)</option>
                        </select>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-2 items-end text-xs">
                        <label className="inline-flex items-center gap-1">
                          <input type="checkbox" checked={suppAmberPkg} onChange={(e) => setSuppAmberPkg(e.target.checked)} className="accent-emerald-600" />
                          Amber / opaque
                        </label>
                        <label className="inline-flex items-center gap-1">
                          <input type="checkbox" checked={suppDesiccant} onChange={(e) => setSuppDesiccant(e.target.checked)} className="accent-emerald-600" />
                          Desiccant
                        </label>
                        <label className="inline-flex items-center gap-1">
                          <input type="checkbox" checked={suppNitrogen} onChange={(e) => setSuppNitrogen(e.target.checked)} className="accent-emerald-600" />
                          N₂ flush
                        </label>
                        <label className="inline-flex items-center gap-1">
                          <input type="checkbox" checked={suppTocopherol} onChange={(e) => setSuppTocopherol(e.target.checked)} className="accent-emerald-600" />
                          Tocopherol antioxidant
                        </label>
                      </div>
                    </div>

                    {/* Bottleneck callout */}
                    {overage.bottleneck && (
                      <div className="mb-3 text-sm text-gray-700">
                        <span className="font-semibold">Stability bottleneck:</span>{' '}
                        <span className="font-medium">{overage.bottleneck.ingredientName}</span>{' '}
                        <span className="text-gray-500">({CATEGORY_LABEL[overage.bottleneck.category]})</span>{' '}
                        <span className="text-gray-500">— </span>
                        <span className={`font-bold ${overage.bottleneck.lossPct > 30 ? 'text-red-700' : overage.bottleneck.lossPct > 15 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {overage.bottleneck.lossPct.toFixed(0)}% loss projected
                        </span>
                      </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left border-b-2 border-gray-300">
                            <th className="py-2 pr-2 font-semibold text-gray-600">Ingredient</th>
                            <th className="py-2 px-2 font-semibold text-gray-600">Category</th>
                            <th className="py-2 px-2 font-semibold text-gray-600 text-right">Label Claim</th>
                            <th className="py-2 px-2 font-semibold text-gray-600 text-right">Loss %</th>
                            <th className="py-2 px-2 font-semibold text-gray-600 text-right">Predicted EOSL</th>
                            <th className="py-2 px-2 font-semibold text-gray-600 text-right">Formulate At</th>
                            <th className="py-2 pl-2 font-semibold text-gray-600 text-right">Overage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overage.rows.map((r, i) => {
                            const lossColor = r.lossPct > 30 ? 'text-red-700' : r.lossPct > 15 ? 'text-amber-700' : 'text-emerald-700';
                            return (
                              <tr key={i} className="border-b border-gray-200">
                                <td className="py-1.5 pr-2 font-medium text-gray-800">{r.ingredientName}</td>
                                <td className="py-1.5 px-2 text-gray-500 text-[11px]">{CATEGORY_LABEL[r.category]}</td>
                                <td className="py-1.5 px-2 text-right font-mono">{formatDose(r.labelClaimMg)}</td>
                                <td className={`py-1.5 px-2 text-right font-mono font-bold ${lossColor}`}>{r.lossPct.toFixed(0)}%</td>
                                <td className="py-1.5 px-2 text-right font-mono text-gray-600">{formatDose(r.predictedEOSLMg)}</td>
                                <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-700">{formatDose(r.requiredFormulateAtMg)}</td>
                                <td className="py-1.5 pl-2 text-right font-mono text-gray-700">+{r.overagePct.toFixed(0)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Advice */}
                    {worst > 30 && (
                      <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-900">
                        <p className="text-sm font-bold mb-1 inline-flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                          <span>Stability concern</span>
                        </p>
                        <p className="text-xs leading-snug text-rose-800">
                          At least one active is projected to lose more than 30% of label claim over this shelf life.
                          Options: shorten claimed shelf life, add protective packaging (amber + desiccant + N₂ flush),
                          reformulate with a more stable ingredient form, or substantially increase the overage.
                          Real stability data from accelerated + long-term ICH Q1A protocols should validate these predictions before release.
                        </p>
                      </div>
                    )}
                    {worst > 15 && worst <= 30 && (
                      <p className="mt-3 text-xs text-amber-800 leading-snug">
                        Moderate degradation expected. The Formulate-At column shows what to weigh to keep the label claim true through {suppShelfLifeMonths} months.
                        Real stability data is still required — these are conservative industry estimates, not product-specific.
                      </p>
                    )}
                    {worst <= 15 && (
                      <p className="mt-3 text-xs text-emerald-800 leading-snug">
                        Good stability profile for the target shelf life. Still plan to run accelerated (40°C/75% RH) + real-time stability per ICH Q1A to confirm.
                      </p>
                    )}
                    <p className="mt-2 text-[10px] text-gray-500 italic leading-tight">
                      Degradation rates are industry-conservative estimates derived from USP, CRN, and IFOS literature.
                      Real stability data from your own accelerated + long-term program should replace these predictions for production.
                    </p>
                    </>)}
                  </div>
                );
              })()}

              {/* ═══════════════════════════════════════════════════════════
                  INGREDIENT COMPATIBILITY (supplements mode only)
                  Detects formulation-science incompatibilities — pro-oxidant
                  pairs, mineral antagonisms, capsule-shell conflicts,
                  packaging-mismatch issues. Mirrors the safety-card tiering.
                  ═══════════════════════════════════════════════════════════ */}
              {mode === 'supplements' && ingredients.length > 0 && (() => {
                const compatFindings = checkCompatibility(ingredients, {
                  deliveryForm: suppDeliveryForm,
                  capsuleShell: suppDeliveryForm === 'softgel' ? 'gelatin' : suppDeliveryForm === 'capsule' ? 'gelatin' : 'none',
                  hasDesiccant: suppDesiccant,
                  hasNitrogenFlush: suppNitrogen,
                  hasAmberPackaging: suppAmberPkg,
                  storage: suppStorage,
                });
                const compatSummary = summarizeCompatibility(compatFindings);
                if (compatFindings.length === 0) return null;
                const cardColor =
                  compatSummary.critical > 0 ? 'bg-red-50 border-red-400'
                  : compatSummary.warning > 0 ? 'bg-orange-50 border-orange-300'
                  : compatSummary.caution > 0 ? 'bg-amber-50 border-amber-300'
                  : 'bg-sky-50 border-sky-300';
                const compatDefaultExpanded = (compatSummary.critical + compatSummary.warning + compatSummary.caution) > 0;
                const compatManual = suppCardsManuallyToggled['compat'];
                const compatExpanded = compatManual !== undefined ? compatManual : compatDefaultExpanded;
                return (
                  <div id="supp-card-compat" className={`rounded-xl border-2 p-6 ${cardColor}`}>
                    <button
                      type="button"
                      onClick={() => toggleSuppCard('compat', compatExpanded)}
                      className="w-full flex items-center justify-between mb-3 flex-wrap gap-2 text-left"
                    >
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-xs opacity-60">{compatExpanded ? '▼' : '▶'}</span>
                        🧬 Ingredient Compatibility — {compatFindings.length} finding{compatFindings.length !== 1 ? 's' : ''}
                      </h2>
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">USP &lt;1151&gt; · CRN Handbook · formulation science</span>
                    </button>
                    {compatExpanded && (
                    <div className="space-y-2">
                      {compatFindings.map((f, i) => {
                        const rowColor =
                          f.tier === 'critical' ? 'bg-red-100 border border-red-400'
                          : f.tier === 'warning' ? 'bg-orange-100 border border-orange-300'
                          : f.tier === 'caution' ? 'bg-amber-100 border border-amber-300'
                          : 'bg-sky-100 border border-sky-300';
                        const mark: ReactNode = f.tier === 'critical' ? <OctagonX className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                          : f.tier === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                          : f.tier === 'caution' ? <AlertCircle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                          : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />;
                        return (
                          <div key={i} className={`text-xs p-2 rounded ${rowColor}`}>
                            <div className="flex items-start gap-2">
                              <span className="shrink-0 mt-0.5">{mark}</span>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800">{f.title}</div>
                                <div className="text-[11px] text-gray-600 mt-0.5">
                                  {f.ingredients.join(' + ')}
                                </div>
                                <p className="text-[11px] text-gray-700 mt-1 leading-snug">{f.issue}</p>
                                <p className="text-[11px] text-gray-800 mt-1 leading-snug italic">→ {f.remedy}</p>
                                {f.citation && <p className="text-[10px] text-gray-500 mt-0.5 italic">{f.citation}</p>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                );
              })()}

              {/* Suggested HACCP Program / Suggested cGMP Program.
                  Round 8 Item 5: card uses standard confidence vocabulary
                  (INFERRED for template-derived guidance, MEASURED once a
                  PA-approved plan is uploaded — upload-flow lands in Round 9+).
                  Round 11 Phase 3 Workstream A.5 (#25d/e/j): card framing is
                  now mode-aware. F&B retains the HACCP framework framing;
                  supplements use 21 CFR 111 cGMP framing. The framework name
                  displayed in the green band below comes from lib/haccp.ts —
                  supplement-mode entry at lib/haccp.ts:641 yields the
                  "21 CFR 111 cGMP (Dietary Supplement)" framework name. The
                  HACCP mismatch banner is already upstream-gated for
                  supplements (lib/haccp.ts:881 early-return). The Scheduled
                  Process Filing subsection is mode-gated to F&B-only below. */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h2 className="text-lg font-semibold text-gray-800 inline-flex items-center gap-2">
                    <span>🛡️ {mode === 'supplements' ? 'Suggested cGMP Program' : 'Suggested HACCP Program'}</span>
                    <ConfidencePill conf="inferred" />
                  </h2>
                  <span className="text-xs text-gray-400">Auto-classified from product type + specs</span>
                </div>

                {/* ─── SPEC / TAG SAFETY MISMATCH BANNER ─── */}
                {haccpMismatch && (
                  <div className={`mb-4 rounded-lg p-4 border-2 ${
                    haccpMismatch.severity === 'critical'
                      ? 'bg-rose-50 border-rose-400'
                      : 'bg-amber-50 border-amber-400'
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className="shrink-0 mt-0.5">
                        {haccpMismatch.severity === 'critical'
                          ? <OctagonX className="h-5 w-5 text-rose-600" aria-hidden="true" />
                          : <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />}
                      </span>
                      <div className="flex-1 text-sm">
                        <div className={`font-bold ${haccpMismatch.severity === 'critical' ? 'text-rose-800' : 'text-amber-800'}`}>
                          {haccpMismatch.severity === 'critical' ? 'Safety-critical mismatch — HACCP reclassified' : 'Caution — borderline spec'}
                        </div>
                        <div className={`font-semibold mt-1 ${haccpMismatch.severity === 'critical' ? 'text-rose-900' : 'text-amber-900'}`}>
                          {haccpMismatch.title}
                        </div>
                        <p className={`mt-1 leading-relaxed ${haccpMismatch.severity === 'critical' ? 'text-rose-800' : 'text-amber-800'}`}>
                          {haccpMismatch.message}
                        </p>
                        <div className="mt-2 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="bg-white/70 rounded px-2 py-1">
                            <div className="text-[10px] uppercase tracking-wide text-gray-500">Your formula</div>
                            <div className="font-mono font-semibold text-gray-800">{haccpMismatch.actualSpec}</div>
                          </div>
                          <div className="bg-white/70 rounded px-2 py-1">
                            <div className="text-[10px] uppercase tracking-wide text-gray-500">Required for product-type label</div>
                            <div className="font-mono font-semibold text-gray-800">{haccpMismatch.expectedSpec}</div>
                          </div>
                        </div>
                        {haccpMismatch.overrideCategoryId && suggestedHaccp && (
                          <p className="mt-2 text-[11px] italic text-gray-700">
                            HACCP below has been reclassified to <strong>{suggestedHaccp.name}</strong> to match the actual formula profile. Filing requirements and CCPs updated accordingly.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!suggestedHaccp ? (
                  <div className="text-center py-6 text-gray-400 text-sm italic">
                    Select a Product Type and add ingredients — we&apos;ll recommend an appropriate {mode === 'supplements' ? 'cGMP framework' : 'HACCP category'} based on the tags and estimated specs.
                  </div>
                ) : (
                  <>
                    {/* Filing requirement banner — F&B-only.
                        Round 11 Phase 3 Workstream A.5 (#25e): Scheduled
                        Process Filing is 21 CFR 113 / 114 LACF + Acidified
                        Foods workflow; not applicable to dietary supplements
                        (21 CFR 111 cGMP has no equivalent "scheduled process
                        filing" concept). Mode-gated to F&B only. */}
                    {mode !== 'supplements' && (
                    <div className={`p-3 rounded-lg mb-3 border-2 ${
                      filingReq.urgency === 'critical' ? 'bg-red-50 border-red-300' :
                      filingReq.urgency === 'recommended' ? 'bg-amber-50 border-amber-300' :
                      'bg-emerald-50 border-emerald-300'
                    }`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="text-xs uppercase tracking-wide text-gray-600 font-semibold">Scheduled Process Filing</span>
                          <div className={`text-base font-bold inline-flex items-center gap-1.5 ${
                            filingReq.urgency === 'critical' ? 'text-red-800' :
                            filingReq.urgency === 'recommended' ? 'text-amber-800' :
                            'text-emerald-800'
                          }`}>
                            {filingReq.required
                              ? <><AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" /><span>REQUIRED → {filingReq.formName}</span></>
                              : <><CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /><span>{filingReq.formName}</span></>}
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab('filing')}
                          className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                          Open 📋 Filing →
                        </button>
                      </div>
                      <p className="text-xs text-gray-700 mt-1.5">{filingReq.reason}</p>
                    </div>
                    )}

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg mb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="font-bold text-emerald-800">{suggestedHaccp.name}</h3>
                        <span className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold">{suggestedHaccp.framework}</span>
                      </div>
                      <p className="text-xs text-gray-700 mt-1">{suggestedHaccp.description}</p>
                    </div>

                    {/* Hazards summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                        <div className="font-bold text-red-800 mb-1">🧬 Biological</div>
                        <ul className="text-red-900 space-y-0.5 list-disc ml-4">
                          {suggestedHaccp.hazards.biological.slice(0, 3).map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                        <div className="font-bold text-amber-800 mb-1">⚗️ Chemical</div>
                        <ul className="text-amber-900 space-y-0.5 list-disc ml-4">
                          {suggestedHaccp.hazards.chemical.slice(0, 3).map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                      <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                        <div className="font-bold text-gray-800 mb-1">🔩 Physical</div>
                        <ul className="text-gray-800 space-y-0.5 list-disc ml-4">
                          {suggestedHaccp.hazards.physical.slice(0, 3).map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* CCPs (always visible, compact) */}
                    <div className="mb-3">
                      <h4 className="text-sm font-bold text-gray-800 mb-2">Critical Control Points ({suggestedHaccp.ccps.length})</h4>
                      <div className="space-y-2">
                        {suggestedHaccp.ccps.map(ccp => (
                          <div key={ccp.number} className="border border-gray-200 rounded p-2 bg-white text-xs">
                            <div className="flex items-start gap-2">
                              <span className="font-mono font-bold bg-emerald-700 text-white px-2 py-0.5 rounded shrink-0">CCP {ccp.number}</span>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800">{ccp.name}</div>
                                <div className="text-emerald-700 font-medium mt-1">Limit: <span className="font-mono">{ccp.criticalLimit}</span></div>
                                {showFullHaccp && (
                                  <div className="mt-2 space-y-1 text-gray-600">
                                    <div><span className="font-semibold text-gray-700">Monitor:</span> {ccp.monitoring}</div>
                                    <div><span className="font-semibold text-gray-700">Corrective Action:</span> {ccp.correctiveAction}</div>
                                    <div><span className="font-semibold text-gray-700">Verification:</span> {ccp.verification}</div>
                                    <div><span className="font-semibold text-gray-700">Record:</span> {ccp.record}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setShowFullHaccp(!showFullHaccp)}
                      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                    >
                      {showFullHaccp ? '▲ Hide CCP details' : '▼ Show monitoring, corrective actions, verification & records'}
                    </button>

                    {showFullHaccp && (
                      <>
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-bold text-gray-800 mb-1">Prerequisite Programs</h4>
                          <ul className="text-xs text-gray-700 list-disc ml-5 space-y-0.5">
                            {suggestedHaccp.prerequisitePrograms.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                        <div className="mt-3 text-[10px] text-gray-500">
                          <span className="font-semibold">References:</span> {suggestedHaccp.references.join(' • ')}
                        </div>
                      </>
                    )}

                    {/* Round 8 Item 5: vocabulary-unification footer. The card-level
                        INFERRED pill (next to the heading) signals this is
                        template-derived guidance; this footer states the substance
                        — facility-specific qualified-reviewer validation is required
                        to elevate the plan from INFERRED to MEASURED.
                        Round 11 Phase 3 Workstream A.5: mode-aware copy — F&B
                        references PCQI / Process Authority and HACCP plan
                        validation; supplements reference DSHEA-qualified regulatory
                        consultant / 21 CFR 111-trained quality unit and 21 CFR 111
                        cGMP plan validation. */}
                    <p className="text-xs text-gray-400 mt-3 inline-flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                      {mode === 'supplements' ? (
                        <span>This plan is INFERRED from the product type and process template — not yet a facility-specific verified 21 CFR 111 cGMP plan. Every production facility must develop and validate its own cGMP plan with a DSHEA-qualified regulatory consultant or 21 CFR 111-trained quality unit. Critical control points, monitoring frequency, and corrective actions must be validated for your specific product and equipment before this guidance is elevated to MEASURED.</span>
                      ) : (
                        <span>This plan is INFERRED from the product type and process template — not yet a facility-specific verified HACCP plan. Every production facility must develop and validate its own HACCP plan with a qualified PCQI or certified Process Authority. Critical limits, monitoring frequency, and corrective actions must be validated for your specific product and equipment before this guidance is elevated to MEASURED.</span>
                      )}
                    </p>
                  </>
                )}
              </div>
              {/* ──────────────────────────────────────────────────────────
                  SUSTAINABILITY & SOURCING PANEL
                  Auto-inferred from name + category on every ingredient.
                  ────────────────────────────────────────────────────────── */}
              {ingredients.length > 0 && (() => {
                const rows = ingredients.map(ing => {
                  const massG = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
                  const category = ing.foodData?.type === 'industrial'
                    ? (ing.foodData.data as IndustrialIngredient).category
                    : '';
                  return { name: ing.name, category, massG };
                });
                const sust = computeFormulationSustainability(rows);
                const organicCompliance = computeOrganicCompliance(rows);
                const perUnitScale = packageSizeInGrams > 0 && totalBatchGrams > 0
                  ? packageSizeInGrams / totalBatchGrams
                  : 0;
                const carbonPerUnit = sust.avgCarbonKgCo2ePerUnit * (totalBatchGrams / 1000) * perUnitScale;
                const waterPerUnit = sust.avgWaterLitersPerUnit * (totalBatchGrams / 1000) * perUnitScale;

                // Color band for headline score
                const scoreColor = sust.score >= 75 ? 'emerald' : sust.score >= 55 ? 'amber' : sust.score >= 35 ? 'orange' : 'rose';

                // Per-ingredient sustainability profile (for the details table)
                const perIng = rows.map(r => ({ ...r, profile: getSustainabilityProfile(r) }));

                return (
                  <div className="bg-white rounded-xl border border-emerald-200 p-6">
                    <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                      <h2 className="text-lg font-semibold text-gray-800">🌱 Sustainability & Sourcing</h2>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">Organic / Non-GMO / Footprint</span>
                    </div>

                    {/* ───── Headline score ─────
                        Round 8 Item 4 (Level 2 — per-tile pill, formulation-level
                        rollup math deferred): Sustainability Score is a weighted
                        composite (organic coverage + non-GMO + carbon + sector
                        certs + supplier-diversity placeholder) — does not decompose
                        cleanly by mass, so we pill it INFERRED at the formulation
                        level. Round 9+ ticket: design rollup logic that does
                        decompose (e.g., per-ingredient confidence floor on each
                        component score, then a CALCULATED rollup if all inputs
                        are MEASURED). */}
                    <div className={`rounded-xl p-4 mb-4 border-2 bg-${scoreColor}-50 border-${scoreColor}-300`}>
                      <div className="flex items-baseline justify-between flex-wrap gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-gray-600 inline-flex items-center gap-1.5">
                            <span>Formula Sustainability Score</span>
                            <ConfidencePill conf="inferred" size="xs" />
                          </div>
                          <div className={`text-5xl font-bold text-${scoreColor}-700 leading-none`}>{sust.score}<span className="text-xl text-gray-500">/100</span></div>
                        </div>
                        <div className="text-right text-xs text-gray-600 space-y-1">
                          <div><span className="font-semibold text-gray-800">{sust.organicCoveragePct.toFixed(0)}%</span> organic-available mass</div>
                          <div><span className="font-semibold text-gray-800">{sust.nonGmoCoveragePct.toFixed(0)}%</span> inherently non-GMO</div>
                        </div>
                      </div>
                    </div>

                    {/* ───── Footprint tiles ─────
                        Round 8 Item 4 (Level 2): Carbon and Water values are
                        mass-weighted averages of per-ingredient values that are
                        themselves regex-pattern category lookups against published
                        LCA (Poore & Nemecek 2018 carbon, Mekonnen & Hoekstra
                        water). Per-ingredient confidence is INFERRED (category
                        match), so the formulation rollup is INFERRED-floored.
                        Round 9+ ticket: per-ingredient confidence override when
                        a supplier-attested LCA is uploaded (would elevate to
                        MEASURED). */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-[10px] uppercase tracking-wide text-gray-500 inline-flex items-center gap-1.5">
                          <span>Carbon / unit</span>
                          <ConfidencePill conf="inferred" size="xs" />
                        </div>
                        <div className="text-xl font-bold text-gray-800 mt-1">
                          {carbonPerUnit < 1 ? `${(carbonPerUnit * 1000).toFixed(0)}g` : `${carbonPerUnit.toFixed(2)}kg`}
                        </div>
                        <div className="text-[10px] text-gray-400">CO₂e</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-[10px] uppercase tracking-wide text-gray-500 inline-flex items-center gap-1.5">
                          <span>Water / unit</span>
                          <ConfidencePill conf="inferred" size="xs" />
                        </div>
                        <div className="text-xl font-bold text-gray-800 mt-1">
                          {waterPerUnit < 1 ? `${(waterPerUnit * 1000).toFixed(0)}mL` : `${waterPerUnit.toFixed(1)}L`}
                        </div>
                        <div className="text-[10px] text-gray-400">blue+green</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-[10px] uppercase tracking-wide text-gray-500">GMO-risk items</div>
                        <div className="text-xl font-bold text-gray-800 mt-1">{sust.highGmoRiskIngredients.length}</div>
                        <div className="text-[10px] text-gray-400">
                          {sust.highGmoRiskIngredients.length === 0 ? 'clean' : 'need non-GMO variant'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-[10px] uppercase tracking-wide text-gray-500">Sector flags</div>
                        <div className="text-xl font-bold text-gray-800 mt-1">
                          {[sust.palmOilPresent && '🌴', sust.seafoodPresent && '🐟', sust.cocoaPresent && '🍫'].filter(Boolean).join(' ') || '—'}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {(sust.palmOilPresent || sust.seafoodPresent || sust.cocoaPresent) ? 'cert needed' : 'none flagged'}
                        </div>
                      </div>
                    </div>

                    {/* ───── NOP Organic Claim Validator ───── */}
                    {(() => {
                      const tier = organicCompliance.claimTier;
                      const tierColor =
                        tier === '100-percent-organic' ? 'emerald' :
                        tier === 'organic' ? 'emerald' :
                        tier === 'made-with-organic' ? 'amber' :
                        'gray';
                      const icon =
                        tier === '100-percent-organic' ? '💯' :
                        tier === 'organic' ? '🌱' :
                        tier === 'made-with-organic' ? '🌿' :
                        '🚫';
                      return (
                        <div className={`mb-4 rounded-lg p-3 border-2 bg-${tierColor}-50 border-${tierColor}-300`}>
                          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{icon}</span>
                              <div>
                                <div className="text-[10px] uppercase tracking-wide text-gray-600">USDA NOP Organic Claim</div>
                                <div className={`text-base font-bold text-${tierColor}-700`}>{organicCompliance.claimLabel}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              {/* Round 8 Item 4 (Level 2): the % itself is a
                                  CALCULATED mass-weighted total, but the
                                  per-ingredient organic flag is INFERRED via
                                  name-substring detection (`/\borganic\b/i`)
                                  rather than a per-batch certification check.
                                  Until Companion Spec §B (org-cert upload) lands,
                                  surface as INFERRED — the value depends on a
                                  detection that may misclassify (e.g., an
                                  "organic flavor" SKU that isn't actually
                                  USDA-certified). Round 9+ ticket: pull
                                  per-batch cert into the calculation, render
                                  CALCULATED once organic flags are MEASURED. */}
                              <div className="text-[10px] uppercase tracking-wide text-gray-500 inline-flex items-center gap-1.5 justify-end">
                                <span>Organic % of eligible mass</span>
                                <ConfidencePill conf="inferred" size="xs" />
                              </div>
                              <div className={`text-2xl font-bold font-mono text-${tierColor}-700`}>
                                {organicCompliance.percentOrganic.toFixed(1)}%
                              </div>
                              <div className="text-[10px] text-gray-500">
                                ({(organicCompliance.organicMassG / 1000).toFixed(3)} kg organic / {(organicCompliance.eligibleMassG / 1000).toFixed(3)} kg eligible)
                              </div>
                            </div>
                          </div>
                          {organicCompliance.thresholdGap > 0 && tier !== 'specific-organic' && (
                            <div className="text-xs text-gray-700 border-t border-gray-300 pt-2 mt-1">
                              <span className="font-semibold">Gap to next tier: </span>
                              <span className="font-mono">+{organicCompliance.thresholdGap.toFixed(1)} pp</span>
                              <span className="text-gray-500"> to reach {tier === 'organic' ? '100% Organic' : tier === 'made-with-organic' ? 'Organic' : 'Made with Organic'}.</span>
                            </div>
                          )}
                          <details className="text-[10px] text-gray-600 mt-2">
                            <summary className="cursor-pointer font-semibold hover:text-gray-800">📋 NOP compliance details ({organicCompliance.notes.length} notes)</summary>
                            <ul className="mt-1 space-y-0.5 pl-3">
                              {organicCompliance.notes.map((n, i) => (
                                <li key={i}>• {n}</li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      );
                    })()}

                    {/* ───── Recommendations ───── */}
                    {sust.recommendations.length > 0 && (
                      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">💡 Recommendations</div>
                        <ul className="space-y-1">
                          {sust.recommendations.map((r, i) => (
                            <li key={i} className="text-xs text-amber-900 leading-relaxed">• {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ───── Organic Conversion Quick Actions ───── */}
                    {(() => {
                      // Preview cost of each upgrade tier
                      const currentTier = organicCompliance.claimTier;
                      const targets: { tier: OrganicClaimTier; label: string; icon: string; nopSection: string }[] = [
                        { tier: 'made-with-organic', label: 'Made with Organic (70%+)', icon: '🌿', nopSection: '§ 205.304' },
                        { tier: 'organic', label: 'Organic (95%+)', icon: '🌱', nopSection: '§ 205.301(b)' },
                        { tier: '100-percent-organic', label: '100% Organic', icon: '💯', nopSection: '§ 205.301(a)' },
                      ];
                      const tierRank: Record<OrganicClaimTier, number> = {
                        'specific-organic': 0,
                        'made-with-organic': 1,
                        'organic': 2,
                        '100-percent-organic': 3,
                      };
                      const availableTargets = targets.filter(t => tierRank[t.tier] > tierRank[currentTier]);
                      if (availableTargets.length === 0) return null;

                      // Preview each target's cost delta (dry-run, no state update)
                      const previews = availableTargets.map(target => {
                        const preview = upgradeToOrganicTier(ingredients, INDUSTRIAL_DB, target.tier);
                        return { ...target, preview };
                      });

                      const handleUpgrade = (target: OrganicClaimTier) => {
                        const result = upgradeToOrganicTier(ingredients, INDUSTRIAL_DB, target);
                        const targetLabel = targets.find(t => t.tier === target)?.label || target;
                        if (!result.targetReached) {
                          alert(`Could not reach "${targetLabel}" with organic-available ingredients only. Converted ${result.conversions.length} ingredient${result.conversions.length !== 1 ? 's' : ''}, reached "${result.reachedTier}" tier. Some ingredients in your formula don't have organic variants (e.g., curing salts, phosphates, synthetic preservatives).`);
                        }
                        const summary = result.conversions.map(c => `  ${c.originalName} → ${c.ingredient.name}`).join('\n');
                        const deltaStr = result.costDeltaTotal >= 0 ? `+$${result.costDeltaTotal.toFixed(2)}` : `−$${Math.abs(result.costDeltaTotal).toFixed(2)}`;
                        const confirmed = window.confirm(
                          `Convert ${result.conversions.length} ingredient${result.conversions.length !== 1 ? 's' : ''} to organic?\n\n${summary}\n\nBatch cost change: ${deltaStr}\nFinal tier: ${result.reachedTier}`,
                        );
                        if (confirmed) {
                          setIngredients(result.upgradedIngredients);
                          recalculate(result.upgradedIngredients);
                        }
                      };

                      return (
                        <div className="mb-4 bg-brand-50 border border-brand-200 rounded-lg p-3" style={{ background: 'var(--color-brand-50)', borderColor: 'var(--color-brand-200)' }}>
                          <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
                            <div className="text-xs font-bold text-gray-800 uppercase tracking-wide">🌱 Convert to Organic — one-click upgrade</div>
                            <div className="text-[10px] text-gray-500">USDA NOP 21 CFR 205 thresholds</div>
                          </div>
                          <p className="text-[10px] text-gray-600 mb-3 leading-relaxed">
                            Converts eligible ingredients to their organic variants (matches existing DB SKU if available, otherwise applies category premium). Ingredients without organic variants (e.g., curing salts, synthetic preservatives) are skipped. You&apos;ll be asked to confirm before changes apply.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {previews.map(({ tier, label, icon, nopSection, preview }) => {
                              const willSucceed = preview.targetReached;
                              const delta = preview.costDeltaTotal;
                              const deltaColor = delta > 0 ? 'text-rose-600' : delta < 0 ? 'text-emerald-700' : 'text-gray-600';
                              const deltaStr = delta >= 0 ? `+$${delta.toFixed(2)}` : `−$${Math.abs(delta).toFixed(2)}`;
                              return (
                                <button
                                  key={tier}
                                  onClick={() => handleUpgrade(tier)}
                                  className={`text-left p-3 rounded-lg border-2 transition hover:shadow-md ${willSucceed ? 'bg-white border-emerald-300 hover:border-emerald-500' : 'bg-gray-50 border-gray-300 hover:border-amber-400 cursor-pointer'}`}
                                >
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-lg">{icon}</span>
                                    <span className="text-xs font-bold text-gray-800">{label}</span>
                                  </div>
                                  <div className="text-[10px] text-gray-500 mb-2">{nopSection}</div>
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-gray-600">
                                      {preview.conversions.length} swap{preview.conversions.length !== 1 ? 's' : ''}
                                    </span>
                                    <span className={`font-mono font-semibold ${deltaColor}`}>{deltaStr}/batch</span>
                                  </div>
                                  {!willSucceed && (
                                    <div className="text-[9px] text-amber-700 mt-1 italic">
                                      Max reach: {preview.reachedTier.replace(/-/g, ' ')}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ───── Bulk Revert All to Conventional ───── */}
                    {(() => {
                      const currentlyOrganicCount = ingredients.filter(i => /\borganic\b/i.test(i.name)).length;
                      if (currentlyOrganicCount === 0) return null;
                      const preview = revertAllToConventional(ingredients, INDUSTRIAL_DB);
                      const delta = preview.costDeltaTotal;
                      const deltaStr = delta >= 0 ? `+$${delta.toFixed(2)}` : `−$${Math.abs(delta).toFixed(2)}`;
                      return (
                        <div className="mb-4 bg-gray-50 border border-gray-300 rounded-lg p-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">↩ Revert to Conventional</div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {currentlyOrganicCount} ingredient{currentlyOrganicCount !== 1 ? 's' : ''} currently organic — revert all in one click.
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const summary = preview.conversions.map(c => `  ${c.originalName} → ${c.ingredient.name}`).join('\n');
                                if (window.confirm(
                                  `Revert ${preview.conversions.length} ingredient${preview.conversions.length !== 1 ? 's' : ''} to conventional?\n\n${summary}\n\nBatch cost change: ${deltaStr}`,
                                )) {
                                  setIngredients(preview.revertedIngredients);
                                  recalculate(preview.revertedIngredients);
                                }
                              }}
                              className="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded text-xs font-medium hover:bg-gray-100 hover:border-gray-400 transition flex items-center gap-2"
                            >
                              <span>↩ Revert all</span>
                              <span className={`font-mono ${delta < 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{deltaStr}/batch</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ───── Per-ingredient table (expandable) ───── */}
                    <details className="text-xs">
                      <summary className="cursor-pointer font-semibold text-gray-700 hover:text-emerald-700 py-1">
                        📋 Per-ingredient sustainability profile ({perIng.length} rows)
                      </summary>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-400 text-left text-[10px] uppercase tracking-wide text-gray-500">
                              <th className="py-1">Ingredient</th>
                              <th className="py-1 text-center">GMO risk</th>
                              <th className="py-1 text-center">Organic?</th>
                              <th className="py-1 text-center">Non-GMO?</th>
                              {/* Round 8 Item 4: per-ingredient pill on the carbon column
                                  header — the carbon value is from the regex-pattern category
                                  lookup in lib/sustainability.ts → INFERRED. Header-level
                                  pill avoids per-row visual clutter while still
                                  communicating confidence at the column level. */}
                              <th className="py-1 text-right">
                                <span className="inline-flex items-center gap-1 justify-end">
                                  <span>kg CO₂e/kg</span>
                                  <ConfidencePill conf="inferred" size="xs" />
                                </span>
                              </th>
                              <th className="py-1">Certs available</th>
                            </tr>
                          </thead>
                          <tbody>
                            {perIng.map((r, i) => {
                              const p = r.profile;
                              const gmoColor =
                                p.gmoRisk === 'high' ? 'bg-rose-100 text-rose-700' :
                                p.gmoRisk === 'medium' ? 'bg-amber-100 text-amber-700' :
                                p.gmoRisk === 'low' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-gray-100 text-gray-600';
                              return (
                                <tr key={i} className="border-b border-gray-100">
                                  <td className="py-1 text-gray-800">{r.name}</td>
                                  <td className="py-1 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${gmoColor}`}>
                                      {p.gmoRisk}
                                    </span>
                                  </td>
                                  <td className="py-1 text-center">
                                    {p.organicAvailable ? (
                                      <span className="text-emerald-600 font-semibold" title={`+${Math.round((p.organicPricePremium - 1) * 100)}% premium`}>
                                        ✓ +{Math.round((p.organicPricePremium - 1) * 100)}%
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="py-1 text-center">
                                    {p.nonGmoAvailable && p.nonGmoPricePremium > 1.0 ? (
                                      <span className="text-sky-600 font-semibold">✓ +{Math.round((p.nonGmoPricePremium - 1) * 100)}%</span>
                                    ) : p.gmoRisk === 'low' || p.gmoRisk === 'none' ? (
                                      <span className="text-emerald-600 font-semibold" title="Inherently non-GMO">✓ inherent</span>
                                    ) : (
                                      <span className="text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="py-1 text-right font-mono text-gray-700">{p.carbonKgCo2ePerKg.toFixed(1)}</td>
                                  <td className="py-1 text-[10px] text-gray-600">
                                    {p.suggestedCerts.length > 0
                                      ? p.suggestedCerts.slice(0, 3).map(c => CERT_LABELS[c] || c).join(', ')
                                      : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </details>

                    <p className="text-[10px] text-gray-400 mt-3 italic">
                      Estimates from published LCA literature (Poore & Nemecek 2018, Mekonnen & Hoekstra water footprint). Not audit-grade — verify with supplier COAs for regulatory or retailer submissions.
                    </p>
                  </div>
                );
              })()}

              {/* ═══════════════════════════════════════════════════════════
                  RETAIL CHANNEL FIT (supplements mode only)
                  Scan formulation against each retailer's unacceptable-
                  ingredient list and score readiness for that channel.
                  ═══════════════════════════════════════════════════════════ */}
              {mode === 'supplements' && ingredients.length > 0 && (() => {
                const reports = analyzeRetailFit(ingredients.map(i => i.name));
                const hasAnyConcerns = reports.some(r => r.status !== 'ready');
                const retailDefaultExpanded = reports.some(r => r.status === 'blocked');
                const retailManual = suppCardsManuallyToggled['retail'];
                const retailExpanded = retailManual !== undefined ? retailManual : retailDefaultExpanded;
                return (
                  <div id="supp-card-retail" className="bg-white rounded-xl border border-gray-200 p-6">
                    <button
                      type="button"
                      onClick={() => toggleSuppCard('retail', retailExpanded)}
                      className="w-full flex items-center justify-between mb-4 flex-wrap gap-2 text-left"
                    >
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-xs opacity-60">{retailExpanded ? '▼' : '▶'}</span>
                        🛒 Retail Channel Fit
                      </h2>
                      <span className="text-[10px] uppercase tracking-wide text-gray-500">retailer standards · Prop 65</span>
                    </button>
                    {retailExpanded && (<>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {reports.map((r, i) => {
                        const badge = r.status === 'ready' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : r.status === 'caution' ? 'bg-amber-100 text-amber-700 border-amber-300'
                          : 'bg-red-100 text-red-700 border-red-300';
                        const barColor = r.score >= 90 ? 'bg-emerald-500' : r.score >= 70 ? 'bg-amber-500' : 'bg-red-500';
                        return (
                          <div key={i} className="border border-gray-200 rounded-lg p-3 flex flex-col">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-gray-800">{r.retailer.name}</div>
                                <div className="text-[11px] text-gray-500 leading-tight">{r.retailer.blurb}</div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 border rounded ${badge} uppercase inline-flex items-center gap-1`}>
                                {r.status === 'ready'
                                  ? <><CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" /><span>Ready</span></>
                                  : r.status === 'caution'
                                    ? <><AlertCircle className="h-3 w-3 text-amber-500" aria-hidden="true" /><span>Caution</span></>
                                    : <><XIcon className="h-3 w-3 text-rose-600" aria-hidden="true" /><span>Blocked</span></>}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 my-1">
                              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className={`h-full ${barColor}`} style={{ width: `${r.score}%` }} />
                              </div>
                              <span className="text-xs font-mono font-bold text-gray-700 w-10 text-right">{r.score}%</span>
                            </div>
                            {r.disqualifyingIngredients.length > 0 && (
                              <div className="text-[11px] text-red-700 mt-1 leading-tight">
                                <span className="font-semibold">Disqualifies: </span>
                                {r.disqualifyingIngredients.join(', ')}
                              </div>
                            )}
                            {r.cautionIngredients.length > 0 && (
                              <div className="text-[11px] text-amber-700 mt-1 leading-tight">
                                <span className="font-semibold">Watch: </span>
                                {r.cautionIngredients.join(', ')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {!hasAnyConcerns && (
                      <p className="text-xs text-emerald-700 mt-3 inline-flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                        <span>Formula is ready for every channel checked. Still verify current retailer standards before listing submission.</span>
                      </p>
                    )}
                    </>)}
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          COST TOOL TAB
          Phase 1: Per-ingredient supplier-quote math, packaging roll-up,
                   freight model (FOB vs delivered), MOQ flag.
          Phase 2: Margin calculator — target SRP / wholesale / margin with
                   distance-to-target gauge.
          Phase 3: Commodity-spike sensitivity (single global %).
          Phase 4: Lower-cost substitution suggestions from same category.
          ══════════════════════════════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════════════════════════════
          PACKAGING DATA SHEET MODAL (on-demand — open via button)
          Auto-assembles container + closure + auxiliary items into a
          supplier-facing, print-ready specification document. Mirrors the
          raw-material spec sheet in structure and print CSS.
          ══════════════════════════════════════════════════════════════════ */}
      {showPackagingSheet && (() => {
        const today = new Date().toISOString().slice(0, 10);
        const container = selectedPackaging;
        const closure = selectedClosure;
        const containerProf = container ? getPackagingSustainability(container) : null;
        const closureProf = closure ? getPackagingSustainability(closure) : null;
        const totalCost = (container?.costPerUnit || 0) + (closure?.costPerUnit || 0);
        const hasContent = container || closure;
        const neckMatch = container && closure ? isClosureCompatible(container, closure) : null;
        // Resolve a PackagingItem to its part number — custom items store it inline
        // in the notes field (FWP-CUS-XXXX); stock items are hashed deterministically.
        const partNumberOf = (p: PackagingItem): string => {
          const m = p.notes?.match(/Part #: (FWP-[A-Z0-9-]+)/);
          if (m) return m[1];
          return getPackagingPartNumber(p.name, p.category);
        };

        return (
          <div
            className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-auto print:bg-transparent print:p-0 print:static print:overflow-visible"
            onClick={() => setShowPackagingSheet(false)}
          >
            <div
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl print:max-h-none print:shadow-none print:rounded-none print:overflow-visible"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header (hidden on print) */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 print:hidden bg-gray-50">
                <h2 className="text-lg font-bold text-gray-800">📄 Packaging Data Sheet</h2>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="px-3 py-1.5 bg-sky-600 text-white rounded text-xs hover:bg-sky-700">🖨 Print / PDF</button>
                  <button onClick={() => setShowPackagingSheet(false)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">Close</button>
                </div>
              </div>

              {/* Printable content */}
              <div className="p-8 print:p-4">
                {/* Letterhead */}
                <div className="border-b-2 border-gray-800 pb-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-semibold text-emerald-700 tracking-tight leading-none">
                        formulation<span className="text-gray-500 font-light tracking-[0.3em] ml-2 text-lg uppercase">wizard</span>
                      </h1>
                      <p className="text-xs text-gray-500 mt-1.5 italic">Packaging Specification Sheet — Supplier & Plant-Facing Document</p>
                    </div>
                    <div className="text-right text-xs">
                      <div><span className="text-gray-500">Issued:</span> <span className="font-bold">{today}</span></div>
                      <div><span className="text-gray-500">Formulation:</span> <span className="font-bold">{formulationName || 'Untitled'}</span></div>
                      {partNumber && <div><span className="text-gray-500">Part #:</span> <span className="font-bold font-mono">{partNumber}</span></div>}
                      <div><span className="text-gray-500">Mode:</span> <span className="font-bold">{mc.name}</span></div>
                    </div>
                  </div>
                </div>

                {!hasContent && (
                  <p className="text-center text-sm text-gray-500 italic py-8">
                    No packaging selected. Choose a container and/or closure on the Build tab to generate the data sheet.
                  </p>
                )}

                {/* ═══════ CONTAINER SECTION ═══════ */}
                {container && (
                  <section className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">1. Primary Container</h2>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr><td className="py-1 font-semibold text-gray-700 w-48">Part Number</td><td className="py-1 font-mono font-bold text-emerald-700">{partNumberOf(container)}</td></tr>
                        <tr><td className="py-1 font-semibold text-gray-700">Name</td><td className="py-1 text-gray-900">{container.name}</td></tr>
                        <tr><td className="py-1 font-semibold text-gray-700">Category</td><td className="py-1">{container.category}</td></tr>
                        <tr><td className="py-1 font-semibold text-gray-700">Material</td><td className="py-1">{container.material}</td></tr>
                        {container.capacity && container.capacity.value > 0 && (
                          <tr><td className="py-1 font-semibold text-gray-700">Capacity</td><td className="py-1 font-mono">{container.capacity.value} {container.capacity.unit}</td></tr>
                        )}
                        {container.neckFinish && (
                          <tr><td className="py-1 font-semibold text-gray-700">Neck / Finish</td><td className="py-1 font-mono">{container.neckFinish}</td></tr>
                        )}
                        {container.color && <tr><td className="py-1 font-semibold text-gray-700">Color</td><td className="py-1">{container.color}</td></tr>}
                        {container.minimumOrder && <tr><td className="py-1 font-semibold text-gray-700">MOQ</td><td className="py-1">{container.minimumOrder}</td></tr>}
                        <tr><td className="py-1 font-semibold text-gray-700">Cost per Unit</td><td className="py-1 font-mono font-bold text-emerald-700">${container.costPerUnit.toFixed(3)}</td></tr>
                        {container.application && container.application.length > 0 && (
                          <tr><td className="py-1 font-semibold text-gray-700">Application</td><td className="py-1">{container.application.join(' • ')}</td></tr>
                        )}
                      </tbody>
                    </table>
                    {container.suppliers.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Approved Suppliers</div>
                        <ul className="text-xs text-gray-700 list-disc ml-5">
                          {container.suppliers.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {container.notes && (
                      <p className="mt-2 text-xs text-gray-600 italic">{container.notes}</p>
                    )}
                  </section>
                )}

                {/* ═══════ CLOSURE SECTION ═══════ */}
                {closure && (
                  <section className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">2. Closure / Dispenser</h2>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr><td className="py-1 font-semibold text-gray-700 w-48">Part Number</td><td className="py-1 font-mono font-bold text-emerald-700">{partNumberOf(closure)}</td></tr>
                        <tr><td className="py-1 font-semibold text-gray-700">Name</td><td className="py-1 text-gray-900">{closure.name}</td></tr>
                        <tr><td className="py-1 font-semibold text-gray-700">Category</td><td className="py-1">{closure.category}</td></tr>
                        <tr><td className="py-1 font-semibold text-gray-700">Material</td><td className="py-1">{closure.material}</td></tr>
                        {closure.neckFinish && (
                          <tr><td className="py-1 font-semibold text-gray-700">Fits Neck</td><td className="py-1 font-mono">{closure.neckFinish}</td></tr>
                        )}
                        {closure.minimumOrder && <tr><td className="py-1 font-semibold text-gray-700">MOQ</td><td className="py-1">{closure.minimumOrder}</td></tr>}
                        <tr><td className="py-1 font-semibold text-gray-700">Cost per Unit</td><td className="py-1 font-mono font-bold text-emerald-700">${closure.costPerUnit.toFixed(3)}</td></tr>
                      </tbody>
                    </table>
                    {closure.suppliers.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Approved Suppliers</div>
                        <ul className="text-xs text-gray-700 list-disc ml-5">
                          {closure.suppliers.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {closure.notes && (
                      <p className="mt-2 text-xs text-gray-600 italic">{closure.notes}</p>
                    )}
                  </section>
                )}

                {/* ═══════ COMPATIBILITY VERIFICATION ═══════ */}
                {container && closure && (
                  <section className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">3. Compatibility Verification</h2>
                    <div className={`text-sm p-3 rounded border ${neckMatch ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'}`}>
                      <div className="font-semibold mb-1 inline-flex items-center gap-1.5">
                        {neckMatch
                          ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /><span>Neck Match Verified</span></>
                          : <><AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" /><span>Neck Mismatch — Will Not Seal</span></>}
                      </div>
                      <div className="text-xs">
                        Container neck: <span className="font-mono">{extractNeckCode(container.neckFinish) || container.neckFinish || 'unspecified'}</span>
                        {' · '}
                        Closure finish: <span className="font-mono">{extractNeckCode(closure.neckFinish) || closure.neckFinish || 'unspecified'}</span>
                      </div>
                      {!neckMatch && (
                        <div className="text-xs mt-1 italic">
                          This combination will not mechanically seal. Do not proceed to production — select a compatible closure or reissue this sheet with corrected packaging.
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* ═══════ SUSTAINABILITY PROFILE ═══════ */}
                {(containerProf || closureProf) && (
                  <section className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">4. Sustainability Profile</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {containerProf && (
                        <div className="border border-gray-200 rounded p-3">
                          <div className="font-semibold text-gray-700 mb-1">Container</div>
                          <div className="text-xs space-y-0.5">
                            <div>Score: <span className="font-bold">{containerProf.score}/100</span> ({containerProf.rating})</div>
                            <div>Recyclability: <span className="font-medium">{containerProf.recyclability}</span></div>
                            {containerProf.pcrContentPct !== undefined && <div>PCR Content: <span className="font-mono">{containerProf.pcrContentPct}%</span></div>}
                            {containerProf.materialCarbonKgCo2e !== undefined && <div>CO₂e: <span className="font-mono">{containerProf.materialCarbonKgCo2e.toFixed(3)} kg/unit</span></div>}
                          </div>
                        </div>
                      )}
                      {closureProf && (
                        <div className="border border-gray-200 rounded p-3">
                          <div className="font-semibold text-gray-700 mb-1">Closure</div>
                          <div className="text-xs space-y-0.5">
                            <div>Score: <span className="font-bold">{closureProf.score}/100</span> ({closureProf.rating})</div>
                            <div>Recyclability: <span className="font-medium">{closureProf.recyclability}</span></div>
                            {closureProf.pcrContentPct !== undefined && <div>PCR Content: <span className="font-mono">{closureProf.pcrContentPct}%</span></div>}
                            {closureProf.materialCarbonKgCo2e !== undefined && <div>CO₂e: <span className="font-mono">{closureProf.materialCarbonKgCo2e.toFixed(3)} kg/unit</span></div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* ═══════ REGULATORY NOTES ═══════ */}
                <section className="mb-6">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">5. Regulatory & Compliance Notes</h2>
                  <ul className="text-xs text-gray-700 space-y-1 ml-5 list-disc">
                    {mode === 'supplements' && closure && /crc|child.resistant/i.test(closure.name + closure.notes) && (
                      <li>Closure is child-resistant per ASTM D3475 / 16 CFR 1700.20 — required for oral dietary supplements containing iron or any ingredient requiring CR packaging.</li>
                    )}
                    {mode === 'supplements' && container && /amber|opaque/i.test(container.color || '') && (
                      <li>Amber / opaque container appropriate for light-sensitive actives (Vitamin A, D, B12, riboflavin, folate, fish oil).</li>
                    )}
                    {container && /\bhdpe\b|\bpet\b|\bpp\b|\bglass\b/i.test(container.material) && (
                      <li>Food-contact material compliant with 21 CFR 174-178 (FCN / indirect food additive regulations).</li>
                    )}
                    {mode === 'sausage' && container && /casing/i.test(container.category) && (
                      <li>Casing material compliant with 9 CFR 318.4 (USDA-FSIS approved for meat products).</li>
                    )}
                    <li>All materials must have Letter of Guarantee / food-contact statement on file from supplier prior to receipt.</li>
                    <li>Incoming packaging inspected per QA SOP — integrity, dimensions, finish continuity, cleanliness.</li>
                    {mode === 'supplements' && (
                      <li>Induction seal (when specified) serves as tamper-evident feature per 21 CFR 111 requirements.</li>
                    )}
                  </ul>
                </section>

                {/* ═══════ COST ROLLUP ═══════ */}
                {/* ═══════ CASE PACK & PALLET CONFIGURATION ═══════ */}
                {(container?.casePack || closure?.casePack) && (
                  <section className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">6. Case Pack & Pallet Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(container?.casePack ? [{ label: 'Container', item: container }] : []).concat(
                        closure?.casePack ? [{ label: 'Closure', item: closure }] : []
                      ).map(({ label, item }, i) => {
                        const cp = item.casePack!;
                        const casesPerPallet = (cp.casesPerLayer ?? 0) * (cp.layersPerPallet ?? 0) || undefined;
                        const unitsPerPallet = casesPerPallet ? casesPerPallet * cp.unitsPerCase : undefined;
                        return (
                          <div key={i} className="border border-gray-200 rounded p-3">
                            <div className="font-semibold text-gray-700 mb-2 text-sm">{label}: {item.name}</div>
                            <table className="w-full text-xs">
                              <tbody>
                                {cp.caseType && <tr><td className="py-0.5 text-gray-500 w-32">Case Type</td><td className="py-0.5">{cp.caseType}</td></tr>}
                                <tr><td className="py-0.5 text-gray-500">Units / Case</td><td className="py-0.5 font-mono font-bold">{cp.unitsPerCase}</td></tr>
                                {cp.caseDimensions && (
                                  <tr><td className="py-0.5 text-gray-500">Case Dimensions</td><td className="py-0.5 font-mono">{cp.caseDimensions.length} × {cp.caseDimensions.width} × {cp.caseDimensions.height} {cp.caseDimensions.unit}</td></tr>
                                )}
                                {cp.caseWeight && (
                                  <tr><td className="py-0.5 text-gray-500">Case Weight</td><td className="py-0.5 font-mono">{cp.caseWeight.value} {cp.caseWeight.unit}</td></tr>
                                )}
                                {cp.palletType && <tr><td className="py-0.5 text-gray-500">Pallet Type</td><td className="py-0.5">{cp.palletType}</td></tr>}
                                {cp.casesPerLayer !== undefined && <tr><td className="py-0.5 text-gray-500">Cases / Layer</td><td className="py-0.5 font-mono">{cp.casesPerLayer}</td></tr>}
                                {cp.layersPerPallet !== undefined && <tr><td className="py-0.5 text-gray-500">Layers / Pallet</td><td className="py-0.5 font-mono">{cp.layersPerPallet}</td></tr>}
                                {cp.tiHi && <tr><td className="py-0.5 text-gray-500">Ti-Hi</td><td className="py-0.5 font-mono font-bold">{cp.tiHi}</td></tr>}
                                {casesPerPallet && <tr className="border-t border-gray-200"><td className="pt-1 text-gray-700 font-semibold">Cases / Pallet</td><td className="pt-1 font-mono font-bold text-emerald-700">{casesPerPallet}</td></tr>}
                                {unitsPerPallet && <tr><td className="py-0.5 text-gray-700 font-semibold">Units / Pallet</td><td className="py-0.5 font-mono font-bold text-emerald-700">{unitsPerPallet.toLocaleString()}</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-500 italic mt-2 leading-tight">
                      Pallet quantities assume full-height GMA stacking. Truckload capacity: ~26 pallets per 53&apos; trailer (floor-loaded),
                      ~28 pallets if double-stacked. LTL shipments priced per pallet or per linear foot — confirm with carrier.
                    </p>
                  </section>
                )}

                {hasContent && (
                  <section className="mb-6">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">7. Cost Roll-up</h2>
                    <table className="w-full text-sm">
                      <tbody>
                        {container && (
                          <tr><td className="py-1 text-gray-700">Container</td><td className="py-1 text-right font-mono">${container.costPerUnit.toFixed(3)}</td></tr>
                        )}
                        {closure && (
                          <tr><td className="py-1 text-gray-700">Closure</td><td className="py-1 text-right font-mono">${closure.costPerUnit.toFixed(3)}</td></tr>
                        )}
                        <tr className="border-t border-gray-300"><td className="py-2 font-bold">Total Packaging / Unit</td><td className="py-2 text-right font-mono font-bold text-emerald-700">${totalCost.toFixed(3)}</td></tr>
                      </tbody>
                    </table>
                  </section>
                )}

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-300 text-[10px] text-gray-500 italic leading-relaxed">
                  Generated by Formulation Wizard on {today}. This specification is for planning purposes. Final packaging acceptance
                  requires supplier Letter of Guarantee, food-contact compliance documentation, and incoming QA inspection.
                  Neck-finish compatibility has been verified programmatically but a sample fit test is recommended before first production run.
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════
          RAW MATERIAL SPEC SHEET MODAL (global — available from any tab)
          ══════════════════════════════════════════════════════════════════ */}
      {specSheetIngredientIndex !== null && ingredients[specSheetIngredientIndex] && (() => {
        const ing = ingredients[specSheetIngredientIndex];
        const isIndustrial = ing.foodData?.type === 'industrial';
        const dbData = isIndustrial && ing.foodData ? (ing.foodData.data as IndustrialIngredient) : null;
        // Per-ingredient buyer spec: read directly from the ingredient's IngredientSpec, NOT
        // through estimateSpecs (which is a formulation-level mass-weighting estimator and
        // would over-weight category fallbacks for a single ingredient — see honest-estimate
        // reframe in memory/project_honest_estimate_reframe.md).
        const ingSpec = getSpec(ing.name, dbData?.category);
        const specConfidence = mapSpecToConfidence(ingSpec);
        const costConfidence = mapCostToConfidence(dbData);
        const profile = getSustainabilityProfile({ name: ing.name, category: dbData?.category || '' });
        const today = new Date().toISOString().slice(0, 10);

        // Confidence pill — uses shared ConfidencePill (Round 1 color language: MEASURED/UNKNOWN
        // no pill, CALCULATED slate, ESTIMATED/INFERRED amber). Wrapping span adds left margin.
        const renderPill = (conf: Confidence) => (
          <span className="ml-2 inline-block"><ConfidencePill conf={conf} /></span>
        );

        // Class 3 ("we require") pill — buyer requirement, not a prediction. Slate family
        // is reserved for Class 3; CALCULATED Class 1a uses stone. ESTIMATED/INFERRED Class 1a
        // use amber. Three distinct pill colors keep classes visually separable.
        const requirementPill = (
          <span className="ml-2 px-1.5 py-0.5 text-[9px] rounded font-sans uppercase tracking-wide border bg-slate-100 text-slate-700 border-slate-300 whitespace-nowrap font-semibold">
            we require
          </span>
        );

        // Render a Required Specifications row using the ingredient's per-metric range.
        // Display the wider half-width when the metric's physical bounds clamp the range
        // asymmetrically (e.g., aw near 1.0): "± 0.030" honestly reports the underlying
        // tolerance, with the physical ceiling implicit. Showing the clamped-side delta
        // would understate uncertainty.
        const renderRangedRow = (label: string, metric: SpecMetric, value: number, decimals: number, unit: string, testMethod: string) => {
          const rv = rangedSpec(metric, value, specConfidence);
          const delta = Math.max(rv.value - rv.range.low, rv.range.high - rv.value);
          return (
            <tr className="border-b border-gray-100">
              <td className="py-1.5 px-3 font-medium">{label}</td>
              <td className="py-1.5 px-3 font-mono">
                {value.toFixed(decimals)}{unit} ± {delta.toFixed(decimals)}{unit}
                {renderPill(specConfidence)}
              </td>
              <td className="py-1.5 px-3 text-gray-600">{testMethod}</td>
            </tr>
          );
        };

        // Render a Class 3 buyer-requirement row in Section 6 (label gets the "we require" pill).
        const renderRequirementRow = (label: string, value: React.ReactNode) => (
          <tr className="border-b border-gray-100">
            <td className="py-1.5 px-3 font-medium w-48">
              <span>{label}</span>{requirementPill}
            </td>
            <td className="py-1.5 px-3">{value}</td>
          </tr>
        );

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-auto print:bg-transparent print:p-0 print:static print:overflow-visible" onClick={() => setSpecSheetIngredientIndex(null)}>
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl print:max-h-none print:shadow-none print:rounded-none print:overflow-visible" onClick={e => e.stopPropagation()}>
              {/* Modal header (hidden on print) */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 print:hidden bg-gray-50">
                <h2 className="text-lg font-bold text-gray-800">📋 Raw Material Spec Sheet</h2>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="px-3 py-1.5 bg-sky-600 text-white rounded text-xs hover:bg-sky-700">🖨 Print / PDF</button>
                  <button onClick={() => setSpecSheetIngredientIndex(null)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">Close</button>
                </div>
              </div>

              {/* Printable content */}
              <div className="p-8 print:p-4">
                {/* Letterhead */}
                <div className="border-b-2 border-gray-800 pb-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-semibold text-emerald-700 tracking-tight leading-none">
                        formulation<span className="text-gray-500 font-light tracking-[0.3em] ml-2 text-lg uppercase">wizard</span>
                      </h1>
                      <p className="text-xs text-gray-500 mt-1.5 italic">Raw Material Specification Sheet — Supplier-Facing Document</p>
                    </div>
                    <div className="text-right text-xs">
                      <div><span className="text-gray-500">Issued:</span> <span className="font-bold">{today}</span></div>
                      <div><span className="text-gray-500">Formulation:</span> <span className="font-bold">{formulationName || 'Untitled'}</span></div>
                      {partNumber && <div><span className="text-gray-500">Formula Part #:</span> <span className="font-bold font-mono">{partNumber}</span></div>}
                      <div><span className="text-gray-500">Mode:</span> <span className="font-bold">{mc.name}</span></div>
                    </div>
                  </div>
                </div>

                {/* Ingredient identity */}
                <section className="mb-6">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">1. Ingredient Identity</h2>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr><td className="py-1 font-semibold text-gray-700 w-48">Part Number</td><td className="py-1 font-mono font-bold text-emerald-700">{getIngredientPartNumber(ing.name, dbData?.category)}</td></tr>
                      <tr><td className="py-1 font-semibold text-gray-700">Ingredient Name</td><td className="py-1 text-gray-900">{ing.name}</td></tr>
                      {dbData?.category && <tr><td className="py-1 font-semibold text-gray-700">Category</td><td className="py-1">{dbData.category}</td></tr>}
                      {ing.subIngredients.length > 0 && (
                        <tr>
                          <td className="py-1 font-semibold text-gray-700 align-top">Sub-Ingredients</td>
                          <td className="py-1">{ing.subIngredients.join(', ')}</td>
                        </tr>
                      )}
                      {ing.allergens.length > 0 && (
                        <tr>
                          <td className="py-1 font-semibold text-rose-700">Allergens</td>
                          <td className="py-1 text-rose-700 font-semibold">{ing.allergens.join(', ')}</td>
                        </tr>
                      )}
                      {dbData?.notes && <tr><td className="py-1 font-semibold text-gray-700 align-top">Notes</td><td className="py-1 italic text-gray-600">{dbData.notes}</td></tr>}
                    </tbody>
                  </table>
                </section>

                {/* Required Specifications */}
                <section className="mb-6">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">2. Required Specifications (Target)</h2>
                  {/* Honest-estimate framing: spec sheet is a starting point for procurement,
                      not a final-authority document. See memory/project_honest_estimate_reframe.md. */}
                  <div className="mb-4 px-4 py-3 border-l-4 border-amber-400 bg-amber-50 rounded-r text-xs text-gray-700 leading-relaxed">
                    <strong className="text-gray-900">Specification targets below are estimates unless marked MEASURED.</strong>{' '}
                    The supplier's actual COA values constitute the verified specification. Targets and ranges are starting points for procurement negotiation and incoming-QA review — narrow tolerances after first-shipment data establishes process capability.
                  </div>
                  <table className="w-full text-sm border border-gray-200">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="text-left text-[10px] uppercase tracking-wide text-gray-500">
                        <th className="py-2 px-3">Parameter</th>
                        <th className="py-2 px-3">Target / Range</th>
                        <th className="py-2 px-3">Test Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingSpec.pH !== undefined && ingSpec.pH > 0 &&
                        renderRangedRow('pH', 'pH', ingSpec.pH, 2, '', 'pH meter, 2-point calibrated')}
                      {ingSpec.aw !== undefined && ingSpec.aw > 0 &&
                        renderRangedRow('Water Activity (aw)', 'aw', ingSpec.aw, 3, '', 'Decagon aw meter or equivalent')}
                      {ingSpec.moisture !== undefined && ingSpec.moisture > 0 &&
                        renderRangedRow('Moisture', 'moisture', ingSpec.moisture, 1, '%', 'Loss on drying @ 105°C or Karl Fischer')}
                      {ingSpec.brix !== undefined && ingSpec.brix > 0 &&
                        renderRangedRow('Brix', 'brix', ingSpec.brix, 1, '°', 'Digital refractometer @ 20°C')}
                      {ingSpec.aceticAcid !== undefined && ingSpec.aceticAcid > 0 &&
                        renderRangedRow('Acetic Acid', 'aceticAcid', ingSpec.aceticAcid, 2, '%', 'Titration with NaOH (AOAC 930.35)')}
                      {dbData?.nutrition?.protein !== undefined && dbData.nutrition.protein > 0 && (
                        <tr className="border-b border-gray-100"><td className="py-1.5 px-3 font-medium">Protein (typical)</td><td className="py-1.5 px-3 font-mono">{dbData.nutrition.protein}% per 100g</td><td className="py-1.5 px-3 text-gray-600">Kjeldahl N × 6.25 (or 5.7 for wheat)</td></tr>
                      )}
                      {dbData?.nutrition?.sodium !== undefined && dbData.nutrition.sodium > 0 && (
                        <tr className="border-b border-gray-100"><td className="py-1.5 px-3 font-medium">Sodium</td><td className="py-1.5 px-3 font-mono">{dbData.nutrition.sodium} mg/100g</td><td className="py-1.5 px-3 text-gray-600">ICP-OES or AOAC 984.27</td></tr>
                      )}
                      <tr className="border-b border-gray-100"><td className="py-1.5 px-3 font-medium">Heavy Metals (Pb, As, Cd, Hg)</td><td className="py-1.5 px-3 font-mono">Meet USP &lt;232&gt; / FDA action limits</td><td className="py-1.5 px-3 text-gray-600">ICP-MS, per USP &lt;233&gt;</td></tr>
                      <tr className="border-b border-gray-100"><td className="py-1.5 px-3 font-medium">Pesticide Residues</td><td className="py-1.5 px-3 font-mono">≤ FDA/EPA tolerances</td><td className="py-1.5 px-3 text-gray-600">Multi-residue LC-MS/MS + GC-MS/MS</td></tr>
                    </tbody>
                  </table>
                </section>

                {/* Microbiological Criteria — limits are product-class typical defaults
                    (INFERRED), not pulled from per-ingredient references. The Method
                    column cites authoritative test references (Class 2) — those don't
                    carry confidence pills because the citation itself communicates authority. */}
                <section className="mb-6">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3 flex items-center justify-between">
                    <span>3. Microbiological Criteria</span>
                    <ConfidencePill conf="inferred" />
                  </h2>
                  <table className="w-full text-sm border border-gray-200">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="text-left text-[10px] uppercase tracking-wide text-gray-500">
                        <th className="py-2 px-3">Organism</th>
                        <th className="py-2 px-3">Limit</th>
                        <th className="py-2 px-3">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100"><td className="py-1.5 px-3 font-medium">Total Aerobic Plate Count</td><td className="py-1.5 px-3 font-mono">≤ 10,000 CFU/g</td><td className="py-1.5 px-3 text-gray-600">AOAC 990.12 / FDA BAM Ch. 3</td></tr>
                      <tr className="border-b border-gray-100"><td className="py-1.5 px-3 font-medium">Yeast &amp; Mold</td><td className="py-1.5 px-3 font-mono">≤ 1,000 CFU/g</td><td className="py-1.5 px-3 text-gray-600">FDA BAM Ch. 18</td></tr>
                      <tr className="border-b border-gray-100"><td className="py-1.5 px-3 font-medium">Coliforms</td><td className="py-1.5 px-3 font-mono">≤ 100 CFU/g</td><td className="py-1.5 px-3 text-gray-600">FDA BAM Ch. 4</td></tr>
                      <tr className="border-b border-gray-100"><td className="py-1.5 px-3 font-medium"><em>E. coli</em></td><td className="py-1.5 px-3 font-mono">&lt; 10 CFU/g (absent preferred)</td><td className="py-1.5 px-3 text-gray-600">FDA BAM Ch. 4</td></tr>
                      <tr className="border-b border-gray-100"><td className="py-1.5 px-3 font-medium"><em>Salmonella</em> spp.</td><td className="py-1.5 px-3 font-mono">Absent in 25g</td><td className="py-1.5 px-3 text-gray-600">FDA BAM Ch. 5</td></tr>
                      <tr className="border-b border-gray-100"><td className="py-1.5 px-3 font-medium"><em>Listeria monocytogenes</em></td><td className="py-1.5 px-3 font-mono">Absent in 25g (RTE/refrigerated)</td><td className="py-1.5 px-3 text-gray-600">FDA BAM Ch. 10</td></tr>
                      <tr className="border-b border-gray-100"><td className="py-1.5 px-3 font-medium"><em>Staphylococcus aureus</em></td><td className="py-1.5 px-3 font-mono">≤ 100 CFU/g</td><td className="py-1.5 px-3 text-gray-600">FDA BAM Ch. 12</td></tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] text-gray-500 italic mt-2 leading-relaxed">
                    Limits above are product-class typical defaults — not pulled from a per-ingredient reference. Tighten where applicable to your finished-product category (e.g., RTE / refrigerated foods, infant nutrition, dietary supplements) and confirm acceptance with your supplier prior to first lot. Test method citations (AOAC, FDA BAM) are authoritative.
                  </p>
                </section>

                {/* Certification Requirements — Class 3 (buyer requirement), not a prediction. */}
                <section className="mb-6">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3 flex items-center justify-between">
                    <span>4. Certification Requirements</span>
                    <span className="px-1.5 py-0.5 text-[9px] rounded font-sans uppercase tracking-wide border bg-slate-100 text-slate-700 border-slate-300">we require</span>
                  </h2>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {profile.organicAvailable && /\borganic\b/i.test(ing.name) && (
                      <span className="px-2 py-1 bg-emerald-50 border border-emerald-300 rounded">USDA Organic (NOP)</span>
                    )}
                    {profile.nonGmoAvailable && (
                      <span className="px-2 py-1 bg-sky-50 border border-sky-300 rounded">Non-GMO Project Verified (if labeled)</span>
                    )}
                    {profile.suggestedCerts.includes('rspo-segregated') && (
                      <span className="px-2 py-1 bg-amber-50 border border-amber-300 rounded">RSPO Segregated (palm-derived)</span>
                    )}
                    {profile.suggestedCerts.includes('msc') && (
                      <span className="px-2 py-1 bg-sky-50 border border-sky-300 rounded">MSC Certified (wild-caught)</span>
                    )}
                    {profile.suggestedCerts.includes('rainforest-alliance') && (
                      <span className="px-2 py-1 bg-emerald-50 border border-emerald-300 rounded">Rainforest Alliance / UTZ</span>
                    )}
                    {profile.suggestedCerts.includes('fair-trade-usa') && (
                      <span className="px-2 py-1 bg-amber-50 border border-amber-300 rounded">Fair Trade USA / International</span>
                    )}
                    <span className="px-2 py-1 bg-gray-50 border border-gray-300 rounded">Kosher (U / OU preferred)</span>
                    <span className="px-2 py-1 bg-gray-50 border border-gray-300 rounded">Halal (IFANCA or equivalent)</span>
                    <span className="px-2 py-1 bg-gray-50 border border-gray-300 rounded">FSSC 22000 / SQF / BRC (facility)</span>
                  </div>
                </section>

                {/* Documentation Required — Class 3 (buyer requirement). */}
                <section className="mb-6">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3 flex items-center justify-between">
                    <span>5. Documentation Required with Each Lot</span>
                    <span className="px-1.5 py-0.5 text-[9px] rounded font-sans uppercase tracking-wide border bg-slate-100 text-slate-700 border-slate-300">we require</span>
                  </h2>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>Certificate of Analysis (COA) with lot number, manufacture date, values vs. spec</li>
                    <li>Allergen Statement / Letter of Guarantee</li>
                    <li>Country of Origin statement</li>
                    <li>Kosher / Halal / Organic / Non-GMO certificates (current, unexpired)</li>
                    <li>Food Safety Audit certificate (SQF / BRC / FSSC 22000)</li>
                    <li>GMO / PGM status statement</li>
                    <li>Bioengineered Food Disclosure status (per USDA 7 CFR 66)</li>
                  </ul>
                </section>

                {/* Commercial Terms — mixed: Target Cost is Class 1a (a prediction with confidence
                    + range), the other rows are Class 3 (buyer requirements). Per-row treatment.
                    See feedback memory three_class_value_taxonomy.md. */}
                <section className="mb-6">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">6. Commercial Terms</h2>
                  <table className="w-full text-sm border border-gray-200">
                    <tbody>
                      {/* Target Cost — Class 1a, cost-class confidence + range (default ESTIMATED ±25%
                          for industry-typical scaffolding; MEASURED ±5% if a verified supplier quote
                          with valid costValidUntil is attached). */}
                      {(() => {
                        const cost = ing.costPerKg || 0;
                        if (cost <= 0 || costConfidence === 'unknown') {
                          // Round 8 Item 3: explicit UNKNOWN pill so users can distinguish
                          // "we don't know this value" from a surface that simply has no
                          // data here. Pill labels the absence; em-dash remains the value.
                          return (
                            <tr className="border-b border-gray-100">
                              <td className="py-1.5 px-3 font-medium w-48">Target Cost</td>
                              <td className="py-1.5 px-3 font-mono text-gray-400">
                                — (no cost data)
                                {renderPill('unknown')}
                              </td>
                            </tr>
                          );
                        }
                        const rv = costRangedSpec(cost, costConfidence);
                        const delta = rv.range.high - rv.value;
                        const stale = dbData?.costSource === 'verified-quote' && costConfidence === 'estimated';
                        // Use 4 decimals for very-low-cost items (e.g. potable water at $0.002/kg
                        // would round to "$0.00" at 2 decimals); 2 decimals for everything else.
                        const dec = cost < 0.10 ? 4 : 2;
                        return (
                          <tr className="border-b border-gray-100">
                            <td className="py-1.5 px-3 font-medium w-48">Target Cost</td>
                            <td className="py-1.5 px-3 font-mono">
                              ${cost.toFixed(dec)}/kg ± ${delta.toFixed(dec)}/kg (delivered)
                              {renderPill(costConfidence)}
                              {stale && <span className="ml-2 text-[10px] italic text-amber-700">stale quote — verify current pricing</span>}
                            </td>
                          </tr>
                        );
                      })()}
                      {renderRequirementRow('Minimum Order Quantity', 'To be agreed — target 1 pallet / 1,000 kg typical')}
                      {renderRequirementRow('Lead Time', '≤ 2 weeks from order release')}
                      {renderRequirementRow('Shelf Life at Receipt', '≥ 75% of labeled shelf life remaining')}
                      {renderRequirementRow('Payment Terms', 'Net 30, terms negotiable')}
                      {renderRequirementRow('Preferred Suppliers (in order)', <span className="text-[11px]">{(dbData?.suppliers || []).join(' / ') || '—'}</span>)}
                    </tbody>
                  </table>
                </section>

                {/* Incoming Inspection Protocol — Class 3 (buyer-side QA process). */}
                <section className="mb-6">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3 flex items-center justify-between">
                    <span>7. Incoming QA Inspection</span>
                    <span className="px-1.5 py-0.5 text-[9px] rounded font-sans uppercase tracking-wide border bg-slate-100 text-slate-700 border-slate-300">we require</span>
                  </h2>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>COA review against spec — reject any lot with out-of-spec parameter without pre-arranged deviation approval</li>
                    <li>Visual inspection for damage, contamination, infestation</li>
                    <li>Temperature check (refrigerated / frozen materials)</li>
                    <li>Seal integrity + tamper evidence</li>
                    <li>Weight verification — ± 1% of manifest</li>
                    <li>Lot number recorded in incoming log; COA retained ≥ 2 years per 21 CFR 117.315</li>
                    <li>Retention sample pulled + held to 6 months past use-by</li>
                  </ul>
                </section>

                {/* Signatures */}
                <section className="mt-8 pt-4 border-t-2 border-gray-800">
                  <div className="grid grid-cols-2 gap-8 text-sm">
                    <div>
                      <div className="font-semibold text-gray-700 mb-4">Buyer (Purchaser)</div>
                      <div className="border-b border-gray-400 h-10"></div>
                      <div className="text-[10px] text-gray-500 mt-1">Name / Title / Date</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700 mb-4">Supplier (Manufacturer)</div>
                      <div className="border-b border-gray-400 h-10"></div>
                      <div className="text-[10px] text-gray-500 mt-1">Name / Title / Date</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 italic mt-6 text-center">
                    This document references FDA 21 CFR 117 (Preventive Controls for Human Food), 21 CFR 111 (Dietary Supplement cGMP),
                    and USP chapters &lt;232&gt; and &lt;233&gt; where applicable. Specifications are targets — finalize and sign before first shipment.
                  </p>
                </section>
              </div>
            </div>
          </div>
        );
      })()}

      {activeTab === 'cost' && (
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">💰 Formulation Cost Tool</h2>
                <p className="text-gray-500 text-sm mt-1">{formulationName || 'Untitled formulation'} • {mc.name}</p>
              </div>
              <div className="text-xs text-gray-400">Cost/kg values flow from DB → override per-ingredient on the 🔬 Build tab</div>
            </div>
          </div>

          {ingredients.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm italic">
              Add ingredients on the 🔬 Build tab first. The cost tool breaks down ingredient, packaging, freight, labor, and overhead per retail unit.
            </div>
          ) : (() => {
            // ───── Core cost math (respects freight model + commodity spike) ─────
            const spikeMult = 1 + (commoditySpikePct / 100);
            const rawIngredientCost = totalCost * spikeMult;
            const totalBatchKg = totalBatchGrams / 1000;
            const freightAdder = freightModel === 'fob' ? totalBatchKg * freightPerKg : 0;
            const deliveredIngredientCost = rawIngredientCost + freightAdder;

            const unitsPerBatch = packageSizeInGrams > 0
              ? Math.floor(totalBatchGrams / packageSizeInGrams)
              : 0;

            // Per-unit roll-up (allocate batch-wide cost by weight share of the package)
            const weightShare = totalBatchGrams > 0 ? packageSizeInGrams / totalBatchGrams : 0;
            const ingredientCostPerUnit = deliveredIngredientCost * weightShare;
            const packagingCostPerUnit = (selectedPackaging?.costPerUnit || 0) + (selectedClosure?.costPerUnit || 0);
            const directCostPerUnit = ingredientCostPerUnit + packagingCostPerUnit + laborPerUnit;
            const overheadPerUnit = directCostPerUnit * (overheadPct / 100);
            const fullyLoadedCOGS = directCostPerUnit + overheadPerUnit;

            // ───── Margin math ─────
            const wholesalePrice = targetSRP * wholesaleFactor;
            const costCeiling = wholesalePrice * (1 - targetMarginPct / 100);
            const actualMarginPct = wholesalePrice > 0
              ? ((wholesalePrice - fullyLoadedCOGS) / wholesalePrice) * 100
              : 0;
            const marginDelta = actualMarginPct - targetMarginPct;
            const costDelta = costCeiling - fullyLoadedCOGS;
            const onTarget = marginDelta >= 0;

            // ───── Per-ingredient breakdown ─────
            type CostRow = {
              idx: number;
              name: string;
              category: string;
              massG: number;
              costPerKg: number;
              lineCost: number;
              sharePct: number;
              supplier: string;
              moq: string;
              suggestions: IndustrialIngredient[];
              isOverride: boolean;
            };

            const sortedForSuggestions = (name: string, cat: string, currentCostPerKg: number): IndustrialIngredient[] => {
              if (!cat || currentCostPerKg <= 0) return [];
              return INDUSTRIAL_DB
                .filter(i => i.category === cat
                  && i.name !== name
                  && (i.costPerKg || 0) > 0
                  && (i.costPerKg || 0) < currentCostPerKg)
                .sort((a, b) => (a.costPerKg || 0) - (b.costPerKg || 0))
                .slice(0, 3);
            };

            const rows: CostRow[] = ingredients.map((ing, idx) => {
              const massG = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
              const massKg = massG / 1000;
              const effectiveCostPerKg = (ing.costPerKg || 0) * spikeMult;
              const lineCost = massKg * effectiveCostPerKg;
              const cat = ing.foodData?.type === 'industrial'
                ? (ing.foodData.data as IndustrialIngredient).category
                : '';
              const supplier = ing.supplier || (ing.foodData?.type === 'industrial'
                ? ((ing.foodData.data as IndustrialIngredient).suppliers || [])[0] || ''
                : '');
              // DB-stated cost as the reference; anything different ⇒ override
              const dbCost = ing.foodData?.type === 'industrial'
                ? ((ing.foodData.data as IndustrialIngredient).costPerKg || 0)
                : 0;
              const isOverride = dbCost > 0 && Math.abs((ing.costPerKg || 0) - dbCost) > 0.001;
              // MOQ heuristic — most industrial ingredients ship in ≥ 20 kg cases
              const moq = massKg < 0.5 ? 'pilot' : massKg < 20 ? 'below typical MOQ' : 'ok';
              return {
                idx,
                name: ing.name,
                category: cat,
                massG,
                costPerKg: effectiveCostPerKg,
                lineCost,
                sharePct: rawIngredientCost > 0 ? (lineCost / rawIngredientCost) * 100 : 0,
                supplier,
                moq,
                suggestions: sortedForSuggestions(ing.name, cat, effectiveCostPerKg),
                isOverride,
              };
            }).sort((a, b) => b.lineCost - a.lineCost);

            const fmt = (n: number) => n >= 10 ? n.toFixed(2) : n.toFixed(3);

            const unitSanityViolation = packageSizeInGrams > totalBatchGrams && totalBatchGrams > 0;

            return (
              <>
                {unitSanityViolation && (
                  <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="flex-1 text-sm">
                        <p className="font-bold text-rose-800">Unit mismatch detected — all per-unit cost figures below are unreliable.</p>
                        <p className="text-rose-700 mt-1">
                          Your package size ({packageSize}{packageUnit} = {packageSizeInGrams.toFixed(0)}g) is larger than your entire batch ({totalBatchGrams.toFixed(0)}g).
                          This almost always means the unit dropdown is set incorrectly on the 🔬 Build tab (e.g. &apos;oz&apos; where &apos;g&apos; was intended, or &apos;lb&apos; where &apos;oz&apos; was intended).
                        </p>
                        <p className="text-rose-700 mt-1 font-semibold">Fix the package size / unit on the Build tab before relying on any number on this page.</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* ───── Headline KPIs ───── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Ingredient $ / unit</div>
                    <div className="text-2xl font-bold text-emerald-700 mt-1">${fmt(ingredientCostPerUnit)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">weight-allocated share</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Packaging $ / unit</div>
                    <div className="text-2xl font-bold text-emerald-700 mt-1">${fmt(packagingCostPerUnit)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">container + closure</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-[10px] uppercase tracking-wide text-gray-500">Fully-loaded COGS</div>
                    <div className="text-2xl font-bold text-emerald-700 mt-1">${fmt(fullyLoadedCOGS)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">+ labor + overhead</div>
                  </div>
                  <div className={`rounded-xl border p-4 ${onTarget ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                    <div className="text-[10px] uppercase tracking-wide text-gray-600">Gross Margin</div>
                    <div className={`text-2xl font-bold mt-1 ${onTarget ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {wholesalePrice > 0 ? `${actualMarginPct.toFixed(1)}%` : '—'}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {onTarget ? `+${marginDelta.toFixed(1)} pts vs target` : `${marginDelta.toFixed(1)} pts vs target`}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* ───── Pricing / Margin Calculator ───── */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">🎯 Margin Calculator</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Target SRP (retail, $)</label>
                        <input type="number" step="0.01" value={targetSRP}
                          onChange={e => setTargetSRP(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Wholesale factor</label>
                        <input type="number" step="0.01" value={wholesaleFactor}
                          onChange={e => setWholesaleFactor(Math.max(0.1, Math.min(1, parseFloat(e.target.value) || 0.5)))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                        <p className="text-[10px] text-gray-400 mt-0.5">0.50 = typical grocery (50% markup)</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Target gross margin %</label>
                        <input type="number" step="1" value={targetMarginPct}
                          onChange={e => setTargetMarginPct(Math.max(0, Math.min(90, parseFloat(e.target.value) || 0)))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Wholesale $ (computed)</label>
                        <div className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm font-mono text-gray-700">
                          ${wholesalePrice.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="text-[10px] uppercase tracking-wide text-gray-500">Cost ceiling</div>
                          <div className="font-bold font-mono text-gray-800">${fmt(costCeiling)}</div>
                          <div className="text-[10px] text-gray-400">max COGS/unit for {targetMarginPct}% margin</div>
                        </div>
                        <div className={`rounded-lg p-3 border ${onTarget ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                          <div className="text-[10px] uppercase tracking-wide text-gray-600">Distance to target</div>
                          <div className={`font-bold font-mono ${onTarget ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {onTarget ? '+' : ''}${fmt(costDelta)}
                          </div>
                          <div className="text-[10px] text-gray-500">{onTarget ? 'headroom' : 'over budget'} / unit</div>
                        </div>
                      </div>

                      {/* Progress bar to target */}
                      {costCeiling > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                            <span>$0</span>
                            <span>Ceiling ${costCeiling.toFixed(2)}</span>
                          </div>
                          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`absolute inset-y-0 left-0 ${onTarget ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(100, (fullyLoadedCOGS / costCeiling) * 100)}%` }} />
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1 text-right">
                            {((fullyLoadedCOGS / costCeiling) * 100).toFixed(0)}% of ceiling consumed
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ───── Inputs: freight, labor, overhead, sensitivity ───── */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">⚙️ Cost Inputs</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Freight model</label>
                        <div className="flex gap-2">
                          <button onClick={() => setFreightModel('delivered')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm border ${freightModel === 'delivered' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'}`}>
                            Delivered (DDP)
                          </button>
                          <button onClick={() => setFreightModel('fob')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm border ${freightModel === 'fob' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'}`}>
                            FOB origin + freight
                          </button>
                        </div>
                      </div>
                      {freightModel === 'fob' && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Freight $ / kg</label>
                          <input type="number" step="0.01" value={freightPerKg}
                            onChange={e => setFreightPerKg(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                          <p className="text-[10px] text-gray-400 mt-0.5">Typical LTL $0.10–$0.40/kg. Reefer or air freight, more.</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Labor $ / unit</label>
                          <input type="number" step="0.01" value={laborPerUnit}
                            onChange={e => setLaborPerUnit(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Overhead %</label>
                          <input type="number" step="1" value={overheadPct}
                            onChange={e => setOverheadPct(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          📈 Commodity spike sensitivity: <span className={`font-bold ${commoditySpikePct === 0 ? 'text-gray-600' : commoditySpikePct > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{commoditySpikePct > 0 ? '+' : ''}{commoditySpikePct}%</span>
                        </label>
                        <input type="range" min={-30} max={100} step={5} value={commoditySpikePct}
                          onChange={e => setCommoditySpikePct(parseInt(e.target.value))}
                          className="w-full" />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                          <span>-30%</span><span>baseline</span><span>+100%</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          What-if modeling: applies a global $/kg multiplier to every ingredient. Use to stress-test margin against commodity volatility.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ───── Per-ingredient breakdown ───── */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <div className="flex items-baseline justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-800">📊 Per-Ingredient Cost Breakdown</h3>
                    <div className="text-xs text-gray-500">
                      Batch total: <span className="font-mono font-bold text-emerald-700">${rawIngredientCost.toFixed(2)}</span>
                      {freightAdder > 0 && <> + <span className="font-mono text-amber-600">${freightAdder.toFixed(2)} freight</span></>}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-300 text-left text-[10px] uppercase tracking-wide text-gray-500">
                          <th className="py-2">Ingredient</th>
                          <th className="py-2 text-right">Mass</th>
                          <th className="py-2 text-right">$/kg</th>
                          <th className="py-2 text-right">Line $</th>
                          <th className="py-2 text-right">% cost</th>
                          <th className="py-2">Supplier</th>
                          <th className="py-2 text-center">MOQ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r.idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2">
                              <div className="font-medium text-gray-800">{r.name}</div>
                              {r.category && <div className="text-[10px] text-gray-400">{r.category}</div>}
                              {r.suggestions.length > 0 && (
                                <details className="mt-1">
                                  <summary className="text-[10px] text-blue-600 cursor-pointer hover:underline">
                                    💡 {r.suggestions.length} lower-cost sub{r.suggestions.length > 1 ? 's' : ''}
                                  </summary>
                                  <div className="mt-1 pl-2 border-l-2 border-blue-200 space-y-1">
                                    {r.suggestions.map(s => {
                                      const savings = r.costPerKg - (s.costPerKg || 0);
                                      const savingsPct = r.costPerKg > 0 ? (savings / r.costPerKg) * 100 : 0;
                                      return (
                                        <div key={s.name} className="text-[10px]">
                                          <span className="font-medium text-gray-700">{s.name}</span>
                                          {' — '}
                                          <span className="font-mono">${(s.costPerKg || 0).toFixed(2)}/kg</span>
                                          {' '}
                                          <span className="text-emerald-700 font-semibold">−{savingsPct.toFixed(0)}%</span>
                                          {' '}
                                          <span className="text-gray-500">({(s.suppliers || [])[0] || ''})</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </details>
                              )}
                            </td>
                            <td className="py-2 text-right font-mono">{r.massG.toFixed(1)}g</td>
                            <td className="py-2 text-right font-mono">
                              <div className="flex items-center gap-1 justify-end">
                                <span className="text-gray-400">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={ingredients[r.idx]?.costPerKg || ''}
                                  onChange={e => updateCost(r.idx, e.target.value)}
                                  placeholder="0.00"
                                  title="Edit $/kg — override DB default with your real supplier quote"
                                  className="w-20 border border-gray-200 rounded px-1.5 py-0.5 text-xs font-mono text-right focus:outline-none focus:border-emerald-500 bg-white"
                                />
                                {r.isOverride && <span title="Overrides DB default" className="text-[9px] text-amber-600 font-bold">◉</span>}
                              </div>
                            </td>
                            <td className="py-2 text-right font-mono font-semibold text-emerald-700">${r.lineCost.toFixed(3)}</td>
                            <td className="py-2 text-right font-mono text-gray-600">{r.sharePct.toFixed(1)}%</td>
                            <td className="py-2 text-gray-600 text-[10px] max-w-[240px]">
                              {/* Supplier selector — picks from the ingredient's DB supplier list OR lets user type a custom name */}
                              {(() => {
                                const fd = ingredients[r.idx]?.foodData;
                                const dbData = fd?.type === 'industrial' ? (fd.data as IndustrialIngredient) : null;
                                const suppliers = dbData?.suppliers || [];
                                const currentSupplier = ingredients[r.idx]?.supplier || '';
                                const isCustom = currentSupplier && !suppliers.includes(currentSupplier);
                                return (
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <select
                                      value={isCustom ? '__custom__' : currentSupplier}
                                      onChange={e => {
                                        const val = e.target.value;
                                        if (val === '__custom__') {
                                          const custom = window.prompt('Enter custom supplier name:', currentSupplier) || '';
                                          if (custom) updateSupplier(r.idx, custom);
                                        } else if (val) {
                                          applySupplierFromRegistry(r.idx, val);
                                        }
                                      }}
                                      title="Change supplier — applies registry price modifier to DB baseline"
                                      className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-[10px] bg-white focus:outline-none focus:border-emerald-500"
                                    >
                                      {suppliers.length === 0 && <option value="">(no DB suppliers)</option>}
                                      {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                                      {isCustom && <option value={currentSupplier}>{currentSupplier} ✏️</option>}
                                      <option value="__custom__">+ Type custom supplier…</option>
                                    </select>
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="py-2 text-center">
                              {r.moq === 'pilot' && <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded text-[9px]">pilot</span>}
                              {r.moq === 'below typical MOQ' && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px]" title="Below typical 20kg industrial MOQ — expect pilot-pack pricing">↑ MOQ</span>}
                              {r.moq === 'ok' && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px]">ok</span>}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-700 font-bold bg-gray-50">
                          <td className="py-2">TOTAL (batch, {totalBatchGrams.toFixed(0)}g)</td>
                          <td className="py-2 text-right font-mono">{totalBatchGrams.toFixed(1)}g</td>
                          <td></td>
                          <td className="py-2 text-right font-mono text-emerald-700">${rawIngredientCost.toFixed(2)}</td>
                          <td className="py-2 text-right font-mono">100.0%</td>
                          <td></td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3 italic">
                    Override ingredient $/kg on the 🔬 Build tab (with real supplier quotes). ◉ badge marks overridden rows.
                    Lower-cost subs are drawn from the same category in this mode&apos;s DB — verify functional equivalence before swapping.
                  </p>
                </div>

                {/* ───── COGS Waterfall ───── */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-800 mb-4">📉 Per-Unit COGS Waterfall</h3>
                  <div className="space-y-2">
                    {(() => {
                      const items = [
                        { label: 'Ingredients (delivered)', value: ingredientCostPerUnit, color: 'bg-emerald-500' },
                        { label: 'Packaging (container + closure)', value: packagingCostPerUnit, color: 'bg-sky-500' },
                        { label: 'Direct labor', value: laborPerUnit, color: 'bg-violet-500' },
                        { label: `Overhead (${overheadPct}%)`, value: overheadPerUnit, color: 'bg-amber-500' },
                      ];
                      const max = Math.max(fullyLoadedCOGS, 0.001);
                      return items.map((it, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-56 text-xs text-gray-600">{it.label}</div>
                          <div className="flex-1 h-6 bg-gray-100 rounded relative overflow-hidden">
                            <div className={`absolute inset-y-0 left-0 ${it.color}`} style={{ width: `${(it.value / max) * 100}%` }} />
                            <div className="absolute inset-0 flex items-center px-2 text-[10px] font-mono font-semibold text-gray-800">
                              ${fmt(it.value)} &nbsp;<span className="text-gray-500">({fullyLoadedCOGS > 0 ? ((it.value / fullyLoadedCOGS) * 100).toFixed(0) : '0'}%)</span>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                    <div className="flex items-center gap-3 pt-2 border-t-2 border-gray-700">
                      <div className="w-56 text-sm font-bold text-gray-800">Fully-loaded COGS / unit</div>
                      <div className="flex-1 h-7 bg-gray-200 rounded relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center px-2 text-sm font-bold font-mono text-gray-900">
                          ${fmt(fullyLoadedCOGS)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-56 text-xs text-gray-600">Wholesale (${wholesaleFactor.toFixed(2)}× SRP)</div>
                      <div className="flex-1 h-6 bg-gray-100 rounded relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center px-2 text-[10px] font-mono font-semibold text-gray-700">
                          ${wholesalePrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-56 text-xs text-gray-600">SRP (retail)</div>
                      <div className="flex-1 h-6 bg-gray-100 rounded relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center px-2 text-[10px] font-mono font-semibold text-gray-700">
                          ${targetSRP.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                      <div className="text-[10px] text-gray-500 uppercase">Units / batch</div>
                      <div className="font-bold font-mono">{unitsPerBatch}</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                      <div className="text-[10px] text-gray-500 uppercase">Revenue / batch (at wholesale)</div>
                      <div className="font-bold font-mono text-emerald-700">${(unitsPerBatch * wholesalePrice).toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2">
                      <div className="text-[10px] text-gray-500 uppercase">Gross profit / batch</div>
                      <div className={`font-bold font-mono ${onTarget ? 'text-emerald-700' : 'text-rose-700'}`}>
                        ${(unitsPerBatch * (wholesalePrice - fullyLoadedCOGS)).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {commoditySpikePct !== 0 && (
                    <div className={`mt-4 text-xs border rounded-lg p-3 ${commoditySpikePct > 0 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                      <strong>Stress test active:</strong> all ingredient $/kg multiplied by {(1 + commoditySpikePct / 100).toFixed(2)}× ({commoditySpikePct > 0 ? '+' : ''}{commoditySpikePct}% commodity spike).
                      {' '}Reset the slider to return to baseline.
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SOURCING TAB
          Per-ingredient supplier breakdown with cert filters.
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'sourcing' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Sub-view toggle: Suppliers directory vs. Qualifications tracker */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSourcingSubView('suppliers')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${sourcingSubView === 'suppliers' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              🏭 Suppliers by Ingredient
            </button>
            <button
              onClick={() => setSourcingSubView('qualifications')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${sourcingSubView === 'qualifications' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              📋 Qualification Tracker {supplierQuals.length > 0 && <span className="ml-1 text-[10px] opacity-75">({supplierQuals.length})</span>}
            </button>
          </div>

          {sourcingSubView === 'suppliers' && (
          <>
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">🌐 Supplier Sourcing</h2>
                <p className="text-gray-500 text-sm mt-1">{formulationName || 'Untitled formulation'} • {mc.name}</p>
              </div>
              <div className="text-xs text-gray-400">Cert filters below apply in real time</div>
            </div>

            {/* Filter bar */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-2">Required certifications (must-haves)</div>
              <div className="flex flex-wrap gap-2">
                {([
                  { label: '🌱 USDA Organic', state: sourcingFilterOrganic, set: setSourcingFilterOrganic, cert: 'usda-organic' as SustainabilityCert },
                  { label: '🧬 Non-GMO Verified', state: sourcingFilterNonGmo, set: setSourcingFilterNonGmo, cert: 'non-gmo-verified' as SustainabilityCert },
                  { label: '✡ Kosher', state: sourcingFilterKosher, set: setSourcingFilterKosher, cert: 'kosher' as SustainabilityCert },
                  { label: '☪ Halal', state: sourcingFilterHalal, set: setSourcingFilterHalal, cert: 'halal' as SustainabilityCert },
                  { label: '🌴 RSPO', state: sourcingFilterRspo, set: setSourcingFilterRspo, cert: 'rspo-segregated' as SustainabilityCert },
                  { label: '🐟 MSC/ASC', state: sourcingFilterMsc, set: setSourcingFilterMsc, cert: 'msc' as SustainabilityCert },
                  { label: '🤝 Fair Trade', state: sourcingFilterFairTrade, set: setSourcingFilterFairTrade, cert: 'fair-trade-usa' as SustainabilityCert },
                  { label: '🏭 cGMP', state: sourcingFilterCgmp, set: setSourcingFilterCgmp, cert: 'cgmp' as SustainabilityCert },
                ]).map(f => (
                  <button
                    key={f.cert}
                    onClick={() => f.set(!f.state)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      f.state
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                    }`}
                  >
                    {f.state ? '✓ ' : ''}{f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <label className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Max Lead Time:</label>
                <select
                  value={sourcingFilterMaxLeadTime}
                  onChange={e => setSourcingFilterMaxLeadTime(e.target.value as typeof sourcingFilterMaxLeadTime)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  <option value="any">Any</option>
                  <option value="1-3-days">1–3 days</option>
                  <option value="1-2-weeks">1–2 weeks</option>
                  <option value="2-4-weeks">2–4 weeks</option>
                  <option value="4-8-weeks">4–8 weeks</option>
                </select>
              </div>
            </div>
          </div>

          {ingredients.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm italic">
              Add ingredients on the 🔬 Build tab first. This tab shows every supplier for every ingredient in your formula, with cert filters.
            </div>
          ) : (() => {
            // Helper: rank lead-time buckets for filter comparison
            const leadTimeRank: Record<LeadTimeBucket, number> = {
              'same-day': 0, '1-3-days': 1, '1-2-weeks': 2, '2-4-weeks': 3, '4-8-weeks': 4, '8-plus-weeks': 5,
            };
            const maxLeadRank = sourcingFilterMaxLeadTime === 'any' ? 99 : leadTimeRank[sourcingFilterMaxLeadTime];
            const requiredCerts: SustainabilityCert[] = [
              ...(sourcingFilterOrganic ? ['usda-organic' as SustainabilityCert] : []),
              ...(sourcingFilterNonGmo ? ['non-gmo-verified' as SustainabilityCert] : []),
              ...(sourcingFilterKosher ? ['kosher' as SustainabilityCert] : []),
              ...(sourcingFilterHalal ? ['halal' as SustainabilityCert] : []),
              ...(sourcingFilterRspo ? ['rspo-segregated' as SustainabilityCert, 'rspo-mass-balance' as SustainabilityCert] : []),
              ...(sourcingFilterMsc ? ['msc' as SustainabilityCert, 'asc' as SustainabilityCert] : []),
              ...(sourcingFilterFairTrade ? ['fair-trade-usa' as SustainabilityCert, 'fair-trade-international' as SustainabilityCert, 'rainforest-alliance' as SustainabilityCert] : []),
              ...(sourcingFilterCgmp ? ['cgmp' as SustainabilityCert] : []),
            ];

            // Expand into per-ingredient / per-supplier rows
            return (
              <div className="space-y-4">
                {ingredients.map((ing, idx) => {
                  const suppliers = ing.foodData?.type === 'industrial'
                    ? (ing.foodData.data as IndustrialIngredient).suppliers || []
                    : ing.supplier ? [ing.supplier] : [];
                  const ingBaseCost = ing.costPerKg || 0;

                  // Per-supplier profile with filters applied
                  const supplierProfiles = suppliers.map(name => {
                    const info = getSupplierInfo(name);
                    const hasAllCerts = requiredCerts.length === 0 ||
                      requiredCerts.every(c =>
                        sourcingFilterRspo ? (info.certs.includes('rspo-segregated') || info.certs.includes('rspo-mass-balance'))
                        : sourcingFilterMsc ? (info.certs.includes('msc') || info.certs.includes('asc'))
                        : sourcingFilterFairTrade ? (info.certs.includes('fair-trade-usa') || info.certs.includes('fair-trade-international') || info.certs.includes('rainforest-alliance'))
                        : info.certs.includes(c)
                      );
                    const leadOk = leadTimeRank[info.typicalLeadTime] <= maxLeadRank;
                    const effectiveCostPerKg = ingBaseCost * info.priceModifier;
                    return { info, hasAllCerts, leadOk, effectiveCostPerKg, passes: hasAllCerts && leadOk };
                  }).sort((a, b) => a.effectiveCostPerKg - b.effectiveCostPerKg);

                  const passingCount = supplierProfiles.filter(s => s.passes).length;

                  return (
                    <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 flex items-baseline justify-between flex-wrap gap-2">
                        <div>
                          <div className="font-semibold text-gray-800">{ing.name}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {ing.qty}{ing.unit} • DB baseline ${ingBaseCost.toFixed(2)}/kg
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className={`px-2 py-1 rounded ${passingCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {passingCount}/{supplierProfiles.length} suppliers match filters
                          </span>
                        </div>
                      </div>

                      {supplierProfiles.length === 0 ? (
                        <div className="p-4 text-xs text-gray-400 italic">No suppliers listed for this ingredient.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-gray-200 text-left text-[10px] uppercase tracking-wide text-gray-500 bg-gray-50">
                                <th className="py-2 px-3">Supplier</th>
                                <th className="py-2 px-3">Country</th>
                                <th className="py-2 px-3">Tier</th>
                                <th className="py-2 px-3">Certs</th>
                                <th className="py-2 px-3">Lead Time</th>
                                <th className="py-2 px-3">MOQ</th>
                                <th className="py-2 px-3 text-right">$/kg (est.)</th>
                                <th className="py-2 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {supplierProfiles.map((sp, sidx) => {
                                const { info } = sp;
                                const tierColor = info.tier === 'commodity' ? 'gray' : info.tier === 'specialty' ? 'sky' : info.tier === 'premium' ? 'violet' : 'amber';
                                return (
                                  <tr key={sidx} className={`border-b border-gray-100 ${!sp.passes ? 'opacity-40' : ''}`}>
                                    <td className="py-2 px-3">
                                      <div className="font-medium text-gray-800">{info.name}</div>
                                      {info.notes && <div className="text-[9px] text-gray-500 mt-0.5">{info.notes.slice(0, 80)}{info.notes.length > 80 ? '…' : ''}</div>}
                                    </td>
                                    <td className="py-2 px-3 text-gray-600">{info.country}</td>
                                    <td className="py-2 px-3">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold bg-${tierColor}-100 text-${tierColor}-700`}>{info.tier}</span>
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="flex flex-wrap gap-0.5 max-w-[200px]">
                                        {info.certs.slice(0, 5).map(c => (
                                          <span key={c} className="px-1 py-0.5 rounded text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200" title={CERT_LABELS[c] || c}>
                                            {CERT_LABELS[c]?.split(' ')[0] || c.split('-')[0]}
                                          </span>
                                        ))}
                                        {info.certs.length > 5 && <span className="text-[8px] text-gray-500">+{info.certs.length - 5}</span>}
                                      </div>
                                    </td>
                                    <td className="py-2 px-3 text-gray-600 text-[11px]">{info.typicalLeadTime.replace(/-/g, ' ')}</td>
                                    <td className="py-2 px-3 text-gray-600 text-[11px]">{info.moqTier}</td>
                                    <td className="py-2 px-3 text-right font-mono">
                                      <span className={sp.effectiveCostPerKg > ingBaseCost * 1.05 ? 'text-rose-600' : sp.effectiveCostPerKg < ingBaseCost * 0.95 ? 'text-emerald-700' : 'text-gray-700'}>
                                        ${sp.effectiveCostPerKg.toFixed(2)}
                                      </span>
                                      <div className="text-[9px] text-gray-400">({info.priceModifier.toFixed(2)}×)</div>
                                    </td>
                                    <td className="py-2 px-3">
                                      {sp.passes ? (
                                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-semibold">✓ matches</span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-semibold" title={!sp.hasAllCerts ? 'Missing required certs' : 'Lead time too long'}>
                                          {!sp.hasAllCerts ? 'missing certs' : 'lead time'}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-[11px] text-gray-600 italic">
                  <strong>How this works:</strong> $/kg shows the DB baseline cost multiplied by each supplier&apos;s price modifier (commodity = 0.95–1.0×, specialty = 1.05–1.15×, premium = 1.20–1.45×, craft = 1.60–2.85×). Certifications come from the supplier registry — verify current certificates with the supplier before contracting. Price modifiers are directional estimates, not firm quotes.
                </div>
              </div>
            );
          })()}
          </>
          )}

          {/* ═════════ QUALIFICATION TRACKER sub-view ═════════ */}
          {sourcingSubView === 'qualifications' && (() => {
            const summary = summarizeQualifications(supplierQuals);
            return (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">📋 Supplier Qualification Tracker</h2>
                      <p className="text-gray-500 text-sm mt-1 max-w-2xl">
                        Track supplier documentation with expiration dates. Alerts bubble up to the Dashboard when anything expires within 60 days.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingQualId('new');
                        setQualForm({ supplierName: '', docType: 'locg', issuedDate: new Date().toISOString().slice(0, 10), expirationDate: '', certifier: '', notes: '' });
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-semibold"
                    >
                      + Add Qualification
                    </button>
                  </div>

                  {/* Status summary tiles */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Total</div>
                      <div className="text-2xl font-bold text-gray-800">{summary.total}</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <div className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                        <span>Current</span>
                      </div>
                      <div className="text-2xl font-bold text-emerald-700">{summary.current}</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="text-[10px] uppercase tracking-wide text-amber-700 font-semibold inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-600" aria-hidden="true" />
                        <span>Expiring ≤60d</span>
                      </div>
                      <div className="text-2xl font-bold text-amber-700">{summary.expiring}</div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                      <div className="text-[10px] uppercase tracking-wide text-rose-700 font-semibold inline-flex items-center gap-1">
                        <Ban className="h-3 w-3 text-rose-700" aria-hidden="true" />
                        <span>Expired</span>
                      </div>
                      <div className="text-2xl font-bold text-rose-700">{summary.expired}</div>
                    </div>
                  </div>
                </div>

                {/* Qualifications list */}
                {supplierQuals.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400 italic">
                    No qualifications tracked yet. Add your first with the &ldquo;+ Add Qualification&rdquo; button above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...supplierQuals]
                      .sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime())
                      .map(q => {
                        const st = getQualificationStatus(q);
                        return (
                          <div
                            key={q.id}
                            className={`bg-white rounded-lg border-2 p-4 flex items-center justify-between flex-wrap gap-3 border-${st.color}-200`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-2xl">{DOC_TYPE_ICONS[q.docType]}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="font-bold text-gray-800">{q.supplierName}</span>
                                  <span className="text-xs text-gray-500">•</span>
                                  <span className="text-xs text-gray-700">{DOC_TYPE_LABELS[q.docType]}</span>
                                  {q.certifier && <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{q.certifier}</span>}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 flex-wrap">
                                  <span>Issued {new Date(q.issuedDate).toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>Expires {new Date(q.expirationDate).toLocaleDateString()}</span>
                                  {q.notes && <><span>•</span><span className="italic">{q.notes}</span></>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-[11px] font-semibold bg-${st.color}-100 text-${st.color}-800 border border-${st.color}-300`}>
                                {st.label}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingQualId(q.id);
                                  setQualForm(q);
                                }}
                                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete this qualification for ${q.supplierName}?`)) {
                                    setSupplierQuals(supplierQuals.filter(x => x.id !== q.id));
                                  }
                                }}
                                className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Add/Edit modal */}
                {editingQualId !== null && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditingQualId(null)}>
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        {editingQualId === 'new' ? '+ Add Qualification' : '✏️ Edit Qualification'}
                      </h3>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-700">Supplier Name *</label>
                          <input
                            type="text"
                            value={qualForm.supplierName || ''}
                            onChange={e => setQualForm({ ...qualForm, supplierName: e.target.value })}
                            placeholder="e.g., Cargill, Kerry Ingredients"
                            list="sourcing-supplier-list"
                            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                          />
                          <datalist id="sourcing-supplier-list">
                            {Array.from(new Set(INDUSTRIAL_DB.flatMap(i => i.suppliers || []))).slice(0, 50).map(s => (
                              <option key={s} value={s} />
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-700">Document Type *</label>
                          <select
                            value={qualForm.docType || 'locg'}
                            onChange={e => setQualForm({ ...qualForm, docType: e.target.value as SupplierDocType })}
                            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                          >
                            {(Object.entries(DOC_TYPE_LABELS) as [SupplierDocType, string][]).map(([val, label]) => (
                              <option key={val} value={val}>{DOC_TYPE_ICONS[val]} {label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-700">Issued Date *</label>
                            <input
                              type="date"
                              value={qualForm.issuedDate || ''}
                              onChange={e => setQualForm({ ...qualForm, issuedDate: e.target.value })}
                              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700">Expiration Date *</label>
                            <input
                              type="date"
                              value={qualForm.expirationDate || ''}
                              onChange={e => setQualForm({ ...qualForm, expirationDate: e.target.value })}
                              className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-700">Certifier / Issuing Body</label>
                          <input
                            type="text"
                            value={qualForm.certifier || ''}
                            onChange={e => setQualForm({ ...qualForm, certifier: e.target.value })}
                            placeholder="e.g., OU, Kof-K, USDA, NSF, SGS"
                            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-700">Notes</label>
                          <textarea
                            rows={2}
                            value={qualForm.notes || ''}
                            onChange={e => setQualForm({ ...qualForm, notes: e.target.value })}
                            placeholder="Contact person, renewal protocol, special conditions..."
                            className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-5">
                        <button
                          onClick={() => {
                            if (!qualForm.supplierName?.trim() || !qualForm.expirationDate || !qualForm.issuedDate) {
                              alert('Please fill in supplier name, issued date, and expiration date.');
                              return;
                            }
                            const payload: SupplierQualification = {
                              id: editingQualId === 'new' ? Date.now().toString() : editingQualId as string,
                              supplierName: qualForm.supplierName!.trim(),
                              docType: qualForm.docType!,
                              issuedDate: qualForm.issuedDate!,
                              expirationDate: qualForm.expirationDate!,
                              certifier: qualForm.certifier?.trim() || undefined,
                              notes: qualForm.notes?.trim() || undefined,
                            };
                            if (editingQualId === 'new') {
                              setSupplierQuals([...supplierQuals, payload]);
                            } else {
                              setSupplierQuals(supplierQuals.map(q => q.id === editingQualId ? payload : q));
                            }
                            setEditingQualId(null);
                          }}
                          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold"
                        >
                          💾 Save
                        </button>
                        <button
                          onClick={() => setEditingQualId(null)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* BATCH SHEET TAB */}
      {activeTab === 'batch' && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* ═══════════════════════════════════════════════════════════════════════
              PREVIEW banner — per Opus pressure-test 2026-05-25 Q4 (prominent +
              amber + same visual weight as UNDOCUMENTED allergen card). Schema
              and render skeleton are in active design; save backend (launch-
              blocker #4 — Supabase) has not landed, so no Batch Sheet captures
              persist across reloads. Banner stays sticky-top, amber, doesn't
              scroll away — same trust pattern as UNDOCUMENTED allergen card.
              ═══════════════════════════════════════════════════════════════════════ */}
          <div className="sticky top-0 z-20 -mt-8 mb-6 bg-amber-50 border-2 border-amber-400 rounded-b-xl px-4 py-3 shadow-sm print:hidden">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm">
                <span className="font-bold text-amber-900">PREVIEW — Batch Sheet design in active development.</span>
                <span className="text-amber-800"> Schema landed b00c23d 2026-05-25; save backend pending launch-blocker #4 (Supabase persistence). Captures will not persist across page reload until then. Execution Canvas template on the Build Base Sheet tab DOES persist (localStorage).</span>
              </div>
            </div>
          </div>
          {/* Controls (hidden on print) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 print:hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">🏭 Batch Sheet Generator</h2>
              <button
                onClick={() => window.print()}
                disabled={ingredients.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition text-sm font-medium"
              >
                🖨️ Print / Save as PDF
              </button>
            </div>
            {ingredients.length === 0 ? (
              <div className="text-gray-500 py-8 text-center">Go to the 🔬 Build Base Sheet tab and add some ingredients first.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Production Batch Size</label>
                  <div className="flex gap-1">
                    <input type="number" value={batchSize} onChange={(e) => setBatchSize(Math.max(0.1, parseFloat(e.target.value) || 10))}
                      className="w-full text-center border border-gray-300 rounded-lg px-2 py-2 text-base font-bold focus:outline-none focus:border-emerald-500" />
                    <select value={batchSizeUnit} onChange={(e) => setBatchSizeUnit(e.target.value)}
                      className="border border-gray-300 rounded-lg px-1 py-2 text-sm bg-white focus:outline-none">
                      {['kg', 'lb', 'L', 'g'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Batch Number</label>
                  <input type="text" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="e.g., 20260422-01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Production Date</label>
                  <input type="date" value={productionDate} onChange={(e) => setProductionDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Operator</label>
                  <input type="text" value={operator} onChange={(e) => setOperator(e.target.value)} placeholder="Operator initials"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
            )}
          </div>

          {/* Batch Sheet Document */}
          {ingredients.length > 0 && (() => {
            const targetBatchGrams = batchSize * (UNIT_TO_GRAMS[batchSizeUnit] || 1000);
            const scaleFactor = totalBatchGrams > 0 ? targetBatchGrams / totalBatchGrams : 1;
            return (
              <div className="bg-white border border-gray-200 rounded-xl p-8 print:p-0 print:border-0 print:rounded-none print:shadow-none">
                {/* Header */}
                <div className="border-b-2 border-gray-800 pb-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{formulationName || 'Untitled Formulation'}</h1>
                      <p className="text-gray-600 text-sm mt-1">{productType || 'Product type not set'}</p>
                    </div>
                    <div className="text-right text-sm">
                      <div><span className="text-gray-500">Batch #</span> <span className="font-bold">{batchNumber || '_______________'}</span></div>
                      <div><span className="text-gray-500">Date</span> <span className="font-bold">{productionDate}</span></div>
                      <div><span className="text-gray-500">Operator</span> <span className="font-bold">{operator || '_______________'}</span></div>
                      <div><span className="text-gray-500">Target Batch</span> <span className="font-bold">{batchSize} {batchSizeUnit} ({targetBatchGrams.toFixed(0)} g)</span></div>
                    </div>
                  </div>
                </div>

                {/* Production Cost block intentionally removed — cost lives on the Build Sheet
                    Unit Economics block (with formula-level confidence rollup). The Batch Sheet
                    is the production document; cost is a Build/procurement concern. */}

                {/* Target Specs — only formulator-tracked specs render. Toggle via the
                    "Specs to Track" checklist near Product Type on the Build tab. Auto-derived
                    metrics (A/M ratio, LAC%) appear when their inputs are tracked. */}
                <section className="mb-6">
                  <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide flex items-center justify-between">
                    <span>Target Specs</span>
                    <span className="text-[10px] text-gray-400 font-normal normal-case tracking-normal">{effectiveTrackedSpecs.length} tracked + auto-derived</span>
                  </h2>
                  {effectiveTrackedSpecs.length === 0 && !showAceticMoistureRatio && !showLowAcidComponentPct ? (
                    <p className="text-xs text-gray-500 italic">No specs tracked. Open the &ldquo;Specs to Track&rdquo; checklist on the Build tab to select which specs should appear here.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      {trackedSet.has('pH') && (
                        <div><span className="text-gray-500">pH</span><br /><span className="font-bold text-lg">{specs.pH > 0 ? formatRangedValue('pH', specs.pH, specs.confidence.pH, 2).text : '—'}</span></div>
                      )}
                      {trackedSet.has('brix') && (
                        <div><span className="text-gray-500">Brix</span><br /><span className="font-bold text-lg">{specs.brix > 0 ? formatRangedValue('brix', specs.brix, specs.confidence.brix, 1, '°').text : '—'}</span></div>
                      )}
                      {trackedSet.has('moisture') && (
                        <div><span className="text-gray-500">Moisture</span><br /><span className="font-bold text-lg">{specs.moisture > 0 ? formatRangedValue('moisture', specs.moisture, specs.confidence.moisture, 1, '%').text : '—'}</span></div>
                      )}
                      {trackedSet.has('aw') && (
                        <div><span className="text-gray-500">a_w</span><br /><span className="font-bold text-lg">{specs.aw > 0 ? formatRangedValue('aw', specs.aw, specs.confidence.aw, 3).text : '—'}</span></div>
                      )}
                      {trackedSet.has('bostwick') && (
                        <div><span className="text-gray-500">Bostwick</span><br /><span className="font-bold text-lg">{specs.bostwickCmPer30s.toFixed(1)} cm/30s</span></div>
                      )}
                      {trackedSet.has('brookfield') && (
                        <div><span className="text-gray-500">Brookfield est.</span><br /><span className="font-bold text-lg">{specs.brookfieldCp.toLocaleString()} cP</span></div>
                      )}
                      {trackedSet.has('aceticAcid') && (
                        <div><span className="text-gray-500">Acetic acid</span><br /><span className="font-bold text-lg">{specs.aceticAcid > 0 ? formatRangedValue('aceticAcid', specs.aceticAcid, specs.confidence.aceticAcid, 2, '%').text : '—'}</span></div>
                      )}
                      {showAceticMoistureRatio && (
                        <div><span className="text-gray-500">A/M ratio</span><br /><span className="font-bold text-lg">{specs.aceticMoistureRatio > 0 ? specs.aceticMoistureRatio.toFixed(2) + '%' : '—'}</span></div>
                      )}
                      {showLowAcidComponentPct && (
                        // Round 8 Item 2: 2-decimal LAC precision (matches Spec Analysis + threshold bar).
                        <div><span className="text-gray-500">LAC%</span><br /><span className="font-bold text-lg">{specs.lowAcidComponentPct.toFixed(2)}%</span></div>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 italic mt-2">{specs.regulatoryClass}</p>
                  {processTemplate.targetSpecs && processTemplate.targetSpecs.length > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <span className="font-semibold">Critical targets for {productType}: </span>
                      {processTemplate.targetSpecs.map(t => `${t.name}: ${t.value}`).join(' • ')}
                    </div>
                  )}
                </section>

                {/* Ingredients scaled to batch */}
                <section className="mb-6">
                  <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">Ingredients (scaled to {batchSize} {batchSizeUnit})</h2>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-700 text-left">
                        <th className="py-2 pr-2 w-6">#</th>
                        <th className="py-2 pr-2">Ingredient</th>
                        <th className="py-2 pr-2">Supplier</th>
                        <th className="py-2 pr-2 text-right">% wt</th>
                        <th className="py-2 pr-2 text-right">Target</th>
                        <th className="py-2 pr-2 text-right">Actual</th>
                        <th className="py-2 pr-2">Lot #</th>
                        <th className="py-2 text-center">COA ✓</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients.map((ing, i) => {
                        const baseGrams = ing.qty * (UNIT_TO_GRAMS[ing.unit] || 1);
                        const scaledGrams = baseGrams * scaleFactor;
                        const weightPct = totalBatchGrams > 0 ? (baseGrams / totalBatchGrams) * 100 : 0;
                        // Round 11 Phase 3 (2026-05-17): display per-ingredient
                        // scaled mass in the operator's chosen batchSizeUnit
                        // (kg/lb/g/L per the dropdown at line 9038). Pre-fix
                        // behavior hard-coded kg/g auto-switch, ignoring the
                        // operator unit choice — produced "1000 lb batch shows
                        // 453.592 kg per ingredient" UX failure for lb-mode
                        // operators.
                        const batchUnitFactor = UNIT_TO_GRAMS[batchSizeUnit] || 1;
                        const scaledInBatchUnit = scaledGrams / batchUnitFactor;
                        return (
                          <tr key={i} className="border-b border-gray-200">
                            <td className="py-2 pr-2 align-top">{i + 1}</td>
                            <td className="py-2 pr-2 align-top">
                              <div className="font-medium">{ing.name}</div>
                              {ing.subIngredients && ing.subIngredients.length > 0 && (
                                <div className="text-gray-400 text-[10px]">{ing.subIngredients.join(', ')}</div>
                              )}
                            </td>
                            <td className="py-2 pr-2 align-top">{ing.supplier || '—'}</td>
                            <td className="py-2 pr-2 text-right align-top font-mono">{weightPct.toFixed(2)}%</td>
                            <td className="py-2 pr-2 text-right align-top font-mono">
                              {scaledInBatchUnit.toFixed(3)} {batchSizeUnit}
                            </td>
                            <td className="py-2 pr-2 align-top border-l border-r border-gray-300 min-w-[80px]"></td>
                            <td className="py-2 pr-2 align-top border-r border-gray-300 min-w-[100px]"></td>
                            <td className="py-2 text-center align-top">☐</td>
                          </tr>
                        );
                      })}
                      <tr className="border-b-2 border-gray-700 font-bold">
                        <td></td>
                        <td className="py-2">TOTAL</td>
                        <td></td>
                        <td className="py-2 pr-2 text-right font-mono">100.00%</td>
                        <td className="py-2 pr-2 text-right font-mono">
                          {/* Round 11 Phase 3: TOTAL row honors batchSizeUnit
                              (matches operator choice instead of hard-coded kg). */}
                          {(targetBatchGrams / (UNIT_TO_GRAMS[batchSizeUnit] || 1)).toFixed(3)} {batchSizeUnit}
                        </td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                {/* Allergens — Base Sheet allergens inherit to Batch Sheet per
                    [[platform-scope-vs-facility-food-safety-plan]] 2026-05-25 (warning
                    generated at Base Sheet → follows to Batch Sheet; single source of
                    truth). Cleaning verification capture is the per-batch action; full
                    structured AllergenCleaningRecord (per b00c23d schema extension)
                    wires when save backend lands. */}
                {allergenStatement.length > 0 && (
                  <section className="mb-6">
                    <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                      <span>Allergens — Cleaning Verification Required</span>
                    </h2>
                    <p className="text-sm font-bold text-red-700">Contains: {allergenStatement.map(m => m.species ?? m.category).join(', ')}</p>
                    <p className="text-xs text-amber-700 italic mt-1">
                      ⚠ Species naming pending FALCPA wire-up (launch-blocker #1B). Current display uses legacy allergen detection — when 1B wire-up lands, Tree Nuts will display as the specific species (e.g., &ldquo;Coconut&rdquo; not &ldquo;Tree Nuts&rdquo;).
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      Cross-contact risk if equipment was previously used for products not declaring these allergens. Cleaning + verification required per FDA 21 CFR 117.135 + 117.140 (Preventive Controls — allergen). Document below:
                    </p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-gray-500 mb-1">Cleaning method</label>
                        <input type="text" placeholder="e.g., Manual scrub + foam cleaner per SOP-005" className="w-full border border-gray-300 rounded px-2 py-1.5" />
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Cleaning performed by / time</label>
                        <input type="text" placeholder="Initials  Time _______" className="w-full border border-gray-300 rounded px-2 py-1.5" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-gray-500 mb-1">Verification methods used (check all that apply)</label>
                        <div className="flex flex-wrap gap-3 mt-1">
                          <label className="flex items-center gap-1"><input type="checkbox" /> Visual</label>
                          <label className="flex items-center gap-1"><input type="checkbox" /> ATP swab</label>
                          <label className="flex items-center gap-1"><input type="checkbox" /> Allergen test kit</label>
                          <label className="flex items-center gap-1"><input type="checkbox" /> Protein swab</label>
                          <label className="flex items-center gap-1"><input type="checkbox" /> Other</label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Verification readings / results</label>
                        <input type="text" placeholder="e.g., ATP: 12 RLU (pass &lt;30); ELISA: negative" className="w-full border border-gray-300 rounded px-2 py-1.5" />
                      </div>
                      <div>
                        <label className="block text-gray-500 mb-1">Result · Verified by · Time</label>
                        <div className="flex gap-1.5 items-center">
                          <select className="border border-gray-300 rounded px-1.5 py-1.5 text-xs">
                            <option>PASS</option><option>FAIL</option><option>Re-test</option>
                          </select>
                          <input type="text" placeholder="Initials  Time" className="flex-1 border border-gray-300 rounded px-2 py-1.5" />
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Harm-Critical Ingredient Verification — per b00c23d schema extension
                    + [[platform-scope-vs-facility-food-safety-plan]] doctrine. Auto-
                    rendered placeholder for now; full per-ingredient render wires when
                    catalog harm-critical flagging mechanism lands. Captures FDA 21 CFR
                    117.130 two-person verification standard for harm-critical
                    ingredients (preservatives with regulatory caps, high-potency
                    micronutrients, pH-critical acidulants, cure ingredients). */}
                <section className="mb-6">
                  <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                    <span>Harm-Critical Ingredient Verification</span>
                  </h2>
                  <div className="text-xs bg-gray-50 border border-gray-200 rounded p-3 italic text-gray-600">
                    Per-ingredient verified-weight capture for harm-critical ingredients (preservatives with regulatory caps like Na benzoate ≤ 0.1% per 21 CFR 184.1733, K sorbate ≤ 0.1% per 182.3640; high-potency micronutrients; pH-critical acidulants for acidified foods; cure ingredients). Two-person verification required per FDA 21 CFR 117.130.
                    <br /><br />
                    <span className="text-amber-700">⚠ PREVIEW — Catalog harm-critical flagging mechanism not yet wired. When operator adds a harm-critical-flagged ingredient (e.g., Sodium Benzoate, Potassium Sorbate, Sodium Nitrite), a per-ingredient capture row will auto-render here with target weight (from pinned Base Sheet) + actual weight + added-by/verified-by signoff slots.</span>
                  </div>
                </section>

                {/* Packaging */}
                {(selectedPackaging || selectedClosure) && (
                  <section className="mb-6">
                    <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">Packaging</h2>
                    <div className="text-sm space-y-1">
                      {selectedPackaging && <div><span className="text-gray-500">Container:</span> <span className="font-medium">{selectedPackaging.name}</span> — {selectedPackaging.suppliers[0]}</div>}
                      {selectedClosure && <div><span className="text-gray-500">Closure:</span> <span className="font-medium">{selectedClosure.name}</span> — {selectedClosure.suppliers[0]}</div>}
                      <div><span className="text-gray-500">Fill size:</span> <span className="font-medium">{packageSize} {packageUnit}</span> • <span className="text-gray-500">Units produced (target):</span> <span className="font-medium">{packageSize > 0 ? Math.floor(targetBatchGrams / packageSizeInGrams) : '—'}</span></div>
                    </div>
                  </section>
                )}

                {/* Suggested HACCP Category */}
                {suggestedHaccp && (
                  <section className="mb-6">
                    <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">🛡️ HACCP Category</h2>
                    <div className="text-sm">
                      <div className="font-bold">{suggestedHaccp.name}</div>
                      <div className="text-xs text-gray-600">{suggestedHaccp.framework}</div>
                      <ul className="text-xs mt-2 space-y-1">
                        {suggestedHaccp.ccps.map(ccp => (
                          <li key={ccp.number}><span className="font-semibold">CCP {ccp.number} ({ccp.name}):</span> {ccp.criticalLimit}</li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

                {/* Execution Record — operator-authored procedures + QA + signoff
                    conventions inherited from Base Sheet's batchSheetTemplate. Per
                    operator design 2026-05-25 "platform is the canvas, operator
                    is the author" — plain text, operator's own format. When save
                    backend lands, this textarea inherits the locked Base Sheet's
                    batchSheetTemplate at spawn time + operator edits per-batch
                    (filling in times, initials, deviations, observations). For
                    this PREVIEW commit: shows the current Build Base Sheet's
                    Execution Canvas content (localStorage-persisted). */}
                {batchSheetTemplate.trim().length > 0 && (
                  <section className="mb-6">
                    <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide flex items-center justify-between">
                      <span>Execution Record</span>
                      <span className="text-[10px] text-amber-600 font-normal normal-case tracking-normal">PREVIEW · inherited from Execution Canvas</span>
                    </h2>
                    <pre className="text-xs font-mono whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded p-3 leading-relaxed">{batchSheetTemplate}</pre>
                    <p className="text-[10px] text-gray-500 italic mt-1">
                      Inherited from Build Base Sheet → Execution Canvas. When save backend lands (launch-blocker #4), Batch Sheets will inherit at spawn time from the locked Base Sheet version and operator will edit a per-batch copy for production capture.
                    </p>
                  </section>
                )}

                {/* Process Instructions — TEMPLATE-DRIVEN (legacy, kept during
                    PREVIEW transition). Per operator design 2026-05-25, this
                    section will be replaced by the operator-authored Execution
                    Record (above) once schema is fully wired. Current behavior:
                    renders hardcoded processTemplate.steps per product type. */}
                <section className="mb-6">
                  <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide flex items-center justify-between">
                    <span>Process Instructions <span className="text-[10px] text-gray-400 font-normal normal-case tracking-normal">(legacy template — will be replaced by Execution Record)</span></span>
                  </h2>
                  <ol className="list-decimal ml-5 space-y-1.5 text-sm">
                    {processTemplate.steps.map((step, i) => (
                      <li key={i} className="text-gray-800">{step}</li>
                    ))}
                  </ol>
                </section>

                {/* QA Checkpoints */}
                <section className="mb-6">
                  <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">QA Checkpoints</h2>
                  <ul className="space-y-1.5 text-sm">
                    {processTemplate.qaCheckpoints.map((qa, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-mono">☐</span>
                        <span>{qa}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Signatures */}
                <section className="mt-8 pt-6 border-t-2 border-gray-800">
                  <h2 className="text-base font-bold text-gray-800 mb-4 uppercase tracking-wide">Sign-Off</h2>
                  <div className="grid grid-cols-3 gap-6 text-xs">
                    <div>
                      <div className="border-b border-gray-400 h-12"></div>
                      <p className="mt-1 text-gray-500">Operator</p>
                      <p className="text-gray-400">Date / Time</p>
                    </div>
                    <div>
                      <div className="border-b border-gray-400 h-12"></div>
                      <p className="mt-1 text-gray-500">QA</p>
                      <p className="text-gray-400">Date / Time</p>
                    </div>
                    <div>
                      <div className="border-b border-gray-400 h-12"></div>
                      <p className="mt-1 text-gray-500">Supervisor / Release</p>
                      <p className="text-gray-400">Date / Time</p>
                    </div>
                  </div>
                </section>

                <div className="mt-6 text-[10px] text-gray-400 print:block">
                  Generated by Formulation Wizard on {new Date().toLocaleString()}. Specs are formulation estimates — verify in lab prior to release.
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* FILING TAB — Scheduled Process draft for Process Authority review */}
      {activeTab === 'filing' && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header and determination */}
          <div className={`rounded-xl border-2 p-6 mb-6 print:hidden ${filingReq.urgency === 'critical' ? 'bg-red-50 border-red-300' : filingReq.urgency === 'recommended' ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h2 className="text-2xl font-bold text-gray-800">📋 Scheduled Process Filing Draft</h2>
              <button
                onClick={() => window.print()}
                disabled={ingredients.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition text-sm font-medium"
              >
                🖨️ Print / Save as PDF
              </button>
            </div>
            {ingredients.length === 0 ? (
              <p className="text-gray-600">Add ingredients in the 🔬 Build tab first — the filing will auto-populate from your formulation.</p>
            ) : (
              <>
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-1">Filing Determination</p>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`text-2xl font-bold ${filingReq.required ? 'text-red-700' : 'text-emerald-700'}`}>
                      {filingReq.required ? 'Filing REQUIRED' : 'No FDA filing required'}
                    </span>
                    <span className="text-sm font-mono text-gray-700">→ {filingReq.formName}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{filingReq.reason}</p>
                  {filingReq.processAuthorityRequired && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-300 rounded-lg">
                      <p className="text-sm text-red-800 font-semibold inline-flex items-start gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>Process Authority review &amp; letter REQUIRED before first commercial batch.</span>
                      </p>
                      <p className="text-xs text-red-700 mt-1.5">
                        This classification is computed from your ingredient data and is <strong>advisory</strong>. The actual Scheduled Process filing, critical factors, and thermal process parameters MUST be determined by a qualified Process Authority per 21 CFR 113.83 / 114.83.
                      </p>
                      <button
                        onClick={() => setActiveTab('authorities')}
                        className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-red-700 text-white rounded text-xs font-semibold hover:bg-red-800 transition"
                      >
                        ⚖️ Find a Process Authority →
                      </button>
                      <button
                        onClick={() => { setActiveTab('services'); setServiceRequestType('scaleup'); }}
                        className="mt-2 ml-2 inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 transition"
                      >
                        🤝 Request Scale-Up Consultation →
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">Citations:</span> {filingReq.citations.join(' • ')}
                </div>
              </>
            )}
          </div>

          {/* Q&A form — only show if ingredients exist */}
          {ingredients.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 print:p-0 print:border-0 print:rounded-none print:shadow-none">
              {/* Printable header */}
              <div className="border-b-2 border-gray-800 pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Scheduled Process Information Sheet</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Draft for submission to a licensed Process Authority for review and issuance of a Scheduled Process letter.
                  This draft is NOT a substitute for the Process Authority&apos;s own evaluation.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-semibold">Form:</span> {filingReq.formName}
                  {' • '}
                  <span className="font-semibold">Generated:</span> {new Date().toLocaleDateString()}
                </p>
              </div>

              {/* Section 1: Product & classification (auto-populated) */}
              <section className="mb-6">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">1. Product Identification</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <FilingField label="Product common name" value={formulationName || '—'} readOnly />
                  <FilingField label="Product type" value={productType || '—'} readOnly />
                  <FilingField label="Mode" value={mc.name} readOnly />
                  <FilingField label="HACCP category" value={suggestedHaccp?.name || '—'} readOnly />
                </div>
              </section>

              {/* Section 2: Establishment */}
              <section className="mb-6">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">2. Establishment</h2>
                <p className="text-xs text-gray-500 mb-2">Food Canning Establishment (FCE) registration on Form FDA 2541 is a prerequisite. Apply at <span className="font-mono">fda.gov/food/acidified-low-acid-canned-foods-lacf</span>.</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <FilingInput label="Establishment name" value={filing.establishmentName} onChange={v => setFiling({ ...filing, establishmentName: v })} />
                  <FilingInput label="FCE number" value={filing.fceNumber} onChange={v => setFiling({ ...filing, fceNumber: v })} placeholder="e.g., 12345" />
                  <FilingInput label="Address" value={filing.establishmentAddress} onChange={v => setFiling({ ...filing, establishmentAddress: v })} className="col-span-2" />
                  <FilingInput label="Contact name" value={filing.contactName} onChange={v => setFiling({ ...filing, contactName: v })} />
                  <FilingInput label="Contact email" value={filing.contactEmail} onChange={v => setFiling({ ...filing, contactEmail: v })} />
                </div>
              </section>

              {/* Section 3: Process Authority */}
              <section className="mb-6">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">3. Process Authority</h2>
                <p className="text-xs text-gray-500 mb-2">A Process Authority must review and sign off on your Scheduled Process. Common examples: NFPA-affiliated experts, certified consultants with BPCS credentials, university food-science programs.</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <FilingInput label="Process Authority name" value={filing.processAuthorityName} onChange={v => setFiling({ ...filing, processAuthorityName: v })} />
                  <FilingInput label="Affiliation / firm" value={filing.processAuthorityOrg} onChange={v => setFiling({ ...filing, processAuthorityOrg: v })} />
                  <FilingInput label="PA letter date" value={filing.processAuthorityDate} onChange={v => setFiling({ ...filing, processAuthorityDate: v })} placeholder="YYYY-MM-DD" />
                </div>
              </section>

              {/* Section 4: Container (auto from packaging where possible) */}
              <section className="mb-6">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">4. Container &amp; Closure</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <FilingField label="Container type" value={selectedPackaging?.name || '—'} readOnly />
                  <FilingField label="Material" value={selectedPackaging?.material || '—'} readOnly />
                  <FilingField label="Neck finish" value={selectedPackaging?.neckFinish || '—'} readOnly />
                  <FilingField label="Capacity" value={selectedPackaging?.capacity ? `${selectedPackaging.capacity.value} ${selectedPackaging.capacity.unit}` : '—'} readOnly />
                  <FilingField label="Closure" value={selectedClosure?.name || '—'} readOnly />
                  <FilingField label="Net fill weight" value={`${packageSize} ${packageUnit}`} readOnly />
                  <FilingInput label="Headspace target" value={filing.containerHeadspace} onChange={v => setFiling({ ...filing, containerHeadspace: v })} placeholder={'e.g., 1/4"'} />
                  <FilingInput label="Vacuum target" value={filing.containerVacuum} onChange={v => setFiling({ ...filing, containerVacuum: v })} placeholder="e.g., ≥ 10 in Hg" />
                </div>
              </section>

              {/* Section 5: Process method & parameters */}
              <section className="mb-6">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">5. Process Method &amp; Parameters</h2>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Process Method</label>
                  <select
                    value={filing.processMethod}
                    onChange={e => setFiling({ ...filing, processMethod: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500 print:border-0 print:bg-transparent"
                  >
                    {PROCESS_METHODS.map(m => (
                      <option key={m.id} value={m.id}>{m.label} — {m.notes}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <FilingInput label="Initial temperature (IT) of product" value={filing.fillInitialTemp} onChange={v => setFiling({ ...filing, fillInitialTemp: v })} placeholder="°F" />
                  <FilingInput label="Target fill / process temperature" value={filing.fillTargetTemp} onChange={v => setFiling({ ...filing, fillTargetTemp: v })} placeholder="e.g., ≥ 180°F" />
                  <FilingInput label="Hold time at temperature" value={filing.holdTime} onChange={v => setFiling({ ...filing, holdTime: v })} placeholder="minutes or seconds" />
                  {(filing.processMethod === 'still-retort' || filing.processMethod === 'rotary-retort' || filing.processMethod === 'hydrostat') && (
                    <>
                      <FilingInput label="Retort process temp" value={filing.retortProcessTemp} onChange={v => setFiling({ ...filing, retortProcessTemp: v })} placeholder="e.g., 250°F" />
                      <FilingInput label="Retort process time" value={filing.retortProcessTime} onChange={v => setFiling({ ...filing, retortProcessTime: v })} placeholder="minutes" />
                      <FilingInput label="Cooling water chlorine (ppm)" value={filing.coolWaterChlorine} onChange={v => setFiling({ ...filing, coolWaterChlorine: v })} placeholder="≥ 1.0" />
                    </>
                  )}
                </div>
              </section>

              {/* Section 6: Critical Factors (auto from specs) */}
              <section className="mb-6">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">6. Critical Factors (estimated from formulation)</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <FilingField label="Estimated pH" value={specs.pH > 0 ? specs.pH.toFixed(2) : '—'} readOnly />
                  <FilingInput label="Target equilibrium pH" value={filing.targetPh} onChange={v => setFiling({ ...filing, targetPh: v })} placeholder="e.g., ≤ 4.2" />
                  <FilingField label="Estimated a_w" value={specs.aw > 0 ? specs.aw.toFixed(3) : '—'} readOnly />
                  <FilingField label="Estimated Brix" value={specs.brix > 0 ? `${specs.brix.toFixed(1)}°` : '—'} readOnly />
                  <FilingField label="Estimated moisture %" value={`${specs.moisture.toFixed(1)}%`} readOnly />
                  <FilingField label="Estimated Bostwick" value={`${specs.bostwickCmPer30s.toFixed(1)} cm/30s`} readOnly />
                  <FilingField label="Acetic acid %" value={specs.aceticAcid > 0 ? `${specs.aceticAcid.toFixed(2)}%` : '—'} readOnly />
                  <FilingField label="Acetic / moisture ratio" value={specs.aceticMoistureRatio > 0 ? `${specs.aceticMoistureRatio.toFixed(2)}%` : '—'} readOnly />
                  <FilingInput label="Primary acidulant" value={filing.acidulantType} onChange={v => setFiling({ ...filing, acidulantType: v })} placeholder="e.g., Vinegar, Citric acid" />
                  <FilingInput label="Salt %" value={filing.saltPercent} onChange={v => setFiling({ ...filing, saltPercent: v })} placeholder="% of formulation" />
                  <FilingInput label="Equilibrium pH measurement day" value={filing.equilibriumPhDay} onChange={v => setFiling({ ...filing, equilibriumPhDay: v })} placeholder="typical = 10" />
                </div>
              </section>

              {/* Section 7: Ingredient statement */}
              <section className="mb-6">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">7. Formulation Summary</h2>
                <p className="text-xs text-gray-500 mb-2">Verbatim ingredient statement + batch composition (from formulation tool):</p>
                <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm mb-3">{ingredientStatement || '—'}</div>
                {allergenStatement.length > 0 && (
                  <p className="text-sm font-bold text-red-700">Contains: {allergenStatement.map(m => m.species ?? m.category).join(', ')}</p>
                )}
              </section>

              {/* Section 8: QA testing plan */}
              <section className="mb-6">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">8. Finished Product QA Plan</h2>
                <p className="text-xs text-gray-500 mb-2">Default tests for {suggestedHaccp?.name || 'this product'}. Add custom tests as needed.</p>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-600 text-left">
                      <th className="py-2 pr-2">Parameter</th>
                      <th className="py-2 pr-2">Target / Critical Limit</th>
                      <th className="py-2 pr-2">Method</th>
                      <th className="py-2 pr-2">Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedQaTests.map((t, i) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="py-1.5 pr-2 font-semibold">{t.parameter}</td>
                        <td className="py-1.5 pr-2">{t.target}</td>
                        <td className="py-1.5 pr-2">{t.method}</td>
                        <td className="py-1.5 pr-2">{t.frequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={() => setCustomQaTests([...customQaTests, { parameter: '', target: '', method: '', frequency: '' }])}
                  className="mt-3 text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium print:hidden"
                >
                  + Add custom QA test
                </button>
                {customQaTests.map((t, i) => (
                  <div key={i} className="mt-2 grid grid-cols-4 gap-2 print:hidden">
                    <input value={t.parameter} onChange={e => { const c = [...customQaTests]; c[i] = { ...c[i], parameter: e.target.value }; setCustomQaTests(c); }} placeholder="Parameter" className="border rounded px-2 py-1 text-xs" />
                    <input value={t.target} onChange={e => { const c = [...customQaTests]; c[i] = { ...c[i], target: e.target.value }; setCustomQaTests(c); }} placeholder="Target" className="border rounded px-2 py-1 text-xs" />
                    <input value={t.method} onChange={e => { const c = [...customQaTests]; c[i] = { ...c[i], method: e.target.value }; setCustomQaTests(c); }} placeholder="Method" className="border rounded px-2 py-1 text-xs" />
                    <input value={t.frequency} onChange={e => { const c = [...customQaTests]; c[i] = { ...c[i], frequency: e.target.value }; setCustomQaTests(c); }} placeholder="Frequency" className="border rounded px-2 py-1 text-xs" />
                  </div>
                ))}
              </section>

              {/* Section 9: HACCP summary */}
              {suggestedHaccp && (
                <section className="mb-6">
                  <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">9. HACCP CCPs (from Suggested Plan)</h2>
                  <ul className="text-sm space-y-1 list-disc ml-5">
                    {suggestedHaccp.ccps.map(c => (
                      <li key={c.number}><span className="font-semibold">CCP {c.number} ({c.name}):</span> {c.criticalLimit}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Section 10: Notes */}
              <section className="mb-6">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase tracking-wide">10. Additional Notes to Process Authority</h2>
                <textarea
                  value={filing.notes}
                  onChange={e => setFiling({ ...filing, notes: e.target.value })}
                  className="w-full h-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 print:border-0"
                  placeholder="Any product-specific considerations, target shelf life, distribution conditions, etc."
                />
              </section>

              {/* Signatures */}
              <section className="mt-8 pt-6 border-t-2 border-gray-800">
                <h2 className="text-base font-bold text-gray-800 mb-4 uppercase tracking-wide">Sign-Off</h2>
                <div className="grid grid-cols-3 gap-6 text-xs">
                  <div>
                    <div className="border-b border-gray-400 h-12"></div>
                    <p className="mt-1 text-gray-500">Establishment representative</p>
                    <p className="text-gray-400">Date</p>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 h-12"></div>
                    <p className="mt-1 text-gray-500">Process Authority</p>
                    <p className="text-gray-400">Date</p>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 h-12"></div>
                    <p className="mt-1 text-gray-500">Scheduled Process ID (assigned by FDA)</p>
                  </div>
                </div>
              </section>

              <div className="mt-6 text-[10px] text-gray-400 print:block">
                Generated by Formulation Wizard on {new Date().toLocaleString()}. This is a DRAFT to aid conversations with a licensed Process Authority — not a direct FDA filing. The Process Authority is responsible for validating the Scheduled Process and issuing the supporting letter.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PROCESS AUTHORITIES DIRECTORY TAB
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'authorities' && (
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">⚖️ Process Authority Directory</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-2xl">
                  Qualified Process Authorities recognized under 21 CFR 113.83 and 114.83. Any formula requiring a Scheduled Process filing <strong>must</strong> be reviewed by one of these (or equivalent) before commercial production.
                </p>
              </div>
              <div className="text-xs bg-amber-50 border border-amber-300 rounded-lg p-2 max-w-xs">
                <strong className="text-amber-800">Advisory listing.</strong>
                <span className="text-amber-900"> Verify current credentials and availability directly with each authority before engaging. Compiled from public records; not an endorsement.</span>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Search</label>
                <input
                  type="text"
                  value={paSearch}
                  onChange={e => setPaSearch(e.target.value)}
                  placeholder="Name, city, specialty..."
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">State</label>
                <select
                  value={paStateFilter}
                  onChange={e => setPaStateFilter(e.target.value)}
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                >
                  <option value="All">All states</option>
                  {getPAStates().map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Type</label>
                <select
                  value={paTypeFilter}
                  onChange={e => setPaTypeFilter(e.target.value as typeof paTypeFilter)}
                  className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                >
                  <option value="All">All types</option>
                  <option value="university">🎓 University Extension</option>
                  <option value="consulting">🏢 Consulting Firm</option>
                  <option value="bpcs">📚 BPCS Training</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => { setPaSearch(''); setPaStateFilter('All'); setPaTypeFilter('All'); }}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </div>

          {(() => {
            const filtered = PROCESS_AUTHORITIES.filter(pa => {
              if (paStateFilter !== 'All' && pa.state !== paStateFilter) return false;
              if (paTypeFilter !== 'All' && pa.type !== paTypeFilter) return false;
              if (paSearch) {
                const q = paSearch.toLowerCase();
                const matches = pa.name.toLowerCase().includes(q)
                  || (pa.city || '').toLowerCase().includes(q)
                  || pa.specialty.some(s => s.toLowerCase().includes(q))
                  || (pa.notes || '').toLowerCase().includes(q);
                if (!matches) return false;
              }
              return true;
            });
            return (
              <>
                <div className="mb-3 text-xs text-gray-500">{filtered.length} of {PROCESS_AUTHORITIES.length} authorities shown</div>
                <div className="grid gap-3">
                  {filtered.map((pa, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <h3 className="text-sm font-bold text-gray-800">{pa.name}</h3>
                            <span className="text-[10px] text-gray-500">{PA_TYPE_LABELS[pa.type]}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            📍 {pa.city ? `${pa.city}, ` : ''}{pa.state}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pa.specialty.map((s, j) => (
                              <span key={j} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px]">{s}</span>
                            ))}
                          </div>
                          {pa.notes && <p className="text-[11px] text-gray-600 italic mt-2">{pa.notes}</p>}
                        </div>
                        <div className="text-right text-xs space-y-1">
                          {pa.phone && <div className="text-gray-700 font-mono">{pa.phone}</div>}
                          {pa.email && <a href={`mailto:${pa.email}`} className="text-emerald-700 hover:underline block">{pa.email}</a>}
                          {pa.website && <a href={pa.website} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline block">🌐 Website</a>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}

          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
            <p className="leading-relaxed">
              <strong>Need help engaging a Process Authority?</strong> Formulation Wizard offers scale-up consulting services to bridge bench-top formulation and Process Authority review — including formula preparation, pre-submission review, and ongoing liaison through scheduled-process filing. See the 🤝 <button onClick={() => setActiveTab('services')} className="underline text-emerald-700 font-semibold">Services tab</button>.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SERVICES & CONSULTING TAB
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'services' && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl border border-emerald-200 p-8 mb-6">
            <div className="flex items-center gap-4 mb-3">
              <NautilusMark size={64} />
              <div>
                <h2 className="text-3xl font-semibold text-emerald-700 tracking-tight">Formulation Wizard Services</h2>
                <p className="text-sm text-gray-500 italic">R&amp;D, reformulation, and scale-up for food and beverage manufacturers.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed max-w-3xl mt-4">
              When you&apos;ve taken your product as far as the tool can take you, we can take it the rest of the way. Four hands-on services bridge the gap from bench formulation to retail shelf.
            </p>
          </div>

          {/* Service cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setServiceRequestType('bench')}
              className={`text-left bg-white rounded-xl border-2 p-5 hover:shadow-lg transition ${serviceRequestType === 'bench' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-emerald-400'}`}
            >
              <div className="text-3xl mb-2">🧪</div>
              <h3 className="font-bold text-gray-800 mb-1">Bench-Top Sample Development</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                We produce and ship bench-top samples to your team — real product, your formula, made to your target specs. Taste, adjust, iterate before committing to a production run. Typical 1–3 week turnaround.
              </p>
            </button>

            <button
              onClick={() => setServiceRequestType('reform')}
              className={`text-left bg-white rounded-xl border-2 p-5 hover:shadow-lg transition ${serviceRequestType === 'reform' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-emerald-400'}`}
            >
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-bold text-gray-800 mb-1">Reformulation to Flavor Expectation</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                You know what it should taste like. We&apos;ll reformulate to match. Whether you&apos;re matching a benchmark competitor, bringing a family recipe to scale, or swapping ingredients for cost, clean-label, or regulatory reasons — we get the flavor profile right.
              </p>
            </button>

            <button
              onClick={() => setServiceRequestType('scaleup')}
              className={`text-left bg-white rounded-xl border-2 p-5 hover:shadow-lg transition ${serviceRequestType === 'scaleup' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-emerald-400'}`}
            >
              <div className="text-3xl mb-2">📈</div>
              <h3 className="font-bold text-gray-800 mb-1">Scale-Up Consulting</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Bench to pilot to plant isn&apos;t linear. Mixing times change, heat transfer shifts, fermentation kinetics behave differently. We manage the scale-up, including Process Authority liaison, HACCP plan development, and supplier qualification — so the formula that works at 5 kg still works at 5 tons.
              </p>
            </button>

            {SHOW_COPACKER_SERVICE && (
              <button
                onClick={() => setServiceRequestType('copacker')}
                className={`text-left bg-white rounded-xl border-2 p-5 hover:shadow-lg transition ${serviceRequestType === 'copacker' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-emerald-400'}`}
              >
                <div className="text-3xl mb-2">🏭</div>
                <h3 className="font-bold text-gray-800 mb-1">Exclusive Co-Packer Placement <span className="text-[10px] font-normal text-emerald-600">F&amp;B only</span></h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We place your product with a vetted F&amp;B co-packer matched to your volume, certification requirements, and geography. Exclusive service — we know the co-packer network personally and advocate for your build before you sign a production contract.
                </p>
              </button>
            )}
          </div>

          {/* Request intake form */}
          {serviceRequestType && (() => {
            const serviceTitle =
              serviceRequestType === 'bench' ? 'Request Bench-Top Samples'
              : serviceRequestType === 'reform' ? 'Request Reformulation'
              : serviceRequestType === 'scaleup' ? 'Request Scale-Up Consultation'
              : 'Request Co-Packer Placement';

            const buildEmailBody = () => {
              const formulaLines = ingredients.length > 0
                ? ingredients.map(i => `  - ${i.name}: ${i.qty}${i.unit}`).join('\n')
                : '  (no formula entered yet)';
              const specsLine = specs.pH > 0
                ? `  • pH: ${specs.pH.toFixed(2)} • aw: ${specs.aw.toFixed(3)} • Classification: ${specs.productClassification}`
                : '  (specs not yet computed)';
              return `Service: ${serviceTitle}
Client: ${serviceClientName}
Company: ${serviceClientCompany}
Email: ${serviceClientEmail}

=== FORMULATION CONTEXT ===
Name: ${formulationName || '(unnamed)'}
Mode: ${mc.name}
Product Type: ${productType || '(not set)'}
Serving Size: ${servingSize} ${servingUnit}
Package Size: ${packageSize} ${packageUnit}

=== INGREDIENTS (${ingredients.length}) ===
${formulaLines}

=== SPECS ===
${specsLine}

=== NOTES FROM CLIENT ===
${serviceNotes || '(none)'}
`;
            };

            const handleSubmit = () => {
              if (!serviceClientName.trim() || !serviceClientEmail.trim()) {
                alert('Please enter at least your name and email.');
                return;
              }
              const subject = encodeURIComponent(`[${serviceTitle}] ${formulationName || 'Untitled'} — ${serviceClientCompany || serviceClientName}`);
              const body = encodeURIComponent(buildEmailBody());
              window.location.href = `mailto:formulationwizard@gmail.com?subject=${subject}&body=${body}`;
            };

            return (
              <div className="bg-white rounded-xl border-2 border-emerald-300 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">{serviceTitle}</h3>
                  <button onClick={() => setServiceRequestType('')} className="text-xs text-gray-500 hover:text-gray-700">✕ Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Your Name *</label>
                    <input type="text" value={serviceClientName} onChange={e => setServiceClientName(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Email *</label>
                    <input type="email" value={serviceClientEmail} onChange={e => setServiceClientEmail(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-700">Company</label>
                    <input type="text" value={serviceClientCompany} onChange={e => setServiceClientCompany(e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-gray-700">Notes / specific requests</label>
                    <textarea rows={4} value={serviceNotes} onChange={e => setServiceNotes(e.target.value)}
                      placeholder={serviceRequestType === 'bench' ? 'Quantity of samples needed, flavor profile targets, shipping address preferences...' :
                                   serviceRequestType === 'reform' ? 'What are you matching? Any specific ingredient constraints? Allergen requirements?' :
                                   serviceRequestType === 'scaleup' ? 'Target batch size, timeline, current pilot status, any regulatory blocks...' :
                                   'Volume estimate, target market geography, required certifications, timeline...'}
                      className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-[11px] text-gray-600 mb-2">
                    <strong>The following formula context will be sent with your request:</strong>
                  </p>
                  <ul className="text-[11px] text-gray-700 space-y-0.5">
                    <li>• Name: {formulationName || <em className="text-gray-400">(unnamed)</em>}</li>
                    <li>• Mode: {mc.name}</li>
                    <li>• {ingredients.length} ingredients</li>
                    <li>• Specs: pH {specs.pH > 0 ? specs.pH.toFixed(2) : '—'}, aw {specs.aw > 0 ? specs.aw.toFixed(3) : '—'}, classification {specs.productClassification}</li>
                  </ul>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                >
                  ✉️ Send Request to Formulation Wizard
                </button>
                <p className="text-[10px] text-gray-500 italic mt-2 text-center">
                  This opens your default email client with a pre-filled draft. Review and send.
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PERSISTENT FOOTER DISCLAIMER (on every tab)
          ══════════════════════════════════════════════════════════════════ */}
      {/* Footer text is mode-aware per Round 11 Phase 3 Workstream A
          footer inspection. Supplement mode: "qualified regulatory
          reviewer" (segment-neutral; accurate for DSHEA-qualified
          regulatory consultants). F&B mode: "Process Authority"
          (F&B-canonical per 21 CFR 113.83 / 114.83). Both link to
          the shared Process Authorities tab. */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 text-gray-300 text-[10px] py-2 px-4 text-center z-40 print:hidden backdrop-blur-sm">
        <span className="opacity-80 inline-flex items-center gap-1.5 flex-wrap justify-center">
          <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            Advisory tool only — not legal, regulatory, or scientific advice.
            {entryState?.mode === 'supplements' ? (
              <>
                {' '}Harm-critical floor checks require verification by a qualified
                <button onClick={() => setActiveTab('authorities')} className="underline mx-1 hover:text-emerald-300 font-semibold">regulatory reviewer</button>
                before commercial production.
              </>
            ) : (
              <>
                {' '}All regulatory classifications and filing indicators require verification by a qualified
                <button onClick={() => setActiveTab('authorities')} className="underline mx-1 hover:text-emerald-300 font-semibold">Process Authority</button>
                before commercial production.
              </>
            )}
            <button onClick={() => { revokeTosForCurrentMode(); }} className="underline ml-2 hover:text-emerald-300">Review Terms</button>
          </span>
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Small form field helpers for the Filing tab
// ============================================================
function FilingField(props: { label: string; value: string; readOnly?: boolean; className?: string }) {
  return (
    <div className={props.className || ''}>
      <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">{props.label}</label>
      <div className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-800 print:border-0 print:bg-transparent print:px-0">
        {props.value || '—'}
      </div>
    </div>
  );
}

function FilingInput(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={props.className || ''}>
      <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">{props.label}</label>
      <input
        type="text"
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 print:border-0 print:border-b print:rounded-none"
      />
    </div>
  );
}

// ============================================================
// Small presentational helper components
// ============================================================
function SpecTile(props: {
  label: string;
  value: string;
  hint: ReactNode;
  color: 'emerald' | 'amber' | 'red' | 'gray';
  /** Optional Class 1a confidence indicator. ConfidencePill returns null only
   *  for 'measured' / undefined; renders amber for 'estimated'/'inferred',
   *  stone for 'calculated', neutral-gray for 'unknown' (Round 8 Item 3). */
  confidence?: Confidence;
}) {
  const bgMap = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };
  return (
    <div className={`rounded-lg border p-3 ${bgMap[props.color]}`}>
      <div className="flex items-center justify-between mb-1 gap-1">
        <p className="text-[10px] uppercase tracking-wide text-gray-500">{props.label}</p>
        <ConfidencePill conf={props.confidence} size="xs" />
      </div>
      <p className="text-xl font-bold">{props.value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{props.hint}</p>
    </div>
  );
}
